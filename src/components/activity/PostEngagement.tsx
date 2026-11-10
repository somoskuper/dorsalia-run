"use client";

import { useEffect, useState } from "react";
import PostReactions from "@/components/activity/PostReactions";

export default function PostEngagement({ postId, likeCount = 0, liked = false, commentCount = 0 }: {
  postId?: string | null;
  likeCount?: number;
  liked?: boolean;
  commentCount?: number;
  detail?: boolean;
}) {
  const [comments, setComments] = useState(commentCount);
  useEffect(() => { setComments(commentCount); }, [commentCount]);
  useEffect(() => {
    if (!postId) return;
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ postId?: string; delta?: number }>).detail;
      if (detail?.postId !== postId) return;
      setComments((value) => Math.max(0, value + (Number(detail.delta) || 0)));
    };
    window.addEventListener("dorsalia:comments-changed", onChange);
    return () => window.removeEventListener("dorsalia:comments-changed", onChange);
  }, [postId]);

  if (!postId) return null;
  return <div className="flex items-center gap-4">
    <PostReactions postId={postId} initialLikes={likeCount} initialLiked={liked} />
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("dorsalia:open-comments", { detail: postId }))} className="flex items-center gap-1.5 text-white" aria-label="Comentarios">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/settings-icons/coment.svg" alt="" width={24} height={24} className="h-6 w-6" style={{ filter: "brightness(0) invert(1)" }} />
      <span className="text-xs tabular-nums text-white/65">{comments}</span>
    </button>
  </div>;
}
