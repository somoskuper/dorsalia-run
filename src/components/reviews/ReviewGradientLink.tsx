"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { useEventPalette } from "@/lib/useEventPalette";

export default function ReviewGradientLink({ href, imageUrl, children }: { href: string; imageUrl: string | null; children: ReactNode }) {
  const palette = useEventPalette(imageUrl);
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) document.dispatchEvent(new CustomEvent("dorsalia:review-palette", { detail: palette }));
    }, { threshold: 0.65 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [palette]);
  return <Link ref={cardRef} href={href} className="flex w-[340px] shrink-0 snap-center flex-col items-center gap-[20px] rounded-[45px] px-5 pb-5 pt-[48px] text-center backdrop-blur-xl outline-none focus:outline-none focus-visible:outline-none" style={{ backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${palette.top} 68%, transparent) 0%, color-mix(in srgb, ${palette.bottom} 68%, transparent) 100%)` }}>{children}</Link>;
}
