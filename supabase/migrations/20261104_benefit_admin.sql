BEGIN;
ALTER TABLE public.benefit_campaigns ADD COLUMN detail_title text NOT NULL DEFAULT '', ADD COLUMN detail_description text NOT NULL DEFAULT '', ADD COLUMN gallery_urls jsonb NOT NULL DEFAULT '[]', ADD COLUMN social_links jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.benefit_rules ADD COLUMN release_mode text NOT NULL DEFAULT 'immediate' CHECK (release_mode IN ('immediate','event','custom')), ADD COLUMN release_at timestamptz;
ALTER TABLE public.benefit_rules ADD CONSTRAINT benefit_release_config CHECK ((release_mode <> 'custom' OR release_at IS NOT NULL) AND (release_mode <> 'event' OR race_event_id IS NOT NULL));
CREATE FUNCTION public.benefit_rule_due(p_rule public.benefit_rules) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT CASE WHEN p_rule.release_mode='immediate' THEN true WHEN p_rule.release_mode='custom' THEN p_rule.release_at<=now() ELSE (SELECT event_date<=now() FROM public.race_events WHERE id=p_rule.race_event_id) END;
$$;
REVOKE ALL ON FUNCTION public.benefit_rule_due(public.benefit_rules) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.benefit_grant_coupon(p_user_id uuid, p_campaign_id uuid, p_reason text, p_rule_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE campaign public.benefit_campaigns; coupon_id uuid; expiry timestamptz;
BEGIN
  -- Serialize grants for this campaign to respect its total issue limit.
  SELECT * INTO campaign FROM public.benefit_campaigns WHERE id = p_campaign_id FOR UPDATE;
  IF NOT FOUND OR campaign.state <> 'active' OR campaign.starts_at > now() OR campaign.ends_at <= now() THEN RETURN NULL; END IF;
  SELECT id INTO coupon_id FROM public.athlete_coupons WHERE user_id = p_user_id AND campaign_id = p_campaign_id;
  IF coupon_id IS NOT NULL THEN RETURN coupon_id; END IF;
  IF campaign.max_issues IS NOT NULL AND (SELECT count(*) FROM public.athlete_coupons WHERE campaign_id = campaign.id) >= campaign.max_issues THEN RETURN NULL; END IF;
  IF p_rule_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.benefit_rules WHERE id = p_rule_id AND campaign_id = p_campaign_id) THEN RAISE EXCEPTION 'Regla no válida'; END IF;
  IF p_rule_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.benefit_rules r WHERE r.id=p_rule_id AND r.enabled AND public.benefit_rule_due(r)) THEN RETURN NULL; END IF;
  expiry := least(campaign.ends_at, now() + make_interval(days => campaign.validity_days));
  INSERT INTO public.athlete_coupons(user_id,campaign_id,rule_id,expires_at,grant_reason)
  VALUES(p_user_id,p_campaign_id,p_rule_id,expiry,p_reason) RETURNING id INTO coupon_id;
  RETURN coupon_id;
END;
$$;
CREATE OR REPLACE FUNCTION public.benefit_sync_user(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE rule record; earned integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  FOR rule IN SELECT r.* FROM public.benefit_rules r JOIN public.benefit_campaigns b ON b.id = r.campaign_id
    WHERE r.enabled AND public.benefit_rule_due(r) AND b.state = 'active' AND b.starts_at <= now() AND (b.ends_at IS NULL OR b.ends_at > now())
      AND NOT EXISTS (SELECT 1 FROM public.athlete_coupons c WHERE c.user_id = p_user_id AND c.campaign_id = r.campaign_id)
    ORDER BY r.campaign_id, r.id
  LOOP
    earned := 0;
    IF rule.trigger_type = 'event_registration' THEN
      SELECT count(DISTINCT race_event_id) INTO earned FROM public.leads l
      WHERE l.user_id = p_user_id AND l.race_event_id IS NOT NULL AND NOT coalesce(l.is_archived,false)
        AND (rule.race_event_id IS NULL OR l.race_event_id = rule.race_event_id)
        AND l.dynamic_data->>'payment_status' IN ('paid','verified')
        AND coalesce(l.dynamic_data->>'stripe_checkout_session_id','') NOT LIKE 'cs_test_%';
    ELSIF rule.trigger_type = 'event_participation' THEN
      SELECT count(DISTINCT race_event_id) INTO earned FROM (
        SELECT race_event_id FROM public.benefit_participations WHERE user_id = p_user_id
        UNION SELECT r.race_event_id FROM public.event_reviews r JOIN public.race_events e ON e.id=r.race_event_id WHERE r.user_id = p_user_id AND r.is_published AND r.rating BETWEEN 1 AND 5 AND coalesce(e.event_end_date,e.event_date)<=now()
      ) participation WHERE rule.race_event_id IS NULL OR race_event_id = rule.race_event_id;
    ELSE
      SELECT count(DISTINCT r.race_event_id) INTO earned FROM public.event_reviews r JOIN public.race_events e ON e.id=r.race_event_id
      WHERE r.user_id = p_user_id AND r.is_published AND r.rating BETWEEN 1 AND 5
        AND (rule.race_event_id IS NULL OR r.race_event_id = rule.race_event_id) AND coalesce(e.event_end_date,e.event_date)<=now()
        AND (rule.trigger_type = 'event_rating' OR (r.entry_type = 'review' AND (length(trim(coalesce(r.comment,''))) > 0 OR r.has_photos)));
    END IF;
    IF earned >= rule.required_count THEN PERFORM public.benefit_grant_coupon(p_user_id,rule.campaign_id,rule.trigger_type,rule.id); END IF;
  END LOOP;
END;
$$;
CREATE OR REPLACE FUNCTION public.benefit_coupon_json(p_coupon_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'id',c.id,'code',c.code,'campaign_id',b.id,'merchant_name',b.merchant_name,'title',b.title,
    'description',b.description,'terms',b.terms,'logo_url',b.logo_url,'background_color',b.background_color,
    'detail_title',b.detail_title,'detail_description',b.detail_description,'gallery_urls',b.gallery_urls,'social_links',b.social_links,'benefit_type',b.benefit_type,'benefit_value',b.benefit_value,'is_test',b.is_test,
    'issued_at',c.issued_at,'expires_at',c.expires_at,'redeemed_at',c.redeemed_at,'grant_reason',c.grant_reason,
    'status',CASE WHEN c.status = 'redeemed' THEN 'redeemed' WHEN c.status = 'revoked' OR b.state <> 'active' THEN 'revoked' WHEN c.expires_at <= now() THEN 'expired' ELSE 'available' END
  ) FROM public.athlete_coupons c JOIN public.benefit_campaigns b ON b.id=c.campaign_id WHERE c.id=p_coupon_id;
$$;

CREATE FUNCTION public.benefit_release_due() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u record; total integer:=0;
BEGIN
 FOR u IN SELECT DISTINCT l.user_id FROM public.leads l JOIN public.benefit_rules r ON r.race_event_id=l.race_event_id JOIN public.benefit_campaigns b ON b.id=r.campaign_id
 WHERE l.user_id IS NOT NULL AND NOT coalesce(l.is_archived,false) AND r.enabled AND b.state='active' AND b.starts_at<=now() AND (b.ends_at IS NULL OR b.ends_at>now()) AND public.benefit_rule_due(r)
 AND NOT EXISTS(SELECT 1 FROM public.athlete_coupons c WHERE c.campaign_id=b.id AND c.user_id=l.user_id)
 LOOP PERFORM public.benefit_sync_user(u.user_id); total:=total+1; END LOOP;
 RETURN total;
END; $$;
REVOKE ALL ON FUNCTION public.benefit_release_due() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.benefit_release_due() TO service_role;

CREATE FUNCTION public.super_admin_benefits(p_pin text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT public._super_admin_pin_ok(p_pin) THEN RAISE EXCEPTION 'INVALID_SUPER_ADMIN_PIN' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object('campaigns',(SELECT coalesce(jsonb_agg(to_jsonb(b)||jsonb_build_object('rules',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM public.benefit_rules r WHERE r.campaign_id=b.id),'issued',(SELECT count(*) FROM public.athlete_coupons c WHERE c.campaign_id=b.id),'redeemed',(SELECT count(*) FROM public.athlete_coupons c WHERE c.campaign_id=b.id AND c.status='redeemed')) ORDER BY b.created_at DESC),'[]') FROM public.benefit_campaigns b),
 'events',(SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.event_date DESC),'[]') FROM (SELECT e.id,e.name,e.event_date,count(DISTINCT l.id) AS registrants,count(DISTINCT l.user_id) FILTER (WHERE l.dynamic_data->>'payment_status' IN ('paid','verified') AND coalesce(l.dynamic_data->>'stripe_checkout_session_id','') NOT LIKE 'cs_test_%') AS eligible FROM public.race_events e JOIN public.leads l ON l.race_event_id=e.id AND NOT coalesce(l.is_archived,false) GROUP BY e.id,e.name,e.event_date) e));
END; $$;

CREATE FUNCTION public.super_admin_save_benefit(p_pin text,p_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
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
 UPDATE public.benefit_campaigns SET merchant_name=trim(p_data->>'merchant_name'),title=trim(p_data->>'title'),description=coalesce(p_data->>'description',''),terms=coalesce(p_data->>'terms',''),logo_url=nullif(p_data->>'logo_url',''),background_color=p_data->>'background_color',benefit_type=p_data->>'benefit_type',benefit_value=nullif(p_data->>'benefit_value','')::numeric,state=p_data->>'state',starts_at=(p_data->>'starts_at')::timestamptz,ends_at=nullif(p_data->>'ends_at','')::timestamptz,validity_days=(p_data->>'validity_days')::integer,max_issues=nullif(p_data->>'max_issues','')::integer,is_test=coalesce((p_data->>'is_test')::boolean,false),detail_title=coalesce(p_data->>'detail_title',''),detail_description=coalesce(p_data->>'detail_description',''),gallery_urls=p_data->'gallery_urls',social_links=p_data->'social_links' WHERE id=bid;
 event_id:=nullif(p_data->>'event_id','')::uuid; mode:=coalesce(p_data->>'release_mode','event');
 DELETE FROM public.benefit_rules WHERE campaign_id=bid;
 IF event_id IS NOT NULL THEN
 INSERT INTO public.benefit_rules(campaign_id,trigger_type,race_event_id,release_mode,release_at) VALUES(bid,'event_registration',event_id,mode,nullif(p_data->>'release_at','')::timestamptz);
 END IF;
 RETURN bid;
END; $$;
REVOKE ALL ON FUNCTION public.super_admin_benefits(text), public.super_admin_save_benefit(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.super_admin_benefits(text), public.super_admin_save_benefit(text,jsonb) TO anon,authenticated,service_role;
UPDATE public.benefit_campaigns SET detail_title='Obtén un 10% OFF en sucursal.', gallery_urls='["https://dorsalia.run/coupons/gallery/pollo-feliz-pollo.webp","https://dorsalia.run/coupons/gallery/pollo-feliz-quesadilla.webp","https://dorsalia.run/coupons/gallery/pollo-feliz-alitas.webp"]', logo_url='https://dorsalia.run/coupons/pollo-feliz.png' WHERE slug='pollo-feliz-prueba';
NOTIFY pgrst,'reload schema';
COMMIT;
