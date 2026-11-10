import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

/** Cookie prefix shared by the browser session and the server auth client. */
export const ATHLETE_AUTH_STORAGE_KEY = "dorsalia-athlete-auth";

/** Shared cookie domain so dorsalia.run and *.dorsalia.run share athlete session. */
export function athleteCookieDomain(): string | undefined {
  const domain = (process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || ".dorsalia.run").trim();
  if (!domain || domain === "localhost" || domain === "127.0.0.1") return undefined;
  return domain;
}

export const ATHLETE_COOKIE_DOMAIN = athleteCookieDomain();

function browserSupabaseUrl() {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") return window.location.origin;
  return url;
}

let cached: SupabaseClient | null = null;

export function hasSupabaseConfig() {
  return Boolean(url && anon);
}

export function createClient(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      "Supabase no configurado: falta NEXT_PUBLIC_SUPABASE_ANON_KEY en el build de dorsalia-carreras.",
    );
  }
  if (cached) return cached;
  const domain = athleteCookieDomain();
  cached = createBrowserClient(browserSupabaseUrl(), anon, {
    cookieOptions: {
      ...(domain ? { domain } : {}),
      path: "/",
      sameSite: "lax",
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: ATHLETE_AUTH_STORAGE_KEY,
    },
  });
  return cached;
}
