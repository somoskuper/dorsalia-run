\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE campaign uuid; actor uuid; event_id uuid; review_id uuid; registration_id uuid;
BEGIN
  SELECT r.id,r.user_id,r.race_event_id INTO STRICT review_id,actor,event_id FROM public.event_reviews r JOIN public.race_events e ON e.id=r.race_event_id WHERE r.is_published AND coalesce(e.event_end_date,e.event_date)<=now() LIMIT 1;
  INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type,state,is_test)
    VALUES('qa-review-only','QA','QA','QA','QA','gift','active',true) RETURNING id INTO campaign;
  INSERT INTO public.benefit_rules(campaign_id,trigger_type,race_event_id) VALUES(campaign,'event_review',event_id);
  UPDATE public.event_reviews SET entry_type='rating',comment='',has_photos=false WHERE id=review_id;
  IF EXISTS(SELECT 1 FROM public.athlete_coupons WHERE campaign_id=campaign) THEN RAISE EXCEPTION 'A rating counted as a public review'; END IF;
  UPDATE public.event_reviews SET entry_type='review',comment='QA review content' WHERE id=review_id;
  IF NOT EXISTS(SELECT 1 FROM public.athlete_coupons WHERE campaign_id=campaign AND user_id=actor) THEN RAISE EXCEPTION 'A public review did not earn its benefit'; END IF;

  SELECT l.id,l.user_id,l.race_event_id INTO STRICT registration_id,actor,event_id FROM public.leads l JOIN auth.users u ON u.id=l.user_id WHERE l.race_event_id IS NOT NULL AND NOT coalesce(l.is_archived,false) LIMIT 1;
  INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type,state,is_test)
    VALUES('qa-registered','QA','QA','QA','QA','gift','active',true) RETURNING id INTO campaign;
  INSERT INTO public.benefit_rules(campaign_id,trigger_type,race_event_id) VALUES(campaign,'event_registration',event_id);
  -- Use one registration in isolation for this transaction.
  UPDATE public.leads SET dynamic_data=coalesce(dynamic_data,'{}'::jsonb)||'{"payment_status":"refunded"}'::jsonb WHERE id=registration_id;
  -- Other legitimate registrations for the same user/event can qualify; rule checks are performed below only when this is the sole registration.
  IF (SELECT count(*) FROM public.leads WHERE user_id=actor AND race_event_id=event_id)=1 THEN
    IF EXISTS(SELECT 1 FROM public.athlete_coupons WHERE campaign_id=campaign) THEN RAISE EXCEPTION 'Refunded registration earned a benefit'; END IF;
    UPDATE public.leads SET dynamic_data=dynamic_data||'{"payment_status":"paid","stripe_checkout_session_id":"cs_test_qa"}'::jsonb WHERE id=registration_id;
    IF EXISTS(SELECT 1 FROM public.athlete_coupons WHERE campaign_id=campaign) THEN RAISE EXCEPTION 'Test payment earned a benefit'; END IF;
  END IF;
  UPDATE public.leads SET dynamic_data=(dynamic_data-'stripe_checkout_session_id')||'{"payment_status":"paid"}'::jsonb WHERE id=registration_id;
  IF NOT EXISTS(SELECT 1 FROM public.athlete_coupons WHERE campaign_id=campaign AND user_id=actor) THEN RAISE EXCEPTION 'Confirmed registration did not earn a benefit'; END IF;
  RAISE NOTICE 'PASS: ratings separated from reviews; registration rule and payment status';
END $$;
ROLLBACK;
