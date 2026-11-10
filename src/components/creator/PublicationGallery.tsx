"use client";

import { useRef, useState } from "react";
import CardImage from "@/components/media/CardImage";
import PhotoViewer from "@/components/media/PhotoViewer";
import { portfolioCardUrl } from "@/lib/photoDelivery";

const frames = ["aspect-[4/5]", "aspect-square", "aspect-square", "aspect-[4/5]"] as const;

export type MosaicPhoto = { id: string; src: string };

export default function PublicationGallery({ photos, disabled = false, onReorder, onDelete }: {
  photos: MosaicPhoto[];
  disabled?: boolean;
  onReorder: (from: number, to: number) => void;
  onDelete: (id: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const dragRef = useRef<{ id: string; index: number; pointerId: number; startX: number; startY: number; dx: number; dy: number; width: number; height: number; active: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ src: string; x: number; y: number; width: number; height: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const columns = [photos.map((photo, index) => ({ photo, index })).filter((item) => item.index % 2 === 0), photos.map((photo, index) => ({ photo, index })).filter((item) => item.index % 2 === 1)];

  function cellAt(x: number, y: number) {
    const root = rootRef.current;
    if (!root) return null;
    const cells = Array.from(root.querySelectorAll<HTMLElement>("[data-photo-index]"));
    const cell = cells.find((item) => {
      const rect = item.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    return cell ? Number(cell.dataset.photoIndex) : null;
  }

  function finish(openIndex?: number) {
    dragRef.current = null;
    setGhost(null);
    setDraggingId(null);
    if (openIndex !== undefined) setOpen(openIndex);
  }

  return <>
    <div ref={rootRef} className="mt-[10px] grid grid-cols-2 gap-[10px]">
      {columns.map((column, columnIndex) => <div key={columnIndex} className="flex flex-col gap-[10px]">
        {column.map(({ photo, index }) => <div
          key={photo.id}
          data-photo-index={index}
          aria-label={index === 0 ? "Portada. Arrastra para ordenar" : `Foto ${index + 1}. Arrastra para ordenar`}
          onPointerDown={(event) => {
            if (disabled || event.button !== 0 || (event.target as HTMLElement).closest("[data-delete-photo]")) return;
            const rect = event.currentTarget.getBoundingClientRect();
            dragRef.current = { id: photo.id, index, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: event.clientX - rect.left, dy: event.clientY - rect.top, width: rect.width, height: rect.height, active: false };
            try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* El gesto sigue en este recuadro. */ }
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
            if (!drag.active) { drag.active = true; setDraggingId(drag.id); }
            event.preventDefault();
            const source = photosRef.current.find((item) => item.id === drag.id)?.src || "";
            setGhost({ src: portfolioCardUrl(source), x: event.clientX - drag.dx, y: event.clientY - drag.dy, width: drag.width, height: drag.height });
            const target = cellAt(event.clientX, event.clientY);
            if (target !== null && target !== drag.index) { onReorder(drag.index, target); drag.index = target; }
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current;
            const tapped = Boolean(drag && drag.pointerId === event.pointerId && !drag.active);
            const tappedIndex = drag?.index;
            finish(tapped ? tappedIndex : undefined);
          }}
          onPointerCancel={() => finish()}
          onContextMenu={(event) => event.preventDefault()}
          className={`relative touch-none overflow-hidden rounded-[20px] border-2 border-white/[0.11] bg-[#191919] ${frames[index % frames.length]} ${draggingId === photo.id ? "opacity-30" : ""}`}
        >
          <CardImage src={photo.src} alt="" className="pointer-events-none h-full w-full select-none object-cover" />
          {index === 0 ? /* eslint-disable-next-line @next/next/no-img-element */ <img src="/settings-icons/medallas.svg" alt="" width={24} height={24} className="pointer-events-none absolute left-2 top-2 h-6 w-6 drop-shadow" /> : null}
          <button type="button" data-delete-photo aria-label={`Eliminar foto ${index + 1}`} disabled={disabled} onPointerDown={(event) => event.stopPropagation()} onClick={() => onDelete(photo.id)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Close_LG.svg" alt="" width={16} height={16} className="h-4 w-4" />
          </button>
        </div>)}
      </div>)}
    </div>
    {ghost ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={ghost.src} alt="" className="pointer-events-none fixed z-50 rounded-[20px] object-cover shadow-2xl" style={{ left: ghost.x, top: ghost.y, width: ghost.width, height: ghost.height }} onError={(event) => { const original = photosRef.current.find((item) => item.id === draggingId)?.src; if (original && event.currentTarget.src !== original) event.currentTarget.src = original; }} /> : null}
    {open !== null ? <PhotoViewer photos={photos.map((photo) => ({ id: photo.id, src: photo.src, alt: "Fotografía" }))} startIndex={open} onClose={() => setOpen(null)} /> : null}
  </>;
}
