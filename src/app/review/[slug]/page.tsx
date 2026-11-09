import { notFound } from "next/navigation";
import { fetchPublicRaceBySlug } from "@/lib/races";
import ReviewDetail from "@/components/reviews/ReviewDetail";

export const revalidate = 60;
type Props = { params: Promise<{ slug: string }> };

export default async function ReviewEventPage({ params }: Props) {
  const { slug } = await params;
  const race = await fetchPublicRaceBySlug(slug);
  if (!race) notFound();
  const endedAt = Date.parse(String(race.event_end_date || race.event_date || ""));
  if (!Number.isFinite(endedAt) || endedAt > Date.now()) notFound();
  return <ReviewDetail race={race} />;
}
