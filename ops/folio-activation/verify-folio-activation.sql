BEGIN;
DO $$
DECLARE a public.athlete_folio_access;t text;j jsonb;n integer;u uuid:=gen_random_uuid();qa text:='qa-folio-'||replace(gen_random_uuid()::text,'-','')||'@example.invalid';bad boolean;
BEGIN
 IF (SELECT count(*) FROM athlete_folio_access)<>22 THEN RAISE EXCEPTION 'No hay 22 accesos';END IF;
 IF has_table_privilege('anon','public.athlete_folio_access','select') OR has_table_privilege('authenticated','public.athlete_folio_access','update') THEN RAISE EXCEPTION 'Permisos de tabla incorrectos';END IF;
 IF has_function_privilege('anon','public.athlete_folio_complete()','execute') THEN RAISE EXCEPTION 'Activación anónima permitida';END IF;
 FOR a IN SELECT * FROM athlete_folio_access LOOP
 j:=athlete_folio_begin(a.folio,'56484');t:=j->>'ticket';IF t IS NULL THEN RAISE EXCEPTION 'PIN incorrecto para %',a.folio;END IF;
 j:=athlete_folio_context(t);IF j->>'folio'<>a.folio OR nullif(j->>'first_name','') IS NULL THEN RAISE EXCEPTION 'Contexto incorrecto';END IF;
 END LOOP;
 SELECT * INTO a FROM athlete_folio_access WHERE folio='CRD-C8FF7E';
 UPDATE athlete_folio_access SET failed_attempts=0,attempt_window=now() WHERE lead_id=a.lead_id;
 FOR n IN 1..5 LOOP j:=athlete_folio_begin(a.folio,'incorrecto');END LOOP;
 IF athlete_folio_begin(a.folio,'56484')->>'ticket' IS NOT NULL THEN RAISE EXCEPTION 'No bloquea intentos';END IF;
 UPDATE athlete_folio_access SET attempt_window=now()-interval '16 minutes' WHERE lead_id=a.lead_id;
 t:=athlete_folio_begin(a.folio,'56484')->>'ticket';IF t IS NULL THEN RAISE EXCEPTION 'No recupera intentos';END IF;
 BEGIN PERFORM athlete_folio_context('invalido');RAISE EXCEPTION 'Acepta ticket inválido';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM athlete_folio_prepare(t,jsonb_build_object('first_name','QA','last_name','QA','phone','+529811000000','email','anagestion2024@gmail.com','username','qa_folio_access'));RAISE EXCEPTION 'Acepta correo repetido';EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Ese correo ya tiene%' THEN RAISE;END IF;END;
 j:=athlete_folio_prepare(t,jsonb_build_object('first_name','QA','last_name','QA','phone','+529811000000','email',qa,'username','qa_folio_'||substr(u::text,1,8)));
 INSERT INTO auth.users(id,aud,role,email,created_at,updated_at,raw_user_meta_data) VALUES(u,'authenticated','authenticated',qa,now(),now(),jsonb_build_object('folio_activation_id',a.lead_id));
 PERFORM athlete_folio_bind_pending(t,u);
 PERFORM set_config('request.jwt.claim.sub',u::text,true);
 BEGIN PERFORM athlete_folio_complete();RAISE EXCEPTION 'Activa sin confirmar';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 IF EXISTS(SELECT 1 FROM registration_athlete_links WHERE user_id=u) THEN RAISE EXCEPTION 'Vincula prematuramente';END IF;
 UPDATE auth.users SET email_confirmed_at=now() WHERE id=u;
 j:=athlete_folio_complete();PERFORM athlete_folio_complete();
 IF NOT EXISTS(SELECT 1 FROM registration_athlete_links WHERE user_id=u AND lead_id=a.lead_id) THEN RAISE EXCEPTION 'No asocia folio';END IF;
 IF NOT EXISTS(SELECT 1 FROM athlete_profiles WHERE user_id=u AND username IS NOT NULL) THEN RAISE EXCEPTION 'No crea username';END IF;
 IF NOT EXISTS(SELECT 1 FROM athlete_my_registrations() AS x(data) WHERE data->>'id'=a.lead_id::text) THEN RAISE EXCEPTION 'No aparece inscripción';END IF;
 IF athlete_folio_begin(a.folio,'56484')->>'ticket' IS NOT NULL THEN RAISE EXCEPTION 'Permite reutilizar PIN después de activar';END IF;
 RAISE NOTICE 'PASS: 22 PIN, acceso limitado, bloqueo por intentos, correo propio, verificación obligatoria, username, vínculo e idempotencia';
END $$;
ROLLBACK;
