import { Suspense } from "react";
import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import ExploreView from "@/components/ExploreView";
import { fetchMarketplaceAdCards } from "@/lib/marketplaceAds";
import { billboardSlug, cardCoverImage, coverImage, fetchPublicRaceBySlug, fetchPublicRaces, marketplaceEventUrl, seoDescription } from "@/lib/races";

/** Cache public cartelera for 60s — fetchPublicRaces already uses revalidate: 60 */
export const revalidate = 60;

const HOME_TITLE = "Carreras de running y eventos deportivos en México | Dorsalia.run";
const HOME_DESCRIPTION =
  "Encuentra carreras de running, trail y triatlón en México. Consulta fechas, sedes, distancias y resultados disponibles para elegir tu próximo evento en Dorsalia.run.";

type Props = {
  searchParams: Promise<{ status?: string; q?: string; e?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const slug = (await searchParams).e?.trim().toLowerCase();
  if (!slug) {
    const heroAd = (await fetchMarketplaceAdCards()).find((ad) => ad.slug === "dorsalia");
    const title = heroAd?.title ? `${heroAd.title} | Dorsalia.run` : HOME_TITLE;
    const description = heroAd?.description || HOME_DESCRIPTION;
    return {
    title: { absolute: title },
    description,
    alternates: { canonical: "https://dorsalia.run/" },
    openGraph: {
      title,
      description,
      url: "https://dorsalia.run/",
      siteName: "Dorsalia.run",
      type: "website",
      locale: "es_MX",
      images: [{ url: "/images/marketplace-hero.webp", width: 1200, height: 800 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/marketplace-hero.webp"],
    },
  };
  }

  const races = await fetchPublicRaces({ status: "all" });
  const race = races.find((item) => billboardSlug(item) === slug);
  if (!race) return { alternates: { canonical: "https://dorsalia.run/" }, robots: { index: false, follow: true } };

  const title = race.meta_title?.trim() || race.name;
  const description = seoDescription(race);
  const url = marketplaceEventUrl(race);
  const cover = cardCoverImage(race) || coverImage(race);
  const image = cover ? new URL(cover, "https://dorsalia.run").toString() : "https://dorsalia.run/images/marketplace-hero.webp";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "es_MX",
      images: [{ url: image, alt: `Portada de ${race.name}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const legacyEventSlug = sp.e?.trim().toLowerCase();
  if (legacyEventSlug) {
    const legacyRace = await fetchPublicRaceBySlug(legacyEventSlug);
    permanentRedirect(legacyRace ? marketplaceEventUrl(legacyRace) : `/evento/${encodeURIComponent(legacyEventSlug)}`);
  }
  const statusRaw = (sp.status || "all").toLowerCase();
  const status =
    statusRaw === "active" || statusRaw === "inactive" ? statusRaw : "all";
  const q = (sp.q || "").trim();
  const allRaces = await fetchPublicRaces({ status: "all" });
  const adCards = await fetchMarketplaceAdCards();
  const races =
    status === "all"
      ? allRaces
      : allRaces.filter((r) => (status === "active" ? r.is_active : !r.is_active));

  const activeCount = allRaces.filter((r) => r.is_active).length;
  const inactiveCount = allRaces.length - activeCount;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "@id": "https://dorsalia.run/#organization", name: "Dorsalia", url: "https://dorsalia.run/", logo: "https://dorsalia.run/apple-touch-icon.png" },
          { "@type": "WebSite", "@id": "https://dorsalia.run/#website", url: "https://dorsalia.run/", name: "Dorsalia.run", description: HOME_DESCRIPTION, inLanguage: "es-MX", publisher: { "@id": "https://dorsalia.run/#organization" }, potentialAction: { "@type": "SearchAction", target: "https://dorsalia.run/buscar?q={search_term_string}", "query-input": "required name=search_term_string" } },
        ],
      }) }} />
      <Suspense fallback={<div className="min-h-[60vh] bg-[#070707]" />}>
        <ExploreView
          races={races}
          adCards={adCards}
          status={status}
          q={q}
          counts={{ all: allRaces.length, active: activeCount, inactive: inactiveCount }}
        />
      </Suspense>
    </div>
  );
}
