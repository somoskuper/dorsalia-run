"use client";

import { useRef, useState } from "react";
import CardImage from "@/components/media/CardImage";
import { portfolioCardUrl } from "@/lib/photoDelivery";

export type OrderPhoto = { id: string; image_url: string };

function ProgressRing({ remaining }: { remaining: number }) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const left = Math.min(1, Math.max(0, remaining));
  return <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
    <circle cx="20" cy="20" r={radius} fill="none" stroke="#C5E500" strokeWidth="2" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - left)} transform="rotate(-90 20 20)" className="transition-[stroke-dashoffset] duration-200" />
  </svg>;
}

export default function PhotoOrderGrid<T extends OrderPhoto>({ photos, pending, progress, disabled, onReorder, onDelete, onDragEnd }: {
  photos: T[];
  pending: number;
  progress: number;
  disabled: boolean;
  onReorder: (from: number, to: number) => void;
  onDelete: (photo: T) => void;
  onDragEnd?: () => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; index: number; pointerId: number; startX: number; startY: number; dx: number; dy: number; width: number; height: number; active: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ src: string; x: number; y: number; width: number; height: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function cellAt(x: number, y: number) {
    const grid = gridRef.current;
    if (!grid) return null;
    const cells = (Array.from(grid.children) as HTMLElement[]).filter((cell) => !cell.hasAttribute("data-pending"));
    const index = cells.findIndex((cell) => {
      const rect = cell.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
    return index >= 0 ? index : null;
  }

  function finish() {
    const moved = Boolean(dragRef.current?.active);
    dragRef.current = null;
    setGhost(null);
    setDraggingId(null);
    if (moved) onDragEnd?.();
  }

  return <>
  <div ref={gridRef} className="mt-[10px] grid grid-cols-2 gap-[10px]">
    {photos.map((photo, index) => <div
      key={photo.id}
      aria-label={index === 0 ? "Portada. Arrastra para ordenar" : `Foto ${index + 1}. Arrastra para ordenar`}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0 || (event.target as HTMLElement).closest("[data-delete-photo]")) return;
        const rect = event.currentTarget.getBoundingClientRect();
        dragRef.current = { id: photo.id, index, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: event.clientX - rect.left, dy: event.clientY - rect.top, width: rect.width, height: rect.height, active: false };
        try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Este gesto sigue por los eventos del propio recuadro. */ }
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        if (!drag.active && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 8) return;
        if (!drag.active) { drag.active = true; setDraggingId(drag.id); }
        event.preventDefault();
        const photoSrc = portfolioCardUrl(photos.find((item) => item.id === drag.id)?.image_url || "");
        setGhost({ src: photoSrc, x: event.clientX - drag.dx, y: event.clientY - drag.dy, width: drag.width, height: drag.height });
        const target = cellAt(event.clientX, event.clientY);
        if (target !== null && target !== drag.index) { onReorder(drag.index, target); drag.index = target; }
      }}
      onPointerUp={finish}
      onPointerCancel={finish}
      onContextMenu={(event) => event.preventDefault()}
      className={`relative aspect-square touch-none overflow-hidden rounded-[20px] ${draggingId === photo.id ? "opacity-30" : ""}`}
    >
      <CardImage src={photo.image_url} className="pointer-events-none h-full w-full select-none object-cover" />
      {index === 0 ? /* eslint-disable-next-line @next/next/no-img-element */ <img src="/settings-icons/medallas.svg" alt="" width={24} height={24} className="pointer-events-none absolute left-2 top-2 h-6 w-6 drop-shadow" /> : null}
      <button type="button" data-delete-photo aria-label={`Eliminar foto ${index + 1}`} disabled={disabled} onPointerDown={(event) => event.stopPropagation()} onClick={() => onDelete(photo)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Close_LG.svg" alt="" width={16} height={16} className="h-4 w-4" />
      </button>
    </div>)}
    {Array.from({ length: pending }, (_, index) => <div key={`pending-${index}`} data-pending aria-label="Subiendo foto" className="grid aspect-square place-items-center rounded-[20px] bg-[#191919]"><ProgressRing remaining={1 - progress} /></div>)}
  </div>
  {ghost ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={ghost.src} alt="" className="pointer-events-none fixed z-50 rounded-[20px] object-cover shadow-2xl" style={{ left: ghost.x, top: ghost.y, width: ghost.width, height: ghost.height }} onError={(event) => { const original = photos.find((item) => item.id === draggingId)?.image_url; if (original && event.currentTarget.src !== original) event.currentTarget.src = original; }} /> : null}
  </>;
}
