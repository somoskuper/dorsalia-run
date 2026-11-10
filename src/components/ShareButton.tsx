"use client";

import GlassIconButton from "@/components/account/GlassIconButton";

export default function ShareButton({ title, text }: { title?: string; text?: string }) {
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: title || document.title, text, url });
      else { await navigator.clipboard.writeText(url); window.alert("Enlace copiado"); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.alert("No se pudo compartir.");
    }
  }
  return <GlassIconButton aria-label="Compartir" onClick={() => void share()}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/share.svg" alt="" width={22} height={22} className="brightness-0 invert" /></GlassIconButton>;
}
