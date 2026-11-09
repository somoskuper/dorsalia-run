"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import GlassPanel from "@/components/ui/GlassPanel";

type Props = {
  fallbackHref?: string;
  onBack?: () => void;
  title?: string;
  trailingLink?: { href: string; label: string };
  rightAction?: ReactNode;
  saveFormId?: string;
  saveDisabled?: boolean;
  sticky?: boolean;
  overlayCover?: boolean;
  gradient?: boolean;
};

export default function PageHeader({ fallbackHref = "/", onBack, title, trailingLink, rightAction, saveFormId, saveDisabled = false, sticky = false, overlayCover = false, gradient = true }: Props) {
  const content = <div className="relative flex w-full items-center justify-between">
    <GlassIconButton aria-label="Volver" onClick={onBack || (() => { window.history.length > 1 ? window.history.back() : window.location.assign(fallbackHref); })}>
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Chevron_Right.svg" alt="" />
    </GlassIconButton>
    {title ? <h1 className="pointer-events-none absolute left-1/2 max-w-[calc(100%-110px)] -translate-x-1/2 truncate text-center text-[20px] font-semibold text-white">{title}</h1> : null}
    {trailingLink ? <GlassPanel radius={999} className="ml-auto shrink-0" style={{ width: 167, height: 44 }} glassProps={{ glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 }}>
      <Link href={trailingLink.href} className="grid h-full w-full place-items-center text-[16px] text-white">{trailingLink.label}</Link>
    </GlassPanel> : null}
    {saveFormId ? <GlassPanel radius={999} className="ml-auto shrink-0" style={{ width: 44, height: 44 }} glassProps={{ glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 }}>
      <button type="submit" form={saveFormId} aria-label="Guardar cambios" disabled={saveDisabled} className="grid h-full w-full place-items-center disabled:cursor-not-allowed disabled:opacity-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/settings-icons/check.svg" alt="" width={24} height={24} className="h-6 w-6" />
      </button>
    </GlassPanel> : null}
    {rightAction ? <div className="ml-auto flex items-center">{rightAction}</div> : null}
  </div>;
  if (!sticky) return content;
  return <header className={`sticky top-0 z-50 pb-5 pt-5 ${gradient ? "bg-gradient-to-b from-[#070707] via-[#070707]/95 to-transparent" : ""} ${overlayCover ? "px-5" : "-mx-[15px] px-[15px]"}`}>
    <div className={`mx-auto w-full ${overlayCover ? "" : "max-w-5xl"}`}>{content}</div>
  </header>;
}
