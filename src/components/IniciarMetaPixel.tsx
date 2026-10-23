"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const PIXEL_ID = "1028852339555991";
const CONSENT_KEY = "dorsalia_analytics_consent_v1";
const LEGACY_CONSENT_KEY = "dorsalia_iniciar_marketing_consent_v1";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: unknown;
};

function loadPixel() {
  if (typeof window === "undefined" || window.fbq) return;

  const fbq = function (...args: unknown[]) {
    const pixel = window.fbq as PixelFunction;
    if (pixel.callMethod) pixel.callMethod(...args);
    else pixel.queue.push(args);
  } as PixelFunction;

  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", PIXEL_ID);
}

export function trackMetaEvent(eventName: string, details?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  loadPixel();
  window.fbq?.("track", eventName, details);
}

export default function IniciarMetaPixel() {
  const [accepted, setAccepted] = useState(false);
  const pathname = usePathname();
  const lastPage = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY) || localStorage.getItem(LEGACY_CONSENT_KEY);
      if (stored === "accepted") setAccepted(true);
    } catch { /* Private browsing puede impedir storage. */ }

    const onConsent = (event: Event) => {
      if ((event as CustomEvent<unknown>).detail === "accepted") setAccepted(true);
    };
    window.addEventListener("dorsalia:analytics-consent", onConsent);
    return () => window.removeEventListener("dorsalia:analytics-consent", onConsent);
  }, []);

  useEffect(() => {
    if (!accepted || lastPage.current === pathname) return;
    trackMetaEvent("PageView");
    lastPage.current = pathname;
  }, [accepted, pathname]);

  return null;
}

export function trackMetaCreateAccount(source: string, raceEventId?: string) {
  if (typeof window === "undefined") return;
  loadPixel();
  const details = {
    content_name: "Crear cuenta",
    content_category: "Dorsalia",
    source,
    race_event_id: raceEventId || undefined,
  };
  window.fbq?.("track", "Lead", details);
  window.fbq?.("trackCustom", "CreateAccountClick", details);
}

export function IniciarPortalCta({ href, source }: { href: string; source: string }) {
  return (
    <a
      href={href}
      rel="noopener noreferrer"
      onClick={() => {
        if (typeof window.fbq === "function") {
          window.fbq("track", "Contact", { content_name: "Dorsalia", source });
        }
      }}
      className="ds-btn ds-btn--primary !border-white/10 !px-[23px] !py-[10px] !text-[16px] !font-medium"
    >
      Comienza gratis
    </a>
  );
}
