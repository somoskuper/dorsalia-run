-- Public reviews must always have a resolvable public athlete profile.
-- Repair reviews published before the onboarding/profile requirement. Keep the
-- display name generic until each athlete chooses their own profile details.
INSERT INTO public.athlete_profiles (user_id, username)
SELECT DISTINCT r.user_id, 'runner_' || left(replace(r.user_id::text, '-', ''), 12)
FROM public.event_reviews r
JOIN auth.users u ON u.id = r.user_id
WHERE r.is_published = true
  AND NOT EXISTS (SELECT 1 FROM public.athlete_profiles p WHERE p.user_id = r.user_id)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS event_reviews_insert_own ON public.event_reviews;
CREATE POLICY event_reviews_insert_own ON public.event_reviews FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.athlete_profiles p
    WHERE p.user_id = auth.uid() AND nullif(btrim(p.username), '') IS NOT NULL
  )
);

DROP POLICY IF EXISTS event_reviews_update_own ON public.event_reviews;
CREATE POLICY event_reviews_update_own ON public.event_reviews FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.athlete_profiles p
    WHERE p.user_id = auth.uid() AND nullif(btrim(p.username), '') IS NOT NULL
  )
);
