"use client";

import { useEffect, useState } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import AssetIcon from "@/components/ui/AssetIcon";
import { highResolutionAvatar } from "@/lib/avatarImage";
import FollowButton from "@/components/account/FollowButton";
import ActivityFeed from "@/components/activity/ActivityFeed";
import type { AthleteReview } from "@/lib/eventReviews";
import { useAnimatedNavigate } from "@/lib/useAnimatedNavigate";
import { publicEventPath, usePublicEventPaths } from "@/lib/usePublicEventPaths";

const ICON_LOGOUT = "/assetsdev/Log_Out.svg";
/** Asset already points left */
const ICON_BACK = "/assetsdev/Chevron_Right.svg";
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
  reviews?: AthleteReview[];
  readOnly?: boolean;
  initialTab?: "actividad" | "retos";
};

export default function AccountProfileView({
  displayName,
  userId,
  username,
  avatarUrl,
  coverSrc,
  bio,
  onEdit,
  onLogout,
  onAvatarClick,
  medals = [],
  readOnly = false,
  initialTab = "actividad",
}: AccountProfileViewProps) {
  const { exiting, navigate } = useAnimatedNavigate();
  const [profileTab, setProfileTab] = useState<"actividad" | "retos">(initialTab);
  const [publicTimes, setPublicTimes] = useState<AthletePublicTime[]>([]);
  const eventPaths = usePublicEventPaths();
  const initials = displayName.slice(0, 1).toUpperCase() || "A";
  const shown = medals.slice(0, 8);

  useEffect(() => {
    if (!userId) { setPublicTimes([]); return; }
    let active = true;
    void fetch(`${TIMED_RESULTS_API}/${userId}`).then((response) => response.ok ? response.json() : null).then((data) => { if (active) setPublicTimes(Array.isArray(data?.results) ? data.results : []); }).catch(() => { if (active) setPublicTimes([]); });
    return () => { active = false; };
  }, [userId]);

  return (
    <div
      className={`min-h-screen bg-[#070707] pb-24 md:pb-16 ${
        exiting ? "mp-page-exit-back" : "mp-page-enter-profile"
      }`}
    >
      <div className="relative w-full" style={{ height: 221 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black" />

        <div
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-between"
          style={{ paddingTop: 15, paddingLeft: 20, paddingRight: 20 }}
        >
          <GlassIconButton aria-label="Volver" onClick={() => navigate("/")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_BACK} alt="" width={24} height={24} />
          </GlassIconButton>

          {!readOnly ? <div className="flex items-center" style={{ gap: 10 }}>
            <GlassIconButton aria-label="Editar perfil" title="Editar" onClick={() => onEdit?.()}>
              <AssetIcon name="edit-solid" className="text-white" />
            </GlassIconButton>
            <GlassIconButton aria-label="Cerrar sesión" title="Salir" onClick={() => onLogout?.()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ICON_LOGOUT} alt="" width={24} height={24} />
            </GlassIconButton>
          </div> : <span aria-hidden />}
        </div>

        <button
          type="button"
          onClick={readOnly ? undefined : onAvatarClick}
          disabled={readOnly}
          className="absolute z-20 overflow-hidden rounded-full"
          style={{ top: 98, left: 20, width: 140, height: 140 }}
          aria-label={readOnly ? `Foto de ${displayName}` : "Cambiar foto de perfil"}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={highResolutionAvatar(avatarUrl) || avatarUrl}
              alt=""
              width={140}
              height={140}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center bg-neutral-800 font-akira text-4xl text-white">
              {initials}
            </div>
          )}
        </button>
      </div>

      {/* Avatar bottom 238 − cover 221 = 17; +15px gap → pt 32 */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 32 }}>
        <h1 className="w-full min-w-0 max-w-full break-words font-sans text-[clamp(2rem,8vw,2.5rem)] font-extrabold leading-[1.08] text-white [overflow-wrap:anywhere]">{displayName}</h1>
        {username ? <p className="mt-2 text-[16px] font-medium text-white/45">@{username}</p> : null}
        {bio || !readOnly ? <p
          className="max-w-md text-[18px] leading-relaxed"
          style={{
            marginTop: 10,
            color: bio ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)",
          }}
        >
          {bio || "Agrega una descripción."}
        </p> : null}
        {publicTimes.length > 0 ? <section className="mt-6 max-w-2xl" aria-label="Tiempos de corredor"><h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white/55">Mis tiempos</h2><div className="mt-3 space-y-2">{publicTimes.map((item) => <a key={item.id} href={publicEventPath(eventPaths, item.event?.public_subdomain || item.event?.slug)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-[#c9f24b]/50">{item.event?.cover_image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.event.cover_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-white/10 text-lg">🏁</span>}<span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{item.event?.name || "Evento"}</strong><span className="block truncate text-xs text-white/50">{item.distance || "Carrera"} · {item.category || "General"}{item.bib ? ` · Dorsal ${item.bib}` : ""}</span></span><strong className="shrink-0 text-sm text-[#c9f24b]">{item.chip_time || item.gun_time || "—"}</strong></a>)}</div></section> : null}
        {userId ? <FollowButton targetUserId={userId} /> : null}
      </div>

      <section style={{ paddingLeft: 20, paddingRight: 20, marginTop: 32 }}>
        <div className="flex items-center gap-6 border-b border-white/10">
          <button
            type="button"
            onClick={() => setProfileTab("actividad")}
            className={`border-b-2 pb-3 text-sm font-bold transition-colors ${profileTab === "actividad" ? "border-[#c9f24b] text-white" : "border-transparent text-white/40"}`}
          >
            Actividad
          </button>
          <button
            type="button"
            onClick={() => setProfileTab("retos")}
            className={`border-b-2 pb-3 text-sm font-bold transition-colors ${profileTab === "retos" ? "border-[#c9f24b] text-white" : "border-transparent text-white/40"}`}
          >
            Retos
          </button>
        </div>

        {profileTab === "retos" ? (
          <div>
            <h2 className="mt-5 font-bold text-white" style={{ fontSize: 22 }}>Mis retos cumplidos</h2>
            {shown.length === 0 ? (
              readOnly ? null : <p className="mt-4 text-[14px] text-white/40">Cuando compres o participes en un evento, aquí verás sus medallas.</p>
            ) : (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {shown.map((m) => (
                  <div key={m.key} className="aspect-square" style={{ opacity: m.completed ? 1 : 0.5 }} title={m.completed ? m.label : `${m.label} (próximo)`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.imageUrl} alt={m.label} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="-mx-5"><ActivityFeed userId={userId} /></div>
        )}
      </section>
    </div>
  );
}
