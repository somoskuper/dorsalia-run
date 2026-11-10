"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSavedRaces } from "@/components/SavedRacesProvider";
import { topRatedRaces } from "@/lib/topRatedRaces";
import { isPinnedFinishedEvent, reviewDirectory } from "@/lib/reviewDirectory";
import ReviewRaceRow from "@/components/reviews/ReviewRaceRow";
import EventPhotoRail from "@/components/activity/EventPhotoRail";
import AssetIcon from "@/components/ui/AssetIcon";
import {
  billboardSlug,
  cardCoverImage,
  coverImage,
  formatDateTime,
  formatMinPrice,
  isFinalized,
  marketplaceEventPath,
  placeLabel,
  sortByClosestDate,
  type PublicRace,
} from "@/lib/races";

const ASSETS = "/mobile-home";
const SPORTS = [
  { id: "running", label: "Running", href: "/carreras/running", icon: "imgRun.svg" },
  { id: "padel", label: "Pádel", href: "/carreras/padel", icon: "padel.svg" },
  { id: "cycling", label: "Ciclismo", href: "/carreras/cycling", icon: "imgBiking.svg" },
  { id: "triathlon", label: "Triatlón", href: "/carreras/triathlon", icon: "imgSwimming.svg" },
] as const;

function shortTitle(value: string, max = 38) {
  const chars = Array.from(value.trim());
  return chars.length > max ? chars.slice(0, max - 1).join("").trimEnd() + "…" : value;
}

function normalize(value: string | null | undefined) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function currentMondayRange() {
  const now = new Date();
  const merida = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Merida",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(merida.find((part) => part.type === type)?.value || 0);
  const localDate = new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  const daysSinceMonday = (localDate.getUTCDay() + 6) % 7;
  const mondayDate = new Date(localDate.getTime() - daysSinceMonday * 86_400_000);
  const start = mondayDate.getTime() + 6 * 60 * 60 * 1000;
  return { start, end: start + 7 * 86_400_000 };
}

function SectionTitle({ children, href }: { children: string; href: string }) {
  return <div className="mb-5 flex items-center justify-between gap-3 px-[17px]">
    <h2 className="line-clamp-2 text-[24px] font-normal leading-[1.2] text-white">{children}</h2>
    <Link href={href} aria-label={`Ver más: ${children}`} className="grid h-8 w-8 shrink-0 place-items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={`${ASSETS}/imgChevronRight.svg`} alt="" width={24} height={24} />
    </Link>
  </div>;
}

function SquareCard({ race, review = false }: { race: PublicRace; review?: boolean }) {
  const { isSaved, toggleSave } = useSavedRaces();
  const image = cardCoverImage(race) || coverImage(race);
  const href = review ? `/review/${encodeURIComponent(billboardSlug(race))}` : marketplaceEventPath(race);
  const rating = Number(race.rating_average) || 0;
  const saved = isSaved(race.id);
  async function share() {
    const url = new URL(marketplaceEventPath(race), window.location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: race.name, url });
      else await navigator.clipboard.writeText(url);
    } catch { /* cancelled or unsupported */ }
  }
  return <article className="w-[250px] shrink-0">
    <Link href={href} className="block h-[250px] w-[250px] overflow-hidden rounded-[15px] bg-white/10">
      {image ? /* eslint-disable-next-line @next/next/no-img-element */<img src={image} alt={race.name} loading="lazy" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center px-4 text-center text-white/60">{race.name}</span>}
    </Link>
    <div className="mt-3 flex min-h-[38px] items-start justify-between gap-2 px-[5px]">
      <Link href={href} className="line-clamp-2 min-w-0 flex-1 text-[16px] font-medium leading-[1.2] text-white">{shortTitle(race.name)}</Link>
      {review ? <span className="inline-flex shrink-0 items-center gap-1 text-[16px] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={`${ASSETS}/imgStarSolid2.svg`} alt="" width={19} height={19} className={rating ? "" : "grayscale opacity-50"} />{rating.toFixed(1)}
      </span> : <span className="flex shrink-0 items-center gap-1">
        <button type="button" onClick={() => void toggleSave(race.id)} aria-label={saved ? `Quitar ${race.name} de guardados` : `Guardar ${race.name}`} aria-pressed={saved} className={saved ? "text-[#c9f24b]" : "text-white/70"}>
          <AssetIcon name={saved ? "heart-solid" : "heart-stroke"} size={26} />
        </button>
        <button type="button" onClick={() => void share()} aria-label={`Compartir ${race.name}`} className="opacity-70">
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src={`${ASSETS}/imgShare1.svg`} alt="" width={26} height={26} />
        </button>
      </span>}
    </div>
  </article>;
}

function WeeklyCard({ race }: { race: PublicRace }) {
  const image = cardCoverImage(race) || coverImage(race);
  return <Link href={marketplaceEventPath(race)} className="w-[140px] shrink-0 text-white">
    <span className="block h-[140px] w-[140px] overflow-hidden rounded-[20px] bg-white/10">{image ? /* eslint-disable-next-line @next/next/no-img-element */<img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}</span>
    <strong className="mt-[6px] block h-[32px] overflow-hidden text-[14px] leading-[16px] line-clamp-2">{shortTitle(race.name, 38)}</strong>
    <span className="mt-[5px] block truncate text-[10px] leading-3 text-white/50">{placeLabel(race)}</span>
    <span className="block text-[12px] leading-4">{formatMinPrice(race)}</span>
  </Link>;
}

export default function MobileHome({ races, residence = "", selectedSport = "running", photoRail }: { races: PublicRace[]; residence?: string; selectedSport?: string; photoRail?: React.ReactNode }) {
  const sportRaces = useMemo(() => races.filter((race) => normalize(race.sport_category || "running") === selectedSport), [races, selectedSport]);
  const best = useMemo(() => topRatedRaces(sportRaces, 12), [sportRaces]);
  const weekly = useMemo(() => {
    const week = currentMondayRange();
    const home = normalize(residence);
    return sortByClosestDate(sportRaces.filter((race) => {
      const eventTime = Date.parse(race.event_date || "");
      return !isFinalized(race) && Number.isFinite(eventTime) && eventTime >= week.start && eventTime < week.end;
    })).sort((a, b) => {
      if (!home) return 0;
      const isNear = (race: PublicRace) => {
        const city = normalize(race.city);
        const state = normalize(race.state);
        return Boolean(city && home.includes(city)) || Boolean(state && home.includes(state)) || normalize(placeLabel(race)).includes(home);
      };
      return Number(isNear(b)) - Number(isNear(a));
    });
  }, [sportRaces, residence]);
  const pinnedFinished = useMemo(() => reviewDirectory(races).filter(isPinnedFinishedEvent), [races]);
  const finished = useMemo(() => [...pinnedFinished, ...reviewDirectory(sportRaces).filter((race) => !isPinnedFinishedEvent(race))].slice(0, 12), [pinnedFinished, sportRaces]);
  const ranked = useMemo(() => finished.slice(0, 6), [finished]);
  const activeLabel = SPORTS.find((sport) => sport.id === selectedSport)?.label || "Running";

  return <div className="min-h-screen bg-[#0e0e0e] pb-24 text-white">
    <nav aria-label="Deportes" className="mt-[28px] flex gap-[10px] overflow-x-auto px-[17px] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {SPORTS.map((sport) => <Link key={sport.id} href={sport.href} aria-current={selectedSport === sport.id ? "page" : undefined} className={`flex shrink-0 items-center gap-[6px] rounded-full px-[15px] py-[10px] text-[16px] leading-[24px] ${selectedSport === sport.id ? "bg-[#f2f2f2]" : "bg-[#2d2d2d]"}`} style={{ color: selectedSport === sport.id ? "#0e0e0e" : "#ffffff" }}>
        {sport.icon ? /* eslint-disable-next-line @next/next/no-img-element */<img src={`${ASSETS}/${sport.icon}`} alt="" width={24} height={24} className={selectedSport === sport.id ? "brightness-0" : "brightness-0 invert"} /> : null}
        {sport.label}
      </Link>)}
    </nav>

    <Link href="/review" className="relative mx-[15px] mt-[30px] flex h-[200px] items-center gap-1 overflow-hidden rounded-[29px] bg-[#79ad00] p-[20px]">
      <span className="relative z-10 flex w-[58%] shrink-0 flex-col items-start gap-[10px]">
        <span className="flex gap-1">{Array.from({ length: 5 }, (_, i) => /* eslint-disable-next-line @next/next/no-img-element */<img key={i} src={`${ASSETS}/imgVuesaxLinearStar1.svg`} alt="" width={24} height={24} />)}</span>
        <span className="text-[16px] leading-[19px]">Califica y reseña los eventos en donde hayas participado</span>
        <span className="rounded-full bg-white px-[17px] py-[8px] text-[16px] font-bold leading-none text-[#070707]">Calificar ahora</span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={`${ASSETS}/imagen-califica.svg`} alt="Rating average 4.9" width={210} height={210} className="absolute -right-[24px] top-1/2 h-[210px] w-[210px] -translate-y-1/2 object-contain" />
    </Link>

    {best.length ? <section className="mt-[30px]">
      <SectionTitle href="/carreras/mejor-valoradas">Mejores valorados</SectionTitle>
      <div className="flex gap-[15px] overflow-x-auto overscroll-x-contain px-[17px] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{best.map((race) => <SquareCard key={race.id} race={race} />)}</div>
    </section> : <p className="mx-[17px] mt-8 text-[16px] text-white/60">Aún no hay eventos de {activeLabel.toLowerCase()} publicados.</p>}

    <div className="contents">{photoRail ?? <EventPhotoRail />}</div>

    {weekly.length ? <section className="mt-[32px]"><SectionTitle href="/carreras/esta-semana">Próxima semana</SectionTitle>
      <div className="flex gap-4 overflow-x-auto overscroll-x-contain px-[17px] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{weekly.map((race) => <WeeklyCard key={race.id} race={race} />)}</div>
    </section> : null}

    {finished.length ? <section className="mt-[40px]"><SectionTitle href="/review">Califica tu experiencia</SectionTitle>
      <div className="flex gap-[15px] overflow-x-auto overscroll-x-contain px-[17px] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{finished.map((race) => <SquareCard key={race.id} race={race} review />)}</div>
    </section> : null}

    {ranked.length ? <section className="mt-[36px]"><SectionTitle href="/review">Eventos finalizados</SectionTitle>
      <div className="mt-4">{ranked.map((race) => <ReviewRaceRow key={race.id} race={race} className="px-[15px]" />)}</div>
    </section> : null}
  </div>;
}
