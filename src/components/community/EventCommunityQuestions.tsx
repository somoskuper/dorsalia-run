"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import AssetIcon from "@/components/ui/AssetIcon";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import { EMPTY_COMMUNITY_QUESTIONS, fetchEventCommunityQuestions, type CommunityQuestion } from "@/lib/eventQuestions";
import { askForAccount } from "@/components/account/AccountPrompt";
import { CommentsSkeleton } from "@/components/ui/Skeleton";

type LikeState = { like_count: number; liked: boolean };

function rowsOf(threads: CommunityQuestion[]) {
  return threads.flatMap((thread) => [thread, ...(thread.replies || [])]);
}

function CommentLike({ comment, state }: { comment: CommunityQuestion; state: LikeState }) {
  const { user } = useAthleteAuth();
  const [liked, setLiked] = useState(state.liked);
  const [likes, setLikes] = useState(state.like_count);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(state.liked);
    setLikes(state.like_count);
  }, [state.liked, state.like_count]);

  async function toggle() {
    if (!user) { askForAccount("dar me gusta"); return; }
    if (busy) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((value) => Math.max(0, value + (wasLiked ? -1 : 1)));
    setBusy(true);
    const { data, error } = await createClient().rpc("toggle_event_comment_like", { p_comment_id: comment.id });
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

export default function EventCommunityQuestions({ raceEventId, returnPath }: { raceEventId: string; returnPath: string }) {
  const { user } = useAthleteAuth();
  const [data, setData] = useState(EMPTY_COMMUNITY_QUESTIONS);
  const [likes, setLikes] = useState<Record<string, LikeState>>({});
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const next = await fetchEventCommunityQuestions(raceEventId);
    setData(next);
    const ids = rowsOf(next.threads).map((item) => item.id);
    if (!ids.length) { setLikes({}); return; }
    const { data: state } = await createClient().rpc("event_comment_like_state", { p_comment_ids: ids });
    if (state && typeof state === "object" && !Array.isArray(state)) {
      const mapped: Record<string, LikeState> = {};
      for (const [id, value] of Object.entries(state as Record<string, { like_count?: number; liked?: boolean }>)) {
        mapped[id] = { like_count: Number(value?.like_count) || 0, liked: Boolean(value?.liked) };
      }
      setLikes(mapped);
    }
  }, [raceEventId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    load().catch(() => { if (active) setData(EMPTY_COMMUNITY_QUESTIONS); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);

  async function publish(event: FormEvent) {
    event.preventDefault();
    const content = body.trim();
    if (!user || !content || saving) return;
    setSaving(true); setMessage("");
    const { error } = await createClient().from("event_community_questions").insert({ race_event_id: raceEventId, user_id: user.id, body: content.slice(0, 2000), is_published: true });
    if (error) setMessage(error.message);
    else { setBody(""); await load(); }
    setSaving(false);
  }

  function onComposerKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!body.trim() || saving) return;
    event.currentTarget.form?.requestSubmit();
  }

  async function remove(id: string) {
    if (!user || !window.confirm("¿Eliminar este comentario?")) return;
    const { error } = await createClient().from("event_community_questions").delete().eq("id", id).eq("user_id", user.id);
    if (error) setMessage(error.message); else await load();
  }

  const comments = rowsOf(data.threads);
  const loginHref = returnPath;

  return <section id="preguntas" className="mt-12 scroll-mt-6">
    <h3 className="text-[20px] font-semibold leading-6 text-white">Comentarios</h3>
    {loading ? <CommentsSkeleton /> : comments.length ? <ul>{comments.map((comment) => <li key={comment.id} className="border-b border-white/15 py-4">
      <div className="flex items-start gap-3">
        {comment.author_username ? <Link href={`/perfil/${comment.author_username}`} className="shrink-0">{comment.author_avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={comment.author_avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">{comment.author_name.slice(0, 1).toUpperCase()}</span>}</Link> : comment.author_avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={comment.author_avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <span className="h-10 w-10 shrink-0 rounded-full bg-white/20" />}
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold leading-6 text-white">{comment.author_name || "Usuario"}</p>
          <p className="text-[13px] text-white/50">{new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(comment.created_at))}</p>
        </div>
        <CommentLike comment={comment} state={likes[comment.id] || { like_count: 0, liked: false }} />
      </div>
      <p className="mt-3 whitespace-pre-line text-[16px] leading-6 text-white">{comment.body}</p>
      {comment.mine ? <button type="button" onClick={() => void remove(comment.id)} className="mt-2 text-[13px] text-white/40">Eliminar</button> : null}
    </li>)}</ul> : null}
    {message ? <p role="alert" className="mt-3 text-sm text-[#DE5757]">{message}</p> : null}
    {user ? <form onSubmit={(event) => void publish(event)} className="pt-3">
      <div className="flex items-end gap-2">
        <textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 2000))} onKeyDown={onComposerKey} placeholder="Comentar" rows={1} className="max-h-28 min-h-11 flex-1 resize-none rounded-[22px] bg-[#191919] px-4 py-3 text-[16px] text-white outline-none placeholder:text-white/50" />
        <button type="submit" disabled={saving || !body.trim()} style={{ color: "#0E0E0E" }} className="shrink-0 rounded-full bg-white px-4 py-3 text-[16px] font-bold disabled:opacity-50">{saving ? "Publicando…" : "Comentar"}</button>
      </div>
    </form> : <p className="pt-3 text-[16px] text-white/50"><button type="button" onClick={() => askForAccount("comentar", `${loginHref}#preguntas`)} className="text-white underline">Crea una cuenta</button> para comentar.</p>}
  </section>;
}
