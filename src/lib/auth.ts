"use client";

import { createClient } from "@/lib/supabase/client";

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpAthlete(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  shirtSize?: string;
  next?: string;
  intent?: string;
}) {
  const supabase = createClient();
  const callbackParams = new URLSearchParams();
  if (input.next) callbackParams.set("next", input.next);
  if (input.intent) callbackParams.set("intent", input.intent);
  const nextQs = callbackParams.size ? `?${callbackParams.toString()}` : "";
  const redirectTo = `${window.location.origin}/auth/callback${nextQs}`;
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        account_type: "athlete",
        athlete_onboarding_done: false,
        profile_setup_required: true,
        full_name: `${input.firstName} ${input.lastName}`.trim(),
        first_name: input.firstName,
        last_name: input.lastName,
      },
    },
  });
  if (error) return { data, error };

  // The profile is created during onboarding, after the user chooses a username.
  return { data, error: null };
}

export async function signInWithGoogle(redirectPath = "/cuenta", intent?: string) {
  const supabase = createClient();
  const callbackParams = new URLSearchParams({ next: redirectPath });
  if (intent) callbackParams.set("intent", intent);
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}
