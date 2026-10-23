"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";

export type GalleryItem = { id: string; url: string; alt?: string };

const GAP_PX = 12;
const SWIPE_PX = 48;
const EASE = "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)";

function copies(items: GalleryItem[]) { return items.length < 2 ? items : [...items, ...items, ...items]; }
function Chevron({ dir }: { dir: "prev" | "next" }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden><path d={dir === "prev" ? "M14.5 5.5 8 12l6.5 6.5" : "M9.5 5.5 16 12l-6.5 6.5"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

export default function PublicGalleryCarousel({ items }: { items: GalleryItem[] }) {
  const n = items.length;
  const loop = n > 1;
  const ids = items.map((item) => item.id).join("|");
  const slides = useMemo(() => copies(items), [ids, items]);
  const [index, setIndex] = useState(() => loop ? n : 0);
  const [open, setOpen] = useState<number | null>(null);
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  const skipClickRef = useRef(false);
  const busyRef = useRef(false);
  const dragging = useRef<{ id: number; startX: number; startY: number; lastX: number; axis: "undecided" | "x" | "y"; moved: boolean } | null>(null);
  indexRef.current = index;
  const realIndex = n ? ((index % n) + n) % n : 0;

  const applyTx = useCallback((i: number, animate: boolean) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const child = track?.children[i] as HTMLElement | undefined;
    if (!viewport || !track || !child) return;
    track.style.transition = animate ? EASE : "none";
    track.style.transform = `translate3d(${viewport.clientWidth / 2 - (child.offsetLeft + child.offsetWidth / 2)}px,0,0)`;
  }, []);

  useLayoutEffect(() => {
    const start = n > 1 ? n : 0;
    indexRef.current = start; busyRef.current = false; setIndex(start); applyTx(start, false);
  }, [applyTx, ids, n]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const resize = () => { if (!busyRef.current && !dragging.current) applyTx(indexRef.current, false); };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport); observer.observe(track);
    return () => observer.disconnect();
  }, [applyTx, slides.length, ratios]);

  const go = useCallback((direction: number) => {
    if (!loop || busyRef.current) return;
    busyRef.current = true;
    const next = indexRef.current + direction;
    indexRef.current = next; applyTx(next, true); setIndex(next);
    window.setTimeout(() => { busyRef.current = false; }, 560);
  }, [loop, applyTx]);

  const goToReal = useCallback((target: number) => {
    if (!loop) return;
    const next = n + target;
    if (next === indexRef.current || busyRef.current) return;
    busyRef.current = true; indexRef.current = next; applyTx(next, true); setIndex(next);
    window.setTimeout(() => { busyRef.current = false; }, 560);
  }, [loop, n, applyTx]);

  function finishDrag(e: PointerEvent<HTMLDivElement>) {
    const drag = dragging.current;
    if (!drag || drag.id !== e.pointerId) return;
    dragging.current = null;
    if (drag.moved) skipClickRef.current = true;
    const dx = drag.lastX - drag.startX;
    if (drag.axis === "x" && Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1);
    else applyTx(indexRef.current, true);
  }

  useEffect(() => {
    if (open == null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowLeft") setOpen((open + n - 1) % n);
      if (e.key === "ArrowRight") setOpen((open + 1) % n);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", key);
    return () => { document.body.style.overflow = previous; document.removeEventListener("keydown", key); };
  }, [open, n]);

  if (!items.length) return null;
  return <>
    <div className="relative w-full select-none outline-none" role="region" aria-roledescription="carrusel" aria-label="Galería de fotos" tabIndex={0} onKeyDown={(e) => { if (open != null) return; if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); }}>
      <div ref={viewportRef} className="relative h-[min(52vh,380px)] touch-pan-y overflow-hidden sm:h-[min(62vh,540px)]" onPointerDown={(e) => { if (!loop || e.button !== 0 || busyRef.current) return; dragging.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, axis: "undecided", moved: false }; }} onPointerMove={(e) => { const drag = dragging.current; const track = trackRef.current; const viewport = viewportRef.current; if (!drag || drag.id !== e.pointerId || !track || !viewport) return; const dx = e.clientX - drag.startX; const dy = e.clientY - drag.startY; if (drag.axis === "undecided") { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; drag.axis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y"; if (drag.axis === "x") e.currentTarget.setPointerCapture(e.pointerId); } if (drag.axis !== "x") return; drag.lastX = e.clientX; drag.moved = Math.abs(dx) > 6; const child = track.children[indexRef.current] as HTMLElement | undefined; if (!child) return; track.style.transition = "none"; track.style.transform = `translate3d(${viewport.clientWidth / 2 - (child.offsetLeft + child.offsetWidth / 2) + dx}px,0,0)`; e.preventDefault(); }} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
        <div ref={trackRef} className="flex h-full items-center will-change-transform" style={{ gap: GAP_PX }} onTransitionEnd={(e) => { if (e.target !== trackRef.current || e.propertyName !== "transform" || !loop) return; let wrapped = indexRef.current; if (wrapped < n) wrapped += n; else if (wrapped >= n * 2) wrapped -= n; if (wrapped !== indexRef.current) { indexRef.current = wrapped; applyTx(wrapped, false); setIndex(wrapped); } busyRef.current = false; }}>
          {slides.map((item, i) => { const active = i === index; const real = n ? ((i % n) + n) % n : 0; return <button key={`${item.id}-${i}`} type="button" tabIndex={active ? 0 : -1} aria-label={item.alt || `Foto ${real + 1}`} aria-current={active ? "true" : undefined} onClick={() => { if (skipClickRef.current) { skipClickRef.current = false; return; } if (!active && loop) goToReal(real); else setOpen(real); }} className="flex h-full shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0" style={{ aspectRatio: String(ratios[item.id] || 1) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={item.url} alt={item.alt || ""} loading={active ? "eager" : "lazy"} onLoad={(e) => { const img = e.currentTarget; if (img.naturalWidth && img.naturalHeight) setRatios((current) => current[item.id] ? current : { ...current, [item.id]: img.naturalWidth / img.naturalHeight }); if (!busyRef.current && !dragging.current) requestAnimationFrame(() => applyTx(indexRef.current, false)); }} className="pointer-events-none block h-full max-h-full w-auto object-contain" />
          </button>; })}
        </div>
        {loop ? <><button type="button" aria-label="Anterior" onClick={() => go(-1)} className="absolute left-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur sm:left-4 sm:h-11 sm:w-11"><Chevron dir="prev" /></button><button type="button" aria-label="Siguiente" onClick={() => go(1)} className="absolute right-2 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur sm:right-4 sm:h-11 sm:w-11"><Chevron dir="next" /></button></> : null}
      </div>
      {loop ? <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Fotos">{items.map((item, i) => <button key={item.id} type="button" role="tab" aria-selected={i === realIndex} aria-label={`Ir a foto ${i + 1}`} onClick={() => goToReal(i)} className={`h-1.5 rounded-full transition-all ${i === realIndex ? "w-6 bg-[#c9f24b]" : "w-1.5 bg-white/30 hover:bg-white/50"}`} />)}</div> : null}
    </div>
    {open != null ? <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/90 p-3 sm:p-8" role="dialog" aria-modal="true" onClick={() => setOpen(null)}><button type="button" aria-label="Cerrar" onClick={() => setOpen(null)} className="absolute right-3 top-3 px-2 text-3xl leading-none text-white/80 sm:right-5 sm:top-5">×</button>{n > 1 ? <><button type="button" aria-label="Anterior" onClick={(e) => { e.stopPropagation(); setOpen((open + n - 1) % n); }} className="absolute left-2 px-2 text-4xl text-white/80 sm:left-4">‹</button><button type="button" aria-label="Siguiente" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % n); }} className="absolute right-2 px-2 text-4xl text-white/80 sm:right-4">›</button></> : null}<div className="flex max-h-[88vh] w-full max-w-5xl items-center justify-center" onClick={(e) => e.stopPropagation()}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={items[open].url} alt={items[open].alt || ""} className="h-auto max-h-[88vh] w-auto max-w-full object-contain" /></div></div> : null}
  </>;
}
