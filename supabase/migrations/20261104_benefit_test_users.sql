BEGIN;
CREATE TABLE IF NOT EXISTS public.benefit_test_users(user_id uuid PRIMARY KEY REFERENCES auth.users(id));
ALTER TABLE public.benefit_test_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.benefit_test_users FROM PUBLIC,anon,authenticated;
INSERT INTO public.benefit_test_users SELECT id FROM auth.users WHERE lower(email)='hola@somoskuper.com' ON CONFLICT DO NOTHING;
DELETE FROM public.athlete_coupons c USING auth.users u WHERE c.user_id=u.id AND lower(u.email)='hola@somoskuper.com' AND c.grant_reason LIKE '%prueba%' AND c.status<>'redeemed';
DO $$ DECLARE s text; BEGIN
 SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='benefit_sync_user';
 s:=replace(s,'  IF p_user_id IS NULL THEN RETURN; END IF;', '  IF p_user_id IS NULL THEN RETURN; END IF;
 IF EXISTS(SELECT 1 FROM public.benefit_test_users WHERE user_id=p_user_id) THEN
 FOR rule IN SELECT r.* FROM public.benefit_rules r JOIN public.benefit_campaigns b ON b.id=r.campaign_id WHERE r.enabled AND b.state=''active'' AND public.benefit_rule_due(r) LOOP PERFORM public.benefit_grant_coupon(p_user_id,rule.campaign_id,''Cuenta de pruebas'',rule.id); END LOOP;
 END IF;'); EXECUTE s;
 SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='benefit_release_due';
 s:=replace(s,' RETURN total;', ' FOR u IN SELECT user_id FROM public.benefit_test_users LOOP PERFORM public.benefit_sync_user(u.user_id); END LOOP; RETURN total;'); EXECUTE s;
END $$;
SELECT public.benefit_sync_user(id) FROM auth.users WHERE lower(email)='hola@somoskuper.com';
COMMIT;
