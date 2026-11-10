CREATE TABLE IF NOT EXISTS public.activity_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.activity_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT activity_post_comments_body_len CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS activity_post_comments_post_idx
  ON public.activity_post_comments(post_id, created_at);

ALTER TABLE public.activity_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_post_comments_read ON public.activity_post_comments;
CREATE POLICY activity_post_comments_read ON public.activity_post_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.activity_posts a WHERE a.id = post_id AND a.is_published = true)
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS activity_post_comments_insert ON public.activity_post_comments;
CREATE POLICY activity_post_comments_insert ON public.activity_post_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.activity_posts a WHERE a.id = post_id AND a.is_published = true)
  );

DROP POLICY IF EXISTS activity_post_comments_delete ON public.activity_post_comments;
CREATE POLICY activity_post_comments_delete ON public.activity_post_comments
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT ON public.activity_post_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.activity_post_comments TO authenticated;

INSERT INTO public.activity_post_comments (post_id, user_id, body, created_at)
SELECT cp.activity_post_id, c.user_id, btrim(c.body), c.created_at
FROM public.creator_publication_comments c
JOIN public.creator_publications cp ON cp.id = c.publication_id
WHERE cp.activity_post_id IS NOT NULL
  AND char_length(btrim(c.body)) BETWEEN 1 AND 2000
  AND NOT EXISTS (
    SELECT 1 FROM public.activity_post_comments existing
    WHERE existing.post_id = cp.activity_post_id
      AND existing.user_id = c.user_id
      AND existing.created_at = c.created_at
  );

CREATE OR REPLACE FUNCTION public.public_activity_feed(p_user_id uuid DEFAULT NULL, p_limit integer DEFAULT 50, p_following_only boolean DEFAULT false)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY created_at DESC), '[]'::jsonb)
  FROM (
    SELECT a.created_at, jsonb_build_object(
      'id', a.id, 'post_type', a.post_type, 'body', a.body, 'created_at', a.created_at,
      'user_id', a.user_id, 'username', p.username,
      'display_name', COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Corredor Dorsalia'),
      'avatar_url', p.avatar_url, 'race_event_id', a.race_event_id, 'review_id', a.review_id,
      'creator_publication_id', cp.id, 'gallery_name', cp.gallery_name,
      'mine', a.user_id = auth.uid(),
      'event_name', e.name, 'event_slug', COALESCE(e.public_subdomain, e.slug),
      'event_cover_url', e.cover_image_url, 'rating', r.rating,
      'like_count', (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.reaction_type = 'like'),
      'repost_count', (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.reaction_type = 'repost'),
      'comment_count', (SELECT count(*) FROM public.activity_post_comments c WHERE c.post_id = a.id),
      'liked', EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'like'),
      'reposted', EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'repost'),
      'photos', CASE WHEN a.post_type = 'review' THEN COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
        FROM public.event_review_photos ph WHERE ph.review_id = a.review_id
      ), '[]'::jsonb) WHEN a.post_type = 'creator' THEN COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
        FROM public.creator_photos ph WHERE ph.publication_id = cp.id
      ), '[]'::jsonb) ELSE COALESCE((
        SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
        FROM public.activity_post_photos ph WHERE ph.post_id = a.id
      ), '[]'::jsonb) END
    ) AS row_data
    FROM public.activity_posts a
    JOIN public.athlete_profiles p ON p.user_id = a.user_id
    LEFT JOIN public.race_events e ON e.id = a.race_event_id
    LEFT JOIN public.event_reviews r ON r.id = a.review_id
    LEFT JOIN public.creator_publications cp ON cp.activity_post_id = a.id AND cp.status = 'published'
    WHERE a.is_published = true
      AND (a.post_type <> 'creator' OR cp.id IS NOT NULL)
      AND (p_user_id IS NULL OR a.user_id = p_user_id)
      AND (
        NOT p_following_only OR
        (auth.uid() IS NOT NULL AND (
          a.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.social_follows f
            WHERE f.follower_id = auth.uid() AND f.following_id = a.user_id
          )
        ))
      )
    ORDER BY a.created_at DESC LIMIT LEAST(GREATEST(p_limit, 1), 100)
  ) feed;
$$;

REVOKE ALL ON FUNCTION public.public_activity_feed(uuid, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_activity_feed(uuid, integer, boolean) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.public_activity_post(p_post_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'id', a.id, 'post_type', a.post_type, 'body', a.body, 'created_at', a.created_at,
    'user_id', a.user_id, 'username', p.username,
    'display_name', COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Corredor Dorsalia'),
    'avatar_url', p.avatar_url, 'race_event_id', a.race_event_id, 'review_id', a.review_id,
    'creator_publication_id', cp.id, 'gallery_name', cp.gallery_name,
    'mine', a.user_id = auth.uid(),
    'event_name', e.name, 'event_slug', COALESCE(e.public_subdomain, e.slug),
    'event_cover_url', e.cover_image_url, 'rating', r.rating,
    'like_count', (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.reaction_type = 'like'),
    'repost_count', (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.reaction_type = 'repost'),
    'comment_count', (SELECT count(*) FROM public.activity_post_comments c WHERE c.post_id = a.id),
    'liked', EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'like'),
    'reposted', EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = a.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'repost'),
    'photos', CASE WHEN a.post_type = 'review' THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
      FROM public.event_review_photos ph WHERE ph.review_id = a.review_id
    ), '[]'::jsonb) WHEN a.post_type = 'creator' THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
      FROM public.creator_photos ph WHERE ph.publication_id = cp.id
    ), '[]'::jsonb) ELSE COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url, 'storage_path', CASE WHEN a.user_id = auth.uid() THEN ph.storage_path ELSE NULL END, 'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
      FROM public.activity_post_photos ph WHERE ph.post_id = a.id
    ), '[]'::jsonb) END
  )
  FROM public.activity_posts a
  JOIN public.athlete_profiles p ON p.user_id = a.user_id
  LEFT JOIN public.race_events e ON e.id = a.race_event_id
  LEFT JOIN public.event_reviews r ON r.id = a.review_id
  LEFT JOIN public.creator_publications cp ON cp.activity_post_id = a.id AND cp.status = 'published'
  WHERE a.id = p_post_id AND a.is_published = true
    AND (a.post_type <> 'creator' OR cp.id IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION public.public_activity_post(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_activity_post(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.public_activity_post_comments(p_post_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY created_at ASC), '[]'::jsonb)
  FROM (
    SELECT c.created_at, jsonb_build_object(
      'id', c.id, 'body', c.body, 'created_at', c.created_at, 'user_id', c.user_id,
      'username', NULLIF(p.username, ''),
      'display_name', COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Corredor Dorsalia'),
      'avatar_url', p.avatar_url,
      'mine', c.user_id = auth.uid()
    ) AS row_data
    FROM public.activity_post_comments c
    JOIN public.activity_posts a ON a.id = c.post_id AND a.is_published = true
    LEFT JOIN public.athlete_profiles p ON p.user_id = c.user_id
    WHERE c.post_id = p_post_id
    ORDER BY c.created_at ASC
    LIMIT 200
  ) comments;
$$;

REVOKE ALL ON FUNCTION public.public_activity_post_comments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_activity_post_comments(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.public_event_reviews(p_race_event_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH rated AS (
    SELECT r.* FROM public.event_reviews r
    WHERE r.race_event_id = p_race_event_id AND r.is_published = true
  ), review_rows AS (
    SELECT v.id, v.user_id AS author_user_id, v.rating, v.comment, v.created_at, v.updated_at,
      v.entry_type, v.has_photos,
      (v.user_id = auth.uid()) AS mine,
      COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Corredor Dorsalia') AS author_name,
      p.username AS author_username, p.avatar_url AS author_avatar_url, ap.id AS activity_post_id,
      (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.reaction_type = 'like') AS like_count,
      (SELECT count(*) FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.reaction_type = 'repost') AS repost_count,
      (SELECT count(*) FROM public.activity_post_comments c WHERE c.post_id = ap.id) AS comment_count,
      EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'like') AS liked,
      EXISTS (SELECT 1 FROM public.activity_post_reactions ar WHERE ar.post_id = ap.id AND ar.user_id = auth.uid() AND ar.reaction_type = 'repost') AS reposted,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', ph.id, 'image_url', ph.image_url,
        'storage_path', CASE WHEN v.user_id = auth.uid() THEN ph.storage_path ELSE NULL END,
        'sort_order', ph.sort_order) ORDER BY ph.sort_order, ph.created_at)
        FROM public.event_review_photos ph WHERE ph.review_id = v.id), '[]'::jsonb) AS photos
    FROM rated v
    LEFT JOIN public.athlete_profiles p ON p.user_id = v.user_id
    LEFT JOIN public.activity_posts ap ON ap.review_id = v.id
    WHERE v.entry_type = 'review'
  )
  SELECT jsonb_build_object(
    'average', COALESCE((SELECT round(avg(rating)::numeric, 1) FROM rated), 0),
    'count', (SELECT count(*) FROM rated),
    'review_count', (SELECT count(*) FROM rated WHERE entry_type = 'review'),
    'my_rating', (SELECT rating FROM rated WHERE user_id = auth.uid() LIMIT 1),
    'my_entry_type', (SELECT entry_type FROM rated WHERE user_id = auth.uid() LIMIT 1),
    'reviews', COALESCE((SELECT jsonb_agg(to_jsonb(review_rows) ORDER BY mine DESC, created_at DESC)
      FROM review_rows), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.public_event_reviews(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_event_reviews(uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
