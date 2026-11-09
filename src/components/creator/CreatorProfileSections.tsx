"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CreatorPost = { id: string; title: string; race_event_id: string; published_at: string | null };
type Photo = { id: string; publication_id: string; image_url: string; sort_order: number };
type Event = { id: string; name: string; slug: string; public_subdomain: string | null; cover_image_url: string | null };

export default function CreatorProfileSections({ userId, ownProfile }: { userId: string; ownProfile: boolean }) {
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [featured, setFeatured] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void (async () => {
      const [{ data: creator }, { data: publications }, { data: portfolio }] = await Promise.all([
        supabase.from("creator_profiles").select("social_links").eq("user_id", userId).maybeSingle(),
        supabase.from("creator_publications").select("id,title,race_event_id,published_at").eq("creator_id", userId).eq("status", "published").order("published_at", { ascending: false }).limit(12),
        supabase.from("creator_portfolio_photos").select("photo_id").eq("creator_id", userId).order("sort_order").limit(4),
      ]);
      const nextPosts = (publications || []) as CreatorPost[];
      if (!active) return;
      setSocials((creator?.social_links || {}) as Record<string, string>);
      setPosts(nextPosts); setFeatured((portfolio || []).map((item) => item.photo_id));
      const featuredIds = (portfolio || []).map((item) => item.photo_id);
      const [{ data: images }, { data: featuredImages }, { data: races }] = await Promise.all([
        nextPosts.length ? supabase.from("creator_photos").select("id,publication_id,image_url,sort_order").in("publication_id", nextPosts.map((post) => post.id)).order("sort_order") : Promise.resolve({ data: [] }),
        featuredIds.length ? supabase.from("creator_photos").select("id,publication_id,image_url,sort_order").in("id", featuredIds) : Promise.resolve({ data: [] }),
        nextPosts.length ? supabase.from("race_events").select("id,name,slug,public_subdomain,cover_image_url").in("id", [...new Set(nextPosts.map((post) => post.race_event_id))]) : Promise.resolve({ data: [] }),
      ]);
      if (active) { setPhotos([...new Map([...(images || []), ...(featuredImages || [])].map((photo) => [photo.id, photo])).values()] as Photo[]); setEvents((races || []) as Event[]); }
    })();
    return () => { active = false; };
  }, [userId]);

  const portfolioPhotos = featured.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is Photo => Boolean(photo));
  const socialEntries = Object.entries(socials).filter((entry) => typeof entry[1] === "string" && entry[1].startsWith("https://"));
  if (!ownProfile && !posts.length && !socialEntries.length) return null;
  return <div className="mt-5">
    {ownProfile ? <Link href="/creator" className="block w-full rounded-full bg-white px-4 py-4 text-center text-[16px] font-bold text-[#070707]" style={{ color: "#070707" }}>Panel creador</Link> : null}
    {socialEntries.length ? <div className="mt-5 flex justify-center gap-5">{socialEntries.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="text-[14px] font-semibold capitalize text-white underline underline-offset-4">{name}</a>)}</div> : null}
    {(portfolioPhotos.length || ownProfile) ? <section className="mt-10"><div className="flex items-center justify-between"><h2 className="text-[20px] font-semibold">Galería</h2><Link href={ownProfile ? "/creator/portfolio" : `/perfil/${userId}/galeria`} className="text-white/50" aria-label="Ver galería">›</Link></div>{portfolioPhotos.length ? <div className="mt-[10px] grid grid-cols-2 gap-[10px]">{portfolioPhotos.map((photo) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={photo.id} src={photo.image_url} alt="Fotografía destacada" className="aspect-square w-full rounded-[20px] object-cover" />)}</div> : <p className="mt-3 text-sm text-white/50">Elige fotos para mostrar en tu portafolio.</p>}{ownProfile ? <Link href="/creator/portfolio" className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#070707]" style={{ color: "#070707" }}>Editar</Link> : null}</section> : null}
    {posts.length ? <section className="mt-10"><h2 className="text-[20px] font-semibold">Fotos de eventos</h2><div className="mt-[10px] flex snap-x gap-4 overflow-x-auto pb-3">{posts.map((post) => { const event = events.find((race) => race.id === post.race_event_id); const photo = photos.find((image) => image.publication_id === post.id); return <Link key={post.id} href={`/fotos/${encodeURIComponent(event?.public_subdomain || event?.slug || post.race_event_id)}?publicacion=${post.id}`} className="w-[250px] shrink-0 snap-start">{photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo.image_url} alt="" className="aspect-square w-full rounded-[20px] object-cover" /> : null}<strong className="mt-2 block line-clamp-2 text-[16px]">{post.title}</strong><span className="mt-1 text-sm text-white/50">Ver fotos ›</span></Link>; })}</div></section> : null}
  </div>;
}
