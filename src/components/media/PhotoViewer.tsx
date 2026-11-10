"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PageHeader from "@/components/PageHeader";
import GlassIconButton from "@/components/account/GlassIconButton";

export type ViewerPhoto = { id: string; src: string; alt?: string };

export default function PhotoViewer({ photos, startIndex, onClose }: { photos: ViewerPhoto[]; startIndex: number; onClose: () => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const count = photos.length;

  useEffect(() => { setMounted(true); }, []);

  useLayoutEffect(() => {
    const node = scroller.current;
    if (!node?.clientWidth) return;
    node.scrollLeft = startIndex * node.clientWidth;
  }, [mounted, startIndex]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") scrollToIndex(index + 1);
      if (event.key === "ArrowLeft") scrollToIndex(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, index, onClose]);

  function scrollToIndex(next: number) {
    const node = scroller.current;
    if (!node?.clientWidth) return;
    const clamped = Math.max(0, Math.min(count - 1, next));
    node.scrollTo({ left: clamped * node.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const node = scroller.current;
    if (!node?.clientWidth) return;
    setIndex(Math.round(node.scrollLeft / node.clientWidth));
  }

  if (!mounted || !count) return null;
  return createPortal(<div className="fixed inset-0 z-[200] flex flex-col bg-black">
    <PageHeader
      sticky
      overlayCover
      gradient={false}
      hideBack
      rightAction={<GlassIconButton aria-label="Cerrar" onClick={onClose}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/close.svg" alt="" /></GlassIconButton>}
    />
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <div className="relative w-full" style={{ aspectRatio: "4 / 5", maxWidth: "min(100%, calc((100dvh - 88px) * 0.8))" }}>
        <div ref={scroller} onScroll={onScroll} className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.map((photo, position) => <div key={photo.id} className="h-full min-w-full snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.alt || "Fotografía"} className="h-full w-full object-cover" loading={Math.abs(position - startIndex) <= 1 ? "eager" : "lazy"} decoding="async" />
          </div>)}
        </div>
        {count > 1 ? <span className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">{index + 1}/{count}</span> : null}
        {count > 1 ? <>
          <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2"><GlassIconButton aria-label="Foto anterior" onClick={() => scrollToIndex(index - 1)}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Chevron_Right.svg" alt="" /></GlassIconButton></div>
          <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2"><GlassIconButton aria-label="Foto siguiente" onClick={() => scrollToIndex(index + 1)}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Chevron_Right.svg" alt="" style={{ transform: "rotate(180deg)" }} /></GlassIconButton></div>
        </> : null}
      </div>
    </div>
  </div>, document.body);
}
