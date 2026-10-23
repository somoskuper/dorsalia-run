import type { ReactNode } from "react";

type Platform = "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "linkedin" | "mail" | "web";

const LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
  mail: "Correo",
  web: "Sitio",
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      {children}
    </svg>
  );
}

export function SocialIcon({ platform }: { platform: Platform }) {
  switch (platform) {
    case "instagram":
      return (
        <Icon>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
        </Icon>
      );
    case "facebook":
      return (
        <Icon>
          <path
            d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.2L17 11h-3V9c0-.6.4-1 1-1z"
            fill="currentColor"
          />
        </Icon>
      );
    case "tiktok":
      return (
        <Icon>
          <path
            d="M14 4v10.2a3.2 3.2 0 11-2.2-3V8.2A5.5 5.5 0 0014 8V4h2.2A4.8 4.8 0 0020 7.8V10a6.8 6.8 0 01-3.8-1.2V16A5.2 5.2 0 118.8 11"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Icon>
      );
    case "youtube":
      return (
        <Icon>
          <rect x="2.5" y="6" width="19" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M10.5 9.5v5l5-2.5-5-2.5z" fill="currentColor" />
        </Icon>
      );
    case "x":
      return (
        <Icon>
          <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </Icon>
      );
    case "linkedin":
      return (
        <Icon>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 10v7M8 7.5v.2M12 17v-4.2c0-1.5.8-2.3 2-2.3s2 .8 2 2.3V17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </Icon>
      );
    case "mail":
      return (
        <Icon>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </Icon>
      );
    case "web":
      return (
        <Icon>
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3.5 12h17M12 3.5c2.5 2.8 2.5 14.2 0 17M12 3.5c-2.5 2.8-2.5 14.2 0 17" stroke="currentColor" strokeWidth="1.5" />
        </Icon>
      );
    default:
      return null;
  }
}

export function socialLabel(platform: Platform) {
  return LABELS[platform] || platform;
}
