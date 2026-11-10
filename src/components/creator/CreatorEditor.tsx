"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PhotoUploadBar from "@/components/media/PhotoUploadBar";
import PublicationGallery from "@/components/creator/PublicationGallery";
import CreatorListRow, { CreatorList } from "@/components/creator/CreatorListRow";
import SettingsSection from "@/components/settings/SettingsSection";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { convertImageToWebP } from "@/lib/convertImageToWebP";
import { portfolioCardOptions, portfolioCardPath } from "@/lib/photoDelivery";
import { createClient } from "@/lib/supabase/client";

type Race = { id: string; name: string; event_date: string | null; event_end_date?: string | null; cover_image_url: string | null; rating_average?: number | null };

function eventHasEnded(event: Pick<Race, "event_date" | "event_end_date">) {
  const end = Date.parse(String(event.event_end_date || event.event_date || ""));
  return Number.isFinite(end) && end <= Date.now();
}
type Photo = { id: string; image_url: string; storage_path: string; sort_order: number };
type Slot = { id: string; src: string; file?: File; photo?: Photo };

const fieldClass = "w-full rounded-[20px] bg-[#191919] pl-[15px] pr-12 text-[16px] text-white outline-none placeholder:text-white/50";

export default function CreatorEditor() {
  const router = useRouter();
  const params = useSearchParams();
  const editingId = params.get("edit");
  const [draftId, setDraftId] = useState<string | null>(null);
  const { user, loading } = useAthleteAuth();
  const [allowed, setAllowed] = useState(false);
  const [screen, setScreen] = useState<"form" | "event" | "purchase">("form");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Race[]>([]);
  const [race, setRace] = useState<Race | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [galleryName, setGalleryName] = useState("");
  const [purchaseUrl, setPurchaseUrl] = useState("");
  const [status, setStatus] = useState("draft");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const slotsRef = useRef(slots);
  const orderTimer = useRef<number | null>(null);
  slotsRef.current = slots;
  const supabase = createClient();

  useEffect(() => () => { slotsRef.current.forEach((slot) => { if (slot.file) URL.revokeObjectURL(slot.src); }); }, []);

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
          supabase.from("race_events").select("id,name,event_date,event_end_date,cover_image_url").eq("id", data.race_event_id).maybeSingle(),
          supabase.from("creator_photos").select("id,image_url,storage_path,sort_order").eq("publication_id", editingId).order("sort_order"),
        ]);
        setRace(event as Race | null);
        setSlots(((images || []) as Photo[]).map((photo) => ({ id: photo.id, src: photo.image_url, photo })));
      });
  }, [editingId, user?.id]);

  useEffect(() => {
    if (screen !== "event") return;
    let active = true;
    const timer = window.setTimeout(() => {
      const now = new Date().toISOString();
      let query = supabase.from("race_events").select("id,name,event_date,event_end_date,cover_image_url").or(`and(event_end_date.not.is.null,event_end_date.lte.${now}),and(event_end_date.is.null,event_date.lte.${now})`).order("event_date", { ascending: false }).limit(20);
      const term = search.trim();
      if (term) query = query.ilike("name", `%${term}%`);
      void query.then(({ data }) => { if (active) setEvents(((data || []) as Race[]).filter(eventHasEnded)); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, screen]);

  function addFiles(list: File[]) {
    const room = 30 - slotsRef.current.length;
    if (room <= 0) { setError("Puedes subir hasta 30 fotos."); return; }
    const next = list.slice(0, room).map((file) => ({ id: crypto.randomUUID(), src: URL.createObjectURL(file), file }));
    setSlots((current) => [...current, ...next]);
    setError("");
  }

  async function persistOrder(next: Slot[]) {
    const saved = next.flatMap((slot, index) => slot.photo ? [{ id: slot.photo.id, index }] : []);
    if (!saved.length) return;
    const results = await Promise.all(saved.map((item) => supabase.from("creator_photos").update({ sort_order: item.index }).eq("id", item.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(failed.error.message);
  }

  function reorder(from: number, to: number) {
    if (from === to || busy) return;
    setSlots((current) => {
      if (from < 0 || to < 0 || from >= current.length || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const stamped = next.map((slot, index) => slot.photo ? { ...slot, photo: { ...slot.photo, sort_order: index } } : slot);
      if (orderTimer.current) window.clearTimeout(orderTimer.current);
      orderTimer.current = window.setTimeout(() => { void persistOrder(stamped); }, 350);
      return stamped;
    });
  }

  async function removeSlot(id: string) {
    const slot = slotsRef.current.find((item) => item.id === id);
    if (!slot || busy) return;
    if (status === "published" && slotsRef.current.length <= 1) { setError("Una galería publicada debe conservar al menos una foto."); return; }
    if (slot.file) {
      URL.revokeObjectURL(slot.src);
      const next = slotsRef.current.filter((item) => item.id !== id);
      setSlots(next);
      return;
    }
    if (!slot.photo) return;
    setError("");
    const { error: deleteError } = await supabase.from("creator_photos").delete().eq("id", slot.photo.id);
    if (deleteError) { setError(deleteError.message); return; }
    const card = portfolioCardPath(slot.photo.storage_path);
    await supabase.storage.from("public-image").remove(card ? [slot.photo.storage_path, card] : [slot.photo.storage_path]);
    if (orderTimer.current) window.clearTimeout(orderTimer.current);
    const next = slotsRef.current.filter((item) => item.id !== id).map((slot, index) => slot.photo ? { ...slot, photo: { ...slot.photo, sort_order: index } } : slot);
    setSlots(next);
    void persistOrder(next);
  }

  async function save(publish: boolean) {
    if (!user || busy) return;
    if (orderTimer.current) window.clearTimeout(orderTimer.current);
    if (!race) { setError("Escoge un evento."); return; }
    if (!eventHasEnded(race)) { setError("Solo puedes publicar fotos de eventos que ya finalizaron."); return; }
    if (publish && (!title.trim() || !galleryName.trim() || slotsRef.current.length === 0)) { setError("Completa el título, nombre de galería y sube al menos una foto."); return; }
    if (purchaseUrl.trim()) { try { if (new URL(purchaseUrl).protocol !== "https:") throw new Error(); } catch { setError("El enlace de compra debe comenzar con https://"); return; } }
    setBusy(true); setError("");
    let id = editingId || draftId;
    let current = [...slotsRef.current];
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
      for (let index = 0; index < current.length; index += 1) {
        const slot = current[index];
        if (!slot.file) {
          if (slot.photo && slot.photo.sort_order !== index) {
            const { error: orderError } = await supabase.from("creator_photos").update({ sort_order: index }).eq("id", slot.photo.id);
            if (orderError) throw orderError;
            current[index] = { ...slot, photo: { ...slot.photo, sort_order: index } };
          }
          continue;
        }
        const response = await fetch("/api/creator/avif", { method: "POST", headers: { "Content-Type": slot.file.type || "application/octet-stream", Authorization: `Bearer ${token}` }, body: slot.file });
        if (!response.ok) throw new Error((await response.json()).error || "No se pudo convertir la foto.");
        const avif = await response.blob();
        const fileId = crypto.randomUUID();
        const path = `creators/${user.id}/${id}/${fileId}.avif`;
        const { error: uploadError } = await supabase.storage.from("public-image").upload(path, avif, { contentType: "image/avif", upsert: false });
        if (uploadError) throw uploadError;
        try {
          const card = await convertImageToWebP(slot.file, "card", portfolioCardOptions);
          await supabase.storage.from("public-image").upload(`activity/${user.id}/cards/${fileId}.webp`, card, { contentType: "image/webp", upsert: false });
        } catch { /* La miniatura no impide guardar el AVIF original. */ }
        const { data: publicUrl } = supabase.storage.from("public-image").getPublicUrl(path);
        const { data: newPhoto, error: photoError } = await supabase.from("creator_photos").insert({ publication_id: id, creator_id: user.id, storage_path: path, image_url: publicUrl.publicUrl, sort_order: index }).select("id,image_url,storage_path,sort_order").single();
        if (photoError || !newPhoto) {
          await supabase.storage.from("public-image").remove([path]);
          throw photoError || new Error("No se pudo registrar la foto.");
        }
        URL.revokeObjectURL(slot.src);
        current[index] = { id: newPhoto.id, src: newPhoto.image_url, photo: newPhoto as Photo };
        setSlots([...current]);
      }
      if (publish && status === "draft") {
        const { error: publishError } = await supabase.rpc("publish_creator_publication", { p_publication_id: id });
        if (publishError) throw publishError;
      }
      if (publish) {
        const { data: publishedRow } = await supabase.from("creator_publications").select("activity_post_id").eq("id", id).eq("creator_id", user.id).maybeSingle();
        if (publishedRow?.activity_post_id) await supabase.from("activity_posts").update({ body: description.trim() }).eq("id", publishedRow.activity_post_id).eq("user_id", user.id);
      }
      router.push("/creator/publications");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar la galería."); }
    finally { setBusy(false); }
  }

  function finishPurchase() {
    if (purchaseUrl.trim()) { try { if (new URL(purchaseUrl).protocol !== "https:") throw new Error(); } catch { setError("El enlace de compra debe comenzar con https://"); return; } }
    setError("");
    setScreen("form");
  }

  if (!allowed) return <p className="px-[15px] py-10 text-white/50">Comprobando cuenta…</p>;
  if (busy) return <div className="fixed inset-0 z-[200] grid place-items-center bg-[#070707]" role="status" aria-live="polite"><div className="flex flex-col items-center gap-4"><span className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#C5E500]" /><p className="text-[16px] font-semibold">Publicando</p></div></div>;
  if (screen === "event") return <div className="px-[15px] pb-20"><PageHeader title="Escoger evento" onBack={() => setScreen("form")} sticky /><main className="mx-auto mt-10 max-w-[640px]"><h2 className="text-[20px] font-semibold leading-6">Escoger evento</h2><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" className="mt-[10px] h-[44px] w-full rounded-[20px] bg-[#191919] px-[15px] text-[16px] outline-none placeholder:text-white/50" /><CreatorList>{events.map((event) => <CreatorListRow key={event.id} onClick={() => { setRace(event); setScreen("form"); }} media={event.cover_image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={event.cover_image_url} alt="" className="h-12 w-12 rounded-xl object-cover" /> : null} title={event.name} subtitle={event.event_date ? new Date(event.event_date).toLocaleDateString("es-MX") : ""} trailing={Number(event.rating_average) > 0 ? <span className="text-[#ffad0d]">★ {Number(event.rating_average).toFixed(1)}</span> : null} />)}</CreatorList></main></div>;
  if (screen === "purchase") return <div className="px-[15px] pb-20"><PageHeader title="Enlace de compra" onBack={() => setScreen("form")} onSave={finishPurchase} sticky /><main className="mx-auto mt-10 max-w-[640px]"><h2 className="text-[20px] font-semibold leading-6">Enlace de compra</h2><input type="url" value={purchaseUrl} onChange={(event) => setPurchaseUrl(event.target.value)} placeholder="https://…" className="mt-[10px] h-[44px] w-full rounded-[20px] bg-[#191919] px-[15px] text-[16px] outline-none placeholder:text-white/50" /><p className="mt-4 text-sm leading-5 text-white/50">Opcional. Si lo agregas, debe comenzar con https:// y aparece junto a la galería.</p>{error ? <p role="alert" className="mt-4 text-sm text-[#DE5757]">{error}</p> : null}</main></div>;

  const publishLabel = status === "published" ? "Guardar" : "Publicar";
  return <div className="px-[15px] pb-20"><PageHeader fallbackHref="/creator" sticky rightAction={<button type="button" onClick={() => void save(true)} disabled={busy} style={{ color: "#0E0E0E" }} className="rounded-full bg-white px-5 py-2 text-[16px] font-bold disabled:opacity-50">{publishLabel}</button>} />
    <main className="mx-auto mt-10 max-w-[640px]">
      <SettingsSection title="Configurar publicación" links={[
        { label: race?.name || "Escoger evento", icon: "medallas.svg", onClick: () => setScreen("event"), disabled: Boolean(editingId) },
        { label: purchaseUrl.trim() || "Enlace de compra", icon: "Money.svg", onClick: () => setScreen("purchase") },
      ]} />
      <section className="mt-[30px]" aria-label="Contenido">
        <h2 className="text-[20px] font-semibold leading-6">Contenido</h2>
        <label className="relative mt-[10px] block">
          <input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 160))} placeholder="Título" className={`${fieldClass} h-[44px]`} />
          <FieldChevron />
        </label>
        <label className="relative mt-[15px] block">
          <textarea value={description} onChange={(event) => setDescription(event.target.value.slice(0, 4000))} placeholder="Descripción" className={`${fieldClass} min-h-[140px] resize-none py-3`} />
          <FieldChevron />
        </label>
      </section>
      <section className="mt-[30px]" aria-label="Galería">
        <h2 className="text-[20px] font-semibold leading-6">Galería</h2>
        <label className="relative mt-[10px] block">
          <input value={galleryName} onChange={(event) => setGalleryName(event.target.value.slice(0, 160))} placeholder="Nombre de la galería" className={`${fieldClass} h-[44px]`} />
          <FieldChevron />
        </label>
        <div className="mt-[10px]"><PhotoUploadBar disabled={busy} onClick={() => inputRef.current?.click()} /></div>
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(event) => { const list = Array.from(event.target.files || []); event.target.value = ""; addFiles(list); }} />
        {slots.length ? <PublicationGallery photos={slots.map((slot) => ({ id: slot.id, src: slot.src }))} disabled={busy} onReorder={reorder} onDelete={(id) => void removeSlot(id)} /> : null}
      </section>
      {error ? <p role="alert" className="mt-4 text-sm text-[#DE5757]">{error}</p> : null}
      <button type="button" disabled={busy} onClick={() => void save(true)} style={{ color: "#0E0E0E" }} className="mt-[30px] w-full rounded-full bg-white py-4 text-[16px] font-bold disabled:opacity-50">{busy ? "Guardando…" : "Confirmar"}</button>
    </main>
  </div>;
}

function FieldChevron() {
  return /* eslint-disable-next-line @next/next/no-img-element */ <img src="/settings-icons/Chevron_Right.svg" alt="" width={24} height={24} className="pointer-events-none absolute right-[10px] top-1/2 h-6 w-6 -translate-y-1/2" />;
}
