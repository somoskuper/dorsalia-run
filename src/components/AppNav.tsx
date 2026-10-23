"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import FullScreenMenu from "@/components/FullScreenMenu";
import AssetIcon from "@/components/ui/AssetIcon";
import { DESK_ICON, DESK_NAV_GAP, DESK_RAIL_W } from "@/lib/appChrome";

const ICON_MENU = "/branding/Hamburger_MD.svg";
const ICON_SETTINGS = "/branding/Settings.svg";

type TabId = "home" | "guardados" | "historial" | "perfil";

function NavIcon({ id, active }: { id: TabId; active: boolean }) {
  const name = id === "home" ? (active ? "home-2" : "home-stroke")
    : id === "guardados" ? (active ? "heart-solid" : "heart-stroke")
      : (active ? "ticket-solid" : "ticket-stroke");
  return <AssetIcon name={name} size={24} className={active ? "text-white" : "text-white/40"} />;
}

export default function AppNav() {
  const { user, loading, profile } = useAthleteAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (!mounted || loading || !user) return null;

  const avatarUrl = profile.avatarUrl;
  const tabParam = (searchParams.get("tab") || "").toLowerCase();

  const activeTab: TabId =
    pathname === "/" || pathname === ""
      ? "home"
      : pathname.startsWith("/cuenta")
        ? tabParam === "guardados"
          ? "guardados"
          : tabParam === "historial"
            ? "historial"
            : "perfil"
        : "home";

  const items: {
    id: TabId;
    href: string;
    label: string;
  }[] = [
    { id: "home", href: "/", label: "Eventos" },
    {
      id: "guardados",
      href: "/cuenta?tab=guardados",
      label: "Guardado",
    },
    {
      id: "historial",
      href: "/cuenta?tab=historial",
      label: "Compras",
    },
  ];

  const deskIconStyle = { width: DESK_ICON, height: DESK_ICON };
  const profileActive = activeTab === "perfil";

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden h-dvh flex-col bg-[#070707] md:flex"
        style={{ width: DESK_RAIL_W }}
        aria-label="Navegación"
      >
        <nav className="flex h-full flex-col items-center px-0 py-[15px]">
          <button
            type="button"
            className="grid shrink-0 place-items-center"
            style={deskIconStyle}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ICON_MENU}
              alt=""
              width={DESK_ICON}
              height={DESK_ICON}
              style={deskIconStyle}
            />
          </button>

          <div className="mt-[22px] flex flex-col items-center" style={{ gap: DESK_NAV_GAP }}>
            {items.map((item) => {
              const active = activeTab === item.id;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative grid shrink-0 place-items-center"
                  style={deskIconStyle}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  <NavIcon id={item.id} active={active} />
                  {active ? (
                    <span
                      className="absolute -left-[3px] top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[#c5e500]"
                      aria-hidden
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto flex flex-col items-center" style={{ gap: DESK_NAV_GAP }}>
            <Link
              href="/cuenta?tab=perfil"
              className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 ${
                profileActive ? "ring-2 ring-[#c5e500] ring-offset-1 ring-offset-[#070707]" : ""
              }`}
              style={deskIconStyle}
              aria-label="Mi cuenta"
              aria-current={profileActive ? "page" : undefined}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  width={DESK_ICON}
                  height={DESK_ICON}
                  className="object-cover"
                  style={deskIconStyle}
                />
              ) : (
                <AssetIcon name="user-stroke" size={24} className="text-white" />
              )}
            </Link>
            <Link
              href="/cuenta?tab=perfil"
              className="grid shrink-0 place-items-center"
              style={deskIconStyle}
              aria-label="Configuración"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ICON_SETTINGS}
                alt=""
                width={DESK_ICON}
                height={DESK_ICON}
                style={{
                  ...deskIconStyle,
                  opacity: profileActive ? 1 : 0.4,
                }}
              />
            </Link>
          </div>
        </nav>
      </aside>

      <FullScreenMenu
        id={menuId}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        joinHref="/cuenta"
        joinLabel="Mi cuenta"
      />

      <nav
        className="fixed inset-x-4 z-40 mx-auto grid max-w-md grid-cols-4 items-center rounded-[28px] border border-white/10 bg-[#212121] px-2 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.35)] md:hidden"
        style={{ bottom: "max(12px, env(safe-area-inset-bottom))" }}
        aria-label="Navegación"
      >
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl ${active ? "text-white" : "text-white/50"}`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon id={item.id} active={active} />
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/cuenta?tab=perfil"
          className={`flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl ${profileActive ? "text-white" : "text-white/50"}`}
          aria-label="Perfil"
          aria-current={profileActive ? "page" : undefined}
        >
          <span className={`grid h-6 w-6 place-items-center overflow-hidden rounded-full ${profileActive ? "ring-2 ring-[#c5e500]" : ""}`}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" width={24} height={24} className="h-6 w-6 object-cover" />
            ) : (
              <AssetIcon name="user-stroke" size={24} />
            )}
          </span>
          <span className="text-[11px] font-medium leading-none">Perfil</span>
        </Link>
      </nav>
    </>
  );
}
