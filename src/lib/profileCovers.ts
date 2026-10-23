export type ProfileCoverPreset = {
  id: string;
  label: string;
  src: string;
};

/** Default hero backgrounds for athlete /cuenta (static WebP in /public). */
export const PROFILE_COVER_PRESETS: ProfileCoverPreset[] = [
  { id: "runner-blur", label: "Velocidad", src: "/images/profile-covers/runner-blur.webp" },
  { id: "track-lines", label: "Pista", src: "/images/profile-covers/track-lines.webp" },
  { id: "track-red", label: "Tartán", src: "/images/profile-covers/track-red.webp" },
  { id: "light-beams", label: "Luces", src: "/images/profile-covers/light-beams.webp" },
  { id: "neon-curves", label: "Neón", src: "/images/profile-covers/neon-curves.webp" },
];

export const DEFAULT_PROFILE_COVER = PROFILE_COVER_PRESETS[0].src;

export function resolveProfileCover(coverUrl: string | null | undefined): string {
  const raw = String(coverUrl || "").trim();
  if (!raw) return DEFAULT_PROFILE_COVER;
  if (raw.startsWith("preset:")) {
    const id = raw.slice("preset:".length);
    return PROFILE_COVER_PRESETS.find((p) => p.id === id)?.src || DEFAULT_PROFILE_COVER;
  }
  return raw;
}

export function isPresetCover(coverUrl: string | null | undefined): boolean {
  const resolved = resolveProfileCover(coverUrl);
  return PROFILE_COVER_PRESETS.some((p) => p.src === resolved || coverUrl === `preset:${p.id}`);
}
