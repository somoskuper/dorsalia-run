BEGIN;

-- Preserve the original redemption and its request ID even after returning the use.
CREATE TABLE public.benefit_redemption_reversals (
  redemption_id uuid PRIMARY KEY REFERENCES public.benefit_redemptions(id) ON DELETE CASCADE,
  reversed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  reversed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.benefit_redemption_reversals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.benefit_redemption_reversals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.benefit_redemption_reversals TO service_role;
CREATE INDEX benefit_redemptions_history_idx ON public.benefit_redemptions (redeemed_at DESC, id DESC);
CREATE INDEX benefit_redemptions_coupon_history_idx ON public.benefit_redemptions (coupon_id, redeemed_at DESC);

CREATE FUNCTION public.super_admin_benefit_redemptions(
  p_pin text, p_campaign_id uuid DEFAULT NULL, p_status text DEFAULT 'active',
  p_search text DEFAULT '', p_offset integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  needle text := lower(left(trim(coalesce(p_search, '')), 120));
BEGIN
  IF auth.uid() IS NULL OR NOT public._super_admin_pin_ok(p_pin) THEN
    RAISE EXCEPTION 'Acceso de Superadmin requerido' USING ERRCODE = '42501';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('all', 'active', 'reversed') THEN
    RAISE EXCEPTION 'Filtro de canje no válido';
  END IF;
  RETURN (
    SELECT coalesce(jsonb_agg(to_jsonb(items) ORDER BY redeemed_at DESC, id DESC), '[]'::jsonb)
    FROM (
      SELECT r.id, r.redeemed_at, rv.reversed_at, b.id AS campaign_id, b.title, b.merchant_name,
        coalesce(nullif(trim(concat_ws(' ', ap.first_name, ap.last_name)), ''),
                 nullif(u.raw_user_meta_data->>'full_name', ''), 'Sin nombre') AS athlete_name,
        u.email, ap.username, c.expires_at
      FROM public.benefit_redemptions r
      JOIN public.athlete_coupons c ON c.id = r.coupon_id
      JOIN public.benefit_campaigns b ON b.id = c.campaign_id
      JOIN auth.users u ON u.id = r.redeemed_by
      LEFT JOIN public.athlete_profiles ap ON ap.user_id = r.redeemed_by
      LEFT JOIN public.benefit_redemption_reversals rv ON rv.redemption_id = r.id
      WHERE (p_campaign_id IS NULL OR b.id = p_campaign_id)
        AND (p_status = 'all' OR (p_status = 'active' AND rv.redemption_id IS NULL)
          OR (p_status = 'reversed' AND rv.redemption_id IS NOT NULL))
        AND (needle = '' OR strpos(lower(concat_ws(' ', ap.first_name, ap.last_name, ap.username,
          u.email, u.raw_user_meta_data->>'full_name', b.title, b.merchant_name)), needle) > 0)
      ORDER BY r.redeemed_at DESC, r.id DESC
      LIMIT 26 OFFSET greatest(coalesce(p_offset, 0), 0)
    ) items
  );
END
$fn$;

CREATE FUNCTION public.super_admin_reverse_benefit_redemption(p_pin text, p_redemption_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp'
AS $fn$
DECLARE
  actor uuid := auth.uid();
  target_coupon uuid;
  coupon public.athlete_coupons;
  campaign public.benefit_campaigns;
  remaining_used integer;
  next_status text;
BEGIN
  IF actor IS NULL OR NOT public._super_admin_pin_ok(p_pin) THEN
    RAISE EXCEPTION 'Acceso de Superadmin requerido' USING ERRCODE = '42501';
  END IF;

  SELECT r.coupon_id INTO target_coupon FROM public.benefit_redemptions r WHERE r.id = p_redemption_id;
  -- Use the same lock order as athlete_redeem_benefit_coupon.
  SELECT b.* INTO campaign FROM public.benefit_campaigns b
    JOIN public.athlete_coupons c ON c.campaign_id = b.id WHERE c.id = target_coupon FOR SHARE OF b;
  SELECT * INTO coupon FROM public.athlete_coupons WHERE id = target_coupon FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Canje no encontrado'; END IF;

  INSERT INTO public.benefit_redemption_reversals (redemption_id, reversed_by)
  VALUES (p_redemption_id, actor) ON CONFLICT (redemption_id) DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('already_reversed', true); END IF;

  IF coupon.uses_used < 1 THEN RAISE EXCEPTION 'El cupón no registra usos que devolver'; END IF;
  remaining_used := coupon.uses_used - 1;
  next_status := CASE
    WHEN coupon.status = 'revoked' THEN 'revoked'
    WHEN remaining_used >= campaign.uses_per_user THEN 'redeemed'
    ELSE 'available'
  END;
  UPDATE public.athlete_coupons SET
    uses_used = remaining_used,
    status = next_status,
    redeemed_at = CASE WHEN next_status = 'redeemed' THEN coalesce((
      SELECT max(r.redeemed_at) FROM public.benefit_redemptions r
      WHERE r.coupon_id = target_coupon
        AND NOT EXISTS (SELECT 1 FROM public.benefit_redemption_reversals rv WHERE rv.redemption_id = r.id)
    ), coupon.redeemed_at, now()) ELSE NULL END
  WHERE id = target_coupon;

  RETURN jsonb_build_object(
    'already_reversed', false,
    'can_redeem', next_status = 'available' AND campaign.state = 'active' AND coupon.expires_at > now()
  );
END
$fn$;

REVOKE ALL ON FUNCTION public.super_admin_benefit_redemptions(text, uuid, text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.super_admin_reverse_benefit_redemption(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.super_admin_benefit_redemptions(text, uuid, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.super_admin_reverse_benefit_redemption(text, uuid) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
