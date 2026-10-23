"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import { EMPTY_COMMUNITY_QUESTIONS, fetchEventCommunityQuestions, type CommunityQuestion } from "@/lib/eventQuestions";

function relativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }).format(date);
}

function ReplyIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>;
}

function Author({ item }: { item: CommunityQuestion }) {
  const content = <>{item.author_avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.author_avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">{item.author_name.slice(0, 1).toUpperCase()}</span>}<span className="min-w-0"><strong className="block truncate text-sm text-white">{item.author_name}</strong><span className="text-[11px] text-white/40">{relativeDate(item.created_at)}</span></span></>;
  return item.author_username ? <Link href={`/perfil/${item.author_username}`} className="flex min-w-0 items-center gap-2.5 hover:opacity-85">{content}</Link> : <div className="flex min-w-0 items-center gap-2.5">{content}</div>;
}

export default function EventCommunityQuestions({ raceEventId, returnPath }: { raceEventId: string; returnPath: string }) {
  const { user, profile } = useAthleteAuth();
  const [data, setData] = useState(EMPTY_COMMUNITY_QUESTIONS);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replying, setReplying] = useState<{ threadId: string; authorName: string } | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(() => new Set());
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchEventCommunityQuestions(raceEventId)); }
    catch { setData(EMPTY_COMMUNITY_QUESTIONS); }
    finally { setLoading(false); }
  }, [raceEventId]);
  useEffect(() => { void load(); }, [load]);

  async function publish(event: FormEvent, parentId?: string) {
    event.preventDefault();
    const content = (parentId ? reply : body).trim();
    if (!user || !content || saving) return;
    setSaving(true); setMessage("");
    const { error } = await createClient().from("event_community_questions").insert({ race_event_id: raceEventId, user_id: user.id, parent_id: parentId || null, body: content.slice(0, 2000), is_published: true });
    if (error) setMessage(error.message);
    else { if (parentId) { setReply(""); setReplying(null); } else setBody(""); await load(); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!user || !window.confirm("¿Eliminar este comentario y sus respuestas?")) return;
    const { error } = await createClient().from("event_community_questions").delete().eq("id", id).eq("user_id", user.id);
    if (error) setMessage(error.message); else await load();
  }

  function openReply(threadId: string, authorName: string) {
    setExpandedThreads((current) => new Set(current).add(threadId));
    setReplying({ threadId, authorName });
    setReply("");
  }

  function toggleReplies(threadId: string) {
    setExpandedThreads((current) => {
      const next = new Set(current);
      if (next.has(threadId)) next.delete(threadId); else next.add(threadId);
      return next;
    });
  }

  const authHref = `/auth?mode=register&intent=question&next=${encodeURIComponent(`${returnPath}#preguntas`)}`;
  const replyButton = (threadId: string, authorName: string) => user ? (
    <button type="button" onClick={() => openReply(threadId, authorName)} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/65 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"><ReplyIcon />Responder</button>
  ) : (
    <Link href={authHref} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white/65"><ReplyIcon />Responder</Link>
  );

  return <section id="preguntas" className="-mx-5 mt-12 scroll-mt-6 md:mx-0 md:mt-16">
    <div className="overflow-hidden rounded-[30px] border border-white/12 bg-white/[0.035]">
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-6 sm:px-6">
      <h3 className="text-[26px] font-semibold text-white">Comentarios</h3>
      {data.count > 0 ? <span className="text-xs text-white/40">{data.count} {data.count === 1 ? "comentario" : "comentarios"}</span> : null}
    </div>

    {user ? <form onSubmit={(event) => void publish(event)} className="mx-4 mt-5 rounded-[22px] border border-white/10 bg-white/[0.05] p-4 sm:mx-5 sm:p-5">
      <div className="flex items-center gap-3">{profile.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xs font-bold">{profile.fullName.slice(0, 1).toUpperCase()}</span>}<span className="text-sm font-semibold text-white">Escribe un comentario</span></div>
      <textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 2000))} placeholder="Comparte una duda, recomendación o dato útil…" className="mt-3 min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-[15px] leading-relaxed text-white outline-none transition focus:border-[#c9f24b]/50 placeholder:text-white/35"/>
      <div className="mt-3 flex items-center justify-between"><span className="text-[10px] text-white/35">{body.length}/2000</span><button type="submit" disabled={saving || !body.trim()} className="rounded-full bg-[#c9f24b] px-5 py-2.5 text-sm font-bold text-black disabled:opacity-40">{saving ? "Publicando…" : "Comentar"}</button></div>
    </form> : <div className="mx-4 mt-5 rounded-[20px] bg-white/[0.05] px-5 py-6 text-center sm:mx-5"><p className="text-sm text-white/65">Inicia sesión para comentar o responder.</p><Link href={authHref} className="mt-4 inline-flex rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white">Entrar a la conversación</Link></div>}

    {message ? <p className="mt-3 text-xs text-red-300">{message}</p> : null}
    <div className="mt-5 space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">{loading ? <p className="py-6 text-sm text-white/45">Cargando comentarios…</p> : data.threads.length ? data.threads.map((thread) => <article key={thread.id} className="rounded-[22px] border border-white/10 bg-black/10 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3"><Author item={thread}/>{thread.mine ? <button type="button" onClick={() => void remove(thread.id)} className="text-xs text-white/35 hover:text-red-300">Eliminar</button> : null}</div>
      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-white/90">{thread.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">{replyButton(thread.id, thread.author_name)}{thread.replies?.length ? <button type="button" onClick={() => toggleReplies(thread.id)} aria-expanded={expandedThreads.has(thread.id)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold text-white/55 transition hover:bg-white/[0.06] hover:text-white"><span>{thread.replies.length} {thread.replies.length === 1 ? "respuesta" : "respuestas"}</span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expandedThreads.has(thread.id) ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6"/></svg></button> : null}</div>
      {thread.replies?.length && expandedThreads.has(thread.id) ? <div className="ml-3 mt-5 space-y-5 border-l border-white/15 pl-4 sm:ml-8 sm:pl-5">{thread.replies.map((item) => <div key={item.id}><div className="flex items-start justify-between gap-3"><Author item={item}/>{item.mine ? <button type="button" onClick={() => void remove(item.id)} className="text-xs text-white/35 hover:text-red-300">Eliminar</button> : null}</div><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">{item.body}</p><div className="mt-3">{replyButton(thread.id, item.author_name)}</div></div>)}</div> : null}
      {replying?.threadId === thread.id ? <form onSubmit={(event) => void publish(event, thread.id)} className="ml-3 mt-5 rounded-2xl border border-[#c9f24b]/25 bg-[#c9f24b]/[0.04] p-3 sm:ml-8 sm:p-4"><p className="mb-2 text-xs font-semibold text-[#c9f24b]">Respondiendo a {replying.authorName}</p><textarea autoFocus value={reply} onChange={(event) => setReply(event.target.value.slice(0, 2000))} placeholder="Escribe tu respuesta…" className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9f24b]/50 placeholder:text-white/35"/><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setReplying(null)} className="px-4 py-2 text-xs font-semibold text-white/50">Cancelar</button><button type="submit" disabled={saving || !reply.trim()} className="rounded-full bg-[#c9f24b] px-4 py-2 text-xs font-bold text-black disabled:opacity-40">{saving ? "Publicando…" : "Responder"}</button></div></form> : null}
    </article>) : <div className="rounded-[20px] border border-dashed border-white/10 px-5 py-8 text-center"><p className="text-sm font-semibold text-white/70">Todavía no hay comentarios</p></div>}</div>
    </div>
  </section>;
}
