\set ON_ERROR_STOP on
BEGIN;
-- Everything below is rolled back, including test grants and redemptions.
CREATE TEMP TABLE benefit_test_context AS
SELECT id AS user_id FROM auth.users WHERE lower(email)='hola@somoskuper.com';
SELECT set_config('request.jwt.claim.sub',user_id::text,true) FROM benefit_test_context;
DO $$
DECLARE actor uuid; stranger uuid; campaign uuid; coupon uuid; again uuid; expiry_campaign uuid; expiry_coupon uuid; result jsonb; reviews_user uuid; reviews_event uuid; rule_campaign uuid; participation_event uuid;
BEGIN
  SELECT user_id INTO STRICT actor FROM benefit_test_context;
  SELECT id INTO STRICT stranger FROM auth.users WHERE id<>actor LIMIT 1;
  IF has_function_privilege('authenticated','public.benefit_grant_coupon(uuid,uuid,text,uuid)','EXECUTE') THEN RAISE EXCEPTION 'Authenticated users can self-grant'; END IF;
  IF has_function_privilege('anon','public.athlete_my_coupons()','EXECUTE') THEN RAISE EXCEPTION 'Anonymous access'; END IF;
  IF has_table_privilege('authenticated','public.athlete_coupons','UPDATE') THEN RAISE EXCEPTION 'Direct coupon updates allowed'; END IF;
  INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type,state,max_issues,is_test)
    VALUES('qa-coupon','QA','QA','QA','QA','gift','active',1,true) RETURNING id INTO campaign;
  coupon:=public.benefit_grant_coupon(actor,campaign,'QA');
  again:=public.benefit_grant_coupon(actor,campaign,'QA repeated');
  IF coupon IS NULL OR coupon<>again OR (SELECT count(*) FROM public.athlete_coupons WHERE campaign_id=campaign)<>1 THEN RAISE EXCEPTION 'Duplicate grant'; END IF;
  IF public.benefit_grant_coupon(stranger,campaign,'QA limit') IS NOT NULL THEN RAISE EXCEPTION 'Issue cap bypassed'; END IF;
  result:=public.athlete_coupon_detail(coupon);
  IF result->>'status'<>'available' THEN RAISE EXCEPTION 'Owner cannot view coupon'; END IF;
  PERFORM set_config('request.jwt.claim.sub',stranger::text,true);
  BEGIN
    PERFORM public.athlete_coupon_detail(coupon);
    RAISE EXCEPTION 'Other user can view private coupon';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.athlete_redeem_benefit_coupon(coupon);
    RAISE EXCEPTION 'Other user can redeem private coupon';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  PERFORM set_config('request.jwt.claim.sub',actor::text,true);
  result:=public.athlete_redeem_benefit_coupon(coupon);
  IF result->>'status'<>'redeemed' THEN RAISE EXCEPTION 'Redeem failed'; END IF;
  PERFORM public.athlete_redeem_benefit_coupon(coupon);
  IF (SELECT count(*) FROM public.benefit_redemptions WHERE coupon_id=coupon)<>1 THEN RAISE EXCEPTION 'Double redemption'; END IF;
  INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type,state,is_test)
    VALUES('qa-expiry','QA','QA','QA','QA','gift','active',true) RETURNING id INTO expiry_campaign;
  expiry_coupon:=public.benefit_grant_coupon(actor,expiry_campaign,'QA expiry');
  UPDATE public.athlete_coupons SET issued_at=now()-interval '2 days',expires_at=now()-interval '1 day' WHERE id=expiry_coupon;
  IF public.athlete_coupon_detail(expiry_coupon)->>'status'<>'expired' THEN RAISE EXCEPTION 'Expiry not computed'; END IF;
  BEGIN
    PERFORM public.athlete_redeem_benefit_coupon(expiry_coupon);
    RAISE EXCEPTION 'Expired coupon can be redeemed';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Este cupón ya no está disponible' THEN RAISE; END IF; END;
  -- A published existing rating should unlock benefits without a new review post.
  SELECT r.user_id,r.race_event_id INTO STRICT reviews_user,reviews_event FROM public.event_reviews r JOIN public.race_events e ON e.id=r.race_event_id WHERE r.is_published AND coalesce(e.event_end_date,e.event_date)<=now() AND r.rating BETWEEN 1 AND 5 LIMIT 1;
  INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type,state,is_test)
    VALUES('qa-rating','QA','QA','QA','QA','gift','active',true) RETURNING id INTO rule_campaign;
  INSERT INTO public.benefit_rules(campaign_id,trigger_type,race_event_id) VALUES(rule_campaign,'event_rating',reviews_event);
  UPDATE public.event_reviews SET rating=rating WHERE user_id=reviews_user AND race_event_id=reviews_event;
  IF NOT EXISTS(SELECT 1 FROM public.athlete_coupons WHERE user_id=reviews_user AND campaign_id=rule_campaign) THEN RAISE EXCEPTION 'Rating trigger did not grant benefit'; END IF;
  PERFORM public.benefit_sync_user(reviews_user);
  IF (SELECT count(*) FROM public.athlete_coupons WHERE user_id=reviews_user AND campaign_id=rule_campaign)<>1 THEN RAISE EXCEPTION 'Sync creates duplicate benefit'; END IF;
  -- Confirmed attendance is a separate signal, and can be configured for a specific event.
  SELECT id INTO STRICT participation_event FROM public.race_events LIMIT 1;
  INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type,state,is_test)
    VALUES('qa-attendance','QA','QA','QA','QA','gift','active',true) RETURNING id INTO rule_campaign;
  INSERT INTO public.benefit_rules(campaign_id,trigger_type,race_event_id) VALUES(rule_campaign,'event_participation',participation_event);
  INSERT INTO public.benefit_participations(user_id,race_event_id,source) VALUES(actor,participation_event,'qa-verified-attendance') ON CONFLICT(user_id,race_event_id) DO UPDATE SET source=excluded.source;
  IF NOT EXISTS(SELECT 1 FROM public.athlete_coupons WHERE user_id=actor AND campaign_id=rule_campaign) THEN RAISE EXCEPTION 'Attendance trigger did not grant benefit'; END IF;
  RAISE NOTICE 'PASS: grants, cap, ownership, expiry, idempotent redemption, rating trigger, attendance trigger';
END $$;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.athlete_coupons WHERE user_id<>current_setting('request.jwt.claim.sub')::uuid) THEN RAISE EXCEPTION 'RLS leaks coupons'; END IF;
  IF EXISTS(SELECT 1 FROM public.benefit_redemptions WHERE redeemed_by<>current_setting('request.jwt.claim.sub')::uuid) THEN RAISE EXCEPTION 'RLS leaks redemptions'; END IF;
  IF public.athlete_my_coupons() IS NULL THEN RAISE EXCEPTION 'Wallet RPC failed'; END IF;
  RAISE NOTICE 'PASS: authenticated wallet and RLS isolation';
END $$;
RESET ROLE;
ROLLBACK;
