/** Ticket QR / PDF helpers for marketplace Resumen (mirrors event-site ticket.ts). */

export type TicketAccessPayload = {
  folio: string;
  nombre: string;
  distancia: string;
  talla: string;
  dorsal: string | null;
  eventName: string;
  logoUrl: string | null;
  ig: string | null;
  web: string | null;
  courtesy?: boolean;
  fecha: string | null;
  hora: string | null;
  lugar: string | null;
};

const DEFAULT_TZ = "America/Merida";

export function formatTicketDateParts(
  iso: string | null | undefined,
  tz: string = DEFAULT_TZ,
): { fecha: string | null; hora: string | null } {
  if (!iso) return { fecha: null, hora: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { fecha: null, hora: null };

  const zona = tz || DEFAULT_TZ;
  const fecha = new Intl.DateTimeFormat("es-MX", {
    timeZone: zona,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zona,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const hour = Number(timeParts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(timeParts.find((p) => p.type === "minute")?.value ?? "0");
  if (hour === 0 && minute === 0) return { fecha, hora: null };

  const hora = new Intl.DateTimeFormat("es-MX", {
    timeZone: zona,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return { fecha, hora };
}

export function formatTicketLugar(
  venue?: string | null,
  city?: string | null,
  country?: string | null,
): string | null {
  const v = venue?.trim() || "";
  const c = city?.trim() || "";
  const co = country?.trim() || "";
  if (v) {
    if (c && !v.toLowerCase().includes(c.toLowerCase())) return `${v}, ${c}`;
    return v;
  }
  const rest = [c, co].filter(Boolean).join(", ");
  return rest || null;
}

function folioSuffix(folio: string): string {
  return folio.includes("-") ? folio.split("-").slice(1).join("-") : folio;
}

export function verifyUrl(folio: string): string {
  const portal = (
    process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.dorsalia.run"
  ).replace(/\/$/, "");
  return `${portal}/verificar?folio=${encodeURIComponent(folioSuffix(folio))}`;
}

export function ticketQuery(t: TicketAccessPayload): string {
  const p = new URLSearchParams();
  p.set("folio", t.folio);
  p.set("nombre", t.nombre);
  p.set("distancia", t.distancia);
  p.set("talla", t.talla);
  if (t.dorsal) p.set("dorsal", t.dorsal);
  if (t.eventName) p.set("evento", t.eventName);
  if (t.logoUrl) p.set("logo", t.logoUrl);
  if (t.ig) p.set("ig", t.ig);
  if (t.web) p.set("web", t.web);
  if (t.courtesy) p.set("cortesia", "1");
  if (t.fecha) p.set("fecha", t.fecha);
  if (t.hora) p.set("hora", t.hora);
  if (t.lugar) p.set("lugar", t.lugar);
  return p.toString();
}

export function ticketDownloadUrl(
  eventBaseUrl: string | null,
  payload: TicketAccessPayload,
): string | null {
  if (!eventBaseUrl) return null;
  const base = eventBaseUrl.replace(/\/$/, "");
  return `${base}/api/ticket?${ticketQuery(payload)}`;
}

export function ticketQrSrc(folio: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(verifyUrl(folio))}`;
}

export function digTicketString(dd: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = dd[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}
