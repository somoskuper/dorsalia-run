import type { PublicEventRoute } from "./routeMap";

export type PublicRaceSocial = {
  handle: string;
  url: string;
};

export type OrganizerTeamMember = {
  id: string;
  name: string;
  role?: string | null;
  avatar_url?: string | null;
  contact_email?: string | null;
};

export type PublicPromotionalMedal = {
  id: string;
  name: string;
  description?: string | null;
  image_url: string;
  sponsor_name?: string | null;
  sponsor_logo_url?: string | null;
  destination_url?: string | null;
  sort_order?: number;
  expires_at?: string | null;
  max_uses_per_athlete?: number;
  terms_and_conditions?: string | null;
  unlimited_redemptions?: boolean;
};

export type PublicRace = {
  id: string;
  workspace_id?: string | null;
  name: string;
  slug: string;
  event_slug?: string | null;
  public_subdomain: string | null;
  custom_domain?: string | null;
  site_url: string | null;
  is_active: boolean;
  is_published: boolean;
  has_timed_results?: boolean | null;
  event_date: string | null;
  event_end_date?: string | null;
  updated_at?: string | null;
  timezone?: string | null;
  venue_name: string | null;
  address_line?: string | null;
  city: string | null;
  state?: string | null;
  postal_code?: string | null;
  country: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logo_url: string | null;
  cover_image_url: string | null;
  flyer_url?: string | null;
  hero_image_url?: string | null;
  og_image_url?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  short_description: string | null;
  description?: string | null;
  gallery_urls?: string[] | null;
  convocatoria_url?: string | null;
  youtube_url?: string | null;
  default_kit_price: number;
  min_price?: number;
  is_free?: boolean;
  sport_category?: string | null;
  currency: string;
  distances: { key: string; label: string }[];
  pricing_phases?: { name: string; price: number; starts_at: string; ends_at: string }[];
  instagram_handle: string | null;
  instagram_url?: string | null;
  website_url: string | null;
  social_links?: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube" | "x" | "linkedin", PublicRaceSocial>> | null;
  support_text?: string | null;
  contact_email?: string | null;
  organizer_phone?: string | null;
  organizer_whatsapp?: string | null;
  organizer_name?: string | null;
  organizer_is_provisional?: boolean;
  organizer_logo_url?: string | null;
  organizer_description?: string | null;
  organizer_place?: string | null;
  organizer_org_type?: string | null;
  organizer_site_url?: string | null;
  organizer_slug?: string | null;
  organizer_team?: OrganizerTeamMember[] | null;
  routes?: PublicEventRoute[] | null;
  promotional_medals?: PublicPromotionalMedal[] | null;
  lifecycle_status?: "active" | "inactive" | "finalized" | string | null;
  listing_type?: "indexed" | "verified" | "native" | string | null;
  external_registration_url?: string | null;
  source_url?: string | null;
  source_name?: string | null;
  source_credit?: string | null;
  seo_keywords?: string[] | null;
  seo_faq?: Array<{ question: string; answer: string }> | null;
  robots_index?: boolean;
  view_count?: number;
  save_count?: number;
  review_count?: number;
  rating_average?: number;
  review_comment_count?: number;
  community_comment_count?: number;
  share_count?: number;
};

export type PublicOrganizer = {
  id: string;
  slug: string;
  name: string;
  is_provisional?: boolean;
  verification_level?: "claimed" | "dorsalia" | null;
  logo_url?: string | null;
  cover_url?: string | null;
  description?: string | null;
  place?: string | null;
  org_type?: string | null;
  site_url?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  whatsapp_phone?: string | null;
  social_links?: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube" | "x" | "linkedin", PublicRaceSocial>> | null;
  support_text?: string | null;
  team?: OrganizerTeamMember[] | null;
};

const API =
  process.env.PUBLIC_EVENTS_API ||
  process.env.SITE_CONFIG_API?.replace(/\/public-config$/, "/public-events") ||
  "https://portal.dorsalia.run/sites/v1/public-events";

const ORGANIZERS_API = API.replace(/\/public-events\/?$/, "/public-organizers");

export const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || "dorsalia.run";

/** Apex marketplace on official domain; legacy carreras.* only when BASE_DOMAIN is the old host. */
export const MARKETPLACE_HOST = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_MARKETPLACE_URL;
  if (fromEnv) {
    try {
      return new URL(fromEnv).host;
    } catch {
      /* fall through */
    }
  }
  if (BASE_DOMAIN === "dorsalia.run") return "dorsalia.run";
  return `carreras.${BASE_DOMAIN}`;
})();

export const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.dorsalia.run";

export async function fetchPublicRaces(opts?: {
  status?: "all" | "active" | "inactive";
  q?: string;
}): Promise<PublicRace[]> {
  const qs = new URLSearchParams();
  qs.set("status", opts?.status || "all");
  qs.set("limit", "200");
  if (opts?.q) qs.set("q", opts.q);

  try {
    const res = await fetch(`${API}?${qs.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.events) ? data.events : [];
  } catch {
    return [];
  }
}

export async function fetchPublicRaceBySlug(slug: string): Promise<PublicRace | null> {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return null;
  const races = await fetchPublicRaces({ status: "all" });
  return races.find((race) => billboardSlug(race) === normalized) || null;
}

export function organizerSlugFrom(r: {
  organizer_slug?: string | null;
  workspace_id?: string | null;
  organizer_name?: string | null;
}): string | null {
  const direct = String(r.organizer_slug || "").trim();
  if (direct) return direct;
  const id = String(r.workspace_id || "").toLowerCase().trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) return null;
  const base =
    String(r.organizer_name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 40) || "org";
  return `${base}-${id}`;
}

export async function fetchPublicOrganizer(
  slug: string,
): Promise<{ organizer: PublicOrganizer; events: PublicRace[] } | null> {
  const s = String(slug || "").trim();
  if (!s) return null;
  try {
    const res = await fetch(`${ORGANIZERS_API}/${encodeURIComponent(s)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.organizer?.id) return null;
    return {
      organizer: data.organizer as PublicOrganizer,
      events: Array.isArray(data.events) ? (data.events as PublicRace[]) : [],
    };
  } catch {
    return null;
  }
}

/** Slug already published on *.dorsalia.run (or custom domain host). */
export function billboardSlug(r: Pick<PublicRace, "public_subdomain" | "slug">): string {
  return (r.public_subdomain || r.slug || "").toLowerCase();
}

/** Canonical photos hub for one event: /fotos/{slug}. */
export function eventPhotosPath(r: Pick<PublicRace, "public_subdomain" | "slug">): string {
  return `/fotos/${encodeURIComponent(billboardSlug(r))}`;
}

export function eventPhotosUrl(r: Pick<PublicRace, "public_subdomain" | "slug">): string {
  return `https://${MARKETPLACE_HOST}${eventPhotosPath(r)}`;
}

export async function fetchPublicRaceByAnySlug(slug: string): Promise<PublicRace | null> {
  const normalized = String(slug || "").trim().toLowerCase();
  if (!normalized) return null;
  const races = await fetchPublicRaces({ status: "all" });
  return races.find((race) => [race.public_subdomain, race.slug, race.event_slug, billboardSlug(race)].some((value) => String(value || "").trim().toLowerCase() === normalized)) || null;
}

export const SPORT_CATEGORY_LABELS: Record<string, string> = {
  running: "Running",
  trail: "Trail running",
  triathlon: "Triatlón",
  duathlon: "Duatlón",
  cycling: "Ciclismo",
  padel: "Pádel",
  swimming: "Natación",
  walking: "Caminata",
  obstacle: "Carrera de obstáculos",
  other: "Otro deporte",
};

export function facetSlug(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function sportCategory(r: Pick<PublicRace, "sport_category">): string {
  const value = facetSlug(r.sport_category || "running");
  return SPORT_CATEGORY_LABELS[value] ? value : "other";
}

export function sportCategoryLabel(r: PublicRace): string {
  return SPORT_CATEGORY_LABELS[sportCategory(r)] || SPORT_CATEGORY_LABELS.other;
}

export function eventLocationSlug(r: Pick<PublicRace, "state" | "city" | "country">): string {
  const fallbackCountry = String(r.country || "").toUpperCase() === "MX" ? "mexico" : r.country;
  return facetSlug(r.state || r.city || fallbackCountry || "mexico") || "mexico";
}

export function raceFacetSlugs(r: PublicRace): string[] {
  return [...new Set([
    facetSlug(r.state),
    facetSlug(r.city),
    sportCategory(r),
  ].filter(Boolean))];
}

export function raceMatchesFacet(r: PublicRace, facet: string): boolean {
  return raceFacetSlugs(r).includes(facetSlug(facet));
}

/** Canonical SEO URL. The stable /evento/:slug route redirects to this hierarchy. */
export function marketplaceEventPath(r: Pick<PublicRace, "public_subdomain" | "slug" | "state" | "city" | "country" | "sport_category">): string {
  return `/carreras/${eventLocationSlug(r)}/${sportCategory(r)}/${encodeURIComponent(billboardSlug(r))}`;
}

export function marketplaceEventUrl(r: PublicRace): string {
  return `https://dorsalia.run${marketplaceEventPath(r)}`;
}

export function isEventFree(r: PublicRace): boolean {
  return r.is_free === true;
}

function calendarDay(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
}

/** Reviews open after the published end, or after the race day when there is no end. */
export function eventHasFinished(
  race: { event_date?: string | null; event_end_date?: string | null; timezone?: string | null },
  now = new Date(),
): boolean {
  const end = Date.parse(String(race.event_end_date || ""));
  if (Number.isFinite(end)) return end <= now.getTime();
  return raceDayHasPassed(race, now);
}

/** The published race day is already over in the event's timezone. */
export function raceDayHasPassed(race: { event_date?: string | null; timezone?: string | null }, now = new Date()): boolean {
  if (!race.event_date) return false;
  const start = new Date(race.event_date);
  if (Number.isNaN(start.getTime())) return false;
  return calendarDay(start, race.timezone || "America/Mexico_City") < calendarDay(now, race.timezone || "America/Mexico_City");
}

export function isFinalized(r: PublicRace): boolean {
  if (r.lifecycle_status === "finalized" || r.is_active === false) return true;
  // Indexed/externally managed events do not receive Dorsalia lifecycle updates.
  // Their published start time is the reliable cutoff for marketplace placement.
  if (r.listing_type && r.listing_type !== "native" && r.event_date) {
    const startsAt = Date.parse(r.event_date);
    return Number.isFinite(startsAt) && startsAt <= Date.now();
  }
  return raceDayHasPassed(r);
}

export function minPrice(r: PublicRace): number {
  if (typeof r.min_price === "number" && Number.isFinite(r.min_price) && r.min_price > 0) {
    return r.min_price;
  }
  const prices: number[] = [];
  const push = (v: unknown) => {
    if (v == null || v === "") return;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) prices.push(n);
  };
  push(r.default_kit_price);
  for (const phase of r.pricing_phases || []) push(phase.price);
  for (const route of r.routes || []) {
    push(route.price);
    for (const value of Object.values(route.phase_prices || {})) push(value);
  }
  const paid = prices.filter((price) => price > 0);
  return paid.length ? Math.min(...paid) : prices.length ? Math.min(...prices) : 0;
}

export function formatMinPrice(r: PublicRace): string {
  const n = minPrice(r);
  if (n === 0) return isEventFree(r) ? "Gratis" : "Precio por confirmar";
  const formatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: r.currency || "MXN",
    maximumFractionDigits: 0,
  }).format(n);
  return `Desde ${formatted}`;
}

export type SimplifiedPhase = {
  label: string;
  price: number;
  priceLabel: string;
};

/**
 * Event-level pricing phases only (not per-route).
 * Sorted cheapest → most expensive. Free events return a single Gratis row.
 */
export function simplifiedPricingPhases(r: PublicRace): SimplifiedPhase[] {
  const currency = r.currency || "MXN";
  const fmt = (n: number) =>
    n <= 0
      ? "Gratis"
      : new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(n);

  if (isEventFree(r)) {
    return [{ label: "Gratis", price: 0, priceLabel: "Gratis" }];
  }

  if (minPrice(r) === 0) {
    return [{ label: "Precio", price: 0, priceLabel: "Por confirmar" }];
  }

  const phases = Array.isArray(r.pricing_phases) ? r.pricing_phases : [];
  const cleaned = phases
    .map((p, i) => {
      const price = Number(p?.price);
      if (!Number.isFinite(price) || price < 0) return null;
      const name = String(p?.name || "").trim();
      return {
        label: name || `Fase ${i + 1}`,
        price,
        priceLabel: fmt(price),
      };
    })
    .filter((p): p is SimplifiedPhase => Boolean(p))
    .sort((a, b) => a.price - b.price);

  if (cleaned.length > 0) {
    // Cap visual to 3 cheapest event-level phases
    return cleaned.slice(0, 3).map((p, i) => ({
      ...p,
      label: cleaned.length === 1 ? p.label || "Fase 1" : `Fase ${i + 1}`,
    }));
  }

  const base = Number(r.default_kit_price);
  const price = Number.isFinite(base) && base >= 0 ? base : minPrice(r);
  return [{ label: "Fase 1", price, priceLabel: fmt(price) }];
}

export function flyerImage(r: PublicRace): string | null {
  const flyer = String(r.flyer_url || "").trim();
  if (flyer && !/\.pdf($|\?)/i.test(flyer)) return flyer;
  return null;
}

/** Portal “Portada” only — marketplace cards never use flyer/hero/og. */
export function cardCoverImage(r: PublicRace): string | null {
  const cover = String(r.cover_image_url || "").trim();
  return cover || null;
}

export function coverImage(r: PublicRace): string | null {
  return cardCoverImage(r) || flyerImage(r) || r.hero_image_url || r.og_image_url || r.logo_url || null;
}

export function seoDescription(r: PublicRace): string {
  return (
    String(r.meta_description || "").trim() ||
    String(r.description || "").trim() ||
    String(r.short_description || "").trim() ||
    `Inscríbete a ${r.name}.`
  );
}

export function organizerLabel(r: PublicRace): string {
  return String(r.organizer_name || "").trim() || r.name;
}

/** Public workspace photo first; event logo only as legacy fallback. */
export function organizerImage(r: PublicRace): string | null {
  const org = String(r.organizer_logo_url || "").trim();
  if (org) return org;
  const eventLogo = String(r.logo_url || "").trim();
  return eventLogo || null;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Fecha por confirmar";
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "Fecha por confirmar";
  }
}

export function formatDateHeading(iso: string | null): string {
  if (!iso) return "Por confirmar";
  try {
    const raw = new Date(iso).toLocaleDateString("es-MX", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return raw.replace(/\.$/, "").replace(/^./, (c) => c.toUpperCase());
  } catch {
    return "Por confirmar";
  }
}

/** Closest upcoming first; finalized / past go last. */
export function sortByClosestDate(races: PublicRace[]): PublicRace[] {
  const ts = (r: PublicRace) => {
    if (!r.event_date) return Number.POSITIVE_INFINITY;
    const n = Date.parse(r.event_date);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };
  return [...races].sort((a, b) => {
    const aDone = isFinalized(a);
    const bDone = isFinalized(b);
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (aDone && bDone) return ts(b) - ts(a);
    return ts(a) - ts(b);
  });
}

export function formatDateTime(iso: string | null, timeZone = "America/Merida"): { date: string; time: string } {
  if (!iso) return { date: "Fecha por confirmar", time: "" };
  try {
    const d = new Date(iso);
    const safeTimeZone = timeZone || "America/Merida";
    return {
      date: new Intl.DateTimeFormat("es-MX", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: safeTimeZone,
      }).format(d),
      time: new Intl.DateTimeFormat("es-MX", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: safeTimeZone,
      }).format(d),
    };
  } catch {
    return { date: "Fecha por confirmar", time: "" };
  }
}

export function placeLabel(r: PublicRace): string {
  return [r.venue_name, r.city, r.country].filter(Boolean).join(", ") || "México";
}

export function eventSiteUrl(r: PublicRace): string | null {
  if (r.site_url) return r.site_url;
  const slug = billboardSlug(r);
  return slug ? `https://${slug}.${BASE_DOMAIN}` : null;
}
