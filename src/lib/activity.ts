import { createClient } from "@/lib/supabase/client";
import { isPortfolioName } from "@/lib/creatorPortfolio";

export type ActivityPhoto = { id: string; image_url: string; storage_path?: string | null; sort_order: number };
export type ActivityItem = {
  id: string;
  post_type: "review" | "registration" | "share" | "free" | "creator";
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
  creator_publication_id?: string | null;
  gallery_name?: string | null;
  rating?: number | null;
  mine?: boolean;
  like_count?: number;
  repost_count?: number;
  comment_count?: number;
  liked?: boolean;
  reposted?: boolean;
  photos: ActivityPhoto[];
};

export type ActivityComment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  mine: boolean;
  like_count?: number;
  liked?: boolean;
};

async function withCreatorDescriptions(items: ActivityItem[]): Promise<ActivityItem[]> {
  const ids = [...new Set(items.filter((item) => item.post_type === "creator" && item.creator_publication_id).map((item) => item.creator_publication_id as string))];
  if (!ids.length) return items;
  const supabase = createClient();
  const { data } = await supabase.from("creator_publications").select("id,description").in("id", ids);
  const descriptions = new Map((data || []).map((row) => [row.id as string, typeof row.description === "string" ? row.description.trim() : ""]));
  return items.map((item) => item.post_type === "creator" && item.creator_publication_id
    ? { ...item, body: descriptions.get(item.creator_publication_id) || "" }
    : item);
}

export async function fetchActivityFeed(userId?: string | null, limit = 50, followingOnly = false): Promise<ActivityItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_activity_feed", {
    p_user_id: userId || null,
    p_limit: limit,
    p_following_only: followingOnly,
  });
  if (error) throw error;
  return withCreatorDescriptions(Array.isArray(data) ? data as ActivityItem[] : []);
}

export async function fetchActivityPost(postId: string): Promise<ActivityItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_activity_post", { p_post_id: postId });
  if (error) throw error;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const [post] = await withCreatorDescriptions([data as ActivityItem]);
  return post || null;
}

export async function fetchActivityComments(postId: string): Promise<ActivityComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("public_activity_post_comments", { p_post_id: postId });
  if (error) throw error;
  return Array.isArray(data) ? data as ActivityComment[] : [];
}

export function creatorPhotoPosts(items: ActivityItem[]) {
  return items.filter((item) => item.post_type === "creator" && item.photos?.length && !isPortfolioName(item.gallery_name) && !isPortfolioName(item.body));
}

export type EventPhotoGroup = {
  key: string;
  event_slug: string;
  event_name: string;
  event_cover_url: string | null;
  latest: string;
  photos: ActivityPhoto[];
};

function shuffle<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

export function eventPhotoGroups(items: ActivityItem[], limit = 6): EventPhotoGroup[] {
  const groups = new Map<string, { item: ActivityItem; posts: ActivityItem[] }>();
  for (const item of creatorPhotoPosts(items)) {
    const key = (item.event_slug || item.race_event_id || "").toLowerCase();
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.posts.push(item);
    else groups.set(key, { item, posts: [item] });
  }
  return [...groups.entries()].map(([key, { item, posts }]) => {
    const creators = new Set(posts.map((post) => post.user_id));
    const all = posts.flatMap((post) => [...post.photos].sort((a, b) => a.sort_order - b.sort_order));
    return {
      key,
      event_slug: item.event_slug || key,
      event_name: item.event_name || "",
      event_cover_url: item.event_cover_url || null,
      latest: posts.reduce((value, post) => post.created_at > value ? post.created_at : value, item.created_at),
      photos: (creators.size > 1 ? shuffle(all) : all).slice(0, limit),
    };
  }).sort((a, b) => b.latest.localeCompare(a.latest));
}
