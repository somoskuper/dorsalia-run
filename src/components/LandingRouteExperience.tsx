"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { routeTrace, type PublicEventRoute } from "@/lib/routeMap";

const AnimatedRouteMap = dynamic(() => import("@/components/AnimatedRouteMap"), {
  ssr: false,
});

export default function LandingRouteExperience({ routes }: { routes: PublicEventRoute[] }) {
  const mappedRoutes = useMemo(
    () => routes.filter((route) => routeTrace(route.map).hasTrace),
    [routes],
  );
  const [activeKey, setActiveKey] = useState(() => mappedRoutes[0]?.key || "");
  const activeRoute = mappedRoutes.find((route) => route.key === activeKey) || mappedRoutes[0];
  const trace = useMemo(() => routeTrace(activeRoute?.map), [activeRoute]);

  if (!activeRoute || !trace.hasTrace) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[30px] bg-[#111] text-sm text-white/45 md:rounded-[42px]">
        Ruta próximamente
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[30px] bg-black md:rounded-[42px]">
      {mappedRoutes.length > 1 ? (
        <div className="pointer-events-none absolute left-[15px] top-[15px] z-[600] flex max-w-[calc(100%-30px)] flex-wrap gap-1.5">
          {mappedRoutes.map((route) => {
            const active = route.key === activeRoute.key;
            return (
              <button
                key={route.key}
                type="button"
                onClick={() => setActiveKey(route.key)}
                className={`mp-card-badge pointer-events-auto whitespace-nowrap px-[10px] py-[5px] text-[10px] font-bold uppercase tracking-[0.08em] text-white transition-opacity ${active ? "opacity-100" : "opacity-70"}`}
              >
                {route.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <AnimatedRouteMap
        key={activeRoute.key || "micarrera2026-route"}
        polyline={trace.polyline}
        waypoints={trace.waypoints}
        points={trace.points}
      />
    </div>
  );
}
