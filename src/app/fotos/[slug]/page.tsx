import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Roboto } from "next/font/google";
import { fetchPublicRaceByAnySlug, coverImage, marketplaceEventPath, marketplaceEventUrl, billboardSlug, eventPhotosPath, eventPhotosUrl, MARKETPLACE_HOST, type PublicRace } from "@/lib/races";
import { EVENT_PHOTOS_URL } from "@/lib/homeCollectionUrls";
import { isPortfolioName } from "@/lib/creatorPortfolio";
import CreatorEventGallery from "@/components/creator/CreatorEventGallery";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

function plainDescription(race: PublicRace) {
  const text = String(race.short_description || race.meta_description || race.description || "");
  return text.replace(/<[^>]+>/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function publishedGalleries(raceId: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!key) return [] as { id: string; title: string; description: string | null; gallery_name: string }[];
  const response = await fetch(`${base}/rest/v1/creator_publications?select=id,title,description,gallery_name&race_event_id=eq.${raceId}&status=eq.published&order=published_at.desc`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 60 },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (Array.isArray(data) ? data : []).filter((row) => !isPortfolioName(row.title) && !isPortfolioName(row.gallery_name)) as { id: string; title: string; description: string | null; gallery_name: string }[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const race = await fetchPublicRaceByAnySlug(slug);
  if (!race) return {};
  const galleries = await publishedGalleries(race.id);
  const title = `Fotos de ${race.name}`;
  const description = `Todas las fotos de ${race.name} publicadas por los fotógrafos de la comunidad en Dorsalia.`;
  const url = eventPhotosUrl(race);
  const image = coverImage(race);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: galleries.length ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url, type: "website", locale: "es_MX", images: image ? [image] : undefined },
  };
}

export default async function EventPhotosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = await fetchPublicRaceByAnySlug(slug);
  if (!race) notFound();
  const canonical = billboardSlug(race);
  if (decodeURIComponent(slug).trim() !== canonical) redirect(eventPhotosPath(race));
  const galleries = await publishedGalleries(race.id);
  const url = eventPhotosUrl(race);
  const description = `Todas las fotos de ${race.name} publicadas por los fotógrafos de la comunidad en Dorsalia.`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${url}#webpage`, url, name: `Fotos de ${race.name}`, description, inLanguage: "es-MX",
        isPartOf: { "@id": `https://${MARKETPLACE_HOST}/#website` },
        about: { "@type": "SportsEvent", name: race.name, url: marketplaceEventUrl(race) },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#galleries` },
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Dorsalia", item: `https://${MARKETPLACE_HOST}/` },
          { "@type": "ListItem", position: 2, name: "Fotos de eventos", item: `https://${MARKETPLACE_HOST}${EVENT_PHOTOS_URL}` },
          { "@type": "ListItem", position: 3, name: `Fotos de ${race.name}`, item: url },
        ],
      },
      {
        "@type": "ItemList", "@id": `${url}#galleries`, numberOfItems: galleries.length,
        itemListElement: galleries.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.title, url: `${url}/${item.id}` })),
      },
    ],
  };
  return <div className={roboto.className}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <CreatorEventGallery event={{ id: race.id, name: race.name, cover: coverImage(race), description: plainDescription(race), href: marketplaceEventPath(race), slug: canonical }} />
  </div>;
}
