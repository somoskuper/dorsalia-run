"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";

type Publication = { id: string; title: string; gallery_name: string; race_event_id: string; status: string; published_at: string | null; activity_post_id: string | null };
type Photo = { id: string; publication_id: string; image_url: string; sort_order: number };
type Social = "instagram" | "facebook" | "tiktok" | "whatsapp" | "x";
const socials: { key: Social; label: string }[] = [
  { key: "instagram", label: "Instagram" }, { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" }, { key: "whatsapp", label: "WhatsApp" }, { key: "x", label: "X" },
];
const titles: Record<string, string> = { home: "Panel creador", publications: "Publicaciones y galerías", statistics: "Estadísticas", activity: "Actividad", profile: "Perfil y redes sociales", files: "Archivos", portfolio: "Administrar portafolio" };

export default function CreatorWorkspace({ section }: { section: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading, profile } = useAthleteAuth();
  const [ready, setReady] = useState(false);
  const [creator, setCreator] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [summary, setSummary] = useState({ views: 0, likes: 0, saves: 0 });
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [socialDraft, setSocialDraft] = useState("");
  const [comments, setComments] = useState<{ id: string; body: string; rating: number | null; created_at: string; publication_id: string }[]>([]);
  const [error, setError] = useState("");
  const network = socials.find(({ key }) => key === params.get("link")) || null;
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
        supabase.from("creator_publications").select("id,title,gallery_name,race_event_id,status,published_at,activity_post_id").eq("creator_id", user.id).order("updated_at", { ascending: false }),
        supabase.from("creator_portfolio_photos").select("photo_id").eq("creator_id", user.id).order("sort_order"),
        supabase.rpc("creator_summary_30d"),
      ]);
      if (!active) return;
      const nextPosts = (posts || []) as Publication[];
      setPublications(nextPosts);
      setPortfolio((selected || []).map((row) => row.photo_id));
      if (metrics) setSummary({ views: Number(metrics.views) || 0, likes: Number(metrics.likes) || 0, saves: Number(metrics.saves) || 0 });
      if (nextPosts.length) {
        const ids = nextPosts.map((post) => post.id);
        const [{ data: images }, { data: responses }] = await Promise.all([
          supabase.from("creator_photos").select("id,publication_id,image_url,sort_order").in("publication_id", ids).order("sort_order"),
          supabase.from("creator_publication_comments").select("id,body,rating,created_at,publication_id").in("publication_id", ids).order("created_at", { ascending: false }).limit(50),
        ]);
        if (active) { setPhotos((images || []) as Photo[]); setComments((responses || []) as typeof comments); }
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

  async function togglePortfolio(photoId: string) {
    if (!user) return;
    if (portfolio.includes(photoId)) {
      const { error: removeError } = await supabase.from("creator_portfolio_photos").delete().eq("creator_id", user.id).eq("photo_id", photoId);
      if (!removeError) setPortfolio((current) => current.filter((id) => id !== photoId)); else setError(removeError.message);
    } else {
      if (portfolio.length >= 4) { setError("Puedes destacar hasta cuatro fotos."); return; }
      const { error: addError } = await supabase.from("creator_portfolio_photos").insert({ creator_id: user.id, photo_id: photoId, sort_order: portfolio.length });
      if (!addError) setPortfolio((current) => [...current, photoId]); else setError(addError.message);
    }
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
    const paths = ownPhotos.map((photo) => { try { return new URL(photo.image_url).pathname.split("/public-image/")[1]; } catch { return ""; } }).filter(Boolean);
    if (paths.length) await supabase.storage.from("public-image").remove(paths);
    setPublications((current) => current.filter((item) => item.id !== post.id));
    setPhotos((current) => current.filter((item) => item.publication_id !== post.id));
  }

  if (!ready) return <div className="px-[15px] py-10 text-white/50">Cargando herramientas…</div>;
  if (!creator) return <div className="px-[15px]"><PageHeader fallbackHref="/settings" title="Panel creador" sticky /><p className="mt-10 text-white/60">Activa una cuenta de fotógrafo para entrar al panel.</p><Link href="/settings/account-type" className="mt-5 inline-block rounded-full bg-white px-5 py-3 font-semibold text-black">Tipo de cuenta</Link></div>;

  return <div className="px-[15px] pb-20"><PageHeader fallbackHref={section === "home" ? "/settings" : "/creator"} title={network ? "Perfil y redes sociales" : titles[section] || "Panel creador"} sticky />
    <main className="mx-auto w-full max-w-[640px]">
      {error ? <p role="alert" className="mt-4 text-sm text-[#DE5757]">{error}</p> : null}
      {section === "home" ? <>
        <div className="mt-5 flex items-start gap-3">{profile.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={profile.avatarUrl} alt="" className="h-[39px] w-[39px] rounded-full border-4 border-[#C5E500] object-cover" /> : null}<div className="min-w-0 flex-1"><h2 className="text-[20px] font-semibold">{profile.fullName}</h2><p className="text-[14px] text-white/50">Fotógrafo</p></div><span className="rounded-full bg-[#C5E500] px-[15px] py-[5px] text-[16px] font-semibold text-[#0E0E0E]">Fotógrafo</span></div>
        <h2 className="mt-10 text-[20px] font-semibold">Informes</h2><div className="mt-[10px] grid grid-cols-3 gap-[10px]">{[["Contenido", "publications"], ["Estadísticas", "statistics"], ["Actividad", "activity"]].map(([label, route]) => <Link key={route} href={`/creator/${route}`} className="rounded-[20px] bg-[#191919] p-4 text-center text-[14px]">{label}</Link>)}</div>
        <h2 className="mt-10 text-[20px] font-semibold">Resumen de los últimos 30 días</h2><Metrics summary={summary} />
        <div className="mt-10 space-y-3"><Link href="/creator/new" className="block rounded-full bg-white px-4 py-4 text-center font-bold text-black">Nueva publicación ＋</Link><Link href="/creator/portfolio" className="block rounded-full border border-white/20 px-4 py-4 text-center font-bold">Administrar portafolio</Link></div>
        <div className="mt-10"><SettingsSection title="Herramientas" links={[
          { label: "Publicaciones y galerías", icon: "edit.svg", href: "/creator/publications" },
          { label: "Comentarios e interacciones", icon: "reseñas.svg", href: "/creator/activity" },
          { label: "Estadísticas", icon: "account-business.svg", href: "/creator/statistics" },
          { label: "Perfil y redes sociales", icon: "account-type.svg", href: "/creator/profile" },
          { label: "Archivos", icon: "Money.svg", href: "/creator/files" },
        ]} /></div>
      </> : null}
      {section === "publications" ? <div className="mt-10"><Link href="/creator/new" className="block rounded-full bg-white px-5 py-3 text-center font-bold text-black">Nueva publicación</Link>{publications.length ? <div className="mt-6 space-y-3">{publications.map((post) => <div key={post.id} className="rounded-[20px] bg-[#191919] p-[15px]"><p className="font-semibold">{post.title || "Borrador sin título"}</p><p className="text-sm text-white/50">{post.gallery_name || "Galería sin nombre"} · {post.status === "published" ? "Publicada" : post.status === "archived" ? "Archivada" : "Borrador"}</p><div className="mt-3 flex gap-4 text-sm text-[#C5E500]"><Link href={`/creator/new?edit=${post.id}`}>Editar</Link>{post.status === "published" ? <button type="button" onClick={() => void archive(post)}>Archivar</button> : null}<button type="button" onClick={() => void remove(post)} className="text-[#DE5757]">Eliminar</button></div></div>)}</div> : <p className="mt-6 text-white/50">Aún no has creado galerías.</p>}</div> : null}
      {section === "statistics" ? <div className="mt-10"><h2 className="text-[20px] font-semibold">Últimos 30 días</h2><Metrics summary={summary} /><p className="mt-4 text-sm text-white/50">Vistas únicas por visitante y día, reacciones y guardados de tus publicaciones.</p></div> : null}
      {section === "activity" ? <div className="mt-10"><h2 className="text-[20px] font-semibold">Comentarios recientes</h2>{comments.length ? <div className="mt-3 space-y-3">{comments.map((comment) => <div key={comment.id} className="rounded-[20px] bg-[#191919] p-[15px]"><p className="text-sm text-white/50">{new Date(comment.created_at).toLocaleDateString("es-MX")}{comment.rating ? ` · ${comment.rating} estrellas` : ""}</p><p className="mt-2">{comment.body}</p></div>)}</div> : <p className="mt-3 text-white/50">Todavía no hay comentarios en tus galerías.</p>}</div> : null}
      {section === "profile" ? network ? <form onSubmit={(event) => void saveSocial(event)} className="mt-10"><h2 className="text-[20px] font-semibold">{network.label}</h2><input type="url" value={socialDraft} onChange={(event) => setSocialDraft(event.target.value)} placeholder="Agrega un link https://…" className="mt-[10px] h-[44px] w-full rounded-full bg-[#191919] px-[15px] text-[16px] outline-none" /><p className="mt-4 text-sm text-white/50">Este enlace aparecerá en tu perfil público.</p><button type="submit" className="mt-8 w-full rounded-full bg-white py-4 font-bold text-black">Guardar</button></form> : <div className="mt-10"><SettingsSection title="Agrega links en tu perfil" links={socials.map(({ key, label }) => ({ label: socialLinks[key] ? `${label} ✓` : label, icon: "account-connected.svg", href: `/creator/profile?link=${key}` }))} /></div> : null}
      {section === "files" ? <div className="mt-10"><h2 className="text-[20px] font-semibold">Fotografías subidas</h2>{photos.length ? <div className="mt-3 grid grid-cols-3 gap-[10px]">{photos.map((photo) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={photo.id} src={photo.image_url} alt="" className="aspect-square w-full rounded-[15px] object-cover" />)}</div> : <p className="mt-3 text-white/50">Tus fotografías aparecerán aquí al publicar una galería.</p>}</div> : null}
      {section === "portfolio" ? <div className="mt-10"><h2 className="text-[20px] font-semibold">Elige hasta cuatro fotografías</h2><p className="mt-2 text-sm text-white/50">Selecciona fotos de tus galerías publicadas. Quitarlas del portafolio no las elimina de su galería.</p>{photos.length ? <div className="mt-5 grid grid-cols-2 gap-[10px]">{photos.filter((photo) => publications.some((post) => post.id === photo.publication_id && post.status === "published")).map((photo) => <button key={photo.id} type="button" onClick={() => void togglePortfolio(photo.id)} className={`relative aspect-square overflow-hidden rounded-[20px] ${portfolio.includes(photo.id) ? "ring-4 ring-[#C5E500]" : ""}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.image_url} alt="" className="h-full w-full object-cover" />{portfolio.includes(photo.id) ? <span className="absolute right-3 top-3 rounded-full bg-[#C5E500] px-2 py-1 text-sm text-black">✓</span> : null}</button>)}</div> : <p className="mt-5 text-white/50">Publica una galería para elegir fotos.</p>}</div> : null}
    </main>
  </div>;
}

function Metrics({ summary }: { summary: { views: number; likes: number; saves: number } }) {
  return <div className="mt-[10px] grid grid-cols-3 gap-[10px]">{[[summary.views, "Vistas"], [summary.likes, "Me gusta"], [summary.saves, "Guardados"]].map(([value, label]) => <div key={label} className="rounded-[20px] bg-[#191919] p-4 text-center"><strong className="block text-[32px] font-bold">{value}</strong><span className="text-[13px] text-white/50">{label}</span></div>)}</div>;
}
