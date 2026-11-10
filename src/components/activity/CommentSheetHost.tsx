"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PostComments from "@/components/activity/PostComments";

export default function CommentSheetHost() {
  const [postId, setPostId] = useState<string | null>(null);

  useEffect(() => {
    const open = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (typeof id === "string" && id) setPostId(id);
    };
    window.addEventListener("dorsalia:open-comments", open);
    return () => window.removeEventListener("dorsalia:open-comments", open);
  }, []);

  useEffect(() => {
    if (!postId) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPostId(null); };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [postId]);

  if (!postId || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end bg-black/60" onClick={() => setPostId(null)}>
      <section role="dialog" aria-label="Comentarios" onClick={(event) => event.stopPropagation()} className="flex h-[calc(100dvh-70px)] w-full flex-col rounded-t-[20px] bg-[#070707] text-white shadow-[0_-20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between px-[15px] pb-3 pt-4">
          <h2 className="text-[20px] font-semibold leading-6">Comentarios</h2>
          <button type="button" onClick={() => setPostId(null)} aria-label="Cerrar" className="grid h-10 w-10 place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/settings-icons/close.svg" alt="" width={24} height={24} className="h-6 w-6" />
          </button>
        </div>
        <PostComments key={postId} postId={postId} layout="sheet" />
      </section>
    </div>,
    document.body,
  );
}
