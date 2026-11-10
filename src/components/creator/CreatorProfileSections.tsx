"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CardImage from "@/components/media/CardImage";
import CreatorSocialLinks from "@/components/creator/CreatorSocialLinks";
import PhotoViewer from "@/components/media/PhotoViewer";
import { detachPortfolioActivity, isPortfolioName } from "@/lib/creatorPortfolio";
import { createClient } from "@/lib/supabase/client";
import { ProfileGallerySkeleton } from "@/components/ui/Skeleton";

type CreatorPost = { id: string; title: string; gallery_name: string; race_event_id: string; published_at: string | null; activity_post_id: string | null };
type Photo = { id: string; publication_id: string; image_url: string; sort_order: number };
type Event = { id: string; name: string; slug: string; public_subdomain: string | null; cover_image_url: string | null };

export default function CreatorProfileSections({ userId, ownProfile }: { userId: string; ownProfile: boolean }) {
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [featured, setFeatured] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    void (async () => {
      try {
      const [{ data: creator }, { data: publications }, { data: portfolio }] = await Promise.all([
        supabase.from("creator_profiles").select("social_links").eq("user_id", userId).maybeSingle(),
        supabase.from("creator_publications").select("id,title,gallery_name,race_event_id,published_at,activity_post_id").eq("creator_id", userId).eq("status", "published").order("published_at", { ascending: false }).limit(12),
        supabase.from("creator_portfolio_photos").select("photo_id").eq("creator_id", userId).order("sort_order").limit(4),
      ]);
      const nextPosts = ((publications || []) as CreatorPost[]).filter((post) => !isPortfolioName(post.title) && !isPortfolioName(post.gallery_name));
      if (!active) return;
      setSocials((creator?.social_links || {}) as Record<string, string>);
      setPosts(nextPosts); setFeatured((portfolio || []).map((item) => item.photo_id));
      if (ownProfile) {
        for (const post of (publications || []) as CreatorPost[]) {
          if ((isPortfolioName(post.title) || isPortfolioName(post.gallery_name)) && post.activity_post_id) void detachPortfolioActivity(supabase, userId, post.id, post.activity_post_id);
        }
      }
      const featuredIds = (portfolio || []).map((item) => item.photo_id);
      const [{ data: images }, { data: featuredImages }, { data: races }] = await Promise.all([
        nextPosts.length ? supabase.from("creator_photos").select("id,publication_id,image_url,sort_order").in("publication_id", nextPosts.map((post) => post.id)).order("sort_order") : Promise.resolve({ data: [] }),
        featuredIds.length ? supabase.from("creator_photos").select("id,publication_id,image_url,sort_order").in("id", featuredIds) : Promise.resolve({ data: [] }),
        nextPosts.length ? supabase.from("race_events").select("id,name,slug,public_subdomain,cover_image_url").in("id", [...new Set(nextPosts.map((post) => post.race_event_id))]) : Promise.resolve({ data: [] }),
      ]);
      if (active) { setPhotos([...new Map([...(images || []), ...(featuredImages || [])].map((photo) => [photo.id, photo])).values()] as Photo[]); setEvents((races || []) as Event[]); }
      } finally { if (active) setReady(true); }
    })();
    return () => { active = false; };
  }, [ownProfile, userId]);

  if (!ready) return <ProfileGallerySkeleton />;
  const portfolioPhotos = featured.map((id) => photos.find((photo) => photo.id === id)).filter((photo): photo is Photo => Boolean(photo));
  const hasSocials = Object.values(socials).some((value) => typeof value === "string" && value.startsWith("https://"));
  if (!ownProfile && !posts.length && !hasSocials) return null;
  return <div className="mt-5">
    <CreatorSocialLinks links={socials} className="mt-5" />
    {(portfolioPhotos.length || ownProfile) ? <section className="mt-10">
      <h2 className="text-[24px] font-bold">Galería</h2>
      {portfolioPhotos.length ? <ProfileGallery photos={portfolioPhotos} editable={ownProfile} /> : <p className="mt-3 text-sm text-white/50">Elige fotos para mostrar en tu portafolio.</p>}
    </section> : null}
    {posts.length ? <section className="mt-10"><h2 className="text-[20px] font-semibold">Fotos de eventos</h2><div className="mt-[10px] flex snap-x gap-4 overflow-x-auto pb-3">{posts.map((post) => { const event = events.find((race) => race.id === post.race_event_id); const photo = photos.find((image) => image.publication_id === post.id); return <Link key={post.id} href={`/fotos/${encodeURIComponent(event?.public_subdomain || event?.slug || post.race_event_id)}/${post.id}`} className="w-[250px] shrink-0 snap-start">{photo ? <CardImage src={photo.image_url} className="aspect-square w-full rounded-[20px] object-cover" /> : null}<strong className="mt-2 block line-clamp-2 text-[16px]">{post.title}</strong><span className="mt-1 text-sm text-white/50">Ver fotos ›</span></Link>; })}</div></section> : null}
  </div>;
}

const galleryFrames = ["aspect-[4/5]", "aspect-square", "aspect-square", "aspect-[4/5]"] as const;

function ProfileGallery({ photos, editable }: { photos: Photo[]; editable: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const viewerPhotos = useMemo(() => photos.map((photo) => ({ id: photo.id, src: photo.image_url, alt: "Fotografía destacada" })), [photos]);
  const left = photos.filter((_, index) => index % 2 === 0);
  const right = photos.filter((_, index) => index % 2 === 1);
  return <>
    <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
      <div className="flex flex-col gap-[10px]">{left.map((photo, index) => <GalleryFrame key={photo.id} photo={photo} frame={galleryFrames[index * 2]} badge={editable && index * 2 === photos.length - 1} onOpen={() => setOpen(index * 2)} />)}</div>
      <div className="flex flex-col gap-[10px]">{right.map((photo, index) => <GalleryFrame key={photo.id} photo={photo} frame={galleryFrames[index * 2 + 1]} badge={editable && index * 2 + 1 === photos.length - 1} onOpen={() => setOpen(index * 2 + 1)} />)}</div>
    </div>
    {open !== null ? <PhotoViewer photos={viewerPhotos} startIndex={open} onClose={() => setOpen(null)} /> : null}
  </>;
}

function GalleryFrame({ photo, frame, badge, onOpen }: { photo: Photo; frame: string; badge: boolean; onOpen: () => void }) {
  return <div className="relative">
    <button type="button" onClick={onOpen} className={`block w-full overflow-hidden rounded-[20px] border-2 border-white/[0.11] bg-[#191919] ${frame}`}>
      <CardImage src={photo.image_url} alt="Fotografía destacada" className="h-full w-full object-cover" />
    </button>
    {badge ? <Link href="/creator/portfolio" style={{ color: "#0E0E0E" }} className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white py-1.5 pl-3 pr-3.5 text-[14px] font-semibold">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assetsdev/edit-solid.svg" alt="" width={16} height={16} className="h-4 w-4" />
      Editar
    </Link> : null}
  </div>;
}

