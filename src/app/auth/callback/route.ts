import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { resolvePostAuthNext } from "@/lib/safeAuthNext";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import { ATHLETE_AUTH_STORAGE_KEY, athleteCookieDomain } from "@/lib/supabase/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = resolvePostAuthNext(url.searchParams.get("next"));
  const reviewIntent = url.searchParams.get("intent") === "review";
  const origin = url.origin;
  const recovery = url.searchParams.get("intent") === "recovery";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        auth: { storageKey: ATHLETE_AUTH_STORAGE_KEY },
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                const domain = athleteCookieDomain();
                const { domain: _domain, ...rest } = options;
                cookieStore.set(name, value, {
                  ...rest,
                  ...(domain ? { domain } : {}),
                });
              });
            } catch {
              /* Server Component — ignore */
            }
          },
        },
      },
    );
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      if (next.startsWith("/settings/")) {
        const failed = new URL(next, origin);
        failed.searchParams.set("error", "vinculo");
        return NextResponse.redirect(failed);
      }
      return NextResponse.redirect(`${origin}/auth?error=oauth_callback`);
    }

    // Prefer the user returned by the OAuth exchange. Reading the session again
    // immediately can briefly return null while the response cookies are still
    // being written, which previously let brand-new Google accounts skip setup.
    const sessionUser = exchanged.user || (await supabase.auth.getUser()).data.user;
    const user = sessionUser;
    if (user?.user_metadata?.folio_activation_pending) {
      return NextResponse.redirect(`${origin}/activar-inscripcion`);
    }
    if (recovery && user) {
      return NextResponse.redirect(new URL(`/auth?mode=reset&next=${encodeURIComponent(next)}`, origin));
    }
    if (user) {
      const meta = user.user_metadata || {};
      // The onboarding form creates the username-backed profile. An upsert here
      // fails for new accounts because athlete_profiles.username is NOT NULL.
      const { data: prof, error: profileError } = await supabase
        .from("athlete_profiles")
        .select("username, first_name, last_name, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      const onboarded = !profileError && isAthleteOnboarded(meta, prof);

      if (!onboarded) {
        return NextResponse.redirect(`${origin}/`);
      }
    } else {
      return NextResponse.redirect(`${origin}/auth?error=oauth_session`);
    }
  }

  if (recovery) return NextResponse.redirect(`${origin}/auth?error=recovery`);

  if (next.startsWith("http://") || next.startsWith("https://")) {
    return NextResponse.redirect(next);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
