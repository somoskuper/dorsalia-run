"use client";

import { useEffect, useState } from "react";

export type EventPalette = { top: string; bottom: string };
export const FALLBACK_PALETTE: EventPalette = { top: "#0e0144", bottom: "#45269d" };
const cache = new Map<string, EventPalette>();

function paletteFromPixels(data: Uint8ClampedArray): EventPalette {
  const bins = Array.from({ length: 24 }, () => ({ score: 0, hue: 0, saturation: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 180) continue;
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    const lightness = (max + min) / 2;
    if (delta < 0.09 || max < 0.12 || lightness > 0.9) continue;
    const saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (saturation < 0.2) continue;
    let hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    const weight = saturation * (0.5 + Math.min(max, 0.65));
    const bin = bins[Math.floor(hue / 15)];
    bin.score += weight;
    bin.hue += hue * weight;
    bin.saturation += saturation * weight;
  }
  const winner = bins.reduce((best, bin) => bin.score > best.score ? bin : best, bins[0]);
  if (winner.score < 0.01) return FALLBACK_PALETTE;
  const hue = Math.round(winner.hue / winner.score);
  const saturation = Math.round(Math.max(48, Math.min(85, winner.saturation / winner.score * 100)));
  return { top: `hsl(${hue} ${saturation}% 11%)`, bottom: `hsl(${hue} ${saturation}% 30%)` };
}

export function useEventPalette(imageUrl: string | null): EventPalette {
  const [palette, setPalette] = useState<EventPalette>(() => imageUrl ? cache.get(imageUrl) || FALLBACK_PALETTE : FALLBACK_PALETTE);
  useEffect(() => {
    if (!imageUrl) { setPalette(FALLBACK_PALETTE); return; }
    const cached = cache.get(imageUrl);
    if (cached) { setPalette(cached); return; }
    let active = true;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 48; canvas.height = 48;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;
        context.drawImage(image, 0, 0, 48, 48);
        const next = paletteFromPixels(context.getImageData(0, 0, 48, 48).data);
        cache.set(imageUrl, next);
        if (active) setPalette(next);
      } catch { if (active) setPalette(FALLBACK_PALETTE); }
    };
    image.onerror = () => { if (active) setPalette(FALLBACK_PALETTE); };
    image.src = imageUrl;
    return () => { active = false; };
  }, [imageUrl]);
  return palette;
}
