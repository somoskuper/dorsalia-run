"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ReviewPost from "@/components/reviews/ReviewPost";
import EventReviews from "@/components/reviews/EventReviews";
import GlassPanel from "@/components/ui/GlassPanel";
import ShareButton from "@/components/ShareButton";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { fetchActivityPost, type ActivityItem } from "@/lib/activity";
import { isPortfolioName } from "@/lib/creatorPortfolio";
import { EMPTY_EVENT_REVIEWS, fetchEventReviews, type EventReviewData } from "@/lib/eventReviews";
import { askForAccount } from "@/components/account/AccountPrompt";
import { createClient } from "@/lib/supabase/client";
import { PhotoGridSkeleton } from "@/components/ui/Skeleton";
import ViewedCreatorPost from "@/components/creator/ViewedCreatorPost";
import { rememberPhotoReturn } from "@/lib/photoNavigation";

type Publication = { id: string; creator_id: string; title: string; description: string; gallery_name: string; purchase_url: string | null; activity_post_id: string | null; published_at: string | null };
type Photo = { id: string; publication_id: string; image_url: string; sort_order: number };
export type GalleryEvent = { id: string; name: string; cover: string | null; description: string; href: string; slug: string };

export const EVENT_PHOTOS_BACKGROUND = "linear-gradient(180deg, #C5E500 0%, #6F8100 24%, #2A3100 55%, #141800 100%)";

export default function CreatorEventGallery({ event }: { event: GalleryEvent }) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activity, setActivity] = useState<Record<string, ActivityItem>>({});
  const { user } = useAthleteAuth();
  const [reviews, setReviews] = useState<EventReviewData>(EMPTY_EVENT_REVIEWS);
  const [reviewEditorOpen, setReviewEditorOpen] = useState(false);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const loadReviews = useCallback(async () => {
    try { setReviews(await fetchEventReviews(event.id)); }
    catch { setReviews(EMPTY_EVENT_REVIEWS); }
  }, [event.id]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void supabase.from("creator_publications").select("id,creator_id,title,description,gallery_name,purchase_url,activity_post_id,published_at")
      .eq("race_event_id", event.id).eq("status", "published").order("published_at", { ascending: false }).then(async ({ data }) => {
        const next = ((data || []) as Publication[]).filter((post) => !isPortfolioName(post.title) && !isPortfolioName(post.gallery_name));
        if (!active) return;
        setPublications(next);
        if (!next.length) { setLoading(false); return; }
        const [{ data: images }, posts] = await Promise.all([
          supabase.from("creator_photos").select("id,publication_id,image_url,sort_order").in("publication_id", next.map((post) => post.id)).order("sort_order"),
          Promise.all(next.map((post) => post.activity_post_id ? fetchActivityPost(post.activity_post_id).catch(() => null) : Promise.resolve(null))),
        ]);
        if (!active) return;
        setPhotos((images || []) as Photo[]);
        setActivity(Object.fromEntries(posts.filter((item): item is ActivityItem => Boolean(item)).map((item) => [item.id, item])));
        setLoading(false);
      });
    return () => { active = false; };
  }, [event.id]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  async function saveRating(value: number) {
    if (!user) { askForAccount("calificar este evento", window.location.pathname, "review"); return; }
    if (ratingBusy) return;
    setRatingBusy(true); setRatingMessage("");
    try {
      const client = createClient();
      const { data: existing, error: readError } = await client.from("event_reviews").select("id").eq("race_event_id", event.id).eq("user_id", user.id).maybeSingle();
      if (readError) throw readError;
      const result = existing
        ? await client.from("event_reviews").update({ rating: value, updated_at: new Date().toISOString() }).eq("id", existing.id).eq("user_id", user.id)
        : await client.from("event_reviews").insert({ race_event_id: event.id, user_id: user.id, rating: value, comment: "", entry_type: "rating", is_published: true });
      if (result.error) throw result.error;
      await loadReviews();
    } catch { setRatingMessage("No se pudo guardar tu puntuación. Inténtalo de nuevo."); }
    finally { setRatingBusy(false); }
  }

  function openReviewEditor() {
    if (!user) { askForAccount("reseñar este evento", window.location.pathname, "review"); return; }
    setReviewEditorOpen(true);
    window.dispatchEvent(new Event("dorsalia:open-review-editor"));
  }

  const visible = publications.filter((publication) => photos.some((photo) => photo.publication_id === publication.id));
  const rating = reviews.count ? reviews.average : 0;

  return <main className="relative min-h-screen pb-28 text-white">
    <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: EVENT_PHOTOS_BACKGROUND }} />
    <div className="relative mx-auto max-w-2xl px-[15px]">
      <PageHeader fallbackHref={event.href} sticky gradient={false} rightAction={<ShareButton title={event.name} text={`Fotos de ${event.name}`} />} />
      <div className="mt-8 flex flex-col items-center text-center">
        <div className="w-[260px] overflow-hidden rounded-[15px] bg-black/20">{event.cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={event.cover} alt={`Portada de ${event.name}`} className="block h-auto w-full" /> : null}</div>
        <h1 className="mt-4 max-w-[330px] text-[24px] font-bold uppercase leading-tight">{event.name}</h1>
      </div>
      <div className="mt-5 grid grid-cols-3 border-y border-white/10 py-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/ala-review-L.svg" alt="" width={20} height={36} className={rating ? "" : "brightness-0 invert opacity-50"} />
          <span className="flex flex-col items-center"><strong className={`text-[24px] leading-[28px] ${rating ? "" : "text-white/50"}`}>{rating.toFixed(1)}</strong><span className="flex gap-px">{Array.from({ length: 5 }, (_, i) => { const fill = Math.max(0, Math.min(1, rating - i)) * 100; return <span key={i} className="h-[7px] w-[8px]" style={{ clipPath: "polygon(50% 0%, 62% 35%, 100% 38%, 72% 62%, 80% 100%, 50% 78%, 20% 100%, 28% 62%, 0 38%, 38% 35%)", backgroundImage: rating ? `linear-gradient(90deg,#FFD900 0%,#FF8A00 ${fill}%,rgba(255,255,255,.5) ${fill}%,rgba(255,255,255,.5) 100%)` : "linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,.5))" }} />; })}</span></span>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/ala-review-R.svg" alt="" width={20} height={36} className={rating ? "" : "brightness-0 invert opacity-50"} />
        </div>
        <div><strong className="text-xl">{reviews.count}</strong><span className="mt-1 flex items-center justify-center gap-1 text-xs text-white/60">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/star.svg" width={12} height={12} alt="" className="brightness-0 invert" />Calificaciones</span></div>
        <div><strong className="text-xl">{reviews.review_count}</strong><span className="mt-1 flex items-center justify-center gap-1 text-xs text-white/60">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/star.svg" width={12} height={12} alt="" className="brightness-0 invert" />Reseñas</span></div>
      </div>
      <h2 className="mt-8 text-[24px] font-bold">Fotos del evento</h2>
      <div className="-mx-[15px] mt-4 space-y-8" onClickCapture={(click) => {
        const target = click.target as HTMLElement;
        const href = target.closest("a")?.getAttribute("href") || "";
        if (target.closest("[data-post-media]") || href.startsWith(`/fotos/${encodeURIComponent(event.slug)}/`)) rememberPhotoReturn(`/fotos/${encodeURIComponent(event.slug)}`);
      }}>
        {visible.map((publication) => {
          const item = publication.activity_post_id ? activity[publication.activity_post_id] : undefined;
          const gallery = photos.filter((photo) => photo.publication_id === publication.id).map((photo) => ({ id: photo.id, image_url: photo.image_url, sort_order: photo.sort_order }));
          return <ViewedCreatorPost key={publication.id} publicationId={publication.id} surface="fotos"><ReviewPost
            authorName={item?.display_name || publication.gallery_name || "Fotógrafo"}
            username={item?.username}
            avatarUrl={item?.avatar_url}
            profileHref={item?.username ? `/perfil/${item.username}` : undefined}
            rating={0}
            comment={publication.description}
            photos={gallery}
            updatedAt={publication.published_at || item?.created_at || ""}
            postId={publication.activity_post_id}
            likeCount={Number(item?.like_count) || 0}
            liked={Boolean(item?.liked)}
            commentCount={Number(item?.comment_count) || 0}
            variant="reviewPage"
            mediaAspect="portrait"
            postHref={`/fotos/${encodeURIComponent(event.slug)}/${publication.id}`}
            mediaLink={{ href: `/fotos/${encodeURIComponent(event.slug)}/${publication.id}`, label: "Ver galería" }}
            verified
          /></ViewedCreatorPost>;
        })}
        {!loading && !visible.length ? <p className="px-[15px] text-center text-[15px] text-white/70">Todavía no hay fotos publicadas de este evento.</p> : null}
        {loading ? <div className="px-[15px]"><PhotoGridSkeleton count={6} /></div> : null}
      </div>
      <p className="mt-8 text-[16px]">Califica este evento</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-[9px]" aria-label="Califica de una a cinco estrellas">{Array.from({ length: 5 }, (_, i) => <button key={i} type="button" onClick={() => void saveRating(i + 1)} disabled={ratingBusy} aria-label={`Calificar ${i + 1} ${i === 0 ? "estrella" : "estrellas"}`} aria-pressed={reviews.my_rating === i + 1} className="h-[30px] w-[30px] shrink-0 disabled:opacity-50">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/star.svg" alt="" width={30} height={30} className={`h-[30px] w-[30px] ${i < (reviews.my_rating || 0) ? "" : "grayscale opacity-50"}`} /></button>)}</div>
        <GlassPanel radius={999} className="shrink-0" style={{ height: 54, width: "fit-content" }} glassProps={{ glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 }}><button type="button" onClick={openReviewEditor} className="flex h-full items-center gap-2 px-[15px] text-[16px] text-white">Reseñar{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/resenas-post.svg" alt="" width={24} height={24} /></button></GlassPanel>
      </div>
      {ratingMessage ? <p role="alert" className="mt-3 text-sm text-white/75">{ratingMessage}</p> : null}
      <div className={`${reviewEditorOpen ? "" : "photos-review-visual"} -mx-[15px]`}><EventReviews raceEventId={event.id} returnPath={`/fotos/${encodeURIComponent(event.slug)}`} data={reviews} loading={false} onReload={loadReviews} standalone showList={false} /></div>
      <style jsx global>{`.photos-review-visual #comentarios > div:has(> form) { display: none; }`}</style>
    </div>
    <div className="relative mx-auto mt-8 flex justify-center px-[15px] pb-10">
      <GlassPanel radius={999} className="shrink-0" style={{ height: 54, width: "fit-content" }} glassProps={{ glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 }}>
        <a href={event.href} className="flex h-full items-center px-[15px] text-[16px] text-white">Ver evento</a>
      </GlassPanel>
    </div>
  </main>;
}
