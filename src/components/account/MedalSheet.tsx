"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import GlassPanel from "@/components/ui/GlassPanel";

const TILT_LIMIT = 35;
const GLASS = { glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 };

export type MedalSheetRedemption = {
  usesRemaining: number;
  maxUses: number;
  unlimitedRedemptions?: boolean;
  expiresAt?: string | null;
  termsAndConditions?: string | null;
  canRedeem: boolean;
  busy: boolean;
  message?: string | null;
  onRedeem: () => void;
};

export default function MedalSheet({
  title,
  imageUrl,
  eyebrow,
  description,
  destinationUrl,
  redemption,
  onClose,
}: {
  title: string;
  imageUrl: string;
  eyebrow: string;
  description?: string | null;
  destinationUrl?: string | null;
  redemption?: MedalSheetRedemption | null;
  onClose: () => void;
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const tiltRef = useRef(tilt);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  tiltRef.current = tilt;

  function clampTilt(value: number) {
    return Math.max(-TILT_LIMIT, Math.min(TILT_LIMIT, value));
  }

  function beginDrag(clientX: number, clientY: number) {
    const current = tiltRef.current;
    drag.current = { px: clientX, py: clientY, x: current.x, y: current.y };
    setDragging(true);
  }

  function moveDrag(clientX: number, clientY: number) {
    const start = drag.current;
    if (!start) return;
    setTilt({
      x: clampTilt(start.x - (clientY - start.py) * 0.35),
      y: clampTilt(start.y - (clientX - start.px) * 0.35),
    });
  }

  function endDrag() {
    drag.current = null;
    setDragging(false);
  }

  const [termsOpen, setTermsOpen] = useState(false);
  const [confirmingUse, setConfirmingUse] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
  }, []);

  function askToRedeem() {
    if (!redemption?.canRedeem || redemption.busy) return;
    if (!confirmingUse) {
      setConfirmingUse(true);
      if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
      confirmTimer.current = window.setTimeout(() => setConfirmingUse(false), 5000);
      return;
    }
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    setConfirmingUse(false);
    redemption.onRedeem();
  }

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      event.preventDefault();
      const touch = event.touches[0];
      beginDrag(touch.clientX, touch.clientY);
    };
    const move = (event: TouchEvent) => {
      if (!drag.current || event.touches.length !== 1) return;
      event.preventDefault();
      const touch = event.touches[0];
      moveDrag(touch.clientX, touch.clientY);
    };
    const end = (event: TouchEvent) => {
      if (drag.current) event.preventDefault();
      endDrag();
    };
    node.addEventListener("touchstart", start, { passive: false });
    node.addEventListener("touchmove", move, { passive: false });
    node.addEventListener("touchend", end, { passive: false });
    node.addEventListener("touchcancel", end);
    return () => {
      node.removeEventListener("touchstart", start);
      node.removeEventListener("touchmove", move);
      node.removeEventListener("touchend", end);
      node.removeEventListener("touchcancel", end);
    };
  }, []);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    beginDrag(event.clientX, event.clientY);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    moveDrag(event.clientX, event.clientY);
  }

  return (
    <div className="fixed inset-0 z-[280] flex items-center justify-center p-5 sm:p-8" role="dialog" aria-modal="true" aria-label={`Vista de ${title}`}>
      <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-2xl" aria-label="Cerrar vista de medalla" onClick={onClose} />
      <GlassPanel radius={32} className="relative z-10 h-fit w-full max-w-md self-center" style={{ width: "100%", height: "fit-content", flex: "0 0 auto" }} glassProps={GLASS}>
        <div className="relative flex flex-col items-center overflow-hidden px-7 py-8 sm:px-10">
          <button type="button" onClick={onClose} className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Cerrar">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--site-accent,#c9f24b)]">{eyebrow}</p>
          <div
            ref={stageRef}
            className="mt-10 grid w-[min(64vw,320px)] shrink-0 cursor-grab place-items-center select-none active:cursor-grabbing [perspective:900px]"
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              draggable={false}
              className="pointer-events-none h-auto w-full max-h-[min(64vw,320px)] object-contain [transform-style:preserve-3d]"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: dragging ? "none" : "transform 180ms ease-out",
                filter: `drop-shadow(${(-tilt.y * 0.35).toFixed(1)}px ${(tilt.x * 0.35).toFixed(1)}px 16px rgba(0,0,0,0.45))`,
                touchAction: "none",
              }}
            />
          </div>
          <h2 className="mt-10 w-full text-left text-2xl font-bold text-white sm:text-3xl">{title}</h2>
          {description ? <p className="mt-2 w-full text-left text-sm leading-relaxed text-white/65">{description}</p> : null}
          {redemption ? <div className="mt-5 w-full text-left text-sm text-white/65">
            <p><strong className="text-white">Usos disponibles:</strong> {redemption.unlimitedRedemptions ? "Ilimitados" : `${redemption.usesRemaining} de ${redemption.maxUses}`}</p>
            {redemption.expiresAt ? <p className="mt-1"><strong className="text-white">Vence:</strong> {new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" }).format(new Date(redemption.expiresAt))}</p> : null}
            {redemption.termsAndConditions ? <div className="mt-4 rounded-2xl bg-white/[0.05] px-4 py-3 text-left">
              <button type="button" onClick={() => setTermsOpen((open) => !open)} aria-expanded={termsOpen} className="flex w-full items-center justify-between gap-3 text-left text-white" aria-label={termsOpen ? "Mostrar menos términos" : "Mostrar más términos"}>
                <strong className="text-[12px]">Términos y condiciones</strong>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className={`shrink-0 transition-transform ${termsOpen ? "rotate-90" : "-rotate-90"}`}>
                  <path d="M15 5L8 12L15 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {termsOpen ? <p className="mt-2 whitespace-pre-wrap text-[11px] leading-[15px] text-white/65">{redemption.termsAndConditions}</p> : null}
            </div> : null}
            {redemption.message ? <p className={`mt-4 text-left text-sm font-semibold ${redemption.message.startsWith("Uso registrado") ? "text-[#c9f24b]" : "text-red-300"}`}>{redemption.message}</p> : null}
            {confirmingUse ? <button type="button" onClick={askToRedeem} disabled={redemption.busy} style={{ color: "#070707", backgroundColor: "#ffffff" }} className="mt-5 flex h-11 w-full items-center justify-center rounded-full px-5 text-[15px] font-medium disabled:cursor-not-allowed">Confirmar</button> : <GlassPanel radius={999} className={`mt-5 w-full shrink-0 ${!redemption.canRedeem || redemption.busy ? "opacity-40" : ""}`} style={{ height: 44, width: "100%" }} glassProps={GLASS}>
              <button type="button" onClick={askToRedeem} disabled={!redemption.canRedeem || redemption.busy} className="relative z-[1] flex h-11 w-full items-center justify-center px-5 text-[15px] font-medium text-white disabled:cursor-not-allowed">
                {redemption.busy ? "Registrando…" : redemption.canRedeem ? "Usar" : "Sin usos disponibles"}
              </button>
            </GlassPanel>}
            <p className="mt-3 text-left text-xs leading-relaxed text-white/30">La tienda sella esta medalla cupón. Los términos y condiciones solo los canjea el personal en tienda.</p>
          </div> : null}
          {destinationUrl ? <GlassPanel radius={999} className="mt-5 shrink-0" style={{ height: 44, width: "fit-content" }} glassProps={GLASS}>
            <a href={destinationUrl} target="_blank" rel="noopener noreferrer sponsored" className="relative z-[1] flex h-11 items-center px-5 text-[15px] font-medium" style={{ color: "#ffffff" }}>Conocer patrocinador</a>
          </GlassPanel> : null}
        </div>
      </GlassPanel>
    </div>
  );
}
