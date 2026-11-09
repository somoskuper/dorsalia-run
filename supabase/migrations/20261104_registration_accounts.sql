BEGIN;
CREATE TABLE public.registration_athlete_links(lead_id uuid PRIMARY KEY REFERENCES public.leads(id),user_id uuid NOT NULL REFERENCES auth.users(id),created_at timestamptz NOT NULL DEFAULT now(),source text NOT NULL);
ALTER TABLE public.registration_athlete_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registration_athlete_links FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.registration_athlete_links TO authenticated;
CREATE POLICY registration_athlete_owner ON public.registration_athlete_links FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.athlete_password_setup(user_id uuid PRIMARY KEY REFERENCES auth.users(id),initial_hash text NOT NULL,completed_at timestamptz);
ALTER TABLE public.athlete_password_setup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.athlete_password_setup FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.athlete_complete_password_setup() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item public.athlete_password_setup;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicia sesión' USING ERRCODE='42501'; END IF;
 SELECT * INTO item FROM public.athlete_password_setup WHERE user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF item.completed_at IS NOT NULL THEN RETURN; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND encrypted_password IS DISTINCT FROM item.initial_hash) THEN RAISE EXCEPTION 'Primero cambia tu contraseña'; END IF;
 UPDATE public.athlete_password_setup SET completed_at=now() WHERE user_id=auth.uid();
 UPDATE auth.users SET raw_app_meta_data=raw_app_meta_data-'temporary_password_required' WHERE id=auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.athlete_complete_password_setup() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.athlete_complete_password_setup() TO authenticated;
DO $$ DECLARE s text;BEGIN
 SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='athlete_my_registrations';
 s:=replace(s,'AND l.user_id = auth.uid()', 'AND (l.user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.registration_athlete_links al WHERE al.lead_id=l.id AND al.user_id=auth.uid()))');EXECUTE s;
 SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='benefit_sync_user';
 s:=replace(s,'FROM public.leads l\n      WHERE l.user_id = p_user_id','FROM public.leads l LEFT JOIN public.registration_athlete_links al ON al.lead_id=l.id\n      WHERE coalesce(al.user_id,l.user_id) = p_user_id');
 -- PostgreSQL strings here must contain actual newlines.
 s:=replace(s,E'FROM public.leads l\n      WHERE l.user_id = p_user_id',E'FROM public.leads l LEFT JOIN public.registration_athlete_links al ON al.lead_id=l.id\n      WHERE coalesce(al.user_id,l.user_id) = p_user_id'); EXECUTE s;
 SELECT pg_get_functiondef(oid) INTO s FROM pg_proc WHERE proname='benefit_release_due';
 s:=replace(s,'SELECT DISTINCT l.user_id FROM public.leads l','SELECT DISTINCT coalesce(al.user_id,l.user_id) AS user_id FROM public.leads l LEFT JOIN public.registration_athlete_links al ON al.lead_id=l.id');
 s:=replace(s,'WHERE l.user_id IS NOT NULL','WHERE coalesce(al.user_id,l.user_id) IS NOT NULL');
 s:=replace(s,'c.user_id=l.user_id','c.user_id=coalesce(al.user_id,l.user_id)');EXECUTE s;
END $$;
CREATE FUNCTION public.benefit_registration_link_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN PERFORM public.benefit_sync_user(NEW.user_id); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.benefit_registration_link_sync() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER benefit_registration_link_sync AFTER INSERT OR UPDATE ON public.registration_athlete_links FOR EACH ROW EXECUTE FUNCTION public.benefit_registration_link_sync();
GRANT ALL ON public.registration_athlete_links,public.athlete_password_setup TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
