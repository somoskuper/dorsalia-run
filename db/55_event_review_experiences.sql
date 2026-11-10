-- Optional answer on a review: the athlete ran the event or only watched it.
-- No row means they skipped the question.

CREATE TABLE IF NOT EXISTS public.event_review_experiences (
  review_id uuid PRIMARY KEY REFERENCES public.event_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_event_id uuid NOT NULL REFERENCES public.race_events(id) ON DELETE CASCADE,
  experience text NOT NULL CHECK (experience IN ('participated', 'watched')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, race_event_id)
);

CREATE INDEX IF NOT EXISTS event_review_experiences_event_idx
  ON public.event_review_experiences (race_event_id);

ALTER TABLE public.event_review_experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS event_review_experiences_read ON public.event_review_experiences;
CREATE POLICY event_review_experiences_read ON public.event_review_experiences
  FOR SELECT USING (true);

DROP POLICY IF EXISTS event_review_experiences_insert ON public.event_review_experiences;
CREATE POLICY event_review_experiences_insert ON public.event_review_experiences
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.event_reviews r
      WHERE r.id = review_id
        AND r.user_id = auth.uid()
        AND r.race_event_id = event_review_experiences.race_event_id
    )
  );

DROP POLICY IF EXISTS event_review_experiences_update ON public.event_review_experiences;
CREATE POLICY event_review_experiences_update ON public.event_review_experiences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.event_reviews r
      WHERE r.id = review_id
        AND r.user_id = auth.uid()
        AND r.race_event_id = event_review_experiences.race_event_id
    )
  );

DROP POLICY IF EXISTS event_review_experiences_delete ON public.event_review_experiences;
CREATE POLICY event_review_experiences_delete ON public.event_review_experiences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.event_review_experiences TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.event_review_experiences TO authenticated;

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
      (SELECT e.experience FROM public.event_review_experiences e WHERE e.review_id = v.id) AS experience,
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
