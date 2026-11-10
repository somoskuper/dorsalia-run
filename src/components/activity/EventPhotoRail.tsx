"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchActivityFeed, eventPhotoGroups, type EventPhotoGroup } from "@/lib/activity";
import { EVENT_PHOTOS_URL } from "@/lib/homeCollectionUrls";
import { portfolioCardUrl } from "@/lib/photoDelivery";

export function eventPhotosHref(slug: string) {
  return `/fotos/${encodeURIComponent(slug)}`;
}

function RailPhoto({ src, priority }: { src: string; priority: boolean }) {
  const card = portfolioCardUrl(src);
  const [current, setCurrent] = useState(card);
  return /* eslint-disable-next-line @next/next/no-img-element */ <img src={current} alt="" width={500} height={625} decoding="async" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "low"} onError={() => { if (current !== src) setCurrent(src); }} className="h-full w-full object-cover" />;
}

export function EventPhotoCard({ group, fluid = false, priority = false }: { group: EventPhotoGroup; fluid?: boolean; priority?: boolean }) {
  const photos = group.photos;
  const [index, setIndex] = useState(0);
  const photo = photos[index];
  const galleryHref = eventPhotosHref(group.event_slug);

  return <article className={fluid ? "min-w-0" : "w-[250px] shrink-0"}>
    <div className={`relative overflow-hidden rounded-[15px] bg-white/10 ${fluid ? "aspect-[4/5] w-full" : "aspect-[4/5] w-[250px]"}`}>
      {photo ? <Link href={galleryHref} aria-label={`Ver fotos de ${group.event_name}`} className="block h-full w-full"><RailPhoto key={photo.id} src={photo.image_url} priority={priority && index === 0} /></Link> : null}
      {photos.length > 1 ? <>
        <button type="button" aria-label="Foto anterior" onClick={() => setIndex((value) => (value - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Chevron_Right.svg" alt="" className="h-4 w-4" /></button>
        <button type="button" aria-label="Foto siguiente" onClick={() => setIndex((value) => (value + 1) % photos.length)} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Chevron_Right.svg" alt="" className="h-4 w-4" style={{ transform: "rotate(180deg)" }} /></button>
      </> : null}
      {group.event_cover_url ? <Link href={galleryHref} className="absolute bottom-[10px] left-[10px] z-10 block h-[75px] w-[75px] overflow-hidden rounded-[14px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={group.event_cover_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /></Link> : null}
      <Link href={galleryHref} className="absolute bottom-[10px] right-[10px] z-10 rounded-full bg-white px-3 py-2 text-[13px] font-semibold" style={{ color: "#0E0E0E" }}>Ver fotos</Link>
    </div>
    {group.event_name ? <Link href={galleryHref} className="mt-3 block truncate text-[15px] font-semibold leading-5 text-white">{group.event_name}</Link> : null}
  </article>;
}

export function EventPhotoGrid({ groups }: { groups: EventPhotoGroup[] }) {
  const [items, setItems] = useState(groups);
  useEffect(() => {
    let active = true;
    fetchActivityFeed(null, 100).then((next) => { if (active) setItems(eventPhotoGroups(next)); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (!items.length) return <p className="text-sm text-white/55">Todavía no hay fotos de eventos publicadas.</p>;
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-[15px]">{items.map((group) => <EventPhotoCard key={group.key} group={group} fluid />)}</div>;
}

export default function EventPhotoRail({ className = "mt-[30px]", initialGroups }: { className?: string; initialGroups?: EventPhotoGroup[] }) {
  const [groups, setGroups] = useState<EventPhotoGroup[]>(initialGroups || []);

  useEffect(() => {
    if (initialGroups) return;
    let active = true;
    fetchActivityFeed(null, 100).then((items) => {
      if (active) setGroups(eventPhotoGroups(items).slice(0, 12));
    }).catch(() => { if (active) setGroups([]); });
    return () => { active = false; };
  }, [initialGroups]);

  if (!groups.length) return null;
  return <section className={className}>
    <div className="mb-5 flex items-center justify-between gap-3 px-[17px] lg:px-0">
      <h2 className="line-clamp-2 text-[24px] font-normal leading-[1.2] text-white">Fotos de eventos</h2>
      <Link href={EVENT_PHOTOS_URL} aria-label="Ver más: Fotos de eventos" className="grid h-8 w-8 shrink-0 place-items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/mobile-home/imgChevronRight.svg" alt="" width={24} height={24} />
      </Link>
    </div>
    <div className="flex gap-[15px] overflow-x-auto overscroll-x-contain px-[17px] pb-2 [scrollbar-width:none] lg:px-0 [&::-webkit-scrollbar]:hidden">
      {groups.map((group, index) => <EventPhotoCard key={group.key} group={group} priority={index === 0} />)}
    </div>
  </section>;
}
