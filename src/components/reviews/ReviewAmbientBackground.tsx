"use client";

import { useEffect, useRef, useState } from "react";

type Palette = { top: string; bottom: string };
const INITIAL: Palette = { top: "#111827", bottom: "#050505" };

export default function ReviewAmbientBackground() {
  const [layers, setLayers] = useState<{ previous: Palette | null; active: Palette }>({ previous: null, active: INITIAL });
  const [showActive, setShowActive] = useState(true);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    const update = (event: Event) => {
      const { top, bottom } = (event as CustomEvent<Palette>).detail || {};
      if (!top || !bottom) return;
      setLayers((current) => {
        if (current.active.top === top && current.active.bottom === bottom) return current;
        return { previous: current.active, active: { top, bottom } };
      });
      setShowActive(false);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        frame.current = requestAnimationFrame(() => setShowActive(true));
      });
    };
    document.addEventListener("dorsalia:review-palette", update);
    return () => {
      document.removeEventListener("dorsalia:review-palette", update);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);
  const gradient = (palette: Palette) => `linear-gradient(180deg, ${palette.bottom}, ${palette.top})`;
  return <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#080808]" aria-hidden="true">
    {layers.previous ? <div className={`absolute inset-0 transition-opacity duration-700 ${showActive ? "opacity-0" : "opacity-100"}`} style={{ backgroundImage: gradient(layers.previous) }} /> : null}
    <div className={`absolute inset-0 transition-opacity duration-700 ${showActive ? "opacity-100" : "opacity-0"}`} style={{ backgroundImage: gradient(layers.active) }} />
  </div>;
}
