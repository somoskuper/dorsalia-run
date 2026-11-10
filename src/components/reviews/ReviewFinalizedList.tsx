"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicRace } from "@/lib/races";
import ReviewRaceRow from "@/components/reviews/ReviewRaceRow";
import ReviewPageHeader from "@/components/reviews/ReviewPageHeader";
import { ListRowsSkeleton } from "@/components/ui/Skeleton";

export default function ReviewFinalizedList({ races }: { races: PublicRace[] }) {
  const [shown, setShown] = useState(10);
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinel.current;
    if (!node || shown >= races.length) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShown((value) => Math.min(races.length, value + 10));
    }, { rootMargin: "300px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown, races.length]);

  return <main className="min-h-screen bg-[#0e0e0e] pb-28 text-white">
    <div className="mx-auto max-w-3xl px-[15px] pt-5"><ReviewPageHeader fallbackHref="/review" /><h1 className="mt-8 text-[24px] font-semibold">Eventos finalizados</h1>
      <div className="mt-4">{races.slice(0, shown).map((race) => <ReviewRaceRow key={race.id} race={race} />)}</div>
      <div ref={sentinel} className="h-8" aria-hidden="true" />
      {shown < races.length ? <ListRowsSkeleton count={2} avatar="flyer" label="Cargando más eventos" /> : null}
    </div>
  </main>;
}
