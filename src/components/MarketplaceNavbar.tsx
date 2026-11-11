"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import FullScreenMenu from "@/components/FullScreenMenu";
import { useMarketplaceSearch } from "@/components/MarketplaceSearchProvider";
import Button from "@/components/ui/Button";
import GlassPanel from "@/components/ui/GlassPanel";
import AssetIcon from "@/components/ui/AssetIcon";
import DesktopNavigation from "@/components/DesktopNavigation";
import { createClient } from "@/lib/supabase/client";
import {
  DESK_DIVIDER_H,
  DESK_FILTER_H,
  DESK_FILTER_W,
  DESK_LOGO_H,
  DESK_PAGE_PX,
  DESK_RAIL_W,
  DESK_SEARCH_H,
  DESK_SEARCH_PL,
  DESK_SEARCH_PY,
  DESK_SEARCH_RADIUS,
  DESK_SEARCH_W,
  DESK_TOPBAR_H,
} from "@/lib/appChrome";
import {
  countActiveFilters,
  filtersFromSearchParams,
  writeFiltersToSearchParams,
} from "@/lib/raceSearch";
import { PORTAL_URL } from "@/lib/races";
import AvatarImage from "@/components/ui/AvatarImage";

const LOGO_DESK = "/branding/Logo-dorsaliarun.svg";
const ICON_FILTERS = "/branding/filtros-icon.svg";
const ICON_MENU = "/branding/Hamburger_MD.svg";
/** Temporarily hide divider + filters icon in the search bar. */
const SHOW_SEARCH_FILTERS = false;

export default function MarketplaceNavbar(_props: { overlay?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, profile } = useAthleteAuth();
  const { toggleFilters } = useMarketplaceSearch();
  const urlQ = searchParams.get("q") || "";
  const [q, setQ] = useState(urlQ);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuId = useId();
  const debounceRef = useRef<number | null>(null);
  const skipFirst = useRef(true);
  const activeFilterCount = countActiveFilters(
    filtersFromSearchParams(new URLSearchParams(searchParams.toString())),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.id) { setUnreadCount(0); return; }
    let active = true;
    const refresh = async () => {
      const { data } = await createClient().rpc("my_social_notifications", { p_limit: 1 });
      if (active) setUnreadCount(Number((data as { unread_count?: number } | null)?.unread_count) || 0);
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20000);
    window.addEventListener("dorsalia:social-updated", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("dorsalia:social-updated", refresh); };
  }, [user?.id]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      const trimmed = q.trim();
      if ((searchParams.get("q") || "").trim() === trimmed) return;
      const targetPath = pathname === "/" ? pathname : "/";
      const base =
        pathname === "/"
          ? new URLSearchParams(searchParams.toString())
          : new URLSearchParams();
      const filters = filtersFromSearchParams(base);
      const params = writeFiltersToSearchParams(base, { ...filters, q: trimmed });
      if (pathname === "/") {
        const e = searchParams.get("e");
        if (e) params.set("e", e);
        const status = searchParams.get("status");
        if (status) params.set("status", status);
      }
      const qs = params.toString();
      router.replace(qs ? `${targetPath}?${qs}` : targetPath, { scroll: false });
    }, 280);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q, pathname, router, searchParams]);

  function onOpenFilters() {
    if (pathname !== "/") {
      router.push("/");
      window.setTimeout(() => toggleFilters(), 80);
      return;
    }
    toggleFilters();
  }

  const showAccount = mounted && !loading && !!user;
  const accountHref = showAccount ? "/cuenta" : "/auth?mode=register";
  const accountLabel = showAccount ? "Mi cuenta" : "Entrar";

  const accountScreen = pathname.startsWith("/cuenta") || pathname.startsWith("/miscompras");

  const headerClass = `${pathname.startsWith("/review") ? "hidden lg:block" : ""} ${showAccount
    ? "sticky top-0 z-40 w-full bg-[#070707] lg:fixed lg:inset-x-0 lg:top-0"
    : "sticky top-0 z-50 w-full bg-[#070707]"}`;

  return (
    <header
      className={headerClass}
      style={undefined}
    >
      <DesktopNavigation />
      <div
        className="hidden"
        style={{
          height: DESK_TOPBAR_H,
          paddingLeft: DESK_PAGE_PX,
          paddingRight: DESK_PAGE_PX,
        }}
      >
        <Link
          href="/"
          className="relative z-10 inline-flex shrink-0 items-center"
          aria-label="Dorsalia — inicio"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_DESK}
            alt="Dorsalia"
            width={142}
            height={DESK_LOGO_H}
            className="w-auto"
            style={{ height: DESK_LOGO_H }}
          />
        </Link>

        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <GlassPanel
            radius={DESK_SEARCH_RADIUS}
            className="pointer-events-auto shrink-0"
            style={{ width: DESK_SEARCH_W, height: DESK_SEARCH_H }}
            glassProps={{ glassColor: "rgba(255,255,255,0)" }}
          >
            <div className="flex h-full w-full items-center">
              <div
                className={`flex h-full items-center ${SHOW_SEARCH_FILTERS ? "w-[70%] pr-2" : "w-full"}`}
                style={{
                  paddingLeft: DESK_SEARCH_PL,
                  paddingRight: SHOW_SEARCH_FILTERS ? undefined : DESK_SEARCH_PL,
                  paddingTop: DESK_SEARCH_PY,
                  paddingBottom: DESK_SEARCH_PY,
                }}
              >
                <AssetIcon name="search" size={20} className="mr-3 text-white/45" />
                <input
                  name="q"
                  value=""
                  readOnly
                  onFocus={() => router.push("/buscar")}
                  onClick={() => router.push("/buscar")}
                  placeholder="Buscar eventos o usuarios…"
                  className="w-full bg-transparent text-left text-[1rem] leading-none text-white outline-none placeholder:text-[#888888]"
                  aria-label="Abrir búsqueda"
                  autoComplete="off"
                />
              </div>
              {SHOW_SEARCH_FILTERS ? (
                <>
                  <span
                    className="w-[2px] shrink-0 self-center bg-[#888888]"
                    style={{ height: DESK_DIVIDER_H }}
                    aria-hidden
                  />
                  <div
                    className="relative flex h-full w-[30%] items-center justify-end pl-2"
                    style={{
                      paddingRight: DESK_SEARCH_PL,
                      paddingTop: DESK_SEARCH_PY,
                      paddingBottom: DESK_SEARCH_PY,
                    }}
                  >
                    <button
                      type="button"
                      data-mp-filters-trigger
                      onClick={onOpenFilters}
                      className="grid shrink-0 place-items-center opacity-80 transition-opacity hover:opacity-100"
                      aria-label="Abrir filtros"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ICON_FILTERS}
                        alt=""
                        width={DESK_FILTER_W}
                        height={DESK_FILTER_H}
                        style={{ width: DESK_FILTER_W, height: DESK_FILTER_H }}
                      />
                      {activeFilterCount > 0 ? (
                        <span className="absolute right-1.5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#c5e500] px-1 text-[10px] font-bold text-black">
                          {activeFilterCount}
                        </span>
                      ) : null}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </GlassPanel>
        </div>

        <nav className="relative z-10 ml-auto flex shrink-0 items-center gap-2 pl-3">
          <Button variant="tertiary" href={PORTAL_URL}>
            Organizador
          </Button>
          {!showAccount ? (
            <Button variant="secondary" href={accountHref}>
              {accountLabel}
            </Button>
          ) : null}
        </nav>
      </div>

      <div className={accountScreen ? "hidden" : "flex h-[65px] w-full items-center justify-between px-5 lg:hidden"}>
          <div className="flex items-center gap-4">
            {showAccount ? (
              <Link href={accountHref} aria-label="Mi perfil" className="grid h-[43px] w-[43px] shrink-0 place-items-center overflow-hidden rounded-[21.5px] bg-white/[0.08]">
                {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} size={43} className="h-full w-full object-cover" /> : /* eslint-disable-next-line @next/next/no-img-element */<img src="/mobile-home/imgUserStroke2.svg" alt="" width={30} height={30} />}
              </Link>
            ) : null}
            <Link href="/" aria-label="Dorsalia — inicio">
              {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/mobile-home/imgGroup41.svg" alt="Dorsalia" width={154} height={22} />
            </Link>
          </div>
          <div className="flex items-center gap-2">
          {showAccount ? (
            <Link href="/?vista=actividad" aria-label={unreadCount ? `Actividad: ${unreadCount} notificaciones nuevas` : "Actividad y notificaciones"} className="relative grid h-[43px] w-[43px] shrink-0 place-items-center rounded-[21.5px] bg-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/mobile-home/imgGroup42.svg" alt="" width={19} height={25} />
              {unreadCount > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#c9f24b] px-1 text-[10px] font-bold text-black">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
            </Link>
          ) : (
            <Link href="/auth" className="grid h-[43px] shrink-0 place-items-center rounded-full bg-white px-4 text-[16px] font-bold" style={{ color: "#000" }}>Únete</Link>
          )}
          <button type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen((v) => !v)} className="grid h-[43px] w-[43px] shrink-0 place-items-center rounded-[21.5px] bg-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={ICON_MENU} alt="" width={40} height={40} />
          </button>
          </div>
      </div>

      <FullScreenMenu
        id={menuId}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        joinHref={showAccount ? "/cuenta" : "/auth?mode=register"}
        joinLabel={showAccount ? "Mi cuenta" : "Únete"}
      />
    </header>
  );
}
