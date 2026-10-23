CREATE TABLE IF NOT EXISTS public.activity_post_reactions (
  post_id uuid NOT NULL REFERENCES public.activity_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'repost')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS activity_post_reactions_post_idx
  ON public.activity_post_reactions(post_id, reaction_type);

ALTER TABLE public.activity_post_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS activity_post_reactions_read ON public.activity_post_reactions;
CREATE POLICY activity_post_reactions_read ON public.activity_post_reactions FOR SELECT USING (true);
DROP POLICY IF EXISTS activity_post_reactions_insert ON public.activity_post_reactions;
CREATE POLICY activity_post_reactions_insert ON public.activity_post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS activity_post_reactions_delete ON public.activity_post_reactions;
CREATE POLICY activity_post_reactions_delete ON public.activity_post_reactions FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT ON public.activity_post_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.activity_post_reactions TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_activity_reaction(p_post_id uuid, p_reaction_type text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR p_reaction_type NOT IN ('like', 'repost') THEN RETURN false; END IF;
  IF EXISTS (
    SELECT 1 FROM public.activity_post_reactions
    WHERE post_id = p_post_id AND user_id = auth.uid() AND reaction_type = p_reaction_type
  ) THEN
    DELETE FROM public.activity_post_reactions
    WHERE post_id = p_post_id AND user_id = auth.uid() AND reaction_type = p_reaction_type;
    RETURN false;
  END IF;
  INSERT INTO public.activity_post_reactions(post_id, user_id, reaction_type)
  VALUES (p_post_id, auth.uid(), p_reaction_type) ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_activity_reaction(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_activity_reaction(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.public_activity_feed(p_user_id uuid DEFAULT NULL, p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY created_at DESC), '[]'::jsonb)
  FROM (
    SELECT a.created_at, jsonb_build_object(
      'id', a.id, 'post_type', a.post_type, 'body', a.body, 'created_at', a.created_at,
      'user_id', a.user_id, 'username', p.username,
      'display_name', COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Corredor Dorsalia'),
      'avatar_url', p.avatar_url, 'race_event_id', a.race_event_id, 'review_id', a.review_id,
      'mine', a.user_id = auth.uid(),
      'event_name', e.name, 'event_slug', COALESCE(e.public_subdomain, e.slug),
      'event_cover_url', e.cover_image_url, 'rating', r.rating,
      'like_count', (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.reaction_type = 'like'),
      'repost_count', (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.reaction_type = 'repost'),
      'liked', EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'like'),
      'reposted', EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'repost'),
      'photos', CASE WHEN a.post_type = 'review' THEN COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
        FROM public.event_review_photos ph WHERE ph.review_id = a.review_id
      ), '[]'::jsonb) ELSE COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
        FROM public.activity_post_photos ph WHERE ph.post_id = a.id
      ), '[]'::jsonb) END
    ) AS row_data
    FROM public.activity_posts a
    JOIN public.athlete_profiles p ON p.user_id = a.user_id
    LEFT JOIN public.race_events e ON e.id = a.race_event_id
    LEFT JOIN public.event_reviews r ON r.id = a.review_id
    WHERE a.is_published = true AND (p_user_id IS NULL OR a.user_id = p_user_id)
    ORDER BY a.created_at DESC LIMIT LEAST(GREATEST(p_limit, 1), 100)
  ) feed;
$$;

CREATE OR REPLACE FUNCTION public.public_event_reviews(p_race_event_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH visible AS (
    SELECT r.* FROM public.event_reviews r
    WHERE r.race_event_id = p_race_event_id AND r.is_published = true
  ), review_rows AS (
    SELECT v.id, v.user_id AS author_user_id, v.rating, v.comment, v.created_at, v.updated_at,
      (v.user_id = auth.uid()) AS mine,
      COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Corredor Dorsalia') AS author_name,
      p.username AS author_username, p.avatar_url AS author_avatar_url, ap.id AS activity_post_id,
      (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.reaction_type = 'like') AS like_count,
      (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.reaction_type = 'repost') AS repost_count,
      EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'like') AS liked,
      EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'repost') AS reposted,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN v.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at) FROM public.event_review_photos ph WHERE ph.review_id = v.id), '[]'::jsonb) AS photos
    FROM visible v
    LEFT JOIN public.athlete_profiles p ON p.user_id = v.user_id
    LEFT JOIN public.activity_posts ap ON ap.review_id = v.id
  )
  SELECT jsonb_build_object(
    'average', COALESCE((SELECT round(avg(rating)::numeric, 1) FROM visible), 0),
    'count', (SELECT count(*) FROM visible),
    'reviews', COALESCE((SELECT jsonb_agg(to_jsonb(review_rows) ORDER BY mine DESC, created_at DESC) FROM review_rows), '[]'::jsonb)
  );
$$;

DROP POLICY IF EXISTS activity_photos_storage_upload_own ON storage.objects;
CREATE POLICY activity_photos_storage_upload_own ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'public-image' AND (storage.foldername(name))[1] = 'activity' AND (storage.foldername(name))[2] = auth.uid()::text);
DROP POLICY IF EXISTS activity_photos_storage_update_own ON storage.objects;
CREATE POLICY activity_photos_storage_update_own ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'public-image' AND (storage.foldername(name))[1] = 'activity' AND (storage.foldername(name))[2] = auth.uid()::text)
WITH CHECK (bucket_id = 'public-image' AND (storage.foldername(name))[1] = 'activity' AND (storage.foldername(name))[2] = auth.uid()::text);
DROP POLICY IF EXISTS activity_photos_storage_delete_own ON storage.objects;
CREATE POLICY activity_photos_storage_delete_own ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'public-image' AND (storage.foldername(name))[1] = 'activity' AND (storage.foldername(name))[2] = auth.uid()::text);

GRANT EXECUTE ON FUNCTION public.public_activity_feed(uuid, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_event_reviews(uuid) TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
