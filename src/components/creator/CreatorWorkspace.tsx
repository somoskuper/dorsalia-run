"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import GlassIconButton from "@/components/account/GlassIconButton";
import PhotoUploadBar from "@/components/media/PhotoUploadBar";
import PostMenu from "@/components/activity/PostMenu";
import ReviewPost from "@/components/reviews/ReviewPost";
import SettingsSection from "@/components/settings/SettingsSection";
import CollectionShareSheet from "@/components/creator/CollectionShareSheet";
import CreatorListRow, { CreatorList } from "@/components/creator/CreatorListRow";
import PhotoOrderGrid from "@/components/creator/PhotoOrderGrid";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { fetchActivityFeed, type ActivityItem } from "@/lib/activity";
import { detachPortfolioActivity, isPortfolioName } from "@/lib/creatorPortfolio";
import { deleteCreatorPhoto, uploadCreatorPhoto } from "@/lib/creatorUpload";
import { portfolioCardPath } from "@/lib/photoDelivery";
import { raceDayHasPassed } from "@/lib/races";
import { createClient } from "@/lib/supabase/client";
import { Bone, PhotoGridSkeleton } from "@/components/ui/Skeleton";

type Publication = { id: string; title: string; description: string; gallery_name: string; race_event_id: string; status: string; published_at: string | null; updated_at?: string | null; activity_post_id: string | null };
type RaceRef = { id: string; name: string; slug: string; public_subdomain: string | null; event_date?: string | null; event_end_date?: string | null };
const COLLECTION_LIMIT = 30;

function raceHasEnded(race?: RaceRef) {
  if (!race) return false;
  const end = Date.parse(String(race.event_end_date || ""));
  return (Number.isFinite(end) && end <= Date.now()) || raceDayHasPassed(race);
}

function shortDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}
type Photo = { id: string; publication_id: string; image_url: string; storage_path?: string; sort_order: number };
type Social = "instagram" | "facebook" | "tiktok" | "whatsapp" | "x";
const socials: { key: Social; label: string }[] = [
  { key: "instagram", label: "Instagram" }, { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" }, { key: "whatsapp", label: "WhatsApp" }, { key: "x", label: "X" },
];
const titles: Record<string, string> = { home: "Panel creador", publications: "Publicaciones y galerías", statistics: "Estadísticas", activity: "Actividad", profile: "Perfil y redes sociales", files: "Archivos", portfolio: "Portafolio" };

export default function CreatorWorkspace({ section }: { section: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, profile } = useAthleteAuth();
  const [ready, setReady] = useState(false);
  const [creator, setCreator] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [races, setRaces] = useState<RaceRef[]>([]);
  const [feedPosts, setFeedPosts] = useState<ActivityItem[]>([]);
  const [handle, setHandle] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [summary, setSummary] = useState({ views: 0, likes: 0, saves: 0 });
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [socialDraft, setSocialDraft] = useState("");
  const [comments, setComments] = useState<{ id: string; body: string; rating: number | null; created_at: string; publication_id: string }[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileSearch, setFileSearch] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState("");
  const network = socials.find(({ key }) => key === params.get("link")) || null;
  const collectionId = section === "files" ? params.get("coleccion") : null;
  const supabase = createClient();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(`/auth?next=${encodeURIComponent(section === "home" ? "/creator" : `/creator/${section}`)}`); return; }
    let active = true;
    void (async () => {
      const { data: creatorRow } = await supabase.from("creator_profiles").select("creator_type, is_active, social_links").eq("user_id", user.id).maybeSingle();
      if (!active) return;
      if (!creatorRow?.is_active || creatorRow.creator_type !== "photographer") { setReady(true); return; }
      setCreator(true); setSocialLinks((creatorRow.social_links || {}) as Record<string, string>);
      const [{ data: posts }, { data: selected }, { data: metrics }] = await Promise.all([
        supabase.from("creator_publications").select("id,title,description,gallery_name,race_event_id,status,published_at,updated_at,activity_post_id").eq("creator_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("creator_portfolio_photos").select("photo_id").eq("creator_id", user.id).order("sort_order"),
        supabase.rpc("creator_summary_30d"),
      ]);
      if (!active) return;
      const nextPosts = (posts || []) as Publication[];
      setPublications(nextPosts);
      for (const post of nextPosts) {
        if ((isPortfolioName(post.gallery_name) || isPortfolioName(post.title)) && post.activity_post_id) void detachPortfolioActivity(supabase, user.id, post.id, post.activity_post_id);
      }
      setPortfolio((selected || []).map((row) => row.photo_id));
      if (metrics) setSummary({ views: Number(metrics.views) || 0, likes: Number(metrics.likes) || 0, saves: Number(metrics.saves) || 0 });
      if (nextPosts.length) {
        const ids = nextPosts.map((post) => post.id);
        const [{ data: images }, { data: responses }] = await Promise.all([
          supabase.from("creator_photos").select("id,publication_id,image_url,storage_path,sort_order").in("publication_id", ids).order("sort_order"),
          supabase.from("creator_publication_comments").select("id,body,rating,created_at,publication_id").in("publication_id", ids).order("created_at", { ascending: false }).limit(50),
        ]);
        if (active) { setPhotos((images || []) as Photo[]); setComments((responses || []) as typeof comments); }
      }
      if (section === "publications" || section === "files") {
        const visible = nextPosts.filter((post) => !isPortfolioName(post.title) && !isPortfolioName(post.gallery_name));
        const raceIds = [...new Set(visible.map((post) => post.race_event_id))];
        const [{ data: raceRows }, { data: athlete }, feed] = await Promise.all([
          raceIds.length ? supabase.from("race_events").select("id,name,slug,public_subdomain,event_date,event_end_date").in("id", raceIds) : Promise.resolve({ data: [] as RaceRef[] }),
          supabase.from("athlete_profiles").select("username").eq("user_id", user.id).maybeSingle(),
          fetchActivityFeed(user.id, 100).catch(() => [] as ActivityItem[]),
        ]);
        if (!active) return;
        setRaces((raceRows || []) as RaceRef[]);
        setHandle(athlete?.username || null);
        setFeedPosts(feed.filter((item) => item.post_type === "creator"));
      }
      setReady(true);
    })();
    return () => { active = false; };
  }, [user?.id, loading, section, router]);

  useEffect(() => { if (network) setSocialDraft(socialLinks[network.key] || ""); }, [network?.key, socialLinks]);

  async function saveSocial(event: React.FormEvent) {
    event.preventDefault(); if (!user || !network) return;
    const value = socialDraft.trim();
    if (value) { try { const url = new URL(value); if (url.protocol !== "https:") throw new Error(); } catch { setError("Usa una URL completa que comience con https://"); return; } }
    const next = { ...socialLinks, [network.key]: value };
    const { error: saveError } = await supabase.from("creator_profiles").update({ social_links: next, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    if (saveError) { setError(saveError.message); return; }
    setSocialLinks(next); setError(""); router.push("/creator/profile");
  }

  async function uploadPortfolio(incoming: File[]) {
    if (!user || !incoming.length || uploading) return;
    const room = 4 - portfolio.length;
    if (room <= 0) { setError("Puedes destacar hasta cuatro fotos."); return; }
    const batch = incoming.slice(0, room);
    setUploading(true); setPendingUploads(batch.length); setUploadProgress(0); setError("");
    let nextOrder = portfolio.length;
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
      let publication = publications.find((item) => isPortfolioName(item.gallery_name) || isPortfolioName(item.title));
      if (!publication) {
        const { data: events, error: eventError } = await supabase.rpc("public_creator_event_search", { p_query: "", p_limit: 1 });
        const raceId = (events as { id: string }[] | null)?.[0]?.id;
        if (eventError || !raceId) throw new Error("No se pudo preparar el portafolio.");
        const { data, error: insertError } = await supabase.from("creator_publications").insert({ creator_id: user.id, race_event_id: raceId, title: "Portafolio", gallery_name: "Portafolio", description: "" }).select("id").single();
        if (insertError || !data) throw insertError || new Error("No se pudo preparar el portafolio.");
        const created: Publication = { id: data.id, title: "Portafolio", description: "", gallery_name: "Portafolio", race_event_id: raceId, status: "draft", published_at: null, activity_post_id: null };
        publication = created;
        setPublications((current) => [created, ...current]);
      }
      let published = publication.status === "published";
      for (let index = 0; index < batch.length; index += 1) {
        const newPhoto = await uploadCreatorPhoto({ supabase, userId: user.id, publicationId: publication.id, file: batch[index], token, sortOrder: nextOrder, onRatio: (ratio) => setUploadProgress((index + ratio) / batch.length) });
        if (!published) {
          const { error: publishError } = await supabase.rpc("publish_creator_publication", { p_publication_id: publication.id });
          if (publishError) throw publishError;
          published = true;
          const { data: publishedRow } = await supabase.from("creator_publications").select("activity_post_id").eq("id", publication.id).eq("creator_id", user.id).maybeSingle();
          await detachPortfolioActivity(supabase, user.id, publication.id, publishedRow?.activity_post_id || null);
          setPublications((current) => current.map((item) => item.id === publication.id ? { ...item, status: "published", activity_post_id: null } : item));
        }
        const { error: featureError } = await supabase.from("creator_portfolio_photos").insert({ creator_id: user.id, photo_id: newPhoto.id, sort_order: nextOrder });
        if (featureError) throw featureError;
        setPhotos((current) => [...current, newPhoto as Photo]);
        setPortfolio((current) => [...current, newPhoto.id]);
        nextOrder += 1;
        setPendingUploads(batch.length - index - 1);
        setUploadProgress((index + 1) / batch.length);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo subir la foto."); }
    finally { setUploading(false); setPendingUploads(0); setUploadProgress(0); }
  }

  async function deletePortfolioPhoto(photo: Photo) {
    if (!user || uploading) return;
    setError("");
    const { error: featureError } = await supabase.from("creator_portfolio_photos").delete().eq("creator_id", user.id).eq("photo_id", photo.id);
    if (featureError) { setError(featureError.message); return; }
    setPortfolio((current) => current.filter((id) => id !== photo.id));
    try { await deleteCreatorPhoto(supabase, user.id, photo); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo eliminar la foto."); return; }
    setPhotos((current) => current.filter((item) => item.id !== photo.id));
  }

  function collectionPhotos(publicationId: string) {
    return photos.filter((photo) => photo.publication_id === publicationId).sort((a, b) => a.sort_order - b.sort_order);
  }

  async function uploadToCollection(post: Publication, incoming: File[]) {
    if (!user || !incoming.length || uploading) return;
    const existing = collectionPhotos(post.id);
    const room = COLLECTION_LIMIT - existing.length;
    if (room <= 0) { setError(`Cada colección admite hasta ${COLLECTION_LIMIT} fotos.`); return; }
    const batch = incoming.slice(0, room);
    setUploading(true); setPendingUploads(batch.length); setUploadProgress(0); setError("");
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Tu sesión expiró. Inicia sesión de nuevo.");
      let nextOrder = existing.length;
      for (let index = 0; index < batch.length; index += 1) {
        const newPhoto = await uploadCreatorPhoto({ supabase, userId: user.id, publicationId: post.id, file: batch[index], token, sortOrder: nextOrder, onRatio: (ratio) => setUploadProgress((index + ratio) / batch.length) });
        setPhotos((current) => [...current, newPhoto as Photo]);
        nextOrder += 1;
        setPendingUploads(batch.length - index - 1);
      }
      await supabase.from("creator_publications").update({ updated_at: new Date().toISOString() }).eq("id", post.id).eq("creator_id", user.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo subir la foto."); }
    finally { setUploading(false); setPendingUploads(0); setUploadProgress(0); }
  }

  async function deleteCollectionPhoto(post: Publication, photo: Photo) {
    if (!user || uploading) return;
    const current = collectionPhotos(post.id);
    if (post.status === "published" && current.length <= 1) { setError("Una colección pública debe conservar al menos una foto."); return; }
    setError("");
    try { await deleteCreatorPhoto(supabase, user.id, photo); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo eliminar la foto."); return; }
    setPortfolio((ids) => ids.filter((id) => id !== photo.id));
    const remaining = current.filter((item) => item.id !== photo.id).map((item, index) => ({ ...item, sort_order: index }));
    setPhotos((all) => [...all.filter((item) => item.publication_id !== post.id), ...remaining]);
    void persistCollectionOrder(remaining);
  }

  function reorderCollection(publicationId: string, from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setPhotos((all) => {
      const ordered = all.filter((photo) => photo.publication_id === publicationId).sort((a, b) => a.sort_order - b.sort_order);
      if (from >= ordered.length || to >= ordered.length) return all;
      const [moved] = ordered.splice(from, 1);
      ordered.splice(to, 0, moved);
      return [...all.filter((photo) => photo.publication_id !== publicationId), ...ordered.map((photo, index) => ({ ...photo, sort_order: index }))];
    });
  }

  async function persistCollectionOrder(ordered: Photo[]) {
    if (!user) return;
    const results = await Promise.all(ordered.map((photo, index) => supabase.from("creator_photos").update({ sort_order: index }).eq("id", photo.id).eq("creator_id", user.id)));
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(failed.error.message);
  }

  async function setCollectionPublic(post: Publication, next: boolean) {
    if (!user || shareBusy) return;
    setShareBusy(true); setShareError("");
    try {
      if (next) {
        if (!raceHasEnded(races.find((race) => race.id === post.race_event_id))) throw new Error("Solo puedes publicar fotos de eventos que ya finalizaron.");
        if (!collectionPhotos(post.id).length) throw new Error("Sube al menos una foto antes de hacerla pública.");
        const { error: publishError } = await supabase.rpc("publish_creator_publication", { p_publication_id: post.id });
        if (publishError) throw publishError;
        const { data: row } = await supabase.from("creator_publications").select("status,published_at,activity_post_id").eq("id", post.id).eq("creator_id", user.id).maybeSingle();
        if (row?.activity_post_id) await supabase.from("activity_posts").update({ body: (post.description || "").trim() }).eq("id", row.activity_post_id).eq("user_id", user.id);
        setPublications((current) => current.map((item) => item.id === post.id ? { ...item, status: row?.status || "published", published_at: row?.published_at || item.published_at, activity_post_id: row?.activity_post_id || item.activity_post_id } : item));
      } else {
        const { error: archiveError } = await supabase.rpc("archive_creator_publication", { p_publication_id: post.id });
        if (archiveError) throw archiveError;
        setPublications((current) => current.map((item) => item.id === post.id ? { ...item, status: "archived" } : item));
      }
    } catch (cause) {
      setShareError(cause instanceof Error ? cause.message : "No se pudo cambiar la visibilidad.");
    } finally { setShareBusy(false); }
  }

  function reorderPortfolio(from: number, to: number) {
    if (from === to || from < 0 || to < 0) return;
    setPortfolio((current) => {
      if (from >= current.length || to >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function savePortfolio(event: React.FormEvent) {
    event.preventDefault();
    if (!user || uploading) return;
    const results = await Promise.all(portfolio.map((photoId, index) => supabase.from("creator_portfolio_photos").update({ sort_order: index }).eq("creator_id", user.id).eq("photo_id", photoId)));
    const failed = results.find((result) => result.error);
    if (failed?.error) { setError(failed.error.message); return; }
    setError("");
    if (window.history.length > 1) router.back(); else router.push("/creator");
  }

  async function archive(post: Publication) {
    if (!window.confirm("¿Archivar esta publicación? Dejará de mostrarse al público.")) return;
    const { error: archiveError } = await supabase.rpc("archive_creator_publication", { p_publication_id: post.id });
    if (archiveError) setError(archiveError.message); else setPublications((current) => current.map((item) => item.id === post.id ? { ...item, status: "archived" } : item));
  }

  async function remove(post: Publication) {
    if (!user || !window.confirm("¿Eliminar esta galería y sus fotos? Esta acción no se puede deshacer.")) return;
    const ownPhotos = photos.filter((photo) => photo.publication_id === post.id);
    const { error: deleteError } = await supabase.from("creator_publications").delete().eq("id", post.id).eq("creator_id", user.id);
    if (deleteError) { setError(deleteError.message); return; }
    if (post.activity_post_id) await supabase.from("activity_posts").delete().eq("id", post.activity_post_id).eq("user_id", user.id);
    const paths = ownPhotos.flatMap((photo) => { try { const path = decodeURIComponent(new URL(photo.image_url).pathname.split("/public-image/")[1] || ""); const card = portfolioCardPath(path); return card ? [path, card] : path ? [path] : []; } catch { return []; } });
    if (paths.length) await supabase.storage.from("public-image").remove(paths);
    setPublications((current) => current.filter((item) => item.id !== post.id));
    setPhotos((current) => current.filter((item) => item.publication_id !== post.id));
  }

  if (!ready) return <div className="mx-auto max-w-5xl px-[15px] py-6"><Bone className="h-11 w-11 rounded-full" /><Bone className="mt-6" style={{ width: 220, height: 32, borderRadius: 10 }} /><div className="mt-8"><PhotoGridSkeleton count={6} /></div></div>;
  if (!creator) return <div className="px-[15px]"><PageHeader fallbackHref="/settings" title="Panel creador" sticky /><p className="mt-10 text-white/60">Activa una cuenta de fotógrafo para entrar al panel.</p><Link href="/settings/account-type" className="mt-5 inline-block rounded-full bg-white px-5 py-3 font-semibold text-black">Tipo de cuenta</Link></div>;

  const portfolioPhotos = portfolio.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is Photo => Boolean(photo));
  const galleryPosts = publications.filter((post) => !isPortfolioName(post.title) && !isPortfolioName(post.gallery_name));
  const collection = collectionId ? galleryPosts.find((post) => post.id === collectionId) || null : null;
  const collectionItems = collection ? collectionPhotos(collection.id) : [];
  const collectionRace = collection ? races.find((race) => race.id === collection.race_event_id) : undefined;
  const collectionSlug = collectionRace?.public_subdomain || collectionRace?.slug || "";
  const collectionLink = collection && collectionSlug && typeof window !== "undefined" ? `${window.location.origin}/fotos/${encodeURIComponent(collectionSlug.toLowerCase())}/${collection.id}` : null;
  const searchTerm = fileSearch.trim().toLowerCase();
  const visibleCollections = searchTerm ? galleryPosts.filter((post) => `${post.gallery_name} ${post.title}`.toLowerCase().includes(searchTerm)) : galleryPosts;
  const headerTitle = network ? "Perfil y redes sociales" : collection ? collection.gallery_name || collection.title : titles[section] || "Panel creador";
  const collectionMenu = collection ? <GlassIconButton aria-label="Opciones de la colección" onClick={() => { setShareError(""); setShareOpen(true); }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" aria-hidden><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>
  </GlassIconButton> : undefined;
  return <div className="px-[15px] pb-20"><PageHeader fallbackHref={section === "home" ? "/settings" : collectionId ? "/creator/files" : "/creator"} title={headerTitle} sticky saveFormId={section === "portfolio" ? "portfolio-done" : undefined} saveDisabled={uploading} rightAction={collectionMenu} />
    <main className="mx-auto w-full max-w-[640px]">
      {error ? <p role="alert" className="mt-4 text-sm text-[#DE5757]">{error}</p> : null}
      {section === "home" ? <>
        <div className="mt-5 flex items-start gap-3">{profile.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatarUrl} alt="" className="h-[39px] w-[39px] rounded-full border-4 border-[#C5E500] object-cover" /> : null}<div className="min-w-0 flex-1"><h2 className="text-[20px] font-semibold leading-6">{profile.fullName}</h2><p className="text-[14px] text-white/50">Fotógrafo</p></div><span className="inline-flex items-center gap-1 rounded-full bg-[#C5E500] px-[15px] py-[5px] text-[16px] font-semibold text-[#0E0E0E]">Fotógrafo{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/creador-verificado.svg" alt="" width={16} height={16} className="h-4 w-4" /></span></div>
        <h2 className="mt-10 text-[20px] font-semibold leading-6">Informes</h2>
        <div className="mt-[10px] grid grid-cols-3 gap-[10px]">{[{ label: "Contenido", href: "/creator/publications", icon: "newgalery.svg" }, { label: "Estadísticas", href: "/creator/statistics", icon: "account-business.svg" }, { label: "Actividad", href: "/creator/activity", icon: "reseñas.svg" }].map((item) => <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 rounded-[20px] bg-[#191919] px-2 py-4 text-center text-[13px] text-white/70">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/settings-icons/${item.icon}`} alt="" width={34} height={34} className="h-[34px] w-[34px]" />{item.label}</Link>)}</div>
        <h2 className="mt-10 text-[20px] font-semibold leading-6">Resumen de los últimos 30 días</h2><Metrics summary={summary} />
        <div className="mt-10 space-y-3"><Link href="/creator/new" style={{ color: "#0E0E0E" }} className="flex items-center justify-center gap-2 rounded-full bg-white py-4 text-[16px] font-bold">Nueva publicación{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/add-square.svg" alt="" width={19} height={19} className="h-[19px] w-[19px]" /></Link><Link href="/creator/portfolio" className="block rounded-full border border-white/20 px-4 py-4 text-center text-[16px] font-bold">Administrar portafolio</Link></div>
        <div className="mt-10"><SettingsSection title="Herramientas" links={[
          { label: "Publicaciones y galerías", icon: "edit.svg", href: "/creator/publications" },
          { label: "Comentarios e interacciones", icon: "reseñas.svg", href: "/creator/activity" },
          { label: "Estadísticas", icon: "account-business.svg", href: "/creator/statistics" },
          { label: "Perfil y redes sociales", icon: "account-type.svg", href: "/creator/profile" },
          { label: "Archivos", icon: "Files.svg", href: "/creator/files" },
        ]} /></div>
      </> : null}
      {section === "publications" ? <div className="mt-10">
        <Link href="/creator/new" style={{ color: "#0E0E0E" }} className="flex items-center justify-center gap-2 rounded-full bg-white py-4 text-[16px] font-bold">Nueva publicación{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/add-square.svg" alt="" width={19} height={19} className="h-[19px] w-[19px]" /></Link>
        {galleryPosts.length ? <div className="-mx-[15px] mt-8">{galleryPosts.map((post) => {
          const activity = feedPosts.find((item) => item.creator_publication_id === post.id);
          const race = races.find((item) => item.id === post.race_event_id);
          const slug = race?.public_subdomain || race?.slug || activity?.event_slug || "";
          const username = activity?.username || handle;
          return <ReviewPost
            key={post.id}
            authorName={activity?.display_name || profile.fullName}
            username={username}
            avatarUrl={activity?.avatar_url || profile.avatarUrl}
            profileHref={username ? `/perfil/${username}` : undefined}
            rating={0}
            comment={post.description || ""}
            photos={photos.filter((photo) => photo.publication_id === post.id).sort((a, b) => a.sort_order - b.sort_order)}
            eventHref={slug ? `/fotos/${encodeURIComponent(slug)}/${post.id}` : undefined}
            eventCoverUrl={activity?.event_cover_url}
            updatedAt={post.published_at || post.updated_at || activity?.created_at || new Date(0).toISOString()}
            postId={post.activity_post_id || activity?.id}
            postHref={post.activity_post_id || activity?.id ? `/creator/publications/${post.activity_post_id || activity?.id}` : undefined}
            mediaOpensPost
            verified
            likeCount={Number(activity?.like_count) || 0}
            liked={Boolean(activity?.liked)}
            commentCount={Number(activity?.comment_count) || 0}
            action={<PostMenu postId={post.activity_post_id || activity?.id} onEdit={() => router.push(`/creator/new?edit=${post.id}`)} onArchive={post.status === "published" ? () => void archive(post) : undefined} onDelete={() => void remove(post)} />}
            variant="feed"
            mediaAspect="portrait"
          />;
        })}</div> : <p className="mt-6 text-white/50">Aún no has creado galerías.</p>}
      </div> : null}
      {section === "statistics" ? <div className="mt-10"><h2 className="text-[20px] font-semibold">Últimos 30 días</h2><Metrics summary={summary} /><p className="mt-4 text-sm text-white/50">Vistas únicas por visitante y día, reacciones y guardados de tus publicaciones.</p></div> : null}
      {section === "activity" ? <div className="mt-10"><h2 className="text-[20px] font-semibold">Comentarios recientes</h2>{comments.length ? <div className="mt-3 space-y-3">{comments.map((comment) => <div key={comment.id} className="rounded-[20px] bg-[#191919] p-[15px]"><p className="text-sm text-white/50">{new Date(comment.created_at).toLocaleDateString("es-MX")}{comment.rating ? ` · ${comment.rating} estrellas` : ""}</p><p className="mt-2">{comment.body}</p></div>)}</div> : <p className="mt-3 text-white/50">Todavía no hay comentarios en tus galerías.</p>}</div> : null}
      {section === "profile" ? network ? <form onSubmit={(event) => void saveSocial(event)} className="mt-10"><h2 className="text-[20px] font-semibold">{network.label}</h2><input type="url" value={socialDraft} onChange={(event) => setSocialDraft(event.target.value)} placeholder="Agrega un link https://…" className="mt-[10px] h-[44px] w-full rounded-full bg-[#191919] px-[15px] text-[16px] outline-none" /><p className="mt-4 text-sm text-white/50">Este enlace aparecerá en tu perfil público.</p><button type="submit" className="mt-8 w-full rounded-full bg-white py-4 font-bold text-black">Guardar</button></form> : <div className="mt-10"><SettingsSection title="Agrega links en tu perfil" links={socials.map(({ key, label }) => ({ label: socialLinks[key] ? `${label} ✓` : label, iconSrc: `/social-media/${key}.svg`, href: `/creator/profile?link=${key}` }))} /></div> : null}
      {section === "files" && !collection ? <div className="mt-10">
        <input value={fileSearch} onChange={(event) => setFileSearch(event.target.value)} placeholder="Buscar" aria-label="Buscar colecciones" className="h-[44px] w-full rounded-[20px] bg-[#191919] px-[15px] text-[16px] outline-none placeholder:text-white/50" />
        <h2 className="mt-[30px] text-[20px] font-semibold leading-6">Colecciones</h2>
        {visibleCollections.length ? <CreatorList>{visibleCollections.map((post) => {
          const race = races.find((item) => item.id === post.race_event_id);
          const count = collectionPhotos(post.id).length;
          const details = [shortDate(race?.event_date), `${count} foto${count === 1 ? "" : "s"}`, post.status === "published" ? "" : "Privada"].filter(Boolean).join(" · ");
          return <CreatorListRow key={post.id} href={`/creator/files?coleccion=${post.id}`} media={/* eslint-disable-next-line @next/next/no-img-element */ <img src="/settings-icons/Files.svg" alt="" width={30} height={30} className="h-[30px] w-[30px] shrink-0" />} title={post.gallery_name || post.title} subtitle={details} />;
        })}</CreatorList> : <p className="mt-4 text-sm leading-5 text-white/50">{fileSearch.trim() ? "No hay colecciones con ese nombre." : "Cada publicación crea su carpeta con el nombre de su galería."}</p>}
      </div> : null}
      {section === "files" && collection ? <div className="mt-10">
        <h2 className="text-[24px] font-bold leading-tight">Agrega fotos a la colección</h2>
        <p className="mt-2 text-sm leading-5 text-white/50">Los cambios se aplican también a la publicación original. Hasta {COLLECTION_LIMIT} fotos.</p>
        <div className="mt-8"><PhotoUploadBar disabled={uploading} onClick={() => fileRef.current?.click()} /></div>
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(event) => { const list = Array.from(event.target.files || []); event.target.value = ""; void uploadToCollection(collection, list); }} />
        {collectionItems.length || pendingUploads ? <div>
          <h2 className="mt-10 text-[20px] font-semibold">Ordenar</h2>
          <PhotoOrderGrid photos={collectionItems} pending={pendingUploads} progress={uploadProgress} disabled={uploading} onReorder={(from, to) => reorderCollection(collection.id, from, to)} onDragEnd={() => void persistCollectionOrder(collectionPhotos(collection.id))} onDelete={(photo) => void deleteCollectionPhoto(collection, photo)} />
        </div> : null}
        <CollectionShareSheet open={shareOpen} name={collection.gallery_name || collection.title} isPublic={collection.status === "published"} link={collectionLink} busy={shareBusy} error={shareError} onTogglePublic={(next) => void setCollectionPublic(collection, next)} onClose={() => setShareOpen(false)} />
      </div> : null}
      {section === "files" && collectionId && !collection ? <p className="mt-10 text-white/50">No se encontró esta colección.</p> : null}
      {section === "portfolio" ? <form id="portfolio-done" onSubmit={(event) => void savePortfolio(event)} className="mt-10">
        <h2 className="text-[24px] font-bold leading-tight">Agrega fotos a tu perfil</h2>
        <div className="mt-8"><PhotoUploadBar disabled={uploading} onClick={() => fileRef.current?.click()} /></div>
        <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(event) => { const list = Array.from(event.target.files || []); event.target.value = ""; void uploadPortfolio(list); }} />
        {portfolioPhotos.length || pendingUploads ? <div>
          <h2 className="mt-10 text-[20px] font-semibold">Ordenar</h2>
          <PhotoOrderGrid photos={portfolioPhotos} pending={pendingUploads} progress={uploadProgress} disabled={uploading} onReorder={reorderPortfolio} onDelete={(photo) => void deletePortfolioPhoto(photo)} />
        </div> : null}
      </form> : null}
    </main>
  </div>;
}

function Metrics({ summary }: { summary: { views: number; likes: number; saves: number } }) {
  return <div className="mt-[10px] grid grid-cols-3 gap-[10px]">{[[summary.views, "Vistas"], [summary.likes, "Me gusta"], [summary.saves, "Guardados"]].map(([value, label]) => <div key={label} className="rounded-[20px] bg-[#191919] p-4 text-center"><strong className="block text-[32px] font-bold">{value}</strong><span className="text-[13px] text-white/50">{label}</span></div>)}</div>;
}
