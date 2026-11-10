import type { Metadata } from "next";
import { notFound } from "next/navigation";
import OrganizerProfileView, {
  type OrganizerSocialLink,
} from "@/components/OrganizerProfileView";
import {
  DEFAULT_PROFILE_COVER,
} from "@/lib/profileCovers";
import {
  cardCoverImage,
  fetchPublicOrganizer,
  fetchPublicRaces,
  marketplaceEventPath,
} from "@/lib/races";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

const SOCIAL_ICONS: Record<string, string> = {
  whatsapp: "/assetsdev/Social-Icons.svg",
  x: "/assetsdev/Social-Icons-1.svg",
  youtube: "/assetsdev/Social-Icons-2.svg",
  tiktok: "/assetsdev/Social-Icons-3.svg",
  facebook: "/assetsdev/Social-Icons-4.svg",
  instagram: "/assetsdev/Social-Icons-5.svg",
};

function collectSocials(
  organizerLinks: Record<string, { url?: string } | undefined> | null | undefined,
): OrganizerSocialLink[] {
  const byKey = new Map<string, OrganizerSocialLink>();
  const order = ["instagram", "facebook", "tiktok", "whatsapp", "youtube", "x"] as const;

  const push = (key: string, url: string) => {
    const icon = SOCIAL_ICONS[key];
    if (!icon || !url.trim() || byKey.has(key)) return;
    byKey.set(key, { key, url: url.trim(), icon });
  };

  const links = organizerLinks || {};
  for (const key of order) {
    const url = String(links[key]?.url || "").trim();
    if (url) push(key, url);
  }

  return order.map((k) => byKey.get(k)).filter((x): x is OrganizerSocialLink => Boolean(x));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchPublicOrganizer(slug);
  if (!data) return { title: "Organizador", robots: { index: false, follow: true } };
  return {
    title: data.organizer.name,
    description:
      String(data.organizer.description || "").trim() ||
      `Carreras organizadas por ${data.organizer.name} en Dorsalia.`,
    alternates: { canonical: `https://dorsalia.run/org/${encodeURIComponent(slug)}` },
  };
}

export default async function OrganizerPage({ params }: Props) {
  const { slug } = await params;
  const [data, publicRaces] = await Promise.all([fetchPublicOrganizer(slug), fetchPublicRaces({ status: "all" })]);
  if (!data) notFound();

  const { organizer, events } = data;
  const eventPaths = Object.fromEntries(publicRaces.map((race) => [race.id, marketplaceEventPath(race)]));
  const coverSrc =
    organizer.cover_url ||
    cardCoverImage(events[0] || ({} as never)) ||
    DEFAULT_PROFILE_COVER;
  const socials = collectSocials(
    organizer.social_links as Record<string, { url?: string }> | null,
  );

  return (
    <OrganizerProfileView
      organizer={organizer}
      events={events}
      eventPaths={eventPaths}
      coverSrc={coverSrc}
      socials={socials}
    />
  );
}
