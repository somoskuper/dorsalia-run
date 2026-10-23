"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import StarRating from "@/components/reviews/StarRating";
import PostReactions from "@/components/activity/PostReactions";
import RelativeTime from "@/components/activity/RelativeTime";
import type { ReviewPhoto } from "@/lib/eventReviews";
import { highResolutionAvatar } from "@/lib/avatarImage";

export default function ReviewPost({ authorName, username, avatarUrl, profileHref, rating, comment, photos, fallbackImage, eventName, eventHref, updatedAt, action, postId, likeCount = 0, liked = false, variant = "card" }: {
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
  variant?: "card" | "feed";
}) {
  const identity = <>
    {avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={highResolutionAvatar(avatarUrl) || avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-full bg-white/10 font-bold text-white">{authorName.slice(0, 1).toUpperCase()}</div>}
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{username ? `@${username}` : authorName}</p>{eventName ? <p className="truncate text-xs text-white/45">{eventName}</p> : null}</div>
  </>;
  const media = photos.length ? photos.map((photo) => ({ id: photo.id, src: photo.image_url })) : fallbackImage ? [{ id: "cover", src: fallbackImage }] : [];
  const feed = variant === "feed";
  return <article className={feed ? "overflow-hidden border-b border-white/10 bg-[#070707] py-5" : "overflow-hidden border-b border-white/10 bg-white/[0.07] py-5"}>
    <div className="flex items-center gap-3 px-5">
      {profileHref ? <Link href={profileHref} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-75">{identity}</Link> : <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>}
      {action}
    </div>
    {media.length ? <ReviewCarousel media={media} postId={postId} /> : null}
    <div className="px-5">
      <div className="mt-4 flex items-center justify-between gap-4"><StarRating value={rating} size={18} /><PostReactions postId={postId} initialLikes={likeCount} initialLiked={liked} /></div>
      {comment ? <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-white/85"><span className="mr-2 font-semibold text-white">{username ? `@${username}` : authorName}</span>{comment}</p> : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-white/35"><RelativeTime value={updatedAt} /></p>
        {eventHref ? <Link href={eventHref} className="text-xs font-semibold text-[#c9f24b]">Ver evento</Link> : null}
      </div>
    </div>
  </article>;
}

function ReviewCarousel({ media, postId }: { media: { id: string; src: string }[]; postId?: string | null }) {
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
      {media.map((image) => <ReviewImage key={image.id} src={image.src} />)}
    </div>
    {media.length > 1 ? (
      <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">
        {active + 1}/{media.length}
      </span>
    ) : null}
  </div>;
}

function ReviewImage({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return <div className="relative aspect-[4/5] min-w-full snap-center overflow-hidden bg-white/[0.035]">
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
