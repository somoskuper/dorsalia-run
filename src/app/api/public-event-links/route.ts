import { NextResponse } from "next/server";
import { fetchPublicRaces, marketplaceEventPath } from "@/lib/races";

export async function GET() {
  const races = await fetchPublicRaces({ status: "all" });
  const paths: Record<string, string> = {};

  for (const race of races) {
    if (!race.is_published) continue;
    const path = marketplaceEventPath(race);
    for (const key of [race.id, race.public_subdomain, race.slug, race.event_slug]) {
      if (key) paths[key.toLowerCase()] = path;
    }
  }

  return NextResponse.json(paths, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
