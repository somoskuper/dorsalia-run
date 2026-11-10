"use client";

import { useState } from "react";
import { portfolioCardUrl } from "@/lib/photoDelivery";

export default function CardImage({ src, alt = "", className }: { src: string; alt?: string; className?: string }) {
  const card = portfolioCardUrl(src);
  const [current, setCurrent] = useState(card);
  return /* eslint-disable-next-line @next/next/no-img-element */ <img src={current} alt={alt} width={640} height={800} loading="lazy" decoding="async" className={className} onError={() => { if (current !== src) setCurrent(src); }} />;
}
