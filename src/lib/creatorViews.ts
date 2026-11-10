import { createClient } from "@/lib/supabase/client";

const seen = new Set<string>();

function visitorToken() {
  const key = "dorsalia-creator-visitor";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const token = crypto.randomUUID();
  window.localStorage.setItem(key, token);
  return token;
}

/** Counts a view of a creator post. The id is the publication id already used by the panel. */
export function recordCreatorPublicationView(publicationId: string | null | undefined, surface: "feed" | "fotos" | "gallery") {
  if (!publicationId || typeof window === "undefined") return;
  const key = `${surface}:${publicationId}`;
  if (seen.has(key)) return;
  seen.add(key);
  void createClient().rpc("record_creator_publication_view", {
    p_publication_id: publicationId,
    p_visitor_token: visitorToken(),
  });
}
