"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GlassPanel from "@/components/ui/GlassPanel";

const SESSION_KEY = "dorsalia:marketplace-session";
export const ANALYTICS_CONSENT_KEY = "dorsalia_analytics_consent_v1";
const LEGACY_CONSENT_KEY = "dorsalia_iniciar_marketing_consent_v1";
type Consent = "loading" | "accepted" | "rejected" | "undecided";

function sessionId() {
  let value = sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = `mp_${crypto.randomUUID()}`;
    sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}

export default function MarketplacePageMetrics() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  const [consent, setConsent] = useState<Consent>("loading");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ANALYTICS_CONSENT_KEY) || localStorage.getItem(LEGACY_CONSENT_KEY);
      setConsent(stored === "accepted" || stored === "rejected" ? stored : "undecided");
    } catch {
      setConsent("undecided");
    }
  }, []);

  useEffect(() => {
    if (consent !== "accepted") return;
    if (!pathname || !["dorsalia.run", "www.dorsalia.run"].includes(window.location.hostname)) return;
    // EventMetrics already records event detail views with their race_event_id.
    if (/^\/carreras\/[^/]+\/[^/]+\/[^/]+\/?$/.test(pathname) || /^\/evento\/[^/]+\/?$/.test(pathname)) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    void createClient().rpc("record_marketplace_page_view", {
      p_path: pathname,
      p_session_id: sessionId(),
      p_referrer: document.referrer || null,
      p_device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      p_country: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    }).then(({ error }) => {
      if (error) console.warn("No se pudo registrar la visita del marketplace:", error.message);
    });
  }, [consent, pathname]);

  function choose(nextConsent: "accepted" | "rejected") {
    try {
      localStorage.setItem(ANALYTICS_CONSENT_KEY, nextConsent);
      // Mantiene la decisión tomada previamente en /iniciar.
      localStorage.setItem(LEGACY_CONSENT_KEY, nextConsent);
    } catch { /* Private browsing puede impedir storage. */ }
    setConsent(nextConsent);
    window.dispatchEvent(new CustomEvent("dorsalia:analytics-consent", { detail: nextConsent }));
  }

  if (consent !== "undecided") return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] max-h-[68dvh] overflow-y-auto rounded-[28px] shadow-[0_16px_48px_rgba(0,0,0,0.45)] sm:inset-x-5 sm:bottom-5 sm:mx-auto sm:max-w-[1180px] sm:max-h-none">
      <GlassPanel radius={28} style={{ width: "100%" }} glassProps={{ glassColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 }}>
        <div role="dialog" aria-labelledby="marketplace-cookie-title" aria-describedby="marketplace-cookie-description" className="flex w-full flex-col gap-5 p-5 text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.9)] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div className="max-w-3xl">
            <h2 id="marketplace-cookie-title" className="text-[23px] font-bold leading-tight sm:text-[19px]">Usamos cookies</h2>
            <p id="marketplace-cookie-description" className="mt-3 text-[14px] leading-[1.55] text-white sm:mt-1 sm:text-[13px]">
              Usamos el píxel nativo de Kuper y Meta Pixel para medir visitas, fichas de eventos e interacciones como crear una cuenta. Puedes seguir usando Dorsalia sin activarlos. <a href="/cookies" className="underline underline-offset-2">Política de cookies</a>.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={() => choose("rejected")} className="min-h-12 rounded-full border border-white/50 bg-black/60 px-3 py-2 text-center text-[13px] font-semibold text-white sm:px-5">Solo necesarias</button>
            <button type="button" onClick={() => choose("accepted")} className="min-h-12 rounded-full bg-[#c5e500] px-3 py-2 text-center text-[13px] font-semibold text-black [text-shadow:none] sm:px-5">Aceptar analítica</button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
