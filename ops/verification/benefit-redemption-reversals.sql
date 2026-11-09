BEGIN;
DO $test$
DECLARE
  owner_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid();
  campaign_id uuid;
  coupon_id uuid;
  first_request uuid := gen_random_uuid();
  second_request uuid := gen_random_uuid();
  first_redemption uuid;
  second_redemption uuid;
  admin_pin text;
  result jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.super_admin_benefit_redemptions(text,uuid,text,text,integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.super_admin_reverse_benefit_redemption(text,uuid)', 'EXECUTE')
    OR has_table_privilege('authenticated', 'public.benefit_redemption_reversals', 'SELECT') THEN
    RAISE EXCEPTION 'Acceso público inesperado';
  END IF;
  -- Read the current testable PIN internally; do not log or return it.
  SELECT (regexp_match(pg_get_functiondef('public._super_admin_pin_ok(text)'::regprocedure), $$= '([0-9]+)'$$))[1] INTO admin_pin;
  IF NOT coalesce(public._super_admin_pin_ok(admin_pin), false) THEN RAISE EXCEPTION 'PIN de prueba no disponible'; END IF;

  INSERT INTO auth.users(id,email,email_confirmed_at,created_at,raw_user_meta_data)
  VALUES (owner_id,owner_id::text||'@example.invalid',now(),now(),'{"full_name":"Persona QA"}'),
         (admin_id,admin_id::text||'@example.invalid',now(),now(),'{}');
  INSERT INTO public.benefit_campaigns(slug,merchant_name,title,description,terms,benefit_type,state,starts_at,ends_at,uses_per_user)
  VALUES ('qa-canje-'||owner_id,'QA','Cupón QA','','','other','active',now()-interval '1 hour',now()+interval '1 day',2)
  RETURNING id INTO campaign_id;

  INSERT INTO public.athlete_coupons(user_id,campaign_id,expires_at,grant_reason)
  VALUES (owner_id,campaign_id,now()+interval '1 hour','Verificación') RETURNING id INTO coupon_id;
  PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
  PERFORM public.athlete_redeem_benefit_coupon(coupon_id,first_request);
  result := public.athlete_redeem_benefit_coupon(coupon_id,second_request);
  IF result->>'status' IS DISTINCT FROM 'redeemed' THEN RAISE EXCEPTION 'Estado inicial incorrecto'; END IF;
  SELECT id INTO first_redemption FROM public.benefit_redemptions WHERE request_id=first_request;
  SELECT id INTO second_redemption FROM public.benefit_redemptions WHERE request_id=second_request;
  BEGIN
    PERFORM public.super_admin_reverse_benefit_redemption('incorrecto',first_redemption);
    RAISE EXCEPTION 'Revocación sin PIN admitida';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub','',true);
  BEGIN
    PERFORM public.super_admin_benefit_redemptions(admin_pin,campaign_id);
    RAISE EXCEPTION 'Historial sin sesión admitido';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  result := public.super_admin_benefit_redemptions(admin_pin,campaign_id,'active','persona qa');
  IF jsonb_array_length(result) <> 2 THEN RAISE EXCEPTION 'Faltan canjes o falla la búsqueda'; END IF;
  result := public.super_admin_reverse_benefit_redemption(admin_pin,first_redemption);
  IF result->>'can_redeem' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'No se reactivó el uso'; END IF;
  result := public.super_admin_reverse_benefit_redemption(admin_pin,first_redemption);
  IF result->>'already_reversed' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'No detecta la segunda revocación'; END IF;
  IF (SELECT c.uses_used FROM public.athlete_coupons c WHERE c.id=coupon_id) <> 1 THEN
    RAISE EXCEPTION 'No devolvió exactamente un uso';
  END IF;
  result := public.super_admin_benefit_redemptions(admin_pin,campaign_id,'reversed');
  IF jsonb_array_length(result) <> 1 OR result->0->>'id' IS DISTINCT FROM first_redemption::text
     OR NOT EXISTS (SELECT 1 FROM public.benefit_redemption_reversals WHERE redemption_id=first_redemption AND reversed_by=admin_id) THEN
    RAISE EXCEPTION 'Falta auditoría del canje revocado';
  END IF;

  PERFORM set_config('request.jwt.claim.sub',owner_id::text,true);
  result := public.athlete_redeem_benefit_coupon(coupon_id,first_request);
  IF result->>'uses_remaining' IS DISTINCT FROM '1' THEN RAISE EXCEPTION 'La repetición del request original gastó el uso'; END IF;
  result := public.athlete_redeem_benefit_coupon(coupon_id,gen_random_uuid());
  IF result->>'status' IS DISTINCT FROM 'redeemed' THEN RAISE EXCEPTION 'No se pudo volver a canjear'; END IF;

  UPDATE public.athlete_coupons SET issued_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' WHERE id=coupon_id;
  PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
  result := public.super_admin_reverse_benefit_redemption(admin_pin,second_redemption);
  IF result->>'can_redeem' IS DISTINCT FROM 'false'
    OR (SELECT c.expires_at FROM public.athlete_coupons c WHERE c.id=coupon_id) IS DISTINCT FROM now()-interval '1 hour' THEN
    RAISE EXCEPTION 'La revocación cambió la vigencia';
  END IF;
  RAISE NOTICE 'PASS: permisos, historial y búsqueda, uso recuperado, revocación única y auditada, recanje y vigencia';
END
$test$;
ROLLBACK;
