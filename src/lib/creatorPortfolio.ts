import type { SupabaseClient } from "@supabase/supabase-js";

export function isPortfolioName(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "portafolio";
}

export async function detachPortfolioActivity(supabase: SupabaseClient, userId: string, publicationId: string, activityPostId: string | null) {
  if (!activityPostId) return;
  await supabase.from("creator_publications").update({ activity_post_id: null }).eq("id", publicationId).eq("creator_id", userId);
  await supabase.from("activity_posts").delete().eq("id", activityPostId).eq("user_id", userId);
}
