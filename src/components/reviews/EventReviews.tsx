"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import StarRating from "@/components/reviews/StarRating";
import ReviewComposerModal from "@/components/reviews/ReviewComposerModal";
import ReviewPost from "@/components/reviews/ReviewPost";
import PostMenu from "@/components/activity/PostMenu";
import { convertImageToWebP } from "@/lib/convertImageToWebP";
import type { EventReviewData, ReviewExperience, ReviewPhoto } from "@/lib/eventReviews";
import { createClient } from "@/lib/supabase/client";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import { trackMetaCreateAccount } from "@/components/IniciarMetaPixel";
import { askForAccount } from "@/components/account/AccountPrompt";
import { PostSkeleton } from "@/components/ui/Skeleton";

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

export default function EventReviews({ raceEventId, returnPath, data, loading, onReload, standalone = false, showList = true }: {
  raceEventId: string; returnPath: string; data: EventReviewData; loading: boolean; onReload: () => Promise<void>; standalone?: boolean; showList?: boolean;
}) {
  const { user } = useAthleteAuth();
  const [profileSetup, setProfileSetup] = useState<"checking" | "complete" | "required">("checking");
  const needsProfileSetup = Boolean(user) && profileSetup !== "complete";
  const mine = data.reviews.find((review) => review.mine) || null;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [experience, setExperience] = useState<ReviewExperience | null>(null);
  const [photos, setPhotos] = useState<PreparedPhoto[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [photoStage, setPhotoStage] = useState("");
  const [message, setMessage] = useState("");
  const [showFirstEventBadge, setShowFirstEventBadge] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
    if (editing) return;
    setRating(mine?.rating || data.my_rating || 0); setComment(mine?.comment || ""); setExperience(mine?.experience === "participated" || mine?.experience === "watched" ? mine.experience : null);
    setPhotos((current) => { current.forEach((photo) => URL.revokeObjectURL(photo.preview)); return []; });
  }, [editing, mine?.id, mine?.rating, mine?.comment, mine?.experience, data.my_rating, raceEventId]);

  useEffect(() => {
    const onTopRating = (event: Event) => {
      const value = Number((event as CustomEvent<number>).detail);
      if (value < 1 || value > 5) return;
      if (!user) { askForAccount("calificar este evento", returnPath, "review"); return; }
      setRating(value);
      setEditing(true);
    };
    const onOpenReview = () => {
      if (!user) { askForAccount("reseñar este evento", returnPath, "review"); return; }
      setEditing(true);
    };
    window.addEventListener("dorsalia:open-review-editor", onOpenReview);
    window.addEventListener("dorsalia:rate-event", onTopRating);
    return () => { window.removeEventListener("dorsalia:open-review-editor", onOpenReview); window.removeEventListener("dorsalia:rate-event", onTopRating); };
  }, [returnPath, user]);

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
      if (experience) {
        const { error: experienceError } = await supabase.from("event_review_experiences").upsert({ review_id: saved.id, user_id: user.id, race_event_id: raceEventId, experience, updated_at: new Date().toISOString() }, { onConflict: "review_id" });
        if (experienceError) throw experienceError;
      } else {
        const { error: clearError } = await supabase.from("event_review_experiences").delete().eq("review_id", saved.id).eq("user_id", user.id);
        if (clearError) throw clearError;
      }
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
    setRating(mine?.rating || data.my_rating || 0); setComment(mine?.comment || ""); setExperience(mine?.experience === "participated" || mine?.experience === "watched" ? mine.experience : null); setEditing(true);
  }

  function chooseExperience(value: ReviewExperience) {
    setExperience((current) => current === value ? null : value);
  }

  async function deleteReview() {
    if (!user || !mine || !window.confirm("¿Eliminar tu reseña? Esta acción no se puede deshacer.")) return;
    const supabase = createClient();
    const paths = mine.photos.map((photo) => photo.storage_path).filter((path): path is string => Boolean(path));
    if (paths.length) await supabase.storage.from("public-image").remove(paths);
    const { error } = await supabase.from("event_reviews").delete().eq("id", mine.id).eq("user_id", user.id);
    if (error) setMessage(error.message); else { setEditing(false); await onReload(); window.dispatchEvent(new Event("dorsalia:activity-published")); }
  }

  const editor = <ReviewComposerModal
    open={Boolean(user) && profileSetup === "complete" && editing}
    rating={rating}
    comment={comment}
    experience={experience}
    existingPhotos={mine?.photos || []}
    pendingPhotos={photos}
    progress={photoProgress}
    progressLabel={photoStage}
    saving={saving}
    message={message}
    onClose={() => { if (!saving) setEditing(false); }}
    onRating={setRating}
    onComment={setComment}
    onExperience={chooseExperience}
    onPick={(files) => void preparePhotos(files)}
    onDrop={(files) => void preparePhotos(files.filter((file) => file.type.startsWith("image/") || /heic|heif/i.test(file.name)))}
    onRemoveExisting={(photo) => void removePhoto(photo)}
    onRemovePending={removePreparedPhoto}
    onSubmit={saveReview}
  />;

  const reviewOnboardingHref = `/onboarding?intent=review&next=${encodeURIComponent(returnPath)}`;

  return <section id="comentarios" className={standalone ? "mt-5 scroll-mt-6" : "mt-10 scroll-mt-6 border-t border-white/10 pt-8 md:mt-14 md:pt-10"}>
    {showFirstEventBadge ? <FirstEventBadgeModal onClose={() => setShowFirstEventBadge(false)} /> : null}
    {editor}
    {!standalone ? <div><h3 className="text-[24px] font-semibold text-white">Comentarios</h3></div> : null}
    {!user ? <div className="mt-6 px-5 py-6 text-center"><p className="text-[16px] leading-6 text-white/65">Comparte tu experiencia, puntúa el evento y publica tus fotos.</p><button type="button" onClick={() => { trackMetaCreateAccount("event_review", raceEventId); askForAccount("reseñar este evento", returnPath, "review"); }} className="mt-4 h-[52px] rounded-full bg-[#C5E500] px-6 text-[16px] font-bold text-[#070707]">Crear cuenta y reseñar</button></div> : profileSetup === "checking" ? <p className="mt-6 px-5 text-sm text-white/45">Preparando tu perfil…</p> : needsProfileSetup ? <div className="mt-6 bg-white/[0.05] px-5 py-6 text-center"><p className="text-sm leading-relaxed text-white/65">Completa tu perfil y elige tu username antes de publicar.</p><Link href={reviewOnboardingHref} className="mt-4 inline-flex rounded-full bg-[#c9f24b] px-6 py-3 text-sm font-bold" style={{ color: "#0a0a0a" }}>Configurar mi perfil</Link></div> : null}
    {showList ? <div className={standalone ? "mt-6 space-y-4" : "-mx-5 mt-6 space-y-0 md:mx-0"}>
      {loading ? <div className="w-full"><PostSkeleton count={2} media={false} /></div> : data.reviews.length ? data.reviews.slice(0, showAll ? data.reviews.length : 5).map((review) => <div key={review.id} className="w-full">
        <ReviewPost authorName={review.author_name} username={review.author_username} avatarUrl={review.author_avatar_url} profileHref={`/perfil/${review.author_username || review.author_user_id}`} rating={review.rating} comment={review.comment} photos={review.photos} experience={review.experience} updatedAt={review.updated_at} postId={review.activity_post_id} likeCount={Number(review.like_count) || 0} liked={Boolean(review.liked)} commentCount={Number(review.comment_count) || 0} action={review.mine ? <PostMenu onEdit={openEditor} onDelete={deleteReview} /> : null} variant={standalone ? "reviewPage" : "card"} />
      </div>) : <p className="px-5 text-sm text-white/45">Todavía no hay reseñas. Sé la primera persona en contar cómo estuvo.</p>}
    </div> : null}
    {showList && data.reviews.length > 5 ? <div className="mt-5 flex justify-center"><button type="button" onClick={() => setShowAll((value) => !value)} className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-xl">{showAll ? "Ver menos" : `Ver más (${data.reviews.length - 5})`}</button></div> : null}
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
