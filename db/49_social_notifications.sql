CREATE TABLE IF NOT EXISTS public.social_notification_reads (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.social_notification_reads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS social_notification_reads_own ON public.social_notification_reads;
CREATE POLICY social_notification_reads_own ON public.social_notification_reads
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.social_notification_reads TO authenticated;

CREATE OR REPLACE FUNCTION public.public_follow_list(p_user_id uuid, p_kind text, p_limit integer DEFAULT 100)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT COALESCE(jsonb_agg(person ORDER BY created_at DESC), '[]'::jsonb)
  FROM (
    SELECT f.created_at, jsonb_build_object(
      'user_id', u.id,
      'username', NULLIF(p.username, ''),
      'display_name', COALESCE(
        NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'name'), ''),
        'Corredor Dorsalia'
      ),
      'avatar_url', COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
    ) AS person
    FROM public.social_follows f
    JOIN auth.users u ON u.id = CASE WHEN p_kind = 'followers' THEN f.follower_id ELSE f.following_id END
    LEFT JOIN public.athlete_profiles p ON p.user_id = u.id
    WHERE p_user_id IS NOT NULL AND p_kind IN ('followers', 'following')
      AND ((p_kind = 'followers' AND f.following_id = p_user_id)
        OR (p_kind = 'following' AND f.follower_id = p_user_id))
    ORDER BY f.created_at DESC
    LIMIT LEAST(GREATEST(p_limit, 1), 200)
  ) listing;
$$;

CREATE OR REPLACE FUNCTION public.my_social_notifications(p_limit integer DEFAULT 50)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  WITH events AS (
    SELECT 'follow:' || f.follower_id::text AS id, 'follow'::text AS kind,
      f.created_at, f.follower_id AS actor_id, NULL::uuid AS post_id,
      NULL::text AS post_type, NULL::text AS event_name
    FROM public.social_follows f
    WHERE f.following_id = auth.uid() AND f.follower_id <> auth.uid()
    UNION ALL
    SELECT 'like:' || r.post_id::text || ':' || r.user_id::text, 'like',
      r.created_at, r.user_id, r.post_id, a.post_type, e.name
    FROM public.activity_post_reactions r
    JOIN public.activity_posts a ON a.id = r.post_id AND a.is_published = true
    LEFT JOIN public.race_events e ON e.id = a.race_event_id
    WHERE a.user_id = auth.uid() AND r.user_id <> auth.uid() AND r.reaction_type = 'like'
  ), decorated AS (
    SELECT n.*, NULLIF(p.username, '') AS username,
      COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'full_name'), ''),
        NULLIF(btrim(u.raw_user_meta_data->>'name'), ''), 'Corredor Dorsalia') AS display_name,
      COALESCE(p.avatar_url, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') AS avatar_url
    FROM events n JOIN auth.users u ON u.id = n.actor_id
    LEFT JOIN public.athlete_profiles p ON p.user_id = n.actor_id
  ), seen AS (
    SELECT COALESCE((SELECT last_seen_at FROM public.social_notification_reads WHERE user_id = auth.uid()), 'epoch'::timestamptz) AS last_seen_at
  )
  SELECT jsonb_build_object(
    'unread_count', (SELECT count(*) FROM events, seen WHERE events.created_at > seen.last_seen_at),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'kind', d.kind, 'created_at', d.created_at,
        'actor_id', d.actor_id, 'username', d.username,
        'display_name', d.display_name, 'avatar_url', d.avatar_url,
        'post_id', d.post_id, 'post_type', d.post_type, 'event_name', d.event_name,
        'unread', d.created_at > seen.last_seen_at
      ) ORDER BY d.created_at DESC)
      FROM (SELECT * FROM decorated ORDER BY created_at DESC LIMIT LEAST(GREATEST(p_limit, 1), 100)) d, seen
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.mark_social_notifications_read()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.social_notification_reads(user_id, last_seen_at)
  VALUES (auth.uid(), now())
  ON CONFLICT (user_id) DO UPDATE SET last_seen_at = EXCLUDED.last_seen_at;
END;
$$;

REVOKE ALL ON FUNCTION public.public_follow_list(uuid, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.my_social_notifications(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_social_notifications_read() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_follow_list(uuid, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_social_notifications(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_social_notifications_read() TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
