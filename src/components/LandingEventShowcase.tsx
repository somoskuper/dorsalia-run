"use client";

import { useMemo } from "react";
import Link from "next/link";
import AssetIcon from "@/components/ui/AssetIcon";
import { billboardSlug, type PublicRace } from "@/lib/races";

function eventDate(value: string | null) {
  if (!value) return "Fecha por anunciar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha por anunciar";
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function LandingEventShowcase({ race }: { race: PublicRace }) {
  const routes = useMemo(() => (race.routes || []).slice(0, 3), [race.routes]);
  const medals = useMemo(() => {
    const visited = new Set<string>();
    return routes.flatMap((route) => {
      const url = String(route.medal_image_url || "").trim();
      if (!url || visited.has(url)) return [];
      visited.add(url);
      return [{ key: route.key || url, url, label: route.medal_label || route.label || "Modalidad" }];
    });
  }, [routes]);
  const promotionalMedals = useMemo(() => (race.promotional_medals || []).slice(0, 6).map((medal) => ({
    key: `promo-${medal.id}`,
    url: medal.image_url,
    label: medal.name,
  })).filter((medal) => medal.url), [race.promotional_medals]);
  const image = "/landing/event-card-social-run.webp";
  const organizerImage = race.organizer_logo_url || race.logo_url || "";
  const organizer = race.organizer_name || "Organizador en Dorsalia";
  const price = Number(race.min_price ?? race.default_kit_price) || 0;
  const primaryLabel = price > 0 ? `Inscríbete por $${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(price)}` : "Inscríbete gratis";

  return (
    <section className="mt-[75px] w-full md:mt-36">
      <div className="mx-auto mb-10 max-w-[850px] px-5 text-center md:mb-14">
        <p className="text-[11px] font-bold tracking-[0.18em] text-[#c5e500]">PÁGINA DE EVENTO</p>
        <h2 className="mt-3 text-[24px] font-semibold leading-[1.25] md:text-[42px] md:leading-[1.2]">
          Así se presenta tu evento en Dorsalia: información esencial, modalidades y reseñas de corredores.
        </h2>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-black" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 h-full w-full scale-[1.45] object-cover opacity-75 blur-[100px] saturate-150" style={{ filter: "blur(100px) saturate(1.5)", WebkitFilter: "blur(100px) saturate(1.5)" }} />
          <div className="absolute inset-0 bg-black/65" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 py-10 md:px-8 md:py-16">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)] md:gap-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={race.name} className="aspect-[3/4] w-full rounded-[28px] object-cover shadow-[0_30px_80px_rgba(0,0,0,0.45)]" />
          <div>
            <h3 className="font-akira text-[30px] uppercase leading-[1.08] tracking-wide text-white md:text-[44px]">{race.name}</h3>
            <div className="mt-4 flex items-center gap-2.5 text-sm text-white">
              {organizerImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={organizerImage} alt="" className="size-8 rounded-full object-cover" />
              ) : null}
              <span className="text-white/60">Presentado por</span><span className="font-bold">{organizer}</span>
            </div>
            <div className="mt-8 flex flex-col gap-[5px] text-[17px] leading-snug text-white/90">
              <p className="flex items-center gap-3">
                <AssetIcon name="calendar" size={33} className="text-white" />
                <span>{eventDate(race.event_date)}</span>
              </p>
              <p className="flex items-center gap-3">
                <AssetIcon name="location" size={33} className="text-white" />
                <span>{[race.venue_name, race.city, race.country].filter(Boolean).join(", ") || "Ubicación por anunciar"}</span>
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:max-w-md">
              <button type="button" className="cursor-default rounded-[20px] bg-white px-6 py-[15px] text-center text-[18px] font-bold uppercase tracking-wide" style={{ color: "#000" }}>{primaryLabel}</button>
              {race.website_url ? <button type="button" className="cursor-default rounded-[20px] border border-white/40 px-6 py-[15px] text-center text-[18px] font-bold uppercase tracking-wide text-white">Visitar sitio</button> : null}
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-2xl md:mt-14">
          <h4 className="text-[22px] font-semibold leading-tight text-white">Sobre el evento</h4>
          <p className="mt-3 text-[16px] leading-relaxed text-white/80">{race.short_description || "Conoce todos los detalles de este evento deportivo en Dorsalia."}</p>
        </div>

        {medals.length ? <section className="mt-10">
          <h4 className="text-[22px] font-semibold leading-tight text-white">Modalidades</h4>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            {medals.map((medal) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={medal.key} src={medal.url} alt={medal.label} className="h-[88px] w-auto object-contain" />
            ))}
          </div>
        </section> : null}

        {promotionalMedals.length ? <section className="mt-8">
          <h4 className="text-[22px] font-semibold leading-tight text-white">Medallas especiales</h4>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            {promotionalMedals.map((medal) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={medal.key} src={medal.url} alt={medal.label} className="h-[88px] w-auto object-contain" />
            ))}
          </div>
        </section> : null}

        {new Date(String(race.event_end_date || race.event_date)).getTime() <= Date.now() ? <Link href={`/review/${encodeURIComponent(billboardSlug(race))}`} className="mt-10 block rounded-2xl border border-white/15 bg-white/[.05] px-5 py-5 text-white"><strong className="block text-xl">Puntuaciones y reseñas</strong><span className="mt-1 block text-sm text-white/60">Ver la ficha de reseñas del evento ›</span></Link> : null}
        </div>
      </div>
    </section>
  );
}
