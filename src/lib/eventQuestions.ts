import { createClient } from "@/lib/supabase/client";

export type CommunityQuestion = {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author_user_id: string;
  author_name: string;
  author_username?: string | null;
  author_avatar_url?: string | null;
  mine: boolean;
  replies?: CommunityQuestion[];
};

export type CommunityQuestionData = { count: number; threads: CommunityQuestion[] };
export const EMPTY_COMMUNITY_QUESTIONS: CommunityQuestionData = { count: 0, threads: [] };

export async function fetchEventCommunityQuestions(raceEventId: string): Promise<CommunityQuestionData> {
  const { data, error } = await createClient().rpc("public_event_community_questions", { p_race_event_id: raceEventId });
  if (error) throw error;
  const row = (data || {}) as Partial<CommunityQuestionData>;
  return { count: Number(row.count) || 0, threads: Array.isArray(row.threads) ? row.threads : [] };
}
