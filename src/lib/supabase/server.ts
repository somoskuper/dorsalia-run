import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ATHLETE_AUTH_STORAGE_KEY, athleteCookieDomain } from "@/lib/supabase/client";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const domain = athleteCookieDomain();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const { domain: _domain, ...rest } = options;
              cookieStore.set(name, value, { ...rest, ...(domain ? { domain } : {}) });
            });
          } catch {
            /* Route handlers can still return an explicit cookie. */
          }
        },
      },
      auth: { storageKey: ATHLETE_AUTH_STORAGE_KEY },
    },
  );
}
