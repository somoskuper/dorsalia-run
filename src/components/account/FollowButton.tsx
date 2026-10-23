"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const { user } = useAthleteAuth();
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const ownProfile = user?.id === targetUserId;

  const refresh = useCallback(async () => {
    const { data } = await createClient().rpc("public_follow_stats", { p_user_id: targetUserId });
    if (!data || typeof data !== "object") return;
    const row = data as { followers?: number; following?: number; is_following?: boolean };
    setFollowers(Number(row.followers) || 0);
    setFollowingCount(Number(row.following) || 0);
    setFollowing(Boolean(row.is_following));
  }, [targetUserId]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    window.addEventListener("focus", refresh);
    window.addEventListener("dorsalia:social-updated", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("dorsalia:social-updated", refresh);
    };
  }, [refresh, user?.id]);

  async function toggle() {
    if (!user) {
      window.location.href = `/auth?next=${encodeURIComponent(`/perfil/${targetUserId}`)}`;
      return;
    }
    setSaving(true);
    const { error } = await createClient().rpc("toggle_follow", { p_target_user_id: targetUserId });
    if (!error) {
      await refresh();
      window.dispatchEvent(new Event("dorsalia:social-updated"));
    }
    setSaving(false);
  }

  const listHref = (kind: "followers" | "following") =>
    `/seguidores/${targetUserId}?vista=${kind}${ownProfile ? "&origen=cuenta" : ""}`;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-4">
      {!ownProfile ? (
        <button type="button" onClick={() => void toggle()} disabled={saving} className={following ? "rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white" : "rounded-full bg-[#c9f24b] px-5 py-2.5 text-sm font-bold text-black"}>
          {saving ? "…" : following ? "Siguiendo" : "Seguir"}
        </button>
      ) : null}
      <Link href={listHref("followers")} className="text-sm text-white/55 transition-colors hover:text-white"><strong className="text-white">{followers}</strong> seguidores</Link>
      <Link href={listHref("following")} className="text-sm text-white/55 transition-colors hover:text-white"><strong className="text-white">{followingCount}</strong> siguiendo</Link>
    </div>
  );
}
