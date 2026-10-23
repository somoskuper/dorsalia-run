import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").trim();
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

/** Shared cookie domain so dorsalia.run and *.dorsalia.run share athlete session. */
export const ATHLETE_COOKIE_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || ".dorsalia.run";

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
  cached = createBrowserClient(url, anon, {
    cookieOptions: {
      domain: ATHLETE_COOKIE_DOMAIN,
      path: "/",
      sameSite: "lax",
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storageKey: "dorsalia-athlete-auth",
    },
  });
  return cached;
}
