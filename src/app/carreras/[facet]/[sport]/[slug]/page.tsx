import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import EventPreview from "@/components/EventPreview";
import {
  billboardSlug, cardCoverImage, coverImage, eventLocationSlug, facetSlug,
  fetchPublicRaceBySlug, fetchPublicRaces, isEventFree, isFinalized, marketplaceEventUrl,
  minPrice, organizerSlugFrom, placeLabel, seoDescription, sportCategory,
  sportCategoryLabel,
} from "@/lib/races";

export const revalidate = 60;
type Props = { params: Promise<{ facet: string; sport: string; slug: string }> };

function absoluteHttpUrl(value: string | null | undefined): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : undefined;
  } catch { return undefined; }
}

function eventOffers(race: Awaited<ReturnType<typeof fetchPublicRaceBySlug>>, eventUrl: string) {
  if (!race) return undefined;
  const target = absoluteHttpUrl(race.external_registration_url) || eventUrl;
  const candidates: Array<{ name: string; price: number; validFrom?: string }> = [];
  for (const phase of race.pricing_phases || []) {
    const price = Number(phase.price);
    if (Number.isFinite(price) && (price > 0 || race.is_free === true)) candidates.push({ name: phase.name || "Inscripción", price, validFrom: phase.starts_at || undefined });
  }
  for (const route of race.routes || []) {
    const price = Number(route.price);
    if (Number.isFinite(price) && (price > 0 || race.is_free === true)) candidates.push({ name: route.label || "Inscripción", price });
  }
  if (!candidates.length) {
    const price = minPrice(race);
    if (price > 0 || isEventFree(race)) candidates.push({ name: "Inscripción", price });
  }
  if (!candidates.length) return undefined;
  const seen = new Set<string>();
  const offers = candidates.filter((candidate) => {
    const key = `${candidate.name}:${candidate.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((candidate) => ({
    "@type": "Offer", name: candidate.name, url: target, price: candidate.price,
    priceCurrency: race.currency || "MXN",
    availability: isFinalized(race) ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    validFrom: candidate.validFrom,
  }));
  return offers.length === 1 ? offers[0] : offers;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const race = await fetchPublicRaceBySlug(slug);
  if (!race) return { title: "Evento no encontrado", robots: { index: false, follow: true } };
  const title = race.meta_title?.trim() || race.name;
  const description = seoDescription(race);
  const url = marketplaceEventUrl(race);
  const cover = cardCoverImage(race) || coverImage(race);
  return {
    title, description, keywords: race.seo_keywords || undefined,
    robots: race.robots_index === false ? { index: false, follow: true } : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", locale: "es_MX", images: cover ? [{ url: cover, alt: `Portada de ${race.name}` }] : [] },
    twitter: { card: "summary_large_image", title, description, images: cover ? [cover] : [] },
  };
}

export default async function EventPage({ params }: Props) {
  const { facet: location, sport, slug } = await params;
  const race = await fetchPublicRaceBySlug(slug);
  if (!race) notFound();
  const canonical = marketplaceEventUrl(race);
  if (facetSlug(location) !== eventLocationSlug(race) || facetSlug(sport) !== sportCategory(race) || facetSlug(slug) !== facetSlug(billboardSlug(race))) permanentRedirect(canonical);

  const relatedRaces = (await fetchPublicRaces({ status: "all" }))
    .filter((candidate) => candidate.id !== race.id && candidate.is_published && candidate.robots_index !== false && !isFinalized(candidate))
    .sort((a, b) => Date.parse(b.updated_at || "") - Date.parse(a.updated_at || ""))
    .slice(0, 8);

  const image = cardCoverImage(race) || coverImage(race);
  const organizerSlug = organizerSlugFrom(race);
  const organizerUrl = organizerSlug ? `https://dorsalia.run/org/${encodeURIComponent(organizerSlug)}` : absoluteHttpUrl(race.organizer_site_url || race.site_url);
  const locationLabel = race.state || race.city || "México";
  const locationUrl = `https://dorsalia.run/carreras/${eventLocationSlug(race)}`;
  const sportUrl = `https://dorsalia.run/carreras/${sportCategory(race)}`;
  const structuredData = {
    "@context": "https://schema.org", "@type": "SportsEvent", "@id": `${canonical}#event`,
    name: race.name, description: seoDescription(race), startDate: race.event_date || undefined,
    endDate: race.event_end_date || race.event_date || undefined,
    eventStatus: isFinalized(race) ? "https://schema.org/EventCompleted" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place", name: race.venue_name || placeLabel(race),
      address: { "@type": "PostalAddress", streetAddress: race.address_line || undefined, addressLocality: race.city || undefined, addressRegion: race.state || undefined, postalCode: race.postal_code || undefined, addressCountry: race.country || "MX" },
      geo: race.latitude != null && race.longitude != null ? { "@type": "GeoCoordinates", latitude: race.latitude, longitude: race.longitude } : undefined,
    },
    image: image ? [image] : undefined, url: canonical,
    organizer: { "@type": "Organization", name: race.organizer_name || race.name, url: organizerUrl },
    offers: eventOffers(race, canonical), isAccessibleForFree: isEventFree(race),
    sport: sportCategoryLabel(race), keywords: race.seo_keywords?.join(", ") || undefined,
  };
  const breadcrumbData = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Dorsalia", item: "https://dorsalia.run/" },
      { "@type": "ListItem", position: 2, name: "Carreras", item: "https://dorsalia.run/carreras" },
      { "@type": "ListItem", position: 3, name: locationLabel, item: locationUrl },
      { "@type": "ListItem", position: 4, name: sportCategoryLabel(race), item: sportUrl },
      { "@type": "ListItem", position: 5, name: race.name, item: canonical },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }} />
    <nav aria-label="Migas de navegación" className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-3 text-xs text-white/55 sm:px-8">
      <Link href="/">Dorsalia</Link><span>/</span><Link href="/carreras">Carreras</Link><span>/</span>
      <Link href={`/carreras/${eventLocationSlug(race)}`}>{locationLabel}</Link><span>/</span>
      <Link href={`/carreras/${sportCategory(race)}`}>{sportCategoryLabel(race)}</Link><span>/</span><span className="text-white/80">{race.name}</span>
    </nav>
    <EventPreview race={race} relatedRaces={relatedRaces} standalone />
  </>;
}
