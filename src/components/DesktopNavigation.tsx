"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import AssetIcon from "@/components/ui/AssetIcon";
import { PORTAL_URL } from "@/lib/races";

const EDITOR_URL = process.env.NEXT_PUBLIC_EDITOR_URL || "https://editor.dorsalia.run";
const linkClass = "block rounded-lg px-3 py-2 text-[16px] text-white/75 transition hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white";
const triggerClass = "cursor-pointer list-none rounded-lg px-2 py-2 text-[16px] font-semibold text-white/75 transition hover:text-white focus-visible:outline-2 focus-visible:outline-[#c9f24b] [&::-webkit-details-marker]:hidden";

function NavGroup({ label, children, align = "left", wide = false }: { label: string; children: ReactNode; align?: "left" | "right"; wide?: boolean }) {
  const pathname = usePathname();
  return <details key={`${label}-${pathname}`} data-desktop-nav-group className="group relative shrink-0" onToggle={(event) => {
    const activeGroup = event.currentTarget;
    if (!activeGroup.open) return;
    document.querySelectorAll<HTMLDetailsElement>("details[data-desktop-nav-group]").forEach((group) => {
      if (group !== activeGroup) group.open = false;
    });
  }} onClick={(event) => {
    if ((event.target as HTMLElement).closest("a")) event.currentTarget.open = false;
  }} onKeyDown={(event) => {
    if (event.key === "Escape") event.currentTarget.open = false;
  }}>
    <summary className={triggerClass}>{label} <span className="ml-0.5 text-[10px] text-white/45 group-open:rotate-180">▾</span></summary>
    <div className={`absolute top-full z-[70] mt-2 rounded-xl border border-white/15 bg-[#171717] p-3 shadow-2xl ${align === "right" ? "right-0" : "left-0"} ${wide ? "w-[min(650px,calc(100vw-80px))]" : "min-w-[215px]"}`}>
      {children}
    </div>
  </details>;
}

export default function DesktopNavigation() {
  const pathname = usePathname();
  const { user, loading } = useAthleteAuth();
  const signedIn = !loading && !!user;
  return <div className="hidden h-[63px] w-full items-center gap-3 px-5 lg:flex xl:gap-5" aria-label="Navegación principal">
    <Link href="/" className="shrink-0" aria-label="Dorsalia — inicio">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/branding/Logo-dorsaliarun.svg" alt="Dorsalia" className="h-9 w-auto" />
    </Link>
    <nav className="ml-2 flex shrink-0 items-center gap-1" aria-label="Secciones">
      <Link href="/calendario" className={`rounded-lg px-2 py-2 text-[16px] font-semibold hover:text-white ${pathname.startsWith("/calendario") ? "text-[#c9f24b]" : "text-white/75"}`}>Calendario</Link>
      <Link href="/fotos" className={`rounded-lg px-2 py-2 text-[16px] font-semibold hover:text-white ${pathname.startsWith("/fotos") ? "text-[#c9f24b]" : "text-white/75"}`}>Fotos</Link>
      <NavGroup label="Explorar" wide><div className="grid grid-cols-3 gap-3">
        <div><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">Ubicación</p>
          {[["campeche","Campeche"],["quintana-roo","Quintana Roo"],["yucatan","Yucatán"],["tamaulipas","Tamaulipas"],["coahuila","Coahuila"],["guanajuato","Guanajuato"]].map(([slug,label])=><Link key={slug} href={`/carreras/${slug}`} className={linkClass}>{label}</Link>)}
        </div><div><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">Disciplina</p>
          {[["running","Running"],["triathlon","Triatlón"],["swimming","Natación"]].map(([slug,label])=><Link key={slug} href={`/carreras/${slug}`} className={linkClass}>{label}</Link>)}
          <Link href="/carreras" className={linkClass}>Todas las carreras</Link>
        </div><div><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">Precio</p>
          {[["/?pmax=0","Eventos gratis"],["/?pmin=1&pmax=300","Hasta $300"],["/?pmin=301&pmax=500","$301 a $500"],["/?pmin=501","Más de $500"],["/carreras","Todos los eventos"]].map(([href,label])=><Link key={href} href={href} className={linkClass}>{label}</Link>)}
        </div>
      </div></NavGroup>
      <NavGroup label="Organizar"><a href={PORTAL_URL} className={linkClass}>Crear tu evento</a><a href={EDITOR_URL} className={linkClass}>Editor web</a></NavGroup>
      <NavGroup label="Más"><a href="/#siguenos" className={linkClass}>Síguenos</a><a href="mailto:contacto@dorsalia.run" className={linkClass}>Ayuda</a><Link href="/privacidad" className={linkClass}>Privacidad</Link><Link href="/terminos" className={linkClass}>Términos</Link></NavGroup>
    </nav>
    <Link href="/buscar" className="ml-auto flex h-10 min-w-[150px] max-w-[250px] flex-1 items-center gap-2 rounded-2xl border border-white/15 bg-white/[.06] px-3 text-white/45 hover:border-white/30" aria-label="Buscar eventos o usuarios"><AssetIcon name="search" size={20} /><span className="truncate text-[16px]">Buscar eventos…</span></Link>
    <NavGroup label={signedIn ? "Mi perfil" : "Entrar"} align="right">
      {signedIn ? <><Link href="/cuenta?tab=perfil" className={linkClass}>Mi perfil</Link><Link href="/cuenta?tab=guardados" className={linkClass}>Guardados</Link><Link href="/miscompras" className={linkClass}>Compras</Link><Link href="/settings" className={linkClass}>Configuración</Link></> : <><Link href="/auth?mode=login" className={linkClass}>Iniciar sesión</Link><Link href="/auth?mode=register" className={linkClass}>Crear cuenta</Link></>}
    </NavGroup>
  </div>;
}
