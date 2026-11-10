"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function CollectionShareSheet({ open, name, isPublic, link, busy, error, onTogglePublic, onClose }: {
  open: boolean;
  name: string;
  isPublic: boolean;
  link: string | null;
  busy: boolean;
  error: string;
  onTogglePublic: (next: boolean) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) { setCopied(false); return; }
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open, onClose]);

  async function share() {
    if (!link) return;
    try {
      if (navigator.share) { await navigator.share({ title: name, url: link }); return; }
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      try { await navigator.clipboard.writeText(link); setCopied(true); } catch { /* El enlace sigue visible para copiarlo a mano. */ }
    }
  }

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-end bg-black/60" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={`Compartir ${name}`} onClick={(event) => event.stopPropagation()} className="w-full rounded-t-[20px] bg-[#070707] px-[15px] pb-[40px] pt-4 text-white shadow-[0_-20px_60px_rgba(0,0,0,0.45)]">
        <div className="mx-auto max-w-[640px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold leading-6">Compartir colección</h2>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-10 w-10 place-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/close.svg" alt="" width={24} height={24} className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-1 truncate text-[14px] text-white/50">{name}</p>
          <div className="mt-[30px] flex items-center justify-between gap-[10px] rounded-[20px] bg-[#191919] py-[15px] pl-[15px] pr-[10px]">
            <span className="min-w-0">
              <strong className="block text-[16px] font-normal">Fotos públicas</strong>
              <small className="block text-[13px] text-white/50">{isPublic ? "Cualquier persona con el enlace puede verlas." : "Solo tú puedes verlas."}</small>
            </span>
            <button type="button" role="switch" aria-checked={isPublic} aria-label="Hacer públicas las fotos" disabled={busy} onClick={() => onTogglePublic(!isPublic)} className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors disabled:opacity-50 ${isPublic ? "bg-[#C5E500]" : "bg-white/20"}`}>
              <span className={`absolute top-[3px] h-6 w-6 rounded-full bg-white shadow transition-[left] ${isPublic ? "left-[23px]" : "left-[3px]"}`} />
            </button>
          </div>
          {error ? <p role="alert" className="mt-4 text-sm text-[#DE5757]">{error}</p> : null}
          {isPublic && link ? <>
            <h3 className="mt-[30px] text-[20px] font-semibold leading-6">Enlace</h3>
            <p className="mt-[10px] flex h-[44px] items-center truncate rounded-[20px] bg-[#191919] px-[15px] text-[16px] text-white/50">{link}</p>
            {copied ? <p className="mt-2 text-sm text-[#C5E500]">Enlace copiado</p> : null}
            <div className="mt-[30px] grid grid-cols-2 gap-[10px]">
              <a href={link} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center rounded-full border border-white/20 text-[16px] font-semibold" style={{ color: "#ffffff" }}>Ver enlace</a>
              <button type="button" onClick={() => void share()} className="h-12 rounded-full bg-white text-[16px] font-semibold" style={{ color: "#0E0E0E" }}>Compartir</button>
            </div>
          </> : <p className="mt-4 text-sm leading-5 text-white/50">Activa “Fotos públicas” para obtener el enlace y compartir la colección. Solo se pueden publicar fotos de eventos que ya finalizaron.</p>}
        </div>
      </section>
    </div>,
    document.body,
  );
}
