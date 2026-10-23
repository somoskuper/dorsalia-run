import { createClient } from "@/lib/supabase/client";

export type ActivityPhoto = { id: string; image_url: string; storage_path?: string | null; sort_order: number };
export type ActivityItem = {
  id: string;
  post_type: "review" | "registration" | "share" | "free";
  body: string;
  created_at: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  race_event_id?: string | null;
  event_name?: string | null;
  event_slug?: string | null;
  event_cover_url?: string | null;
  review_id?: string | null;
  rating?: number | null;
  mine?: boolean;
  like_count?: number;
  repost_count?: number;
  liked?: boolean;
  reposted?: boolean;
  photos: ActivityPhoto[];
};

export async function fetchActivityFeed(userId?: string | null, limit = 50, followingOnly = false): Promise<ActivityItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_activity_feed", {
    p_user_id: userId || null,
    p_limit: limit,
    p_following_only: followingOnly,
  });
  if (error) throw error;
  return Array.isArray(data) ? data as ActivityItem[] : [];
}
