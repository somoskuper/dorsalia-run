CREATE TABLE IF NOT EXISTS public.activity_comment_likes (
  comment_id uuid NOT NULL REFERENCES public.activity_post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS activity_comment_likes_comment_idx
  ON public.activity_comment_likes(comment_id);

ALTER TABLE public.activity_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_comment_likes_read ON public.activity_comment_likes;
CREATE POLICY activity_comment_likes_read ON public.activity_comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS activity_comment_likes_insert ON public.activity_comment_likes;
CREATE POLICY activity_comment_likes_insert ON public.activity_comment_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS activity_comment_likes_delete ON public.activity_comment_likes;
CREATE POLICY activity_comment_likes_delete ON public.activity_comment_likes
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT ON public.activity_comment_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.activity_comment_likes TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_activity_comment_like(p_comment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.activity_post_comments c
    JOIN public.activity_posts a ON a.id = c.post_id AND a.is_published = true
    WHERE c.id = p_comment_id
  ) THEN RETURN false; END IF;
  IF EXISTS (
    SELECT 1 FROM public.activity_comment_likes
    WHERE comment_id = p_comment_id AND user_id = auth.uid()
  ) THEN
    DELETE FROM public.activity_comment_likes
    WHERE comment_id = p_comment_id AND user_id = auth.uid();
    RETURN false;
  END IF;
  INSERT INTO public.activity_comment_likes(comment_id, user_id)
  VALUES (p_comment_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_activity_comment_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_activity_comment_like(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.public_activity_post_comments(p_post_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(row_data ORDER BY created_at ASC), '[]'::jsonb)
  FROM (
    SELECT c.created_at, jsonb_build_object(
      'id', c.id, 'body', c.body, 'created_at', c.created_at, 'user_id', c.user_id,
      'username', NULLIF(p.username, ''),
      'display_name', COALESCE(NULLIF(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Corredor Dorsalia'),
      'avatar_url', p.avatar_url,
      'mine', c.user_id = auth.uid(),
      'like_count', (SELECT count(*) FROM public.activity_comment_likes l WHERE l.comment_id = c.id),
      'liked', EXISTS (SELECT 1 FROM public.activity_comment_likes l WHERE l.comment_id = c.id AND l.user_id = auth.uid())
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

NOTIFY pgrst, 'reload schema';
