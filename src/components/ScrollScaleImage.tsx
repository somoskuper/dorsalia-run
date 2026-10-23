"use client";

import { useEffect, useRef } from "react";

export default function ScrollScaleImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = image.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const imageCenter = rect.top + rect.height / 2;
      const approachRange = Math.max(window.innerHeight * 0.7, 1);
      const distanceBeforeCenter = Math.max(0, imageCenter - viewportCenter);
      const progress = 1 - Math.min(1, distanceBeforeCenter / approachRange);
      const scale = 1.3 - progress * 0.3;
      image.style.transform = `scale(${scale.toFixed(4)})`;
    };

    const requestUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    // The Figma export is rendered directly so the artwork remains pixel-perfect.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      className={`${className} origin-center will-change-transform`}
      style={{ transform: "scale(1.3)" }}
    />
  );
}
