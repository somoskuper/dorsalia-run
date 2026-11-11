"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AccountProfileView, { type ProfileMedal } from "@/components/account/AccountProfileView";
import { ProfileSectionSkeleton } from "@/components/account/AccountSectionSkeletons";
import type { PublicAthleteProfile } from "@/lib/eventReviews";
import { resolveProfileCover } from "@/lib/profileCovers";
import { createClient } from "@/lib/supabase/client";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PublicAthleteProfilePage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const identifier = decodeURIComponent(String(params.userId || "")).trim();
  const [profile, setProfile] = useState<PublicAthleteProfile | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [photographer, setPhotographer] = useState(false);
  const [ledgerMedals, setLedgerMedals] = useState<ProfileMedal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) return;
    const supabase = createClient();
    const request = UUID_PATTERN.test(identifier)
      ? supabase.rpc("public_athlete_profile", { p_user_id: identifier })
      : supabase.rpc("public_athlete_profile_by_username", { p_username: identifier });
    void request.then(async ({ data }) => {
      const nextProfile = data && typeof data === "object" ? data as PublicAthleteProfile : null;
      setProfile(nextProfile);
      if (nextProfile?.user_id) {
        const [{ data: count }, { data: creator }, { data: featuredAwards }] = await Promise.all([
          supabase.rpc("public_athlete_rating_count", { p_user_id: nextProfile.user_id }),
          supabase.from("creator_profiles").select("creator_type,is_active").eq("user_id", nextProfile.user_id).maybeSingle(),
          supabase.rpc("public_athlete_featured_medals", { p_user_id: nextProfile.user_id }),
        ]);
        setRatingCount(Number(count) || 0);
        setPhotographer(creator?.creator_type === "photographer" && creator.is_active === true);
        setLedgerMedals((Array.isArray(featuredAwards) ? featuredAwards : []).map((award: { id?: string; name?: string; image_url?: string }) => ({
          key: `award:${String(award.id || "")}`,
          label: String(award.name || "Medalla conseguida"),
          imageUrl: String(award.image_url || ""),
          completed: true,
        })).filter((medal) => medal.imageUrl.startsWith("/") || medal.imageUrl.startsWith("http")));
      }
      setLoading(false);
      if (UUID_PATTERN.test(identifier) && nextProfile?.username) {
        router.replace(`/perfil/${encodeURIComponent(nextProfile.username)}`);
      }
    });
  }, [identifier, router]);

  if (loading) return <ProfileSectionSkeleton ownProfile={false} />;
  if (!profile) return <main className="min-h-screen bg-[#070707] px-5 py-24 text-center"><p className="text-white/55">Este perfil no está disponible.</p><Link href="/" className="mt-5 inline-block font-bold text-[#c9f24b]">Volver a Dorsalia</Link></main>;

  const legacyFeaturedMedals: ProfileMedal[] = (profile.featured_medal_keys || []).map((key) => ({
    key,
    label: key === "dorsalia-first-event" ? "Primer evento en Dorsalia" : "Medalla conseguida",
    imageUrl: key === "dorsalia-first-event" ? "/assetsdev/primer-evento-dorsalia.webp" : key.replace(/^[0-9a-f-]{36}-/i, ""),
    completed: true,
  })).filter((medal) => medal.imageUrl.startsWith("/") || medal.imageUrl.startsWith("http"));
  const legacyBadge = legacyFeaturedMedals.filter((medal) => medal.key === "dorsalia-first-event");
  const featuredMedals = ledgerMedals.length
    ? [...legacyBadge, ...ledgerMedals.filter((medal) => !legacyBadge.some((badge) => badge.imageUrl === medal.imageUrl))].slice(0, 3)
    : legacyFeaturedMedals;

  return <AccountProfileView
    displayName={profile.display_name}
    userId={profile.user_id}
    username={profile.username}
    avatarUrl={profile.avatar_url || null}
    coverSrc={resolveProfileCover(profile.cover_url)}
    bio={profile.bio}
    reviews={profile.reviews}
    publicRatingCount={ratingCount}
    medals={featuredMedals}
    featuredMedals={featuredMedals}
    readOnly
    isPhotographer={photographer}
    initialTab="actividad"
  />;
}
