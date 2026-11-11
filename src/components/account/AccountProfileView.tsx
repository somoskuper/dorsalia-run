"use client";

import { useEffect, useId, useMemo, useState } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import FullScreenMenu from "@/components/FullScreenMenu";
import PageHeader from "@/components/PageHeader";
import ProfileIdentity from "@/components/account/ProfileIdentity";
import ProfileHighlights from "@/components/account/ProfileHighlights";
import ProfileMedalCard from "@/components/account/ProfileMedalCard";
import MedalSheet from "@/components/account/MedalSheet";
import ActivityFeed from "@/components/activity/ActivityFeed";
import CreatorProfileSections from "@/components/creator/CreatorProfileSections";
import { createClient } from "@/lib/supabase/client";
import { StarIcon } from "@/components/reviews/StarRating";
import type { AthleteReview } from "@/lib/eventReviews";
import { useAnimatedNavigate } from "@/lib/useAnimatedNavigate";
import { publicEventPath, usePublicEventPaths } from "@/lib/usePublicEventPaths";

const ICON_LOGOUT = "/assetsdev/Log_Out.svg";
const ICON_SETTINGS = "/assetsdev/Settings.svg";
const ICON_MENU = "/branding/Hamburger_MD.svg";
/** Asset already points left */
const TIMED_RESULTS_API = `${(process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.dorsalia.run").replace(/\/$/, "")}/sites/v1/public-athlete-results`;
type AthletePublicTime = { id: string; distance: string; category: string; bib: string; chip_time: string | null; gun_time: string | null; event?: { name: string; slug: string; public_subdomain?: string | null; event_date?: string | null; cover_image_url?: string | null } | null };

export type ProfileMedal = {
  key: string;
  label: string;
  imageUrl: string;
  /** false = purchased but event not finished → 50% opacity */
  completed: boolean;
  awardId?: string;
  sourceType?: "route" | "promotional" | "platform_badge";
  description?: string | null;
  sponsorName?: string | null;
  expiresAt?: string | null;
  termsAndConditions?: string | null;
  maxUses?: number;
  usesCount?: number;
  usesRemaining?: number | null;
  unlimitedRedemptions?: boolean;
  isRedeemable?: boolean;
  canRedeem?: boolean;
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
  /** Known from the page load, so the creator button does not wait for a second request. */
  isPhotographer?: boolean;
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
  isPhotographer,
}: AccountProfileViewProps) {
  const { exiting, navigate } = useAnimatedNavigate();
  const [showAllMedals, setShowAllMedals] = useState(initialTab === "retos");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const [publicTimes, setPublicTimes] = useState<AthletePublicTime[]>([]);
  const [photographer, setPhotographer] = useState(isPhotographer ?? false);
  const [selectedMedal, setSelectedMedal] = useState<ProfileMedal | null>(null);
  const [redemptionOverrides, setRedemptionOverrides] = useState<Record<string, Partial<ProfileMedal>>>({});
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionMessage, setRedemptionMessage] = useState<string | null>(null);
  const eventPaths = usePublicEventPaths();
  const openedMedal = useMemo(() => selectedMedal ? { ...selectedMedal, ...(redemptionOverrides[selectedMedal.key] || {}) } : null, [selectedMedal, redemptionOverrides]);

  async function redeemMedal() {
    if (!openedMedal?.awardId || !openedMedal.canRedeem || redeeming) return;
    setRedeeming(true);
    setRedemptionMessage(null);
    const { data, error } = await createClient().rpc("redeem_promotional_medal", { p_medal_award_id: openedMedal.awardId });
    if (error) {
      const message = error.message.includes("MEDAL_EXPIRED")
        ? "Esta medalla ya venció."
        : error.message.includes("NO_USES_REMAINING")
          ? "Ya utilizaste todos los usos disponibles."
          : "No se pudo registrar el uso. Intenta nuevamente.";
      setRedemptionMessage(message);
    } else {
      const result = data as { uses_count?: number; uses_remaining?: number | null; unlimited_redemptions?: boolean } | null;
      const isUnlimited = result?.unlimited_redemptions === true || openedMedal.unlimitedRedemptions === true;
      const remaining = isUnlimited ? null : Number(result?.uses_remaining) || 0;
      setRedemptionOverrides((current) => ({
        ...current,
        [openedMedal.key]: {
          usesCount: Number(result?.uses_count) || (openedMedal.usesCount || 0) + 1,
          usesRemaining: remaining,
          unlimitedRedemptions: isUnlimited,
          canRedeem: isUnlimited || Number(remaining) > 0,
        },
      }));
      setRedemptionMessage("Uso registrado correctamente.");
    }
    setRedeeming(false);
  }

  useEffect(() => {
    if (!userId) { setPublicTimes([]); return; }
    let active = true;
    void fetch(`${TIMED_RESULTS_API}/${userId}`).then((response) => response.ok ? response.json() : null).then((data) => { if (active) setPublicTimes(Array.isArray(data?.results) ? data.results : []); }).catch(() => { if (active) setPublicTimes([]); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (isPhotographer !== undefined) { setPhotographer(isPhotographer); return; }
    if (!userId) { setPhotographer(false); return; }
    let active = true;
    void createClient().from("creator_profiles").select("creator_type,is_active").eq("user_id", userId).maybeSingle()
      .then(({ data }) => { if (active) setPhotographer(data?.creator_type === "photographer" && data.is_active === true); });
    return () => { active = false; };
  }, [isPhotographer, userId]);

  return (
    <div
      className={`relative min-h-screen bg-[#070707] pb-24 md:pb-16 ${
        exiting ? "mp-page-exit-back" : "mp-page-enter-profile"
      }`}
    >
      <PageHeader sticky overlayCover gradient={false} onBack={() => navigate("/")} rightAction={!readOnly ? (
        <div className="flex items-center gap-2">
          <GlassIconButton aria-label="Configuración" title="Configuración" onClick={() => navigate("/settings")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_SETTINGS} alt="" width={24} height={24} />
          </GlassIconButton>
          <GlassIconButton aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} title="Menú" onClick={() => setMenuOpen((open) => !open)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_MENU} alt="" width={24} height={24} />
          </GlassIconButton>
          <GlassIconButton aria-label="Cerrar sesión" title="Salir" onClick={() => onLogout?.()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_LOGOUT} alt="" width={24} height={24} />
          </GlassIconButton>
        </div>
      ) : undefined} />
      {!readOnly ? <FullScreenMenu id={menuId} open={menuOpen} onClose={() => setMenuOpen(false)} joinHref="/cuenta" joinLabel="Mi cuenta" /> : null}
      <div className="relative mx-auto mt-[50px] max-w-5xl px-[15px]">
        <ProfileIdentity displayName={displayName} username={username} avatarUrl={avatarUrl} coverSrc={coverSrc} onAvatarClick={onAvatarClick} readOnly={readOnly} creatorType={photographer ? "photographer" : null} />
        {userId ? <ProfileHighlights userId={userId} reviews={reviews} readOnly={readOnly} publicRatingCount={publicRatingCount} showCreatorPanel={photographer && !readOnly} /> : null}
        {userId && photographer ? <CreatorProfileSections userId={userId} ownProfile={!readOnly} /> : null}
        <ProfileMedalCard medals={featuredMedals || medals} ownProfile={!readOnly} onOpen={() => setShowAllMedals((value) => !value)} onMedalOpen={(medal) => { setSelectedMedal(medal); setRedemptionMessage(null); }} />
        {showAllMedals && medals.length > 0 ? <section className="mt-5" aria-label="Tus retos"><h2 className="text-[20px] font-semibold text-white">Tus retos</h2><div className="mt-3 grid grid-cols-3 gap-3">{medals.map((medal) => <button type="button" onClick={() => { setSelectedMedal(medal); setRedemptionMessage(null); }} key={medal.key} className="aspect-square p-2 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[#c9f24b]" title={medal.label}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={medal.imageUrl} alt={medal.label} className="h-full w-full object-contain" style={{ opacity: medal.completed ? 1 : 0.5 }} /></button>)}</div></section> : null}
        {publicTimes.length > 0 ? <section className="mt-6 max-w-2xl" aria-label="Tiempos de corredor"><h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white/55">Mis tiempos</h2><div className="mt-3 space-y-2">{publicTimes.map((item) => <a key={item.id} href={publicEventPath(eventPaths, item.event?.public_subdomain || item.event?.slug)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-[#c9f24b]/50">{item.event?.cover_image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.event.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/10 text-lg">🏁</span>}<span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{item.event?.name || "Evento"}</strong><span className="block truncate text-xs text-white/50">{item.distance || "Carrera"} · {item.category || "General"}{item.bib ? ` · Dorsal ${item.bib}` : ""}</span></span><strong className="shrink-0 text-sm text-[#c9f24b]">{item.chip_time || item.gun_time || "—"}</strong></a>)}</div></section> : null}
        {reviews.length ? <section className="mt-8" aria-label="Carreras calificadas">
          <div className="flex items-center justify-between gap-3"><h2 className="min-w-0 truncate whitespace-nowrap text-xl font-bold text-white">Mis reseñas</h2>{!readOnly ? <a href="/mis-resenas" aria-label="Ver todas mis reseñas" className="grid h-6 w-6 shrink-0 place-items-center">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/profile-highlights/Chevron_Right.svg" alt="" width={16} height={16} /></a> : null}</div>
          <div className="-mr-[15px] mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {reviews.map((review) => <a key={review.id} href={review.event_slug ? `/review/${encodeURIComponent(review.event_slug)}` : publicEventPath(eventPaths, review.event_slug) || "/mis-resenas"} className="w-[150px] shrink-0 snap-start">
              <span className="block h-[150px] w-[150px] overflow-hidden rounded-2xl bg-white/10">{review.event_cover_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={review.event_cover_url} alt="" className="h-full w-full object-cover" /> : null}</span>
              <strong className="mt-2 block truncate text-sm text-white">{review.event_name}</strong><span className="mt-1 flex items-center gap-1 text-sm text-white"><StarIcon filled size={16} />{review.rating.toFixed(1)}</span>
            </a>)}
          </div>
        </section> : null}
      </div>

      <section className="mt-10"><h2 className="px-[15px] text-[20px] font-semibold text-white">Actividad</h2><div className="mt-[10px]"><ActivityFeed userId={userId} /></div></section>
      {openedMedal ? <MedalSheet
        title={openedMedal.label}
        imageUrl={openedMedal.imageUrl}
        eyebrow={openedMedal.sourceType === "promotional" ? "Medalla especial" : openedMedal.sourceType === "route" ? "Medalla de modalidad" : openedMedal.key === "dorsalia-first-event" ? "Medalla Dorsalia" : "Medalla"}
        description={openedMedal.description}
        onClose={() => setSelectedMedal(null)}
        redemption={openedMedal.isRedeemable && !readOnly ? {
          usesRemaining: openedMedal.usesRemaining ?? 0,
          maxUses: openedMedal.maxUses ?? 0,
          unlimitedRedemptions: openedMedal.unlimitedRedemptions === true,
          expiresAt: openedMedal.expiresAt,
          termsAndConditions: openedMedal.termsAndConditions,
          canRedeem: openedMedal.canRedeem === true,
          busy: redeeming,
          message: redemptionMessage,
          onRedeem: () => void redeemMedal(),
        } : null}
      /> : null}
    </div>
  );
}
