"use client";

import ReviewPost from "@/components/reviews/ReviewPost";
import type { AthleteReview } from "@/lib/eventReviews";
import { publicEventPath, usePublicEventPaths } from "@/lib/usePublicEventPaths";

export default function ProfileReviews({ reviews, authorName = "Corredor Dorsalia", username, avatarUrl, profileHref }: {
  reviews: AthleteReview[];
  authorName?: string;
  username?: string | null;
  avatarUrl?: string | null;
  profileHref?: string;
}) {
  const eventPaths = usePublicEventPaths();
  if (!reviews.length) return <p className="mt-5 text-[14px] text-white/40">Las reseñas publicadas en eventos aparecerán aquí.</p>;
  return <div className="-mx-5 mt-5 space-y-0 md:mx-auto md:max-w-2xl">
    {reviews.map((review) => <ReviewPost
      key={review.id}
      authorName={authorName}
      username={username}
      avatarUrl={avatarUrl}
      profileHref={profileHref}
      rating={review.rating}
      comment={review.comment}
      photos={review.photos}
      fallbackImage={review.event_cover_url}
      eventName={review.event_name}
      eventHref={publicEventPath(eventPaths, review.event_slug)}
      updatedAt={review.updated_at}
      variant="feed"
    />)}
  </div>;
}
