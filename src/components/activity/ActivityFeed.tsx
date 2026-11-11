"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReviewPost from "@/components/reviews/ReviewPost";
import PostMenu from "@/components/activity/PostMenu";
import PostEngagement from "@/components/activity/PostEngagement";
import PhotoViewer from "@/components/media/PhotoViewer";
import RelativeTime from "@/components/activity/RelativeTime";
import EventGlassLink from "@/components/activity/EventGlassLink";
import { fetchActivityFeed, type ActivityItem, type ActivityPhoto } from "@/lib/activity";
import { isPortfolioName } from "@/lib/creatorPortfolio";
import { createClient } from "@/lib/supabase/client";
import { publicEventPath, usePublicEventPaths, type EventPaths } from "@/lib/usePublicEventPaths";
import { Bone, PostSkeleton } from "@/components/ui/Skeleton";
import ViewedCreatorPost from "@/components/creator/ViewedCreatorPost";
import AvatarImage from "@/components/ui/AvatarImage";

export default function ActivityFeed({ userId, followingOnly = false, excludeUserId = null, refreshKey = 0, emptyText = "Todavía no hay actividad." }: { userId?: string | null; followingOnly?: boolean; excludeUserId?: string | null; refreshKey?: number; emptyText?: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const eventPaths = usePublicEventPaths();
  const visible = (next: ActivityItem[]) => next.filter((item) => item.user_id !== excludeUserId && !(item.post_type === "creator" && (isPortfolioName(item.gallery_name) || isPortfolioName(item.body))));

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchActivityFeed(userId, 50, followingOnly).then((next) => { if (active) setItems(visible(next)); }).catch(() => { if (active) setItems([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, followingOnly, excludeUserId, refreshKey]);

  useEffect(() => {
    const refresh = () => void fetchActivityFeed(userId, 50, followingOnly).then((next) => setItems(visible(next))).catch(() => setItems([]));
    window.addEventListener("dorsalia:activity-published", refresh);
    return () => window.removeEventListener("dorsalia:activity-published", refresh);
  }, [userId, followingOnly, excludeUserId]);

  async function remove(item: ActivityItem) {
    if (!window.confirm("¿Eliminar esta publicación? Esta acción no se puede deshacer.")) return;
    const supabase = createClient();
    const paths = item.photos.map((photo) => photo.storage_path).filter((path): path is string => Boolean(path));
    const result = item.post_type === "creator" && item.creator_publication_id
      ? await supabase.from("creator_publications").delete().eq("id", item.creator_publication_id).eq("creator_id", item.user_id)
      : item.post_type === "review" && item.review_id
      ? await supabase.from("event_reviews").delete().eq("id", item.review_id)
      : await supabase.from("activity_posts").delete().eq("id", item.id);
    if (result.error) { window.alert(result.error.message); return; }
    if (item.post_type === "creator") await supabase.from("activity_posts").delete().eq("id", item.id).eq("user_id", item.user_id);
    if (paths.length) await supabase.storage.from("public-image").remove(paths);
    setItems((current) => current.filter((post) => post.id !== item.id));
    window.dispatchEvent(new Event("dorsalia:activity-published"));
  }

  function actions(item: ActivityItem) {
    return <PostMenu postId={item.id} onEdit={item.mine ? () => item.post_type === "creator" && item.creator_publication_id
      ? window.location.assign(`/creator/new?edit=${item.creator_publication_id}`)
      : window.dispatchEvent(new CustomEvent("dorsalia:edit-post", { detail: item })) : undefined} onDelete={item.mine ? () => remove(item) : undefined} />;
  }

  if (loading) return <PostSkeleton count={2} />;
  if (!items.length) return emptyText ? <p className="px-[15px] py-8 text-sm text-white/40">{emptyText}</p> : null;

  return <div className="space-y-0">
    {items.map((item) => <ActivityPostArticle key={item.id} item={item} action={actions(item)} eventPaths={eventPaths} />)}
  </div>;
}

export function ActivityPostArticle({ item, action, eventPaths, detail = false }: { item: ActivityItem; action?: React.ReactNode; eventPaths: EventPaths | null; detail?: boolean }) {
  if (item.post_type === "review") return <ReviewPost
    authorName={item.display_name}
    username={item.username}
    avatarUrl={item.avatar_url}
    profileHref={`/perfil/${item.username}`}
    rating={Number(item.rating) || 0}
    comment={item.body}
    photos={item.photos}
    fallbackImage={null}
    eventName={item.event_name}
    eventHref={publicEventPath(eventPaths, item.event_slug)}
    updatedAt={item.created_at}
    postId={item.id}
    likeCount={Number(item.like_count) || 0}
    liked={Boolean(item.liked)}
    commentCount={Number(item.comment_count) || 0}
    detail={detail}
    action={action}
    variant="feed"
  />;
  if (parseTimedResult(item.body, item.event_slug || "")) return <ActivityCard item={item} action={action} eventPaths={eventPaths} detail={detail} />;
  const article = <ReviewPost
    authorName={item.display_name}
    username={item.username}
    avatarUrl={item.avatar_url}
    profileHref={`/perfil/${item.username}`}
    rating={0}
    comment={item.post_type === "registration" ? `Se inscribió a ${item.event_name || "un evento"}${item.body ? ` · ${item.body}` : ""}` : item.post_type === "share" ? `Compartió ${item.event_name || "un evento"}${item.body ? ` · ${item.body}` : ""}` : item.body}
    photos={item.photos}
    fallbackImage={item.event_cover_url}
    eventName={item.event_name}
    eventHref={item.post_type === "creator" && item.creator_publication_id && item.event_slug ? `/fotos/${encodeURIComponent(item.event_slug)}/${item.creator_publication_id}` : publicEventPath(eventPaths, item.event_slug)}
    eventCoverUrl={item.post_type === "creator" ? item.event_cover_url : null}
    updatedAt={item.created_at}
    postId={item.id}
    likeCount={Number(item.like_count) || 0}
    liked={Boolean(item.liked)}
    commentCount={Number(item.comment_count) || 0}
    detail={detail}
    action={action}
    variant="feed"
    mediaAspect="portrait"
    verified={item.post_type === "creator"}
  />;
  if (item.post_type !== "creator" || !item.creator_publication_id) return article;
  return <ViewedCreatorPost publicationId={item.creator_publication_id} surface="feed">{article}</ViewedCreatorPost>;
}

function ActivityCard({ item, action, eventPaths, detail = false }: { item: ActivityItem; action?: React.ReactNode; eventPaths: EventPaths | null; detail?: boolean }) {
  const router = useRouter();
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

  return <article id={`post-${item.id}`} onClick={(event) => { if (detail) return; const target = event.target as HTMLElement; if (target.closest("a,button,input,textarea,summary,[data-post-media],[data-post-copy]")) return; router.push(`/post/${item.id}`); }} className={`overflow-hidden border-b border-white/10 bg-[#070707] py-5${!detail ? " cursor-pointer" : ""}`}>
    <div className="flex items-center gap-3 px-[15px]">
      <Link href={`/perfil/${item.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        {item.avatar_url ? <AvatarImage src={item.avatar_url} size={44} className="h-11 w-11 rounded-full object-cover" /> : <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10 font-bold">{item.display_name.slice(0, 1)}</span>}
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">@{item.username}</p><p className="text-[11px] text-white/50"><RelativeTime value={item.created_at} /></p></div>
      </Link>
      {action || <details className="relative"><summary className="list-none cursor-pointer text-2xl leading-none text-white/80" aria-label="Más opciones">⋮</summary><span className="absolute right-0 top-8 z-20 whitespace-nowrap rounded-xl bg-[#181818] px-4 py-3 text-sm text-white">Compartir</span></details>}
    </div>
    {timedResult ? eventHref ? <Link href={eventHref} className="mx-[15px] mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[#c9f24b]/50">{resultContent}</Link> : <div className="mx-[15px] mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">{resultContent}</div> : lead ? <p className="px-[15px] pt-4 text-[15px] leading-relaxed text-white/75"><strong className="text-white">@{item.username}</strong> {lead}</p> : null}
    {media.length && !timedResult ? <ActivityMedia photos={media} postId={item.id} /> : null}
    <div className="mt-3 px-[15px]"><PostEngagement postId={item.id} likeCount={Number(item.like_count) || 0} liked={Boolean(item.liked)} commentCount={Number(item.comment_count) || 0} detail={detail} /></div>
    {timedResult?.caption ? <p data-post-copy className="whitespace-pre-line px-[15px] pt-3 text-[15px] leading-relaxed text-white/85">{timedResult.caption}</p> : null}
    {item.body && !timedResult ? <p data-post-copy className="whitespace-pre-line px-[15px] pt-3 text-[15px] leading-relaxed text-white/85"><strong className="mr-2 text-white">@{item.username}</strong>{item.body}</p> : null}
    {eventHref && timedResult ? <div className="flex justify-end px-[15px] pt-3"><EventGlassLink href={eventHref} /></div> : null}
  </article>;
}

function parseTimedResult(body: string, fallbackEventSlug: string) {
  const marker = "DORSALIA_TIMED_RESULT:";
  if (body?.startsWith("Publicó su tiempo de ")) {
    const legacy = body.match(/^Publicó su tiempo de (.+?)(?: en (.+?))?(?: · dorsal (.+?))?\.?$/i);
    if (legacy?.[1]) return { time: legacy[1].trim(), distance: "", category: legacy[2]?.trim() || "", bib: legacy[3]?.trim() || "", event_slug: fallbackEventSlug, caption: "" };
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
      caption: typeof value.caption === "string" ? value.caption : "",
    };
  } catch {
    return null;
  }
}

function ActivityMedia({ photos, postId }: { photos: ActivityPhoto[]; postId: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const lastTap = useRef(0);
  const drag = useRef({ x: 0, y: 0 });
  const openTimer = useRef<number | null>(null);
  function onPointerUp(event: React.PointerEvent) {
    if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 8) return;
    const now = Date.now();
    if (now - lastTap.current < 330) {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      window.dispatchEvent(new Event(`dorsalia:like-post:${postId}`));
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    const index = active;
    openTimer.current = window.setTimeout(() => setViewer(index), 280);
  }
  const content = <div ref={ref} onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={onPointerUp} onScroll={() => { const n = ref.current; if (n?.clientWidth) setActive(Math.round(n.scrollLeft / n.clientWidth)); }} className="mt-4 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {photos.map((photo) => <ActivityImage key={photo.id} photo={photo} />)}
  </div>;
  return <div data-post-media className="relative">{content}{photos.length > 1 ? <span className="absolute right-3 top-7 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">{active + 1}/{photos.length}</span> : null}{viewer !== null ? <PhotoViewer photos={photos.map((photo) => ({ id: photo.id, src: photo.image_url, alt: "Foto de la publicación" }))} startIndex={viewer} onClose={() => setViewer(null)} /> : null}</div>;
}

function ActivityImage({ photo }: { photo: ActivityPhoto }) {
  const [loaded, setLoaded] = useState(false);
  return <div className="relative aspect-[4/5] min-w-full snap-center bg-white/[0.035]">{!loaded ? <Bone className="absolute inset-0 rounded-none" /> : null}{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.image_url} alt="" loading="lazy" decoding="async" onLoad={() => setLoaded(true)} className={`h-full w-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`} /></div>;
}
