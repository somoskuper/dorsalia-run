const GOOGLE_SIZE = /=s\d+(-c)?(?=$|[?#])/i;
const PUBLIC_STORAGE = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");

function publicAvatarUrl(value: string) {
  try {
    const parsed = new URL(value);
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (local && parsed.pathname.startsWith("/storage/")) return `${PUBLIC_STORAGE}${parsed.pathname}${parsed.search}`;
  } catch {
    return value;
  }
  return value;
}

function isGoogleHost(hostname: string) {
  return hostname === "googleusercontent.com" || hostname.endsWith(".googleusercontent.com");
}

/** Google OAuth pictures default to 96px. Request a sharper original for profile use. */
export function highResolutionAvatar(url: string | null | undefined): string | null {
  return avatarThumb(url, 512);
}

/** Small square used in the feed, suggestions and other avatar circles. */
export function avatarThumb(url: string | null | undefined, size = 96): string | null {
  const value = publicAvatarUrl(String(url || "").trim());
  if (!value) return null;
  const px = Math.max(32, Math.min(512, Math.round(size)));
  try {
    const parsed = new URL(value);
    if (!isGoogleHost(parsed.hostname)) return value;
    if (GOOGLE_SIZE.test(value)) return value.replace(GOOGLE_SIZE, `=s${px}-c`);
    return value.replace(/([?#]|$)/, `=s${px}-c$1`);
  } catch {
    return value;
  }
}

export function isGoogleAvatar(url: string | null | undefined) {
  try {
    return isGoogleHost(new URL(String(url || "")).hostname);
  } catch {
    return false;
  }
}
