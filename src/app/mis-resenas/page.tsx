"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import ReviewPost from "@/components/reviews/ReviewPost";
import type { AthleteReview } from "@/lib/eventReviews";
import { createClient } from "@/lib/supabase/client";

export default function MisResenasPage() {
  const { user, loading: authLoading, profile } = useAthleteAuth();
  const [reviews, setReviews] = useState<AthleteReview[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    let active = true;
    void createClient().rpc("athlete_my_reviews").then(({ data }) => {
      if (active) { setReviews(Array.isArray(data) ? data as AthleteReview[] : []); setLoading(false); }
    });
    return () => { active = false; };
  }, [authLoading, user]);
  return <main className="min-h-screen bg-[#0e0e0e] px-[15px] pb-28 pt-5 text-white">
    <div className="mx-auto flex max-w-2xl items-center justify-between"><Link href="/review" aria-label="Volver" className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-2xl">‹</Link><h1 className="text-[20px]">Mis reseñas</h1><span className="w-10" /></div>
    {loading || authLoading ? <p className="mx-auto mt-10 max-w-2xl text-white/50">Cargando reseñas…</p>
      : !user ? <div className="mx-auto mt-10 max-w-2xl space-y-4"><p className="text-white/65">Inicia sesión para ver tus reseñas.</p><Link href="/auth?next=/mis-resenas" className="inline-flex rounded-full bg-[#c9f24b] px-5 py-3 font-semibold text-black">Iniciar sesión</Link></div>
      : reviews.length ? <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-5">{reviews.map((review) => <ReviewPost key={review.id} authorName={profile.fullName || "Corredor Dorsalia"} avatarUrl={profile.avatarUrl} rating={review.rating} comment={review.comment} photos={review.photos} fallbackImage={review.event_cover_url} eventName={`${review.entry_type === "rating" ? "Puntuación" : "Reseña"} · ${review.event_name}`} eventHref={review.event_slug ? `/review/${encodeURIComponent(review.event_slug)}` : undefined} updatedAt={review.updated_at} variant="reviewPage" />)}</div>
      : <p className="mx-auto mt-10 max-w-2xl text-white/50">Las carreras que califiques aparecerán aquí. <Link href="/review" className="text-[#c9f24b]">Explorar eventos finalizados</Link></p>}
  </main>;
}
