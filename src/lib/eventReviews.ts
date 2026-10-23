import { createClient } from "@/lib/supabase/client";

export type ReviewPhoto = {
  id: string;
  image_url: string;
  storage_path?: string | null;
  sort_order: number;
};

export type EventReview = {
  id: string;
  author_user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  mine: boolean;
  author_name: string;
  author_username?: string | null;
  author_avatar_url?: string | null;
  activity_post_id?: string | null;
  like_count?: number;
  repost_count?: number;
  liked?: boolean;
  reposted?: boolean;
  photos: ReviewPhoto[];
};

export type EventReviewData = {
  average: number;
  count: number;
  reviews: EventReview[];
};

export type AthleteReview = {
  id: string;
  race_event_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  event_name: string;
  event_slug?: string | null;
  event_date?: string | null;
  event_cover_url?: string | null;
  photos: ReviewPhoto[];
};

export type PublicAthleteProfile = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  reviews: AthleteReview[];
};

export const EMPTY_EVENT_REVIEWS: EventReviewData = {
  average: 0,
  count: 0,
  reviews: [],
};

export async function fetchEventReviews(raceEventId: string): Promise<EventReviewData> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_event_reviews", {
    p_race_event_id: raceEventId,
  });
  if (error) throw error;
  const row = (data || {}) as Partial<EventReviewData>;
  return {
    average: Number(row.average) || 0,
    count: Number(row.count) || 0,
    reviews: Array.isArray(row.reviews) ? row.reviews : [],
  };
}
