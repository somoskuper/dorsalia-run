import ReviewFinalizedList from "@/components/reviews/ReviewFinalizedList";
import { fetchPublicRaces } from "@/lib/races";
import { reviewDirectory } from "@/lib/reviewDirectory";

export const revalidate = 60;

export default async function FinalizedReviewsPage() {
  const races = reviewDirectory(await fetchPublicRaces({ status: "all" }));
  return <ReviewFinalizedList races={races} />;
}
