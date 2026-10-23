"use client";

import { useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import AssetIcon from "@/components/ui/AssetIcon";

export default function PostReactions({ postId, initialLikes = 0, initialLiked = false }: {
  postId?: string | null;
  initialLikes?: number;
  initialLiked?: boolean;
}) {
  const { user } = useAthleteAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setLikes(initialLikes); setLiked(initialLiked); }, [initialLikes, initialLiked]);

  async function toggleLike() {
    if (!postId) return;
    if (!user) { window.location.href = `/auth?next=${encodeURIComponent(location.pathname + location.search)}`; return; }
    if (busy) return;
    const wasActive = liked;
    setLiked(!wasActive);
    setLikes((value) => Math.max(0, value + (wasActive ? -1 : 1)));
    setBusy(true);
    const { data, error } = await createClient().rpc("toggle_activity_reaction", { p_post_id: postId, p_reaction_type: "like" });
    setBusy(false);
    if (error) {
      setLiked(wasActive);
      setLikes((value) => Math.max(0, value + (wasActive ? 1 : -1)));
      return;
    }
    setLiked(Boolean(data));
  }

  useEffect(() => {
    if (!postId) return;
    const listener = () => { if (!liked) void toggleLike(); };
    window.addEventListener(`dorsalia:like-post:${postId}`, listener);
    return () => window.removeEventListener(`dorsalia:like-post:${postId}`, listener);
  });

  if (!postId) return null;
  return <div className="flex items-center text-white">
    <button type="button" onClick={() => void toggleLike()} className="flex items-center gap-1.5" aria-label={liked ? "Quitar Me gusta" : "Me gusta"}>
      <AssetIcon name={liked ? "heart-solid" : "heart-stroke"} size={23} className={liked ? "text-[#c9f24b]" : "text-white"} />
      <span className="text-xs tabular-nums text-white/65">{likes}</span>
    </button>
  </div>;
}
