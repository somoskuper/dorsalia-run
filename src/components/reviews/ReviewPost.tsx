"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/reviews/StarRating";
import PostEngagement from "@/components/activity/PostEngagement";
import RelativeTime from "@/components/activity/RelativeTime";
import { reviewExperienceLabel, type ReviewPhoto } from "@/lib/eventReviews";
import AvatarImage from "@/components/ui/AvatarImage";
import EventGlassLink from "@/components/activity/EventGlassLink";
import PostMenu from "@/components/activity/PostMenu";
import CreatorVerifiedBadge from "@/components/creator/CreatorVerifiedBadge";
import PhotoViewer from "@/components/media/PhotoViewer";
import { Bone } from "@/components/ui/Skeleton";

export default function ReviewPost({ authorName, username, avatarUrl, profileHref, rating, comment, photos, fallbackImage, eventName, eventHref, eventCoverUrl, updatedAt, action, postId, likeCount = 0, liked = false, commentCount = 0, detail = false, variant = "card", mediaAspect = "portrait", postHref, mediaOpensPost = false, verified = false, mediaLink, experience }: {
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
  eventCoverUrl?: string | null;
  updatedAt: string;
  action?: React.ReactNode;
  postId?: string | null;
  likeCount?: number;
  liked?: boolean;
  commentCount?: number;
  detail?: boolean;
  variant?: "card" | "feed" | "reviewPage";
  mediaAspect?: "portrait" | "square";
  postHref?: string;
  mediaOpensPost?: boolean;
  verified?: boolean;
  mediaLink?: { href: string; label: string; external?: boolean } | null;
  experience?: string | null;
}) {
  const router = useRouter();
  const drag = useRef({ x: 0, y: 0, moved: false });
  const [expanded, setExpanded] = useState(false);
  const destination = postHref || (postId ? `/post/${postId}` : "");
  function openPost(event: React.MouseEvent) {
    if (detail || !destination) return;
    const target = event.target as HTMLElement;
    if (target.closest("a,button,input,textarea,summary,[data-post-media],[data-post-copy]")) return;
    router.push(destination);
  }
  const reviewPage = variant === "reviewPage";
  const feed = variant === "feed";
  const compact = reviewPage || feed;
  const identity = <>
    {avatarUrl ? <AvatarImage src={avatarUrl} size={compact ? 35 : 44} className={`${compact ? "h-[35px] w-[35px]" : "h-11 w-11"} shrink-0 rounded-full object-cover`} /> : <div className={`${compact ? "h-[35px] w-[35px]" : "h-11 w-11"} grid shrink-0 place-items-center rounded-full bg-white/10 font-bold text-white`}>{authorName.slice(0, 1).toUpperCase()}</div>}
    <div className="min-w-0 flex-1"><p className={`${compact ? "text-[20px] font-normal" : "text-sm font-semibold"} flex items-center gap-1 text-white`}><span className="truncate">{compact ? authorName : username ? `@${username}` : authorName}</span>{verified ? <CreatorVerifiedBadge size={compact ? 16 : 14} /> : null}</p>{compact ? <p className="text-[11px] text-white/50"><RelativeTime value={updatedAt} /></p> : eventName ? <p className="truncate text-xs text-white/45">{eventName}</p> : null}</div>
  </>;
  const media = photos.length ? photos.map((photo) => ({ id: photo.id, src: photo.image_url })) : fallbackImage ? [{ id: "cover", src: fallbackImage }] : [];
  const experienceLabel = reviewExperienceLabel(experience);
  return <article id={postId ? `post-${postId}` : undefined} onClick={openPost} className={`${reviewPage ? "overflow-hidden border-b border-white/10" : feed ? "overflow-hidden border-b border-white/10 bg-[#070707] pb-5" : "overflow-hidden border-b border-white/10 bg-white/[0.07] py-5"}${!detail && postId ? " cursor-pointer" : ""}`}>
    <div className={`flex items-center gap-3 ${compact ? "px-[15px] py-5" : "px-5"}`}>
      {profileHref ? <Link href={profileHref} className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-75">{identity}</Link> : <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>}
      <div className="flex shrink-0 items-center gap-3">{action || <PostMenu postId={postId} />}</div>
    </div>
    {media.length ? <div data-post-media className={`relative ${compact ? "w-full overflow-hidden rounded-none [&>div]:mt-0" : ""}`} onPointerDown={mediaOpensPost ? (event) => { drag.current = { x: event.clientX, y: event.clientY, moved: false }; } : undefined} onPointerMove={mediaOpensPost ? (event) => { if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 8) drag.current.moved = true; } : undefined} onClick={mediaOpensPost ? (event) => { if (drag.current.moved || !destination) return; const target = event.target as HTMLElement; if (target.closest("a,button")) return; event.stopPropagation(); router.push(destination); } : undefined}><ReviewCarousel media={media} postId={postId} aspect={mediaAspect} openViewer={!mediaOpensPost} />{eventCoverUrl ? eventHref ? <Link href={eventHref} className="absolute bottom-[10px] left-[10px] z-10 block h-[120px] w-[120px] overflow-hidden rounded-[18px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={eventCoverUrl} alt="" className="h-full w-full object-cover" /></Link> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={eventCoverUrl} alt="" className="absolute bottom-[10px] left-[10px] z-10 h-[120px] w-[120px] rounded-[18px] object-cover" /> : null}{mediaLink ? <div className="absolute bottom-[15px] right-[15px] z-10"><EventGlassLink href={mediaLink.href} label={mediaLink.label} external={mediaLink.external} /></div> : eventHref && !reviewPage ? <div className="absolute bottom-[15px] right-[15px] z-10"><EventGlassLink href={eventHref} label={eventHref.startsWith("/fotos/") ? "Ver fotos" : "Ver evento"} /></div> : null}</div> : null}
    {rating > 0 ? <div className={compact ? `px-[15px] ${media.length ? "mt-5" : "mt-3"}` : "mt-4 px-5"}><StarRating value={rating} size={compact ? 24 : 18} />{experienceLabel ? <p className="mt-2 text-[13px] text-white/50">{experienceLabel}</p> : null}</div> : experienceLabel ? <p className={`${compact ? "px-[15px]" : "px-5"} mt-3 text-[13px] text-white/50`}>{experienceLabel}</p> : null}
    <div className={`${compact ? "px-[15px]" : "px-5"} ${media.length || rating > 0 ? "mt-3" : ""}`}><PostEngagement postId={postId} likeCount={likeCount} liked={liked} commentCount={commentCount} detail={detail} /></div>
    <div className={compact ? "px-[15px] pb-5" : "px-5"}>
      {comment ? <><p data-post-copy className={`mt-3 whitespace-pre-line text-[15px] leading-relaxed text-white/85 ${compact && !expanded ? "line-clamp-3" : ""}`}>{!compact ? <span className="mr-2 font-semibold text-white">{username ? `@${username}` : authorName}</span> : null}{comment}</p>{compact && comment.length > 130 ? <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-1 text-sm text-white/70">{expanded ? "Mostrar menos" : "Mostrar más"}</button> : null}</> : null}
      {!reviewPage && !media.length && eventHref ? <div className="mt-3 flex justify-end"><EventGlassLink href={eventHref} label={eventHref.startsWith("/fotos/") ? "Ver fotos" : "Ver evento"} /></div> : null}
    </div>
  </article>;
}

function ReviewCarousel({ media, postId, aspect, openViewer = true }: { media: { id: string; src: string }[]; postId?: string | null; aspect: "portrait" | "square"; openViewer?: boolean }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lastTap = useRef(0);
  const drag = useRef({ x: 0, y: 0, moved: false });
  const openTimer = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);

  function updateActive() {
    const scroller = scrollerRef.current;
    if (!scroller || !scroller.clientWidth) return;
    setActive(Math.max(0, Math.min(media.length - 1, Math.round(scroller.scrollLeft / scroller.clientWidth))));
  }

  function onPointerUp(event: React.PointerEvent) {
    if (Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) > 8) return;
    const now = Date.now();
    if (postId && now - lastTap.current < 330) {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      window.dispatchEvent(new Event(`dorsalia:like-post:${postId}`));
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
    if (!openViewer) return;
    const index = active;
    openTimer.current = window.setTimeout(() => setViewer(index), 280);
  }

  return <div className="relative mt-4">
    <div
      ref={scrollerRef}
      onPointerDown={(event) => { drag.current = { x: event.clientX, y: event.clientY, moved: false }; }}
      onPointerUp={onPointerUp}
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
    {viewer !== null ? <PhotoViewer photos={media.map((image) => ({ id: image.id, src: image.src, alt: "Foto de la publicación" }))} startIndex={viewer} onClose={() => setViewer(null)} /> : null}
  </div>;
}

function ReviewImage({ src, aspect }: { src: string; aspect: "portrait" | "square" }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return <div className={`relative min-w-full snap-center overflow-hidden bg-white/[0.035] ${aspect === "square" ? "aspect-square" : "aspect-[4/5]"}`}>
    {!loaded && !failed ? (
      <Bone className="absolute inset-0 rounded-none" />
    ) : null}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={src}
      alt="Foto de la reseña"
      className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
    />
    {failed ? <div className="absolute inset-0 grid place-items-center px-5 text-center text-sm text-white/35">No fue posible cargar esta imagen.</div> : null}
  </div>;
}
