"use client";

import { useEffect, useRef, useState } from "react";

export default function PostMenu({ onEdit, onDelete, postId }: { onEdit?: () => void; onDelete?: () => void | Promise<void>; postId?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  async function share() {
    const url = new URL(window.location.href);
    if (postId) url.hash = `post-${postId}`;
    try {
      if (navigator.share) await navigator.share({ url: url.toString() });
      else { await navigator.clipboard.writeText(url.toString()); window.alert("Enlace copiado"); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.alert("No se pudo compartir la publicación.");
    }
  }
  return <div ref={ref} className="relative">
    <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-9 w-9 place-items-center rounded-full text-white/75 hover:bg-white/10" aria-label="Opciones de la publicación">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
    </button>
    {open ? <div className="absolute right-0 top-10 z-30 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] p-1 shadow-2xl">
      {onEdit ? <button type="button" onClick={() => { setOpen(false); onEdit(); }} className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/10">Editar</button> : null}
      {onDelete ? <button type="button" onClick={() => { setOpen(false); void onDelete(); }} className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-300 hover:bg-white/10">Eliminar</button> : null}
      <button type="button" onClick={() => { setOpen(false); void share(); }} className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/10">Compartir</button>
    </div> : null}
  </div>;
}
