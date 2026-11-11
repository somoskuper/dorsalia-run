"use client";

import { useEffect, useState } from "react";
import AssetIcon from "@/components/ui/AssetIcon";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { fetchActivityComments, type ActivityComment } from "@/lib/activity";
import { askForAccount } from "@/components/account/AccountPrompt";
import { createClient } from "@/lib/supabase/client";
import { CommentsSkeleton } from "@/components/ui/Skeleton";
import AvatarImage from "@/components/ui/AvatarImage";

function notify(postId: string, delta: number) {
  window.dispatchEvent(new CustomEvent("dorsalia:comments-changed", { detail: { postId, delta } }));
}

function CommentLike({ comment }: { comment: ActivityComment }) {
  const { user } = useAthleteAuth();
  const [liked, setLiked] = useState(Boolean(comment.liked));
  const [likes, setLikes] = useState(Number(comment.like_count) || 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(Boolean(comment.liked));
    setLikes(Number(comment.like_count) || 0);
  }, [comment.liked, comment.like_count]);

  async function toggle() {
    if (!user) { askForAccount("dar me gusta"); return; }
    if (busy) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((value) => Math.max(0, value + (wasLiked ? -1 : 1)));
    setBusy(true);
    const { data, error } = await createClient().rpc("toggle_activity_comment_like", { p_comment_id: comment.id });
    setBusy(false);
    if (error) {
      setLiked(wasLiked);
      setLikes((value) => Math.max(0, value + (wasLiked ? 1 : -1)));
      return;
    }
    setLiked(Boolean(data));
  }

  return <button type="button" onClick={() => void toggle()} className="flex shrink-0 items-center gap-1.5 text-white" aria-label={liked ? "Quitar Me gusta" : "Me gusta"}>
    <AssetIcon name={liked ? "heart-solid" : "heart-stroke"} size={23} className={liked ? "text-[#c9f24b]" : "text-white"} />
    <span className="text-xs tabular-nums text-white/65">{likes}</span>
  </button>;
}

export default function PostComments({ postId, layout = "page", withComposer = false }: { postId: string; layout?: "page" | "sheet"; withComposer?: boolean }) {
  const { user } = useAthleteAuth();
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const next = await fetchActivityComments(postId);
    setComments(next);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchActivityComments(postId).then((next) => { if (active) setComments(next); }).catch(() => { if (active) setError("No se pudieron cargar los comentarios."); }).finally(() => { if (active) setLoading(false); });
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ postId?: string }>).detail;
      if (detail?.postId === postId) void load().catch(() => undefined);
    };
    window.addEventListener("dorsalia:comments-changed", onChange);
    return () => { active = false; window.removeEventListener("dorsalia:comments-changed", onChange); };
  }, [postId]);

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    const text = body.trim();
    if (!user || !text || saving) return;
    setSaving(true); setError("");
    try {
      const { error: insertError } = await createClient().from("activity_post_comments").insert({ post_id: postId, user_id: user.id, body: text.slice(0, 2000) });
      if (insertError) setError(insertError.message);
      else { setBody(""); notify(postId, 1); }
    } finally { setSaving(false); }
  }

  async function removeComment(id: string) {
    if (!window.confirm("¿Eliminar este comentario?")) return;
    const { error: deleteError } = await createClient().from("activity_post_comments").delete().eq("id", id);
    if (deleteError) { setError(deleteError.message); return; }
    notify(postId, -1);
  }

  const list = loading ? <CommentsSkeleton /> : comments.length ? <ul>{comments.map((comment) => <li key={comment.id} className="border-b border-white/15 py-4">
    <div className="flex items-start gap-3">
      {comment.avatar_url ? <AvatarImage src={comment.avatar_url} size={40} className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="h-10 w-10 shrink-0 rounded-full bg-white/20" />}
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold leading-6">{comment.display_name || "Usuario"}</p>
        <p className="text-[13px] text-white/50">{new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(comment.created_at))}</p>
      </div>
      <CommentLike comment={comment} />
    </div>
    <p className="mt-3 whitespace-pre-line text-[16px] leading-6 text-white">{comment.body}</p>
    {comment.mine ? <button type="button" onClick={() => void removeComment(comment.id)} className="mt-2 text-[13px] text-white/40">Eliminar</button> : null}
  </li>)}</ul> : <p className="py-4 text-[16px] text-white/50">Todavía no hay comentarios.</p>;

  const frame = layout === "sheet" ? "px-[15px] pb-[70px] pt-3" : "pt-4";
  const composer = user ? <form onSubmit={(event) => void publish(event)} className={frame}>
    <div className="flex items-end gap-2">
      <textarea id={`post-comment-${postId}`} value={body} onChange={(event) => setBody(event.target.value.slice(0, 2000))} onKeyDown={(event) => { if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return; event.preventDefault(); if (!body.trim() || saving) return; event.currentTarget.form?.requestSubmit(); }} placeholder="Comentar" rows={1} className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] border border-white/40 bg-white/10 px-4 py-3 text-[16px] outline-none placeholder:text-white/50" />
      <button type="submit" disabled={saving || !body.trim()} style={{ color: "#0E0E0E" }} className="shrink-0 rounded-full bg-white px-4 py-3 text-[16px] font-bold disabled:opacity-50">{saving ? "Publicando…" : "Comentar"}</button>
    </div>
  </form> : <p className={`${frame} text-[16px] text-white/50`}><button type="button" onClick={() => askForAccount("comentar")} className="text-white underline">Crea una cuenta</button> para comentar.</p>;

  if (layout === "sheet") return <>
    <div className="min-h-0 flex-1 overflow-y-auto px-[15px]">{list}{error ? <p role="alert" className="py-3 text-sm text-[#DE5757]">{error}</p> : null}</div>
    {composer}
  </>;

  return <>
    {list}
    {error ? <p role="alert" className="mt-4 text-sm text-[#DE5757]">{error}</p> : null}
    {withComposer ? composer : null}
  </>;
}
