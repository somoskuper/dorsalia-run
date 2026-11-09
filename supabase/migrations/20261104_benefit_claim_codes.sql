BEGIN;
ALTER TABLE public.benefit_campaigns
 ADD COLUMN text_color text NOT NULL DEFAULT '#ffffff' CHECK(text_color ~ '^#[0-9a-fA-F]{6}$'),
 ADD COLUMN button_background_color text NOT NULL DEFAULT '#ffffff' CHECK(button_background_color ~ '^#[0-9a-fA-F]{6}$'),
 ADD COLUMN button_text_color text NOT NULL DEFAULT '#070707' CHECK(button_text_color ~ '^#[0-9a-fA-F]{6}$'),
 ADD COLUMN button_label text NOT NULL DEFAULT 'Canjear' CHECK(length(trim(button_label)) BETWEEN 1 AND 40),
 ADD COLUMN claim_enabled boolean NOT NULL DEFAULT false,
 ADD COLUMN claim_code text CHECK(claim_code IS NULL OR (claim_code=upper(trim(claim_code)) AND claim_code ~ '^[A-Z0-9][A-Z0-9_-]{2,47}$')),
 ADD CONSTRAINT benefit_claim_config CHECK(NOT claim_enabled OR claim_code IS NOT NULL);
CREATE UNIQUE INDEX benefit_campaign_claim_code_key ON public.benefit_campaigns(claim_code) WHERE claim_code IS NOT NULL;
UPDATE public.benefit_campaigns SET text_color='#070707' WHERE (get_byte(decode(substr(background_color,2),'hex'),0)*299+get_byte(decode(substr(background_color,2),'hex'),1)*587+get_byte(decode(substr(background_color,2),'hex'),2)*114)>160000;
CREATE TABLE public.benefit_claim_attempts(user_id uuid PRIMARY KEY REFERENCES auth.users(id),attempt_window timestamptz NOT NULL DEFAULT now(),attempts integer NOT NULL DEFAULT 0);
ALTER TABLE public.benefit_claim_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.benefit_claim_attempts FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.benefit_claim_attempts TO service_role;
CREATE OR REPLACE FUNCTION public.benefit_coupon_json(p_coupon_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT jsonb_build_object(
    'text_color',b.text_color,'button_background_color',b.button_background_color,'button_text_color',b.button_text_color,'button_label',b.button_label,'uses_total',b.uses_per_user,'uses_used',c.uses_used,'uses_remaining',greatest(0,b.uses_per_user-c.uses_used),'id',c.id,'code',c.code,'campaign_id',b.id,'merchant_name',b.merchant_name,'title',b.title,
    'description',b.description,'terms',b.terms,'logo_url',b.logo_url,'background_color',b.background_color,
    'detail_title',b.detail_title,'detail_description',b.detail_description,'gallery_urls',b.gallery_urls,'social_links',b.social_links,'benefit_type',b.benefit_type,'benefit_value',b.benefit_value,'is_test',b.is_test,
    'issued_at',c.issued_at,'expires_at',c.expires_at,'redeemed_at',c.redeemed_at,'grant_reason',c.grant_reason,
    'status',CASE WHEN c.uses_used >= b.uses_per_user THEN 'redeemed' WHEN c.status = 'revoked' OR b.state <> 'active' THEN 'revoked' WHEN c.expires_at <= now() THEN 'expired' ELSE 'available' END
  ) FROM public.athlete_coupons c JOIN public.benefit_campaigns b ON b.id=c.campaign_id WHERE c.id=p_coupon_id;
$function$;

CREATE OR REPLACE FUNCTION public.super_admin_save_benefit(p_pin text, p_data jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE bid uuid; event_id uuid; mode text; item text; social record;
BEGIN
 IF NOT public._super_admin_pin_ok(p_pin) THEN RAISE EXCEPTION 'INVALID_SUPER_ADMIN_PIN' USING ERRCODE='42501'; END IF;
 IF length(trim(coalesce(p_data->>'merchant_name','')))=0 OR length(trim(coalesce(p_data->>'title','')))=0 THEN RAISE EXCEPTION 'Completa el comercio y el título'; END IF;
 IF jsonb_typeof(p_data->'gallery_urls')<>'array' OR jsonb_array_length(p_data->'gallery_urls')>8 OR jsonb_typeof(p_data->'social_links')<>'object' THEN RAISE EXCEPTION 'Galería o redes inválidas'; END IF;
 FOR item IN SELECT jsonb_array_elements_text(p_data->'gallery_urls') UNION ALL SELECT p_data->>'logo_url' LOOP
 IF coalesce(item,'')<>'' AND item !~ '^https://' THEN RAISE EXCEPTION 'Las imágenes deben usar una URL HTTPS'; END IF;
 END LOOP;
 FOR social IN SELECT * FROM jsonb_each_text(p_data->'social_links') LOOP
 IF social.key NOT IN ('facebook','instagram','tiktok','whatsapp') OR (social.value<>'' AND social.value !~ '^https://') THEN RAISE EXCEPTION 'Red social no válida: %',social.key; END IF;
 END LOOP;
 IF p_data->>'benefit_type' IN ('percent','amount') AND (nullif(p_data->>'benefit_value','') IS NULL OR (p_data->>'benefit_value')::numeric<=0 OR (p_data->>'benefit_type'='percent' AND (p_data->>'benefit_value')::numeric>100)) THEN RAISE EXCEPTION 'Indica un beneficio válido (porcentaje de 0.01 a 100)'; END IF;
 bid:=nullif(p_data->>'id','')::uuid;
 IF bid IS NULL THEN INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type) VALUES('cupon-'||replace(gen_random_uuid()::text,'-',''),trim(p_data->>'merchant_name'),trim(p_data->>'title'),'','','other') RETURNING id INTO bid;
 ELSIF NOT EXISTS(SELECT 1 FROM public.benefit_campaigns WHERE id=bid FOR UPDATE) THEN RAISE EXCEPTION 'Campaña no encontrada'; END IF;
 UPDATE public.benefit_campaigns SET text_color=coalesce(nullif(p_data->>'text_color',''),text_color),button_background_color=coalesce(nullif(p_data->>'button_background_color',''),button_background_color),button_text_color=coalesce(nullif(p_data->>'button_text_color',''),button_text_color),button_label=coalesce(nullif(trim(p_data->>'button_label'),''),button_label),claim_enabled=CASE WHEN p_data ? 'claim_enabled' THEN coalesce((p_data->>'claim_enabled')::boolean,false) ELSE claim_enabled END,claim_code=CASE WHEN p_data ? 'claim_code' THEN nullif(upper(trim(p_data->>'claim_code')),'') ELSE claim_code END,uses_per_user=coalesce((p_data->>'uses_per_user')::integer,1),merchant_name=trim(p_data->>'merchant_name'),title=trim(p_data->>'title'),description=coalesce(p_data->>'description',''),terms=coalesce(p_data->>'terms',''),logo_url=nullif(p_data->>'logo_url',''),background_color=p_data->>'background_color',benefit_type=p_data->>'benefit_type',benefit_value=nullif(p_data->>'benefit_value','')::numeric,state=p_data->>'state',starts_at=(p_data->>'starts_at')::timestamptz,ends_at=nullif(p_data->>'ends_at','')::timestamptz,validity_days=(p_data->>'validity_days')::integer,max_issues=nullif(p_data->>'max_issues','')::integer,is_test=coalesce((p_data->>'is_test')::boolean,false),detail_title=coalesce(p_data->>'detail_title',''),detail_description=coalesce(p_data->>'detail_description',''),gallery_urls=p_data->'gallery_urls',social_links=p_data->'social_links' WHERE id=bid;
 event_id:=nullif(p_data->>'event_id','')::uuid; mode:=coalesce(p_data->>'release_mode','event');
 DELETE FROM public.benefit_rules WHERE campaign_id=bid;
 IF event_id IS NOT NULL THEN
 INSERT INTO public.benefit_rules(campaign_id,trigger_type,race_event_id,release_mode,release_at) VALUES(bid,'event_registration',event_id,mode,nullif(p_data->>'release_at','')::timestamptz);
 END IF;
 RETURN bid;
END; $function$;


CREATE FUNCTION public.athlete_claim_benefit_folio(p_folio text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE aid uuid:=auth.uid();a public.benefit_claim_attempts;bid uuid;cid uuid;existing boolean;code text:=upper(trim(coalesce(p_folio,'')));
BEGIN
 IF aid IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=aid AND email_confirmed_at IS NOT NULL AND deleted_at IS NULL AND (banned_until IS NULL OR banned_until<=now())) THEN RAISE EXCEPTION 'Confirma tu correo e inicia sesión para obtener un cupón.' USING ERRCODE='42501'; END IF;
 INSERT INTO public.benefit_claim_attempts(user_id) VALUES(aid) ON CONFLICT DO NOTHING;
 SELECT * INTO a FROM public.benefit_claim_attempts WHERE user_id=aid FOR UPDATE;
 IF a.attempt_window<now()-interval '15 minutes' THEN a.attempts:=0;UPDATE public.benefit_claim_attempts SET attempts=0,attempt_window=now() WHERE user_id=aid;END IF;
 IF a.attempts>=10 THEN RETURN jsonb_build_object('error','Demasiados intentos. Espera 15 minutos para volver a intentar.'); END IF;
 UPDATE public.benefit_claim_attempts SET attempts=attempts+1 WHERE user_id=aid;
 SELECT id INTO bid FROM public.benefit_campaigns WHERE claim_enabled AND claim_code=code AND state='active' AND starts_at<=now() AND (ends_at IS NULL OR ends_at>now()) FOR UPDATE;
 IF bid IS NULL THEN RETURN jsonb_build_object('error','El folio no está disponible. Revisa el código y su vigencia.');END IF;
 SELECT EXISTS(SELECT 1 FROM public.athlete_coupons WHERE user_id=aid AND campaign_id=bid) INTO existing;
 cid:=public.benefit_grant_coupon(aid,bid,'Folio personalizado',NULL);
 IF cid IS NULL THEN RETURN jsonb_build_object('error','Este cupón ya alcanzó su límite de entregas o no está disponible.');END IF;
 RETURN jsonb_build_object('coupon',public.benefit_coupon_json(cid),'already_owned',existing);
END $$;
REVOKE ALL ON FUNCTION public.athlete_claim_benefit_folio(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.athlete_claim_benefit_folio(text) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
