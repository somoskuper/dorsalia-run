"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ShareButton from "@/components/ShareButton";
import PhotoViewer from "@/components/media/PhotoViewer";
import PostComments from "@/components/activity/PostComments";
import CreatorProfileCard, { type CreatorCard } from "@/components/creator/CreatorProfileCard";
import { EVENT_PHOTOS_BACKGROUND } from "@/components/creator/CreatorEventGallery";
import { recordCreatorPublicationView } from "@/lib/creatorViews";
import { returnToPhotoEvent } from "@/lib/photoNavigation";

export type PublicationGallery = {
  id: string;
  title: string;
  description: string;
  galleryName: string;
  purchaseUrl: string | null;
  photos: { id: string; image_url: string }[];
  eventName: string;
  eventCover: string | null;
  eventPhotosHref: string;
  activityPostId: string | null;
  path: string;
  url: string;
  creator: CreatorCard | null;
};

function BuyPhotosButton({ href }: { href: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-white text-[16px] font-semibold" style={{ color: "#0E0E0E" }}>Comprar fotos</a>;
}

export default function CreatorPublicationGallery({ gallery }: { gallery: PublicationGallery }) {
  const [viewer, setViewer] = useState<number | null>(null);

  useEffect(() => {
    recordCreatorPublicationView(gallery.id, "gallery");
  }, [gallery.id]);

  return <main className="relative min-h-screen pb-28 text-white">
    <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: EVENT_PHOTOS_BACKGROUND }} />
    <div className="relative mx-auto max-w-2xl px-[15px]">
      <PageHeader fallbackHref={gallery.eventPhotosHref} backLabel="ver más fotos" onBack={() => returnToPhotoEvent(gallery.eventPhotosHref)} sticky gradient={false} rightAction={<ShareButton title={gallery.title} text={`${gallery.title} · ${gallery.eventName}`} />} />
      {gallery.creator ? <div className="mt-8"><CreatorProfileCard creator={gallery.creator} loginNext={gallery.path} /></div> : null}
      <div className="mt-8 flex flex-col items-start text-left">
        <a href={gallery.eventPhotosHref} onClick={(event) => { event.preventDefault(); returnToPhotoEvent(gallery.eventPhotosHref); }} className="flex items-center gap-2 text-[16px] font-normal opacity-50">
          {gallery.eventCover ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={gallery.eventCover} alt="" className="shrink-0 rounded-[3px] object-cover" style={{ width: 16, height: 16 }} /> : null}
          {gallery.eventName}
        </a>
        <h1 className="mt-2 text-[32px] font-bold leading-tight">{gallery.title}</h1>
        {gallery.description ? <p className="mt-4 whitespace-pre-line text-[15px] leading-[22px] text-white/85">{gallery.description}</p> : null}
        {gallery.purchaseUrl ? <BuyPhotosButton href={gallery.purchaseUrl} /> : null}
      </div>
      {gallery.galleryName ? <h2 className="mt-8 text-[24px] font-bold">{gallery.galleryName}</h2> : null}
      <div className="-mx-[15px] mt-4 columns-2 gap-[3px]">
        {gallery.photos.map((photo, index) => <button key={photo.id} type="button" onClick={() => setViewer(index)} aria-label={`Abrir foto ${index + 1}`} className="mb-[3px] block w-full break-inside-avoid bg-black/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src={photo.image_url} alt={`${gallery.title} · foto ${index + 1}`} loading="lazy" className="block h-auto w-full" />
        </button>)}
      </div>
      {gallery.purchaseUrl ? <BuyPhotosButton href={gallery.purchaseUrl} /> : null}
      {gallery.activityPostId ? <section className="mt-8">
        <h2 className="text-[20px] font-semibold leading-6">Comentarios</h2>
        <PostComments postId={gallery.activityPostId} withComposer />
      </section> : null}
    </div>
    {viewer !== null ? <PhotoViewer photos={gallery.photos.map((photo) => ({ id: photo.id, src: photo.image_url, alt: gallery.title }))} startIndex={viewer} onClose={() => setViewer(null)} /> : null}
  </main>;
}
