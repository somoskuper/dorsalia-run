import { NextResponse } from "next/server";
import {
  cardCoverImage,
  fetchPublicRaces,
  formatDateTime,
  formatMinPrice,
  marketplaceEventUrl,
  organizerImage,
  organizerLabel,
  placeLabel,
} from "@/lib/races";
import { topRatedRaces } from "@/lib/topRatedRaces";

const absoluteImage = (value: string | null) => {
  if (!value) return null;
  try {
    const url = new URL(value, "https://dorsalia.run");
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};

export async function GET() {
  const races = topRatedRaces(await fetchPublicRaces({ status: "all" }), 3);
  const events = races.map((race) => {
    const { date, time } = formatDateTime(race.event_date);
    return {
      id: race.id,
      name: race.name,
      href: marketplaceEventUrl(race),
      cover: absoluteImage(cardCoverImage(race)),
      organizer: organizerLabel(race),
      organizerLogo: absoluteImage(organizerImage(race)),
      organizerPlace: placeLabel(race),
      verification: race.listing_type === "native" ? "native" : !race.organizer_is_provisional ? "claimed" : null,
      badge: formatMinPrice(race),
      date: [date, time].filter(Boolean).join(", "),
    };
  });

  return NextResponse.json({ events }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
