import Link from "next/link";
import Image from "next/image";
import { billboardSlug, coverImage, fetchPublicRaces, type PublicRace } from "@/lib/races";
import { reviewDirectory, reviewRating } from "@/lib/reviewDirectory";
import ReviewGradientLink from "@/components/reviews/ReviewGradientLink";
import ReviewPageHeader from "@/components/reviews/ReviewPageHeader";
import ReviewRaceRow from "@/components/reviews/ReviewRaceRow";
import ReviewAmbientBackground from "@/components/reviews/ReviewAmbientBackground";

export const revalidate = 60;

function Rating({ race, large = false }: { race: PublicRace; large?: boolean }) {
  const rating = reviewRating(race);
  return <span className={`inline-flex items-center gap-1 ${rating ? "text-white" : "text-white/50"}`} aria-label={`Calificación ${rating.toFixed(1)}`}>
    {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/star.svg" alt="" width={large ? 18 : 18} height={large ? 18 : 18} className={rating ? "" : "grayscale opacity-50"} />
    <span className={large ? "text-[32px] font-bold" : "text-[20px] font-normal"}>{rating.toFixed(1)}</span>
  </span>;
}

export default async function ResenasPage() {
  const races = reviewDirectory(await fetchPublicRaces({ status: "all" }));
  return <main className="relative isolate min-h-screen bg-transparent pb-28 text-white">
    <ReviewAmbientBackground />
    <div className="mx-auto max-w-5xl px-[15px] pt-5"><ReviewPageHeader fallbackHref="/" /></div>
    {races.length ? <>
      <div className="mt-9 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollPaddingInline: "calc((100vw - 340px)/2)", paddingInline: "max(15px, calc((100vw - 340px)/2))" }}>
        {races.slice(0, 6).map((race) => <ReviewGradientLink key={race.id} href={`/review/${encodeURIComponent(billboardSlug(race))}`} imageUrl={coverImage(race)}>
          <span className="relative block h-[218px] w-[218px] overflow-hidden rounded-[15px] bg-white/10">{coverImage(race) ? <Image src={coverImage(race)!} alt={`Portada de ${race.name}`} fill sizes="218px" quality={75} className="object-cover" /> : null}</span>
          <strong className="line-clamp-2 min-h-[58px] text-[24px] font-bold leading-tight">{race.name}</strong>
          <span className={`flex items-center gap-1 ${reviewRating(race) ? "" : "opacity-50"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={reviewRating(race) ? "/reviews/ala-review-L.svg" : "/reviews/ala-review-L.svg"} alt="" width={29} height={51} className={reviewRating(race) ? "" : "brightness-0 invert"} />
            <span className="flex flex-col items-center"><span className="text-[32px] font-bold">{reviewRating(race).toFixed(1)}</span><span className="flex gap-px">{Array.from({ length: 5 }, (_, index) => { const fill = Math.max(0, Math.min(1, reviewRating(race) - index)); return <span key={index} aria-hidden="true" className="h-[7px] w-[8px]" style={{ clipPath: "polygon(50% 0%, 62% 35%, 100% 38%, 72% 62%, 80% 100%, 50% 78%, 20% 100%, 28% 62%, 0 38%, 38% 35%)", backgroundImage: reviewRating(race) ? `linear-gradient(90deg, #FFD900 0%, #FF8A00 ${fill * 100}%, rgba(255,255,255,.5) ${fill * 100}%, rgba(255,255,255,.5) 100%)` : "rgba(255,255,255,.5)" }} />; })}</span></span>
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/ala-review-R.svg" alt="" width={29} height={51} className={reviewRating(race) ? "" : "brightness-0 invert"} />
          </span>
          <span className="rounded-[20px] border-2 border-white/15 px-[38px] py-[9px] text-[16px] font-medium">{reviewRating(race) ? "Ver reseñas" : "¡Califica primero!"}</span>
        </ReviewGradientLink>)}
      </div>
      <section className="mx-auto mt-12 max-w-3xl px-[15px]"><h2 className="flex items-center gap-[11px] text-[24px] font-medium">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/tapbar/eventos.svg" alt="" width={30} height={30} className="brightness-0 invert" />Más eventos</h2>
        <div className="mt-5">{races.slice(6, 14).map((race) => <ReviewRaceRow key={race.id} race={race} />)}</div>
        {races.length > 14 ? <div className="mt-8 flex justify-center"><Link href="/reviews/finalizados" className="rounded-full border border-white/25 bg-white/[0.07] px-6 py-3 text-[16px] text-white backdrop-blur-xl transition hover:bg-white/[0.12]">Ver todos los eventos</Link></div> : null}
      </section>
    </> : <p className="mx-auto mt-12 max-w-md px-5 text-center text-white/55">Aún no hay eventos finalizados con ficha de reseñas.</p>}
  </main>;
}
