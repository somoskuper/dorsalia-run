"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";

type Race = { id: string; name: string; event_date: string | null; cover_image_url: string | null; rating_average?: number | null };
type Photo = { id: string; image_url: string; storage_path: string; sort_order: number };

export default function CreatorEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const editingId = params.get("edit");
  const [draftId, setDraftId] = useState<string | null>(null);
  const { user, loading } = useAthleteAuth();
  const [allowed, setAllowed] = useState(false);
  const [choosingEvent, setChoosingEvent] = useState(false);
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Race[]>([]);
  const [race, setRace] = useState<Race | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [galleryName, setGalleryName] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth?next=/creator/new"); return; }
    void supabase.from("creator_profiles").select("is_active, creator_type").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (!data?.is_active || data.creator_type !== "photographer") router.replace("/settings/account-type"); else setAllowed(true);
    });
  }, [loading, user?.id, router]);

  useEffect(() => {
    if (!editingId || !user) return;
    void supabase.from("creator_publications").select("id,race_event_id,title,description,gallery_name,purchase_url,status").eq("id", editingId).eq("creator_id", user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) { setError("No se encontró esta publicación."); return; }
        setTitle(data.title || ""); setDescription(data.description || ""); setGalleryName(data.gallery_name || ""); setPurchaseUrl(data.purchase_url || ""); setStatus(data.status);
        const [{ data: event }, { data: images }] = await Promise.all([
          supabase.from("race_events").select("id,name,event_date,cover_image_url").eq("id", data.race_event_id).maybeSingle(),
          supabase.from("creator_photos").select("id,image_url,storage_path,sort_order").eq("publication_id", editingId).order("sort_order"),
        ]);
        setRace(event as Race | null); setPhotos((images || []) as Photo[]);
      });
  }, [editingId, user?.id]);

  useEffect(() => {
    if (!choosingEvent) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void supabase.rpc("public_creator_event_search", { p_query: search.trim(), p_limit: 20 })
        .then(({ data }) => { if (active) setEvents((data || []) as Race[]); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, choosingEvent]);

  function move(index: number, delta: number) {
    setFiles((current) => { const next = [...current]; const target = index + delta; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }

  async function moveSaved(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    setPhotos(next);
    const results = await Promise.all(next.map((photo, position) => supabase.from("creator_photos").update({ sort_order: position }).eq("id", photo.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(failed.error.message);
  }

  async function removeSaved(photo: Photo) {
    if (status === "published" && photos.length <= 1) { setError("Una galería publicada debe conservar al menos una foto."); return; }
    if (!window.confirm("¿Quitar esta foto de la galería?")) return;
    const { error: deleteError } = await supabase.from("creator_photos").delete().eq("id", photo.id);
    if (deleteError) { setError(deleteError.message); return; }
    await supabase.storage.from("public-image").remove([photo.storage_path]);
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
  }

  async function save(publish: boolean) {
    if (!user || busy) return;
    if (!race) { setError("Escoge un evento."); return; }
    if (publish && (!title.trim() || !galleryName.trim() || photos.length + files.length === 0)) { setError("Completa el título, nombre de galería y sube al menos una foto."); return; }
    if (purchaseUrl.trim()) { try { if (new URL(purchaseUrl).protocol !== "https:") throw new Error(); } catch { setError("El enlace de compra debe comenzar con https://"); return; } }
    setBusy(true); setError("");
    let id = editingId || draftId;
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
      if (id) {
        const { error: updateError } = await supabase.from("creator_publications").update({ title: title.trim(), description: description.trim(), gallery_name: galleryName.trim(), purchase_url: purchaseUrl.trim() || null, updated_at: new Date().toISOString() }).eq("id", id).eq("creator_id", user.id);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase.from("creator_publications").insert({ creator_id: user.id, race_event_id: race.id, title: title.trim(), description: description.trim(), gallery_name: galleryName.trim(), purchase_url: purchaseUrl.trim() || null }).select("id").single();
        if (insertError || !data) throw insertError || new Error("No se pudo crear el borrador.");
        id = data.id;
        setDraftId(data.id);
      }
      {
        for (const [index, file] of files.entries()) {
          const response = await fetch("/api/creator/avif", { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream", Authorization: `Bearer ${token}` }, body: file });
          if (!response.ok) throw new Error((await response.json()).error || "No se pudo convertir la foto.");
          const avif = await response.blob();
          const path = `creators/${user.id}/${id}/${crypto.randomUUID()}.avif`;
          const { error: uploadError } = await supabase.storage.from("public-image").upload(path, avif, { contentType: "image/avif", upsert: false });
          if (uploadError) throw uploadError;
          const { data: publicUrl } = supabase.storage.from("public-image").getPublicUrl(path);
          const { data: newPhoto, error: photoError } = await supabase.from("creator_photos").insert({ publication_id: id, creator_id: user.id, storage_path: path, image_url: publicUrl.publicUrl, sort_order: photos.length + index }).select("id,image_url,storage_path,sort_order").single();
          if (photoError || !newPhoto) {
            await supabase.storage.from("public-image").remove([path]);
            throw photoError || new Error("No se pudo registrar la foto.");
          }
          setPhotos((current) => [...current, newPhoto as Photo]);
          setFiles((current) => current.filter((item) => item !== file));
        }
      }
      if (publish && status === "draft") {
        const { error: publishError } = await supabase.rpc("publish_creator_publication", { p_publication_id: id });
        if (publishError) throw publishError;
      }
      router.push("/creator/publications");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la galería."); }
    finally { setBusy(false); }
  }

  if (!allowed) return <p className="px-5 py-10 text-white/50">Comprobando cuenta…</p>;
  if (choosingEvent) return <div className="px-[15px] pb-20"><PageHeader title="Escoger evento" onBack={() => setChoosingEvent(false)} sticky /><main className="mx-auto mt-10 max-w-[640px]"><h2 className="text-[20px] font-semibold">Escoger evento</h2><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" className="mt-[10px] h-[44px] w-full rounded-full bg-[#191919] px-[15px] outline-none" /><div className="mt-8 divide-y divide-white/10">{events.map((event) => <button key={event.id} type="button" onClick={() => { setRace(event); setChoosingEvent(false); }} className="flex w-full items-center gap-3 py-5 text-left">{event.cover_image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={event.cover_image_url} alt="" className="h-12 w-12 rounded-xl object-cover" /> : null}<span className="min-w-0 flex-1"><strong className="block truncate text-[16px] font-normal">{event.name}</strong><small className="text-white/50">{event.event_date ? new Date(event.event_date).toLocaleDateString("es-MX") : ""}</small></span>{Number(event.rating_average) > 0 ? <span className="text-[#ffad0d]">★ {Number(event.rating_average).toFixed(1)}</span> : null}<span className="text-white/50">›</span></button>)}</div></main></div>;
  return <div className="px-[15px] pb-20"><PageHeader fallbackHref="/creator" title={editingId ? "Editar publicación" : "Nueva publicación"} sticky rightAction={<button type="button" onClick={() => void save(true)} disabled={busy} className="rounded-full bg-white px-4 py-2 font-semibold text-black disabled:opacity-50">{status === "published" ? "Guardar" : "Publicar"}</button>} />
    <main className="mx-auto mt-10 max-w-[640px] space-y-10">
      <section><h2 className="text-[20px] font-semibold">Configurar publicación</h2><div className="mt-[10px] rounded-[20px] bg-[#191919] p-[15px]"><button type="button" disabled={Boolean(editingId)} onClick={() => setChoosingEvent(true)} className="flex w-full items-center justify-between py-2 text-left disabled:opacity-60"><span>{race?.name || "Escoger evento"}</span><span>›</span></button><div className="mt-3 border-t border-white/10 pt-3"><label className="text-sm text-white/60" htmlFor="purchase-url">Enlace de compra (opcional)</label><input id="purchase-url" type="url" value={purchaseUrl} onChange={(event) => setPurchaseUrl(event.target.value)} placeholder="https://…" className="mt-2 w-full bg-transparent outline-none placeholder:text-white/35" /></div></div></section>
      <section><h2 className="text-[20px] font-semibold">Contenido</h2><input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 160))} placeholder="Título" className="mt-[10px] h-[44px] w-full rounded-[20px] bg-[#191919] px-[15px] outline-none" /><textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 4000))} placeholder="Descripción" className="mt-[15px] min-h-36 w-full rounded-[20px] bg-[#191919] p-[15px] outline-none" /></section>
      <section><h2 className="text-[20px] font-semibold">Galería</h2><input value={galleryName} onChange={(event) => setGalleryName(event.target.value.slice(0, 160))} placeholder="Nombre de la galería" className="mt-[10px] h-[44px] w-full rounded-[20px] bg-[#191919] px-[15px] outline-none" /><button type="button" onClick={() => inputRef.current?.click()} className="mt-[10px] w-full rounded-[20px] bg-[#191919] py-7 text-white/60">＋ Subir fotos</button><input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(event) => setFiles((current) => [...current, ...Array.from(event.target.files || [])].slice(0, 30))} /></section>
      <section><h2 className="text-[20px] font-semibold">Ordenar</h2><p className="mt-1 text-sm text-white/50">La primera foto será la portada de la publicación.</p><div className="mt-[10px] grid grid-cols-3 gap-[10px]">{photos.map((photo, index) => <div key={photo.id} className="relative aspect-square overflow-hidden rounded-[20px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.image_url} alt="" className="h-full w-full object-cover" />{index === 0 ? <span className="absolute left-2 top-2 text-xl">♛</span> : null}<div className="absolute bottom-2 left-2 flex gap-2"><button type="button" onClick={() => void moveSaved(index, -1)} aria-label="Mover antes" className="rounded-full bg-white px-2 text-black">←</button><button type="button" onClick={() => void moveSaved(index, 1)} aria-label="Mover después" className="rounded-full bg-white px-2 text-black">→</button><button type="button" onClick={() => void removeSaved(photo)} aria-label="Quitar foto" className="rounded-full bg-white px-2 text-black">×</button></div></div>)}{files.map((file, index) => <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-[20px] bg-[#191919]"><DraftPreview file={file} />{!photos.length && index === 0 ? <span className="absolute left-2 top-2 text-xl">♛</span> : null}<div className="absolute bottom-2 left-2 flex gap-2"><button type="button" onClick={() => move(index, -1)} aria-label="Mover antes" className="rounded-full bg-white px-2 text-black">←</button><button type="button" onClick={() => move(index, 1)} aria-label="Mover después" className="rounded-full bg-white px-2 text-black">→</button><button type="button" onClick={() => setFiles((current) => current.filter((_, i) => i !== index))} aria-label="Quitar foto" className="rounded-full bg-white px-2 text-black">×</button></div></div>)}</div></section>
      {error ? <p role="alert" className="text-sm text-[#DE5757]">{error}</p> : null}
      <div className="space-y-3"><button type="button" disabled={busy} onClick={() => void save(true)} className="w-full rounded-full bg-white py-4 font-bold text-black disabled:opacity-50">{busy ? "Guardando…" : status === "published" ? "Guardar cambios" : "Confirmar y publicar"}</button>{status === "draft" ? <button type="button" disabled={busy} onClick={() => void save(false)} className="w-full rounded-full border border-white/20 py-4 font-bold disabled:opacity-50">Guardar borrador</button> : null}</div>
    </main>
  </div>;
}

function DraftPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => { const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt={file.name} className="h-full w-full object-cover" /> : <span className="p-2 text-sm">{file.name}</span>;
}
