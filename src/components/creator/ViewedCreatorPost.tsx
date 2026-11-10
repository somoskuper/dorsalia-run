"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { recordCreatorPublicationView } from "@/lib/creatorViews";

export default function ViewedCreatorPost({ publicationId, surface, children }: { publicationId?: string | null; surface: "feed" | "fotos" | "gallery"; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!publicationId || !node) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      recordCreatorPublicationView(publicationId, surface);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [publicationId, surface]);

  if (!publicationId) return children;
  return <div ref={ref}>{children}</div>;
}
