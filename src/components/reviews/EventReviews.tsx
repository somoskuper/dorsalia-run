"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import StarRating from "@/components/reviews/StarRating";
import ReviewPost from "@/components/reviews/ReviewPost";
import PostMenu from "@/components/activity/PostMenu";
import { convertImageToWebP } from "@/lib/convertImageToWebP";
import type { EventReviewData, ReviewPhoto } from "@/lib/eventReviews";
import { createClient } from "@/lib/supabase/client";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import { trackMetaCreateAccount } from "@/components/IniciarMetaPixel";

type PreparedPhoto = { id: string; file: File; preview: string };

export function EventRatingSummary({ data, onRate, locked = false, countdown }: {
  data: EventReviewData;
  onRate?: (rating: number) => void;
  locked?: boolean;
  countdown?: string | null;
}) {
  if (locked) {
    return <div className="mt-3 max-w-full text-white">
      <div className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-[12px] leading-tight text-white/70">
        <span className="shrink-0">Faltan</span>
        <strong role="timer" className="break-words font-bold tabular-nums text-white [overflow-wrap:anywhere]">
          {countdown || "Calculando…"}
        </strong>
      </div>
    </div>;
  }

  return <div className="mt-3 flex flex-wrap items-center gap-2 text-white">
    <StarRating value={data.average} onChange={onRate} size={18} label="Puntúa este evento" />
    <span className="text-sm font-bold">{data.count ? data.average.toFixed(1) : "—"}</span>
    <span className="text-xs text-white/55">{data.count === 1 ? "1 puntuación" : `${data.count} puntuaciones`}</span>
  </div>;
}

export default function EventReviews({ raceEventId, returnPath, data, loading, onReload, standalone = false }: {
  raceEventId: string; returnPath: string; data: EventReviewData; loading: boolean; onReload: () => Promise<void>; standalone?: boolean;
}) {
  const { user, profile } = useAthleteAuth();
  const [profileSetup, setProfileSetup] = useState<"checking" | "complete" | "required">("checking");
  const needsProfileSetup = Boolean(user) && profileSetup !== "complete";
  const mine = data.reviews.find((review) => review.mine) || null;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [photoStage, setPhotoStage] = useState("");
  const [message, setMessage] = useState("");
  const [showFirstEventBadge, setShowFirstEventBadge] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [editorSlide, setEditorSlide] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setProfileSetup("checking");
    void createClient().from("athlete_profiles")
      .select("username, first_name, last_name, phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) setProfileSetup(!error && isAthleteOnboarded(user.user_metadata, data) ? "complete" : "required");
      });
    return () => { active = false; };
  }, [user?.id, user?.user_metadata?.athlete_onboarding_done, user?.user_metadata?.profile_setup_required]);

  useEffect(() => {
    setRating(mine?.rating || data.my_rating || 0); setComment(mine?.comment || ""); setEditing(!mine);
    setPhotos((current) => { current.forEach((photo) => URL.revokeObjectURL(photo.preview)); return []; });
  }, [mine?.id, mine?.rating, mine?.comment, data.my_rating, raceEventId]);

  useEffect(() => {
    const onTopRating = (event: Event) => {
      const value = Number((event as CustomEvent<number>).detail);
      if (value < 1 || value > 5) return;
      setRating(value);
      setEditing(true);
      window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
    };
    const onOpenReview = () => { setEditing(true); window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); };
    window.addEventListener("dorsalia:open-review-editor", onOpenReview);
    window.addEventListener("dorsalia:rate-event", onTopRating);
    return () => { window.removeEventListener("dorsalia:open-review-editor", onOpenReview); window.removeEventListener("dorsalia:rate-event", onTopRating); };
  }, []);

  async function preparePhotos(selected: File[]) {
    const incoming = selected.slice(0, Math.max(0, 4 - (mine?.photos.length || 0) - photos.length));
    if (!incoming.length) return;
    setMessage(""); setPhotoProgress(2);
    try {
      for (const [index, original] of incoming.entries()) {
        const base = index / incoming.length * 100, step = 100 / incoming.length;
        setPhotoStage(`Preparando foto ${index + 1} de ${incoming.length}`); setPhotoProgress(Math.round(base + step * .2));
        const file = await convertImageToWebP(original, `resena-${photos.length + index + 1}`);
        setPhotoProgress(Math.round(base + step * .85));
        setPhotos((current) => [...current, { id: `${Date.now()}-${index}`, file, preview: URL.createObjectURL(file) }]);
        setPhotoProgress(Math.round(base + step));
      }
      setPhotoStage("Fotos listas");
      window.setTimeout(() => { setPhotoProgress(null); setPhotoStage(""); }, 800);
    } catch (error) {
      setPhotoProgress(null); setPhotoStage(""); setMessage(error instanceof Error ? error.message : "No se pudo preparar la foto");
    }
  }

  function removePreparedPhoto(id: string) {
    setPhotos((current) => { const target = current.find((photo) => photo.id === id); if (target) URL.revokeObjectURL(target.preview); return current.filter((photo) => photo.id !== id); });
  }

  async function saveReview(event: React.FormEvent) {
    event.preventDefault();
    if (!user || needsProfileSetup || rating < 1 || rating > 5 || photoProgress !== null) return;
    if (!comment.trim()) { setMessage("Escribe una reseña antes de publicarla."); return; }
    setSaving(true); setMessage("");
    try {
      const supabase = createClient();
      let badgePersistenceFailed = false;
      let earnsFirstEventBadge = false;
      if (!mine && user.user_metadata?.dorsalia_first_event_badge !== true) {
        const { data: earlierReviews, error: historyError } = await supabase
          .from("event_reviews")
          .select("id")
          .eq("user_id", user.id)
          .eq("entry_type", "review")
          .limit(1);
        if (historyError) throw historyError;
        earnsFirstEventBadge = !earlierReviews?.length;
      }
      const { data: saved, error } = await supabase.from("event_reviews").upsert({ race_event_id: raceEventId, user_id: user.id, rating, comment: comment.trim().slice(0, 2000), entry_type: "review", is_published: true, updated_at: new Date().toISOString() }, { onConflict: "race_event_id,user_id" }).select("id").single();
      if (error || !saved?.id) throw error || new Error("No se pudo guardar la reseña");
      for (const [index, photo] of photos.entries()) {
        setPhotoStage(`Subiendo foto ${index + 1} de ${photos.length}`); setPhotoProgress(Math.round(index / photos.length * 100 + 5));
        const path = `event-reviews/${user.id}/${saved.id}/${Date.now()}-${index}.webp`;
        const { error: uploadError } = await supabase.storage.from("public-image").upload(path, photo.file, { contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;
        setPhotoProgress(Math.round((index + .8) / photos.length * 100));
        const { data: publicUrl } = supabase.storage.from("public-image").getPublicUrl(path);
        const { error: photoError } = await supabase.from("event_review_photos").insert({ review_id: saved.id, user_id: user.id, image_url: publicUrl.publicUrl, storage_path: path, sort_order: (mine?.photos.length || 0) + index });
        if (photoError) throw photoError;
      }
      if (earnsFirstEventBadge) {
        const { error: badgeError } = await supabase.auth.updateUser({
          data: { ...user.user_metadata, dorsalia_first_event_badge: true },
        });
        if (badgeError) {
          badgePersistenceFailed = true;
        } else {
          setShowFirstEventBadge(true);
        }
      }
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview)); setPhotos([]);
      if (photos.length) { setPhotoStage("Fotos publicadas"); setPhotoProgress(100); }
      await onReload(); setEditing(false);
      setMessage(badgePersistenceFailed ? "Tu reseña se publicó, pero no pudimos guardar la insignia. Inténtalo de nuevo más tarde." : "");
      window.setTimeout(() => { setPhotoProgress(null); setPhotoStage(""); }, 700);
    } catch (error) {
      setPhotoProgress(null); setPhotoStage(""); setMessage(error instanceof Error ? error.message : "No se pudo guardar la reseña");
    } finally { setSaving(false); }
  }

  async function removePhoto(photo: ReviewPhoto) {
    if (!user || !mine) return;
    const supabase = createClient();
    if (photo.storage_path) await supabase.storage.from("public-image").remove([photo.storage_path]);
    const { error } = await supabase.from("event_review_photos").delete().eq("id", photo.id);
    if (error) setMessage(error.message); else await onReload();
  }

  function openEditor() {
    setRating(mine?.rating || data.my_rating || 0); setComment(mine?.comment || ""); setEditing(true);
    window.setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
  }

  async function deleteReview() {
    if (!user || !mine || !window.confirm("¿Eliminar tu reseña? Esta acción no se puede deshacer.")) return;
    const supabase = createClient();
    const paths = mine.photos.map((photo) => photo.storage_path).filter((path): path is string => Boolean(path));
    if (paths.length) await supabase.storage.from("public-image").remove(paths);
    const { error } = await supabase.from("event_reviews").delete().eq("id", mine.id).eq("user_id", user.id);
    if (error) setMessage(error.message); else { setEditing(true); await onReload(); window.dispatchEvent(new Event("dorsalia:activity-published")); }
  }

  const editorPhotoCount = (mine?.photos.length || 0) + photos.length;
  const editor = user && editing ? <form ref={editorRef} onSubmit={saveReview} className="mx-auto w-full max-w-2xl py-5">
    <div className="overflow-hidden rounded-[22px] bg-white/[0.075] shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={(event) => { event.preventDefault(); void preparePhotos(Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"))); }}>
      <div className="flex items-center gap-3 px-5 py-4">
        {profile.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 font-bold text-white">{profile.fullName.slice(0, 1).toUpperCase()}</div>}
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{profile.fullName}</p><p className="text-xs text-white/40">{mine ? "Editar publicación" : "Nueva reseña"}</p></div>
        <StarRating value={rating} onChange={setRating} size={23} />
      </div>
      {editorPhotoCount ? <div className="relative">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const node = event.currentTarget;
            if (node.clientWidth) setEditorSlide(Math.max(0, Math.min(editorPhotoCount - 1, Math.round(node.scrollLeft / node.clientWidth))));
          }}
        >
          {mine?.photos.map((photo) => <div key={photo.id} className="relative aspect-[4/5] min-w-full snap-center overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.image_url} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => void removePhoto(photo)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-lg text-white backdrop-blur" aria-label="Quitar foto">×</button></div>)}
          {photos.map((photo) => <div key={photo.id} className="relative aspect-[4/5] min-w-full snap-center overflow-hidden">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.preview} alt="Vista previa" className="h-full w-full object-cover" /><button type="button" onClick={() => removePreparedPhoto(photo.id)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/70 text-lg text-white backdrop-blur" aria-label="Quitar foto">×</button></div>)}
        </div>
        {editorPhotoCount > 1 ? <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white backdrop-blur">{Math.min(editorSlide + 1, editorPhotoCount)}/{editorPhotoCount}</span> : null}
      </div> : <button type="button" onClick={() => inputRef.current?.click()} className="grid aspect-[4/3] w-full place-items-center bg-black/20 text-center text-white/50">
        <span><span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/20 text-2xl text-white">＋</span><span className="mt-3 block text-sm font-semibold">Agrega fotos a tu reseña</span><span className="mt-1 block text-xs text-white/35">Selecciona o arrastra hasta 4 imágenes</span></span>
      </button>}
      {photoProgress !== null ? <div className="px-5 pt-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={photoProgress}><div className="flex justify-between text-[10px] font-semibold text-white/60"><span>{photoStage}</span><span>{photoProgress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#c9f24b] transition-[width] duration-300 ease-out" style={{ width: `${photoProgress}%` }} /></div></div> : null}
      <textarea value={comment} onChange={(event) => setComment(event.target.value.slice(0, 2000))} placeholder="Escribe una reseña…" className="min-h-28 w-full resize-y bg-transparent px-5 pb-3 pt-5 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/35" />
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-3"><button type="button" onClick={() => inputRef.current?.click()} disabled={editorPhotoCount >= 4 || photoProgress !== null} className="text-xs font-semibold text-white/70 disabled:opacity-35">＋ Agregar fotos</button><span className="text-[10px] text-white/35">{comment.length}/2000</span></div>
    </div>
    <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(event) => { void preparePhotos(Array.from(event.target.files || [])); event.target.value = ""; }} />
    <div className="mt-4 flex justify-end gap-2 px-5">{mine ? <button type="button" onClick={() => setEditing(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/65">Cancelar</button> : null}<button type="submit" disabled={saving || rating < 1 || photoProgress !== null} className="rounded-full bg-[#c9f24b] px-6 py-2.5 text-sm font-bold text-black disabled:opacity-40">{saving ? "Publicando…" : mine ? "Guardar cambios" : "Publicar reseña"}</button></div>
    {message ? <p className="mt-3 text-right text-xs text-white/60">{message}</p> : null}
  </form> : null;

  const reviewAuthHref = `/auth?mode=register&intent=review&next=${encodeURIComponent(returnPath)}`;
  const reviewOnboardingHref = `/onboarding?intent=review&next=${encodeURIComponent(returnPath)}`;

  return <section id="comentarios" className={standalone ? "mt-5 scroll-mt-6" : "mt-10 scroll-mt-6 border-t border-white/10 pt-8 md:mt-14 md:pt-10"}>
    {showFirstEventBadge ? <FirstEventBadgeModal onClose={() => setShowFirstEventBadge(false)} /> : null}
    {!standalone ? <div><h3 className="text-[24px] font-semibold text-white">Comentarios</h3></div> : null}
    {!user ? <div className="mt-6 bg-white/[0.05] px-5 py-6 text-center"><p className="text-sm leading-relaxed text-white/65">Comparte tu experiencia, puntúa el evento y publica tus fotos.</p><Link href={reviewAuthHref} onClick={() => trackMetaCreateAccount("event_review", raceEventId)} className="mt-4 inline-flex rounded-full bg-[#c9f24b] px-6 py-3 text-sm font-bold" style={{ color: "#0a0a0a" }}>Crear cuenta y publicar reseña</Link><p className="mt-3 text-xs text-white/40">Si ya tienes cuenta, podrás iniciar sesión en el siguiente paso.</p></div> : profileSetup === "checking" ? <p className="mt-6 px-5 text-sm text-white/45">Preparando tu perfil…</p> : needsProfileSetup ? <div className="mt-6 bg-white/[0.05] px-5 py-6 text-center"><p className="text-sm leading-relaxed text-white/65">Completa tu perfil y elige tu username antes de publicar.</p><Link href={reviewOnboardingHref} className="mt-4 inline-flex rounded-full bg-[#c9f24b] px-6 py-3 text-sm font-bold" style={{ color: "#0a0a0a" }}>Configurar mi perfil</Link></div> : !mine ? <div className="mt-6">{editor}</div> : null}
    <div className={standalone ? "mt-6 space-y-4" : "-mx-5 mt-6 space-y-0 md:mx-0"}>
      {loading ? <p className="px-5 text-sm text-white/45">Cargando reseñas…</p> : data.reviews.length ? data.reviews.slice(0, showAll ? data.reviews.length : 5).map((review) => <div key={review.id} className="w-full">
        {review.mine && editing ? editor : <ReviewPost authorName={review.author_name} username={review.author_username} avatarUrl={review.author_avatar_url} profileHref={`/perfil/${review.author_username || review.author_user_id}`} rating={review.rating} comment={review.comment} photos={review.photos} updatedAt={review.updated_at} postId={review.activity_post_id} likeCount={Number(review.like_count) || 0} liked={Boolean(review.liked)} action={review.mine ? <PostMenu onEdit={openEditor} onDelete={deleteReview} /> : null} variant={standalone ? "reviewPage" : "card"} />}
      </div>) : <p className="px-5 text-sm text-white/45">Todavía no hay reseñas. Sé la primera persona en contar cómo estuvo.</p>}
    </div>
    {data.reviews.length > 5 ? <div className="mt-5 flex justify-center"><button type="button" onClick={() => setShowAll((value) => !value)} className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-xl">{showAll ? "Ver menos" : `Ver más (${data.reviews.length - 5})`}</button></div> : null}
  </section>;
}

export function FirstEventBadgeModal({ onClose, message = "¡Tu primera reseña desbloqueó esta insignia!" }: { onClose: () => void; message?: string }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="first-event-badge-title">
    <button type="button" className="absolute inset-0 bg-black/75 backdrop-blur-xl" aria-label="Cerrar insignia" onClick={onClose} />
    <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-[32px] border border-white/15 bg-[#121212]/95 px-7 py-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.8)] sm:px-10">
      <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Cerrar">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--site-accent,#c9f24b)]">Nueva insignia</p>
      <div className="mt-5 grid h-[min(56vw,280px)] w-[min(56vw,280px)] place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://dorsalia.run/assetsdev/primer-evento-dorsalia.webp" alt="Insignia Primer evento en Dorsalia" className="dorsalia-first-medal-animation max-h-full max-w-full object-contain" />
      </div>
      <h2 id="first-event-badge-title" className="mt-8 text-2xl font-bold text-white sm:text-3xl">Primer evento en Dorsalia</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">{message} Ya puedes mostrarla en tu perfil desde <span className="font-semibold text-white">Configuración → Medallas en tu perfil</span>.</p>
      <button type="button" onClick={onClose} className="mt-6 rounded-full bg-[#c9f24b] px-7 py-3 text-sm font-bold text-black">¡Entendido!</button>
    </div>
    <style jsx global>{`@-webkit-keyframes dorsalia-first-medal-float { 0%, 100% { -webkit-transform: translateY(0) rotate(-5deg) scale(1); transform: translateY(0) rotate(-5deg) scale(1); } 50% { -webkit-transform: translateY(-8px) rotate(5deg) scale(1.04); transform: translateY(-8px) rotate(5deg) scale(1.04); } } @keyframes dorsalia-first-medal-float { 0%, 100% { -webkit-transform: translateY(0) rotate(-5deg) scale(1); transform: translateY(0) rotate(-5deg) scale(1); } 50% { -webkit-transform: translateY(-8px) rotate(5deg) scale(1.04); transform: translateY(-8px) rotate(5deg) scale(1.04); } } .dorsalia-first-medal-animation { -webkit-animation: dorsalia-first-medal-float 3.6s ease-in-out infinite; animation: dorsalia-first-medal-float 3.6s ease-in-out infinite; -webkit-transform-origin: center; transform-origin: center; will-change: transform; } @media (prefers-reduced-motion: reduce) { .dorsalia-first-medal-animation { -webkit-animation: none; animation: none; } }`}</style>
  </div>, document.body);
}
