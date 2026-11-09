"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import StarRating from "@/components/reviews/StarRating";
import PostReactions from "@/components/activity/PostReactions";
import RelativeTime from "@/components/activity/RelativeTime";
import type { ReviewPhoto } from "@/lib/eventReviews";
import { highResolutionAvatar } from "@/lib/avatarImage";
import EventGlassLink from "@/components/activity/EventGlassLink";
import PostMenu from "@/components/activity/PostMenu";

export default function ReviewPost({ authorName, username, avatarUrl, profileHref, rating, comment, photos, fallbackImage, eventName, eventHref, updatedAt, action, postId, likeCount = 0, liked = false, variant = "card", mediaAspect = "portrait" }: {
  authorName: string;
  username?: string | null;
  avatarUrl?: string | null;
  profileHref?: string;
  rating: number;
  comment: string;
  photos: ReviewPhoto[];
  fallbackImage?: string | null;
  eventName?: string | null;
  eventHref?: string;
  updatedAt: string;
  action?: React.ReactNode;
  postId?: string | null;
  likeCount?: number;
  liked?: boolean;
  variant?: "card" | "feed" | "reviewPage";
  mediaAspect?: "portrait" | "square";
}) {
  const [expanded, setExpanded] = useState(false);
  const reviewPage = variant === "reviewPage";
  const feed = variant === "feed";
  const compact = reviewPage || feed;
  const identity = <>
    {avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={highResolutionAvatar(avatarUrl) || avatarUrl} alt="" className={`${compact ? "h-[35px] w-[35px]" : "h-11 w-11"} shrink-0 rounded-full object-cover`} /> : <div className={`${compact ? "h-[35px] w-[35px]" : "h-11 w-11"} grid shrink-0 place-items-center rounded-full bg-white/10 font-bold text-white`}>{authorName.slice(0, 1).toUpperCase()}</div>}
    <div className="min-w-0 flex-1"><p className={`${compact ? "text-[20px] font-normal" : "text-sm font-semibold"} truncate text-white`}>{compact ? authorName : username ? `@${username}` : authorName}</p>{compact ? <p className="text-[11px] text-white/50"><RelativeTime value={updatedAt} /></p> : eventName ? <p className="truncate text-xs text-white/45">{eventName}</p> : null}</div>
  </>;
  const media = photos.length ? photos.map((photo) => ({ id: photo.id, src: photo.image_url })) : fallbackImage ? [{ id: "cover", src: fallbackImage }] : [];
  return <article id={postId ? `post-${postId}` : undefined} className={reviewPage ? "overflow-hidden border-b border-white/10" : feed ? "overflow-hidden border-b border-white/10 bg-[#070707] pb-5" : "overflow-hidden border-b border-white/10 bg-white/[0.07] py-5"}>
    <div className={`flex items-center gap-3 ${compact ? "px-[15px] py-5" : "px-5"}`}>
      {profileHref ? <Link href={profileHref} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-75">{identity}</Link> : <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>}
      <div className="flex shrink-0 items-center gap-3"><PostReactions postId={postId} initialLikes={likeCount} initialLiked={liked} />{action || <PostMenu postId={postId} />}</div>
    </div>
    {media.length ? <div className={`relative ${compact ? "w-full overflow-hidden rounded-none [&>div]:mt-0" : ""}`}><ReviewCarousel media={media} postId={postId} aspect={mediaAspect} />{eventHref && !reviewPage ? <div className="absolute bottom-[15px] right-[15px] z-10"><EventGlassLink href={eventHref} /></div> : null}</div> : null}
    {rating > 0 ? <div className={compact ? `px-[15px] ${media.length ? "mt-5" : "mt-3"}` : "mt-4 px-5"}><StarRating value={rating} size={compact ? 24 : 18} /></div> : null}
    <div className={compact ? "px-[15px] pb-5" : "px-5"}>
      {comment ? <><p className={`mt-3 whitespace-pre-line text-[15px] leading-relaxed text-white/85 ${compact && !expanded ? "line-clamp-3" : ""}`}>{!compact ? <span className="mr-2 font-semibold text-white">{username ? `@${username}` : authorName}</span> : null}{comment}</p>{compact && comment.length > 130 ? <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-1 text-sm text-white/70">{expanded ? "Mostrar menos" : "Mostrar más"}</button> : null}</> : null}
      {!reviewPage && !media.length && eventHref ? <div className="mt-3 flex justify-end"><EventGlassLink href={eventHref} /></div> : null}
    </div>
  </article>;
}

function ReviewCarousel({ media, postId, aspect }: { media: { id: string; src: string }[]; postId?: string | null; aspect: "portrait" | "square" }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lastTap = useRef(0);
  const [active, setActive] = useState(0);

  function updateActive() {
    const scroller = scrollerRef.current;
    if (!scroller || !scroller.clientWidth) return;
    setActive(Math.max(0, Math.min(media.length - 1, Math.round(scroller.scrollLeft / scroller.clientWidth))));
  }

  return <div className="relative mt-4">
    <div
      ref={scrollerRef}
      onDoubleClick={() => postId && window.dispatchEvent(new Event(`dorsalia:like-post:${postId}`))}
      onPointerUp={() => { const now = Date.now(); if (postId && now - lastTap.current < 330) window.dispatchEvent(new Event(`dorsalia:like-post:${postId}`)); lastTap.current = now; }}
      onScroll={updateActive}
      className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {media.map((image) => <ReviewImage key={image.id} src={image.src} aspect={aspect} />)}
    </div>
    {media.length > 1 ? (
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">
        {active + 1}/{media.length}
      </span>
    ) : null}
  </div>;
}

function ReviewImage({ src, aspect }: { src: string; aspect: "portrait" | "square" }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return <div className={`relative min-w-full snap-center overflow-hidden bg-white/[0.035] ${aspect === "square" ? "aspect-square" : "aspect-[4/5]"}`}>
    {!loaded && !failed ? (
      <div className="absolute inset-0 grid place-items-center" role="status" aria-label="Cargando imagen">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[#c9f24b]" />
      </div>
    ) : null}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt="Foto de la reseña"
      className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
    {failed ? <div className="absolute inset-0 grid place-items-center px-5 text-center text-sm text-white/35">No fue posible cargar esta imagen.</div> : null}
  </div>;
}
