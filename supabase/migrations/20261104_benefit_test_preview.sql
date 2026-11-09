DO $$ DECLARE s text; BEGIN
SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='benefit_sync_user';
s:=replace(s,'PERFORM public.benefit_grant_coupon(p_user_id,rule.campaign_id,''Cuenta de pruebas'',rule.id);','INSERT INTO public.athlete_coupons(user_id,campaign_id,rule_id,expires_at,grant_reason) SELECT p_user_id,b.id,rule.id,least(b.ends_at,now()+make_interval(days=>b.validity_days)),''Cuenta de pruebas'' FROM public.benefit_campaigns b WHERE b.id=rule.campaign_id AND (b.ends_at IS NULL OR b.ends_at>now()) ON CONFLICT(user_id,campaign_id) DO NOTHING;'); EXECUTE s;
SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='benefit_grant_coupon';
s:=replace(s,'WHERE campaign_id = campaign.id) >=','WHERE campaign_id = campaign.id AND user_id NOT IN (SELECT user_id FROM public.benefit_test_users)) >=');EXECUTE s;
END $$;
SELECT benefit_sync_user(id) FROM auth.users WHERE lower(email)='hola@somoskuper.com';
