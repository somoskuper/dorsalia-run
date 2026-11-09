BEGIN;
ALTER TABLE public.benefit_campaigns ADD COLUMN uses_per_user integer NOT NULL DEFAULT 1 CHECK(uses_per_user BETWEEN 1 AND 10000);
ALTER TABLE public.athlete_coupons ADD COLUMN uses_used integer NOT NULL DEFAULT 0 CHECK(uses_used>=0);
UPDATE public.athlete_coupons SET uses_used=1 WHERE status='redeemed';
ALTER TABLE public.benefit_redemptions DROP CONSTRAINT benefit_redemptions_coupon_id_key;
ALTER TABLE public.benefit_redemptions ADD COLUMN request_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE;
DO $$ DECLARE s text; BEGIN
SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='super_admin_save_benefit';
s:=replace(s,'UPDATE public.benefit_campaigns SET merchant_name=', 'UPDATE public.benefit_campaigns SET uses_per_user=coalesce((p_data->>''uses_per_user'')::integer,1),merchant_name='); EXECUTE s;
SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='super_admin_benefits';
s:=replace(s,'''registrants''','''registrants'''); EXECUTE s;
SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='benefit_coupon_json';
s:=replace(s,'''id'',c.id','''uses_total'',b.uses_per_user,''uses_used'',c.uses_used,''uses_remaining'',greatest(0,b.uses_per_user-c.uses_used),''id'',c.id');

s:=replace(s,'''redeemed'' THEN ''redeemed''','''redeemed'' THEN ''redeemed''');
s:=replace(s,'WHEN c.status = ''redeemed'' THEN ''redeemed''','WHEN c.uses_used >= b.uses_per_user THEN ''redeemed'''); EXECUTE s;
END $$;
DROP FUNCTION public.athlete_redeem_benefit_coupon(uuid);
CREATE FUNCTION public.athlete_redeem_benefit_coupon(p_coupon_id uuid,p_request_id uuid DEFAULT gen_random_uuid()) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE coupon public.athlete_coupons; campaign public.benefit_campaigns; used integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicia sesión' USING ERRCODE='42501'; END IF;
 SELECT b.* INTO campaign FROM public.benefit_campaigns b JOIN public.athlete_coupons c ON c.campaign_id=b.id WHERE c.id=p_coupon_id AND c.user_id=auth.uid() FOR SHARE OF b;
 SELECT * INTO coupon FROM public.athlete_coupons WHERE id=p_coupon_id AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cupón no encontrado' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.benefit_redemptions WHERE coupon_id=p_coupon_id AND request_id=p_request_id) THEN RETURN public.benefit_coupon_json(p_coupon_id); END IF;
 IF coupon.status='revoked' OR coupon.expires_at<=now() OR campaign.state<>'active' THEN RAISE EXCEPTION 'Este cupón ya no está disponible'; END IF;
 IF coupon.uses_used>=campaign.uses_per_user THEN RAISE EXCEPTION 'Este cupón ya no tiene usos disponibles'; END IF;
 used:=coupon.uses_used+1;
 INSERT INTO public.benefit_redemptions(coupon_id,redeemed_by,snapshot,request_id) VALUES(coupon.id,auth.uid(),public.benefit_coupon_json(coupon.id),p_request_id);
 UPDATE public.athlete_coupons SET uses_used=used,status=CASE WHEN used>=campaign.uses_per_user THEN 'redeemed' ELSE 'available' END,redeemed_at=CASE WHEN used>=campaign.uses_per_user THEN now() ELSE NULL END WHERE id=coupon.id;
 RETURN public.benefit_coupon_json(coupon.id);
END $$;
REVOKE ALL ON FUNCTION public.athlete_redeem_benefit_coupon(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.athlete_redeem_benefit_coupon(uuid,uuid) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
