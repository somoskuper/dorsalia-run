import { eventHasFinished, type PublicRace } from "@/lib/races";

const PINNED_FINISHED_SLUGS = ["ironman-70-3-campeche"];

export function isPinnedFinishedEvent(race: Pick<PublicRace, "slug" | "public_subdomain" | "event_slug">) {
  const slugs = [race.public_subdomain, race.slug, race.event_slug].map((value) => String(value || "").toLowerCase());
  return slugs.some((slug) => PINNED_FINISHED_SLUGS.includes(slug));
}

export function pinFinishedEvents<T extends Pick<PublicRace, "slug" | "public_subdomain" | "event_slug">>(races: T[]) {
  return [...races.filter(isPinnedFinishedEvent), ...races.filter((race) => !isPinnedFinishedEvent(race))];
}

export function reviewRating(race: PublicRace): number {
  const count = Number(race.review_count) || 0;
  const average = Number(race.rating_average) || 0;
  return count > 0 && average > 0 ? average : 0;
}

function engagement(race: PublicRace): number {
  return (Number(race.view_count) || 0) + (Number(race.save_count) || 0);
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

function finishedAt(race: PublicRace): number {
  const end = Date.parse(String(race.event_end_date || ""));
  return Number.isFinite(end) ? end : NaN;
}

function raceAt(race: PublicRace): number {
  const start = Date.parse(String(race.event_date || ""));
  if (Number.isFinite(start)) return start;
  return finishedAt(race);
}

function byReviews(a: PublicRace, b: PublicRace) {
  const reviewDiff = (Number(b.review_comment_count) || 0) - (Number(a.review_comment_count) || 0);
  return reviewDiff || engagement(b) - engagement(a);
}

/** Carrusel de /review: solo lo finalizado en el último mes. Ironman queda en el puesto 1 durante dos semanas. Lo más viejo pasa a “Más eventos”. */
export function reviewLists(races: PublicRace[], now = Date.now()): { featured: PublicRace[]; more: PublicRace[] } {
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const finished = races.filter((race) => eventHasFinished(race, new Date(now)));
  const recent = finished.filter((race) => {
    const day = raceAt(race);
    return Number.isFinite(day) && day <= now && day >= lastMonth.getTime();
  });
  const older = finished.filter((race) => !recent.some((raceInMonth) => raceInMonth.id === race.id));
  recent.sort(byReviews);
  const ironman = recent.find((race) => isPinnedFinishedEvent(race) && now - raceAt(race) <= TWO_WEEKS_MS);
  const featured = ironman ? [ironman, ...recent.filter((race) => race.id !== ironman.id)] : recent;
  older.sort((a, b) => {
    const aRating = reviewRating(a), bRating = reviewRating(b);
    if (aRating && bRating) return bRating - aRating || (Number(b.review_comment_count) || 0) - (Number(a.review_comment_count) || 0);
    if (aRating || bRating) return bRating ? 1 : -1;
    return engagement(b) - engagement(a);
  });
  return { featured, more: older };
}

export function reviewDirectory(races: PublicRace[], now = Date.now()): PublicRace[] {
  const { featured, more } = reviewLists(races, now);
  return [...featured, ...more];
}
