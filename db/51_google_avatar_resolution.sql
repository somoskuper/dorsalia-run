-- Google OAuth gives 96px thumbnails by default. Preserve custom images.
UPDATE public.athlete_profiles
SET avatar_url = regexp_replace(avatar_url, '=s96-c$', '=s720-c'),
    updated_at = now()
WHERE avatar_url ~ '^https://[^/]+\.googleusercontent\.com/.+=s96-c$';
