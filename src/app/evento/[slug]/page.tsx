import { notFound, permanentRedirect } from "next/navigation";
import { fetchPublicRaceBySlug, marketplaceEventUrl } from "@/lib/races";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

/** Stable legacy entry point: preserves old links while moving SEO to /carreras/… */
export default async function LegacyEventPage({ params }: Props) {
  const { slug } = await params;
  const race = await fetchPublicRaceBySlug(slug);
  if (!race) notFound();
  permanentRedirect(marketplaceEventUrl(race));
}
