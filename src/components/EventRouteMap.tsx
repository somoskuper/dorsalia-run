"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  CARTO_DARK,
  pathDistanceMeters,
  pointAtDistance,
  routeOrderedFromStart,
  ROUTE_COLOR,
  type RoutePoint,
  type RouteWaypoint,
} from "@/lib/routeMap";

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c),
  );
}

function pointHtml(label: string, kind: string) {
  const isFinish = kind === "finish";
  const dotBg = isFinish ? ROUTE_COLOR : "#ffffff";
  const dotBorder = isFinish ? "#ffffff" : ROUTE_COLOR;
  return `<div style="display:flex;flex-direction:column;align-items:center">
    <div style="width:14px;height:14px;border-radius:999px;background:${dotBg};border:2.5px solid ${dotBorder};box-shadow:0 1px 3px rgba(0,0,0,.35)"></div>
    <div style="margin-top:4px;padding:3px 7px;border-radius:8px;background:#111;color:${ROUTE_COLOR};font:700 10px/1.2 system-ui,sans-serif;white-space:nowrap">${esc(label)}</div>
  </div>`;
}

function kilometerHtml(kilometer: number) {
  return `<div style="display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:18px;padding:0 6px;border:1px solid rgba(203,255,0,.75);border-radius:999px;background:rgba(17,17,17,.9);color:#cbff00;font:700 9px/1 system-ui,sans-serif;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3);pointer-events:none">${kilometer} km</div>`;
}

export default function EventRouteMap({
  polyline,
  waypoints,
  points,
}: {
  polyline: RouteWaypoint[];
  waypoints: RouteWaypoint[];
  points: RoutePoint[];
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const lineKey = polyline.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
  const wpKey = waypoints.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(";");
  const ptKey = points.map((p) => `${p.id}:${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|");

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const leaflet = await import("leaflet");
      const L = leaflet.default;
      if (cancelled || !el) return;

      const source = routeOrderedFromStart(
        polyline.length >= 2 ? polyline : waypoints,
        waypoints,
        points,
      );
      const center = points[0] || source[0] || { lat: 23.6345, lng: -102.5528 };
      const fitPts = source.map((p) => [p.lat, p.lng] as [number, number]);

      map = L.map(el, {
        center: [center.lat, center.lng],
        zoom: source.length ? 14 : 5,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      map.on("click", () => map?.scrollWheelZoom.enable());

      L.tileLayer(CARTO_DARK.url, {
        attribution: CARTO_DARK.attribution,
        maxZoom: CARTO_DARK.maxZoom,
        ...("subdomains" in CARTO_DARK && CARTO_DARK.subdomains
          ? { subdomains: CARTO_DARK.subdomains }
          : {}),
      }).addTo(map);

      if (fitPts.length >= 2) {
        const round = { lineCap: "round" as const, lineJoin: "round" as const, opacity: 1 };
        L.polyline(fitPts, {
          ...round,
          color: "#1a1a1a",
          weight: 10,
          interactive: false,
        }).addTo(map);
        L.polyline(fitPts, {
          ...round,
          color: ROUTE_COLOR,
          weight: 7,
          interactive: false,
        }).addTo(map);
        map.fitBounds(L.latLngBounds(fitPts), { padding: [36, 36], maxZoom: 16 });
      }

      points.forEach((pt) => {
        L.marker([pt.lat, pt.lng], {
          icon: L.divIcon({
            className: "dorsalia-wp-icon",
            html: pointHtml(pt.label, pt.kind),
            iconSize: [140, 40],
            iconAnchor: [70, 8],
          }),
          interactive: false,
        }).addTo(map!);
      });

      const routeDistance = pathDistanceMeters(source);
      for (let kilometer = 1; kilometer <= Math.floor(routeDistance / 1000); kilometer++) {
        const position = pointAtDistance(source, kilometer * 1000);
        if (!position) continue;
        L.marker([position.lat, position.lng], {
          icon: L.divIcon({
            className: "dorsalia-km-icon",
            html: kilometerHtml(kilometer),
            iconSize: [44, 18],
            iconAnchor: [-7, 9],
          }),
          interactive: false,
          keyboard: false,
        }).addTo(map!);
      }

      requestAnimationFrame(() => map?.invalidateSize());
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lineKey, wpKey, ptKey]);

  return (
    <div className="relative z-0 isolate w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 bg-black/40">
      <div ref={elRef} className="absolute inset-0" />
    </div>
  );
}
