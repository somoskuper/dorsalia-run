"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import FullScreenMenu from "@/components/FullScreenMenu";
import AssetIcon from "@/components/ui/AssetIcon";
import { DESK_ICON, DESK_NAV_GAP, DESK_RAIL_W } from "@/lib/appChrome";
import AvatarImage from "@/components/ui/AvatarImage";

const ICON_MENU = "/branding/Hamburger_MD.svg";
const ICON_SETTINGS = "/branding/Settings.svg";

type TabId = "feed" | "guardados" | "eventos" | "resenas" | "historial" | "perfil";

function NavIcon({ id, active }: { id: TabId; active: boolean }) {
  const name = id === "feed" || id === "eventos" ? (active ? "home-2" : "home-stroke")
    : id === "guardados" ? (active ? "heart-solid" : "heart-stroke")
      : (active ? "ticket-solid" : "ticket-stroke");
  return <AssetIcon name={name} size={24} className={active ? "text-white" : "text-white/40"} />;
}

export default function AppNav({ inDocumentFlow = false }: { inDocumentFlow?: boolean }) {
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

  if (!mounted || loading) return null;

  const avatarUrl = profile.avatarUrl;
  const tabParam = (searchParams.get("tab") || "").toLowerCase();

  const activeTab: TabId =
    pathname === "/" || pathname === ""
      ? searchParams.get("vista") === "feed" ? "feed" : "eventos"
      : pathname.startsWith("/miscompras") ? "historial"
      : pathname.startsWith("/review") ? "resenas"
      : pathname.startsWith("/cuenta")
        ? tabParam === "guardados"
          ? "guardados"
          : tabParam === "historial"
            ? "historial"
            : "perfil"
        : "eventos";

  const items: {
    id: TabId;
    href: string;
    label: string;
  }[] = [
    { id: "feed", href: "/?vista=feed", label: "Feed" },
    {
      id: "guardados",
      href: "/cuenta?tab=guardados",
      label: "Guardado",
    },
    {
      id: "eventos",
      href: "/?vista=eventos",
      label: "Eventos",
    },
    {
      id: "resenas",
      href: "/review",
      label: "Reseñas",
    },
    {
      id: "historial",
      href: "/miscompras",
      label: "Compras",
    },
  ];

  const deskIconStyle = { width: DESK_ICON, height: DESK_ICON };
  const profileActive = activeTab === "perfil";

  return (
    <>
      <aside
        className="hidden"
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
                <AvatarImage src={avatarUrl} size={DESK_ICON} className="object-cover" />
              ) : (
                <AssetIcon name="user-stroke" size={24} className="text-white" />
              )}
            </Link>
            {user ? (
              <Link
                href="/settings"
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
            ) : null}
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
        className={`${inDocumentFlow ? "relative mx-auto my-3" : "fixed inset-x-4 z-40 mx-auto"} flex h-[67px] max-w-[363px] items-center justify-between gap-[5px] rounded-[24px] border border-white/10 bg-[rgba(45,45,45,0.6)] p-[6px] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-lg lg:hidden`}
        style={inDocumentFlow ? undefined : { bottom: "max(12px, env(safe-area-inset-bottom))" }}
        aria-label="Navegación"
      >
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-[18px] py-[5px] text-white ${active ? "bg-black/35" : ""}`}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/tapbar/${item.id}.svg`} alt="" width={30} height={30} className="h-[30px] w-[30px]" style={{ filter: active ? "brightness(0) saturate(100%) invert(89%) sepia(73%) saturate(1087%) hue-rotate(7deg)" : "brightness(0) invert(1)" }} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
