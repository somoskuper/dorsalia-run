import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { resolvePostAuthNext } from "@/lib/safeAuthNext";
import { isAthleteOnboarded } from "@/lib/athleteProfile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = resolvePostAuthNext(url.searchParams.get("next"));
  const reviewIntent = url.searchParams.get("intent") === "review";
  const origin = url.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
                cookieStore.set(name, value, {
                  ...options,
                  domain: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN || ".dorsalia.run",
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
      return NextResponse.redirect(`${origin}/auth?error=oauth_callback`);
    }

    // Prefer the user returned by the OAuth exchange. Reading the session again
    // immediately can briefly return null while the response cookies are still
    // being written, which previously let brand-new Google accounts skip setup.
    const sessionUser = exchanged.user || (await supabase.auth.getUser()).data.user;
    const user = sessionUser;
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

  if (next.startsWith("http://") || next.startsWith("https://")) {
    return NextResponse.redirect(next);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
