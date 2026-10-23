/** Google OAuth pictures default to 96px. Request a sharper original for profile use. */
export function highResolutionAvatar(url: string | null | undefined): string | null {
  const value = String(url || "").trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.hostname !== "googleusercontent.com" && !parsed.hostname.endsWith(".googleusercontent.com")) return value;
    return value.replace(/=s\d+(-c)?(?=$|[?#])/i, "=s720$1");
  } catch {
    return value;
  }
}
