"use client";

import { useCallback, useEffect, useState } from "react";
import EventReviews from "@/components/reviews/EventReviews";
import { EMPTY_EVENT_REVIEWS, fetchEventReviews, type EventReviewData } from "@/lib/eventReviews";
import GlassPanel from "@/components/ui/GlassPanel";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { askForAccount } from "@/components/account/AccountPrompt";
import { createClient } from "@/lib/supabase/client";

export default function EventReviewPanel({ raceEventId, returnPath }: { raceEventId: string; returnPath: string }) {
  const { user } = useAthleteAuth();
  const [reviewEditorOpen, setReviewEditorOpen] = useState(false);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [data, setData] = useState<EventReviewData>(EMPTY_EVENT_REVIEWS);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setData(await fetchEventReviews(raceEventId)); }
    catch { setData(EMPTY_EVENT_REVIEWS); }
    finally { setLoading(false); }
  }, [raceEventId]);
  useEffect(() => { void load(); }, [load]);

  async function saveRating(value: number) {
    if (!user) { askForAccount("calificar este evento", returnPath, "review"); return; }
    if (ratingBusy) return;
    setRatingBusy(true);
    setRatingMessage("");
    try {
      const client = createClient();
      const { data: existing, error: readError } = await client.from("event_reviews")
        .select("id").eq("race_event_id", raceEventId).eq("user_id", user.id).maybeSingle();
      if (readError) throw readError;
      const result = existing
        ? await client.from("event_reviews").update({ rating: value, updated_at: new Date().toISOString() }).eq("id", existing.id).eq("user_id", user.id)
        : await client.from("event_reviews").insert({ race_event_id: raceEventId, user_id: user.id, rating: value, comment: "", entry_type: "rating", is_published: true });
      if (result.error) throw result.error;
      await load();
    } catch { setRatingMessage("No se pudo guardar tu puntuación. Inténtalo de nuevo."); }
    finally { setRatingBusy(false); }
  }

  function openReviewEditor() {
    if (!user) { askForAccount("reseñar este evento", returnPath, "review"); return; }
    setReviewEditorOpen(true);
    window.dispatchEvent(new Event("dorsalia:open-review-editor"));
  }

  const rating = data.count ? data.average : 0;
  return <section className="mt-4" aria-label="Reseñas del evento">
    <div className="grid grid-cols-3 border-y border-white/10 py-4 text-center">
      <div className="flex items-center justify-center gap-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/reviews/ala-review-L.svg" alt="" width={20} height={36} className={rating ? "" : "brightness-0 invert opacity-50"} />
        <span className="flex flex-col items-center">
          <strong className={`text-[24px] leading-[28px] ${rating ? "" : "text-white/50"}`}>{loading ? "—" : rating.toFixed(1)}</strong>
          <span className="flex gap-px">{Array.from({ length: 5 }, (_, i) => {
            const fill = Math.max(0, Math.min(1, rating - i)) * 100;
            return <span key={i} className="h-[7px] w-[8px]" style={{ clipPath: "polygon(50% 0%, 62% 35%, 100% 38%, 72% 62%, 80% 100%, 50% 78%, 20% 100%, 28% 62%, 0 38%, 38% 35%)", backgroundImage: rating ? `linear-gradient(90deg,#FFD900 0%,#FF8A00 ${fill}%,rgba(255,255,255,.5) ${fill}%,rgba(255,255,255,.5) 100%)` : "linear-gradient(rgba(255,255,255,.5),rgba(255,255,255,.5))" }} />;
          })}</span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/reviews/ala-review-R.svg" alt="" width={20} height={36} className={rating ? "" : "brightness-0 invert opacity-50"} />
      </div>
      <div><strong className="text-xl">{data.count}</strong><span className="mt-1 flex items-center justify-center gap-1 text-xs text-white/60">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/star.svg" width={12} height={12} alt="" className="brightness-0 invert" />Calificaciones</span></div>
      <div><strong className="text-xl">{data.review_count}</strong><span className="mt-1 flex items-center justify-center gap-1 text-xs text-white/60">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/star.svg" width={12} height={12} alt="" className="brightness-0 invert" />Reseñas</span></div>
    </div>
    <p className="mt-5 text-[16px]">Califica este evento</p>
    <div className="mt-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-[9px]" aria-label="Califica de una a cinco estrellas">{Array.from({ length: 5 }, (_, i) => <button key={i} type="button" onClick={() => void saveRating(i + 1)} disabled={ratingBusy} aria-label={`Calificar ${i + 1} ${i === 0 ? "estrella" : "estrellas"}`} aria-pressed={data.my_rating === i + 1} className="h-[30px] w-[30px] shrink-0 disabled:opacity-50">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/star.svg" alt="" width={30} height={30} className={`h-[30px] w-[30px] ${i < (data.my_rating || 0) ? "" : "grayscale opacity-50"}`} /></button>)}</div>
      <GlassPanel radius={999} className="shrink-0" style={{ height: 54, width: "fit-content" }} glassProps={{ glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 }}><button type="button" onClick={openReviewEditor} className="flex h-full items-center gap-2 px-[15px] text-[16px] text-white">Reseñar{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/reviews/resenas-post.svg" alt="" width={24} height={24} /></button></GlassPanel>
    </div>
    {ratingMessage ? <p role="alert" className="mt-3 text-sm text-white/75">{ratingMessage}</p> : null}
    {!loading && (user || data.reviews.length > 0) ? <div className={reviewEditorOpen ? "" : "event-review-panel"}>
      <EventReviews raceEventId={raceEventId} returnPath={returnPath} data={data} loading={loading} onReload={load} standalone showList hideGuestPrompt={data.reviews.length === 0} hideEmpty />
    </div> : null}
    <style jsx global>{`.event-review-panel #comentarios > div:has(> form) { display: none; }`}</style>
  </section>;
}
