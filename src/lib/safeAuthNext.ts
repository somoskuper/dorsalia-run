const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "dorsalia.run";

/**
 * Allow relative paths on the marketplace, or absolute URLs on
 * dorsalia.run / *.dorsalia.run (public event sites).
 */
export function resolvePostAuthNext(raw: string | null | undefined, fallback = "/cuenta"): string {
  const next = String(raw || "").trim() || fallback;
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  try {
    const u = new URL(next);
    if (u.protocol !== "http:" && u.protocol !== "https:") return fallback;
    const host = u.hostname.toLowerCase();
    if (host === BASE_DOMAIN || host.endsWith(`.${BASE_DOMAIN}`)) {
      return u.toString();
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function isExternalAuthNext(next: string): boolean {
  return next.startsWith("http://") || next.startsWith("https://");
}

/** Client-side navigation after login / onboarding. */
export function navigateAfterAuth(
  next: string,
  replace: (href: string) => void = (href) => {
    window.location.replace(href);
  },
) {
  const safe = resolvePostAuthNext(next);
  if (isExternalAuthNext(safe)) {
    window.location.assign(safe);
    return;
  }
  replace(safe);
}
