"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ReviewPost from "@/components/reviews/ReviewPost";
import PostMenu from "@/components/activity/PostMenu";
import PostReactions from "@/components/activity/PostReactions";
import RelativeTime from "@/components/activity/RelativeTime";
import { fetchActivityFeed, type ActivityItem, type ActivityPhoto } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import { publicEventPath, usePublicEventPaths, type EventPaths } from "@/lib/usePublicEventPaths";

export default function ActivityFeed({ userId, followingOnly = false, refreshKey = 0, emptyText = "Todavía no hay actividad." }: { userId?: string | null; followingOnly?: boolean; refreshKey?: number; emptyText?: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const eventPaths = usePublicEventPaths();

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchActivityFeed(userId, 50, followingOnly).then((next) => { if (active) setItems(next); }).catch(() => { if (active) setItems([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, followingOnly, refreshKey]);

  useEffect(() => {
    const refresh = () => void fetchActivityFeed(userId, 50, followingOnly).then(setItems).catch(() => setItems([]));
    window.addEventListener("dorsalia:activity-published", refresh);
    return () => window.removeEventListener("dorsalia:activity-published", refresh);
  }, [userId, followingOnly]);

  async function remove(item: ActivityItem) {
    if (!window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    const supabase = createClient();
    const paths = item.photos.map((photo) => photo.storage_path).filter((path): path is string => Boolean(path));
    if (paths.length) await supabase.storage.from("public-image").remove(paths);
    const result = item.post_type === "review" && item.review_id
      ? await supabase.from("event_reviews").delete().eq("id", item.review_id)
      : await supabase.from("activity_posts").delete().eq("id", item.id);
    if (!result.error) { setItems((current) => current.filter((post) => post.id !== item.id)); window.dispatchEvent(new Event("dorsalia:activity-published")); }
  }

  function actions(item: ActivityItem) {
    if (!item.mine || item.post_type === "registration") return null;
    return <PostMenu onEdit={() => window.dispatchEvent(new CustomEvent("dorsalia:edit-post", { detail: item }))} onDelete={() => remove(item)} />;
  }

  if (loading) return <div className="grid min-h-40 place-items-center"><span className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[#c9f24b]" /></div>;
  if (!items.length) return <p className="px-5 py-8 text-sm text-white/40">{emptyText}</p>;

  return <div className="space-y-0">
    {items.map((item) => item.post_type === "review" ? (
      <ReviewPost
        key={item.id}
        authorName={item.display_name}
        username={item.username}
        avatarUrl={item.avatar_url}
        profileHref={`/perfil/${item.username}`}
        rating={Number(item.rating) || 0}
        comment={item.body}
        photos={item.photos}
        fallbackImage={item.event_cover_url}
        eventName={item.event_name}
        eventHref={publicEventPath(eventPaths, item.event_slug)}
        updatedAt={item.created_at}
        postId={item.id}
        likeCount={Number(item.like_count) || 0}
        liked={Boolean(item.liked)}
        action={actions(item)}
        variant="feed"
      />
    ) : <ActivityCard key={item.id} item={item} action={actions(item)} eventPaths={eventPaths} />)}
  </div>;
}

function ActivityCard({ item, action, eventPaths }: { item: ActivityItem; action?: React.ReactNode; eventPaths: EventPaths | null }) {
  const timedResult = parseTimedResult(item.body, item.event_slug || "");
  const eventHref = publicEventPath(eventPaths, timedResult?.event_slug) || publicEventPath(eventPaths, item.event_slug);
  const lead = item.post_type === "registration"
    ? <>se inscribió a <strong className="text-white">{item.event_name}</strong></>
    : item.post_type === "share"
      ? <>compartió <strong className="text-white">{item.event_name}</strong></>
      : null;
  const media = item.photos.length ? item.photos : item.event_cover_url ? [{ id: "event", image_url: item.event_cover_url, sort_order: 0 }] : [];
  const resultContent = timedResult ? <>
    {item.event_cover_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.event_cover_url} alt="" loading="lazy" className="h-20 w-16 shrink-0 rounded-lg object-cover" /> : null}
    <span className="min-w-0 flex-1 text-left"><span className="block truncate text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{item.event_name || "Resultado del evento"}</span>
      <strong className="mt-1 block text-4xl font-black leading-none tracking-tight text-[#c9f24b] tabular-nums">{timedResult.time}</strong>
      <span className="mt-2 block truncate text-sm text-white/65">{timedResult.distance || "Carrera"} · {timedResult.category || "General"}{timedResult.bib ? ` · Dorsal ${timedResult.bib}` : ""}</span>
      {eventHref ? <span className="mt-1 block text-xs font-semibold text-white/45">Ver ficha del evento</span> : null}</span>
  </> : null;

  return <article className="overflow-hidden border-b border-white/10 bg-[#070707] py-5">
    <div className="flex items-center gap-3 px-5">
      <Link href={`/perfil/${item.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        {item.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 font-bold">{item.display_name.slice(0, 1)}</span>}
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">@{item.username}</p></div>
      </Link>
      {action}
    </div>
    {timedResult ? eventHref ? <Link href={eventHref} className="mx-5 mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#c9f24b]/50">{resultContent}</Link> : <div className="mx-5 mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">{resultContent}</div> : lead ? <p className="px-5 pt-4 text-[15px] leading-relaxed text-white/75"><strong className="text-white">@{item.username}</strong> {lead}</p> : null}
    {media.length && !timedResult ? <ActivityMedia photos={media} postId={item.id} /> : null}
    <div className="px-5 pt-4"><PostReactions postId={item.id} initialLikes={Number(item.like_count) || 0} initialLiked={Boolean(item.liked)} /></div>
    {item.body && !timedResult ? <p className="whitespace-pre-line px-5 pt-4 text-[15px] leading-relaxed text-white/85"><strong className="mr-2 text-white">@{item.username}</strong>{item.body}</p> : null}
    <div className="flex items-center justify-between gap-3 px-5 pt-3"><span className="text-[11px] text-white/35"><RelativeTime value={item.created_at} /></span>{eventHref ? <Link href={eventHref} className="text-xs font-semibold text-[#c9f24b]">Ver evento</Link> : null}</div>
  </article>;
}

function parseTimedResult(body: string, fallbackEventSlug: string) {
  const marker = "DORSALIA_TIMED_RESULT:";
  if (body?.startsWith("Publicó su tiempo de ")) {
    const legacy = body.match(/^Publicó su tiempo de (.+?)(?: en (.+?))?(?: · dorsal (.+?))?\.?$/i);
    if (legacy?.[1]) return { time: legacy[1].trim(), distance: "", category: legacy[2]?.trim() || "", bib: legacy[3]?.trim() || "", event_slug: fallbackEventSlug };
  }
  if (!body?.startsWith(marker)) return null;
  try {
    const value = JSON.parse(body.slice(marker.length));
    if (typeof value?.time !== "string" || !value.time.trim()) return null;
    return {
      time: value.time,
      distance: typeof value.distance === "string" ? value.distance : "",
      category: typeof value.category === "string" ? value.category : "",
      bib: typeof value.bib === "string" ? value.bib : "",
      event_slug: typeof value.event_slug === "string" && value.event_slug ? value.event_slug : fallbackEventSlug,
    };
  } catch {
    return null;
  }
}

function ActivityMedia({ photos, postId }: { photos: ActivityPhoto[]; postId: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const lastTap = useRef(0);
  const doubleTap = () => { const now = Date.now(); if (now - lastTap.current < 330) window.dispatchEvent(new Event(`dorsalia:like-post:${postId}`)); lastTap.current = now; };
  const content = <div ref={ref} onDoubleClick={() => window.dispatchEvent(new Event(`dorsalia:like-post:${postId}`))} onPointerUp={doubleTap} onScroll={() => { const n = ref.current; if (n?.clientWidth) setActive(Math.round(n.scrollLeft / n.clientWidth)); }} className="mt-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {photos.map((photo) => <ActivityImage key={photo.id} photo={photo} />)}
  </div>;
  return <div className="relative">{content}{photos.length > 1 ? <span className="absolute right-3 top-7 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">{active + 1}/{photos.length}</span> : null}</div>;
}

function ActivityImage({ photo }: { photo: ActivityPhoto }) {
  const [loaded, setLoaded] = useState(false);
  return <div className="relative aspect-[4/5] min-w-full snap-center bg-white/[0.035]">{!loaded ? <div className="absolute inset-0 grid place-items-center"><span className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[#c9f24b]" /></div> : null}{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.image_url} alt="" loading="lazy" onLoad={() => setLoaded(true)} className={`h-full w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} /></div>;
}
