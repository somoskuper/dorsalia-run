import { createClient } from "@/lib/supabase/client";

export type SuggestedPerson = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  followers: number;
  registrations: number;
  reviews: number;
  ratings: number;
};

type Score = { followers: number; registrations: number; reviews: number; ratings: number };

function bump(scores: Map<string, Score>, userId: string | null | undefined, key: keyof Score) {
  if (!userId) return;
  const current = scores.get(userId) || { followers: 0, registrations: 0, reviews: 0, ratings: 0 };
  current[key] += 1;
  scores.set(userId, current);
}

function total(score: Score) {
  return score.followers + score.registrations + score.reviews + score.ratings;
}

/** People ranked by followers, registrations, reviews and ratings together. */
export async function fetchSuggestedPeople(viewerId?: string | null, limit = 12): Promise<SuggestedPerson[]> {
  const supabase = createClient();
  const [follows, reviews, leads, registrations, feed] = await Promise.all([
    supabase.from("social_follows").select("following_id").limit(1000),
    supabase.from("event_reviews").select("user_id,entry_type").eq("is_published", true).limit(1000),
    supabase.from("leads").select("user_id,race_event_id").not("user_id", "is", null).not("race_event_id", "is", null).limit(1000),
    supabase.from("activity_posts").select("user_id,race_event_id").eq("post_type", "registration").eq("is_published", true).limit(1000),
    supabase.rpc("public_activity_feed", { p_user_id: null, p_limit: 100, p_following_only: false }),
  ]);

  const identities = new Map<string, { username: string; displayName: string; avatarUrl: string | null }>();
  for (const item of Array.isArray(feed.data) ? feed.data as { user_id?: string; username?: string; display_name?: string; avatar_url?: string | null }[] : []) {
    if (!item.user_id || identities.has(item.user_id)) continue;
    identities.set(item.user_id, {
      username: item.username || "",
      displayName: item.display_name || "Corredor",
      avatarUrl: item.avatar_url || null,
    });
  }

  const scores = new Map<string, Score>();
  for (const follow of follows.data || []) bump(scores, follow.following_id, "followers");
  for (const review of reviews.data || []) bump(scores, review.user_id, review.entry_type === "rating" ? "ratings" : "reviews");

  const seenEvents = new Set<string>();
  for (const entry of [...(leads.data || []), ...(registrations.data || [])]) {
    if (!entry.user_id || !entry.race_event_id) continue;
    const key = `${entry.user_id}|${entry.race_event_id}`;
    if (seenEvents.has(key)) continue;
    seenEvents.add(key);
    bump(scores, entry.user_id, "registrations");
  }

  const ranked = [...scores.entries()]
    .filter(([userId, score]) => userId !== viewerId && total(score) > 0)
    .sort((a, b) => total(b[1]) - total(a[1]))
    .slice(0, limit);

  return ranked.map(([userId, score]) => {
    const identity = identities.get(userId);
    return {
      userId,
      username: identity?.username || "",
      displayName: identity?.displayName || "Corredor",
      avatarUrl: identity?.avatarUrl || null,
      ...score,
    };
  });
}

/** Fills avatars only for people missing from the feed, without blocking the first list. */
export async function hydrateSuggestedAvatars(people: SuggestedPerson[]): Promise<SuggestedPerson[]> {
  const missing = people.filter((person) => !person.avatarUrl || !person.username);
  if (!missing.length) return people;
  const supabase = createClient();
  const filled = await Promise.all(missing.map(async (person) => {
    const { data } = await supabase.rpc("public_athlete_profile", { p_user_id: person.userId });
    if (!data || typeof data !== "object") return person;
    const profile = data as { username?: string; display_name?: string; avatar_url?: string | null };
    return {
      ...person,
      username: profile.username || person.username,
      displayName: profile.display_name || person.displayName,
      avatarUrl: profile.avatar_url || person.avatarUrl,
    };
  }));
  const byId = new Map(filled.map((person) => [person.userId, person]));
  return people.map((person) => byId.get(person.userId) || person);
}
