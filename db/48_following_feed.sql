DROP FUNCTION IF EXISTS public.public_activity_feed(uuid, integer);

CREATE FUNCTION public.public_activity_feed(
  p_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_following_only boolean DEFAULT false
)
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
    WHERE a.is_published = true
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
NOTIFY pgrst, 'reload schema';
