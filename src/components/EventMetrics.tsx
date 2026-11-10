"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import { trackMetaEvent } from "@/components/IniciarMetaPixel";
import AssetIcon from "@/components/ui/AssetIcon";

export type EventMetricSnapshot = {
  views: number;
  saves: number;
};

const API_BASE = `${(process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.dorsalia.run").replace(/\/$/, "")}/sites/v1`;
const REFRESH_MS = 10_000;
const CONSENT_KEY = "dorsalia_analytics_consent_v1";
const LEGACY_CONSENT_KEY = "dorsalia_iniciar_marketing_consent_v1";

function formatCount(value: number) {
  return new Intl.NumberFormat("es-MX").format(Math.max(0, value || 0));
}

function getSessionId() {
  const key = "dorsalia:marketplace-session";
  let value = sessionStorage.getItem(key);
  if (!value) {
    value = `mp_${crypto.randomUUID()}`;
    sessionStorage.setItem(key, value);
  }
  return value;
}

export default function EventMetrics({ raceEventId, onChange }: { raceEventId: string; onChange?: (metrics: EventMetricSnapshot) => void }) {
  const { user } = useAthleteAuth();
  const [registered, setRegistered] = useState(false);
  const [metrics, setMetrics] = useState<EventMetricSnapshot>({ views: 0, saves: 0 });
  const [ready, setReady] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);
  const lastViews = useRef<number | null>(null);
  const metaTracked = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY) || localStorage.getItem(LEGACY_CONSENT_KEY);
      setAnalyticsAllowed(stored === "accepted");
    } catch { /* storage puede no estar disponible */ }
    const onConsent = (event: Event) => setAnalyticsAllowed((event as CustomEvent<unknown>).detail === "accepted");
    window.addEventListener("dorsalia:analytics-consent", onConsent);
    return () => window.removeEventListener("dorsalia:analytics-consent", onConsent);
  }, []);

  useEffect(() => {
    if (!analyticsAllowed || metaTracked.current === raceEventId) return;
    trackMetaEvent("ViewContent", {
      content_ids: [raceEventId],
      content_type: "event",
      content_category: "Carrera Dorsalia",
    });
    metaTracked.current = raceEventId;
  }, [analyticsAllowed, raceEventId]);

  const applyMetrics = useCallback((next: EventMetricSnapshot) => {
    const normalized = {
      views: Number(next.views) || 0,
      saves: Number(next.saves) || 0,
    };
    if (lastViews.current != null && normalized.views > lastViews.current) {
      setPulse((value) => value + 1);
    }
    lastViews.current = normalized.views;
    setMetrics(normalized);
    onChange?.(normalized);
    setReady(true);
  }, [onChange]);

  const refresh = useCallback(async () => {
    const response = await fetch(`${API_BASE}/public-event-metrics/${encodeURIComponent(raceEventId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    applyMetrics(await response.json());
  }, [applyMetrics, raceEventId]);

  useEffect(() => {
    let cancelled = false;
    const registerView = async () => {
      try {
        const response = await fetch(`${API_BASE}/public-event-metrics/${encodeURIComponent(raceEventId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: getSessionId(),
            url: window.location.href,
            referrer: document.referrer || "",
            device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
            country: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          }),
          keepalive: true,
        });
        if (!cancelled && response.ok) { applyMetrics(await response.json()); setRegistered(true); }
      } catch {
        if (!cancelled) void refresh();
      }
    };
    void registerView();
    return () => { cancelled = true; };
  }, [applyMetrics, raceEventId, refresh]);

  useEffect(() => {
    if (!analyticsAllowed || !registered || !user) return;
    void createClient().rpc("identify_public_event_view", {
      p_session_id: getSessionId(), p_url: window.location.href, p_race_event_id: raceEventId,
    });
  }, [analyticsAllowed, registered, user?.id, raceEventId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <>
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/65" aria-live="polite">
      <span key={`views-${pulse}`} className="inline-flex items-center gap-2" style={{ animation: pulse ? "dorsaliaMetricPop 600ms ease-out" : undefined }}>
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c9f24b] opacity-50" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#c9f24b]" />
        </span>
        <strong className="font-semibold text-white">{ready ? formatCount(metrics.views) : "—"}</strong> visitas
      </span>
      <span className="inline-flex items-center gap-2">
        <AssetIcon name="heart-stroke" size={20} className="text-white" />
        <strong className="font-semibold text-white">{ready ? formatCount(metrics.saves) : "—"}</strong> guardados
      </span>
    </div>
    <style jsx global>{`
      @keyframes dorsaliaMetricPop {
        0% { transform: scale(1); color: rgba(255,255,255,.65); }
        38% { transform: scale(1.08); color: #c9f24b; }
        100% { transform: scale(1); color: rgba(255,255,255,.65); }
      }
    `}</style>
    </>
  );
}
