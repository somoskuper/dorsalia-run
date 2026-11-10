"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/PageHeader";
import PhotoUploadBar from "@/components/media/PhotoUploadBar";
import type { ReviewExperience, ReviewPhoto } from "@/lib/eventReviews";

type PendingPhoto = { id: string; preview: string };

const CHOICES: { value: ReviewExperience; label: string }[] = [
  { value: "participated", label: "Participé" },
  { value: "watched", label: "Vi el evento" },
];

export default function ReviewComposerModal({
  open, rating, comment, experience, existingPhotos, pendingPhotos, progress, progressLabel, saving, message,
  onClose, onRating, onComment, onExperience, onPick, onDrop, onRemoveExisting, onRemovePending, onSubmit,
}: {
  open: boolean;
  rating: number;
  comment: string;
  experience: ReviewExperience | null;
  existingPhotos: ReviewPhoto[];
  pendingPhotos: PendingPhoto[];
  progress: number | null;
  progressLabel: string;
  saving: boolean;
  message: string;
  onClose: () => void;
  onRating: (value: number) => void;
  onComment: (value: string) => void;
  onExperience: (value: ReviewExperience) => void;
  onPick: (files: File[]) => void;
  onDrop: (files: File[]) => void;
  onRemoveExisting: (photo: ReviewPhoto) => void;
  onRemovePending: (id: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onCloseRef.current(); };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, saving]);

  if (!open || typeof document === "undefined") return null;
  const photoCount = existingPhotos.length + pendingPhotos.length;
  const publishDisabled = saving || rating < 1 || progress !== null;

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#070707] text-white" role="dialog" aria-modal="true" aria-label="Reseñar">
      <div className="mx-auto min-h-full max-w-[640px] px-[15px] pb-16">
        <PageHeader
          onBack={onClose}
          sticky
          rightAction={<button type="submit" form="review-composer" disabled={publishDisabled} style={{ color: "#0E0E0E" }} className="rounded-full bg-white px-5 py-2 text-[16px] font-bold disabled:opacity-50">{saving ? "Publicando…" : "Publicar"}</button>}
        />
        <form
          id="review-composer"
          onSubmit={onSubmit}
          className="mt-10"
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }}
          onDrop={(event) => { event.preventDefault(); onDrop(Array.from(event.dataTransfer.files)); }}
        >
          <h2 className="text-[20px] font-semibold leading-6">Toca para calificar</h2>
          <p className="mt-[10px] text-[14px] leading-5 text-white/50">Elige de 1 a 5 estrellas. Sin calificación no se puede publicar.</p>
          <div className="mt-[10px] flex items-center gap-[9px]" aria-label="Califica de una a cinco estrellas">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              const filled = value <= rating;
              return <button key={value} type="button" onClick={() => onRating(value)} aria-label={`Calificar ${value} ${value === 1 ? "estrella" : "estrellas"}`} aria-pressed={rating === value} className="h-9 w-9 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/reviews/star.svg" alt="" width={36} height={36} className={`h-9 w-9 ${filled ? "" : "grayscale opacity-50"}`} />
              </button>;
            })}
          </div>

          <label className="mt-[30px] block">
            <span className="sr-only">Qué piensas de este evento</span>
            <textarea value={comment} onChange={(event) => onComment(event.target.value.slice(0, 2000))} placeholder="¿Qué piensas de este evento?" className="min-h-[160px] w-full resize-none rounded-[20px] bg-[#191919] px-[15px] py-4 text-[16px] leading-6 text-white outline-none placeholder:text-white/50" />
          </label>
          <p className="mt-[10px] text-[14px] leading-5 text-white/50">Cuéntalo con tus palabras. {comment.length}/2000</p>

          <div className="mt-[30px]">
            <PhotoUploadBar disabled={photoCount >= 4 || progress !== null} onClick={() => document.getElementById("review-composer-photos")?.click()} />
            <p className="mt-[10px] text-[14px] leading-5 text-white/50">Opcional. Puedes agregar hasta 4 fotos.</p>
            <input id="review-composer-photos" type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(event) => { onPick(Array.from(event.target.files || [])); event.target.value = ""; }} />
            {photoCount ? <div className="mt-3 flex gap-2 overflow-x-auto">
              {existingPhotos.map((photo) => <PhotoThumb key={photo.id} src={photo.image_url} onRemove={() => onRemoveExisting(photo)} />)}
              {pendingPhotos.map((photo) => <PhotoThumb key={photo.id} src={photo.preview} onRemove={() => onRemovePending(photo.id)} />)}
            </div> : null}
            {progress !== null ? <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="flex justify-between text-[13px] text-white/50"><span>{progressLabel}</span><span>{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#C5E500]" style={{ width: `${progress}%` }} /></div></div> : null}
          </div>

          <h2 className="mt-[30px] text-[20px] font-semibold leading-6">¿Cómo viviste el evento?</h2>
          <p className="mt-[10px] text-[14px] leading-5 text-white/50">Opcional. Confirma si participaste o si solo lo viste. Puedes publicar sin elegir.</p>
          <div className="mt-[10px] flex flex-wrap gap-3" role="group" aria-label="Cómo viviste el evento">
            {CHOICES.map((choice) => {
              const selected = experience === choice.value;
              return <button key={choice.value} type="button" aria-pressed={selected} onClick={() => onExperience(choice.value)} className="h-11 rounded-full px-5 text-[16px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C5E500]" style={selected ? { background: "#ffffff", color: "#070707" } : { background: "transparent", color: "#ffffff", border: "1px solid rgba(255,255,255,0.35)" }}>{choice.label}</button>;
            })}
          </div>
          {message ? <p role="alert" className="mt-4 text-[14px] text-[#DE5757]">{message}</p> : null}
        </form>
      </div>
    </div>,
    document.body,
  );
}

function PhotoThumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[12px] bg-[#191919]">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt="" className="h-full w-full object-cover" />
    <button type="button" onClick={onRemove} aria-label="Quitar foto" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/settings-icons/close.svg" alt="" width={14} height={14} className="h-3.5 w-3.5" />
    </button>
  </div>;
}
