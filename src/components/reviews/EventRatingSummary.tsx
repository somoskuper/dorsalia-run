"use client";

import StarRating from "@/components/reviews/StarRating";

export default function EventRatingSummary({ average, count, locked = false, countdown }: {
  average: number;
  count: number;
  locked?: boolean;
  countdown?: string | null;
}) {
  if (locked) return <div className="mt-3 max-w-full text-white"><div className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full border border-white/15 bg-white/[0.07] px-3 py-2 text-[12px] leading-tight text-white/70"><span className="shrink-0">Faltan</span><strong role="timer" className="break-words font-bold tabular-nums text-white [overflow-wrap:anywhere]">{countdown || "Calculando…"}</strong></div></div>;
  return <div className="mt-3 flex flex-wrap items-center gap-2 text-white">
    <StarRating value={average} size={18} label="Puntúa este evento" />
    <span className="text-sm font-bold">{count ? average.toFixed(1) : "—"}</span>
    <span className="text-xs text-white/55">{count === 1 ? "1 puntuación" : `${count} puntuaciones`}</span>
  </div>;
}
