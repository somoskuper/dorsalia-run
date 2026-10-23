import type { PublicRace } from "@/lib/races";
import { isFinalized } from "@/lib/races";

export function discoveryScore(race: PublicRace): number {
  const reviews = Number(race.review_count) || 0;
  const rating = Number(race.rating_average) || 0;
  const comments = (Number(race.review_comment_count) || 0) + (Number(race.community_comment_count) || 0);
  return (reviews ? rating * 60 : 0) + reviews * 22 + comments * 7 + (Number(race.share_count) || 0) * 10 + (Number(race.save_count) || 0) * 8 + Math.log1p(Number(race.view_count) || 0) * 12;
}

/** Shared ordering for the homepage and the public-site footer excerpt. */
export function topRatedRaces(races: PublicRace[], limit = 6): PublicRace[] {
  return races
    .filter((race) => !isFinalized(race))
    .sort((a, b) => discoveryScore(b) - discoveryScore(a)
      || (Date.parse(a.event_date || "") || Number.MAX_SAFE_INTEGER)
      - (Date.parse(b.event_date || "") || Number.MAX_SAFE_INTEGER))
    .slice(0, limit);
}
