export type RouteWaypoint = { lat: number; lng: number };

export type RoutePointKind = "start" | "turn" | "finish" | "aid" | "feed" | "medical" | "custom";

export type RoutePoint = {
  id: string;
  lat: number;
  lng: number;
  kind: RoutePointKind;
  label: string;
};

export type PublicRouteMap = {
  polyline?: RouteWaypoint[] | [number, number][];
  waypoints?: RouteWaypoint[];
  route_points?: RoutePoint[];
  map_style?: string;
  distance_m?: number;
  route_mode?: string;
};

export type PublicEventRoute = {
  key: string;
  label: string;
  description?: string | null;
  distance_m?: number;
  price?: number | null;
  phase_prices?: Record<string, unknown> | null;
  pricing_phases?: Array<{ id?: string; name?: string; price?: number; starts_at?: string; ends_at?: string }> | null;
  map?: PublicRouteMap | null;
  medal_id?: string | null;
  medal_image_url?: string | null;
  medal_label?: string | null;
};

const POINT_KINDS = new Set<RoutePointKind>([
  "start",
  "turn",
  "finish",
  "aid",
  "feed",
  "medical",
  "custom",
]);

const POINT_LABELS: Record<RoutePointKind, string> = {
  start: "Salida",
  turn: "Retorno",
  finish: "Meta",
  aid: "Hidratación",
  feed: "Avituallamiento",
  medical: "Médico",
  custom: "Punto",
};

export const ROUTE_COLOR = "#c9f24b";

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** CARTO Dark Matter raster (with API key when configured). */
export const CARTO_DARK = (() => {
  const key = String(process.env.NEXT_PUBLIC_CARTO_API_KEY || "").trim()
  const base = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
  const url = key ? `${base}?key=${encodeURIComponent(key)}` : base
  return {
    url,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: "abcd" as const,
  }
})()

export function normalizePolyline(raw: unknown): RouteWaypoint[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      if (Array.isArray(p) && p.length >= 2) {
        const lat = Number(p[0]);
        const lng = Number(p[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
      }
      const lat = Number((p as RouteWaypoint)?.lat);
      const lng = Number((p as RouteWaypoint)?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter((p): p is RouteWaypoint => p !== null);
}

export function normalizeWaypoints(raw: unknown): RouteWaypoint[] {
  return normalizePolyline(raw);
}

export function normalizeRoutePoints(raw: unknown): RoutePoint[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p, i) => {
      const lat = Number((p as RoutePoint)?.lat);
      const lng = Number((p as RoutePoint)?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const kindRaw = String((p as RoutePoint)?.kind || "custom");
      const kind = POINT_KINDS.has(kindRaw as RoutePointKind)
        ? (kindRaw as RoutePointKind)
        : "custom";
      const label =
        String((p as RoutePoint)?.label || "").trim() || POINT_LABELS[kind];
      return {
        id: String((p as RoutePoint)?.id || `pt-${i}`),
        lat,
        lng,
        kind,
        label,
      };
    })
    .filter((p): p is RoutePoint => p !== null);
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(2) : km.toFixed(1)} km`;
}

export function haversineMeters(a: RouteWaypoint, b: RouteWaypoint): number {
  const radius = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q =
    s1 * s1 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * s2 * s2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(q)));
}

export function pathDistanceMeters(points: RouteWaypoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index++) {
    total += haversineMeters(points[index - 1], points[index]);
  }
  return total;
}

export function pointAtDistance(
  points: RouteWaypoint[],
  targetMeters: number,
): RouteWaypoint | null {
  if (!points.length || !Number.isFinite(targetMeters) || targetMeters < 0) return null;
  if (targetMeters === 0) return { lat: points[0].lat, lng: points[0].lng };
  let covered = 0;
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1];
    const end = points[index];
    const segment = haversineMeters(start, end);
    if (segment <= 0) continue;
    if (covered + segment >= targetMeters) {
      const ratio = Math.min(1, Math.max(0, (targetMeters - covered) / segment));
      return {
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio,
      };
    }
    covered += segment;
  }
  return null;
}

export function routeOrderedFromStart(
  source: RouteWaypoint[],
  waypoints: RouteWaypoint[],
  points: RoutePoint[],
): RouteWaypoint[] {
  if (source.length < 2) return source;
  const start = points.find((point) => point.kind === "start") || waypoints[0];
  const finish = points.find((point) => point.kind === "finish");
  if (!start) return source;

  const first = source[0];
  const last = source[source.length - 1];
  const isCircuit = haversineMeters(first, last) <= 80
    || Boolean(finish && haversineMeters(start, finish) <= 80);
  if (isCircuit) {
    const ring = haversineMeters(first, last) <= 10 ? source.slice(0, -1) : source.slice();
    if (!ring.length) return source;
    let startIndex = 0;
    let nearestDistance = Infinity;
    ring.forEach((point, index) => {
      const distance = haversineMeters(start, point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        startIndex = index;
      }
    });
    const ordered = [...ring.slice(startIndex), ...ring.slice(0, startIndex)];
    const anchoredStart = { lat: start.lat, lng: start.lng };
    if (haversineMeters(anchoredStart, ordered[0]) > 1) ordered.unshift(anchoredStart);
    ordered.push(finish ? { lat: finish.lat, lng: finish.lng } : anchoredStart);
    return ordered;
  }

  if (finish) {
    const forward = haversineMeters(start, first) + haversineMeters(finish, last);
    const reverse = haversineMeters(start, last) + haversineMeters(finish, first);
    return reverse < forward ? source.slice().reverse() : source;
  }
  return haversineMeters(start, last) < haversineMeters(start, first)
    ? source.slice().reverse()
    : source;
}

export function routeTrace(map: PublicRouteMap | null | undefined) {
  const polyline = normalizePolyline(map?.polyline);
  const waypoints = normalizeWaypoints(map?.waypoints);
  const points = normalizeRoutePoints(map?.route_points);
  const line = polyline.length >= 2 ? polyline : waypoints;
  return {
    polyline: line,
    waypoints: waypoints.length ? waypoints : line,
    points,
    hasTrace: line.length >= 2,
    distance_m: Number(map?.distance_m) || 0,
  };
}
