"use client";

import { useEffect, useRef, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import StarRating from "@/components/reviews/StarRating";
import { convertImageToWebP } from "@/lib/convertImageToWebP";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import type { ActivityItem, ActivityPhoto } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";

type SharedRace = { id: string; name: string; slug?: string | null; cover?: string | null };
type DraftPhoto = { id: string; file: File; preview: string };

export default function ActivityComposer() {
  const { user, profile } = useAthleteAuth();
  const [open, setOpen] = useState(false);
  const [race, setRace] = useState<SharedRace | null>(null);
  const [editing, setEditing] = useState<ActivityItem | null>(null);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [existing, setExisting] = useState<ActivityPhoto[]>([]);
  const [removed, setRemoved] = useState<ActivityPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function resetDraft() {
    setPhotos((current) => { current.forEach((photo) => URL.revokeObjectURL(photo.preview)); return []; });
    setExisting([]); setRemoved([]); setBody(""); setRating(0); setRace(null); setEditing(null); setProgress(null); setMessage("");
  }

  useEffect(() => {
    const openFree = () => { resetDraft(); setOpen(true); };
    const openShare = (event: Event) => { resetDraft(); setRace((event as CustomEvent<SharedRace>).detail || null); setOpen(true); };
    const openEdit = (event: Event) => {
      const item = (event as CustomEvent<ActivityItem>).detail;
      resetDraft(); setEditing(item); setBody(item.body || ""); setRating(Number(item.rating) || 0); setExisting(item.photos || []);
      if (item.race_event_id && item.event_name) setRace({ id: item.race_event_id, name: item.event_name, slug: item.event_slug, cover: item.event_cover_url });
      setOpen(true);
    };
    window.addEventListener("dorsalia:create-free-post", openFree);
    window.addEventListener("dorsalia:create-post", openShare);
    window.addEventListener("dorsalia:edit-post", openEdit);
    return () => { window.removeEventListener("dorsalia:create-free-post", openFree); window.removeEventListener("dorsalia:create-post", openShare); window.removeEventListener("dorsalia:edit-post", openEdit); };
  }, []);

  function close(force = false) { if (saving && !force) return; resetDraft(); setOpen(false); }

  async function prepare(files: File[]) {
    const selected = files.filter((file) => file.type.startsWith("image/") || /heic|heif/i.test(file.name)).slice(0, 4 - existing.length - photos.length);
    if (!selected.length) return;
    try {
      for (const [index, original] of selected.entries()) {
        setProgress(Math.round(index / selected.length * 100 + 5));
        const file = await convertImageToWebP(original, `actividad-${photos.length + index + 1}`);
        setPhotos((current) => [...current, { id: `${Date.now()}-${index}`, file, preview: URL.createObjectURL(file) }]);
        setProgress(Math.round((index + 1) / selected.length * 100));
      }
      window.setTimeout(() => setProgress(null), 500);
    } catch (error) { setProgress(null); setMessage(error instanceof Error ? error.message : "No se pudo preparar la imagen"); }
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!user) { window.location.href = "/auth?next=/"; return; }
    if (!editing && !race && !body.trim() && !photos.length) return;
    if (editing?.post_type === "review" && rating < 1) return;
    setSaving(true); setMessage("");
    const supabase = createClient();
    let postId = editing?.id || "";
    let created = false;
    const uploadedPaths: string[] = [];
    try {
      const { data: athleteProfile, error: profileError } = await supabase
        .from("athlete_profiles")
        .select("username, first_name, last_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!isAthleteOnboarded(user.user_metadata, athleteProfile)) {
        window.location.href = `/onboarding?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (editing?.post_type === "review" && editing.review_id) {
        const { error } = await supabase.from("event_reviews").update({ comment: body.trim().slice(0, 2000), rating, updated_at: new Date().toISOString() }).eq("id", editing.review_id).eq("user_id", user.id);
        if (error) throw error;
      } else if (editing) {
        const { error } = await supabase.from("activity_posts").update({ body: body.trim().slice(0, 2000), updated_at: new Date().toISOString() }).eq("id", editing.id).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { data: post, error } = await supabase.from("activity_posts").insert({ user_id: user.id, post_type: race ? "share" : "free", body: body.trim().slice(0, 2000), race_event_id: race?.id || null }).select("id").single();
        if (error || !post?.id) throw error || new Error("No se pudo publicar");
        postId = post.id; created = true;
      }
      for (const photo of removed) {
        if (photo.storage_path) await supabase.storage.from("public-image").remove([photo.storage_path]);
        const table = editing?.post_type === "review" ? "event_review_photos" : "activity_post_photos";
        const { error } = await supabase.from(table).delete().eq("id", photo.id);
        if (error) throw error;
      }
      for (const [index, photo] of photos.entries()) {
        setProgress(Math.round(index / photos.length * 100 + 5));
        const review = editing?.post_type === "review" && editing.review_id;
        const path = review ? `event-reviews/${user.id}/${editing.review_id}/${Date.now()}-${index}.webp` : `activity/${user.id}/${postId}/${Date.now()}-${index}.webp`;
        const { error: uploadError } = await supabase.storage.from("public-image").upload(path, photo.file, { contentType: "image/webp", upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const { data: publicUrl } = supabase.storage.from("public-image").getPublicUrl(path);
        const { error: photoError } = review
          ? await supabase.from("event_review_photos").insert({ review_id: editing.review_id, user_id: user.id, image_url: publicUrl.publicUrl, storage_path: path, sort_order: existing.length + index })
          : await supabase.from("activity_post_photos").insert({ post_id: postId, user_id: user.id, image_url: publicUrl.publicUrl, storage_path: path, sort_order: existing.length + index });
        if (photoError) throw photoError;
        setProgress(Math.round((index + 1) / photos.length * 100));
      }
      setSaving(false); window.dispatchEvent(new Event("dorsalia:activity-published")); close(true);
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from("public-image").remove(uploadedPaths);
      if (created && postId) await supabase.from("activity_posts").delete().eq("id", postId);
      setMessage(error instanceof Error ? error.message : "No se pudo publicar");
    } finally { setSaving(false); }
  }

  if (!open) return null;
  const isReview = editing?.post_type === "review";
  const mediaCount = existing.length + photos.length;
  return <div className="fixed inset-0 z-[320] flex items-end justify-center bg-black/70 md:items-center" role="dialog" aria-modal="true" aria-label={editing ? "Editar publicación" : "Crear actividad"}>
    <button type="button" className="absolute inset-0" onClick={() => close()} aria-label="Cerrar" />
    <form onSubmit={publish} className="relative z-10 max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] bg-[#111] md:rounded-[28px]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><button type="button" onClick={() => close()} className="text-sm text-white/65">Cancelar</button><h2 className="font-semibold text-white">{editing ? "Editar publicación" : race ? "Compartir evento" : "Nueva actividad"}</h2><button type="submit" disabled={saving || (!editing && !race && !body.trim() && !photos.length) || (isReview && rating < 1)} className="text-sm font-bold text-[#c9f24b] disabled:opacity-35">{saving ? "…" : editing ? "Guardar" : "Publicar"}</button></div>
      <div className="flex items-center gap-3 px-5 py-4">{profile.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 font-bold">{profile.fullName.slice(0, 1)}</span>}<span className="text-sm font-semibold text-white">{profile.fullName}</span>{isReview ? <span className="ml-auto"><StarRating value={rating} onChange={setRating} size={21} /></span> : null}</div>
      {race && !isReview ? <div className="mx-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">{race.cover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={race.cover} alt="" className="aspect-video w-full object-cover" /> : null}<p className="px-4 py-3 font-semibold text-white">{race.name}</p></div> : null}
      {mediaCount ? <div className="flex snap-x snap-mandatory overflow-x-auto">{existing.map((photo) => <div key={photo.id} className="relative aspect-[4/5] min-w-full snap-center">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.image_url} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => { setExisting((current) => current.filter((item) => item.id !== photo.id)); setRemoved((current) => [...current, photo]); }} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-xl">×</button></div>)}{photos.map((photo) => <div key={photo.id} className="relative aspect-[4/5] min-w-full snap-center">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.preview} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-xl">×</button></div>)}</div> : null}
      <textarea value={body} onChange={(event) => setBody(event.target.value.slice(0, 2000))} placeholder={isReview ? "Escribe tu reseña…" : race ? "Agrega un comentario…" : "¿Qué quieres compartir?"} className="min-h-32 w-full resize-none bg-transparent px-5 py-4 text-[16px] text-white outline-none placeholder:text-white/35" />
      {progress !== null ? <div className="mx-5 mb-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#c9f24b] transition-[width]" style={{ width: `${progress}%` }} /></div> : null}
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-4"><button type="button" onClick={() => inputRef.current?.click()} disabled={mediaCount >= 4 || progress !== null} className="text-sm font-semibold text-white/75 disabled:opacity-35">＋ Agregar fotos</button><span className="text-xs text-white/35">{body.length}/2000</span></div>
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(event) => { void prepare(Array.from(event.target.files || [])); event.target.value = ""; }} />
      {message ? <p className="px-5 pb-5 text-sm text-red-300">{message}</p> : null}
    </form>
  </div>;
}
