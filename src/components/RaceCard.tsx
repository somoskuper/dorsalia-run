import type { PublicRace } from "@/lib/races";
import { cardCoverImage, formatDate, placeLabel } from "@/lib/races";

/** Legacy card kept for other surfaces; the cartelera uses ExploreView. */
export default function RaceCard({ race }: { race: PublicRace }) {
  const img = cardCoverImage(race);

  return (
    <div className="group block">
      <div className="mp-card-poster">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={race.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white/40 font-akira">
            {race.name}
          </div>
        )}
        <div className="mp-card-pblur" aria-hidden />
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
          <h2 className="mp-card-title font-akira text-white leading-snug line-clamp-2">{race.name}</h2>
          <p className="mp-card-meta mt-1.5 text-xs text-white/70">{formatDate(race.event_date)}</p>
          <p className="mp-card-meta mt-1 text-xs text-white/55 truncate">{placeLabel(race)}</p>
        </div>
      </div>
    </div>
  );
}
