import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExploreView, { type SeoHubContent } from "@/components/ExploreView";
import { SPORT_CATEGORY_LABELS, facetSlug, fetchPublicRaces, marketplaceEventUrl, raceMatchesFacet, sortByClosestDate, sportCategory } from "@/lib/races";

export const revalidate = 60;
type Props = { params: Promise<{ facet: string; sport: string }> };

async function pageData(rawFacet: string, rawSport: string) {
  const facet = facetSlug(rawFacet); const sport = facetSlug(rawSport);
  if (!SPORT_CATEGORY_LABELS[sport]) return { facet, sport, label: "", races: [] };
  const all = (await fetchPublicRaces({ status: "all" })).filter((race) => race.is_published && race.robots_index !== false);
  const races = sortByClosestDate(all.filter((race) => raceMatchesFacet(race, facet) && sportCategory(race) === sport));
  const locationRace = races.find((race) => facetSlug(race.state) === facet || facetSlug(race.city) === facet);
  const label = (locationRace?.state && facetSlug(locationRace.state) === facet ? locationRace.state : locationRace?.city) || facet.replace(/-/g, " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  return { facet, sport, label, races };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { facet: rawFacet, sport: rawSport } = await params; const { facet, sport, label, races } = await pageData(rawFacet, rawSport); const category = SPORT_CATEGORY_LABELS[sport] || "Eventos deportivos";
  const title = `${category} en ${label}: próximas carreras`; const description = `Próximos eventos de ${category.toLowerCase()} en ${label}: fechas, distancias, rutas, precios e inscripciones.`;
  return { title, description, alternates: { canonical: `https://dorsalia.run/carreras/${facet}/${sport}` }, robots: races.length ? { index: true, follow: true } : { index: false, follow: true }, openGraph: { title, description, url: `https://dorsalia.run/carreras/${facet}/${sport}`, type: "website" } };
}

export default async function LocationSportPage({ params }: Props) {
  const { facet: rawFacet, sport: rawSport } = await params; const { facet, sport, label, races } = await pageData(rawFacet, rawSport); if (!races.length) notFound();
  const category = SPORT_CATEGORY_LABELS[sport]; const title = `${category} en ${label}`; const description = `Descubre próximos eventos de ${category.toLowerCase()} en ${label}, compara fechas, modalidades, distancias, precios e inscripciones.`;
  const hub: SeoHubContent = { eyebrow: `${category} · ${label}`, title, description, eventCount: races.length, longDescription: `Esta selección reúne los eventos de ${category.toLowerCase()} disponibles en ${label}. Puedes filtrar próximos eventos, carreras gratuitas, opciones de pago y ediciones finalizadas. Abre cada ficha para consultar sede, fecha, rutas, modalidades, precios, organizador y enlace de inscripción.`, breadcrumbs: [{ label: "Dorsalia", href: "/" }, { label: "Carreras", href: "/carreras" }, { label, href: `/carreras/${facet}` }, { label: category }], relatedLinks: [{ href: `/carreras/${facet}`, label: `Todas las carreras en ${label}` }, { href: `/carreras/${sport}`, label: `${category} en México` }] };
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: `https://dorsalia.run/carreras/${facet}/${sport}`, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Dorsalia", item: "https://dorsalia.run/" }, { "@type": "ListItem", position: 2, name: "Carreras", item: "https://dorsalia.run/carreras" }, { "@type": "ListItem", position: 3, name: label, item: `https://dorsalia.run/carreras/${facet}` }, { "@type": "ListItem", position: 4, name: category, item: `https://dorsalia.run/carreras/${facet}/${sport}` }] }, mainEntity: { "@type": "ItemList", numberOfItems: races.length, itemListElement: races.map((race, index) => ({ "@type": "ListItem", position: index + 1, name: race.name, url: marketplaceEventUrl(race) })) } };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><ExploreView races={races} seoHub={hub} /></>;
}
