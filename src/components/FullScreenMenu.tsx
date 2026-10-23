"use client";

import Link from "next/link";
import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import Button from "@/components/ui/Button";
import { PORTAL_URL } from "@/lib/races";

const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL || "https://editor.dorsalia.run";

const CLOSE_ICON = "/assetsdev/Close_LG.svg";
const CHEVRON_ICON = "/assetsdev/Chevron_Right.svg";
const LOGO = "/branding/Logo-dorsaliarun.svg";

const SOCIAL = [
  { key: "whatsapp", href: "https://wa.me/5210000000000", src: "/assetsdev/Social-Icons.svg", label: "WhatsApp" },
  { key: "instagram", href: "https://instagram.com/dorsalia", src: "/assetsdev/Social-Icons-5.svg", label: "Instagram" },
  { key: "facebook", href: "https://facebook.com/dorsalia", src: "/assetsdev/Social-Icons-4.svg", label: "Facebook" },
  { key: "tiktok", href: "https://www.tiktok.com/@dorsalia", src: "/assetsdev/Social-Icons-3.svg", label: "TikTok" },
  { key: "youtube", href: "https://youtube.com/@dorsalia", src: "/assetsdev/Social-Icons-2.svg", label: "YouTube" },
  { key: "x", href: "https://x.com/dorsalia", src: "/assetsdev/Social-Icons-1.svg", label: "X" },
] as const;

const BASE_LINKS = [
  { label: "Crear tu evento", href: PORTAL_URL, external: true },
  { label: "Editor web", href: EDITOR_URL, external: true },
  { label: "Privacidad", href: "/privacidad" },
  { label: "Terminos", href: "/terminos" },
  { label: "Siguenos", href: "#siguenos" },
  { label: "Ayuda", href: "mailto:hola@dorsalia.run", external: true },
] as const;

const ANIM_MS = 380;

export type FullScreenMenuProps = {
  open: boolean;
  onClose: () => void;
  id?: string;
  /** CTA when logged out */
  joinHref?: string;
  joinLabel?: string;
};

function MenuChevron() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={CHEVRON_ICON}
      alt=""
      width={29}
      height={29}
      className="mp-menu-chevron h-[29px] w-[29px] shrink-0"
      aria-hidden
    />
  );
}

const LINK_CLASS =
  "mp-menu-link flex w-full items-center justify-between gap-3 text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-white";

function MenuRow({
  children,
  className,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a
      {...rest}
      className={[LINK_CLASS, className || ""].join(" ")}
      style={{ paddingRight: 20, ...(rest.style || {}) }}
    >
      <span className="min-w-0">{children}</span>
      <MenuChevron />
    </a>
  );
}

/**
 * Full-viewport hamburger menu (100% × 100%).
 * Used from mobile navbar and desktop rail.
 */
export default function FullScreenMenu({
  open,
  onClose,
  id,
  joinHref = "/auth?mode=register",
  joinLabel = "Únete",
}: FullScreenMenuProps) {
  const { user, loading, profile } = useAthleteAuth();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const loggedIn = !loading && !!user;

  const avatarUrl = profile.avatarUrl;
  const displayName = profile.fullName;
  const initials = (displayName[0] || "A").toUpperCase();

  const links = loggedIn
    ? [
        ...BASE_LINKS.slice(0, 2),
        { label: "Configuración", href: "/cuenta?tab=perfil" },
        ...BASE_LINKS.slice(2),
      ]
    : [...BASE_LINKS];

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      id={id}
      className="fixed inset-0 z-[100] flex h-dvh w-full flex-col bg-[#070707] will-change-transform"
      style={{
        transition: `transform ${ANIM_MS}ms ease, opacity ${ANIM_MS}ms ease`,
        opacity: visible ? 1 : 0.96,
        transform: visible ? "translateX(0)" : "translateX(-100%)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
    >
      {/* Sticky top bar — only profile / Únete + close stay fixed */}
      <div
        className="sticky top-0 z-10 flex shrink-0 items-center justify-between bg-[#070707]"
        style={{ paddingTop: 12, paddingBottom: 8 }}
      >
        <div style={{ paddingLeft: 20 }}>
          {loggedIn ? (
            <Link
              href="/cuenta?tab=perfil"
              onClick={onClose}
              className="flex items-center gap-3"
              aria-label={displayName}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">{initials}</span>
                )}
              </span>
              <span className="text-[18px] font-semibold leading-tight text-white">{displayName}</span>
            </Link>
          ) : (
            <Button variant="tertiary" href={joinHref}>
              {joinLabel}
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid place-items-center text-white"
          style={{ paddingRight: 20 }}
          aria-label="Cerrar menú"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CLOSE_ICON}
            alt=""
            width={35}
            height={35}
            className="h-[35px] w-[35px]"
          />
        </button>
      </div>

      {/* Body: mobile scrolls all; desk pins footer to bottom */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:overflow-hidden">
        <nav
          className="md:min-h-0 md:flex-1 md:overflow-y-auto"
          style={{ paddingLeft: 20, paddingTop: 33, paddingBottom: 24 }}
        >
          <ul className="flex w-full flex-col" style={{ gap: 20 }}>
            {links.map((item) => {
              const label = item.label;
              if (item.href.startsWith("#")) {
                return (
                  <li key={label}>
                    <MenuRow
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        window.setTimeout(() => {
                          document.getElementById("siguenos")?.scrollIntoView({ behavior: "smooth" });
                        }, ANIM_MS);
                      }}
                    >
                      {label}
                    </MenuRow>
                  </li>
                );
              }
              const isExternal = "external" in item && item.external;
              if (isExternal) {
                return (
                  <li key={label}>
                    <MenuRow
                      href={item.href}
                      rel="noopener noreferrer"
                      target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                      onClick={onClose}
                    >
                      {label}
                    </MenuRow>
                  </li>
                );
              }
              return (
                <li key={label}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={LINK_CLASS}
                    style={{ paddingRight: 20 }}
                  >
                    <span className="min-w-0">{label}</span>
                    <MenuChevron />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Desk: pinned bottom · 30px padding inferior */}
        <div
          className="mt-auto flex shrink-0 flex-col gap-8 pt-2 md:flex-row md:items-end md:justify-between"
          style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 30 }}
        >
          <div className="max-w-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt="Dorsalia"
              width={100}
              height={28}
              className="h-auto w-[100px]"
            />
            <p className="mt-3 text-[16px] leading-relaxed font-normal" style={{ color: "#9B9B9B" }}>
              Bienvenido a{" "}
              <span style={{ color: "#FFFFFF" }}>Dorsalia Run</span>
              , una plataforma para eventos deportivos, aquí podrás encontrar{" "}
              <span style={{ color: "#FFFFFF" }}>los mejores eventos deportivos</span>{" "}
              integrados con la mejor tecnología.
            </p>
          </div>

          <div id="siguenos" className="md:text-right">
            <p className="text-[12px] text-white/70">Síguenos</p>
            <div className="mt-3 flex items-center gap-3 md:justify-end">
              {SOCIAL.map((s) => (
                <a
                  key={s.key}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-9 w-9 place-items-center rounded-full transition-opacity hover:opacity-80"
                  aria-label={s.label}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="" width={24} height={24} className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
