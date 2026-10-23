import type { Metadata } from "next";
import ExploreView, { type SeoHubContent } from "@/components/ExploreView";
import { facetSlug, fetchPublicRaces, marketplaceEventUrl, sortByClosestDate, sportCategory, sportCategoryLabel } from "@/lib/races";

export const revalidate = 60;
export const metadata: Metadata = { title: "Carreras y eventos deportivos en México", description: "Encuentra carreras de running, trail, triatlón y otros eventos deportivos por ciudad y estado en México.", alternates: { canonical: "https://dorsalia.run/carreras" } };

export default async function RacesDirectoryPage() {
  const races = sortByClosestDate((await fetchPublicRaces({ status: "all" })).filter((race) => race.is_published && race.robots_index !== false));
  const locations = new Map<string, string>(); const categories = new Map<string, string>();
  for (const race of races) { const location = race.state || race.city; if (location) locations.set(facetSlug(location), location); categories.set(sportCategory(race), sportCategoryLabel(race)); }
  const relatedLinks = [...locations.entries()].map(([slug, label]) => ({ href: `/carreras/${slug}`, label: `Carreras en ${label}` })).concat([...categories.entries()].map(([slug, label]) => ({ href: `/carreras/${slug}`, label })));
  const hub: SeoHubContent = { eyebrow: "Directorio Dorsalia", title: "Carreras y eventos deportivos en México", description: "Encuentra fechas, distancias, rutas, precios e inscripciones de running, trail, triatlón y más disciplinas.", eventCount: races.length, longDescription: "Dorsalia reúne carreras y eventos deportivos de distintos organizadores en un solo directorio. Explora por estado, ciudad o disciplina y usa los filtros para encontrar próximos eventos, opciones gratuitas, carreras de pago o ediciones anteriores.", breadcrumbs: [{ label: "Dorsalia", href: "/" }, { label: "Carreras" }], relatedLinks };
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: hub.title, description: hub.description, url: "https://dorsalia.run/carreras", mainEntity: { "@type": "ItemList", numberOfItems: races.length, itemListElement: races.map((race, index) => ({ "@type": "ListItem", position: index + 1, name: race.name, url: marketplaceEventUrl(race) })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><ExploreView races={races} seoHub={hub} /></>;
}
