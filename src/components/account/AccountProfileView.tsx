"use client";

import { useEffect, useState } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import PageHeader from "@/components/PageHeader";
import ProfileIdentity from "@/components/account/ProfileIdentity";
import ProfileHighlights from "@/components/account/ProfileHighlights";
import ProfileMedalCard from "@/components/account/ProfileMedalCard";
import ActivityFeed from "@/components/activity/ActivityFeed";
import CreatorProfileSections from "@/components/creator/CreatorProfileSections";
import { createClient } from "@/lib/supabase/client";
import { StarIcon } from "@/components/reviews/StarRating";
import type { AthleteReview } from "@/lib/eventReviews";
import { useAnimatedNavigate } from "@/lib/useAnimatedNavigate";
import { publicEventPath, usePublicEventPaths } from "@/lib/usePublicEventPaths";

const ICON_LOGOUT = "/assetsdev/Log_Out.svg";
/** Asset already points left */
const TIMED_RESULTS_API = `${(process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.dorsalia.run").replace(/\/$/, "")}/sites/v1/public-athlete-results`;
type AthletePublicTime = { id: string; distance: string; category: string; bib: string; chip_time: string | null; gun_time: string | null; event?: { name: string; slug: string; public_subdomain?: string | null; event_date?: string | null; cover_image_url?: string | null } | null };

export type ProfileMedal = {
  key: string;
  label: string;
  imageUrl: string;
  /** false = purchased but event not finished → 50% opacity */
  completed: boolean;
};

export type AccountProfileViewProps = {
  displayName: string;
  userId?: string | null;
  username?: string | null;
  avatarUrl: string | null;
  coverSrc: string;
  bio?: string | null;
  onEdit?: () => void;
  onLogout?: () => void;
  onAvatarClick?: () => void;
  medals?: ProfileMedal[];
  featuredMedals?: ProfileMedal[];
  reviews?: AthleteReview[];
  publicRatingCount?: number;
  readOnly?: boolean;
  initialTab?: "actividad" | "retos";
};

export default function AccountProfileView({
  displayName,
  userId,
  username,
  avatarUrl,
  coverSrc,
  onLogout,
  onAvatarClick,
  medals = [],
  featuredMedals,
  reviews = [],
  publicRatingCount,
  readOnly = false,
  initialTab = "actividad",
}: AccountProfileViewProps) {
  const { exiting, navigate } = useAnimatedNavigate();
  const [showAllMedals, setShowAllMedals] = useState(initialTab === "retos");
  const [publicTimes, setPublicTimes] = useState<AthletePublicTime[]>([]);
  const [photographer, setPhotographer] = useState(false);
  const eventPaths = usePublicEventPaths();

  useEffect(() => {
    if (!userId) { setPublicTimes([]); return; }
    let active = true;
    void fetch(`${TIMED_RESULTS_API}/${userId}`).then((response) => response.ok ? response.json() : null).then((data) => { if (active) setPublicTimes(Array.isArray(data?.results) ? data.results : []); }).catch(() => { if (active) setPublicTimes([]); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!userId) { setPhotographer(false); return; }
    let active = true;
    void createClient().from("creator_profiles").select("creator_type,is_active").eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (active) setPhotographer(data?.creator_type === "photographer" && data.is_active === true); });
    return () => { active = false; };
  }, [userId]);

  return (
    <div
      className={`relative min-h-screen bg-[#070707] pb-24 md:pb-16 ${
        exiting ? "mp-page-exit-back" : "mp-page-enter-profile"
      }`}
    >
      <PageHeader sticky overlayCover gradient={false} onBack={() => navigate("/")} rightAction={!readOnly ? (
        <GlassIconButton aria-label="Cerrar sesión" title="Salir" onClick={() => onLogout?.()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ICON_LOGOUT} alt="" width={24} height={24} />
        </GlassIconButton>
      ) : undefined} />
      <div className="relative mx-auto mt-[50px] max-w-5xl px-5">
        <ProfileIdentity displayName={displayName} username={username} avatarUrl={avatarUrl} coverSrc={coverSrc} onAvatarClick={onAvatarClick} readOnly={readOnly} creatorType={photographer ? "photographer" : null} />
        {userId ? <ProfileHighlights userId={userId} reviews={reviews} readOnly={readOnly} publicRatingCount={publicRatingCount} /> : null}
        {userId && photographer ? <CreatorProfileSections userId={userId} ownProfile={!readOnly} /> : null}
        <ProfileMedalCard medals={featuredMedals || medals} ownProfile={!readOnly} onOpen={() => setShowAllMedals((value) => !value)} />
        {showAllMedals && medals.length > 0 ? <section className="mt-5" aria-label="Todas las medallas"><h2 className="text-[20px] font-semibold text-white">Todas las medallas</h2><div className="mt-3 grid grid-cols-3 gap-3">{medals.map((medal) => <div key={medal.key} className="aspect-square rounded-[20px] bg-[#191919] p-3" title={medal.label}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={medal.imageUrl} alt={medal.label} className="h-full w-full object-contain" style={{ opacity: medal.completed ? 1 : 0.5 }} /></div>)}</div></section> : null}
        {publicTimes.length > 0 ? <section className="mt-6 max-w-2xl" aria-label="Tiempos de corredor"><h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white/55">Mis tiempos</h2><div className="mt-3 space-y-2">{publicTimes.map((item) => <a key={item.id} href={publicEventPath(eventPaths, item.event?.public_subdomain || item.event?.slug)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-[#c9f24b]/50">{item.event?.cover_image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.event.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/10 text-lg">🏁</span>}<span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{item.event?.name || "Evento"}</strong><span className="block truncate text-xs text-white/50">{item.distance || "Carrera"} · {item.category || "General"}{item.bib ? ` · Dorsal ${item.bib}` : ""}</span></span><strong className="shrink-0 text-sm text-[#c9f24b]">{item.chip_time || item.gun_time || "—"}</strong></a>)}</div></section> : null}
        {reviews.length ? <section className="mt-8" aria-label="Carreras calificadas">
          <div className="flex items-center justify-between gap-3"><h2 className="min-w-0 truncate whitespace-nowrap text-xl font-bold text-white">Mis reseñas</h2>{!readOnly ? <a href="/mis-resenas" aria-label="Ver todas mis reseñas" className="grid h-6 w-6 shrink-0 place-items-center">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/profile-highlights/Chevron_Right.svg" alt="" width={16} height={16} /></a> : null}</div>
          <div className="-mr-5 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reviews.map((review) => <a key={review.id} href={review.event_slug ? `/review/${encodeURIComponent(review.event_slug)}` : publicEventPath(eventPaths, review.event_slug) || "/mis-resenas"} className="w-[150px] shrink-0 snap-start">
              <span className="block h-[150px] w-[150px] overflow-hidden rounded-2xl bg-white/10">{review.event_cover_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={review.event_cover_url} alt="" className="h-full w-full object-cover" /> : null}</span>
              <strong className="mt-2 block truncate text-sm text-white">{review.event_name}</strong><span className="mt-1 flex items-center gap-1 text-sm text-white"><StarIcon filled size={16} />{review.rating.toFixed(1)}</span>
            </a>)}
          </div>
        </section> : null}
      </div>

      <section className="mt-10"><h2 className="px-[15px] text-[20px] font-semibold text-white">Actividad</h2><div className="mt-[10px]"><ActivityFeed userId={userId} /></div></section>
    </div>
  );
}
