BEGIN;
CREATE TABLE public.athlete_folio_access(
 lead_id uuid PRIMARY KEY REFERENCES public.leads(id),folio text NOT NULL UNIQUE,pin_hash text NOT NULL,
 failed_attempts integer NOT NULL DEFAULT 0,attempt_window timestamptz NOT NULL DEFAULT now(),
 token_hash text,token_expires_at timestamptz,profile_draft jsonb NOT NULL DEFAULT '{}',prepared_at timestamptz,
 pending_user_id uuid UNIQUE REFERENCES auth.users(id),claimed_user_id uuid REFERENCES auth.users(id),claimed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.athlete_folio_access ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.athlete_folio_access FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.athlete_folio_access TO service_role;

CREATE FUNCTION public.athlete_folio_begin(p_folio text,p_pin text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE a public.athlete_folio_access; ticket text;
BEGIN
 SELECT * INTO a FROM public.athlete_folio_access WHERE folio=upper(trim(p_folio)) FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','Folio o PIN incorrectos.'); END IF;
 IF a.claimed_at IS NOT NULL THEN RETURN jsonb_build_object('error','Este folio ya fue activado. Entra con tu correo y contraseña personal.'); END IF;
 IF a.attempt_window<now()-interval '15 minutes' THEN a.failed_attempts:=0; UPDATE public.athlete_folio_access SET failed_attempts=0,attempt_window=now() WHERE lead_id=a.lead_id; END IF;
 IF a.failed_attempts>=5 THEN RETURN jsonb_build_object('error','Demasiados intentos. Espera 15 minutos para volver a intentar.'); END IF;
 IF a.pin_hash<>crypt(coalesce(p_pin,''),a.pin_hash) THEN UPDATE public.athlete_folio_access SET failed_attempts=failed_attempts+1 WHERE lead_id=a.lead_id; RETURN jsonb_build_object('error','Folio o PIN incorrectos.'); END IF;
 ticket:=encode(gen_random_bytes(32),'hex');
 UPDATE public.athlete_folio_access SET failed_attempts=0,token_hash=encode(digest(ticket,'sha256'),'hex'),token_expires_at=now()+interval '2 hours' WHERE lead_id=a.lead_id;
 RETURN jsonb_build_object('ticket',ticket);
END $$;

CREATE FUNCTION public.athlete_folio_context(p_ticket text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE a public.athlete_folio_access;l public.leads;
BEGIN
 SELECT * INTO a FROM public.athlete_folio_access WHERE token_hash=encode(digest(coalesce(p_ticket,''),'sha256'),'hex') AND token_expires_at>now() AND claimed_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tu acceso temporal venció. Vuelve a entrar con tu folio y PIN.' USING ERRCODE='42501'; END IF;
 SELECT * INTO l FROM public.leads WHERE id=a.lead_id;
 RETURN jsonb_build_object('folio',a.folio,'first_name',coalesce(a.profile_draft->>'first_name',l.first_name),'last_name',coalesce(a.profile_draft->>'last_name',l.last_name),'phone',coalesce(a.profile_draft->>'phone',l.phone),'email',a.profile_draft->>'email','username',a.profile_draft->>'username','pending',a.pending_user_id IS NOT NULL);
END $$;

CREATE FUNCTION public.athlete_folio_prepare(p_ticket text,p_profile jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE a public.athlete_folio_access; v_email text:=lower(trim(p_profile->>'email'));v_username text:=lower(trim(p_profile->>'username'));v_first_name text:=trim(p_profile->>'first_name');v_last_name text:=trim(p_profile->>'last_name');v_phone text:=trim(p_profile->>'phone');
BEGIN
 SELECT * INTO a FROM public.athlete_folio_access WHERE token_hash=encode(digest(coalesce(p_ticket,''),'sha256'),'hex') AND token_expires_at>now() AND claimed_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Tu acceso temporal venció. Vuelve a entrar con tu folio y PIN.' USING ERRCODE='42501'; END IF;
 IF v_first_name IS NULL OR length(v_first_name) NOT BETWEEN 1 AND 80 OR v_last_name IS NULL OR length(v_last_name) NOT BETWEEN 1 AND 100 OR v_phone IS NULL OR length(regexp_replace(v_phone,'[^0-9]','','g')) NOT BETWEEN 10 AND 15 THEN RAISE EXCEPTION 'Completa tu nombre, apellidos y teléfono válido.'; END IF;
 IF v_email IS NULL OR length(v_email)>254 OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN RAISE EXCEPTION 'Escribe un correo propio válido.'; END IF;
 IF v_username IS NULL OR v_username !~ '^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$' THEN RAISE EXCEPTION 'El username debe tener entre 3 y 30 caracteres: letras, números, puntos o guion bajo.'; END IF;
 IF EXISTS(SELECT 1 FROM public.athlete_profiles p WHERE p.username=v_username AND p.user_id IS DISTINCT FROM a.pending_user_id) THEN RAISE EXCEPTION 'Ese username ya está ocupado. Elige otro.'; END IF;
 IF EXISTS(SELECT 1 FROM auth.users u WHERE lower(u.email)=v_email AND u.id IS DISTINCT FROM a.pending_user_id) THEN RAISE EXCEPTION 'Ese correo ya tiene una cuenta. Usa un correo propio diferente para este acceso provisional.'; END IF;
 IF a.pending_user_id IS NOT NULL AND a.profile_draft->>'email'<>v_email THEN RAISE EXCEPTION 'Ya hay una verificación pendiente. Confirma el correo que elegiste para continuar.'; END IF;
 UPDATE public.athlete_folio_access SET profile_draft=jsonb_build_object('first_name',v_first_name,'last_name',v_last_name,'phone',v_phone,'email',v_email,'username',v_username),prepared_at=coalesce(prepared_at,now()) WHERE lead_id=a.lead_id;
 RETURN jsonb_build_object('activation_id',a.lead_id);
END $$;

CREATE FUNCTION public.athlete_folio_bind_pending(p_ticket text,p_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE a public.athlete_folio_access;
BEGIN
 SELECT * INTO a FROM public.athlete_folio_access WHERE token_hash=encode(digest(coalesce(p_ticket,''),'sha256'),'hex') AND token_expires_at>now() AND claimed_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Acceso temporal inválido' USING ERRCODE='42501'; END IF;
 IF a.pending_user_id IS NOT NULL AND a.pending_user_id<>p_user_id THEN RAISE EXCEPTION 'El folio ya tiene una activación pendiente'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=p_user_id AND lower(u.email)=a.profile_draft->>'email' AND u.created_at>=a.prepared_at AND u.raw_user_meta_data->>'folio_activation_id'=a.lead_id::text) THEN RAISE EXCEPTION 'No pudimos vincular el registro del correo. Intenta nuevamente.' USING ERRCODE='42501'; END IF;
 UPDATE public.athlete_folio_access SET pending_user_id=p_user_id WHERE lead_id=a.lead_id;
END $$;

CREATE FUNCTION public.athlete_folio_complete() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.athlete_folio_access;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Primero confirma tu correo e inicia sesión.' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.athlete_folio_access WHERE pending_user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No hay una inscripción pendiente para esta cuenta.'; END IF;
 IF a.claimed_at IS NOT NULL THEN RETURN jsonb_build_object('folio',a.folio,'complete',true); END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL AND lower(u.email)=a.profile_draft->>'email' AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=now())) THEN RAISE EXCEPTION 'Confirma el correo que registraste antes de activar tus beneficios.' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.registration_athlete_links WHERE lead_id=a.lead_id AND user_id<>auth.uid()) THEN RAISE EXCEPTION 'Esta inscripción ya está vinculada a otra cuenta. Contacta a Dorsalia.'; END IF;
 INSERT INTO public.athlete_profiles(user_id,first_name,last_name,phone,username) VALUES(auth.uid(),a.profile_draft->>'first_name',a.profile_draft->>'last_name',a.profile_draft->>'phone',a.profile_draft->>'username') ON CONFLICT(user_id) DO UPDATE SET first_name=excluded.first_name,last_name=excluded.last_name,phone=excluded.phone,username=excluded.username;
 INSERT INTO public.registration_athlete_links(lead_id,user_id,source) VALUES(a.lead_id,auth.uid(),'Coffee Run: activación propia por folio y correo verificado') ON CONFLICT(lead_id) DO NOTHING;
 UPDATE auth.users SET raw_user_meta_data=raw_user_meta_data||jsonb_build_object('first_name',a.profile_draft->>'first_name','last_name',a.profile_draft->>'last_name','username',a.profile_draft->>'username','athlete_onboarding_done',true,'profile_setup_required',false,'folio_activation_pending',false) WHERE id=auth.uid();
 UPDATE public.athlete_folio_access SET claimed_user_id=auth.uid(),claimed_at=now(),token_hash=NULL,token_expires_at=NULL WHERE lead_id=a.lead_id;
 RETURN jsonb_build_object('folio',a.folio,'complete',true);
END $$;

REVOKE ALL ON FUNCTION public.athlete_folio_begin(text,text),public.athlete_folio_context(text),public.athlete_folio_prepare(text,jsonb),public.athlete_folio_bind_pending(text,uuid),public.athlete_folio_complete() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.athlete_folio_begin(text,text),public.athlete_folio_context(text),public.athlete_folio_prepare(text,jsonb),public.athlete_folio_bind_pending(text,uuid) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.athlete_folio_complete() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
