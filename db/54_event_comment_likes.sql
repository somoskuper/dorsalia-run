CREATE TABLE IF NOT EXISTS public.event_comment_likes (
  comment_id uuid NOT NULL REFERENCES public.event_community_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_comment_likes_comment_idx
  ON public.event_comment_likes(comment_id);

ALTER TABLE public.event_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_comment_likes_read ON public.event_comment_likes;
CREATE POLICY event_comment_likes_read ON public.event_comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS event_comment_likes_insert ON public.event_comment_likes;
CREATE POLICY event_comment_likes_insert ON public.event_comment_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS event_comment_likes_delete ON public.event_comment_likes;
CREATE POLICY event_comment_likes_delete ON public.event_comment_likes
  FOR DELETE USING (user_id = auth.uid());

GRANT SELECT ON public.event_comment_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.event_comment_likes TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_event_comment_like(p_comment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.event_community_questions
    WHERE id = p_comment_id AND is_published = true
  ) THEN RETURN false; END IF;
  IF EXISTS (
    SELECT 1 FROM public.event_comment_likes
    WHERE comment_id = p_comment_id AND user_id = auth.uid()
  ) THEN
    DELETE FROM public.event_comment_likes
    WHERE comment_id = p_comment_id AND user_id = auth.uid();
    RETURN false;
  END IF;
  INSERT INTO public.event_comment_likes(comment_id, user_id)
  VALUES (p_comment_id, auth.uid()) ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_event_comment_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.toggle_event_comment_like(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.event_comment_like_state(p_comment_ids uuid[])
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_object_agg(id::text, jsonb_build_object(
    'like_count', like_count,
    'liked', liked
  )), '{}'::jsonb)
  FROM (
    SELECT q.id,
      (SELECT count(*) FROM public.event_comment_likes l WHERE l.comment_id = q.id) AS like_count,
      EXISTS (
        SELECT 1 FROM public.event_comment_likes l
        WHERE l.comment_id = q.id AND l.user_id = auth.uid()
      ) AS liked
    FROM public.event_community_questions q
    WHERE q.id = ANY(COALESCE(p_comment_ids, ARRAY[]::uuid[]))
  ) rows;
$$;

REVOKE ALL ON FUNCTION public.event_comment_like_state(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.event_comment_like_state(uuid[]) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
