"use client";

import { useCallback, useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { askForAccount } from "@/components/account/AccountPrompt";
import { createClient } from "@/lib/supabase/client";

export function useFollowState(userId: string, loginNext?: string) {
  const { user } = useAthleteAuth();
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await createClient().rpc("public_follow_stats", { p_user_id: userId });
    if (!data || typeof data !== "object") return;
    const stats = data as { followers?: number; following?: number; is_following?: boolean };
    setFollowers(Number(stats.followers) || 0);
    setFollowing(Number(stats.following) || 0);
    setIsFollowing(Boolean(stats.is_following));
  }, [userId]);

  useEffect(() => {
    void refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("dorsalia:social-updated", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("dorsalia:social-updated", refresh);
    };
  }, [refresh, user?.id]);

  async function toggleFollow() {
    if (!user) {
      askForAccount("seguir", loginNext || `/perfil/${userId}`);
      return;
    }
    setSaving(true);
    const { error } = await createClient().rpc("toggle_follow", { p_target_user_id: userId });
    if (!error) {
      await refresh();
      window.dispatchEvent(new Event("dorsalia:social-updated"));
    }
    setSaving(false);
  }

  return { followers, following, isFollowing, saving, toggleFollow, viewerId: user?.id ?? null };
}
