"use client";

import Link from "next/link";
import { cardCoverImage, formatDateTime, isEventFree, marketplaceEventPath, type PublicRace } from "@/lib/races";

export default function EventRecommendations({ races }: { races: PublicRace[] }) {
  if (!races.length) return null;

  return <section className="border-t border-white/10 bg-[#070707] py-12 text-white md:py-16" aria-labelledby="event-recommendations-title">
    <div className="mx-auto max-w-6xl px-5">
      <div className="flex items-center justify-between gap-4">
        <h2 id="event-recommendations-title" className="max-w-[300px] text-[28px] font-semibold leading-tight tracking-tight sm:max-w-none sm:text-[36px]">Nuevos eventos destacados</h2>
        <Link href="/?vista=eventos" aria-label="Explorar nuevos eventos destacados" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white transition-transform hover:scale-105"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 4 6 6-6 6" stroke="#070707" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>
      </div>
      <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {races.map((race) => {
          const image = cardCoverImage(race);
          const { date, time } = formatDateTime(race.event_date, race.timezone || "America/Merida");
          return <Link key={race.id} href={marketplaceEventPath(race)} className="group relative aspect-[3/4] w-[min(82vw,360px)] shrink-0 snap-start overflow-hidden rounded-[28px] bg-white/10">
            {image ? /* eslint-disable-next-line @next/next/no-img-element */<img src={image} alt={`Portada de ${race.name}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <span className="grid h-full w-full place-items-center p-6 text-center font-akira text-xl text-white/50">{race.name}</span>}
            <span className="absolute right-4 top-4 rounded-full border border-white/50 bg-black/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-md">{isEventFree(race) ? "Gratis" : "Nuevo"}</span>
            <span className="absolute inset-x-4 bottom-4 rounded-[28px] border border-white/25 bg-black/45 px-5 py-4 backdrop-blur-xl">
              <span className="line-clamp-2 block font-akira text-[21px] uppercase leading-[1.05] tracking-wide text-white">{race.name}</span>
              <span className="mt-3 flex items-center gap-2 text-sm text-white/80"><span aria-hidden="true">◷</span>{date}{time ? `, ${time}` : ""}</span>
            </span>
          </Link>;
        })}
      </div>
    </div>
  </section>;
}
