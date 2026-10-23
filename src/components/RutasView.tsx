"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { PublicRace } from "@/lib/races";
import { formatDistance, routeTrace, type PublicEventRoute } from "@/lib/routeMap";

const AnimatedRouteMap = dynamic(() => import("@/components/AnimatedRouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-black" />,
});

type RouteCard = {
  id: string;
  race: PublicRace;
  route: PublicEventRoute;
  trace: ReturnType<typeof routeTrace>;
};

export default function RutasView({ races }: { races: PublicRace[] }) {
  const cards = useMemo(() => {
    const out: RouteCard[] = [];
    for (const race of races) {
      if (!race.is_active) continue;
      const routes = Array.isArray(race.routes) ? race.routes : [];
      for (const route of routes) {
        const trace = routeTrace(route.map);
        if (!trace.hasTrace) continue;
        out.push({
          id: `${race.id}:${route.key}`,
          race,
          route,
          trace,
        });
      }
    }
    // Prefer micarrera / denser traces first for the motion stage
    return out.sort((a, b) => {
      const score = (c: RouteCard) => {
        const slug = (c.race.public_subdomain || c.race.slug || "").toLowerCase();
        const pts = c.trace.polyline.length;
        return (slug === "micarrera" ? 1_000_000 : 0) + pts;
      };
      return score(b) - score(a);
    });
  }, [races]);

  const [activeId, setActiveId] = useState(cards[0]?.id || "");

  useEffect(() => {
    if (!cards.length) {
      setActiveId("");
      return;
    }
    if (!cards.some((c) => c.id === activeId)) setActiveId(cards[0].id);
  }, [cards, activeId]);

  const active = cards.find((c) => c.id === activeId) || cards[0] || null;
  const label = active
    ? [
        active.race.name,
        active.route.label ||
          formatDistance(Number(active.route.distance_m) || active.trace.distance_m),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center bg-black text-white">
      {cards.length > 1 ? (
        <div className="absolute top-3 left-1/2 z-[600] flex max-w-[min(100vw-1.5rem,920px)] -translate-x-1/2 gap-1.5 overflow-x-auto px-1 py-1">
          {cards.map((c) => {
            const on = c.id === (active?.id || "");
            const chip =
              c.route.label ||
              formatDistance(Number(c.route.distance_m) || c.trace.distance_m) ||
              "Ruta";
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveId(c.id)}
                title={`${c.race.name} · ${chip}`}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  on
                    ? "bg-[var(--accent)] text-[var(--ink)]"
                    : "bg-white/10 text-white/70 hover:bg-white/15"
                }`}
              >
                <span className="max-w-[10rem] truncate sm:max-w-none">
                  {c.race.name.split(" ")[0]} · {chip}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {/* 16:9 stage, never larger than the viewport */}
      <div
        className="relative overflow-hidden bg-[#0a0a0a]"
        style={{
          width: "min(100vw, calc(100dvh * 16 / 9))",
          height: "min(100dvh, calc(100vw * 9 / 16))",
        }}
      >
        {active ? (
          <AnimatedRouteMap
            key={active.id}
            polyline={active.trace.polyline}
            waypoints={active.trace.waypoints}
            points={active.trace.points}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
            No hay rutas GPS en eventos activos
          </div>
        )}
      </div>

      {label ? (
        <p className="pointer-events-none absolute bottom-3 left-3 z-[600] max-w-[70vw] truncate text-[10px] uppercase tracking-[0.14em] text-white/35">
          {label}
        </p>
      ) : null}
    </div>
  );
}
