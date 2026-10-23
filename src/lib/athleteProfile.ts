export const GENDERS = ["Masculino", "Femenino", "Otro", "Prefiero no decir"] as const;
export const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type AthleteProfileFields = {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  preferred_shirt_size?: string | null;
};

/** True when the athlete finished the marketplace onboarding form. */
export function isAthleteOnboarded(
  userMetadata: Record<string, unknown> | null | undefined,
  profile?: AthleteProfileFields | null,
): boolean {
  // An auth session alone is not a public profile. A username-backed row must exist.
  if (!String(profile?.username || "").trim()) return false;
  if (userMetadata?.profile_setup_required === true) return false;
  if (userMetadata?.athlete_onboarding_done === true) return true;
  // Email sign-up already collected the form; treat as done if profile has core fields.
  const first = String(profile?.first_name || "").trim();
  const last = String(profile?.last_name || "").trim();
  const phone = String(profile?.phone || "").trim();
  return Boolean(first && last && phone);
}

export function splitFullName(fullName: string | null | undefined): {
  first_name: string;
  last_name: string;
} {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { first_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], last_name: "" };
  return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
}
