import type { PublicRace } from "@/lib/races";
import { minPrice, organizerLabel, placeLabel } from "@/lib/races";

export type RaceSearchFilters = {
  q: string;
  sport: string;
  city: string;
  dateFrom: string;
  dateTo: string;
  priceMin: number | null;
  priceMax: number | null;
};

export const SEARCH_SPORTS = [
  { id: "running", label: "Running" },
  { id: "trail", label: "Trail" },
  { id: "cycling", label: "Ciclismo" },
  { id: "triathlon", label: "Triatlón" },
  { id: "swimming", label: "Natación" },
  { id: "padel", label: "Pádel" },
] as const;

export const EMPTY_SEARCH_FILTERS: RaceSearchFilters = {
  q: "",
  sport: "",
  city: "",
  dateFrom: "",
  dateTo: "",
  priceMin: null,
  priceMax: null,
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function dayStartMs(isoDate: string): number | null {
  if (!isoDate) return null;
  const t = Date.parse(`${isoDate}T00:00:00`);
  return Number.isFinite(t) ? t : null;
}

function dayEndMs(isoDate: string): number | null {
  if (!isoDate) return null;
  const t = Date.parse(`${isoDate}T23:59:59.999`);
  return Number.isFinite(t) ? t : null;
}

export function raceMatchesQuery(r: PublicRace, q: string): boolean {
  const needle = norm(q);
  if (!needle) return true;
  const hay = norm(
    [
      r.name,
      r.city,
      r.venue_name,
      r.country,
      r.organizer_name,
      organizerLabel(r),
      placeLabel(r),
      r.public_subdomain,
      r.slug,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return hay.includes(needle);
}

export function raceMatchesFilters(r: PublicRace, f: RaceSearchFilters): boolean {
  if (!raceMatchesQuery(r, f.q)) return false;

  if (f.sport && norm(String(r.sport_category || "running")) !== norm(f.sport)) return false;

  if (f.city) {
    const city = norm(String(r.city || ""));
    if (city !== norm(f.city)) return false;
  }

  const eventMs = r.event_date ? Date.parse(r.event_date) : NaN;
  const fromMs = dayStartMs(f.dateFrom);
  const toMs = dayEndMs(f.dateTo);
  if (fromMs != null) {
    if (!Number.isFinite(eventMs) || eventMs < fromMs) return false;
  }
  if (toMs != null) {
    if (!Number.isFinite(eventMs) || eventMs > toMs) return false;
  }

  const price = minPrice(r);
  if (f.priceMin != null && price < f.priceMin) return false;
  if (f.priceMax != null && price > f.priceMax) return false;

  return true;
}

export function filterRaces(races: PublicRace[], f: RaceSearchFilters): PublicRace[] {
  return races.filter((r) => raceMatchesFilters(r, f));
}

export function uniqueCities(races: PublicRace[]): string[] {
  const set = new Set<string>();
  for (const r of races) {
    const c = String(r.city || "").trim();
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

export function priceBounds(races: PublicRace[]): { min: number; max: number } {
  if (races.length === 0) return { min: 0, max: 5000 };
  let min = Infinity;
  let max = 0;
  for (const r of races) {
    const p = minPrice(r);
    if (p < min) min = p;
    if (p > max) max = p;
  }
  if (!Number.isFinite(min)) min = 0;
  if (max < min) max = min;
  // Round to nicer slider steps
  const step = max > 2000 ? 50 : 25;
  return {
    min: Math.floor(min / step) * step,
    max: Math.max(Math.ceil(max / step) * step, min + step),
  };
}

export function filtersFromSearchParams(sp: URLSearchParams): RaceSearchFilters {
  const pmin = sp.get("pmin");
  const pmax = sp.get("pmax");
  return {
    q: (sp.get("q") || "").trim(),
    sport: (sp.get("sport") || "").trim(),
    city: (sp.get("city") || "").trim(),
    dateFrom: (sp.get("from") || "").trim(),
    dateTo: (sp.get("to") || "").trim(),
    priceMin: pmin != null && pmin !== "" && Number.isFinite(Number(pmin)) ? Number(pmin) : null,
    priceMax: pmax != null && pmax !== "" && Number.isFinite(Number(pmax)) ? Number(pmax) : null,
  };
}

export function writeFiltersToSearchParams(
  base: URLSearchParams,
  f: RaceSearchFilters,
): URLSearchParams {
  const next = new URLSearchParams(base.toString());
  const setOrDel = (key: string, value: string) => {
    if (value) next.set(key, value);
    else next.delete(key);
  };
  setOrDel("q", f.q.trim());
  setOrDel("sport", f.sport.trim());
  setOrDel("city", f.city.trim());
  setOrDel("from", f.dateFrom.trim());
  setOrDel("to", f.dateTo.trim());
  if (f.priceMin != null && Number.isFinite(f.priceMin)) next.set("pmin", String(Math.round(f.priceMin)));
  else next.delete("pmin");
  if (f.priceMax != null && Number.isFinite(f.priceMax)) next.set("pmax", String(Math.round(f.priceMax)));
  else next.delete("pmax");
  return next;
}

export function countActiveFilters(f: RaceSearchFilters): number {
  let n = 0;
  if (f.sport) n += 1;
  if (f.city) n += 1;
  if (f.dateFrom || f.dateTo) n += 1;
  if (f.priceMin != null || f.priceMax != null) n += 1;
  return n;
}
