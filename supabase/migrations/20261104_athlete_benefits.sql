BEGIN;

CREATE TABLE public.benefit_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  merchant_name text NOT NULL CHECK (length(trim(merchant_name)) > 0),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL,
  terms text NOT NULL,
  logo_url text,
  background_color text NOT NULL DEFAULT '#ed2024' CHECK (background_color ~ '^#[0-9a-fA-F]{6}$'),
  benefit_type text NOT NULL CHECK (benefit_type IN ('percent','amount','gift','other')),
  benefit_value numeric CHECK (benefit_value > 0),
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft','active','paused','archived')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  validity_days integer NOT NULL DEFAULT 30 CHECK (validity_days BETWEEN 1 AND 3660),
  max_issues integer CHECK (max_issues > 0),
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at),
  CHECK (benefit_type <> 'percent' OR benefit_value BETWEEN 0.01 AND 100)
);

-- Rules within a campaign are alternative ways to earn the same one-time benefit.
CREATE TABLE public.benefit_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.benefit_campaigns(id) ON DELETE CASCADE,
  trigger_type text NOT NULL CHECK (trigger_type IN ('event_registration','event_participation','event_rating','event_review')),
  race_event_id uuid REFERENCES public.race_events(id),
  required_count integer NOT NULL DEFAULT 1 CHECK (required_count > 0),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX benefit_rules_campaign_idx ON public.benefit_rules(campaign_id) WHERE enabled;

-- Confirmed attendance can be imported by the backend; a registration alone is not attendance.
CREATE TABLE public.benefit_participations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_event_id uuid NOT NULL REFERENCES public.race_events(id),
  source text NOT NULL CHECK (length(trim(source)) > 0),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, race_event_id)
);

CREATE TABLE public.athlete_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.benefit_campaigns(id),
  rule_id uuid REFERENCES public.benefit_rules(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE DEFAULT upper(replace(gen_random_uuid()::text, '-', '')),
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','redeemed','revoked')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  redeemed_at timestamptz,
  grant_reason text NOT NULL,
  UNIQUE (user_id, campaign_id),
  CHECK (expires_at > issued_at),
  CHECK ((status = 'redeemed') = (redeemed_at IS NOT NULL))
);
CREATE INDEX athlete_coupons_owner_idx ON public.athlete_coupons(user_id, issued_at DESC);

CREATE TABLE public.benefit_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL UNIQUE REFERENCES public.athlete_coupons(id),
  redeemed_by uuid NOT NULL REFERENCES auth.users(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  snapshot jsonb NOT NULL
);

ALTER TABLE public.benefit_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY benefit_coupon_owner_read ON public.athlete_coupons FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY benefit_campaign_owner_read ON public.benefit_campaigns FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.athlete_coupons c WHERE c.campaign_id = benefit_campaigns.id AND c.user_id = auth.uid()));
CREATE POLICY benefit_redemption_owner_read ON public.benefit_redemptions FOR SELECT TO authenticated USING (redeemed_by = auth.uid());
REVOKE ALL ON public.benefit_campaigns, public.benefit_rules, public.benefit_participations, public.athlete_coupons, public.benefit_redemptions FROM anon, authenticated;
GRANT SELECT ON public.benefit_campaigns, public.athlete_coupons, public.benefit_redemptions TO authenticated;
GRANT ALL ON public.benefit_campaigns, public.benefit_rules, public.benefit_participations, public.athlete_coupons, public.benefit_redemptions TO service_role;

CREATE FUNCTION public.benefit_grant_coupon(p_user_id uuid, p_campaign_id uuid, p_reason text, p_rule_id uuid DEFAULT NULL)
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
  expiry := least(campaign.ends_at, now() + make_interval(days => campaign.validity_days));
  INSERT INTO public.athlete_coupons(user_id,campaign_id,rule_id,expires_at,grant_reason)
  VALUES(p_user_id,p_campaign_id,p_rule_id,expiry,p_reason) RETURNING id INTO coupon_id;
  RETURN coupon_id;
END;
$$;

CREATE FUNCTION public.benefit_sync_user(p_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE rule record; earned integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  FOR rule IN SELECT r.* FROM public.benefit_rules r JOIN public.benefit_campaigns b ON b.id = r.campaign_id
    WHERE r.enabled AND b.state = 'active' AND b.starts_at <= now() AND (b.ends_at IS NULL OR b.ends_at > now())
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

CREATE FUNCTION public.benefit_sync_trigger() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN PERFORM public.benefit_sync_user(NEW.user_id); RETURN NEW; END;
$$;
CREATE TRIGGER benefit_lead_sync AFTER INSERT OR UPDATE OF user_id, race_event_id, dynamic_data ON public.leads FOR EACH ROW EXECUTE FUNCTION public.benefit_sync_trigger();
CREATE TRIGGER benefit_review_sync AFTER INSERT OR UPDATE OF rating,comment,has_photos,is_published,entry_type ON public.event_reviews FOR EACH ROW EXECUTE FUNCTION public.benefit_sync_trigger();
CREATE TRIGGER benefit_participation_sync AFTER INSERT OR UPDATE ON public.benefit_participations FOR EACH ROW EXECUTE FUNCTION public.benefit_sync_trigger();

CREATE FUNCTION public.benefit_coupon_json(p_coupon_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT jsonb_build_object(
    'id',c.id,'code',c.code,'campaign_id',b.id,'merchant_name',b.merchant_name,'title',b.title,
    'description',b.description,'terms',b.terms,'logo_url',b.logo_url,'background_color',b.background_color,
    'benefit_type',b.benefit_type,'benefit_value',b.benefit_value,'is_test',b.is_test,
    'issued_at',c.issued_at,'expires_at',c.expires_at,'redeemed_at',c.redeemed_at,'grant_reason',c.grant_reason,
    'status',CASE WHEN c.status = 'redeemed' THEN 'redeemed' WHEN c.status = 'revoked' OR b.state <> 'active' THEN 'revoked' WHEN c.expires_at <= now() THEN 'expired' ELSE 'available' END
  ) FROM public.athlete_coupons c JOIN public.benefit_campaigns b ON b.id=c.campaign_id WHERE c.id=p_coupon_id;
$$;

CREATE FUNCTION public.athlete_my_coupons() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE result jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicia sesión' USING ERRCODE='42501'; END IF;
  PERFORM public.benefit_sync_user(auth.uid());
  SELECT coalesce(jsonb_agg(public.benefit_coupon_json(c.id) ORDER BY c.issued_at DESC),'[]'::jsonb) INTO result
    FROM public.athlete_coupons c WHERE c.user_id=auth.uid();
  RETURN result;
END;
$$;

CREATE FUNCTION public.athlete_coupon_detail(p_coupon_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.athlete_coupons WHERE id=p_coupon_id AND user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Cupón no encontrado' USING ERRCODE='42501';
  END IF;
  RETURN public.benefit_coupon_json(p_coupon_id);
END;
$$;

CREATE FUNCTION public.athlete_redeem_benefit_coupon(p_coupon_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE coupon public.athlete_coupons; campaign public.benefit_campaigns;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicia sesión' USING ERRCODE='42501'; END IF;
  -- Same lock order as grant: campaign, then coupon. Repeat requests are idempotent.
  SELECT b.* INTO campaign FROM public.benefit_campaigns b JOIN public.athlete_coupons c ON c.campaign_id=b.id WHERE c.id=p_coupon_id AND c.user_id=auth.uid() FOR SHARE OF b;
  SELECT * INTO coupon FROM public.athlete_coupons WHERE id=p_coupon_id AND user_id=auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cupón no encontrado' USING ERRCODE='42501'; END IF;
  IF coupon.status='redeemed' THEN RETURN public.benefit_coupon_json(coupon.id); END IF;
  IF coupon.status<>'available' OR coupon.expires_at<=now() OR campaign.state<>'active' THEN RAISE EXCEPTION 'Este cupón ya no está disponible'; END IF;
  INSERT INTO public.benefit_redemptions(coupon_id,redeemed_by,snapshot) VALUES(coupon.id,auth.uid(),public.benefit_coupon_json(coupon.id));
  UPDATE public.athlete_coupons SET status='redeemed',redeemed_at=now() WHERE id=coupon.id;
  RETURN public.benefit_coupon_json(coupon.id);
END;
$$;

REVOKE ALL ON FUNCTION public.benefit_grant_coupon(uuid,uuid,text,uuid), public.benefit_sync_user(uuid), public.benefit_sync_trigger(), public.benefit_coupon_json(uuid), public.athlete_my_coupons(), public.athlete_coupon_detail(uuid), public.athlete_redeem_benefit_coupon(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.benefit_grant_coupon(uuid,uuid,text,uuid), public.benefit_sync_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.athlete_my_coupons(), public.athlete_coupon_detail(uuid), public.athlete_redeem_benefit_coupon(uuid) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
