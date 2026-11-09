import type { PublicRace } from "@/lib/races";

export function reviewRating(race: PublicRace): number {
  const count = Number(race.review_count) || 0;
  const average = Number(race.rating_average) || 0;
  return count > 0 && average > 0 ? average : 0;
}

function engagement(race: PublicRace): number {
  return (Number(race.view_count) || 0) + (Number(race.save_count) || 0);
}

export function reviewDirectory(races: PublicRace[], now = Date.now()): PublicRace[] {
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const finished = races.filter((race) => {
    const end = Date.parse(String(race.event_end_date || race.event_date || ""));
    return Number.isFinite(end) && end <= now;
  });
  const recent = finished.filter((race) => Date.parse(String(race.event_end_date || race.event_date)) >= lastMonth.getTime());
  recent.sort((a, b) => {
    const reviewDiff = (Number(b.review_comment_count) || 0) - (Number(a.review_comment_count) || 0);
    return reviewDiff || engagement(b) - engagement(a);
  });
  const featured = recent.slice(0, 5);
  const featuredIds = new Set(featured.map((race) => race.id));
  const rest = finished.filter((race) => !featuredIds.has(race.id));
  rest.sort((a, b) => {
    const aRating = reviewRating(a), bRating = reviewRating(b);
    if (aRating && bRating) return bRating - aRating || (Number(b.review_comment_count) || 0) - (Number(a.review_comment_count) || 0);
    if (aRating || bRating) return bRating ? 1 : -1;
    return engagement(b) - engagement(a);
  });
  return [...featured, ...rest];
}
