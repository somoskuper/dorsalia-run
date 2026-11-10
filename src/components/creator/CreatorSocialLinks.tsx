const NETWORKS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "x", label: "X" },
] as const;

export default function CreatorSocialLinks({ links, className = "" }: { links: Record<string, string> | null | undefined; className?: string }) {
  const entries = NETWORKS.filter(({ key }) => typeof links?.[key] === "string" && links[key].startsWith("https://"));
  if (!entries.length) return null;
  return <div className={`flex items-center justify-center gap-5 ${className}`}>
    {entries.map(({ key, label }) => <a key={key} href={links![key]} target="_blank" rel="noopener noreferrer" aria-label={label} className="block h-6 w-6 shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/social-media/${key}.svg`} alt="" width={24} height={24} className="h-6 w-6" />
    </a>)}
  </div>;
}
