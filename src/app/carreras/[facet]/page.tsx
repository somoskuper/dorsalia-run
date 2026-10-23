import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExploreView, { type SeoHubContent } from "@/components/ExploreView";
import { SPORT_CATEGORY_LABELS, facetSlug, fetchPublicRaces, marketplaceEventUrl, raceMatchesFacet, sortByClosestDate, sportCategory, sportCategoryLabel } from "@/lib/races";

export const revalidate = 60;
type Props = { params: Promise<{ facet: string }> };

async function facetData(raw: string) {
  const facet = facetSlug(raw);
  const all = (await fetchPublicRaces({ status: "all" })).filter((race) => race.is_published && race.robots_index !== false);
  const races = sortByClosestDate(all.filter((race) => raceMatchesFacet(race, facet)));
  const isSport = Boolean(SPORT_CATEGORY_LABELS[facet]);
  const locationRace = races.find((race) => facetSlug(race.state) === facet || facetSlug(race.city) === facet);
  const label = facet === "yucatan" && !isSport ? "Yucatán" : isSport ? SPORT_CATEGORY_LABELS[facet] : (locationRace?.state && facetSlug(locationRace.state) === facet ? locationRace.state : locationRace?.city) || facet.replace(/-/g, " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  return { facet, races, isSport, label };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { facet: raw } = await params;
  const { facet, races, isSport, label } = await facetData(raw);
  const title = facet === "yucatan" && !isSport ? "Carreras en Yucatán: calendario, rutas y resultados" : isSport ? `${label}: carreras y eventos en México` : `Carreras en ${label}`;
  const description = facet === "yucatan" && !isSport
    ? "Explora carreras en Yucatán y eventos de running en Mérida y otras sedes. Consulta fechas, distancias, inscripciones y resultados cuando estén disponibles."
    : isSport ? `Próximos eventos de ${label.toLowerCase()} en México: fechas, ubicaciones, modalidades, precios e inscripciones.` : `Próximas carreras y eventos deportivos en ${label}: fechas, rutas, precios e inscripciones.`;
  return { title, description, alternates: { canonical: `https://dorsalia.run/carreras/${facet}` }, robots: races.length ? { index: true, follow: true } : { index: false, follow: true }, openGraph: { title, description, url: `https://dorsalia.run/carreras/${facet}`, type: "website" } };
}

export default async function RaceFacetPage({ params }: Props) {
  const { facet: raw } = await params;
  const { facet, races, isSport, label } = await facetData(raw);
  if (!races.length) notFound();
  const isYucatan = facet === "yucatan" && !isSport;
  const title = isYucatan ? "Carreras en Yucatán: calendario y resultados" : isSport ? `${label} en México` : `Carreras en ${label}`;
  const categories = new Map(races.map((race) => [sportCategory(race), sportCategoryLabel(race)]));
  const cities = new Map<string, string>();
  if (isYucatan) {
    for (const race of races) {
      const city = race.city?.trim();
      const slug = facetSlug(city);
      if (city && slug && slug !== facet && !cities.has(slug)) cities.set(slug, city);
    }
  }
  const relatedLinks = isSport
    ? [...new Map(races.map((race) => [facetSlug(race.state || race.city), race.state || race.city])).entries()].filter(([slug]) => slug).map(([slug, location]) => ({ href: `/carreras/${slug}/${facet}`, label: `${label} en ${location}` }))
    : [...categories.entries()].map(([slug, category]) => ({ href: `/carreras/${facet}/${slug}`, label: `${category} en ${label}` }));
  const description = isYucatan
    ? "Explora carreras de running y otros eventos deportivos en Yucatán. Compara fechas, sedes, distancias e inscripciones; consulta resultados cuando estén disponibles."
    : isSport ? `Compara próximos eventos de ${label.toLowerCase()}, sus distancias, fechas, precios y opciones de inscripción en México.` : `Consulta fechas, modalidades, rutas, precios e inscripciones de carreras y eventos deportivos en ${label}.`;
  const hub: SeoHubContent = {
    eyebrow: isSport ? "Eventos por disciplina" : "Eventos por ubicación", title, description, eventCount: races.length,
    longDescription: isYucatan
      ? "Este directorio reúne carreras publicadas por organizadores e indexadas a partir de fuentes públicas. Usa los filtros para explorar eventos próximos o finalizados. Los datos pueden cambiar: revisa cada ficha y confirma horarios, rutas e inscripciones con la fuente oficial."
      : isSport ? `Este directorio reúne eventos de ${label.toLowerCase()} publicados en Dorsalia. Usa los filtros para separar próximos eventos, opciones gratuitas, carreras de pago y ediciones finalizadas; cada ficha incluye la información disponible de fecha, sede, modalidades, precios y organizador.` : `Aquí encontrarás carreras en ${label} publicadas por organizadores y fuentes verificables. Filtra entre próximos eventos, carreras gratuitas, opciones de pago y ediciones finalizadas, y consulta en cada ficha sus distancias, ruta, precio y datos de inscripción.`,
    breadcrumbs: [{ label: "Dorsalia", href: "/" }, { label: "Carreras", href: "/carreras" }, { label }], relatedLinks,
    ...(isYucatan ? { footerHeading: "Cómo explorar las carreras en Yucatán" } : {}),
  };
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url: `https://dorsalia.run/carreras/${facet}`, breadcrumb: { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Dorsalia", item: "https://dorsalia.run/" }, { "@type": "ListItem", position: 2, name: "Carreras", item: "https://dorsalia.run/carreras" }, { "@type": "ListItem", position: 3, name: label, item: `https://dorsalia.run/carreras/${facet}` }] }, mainEntity: { "@type": "ItemList", numberOfItems: races.length, itemListElement: races.map((race, index) => ({ "@type": "ListItem", position: index + 1, name: race.name, url: marketplaceEventUrl(race) })) } };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <ExploreView races={races} seoHub={hub} />
    {isYucatan ? (
      <section className="bg-[#070707] px-5 pb-20 text-white" aria-labelledby="yucatan-guide-title">
        <div className="mx-auto max-w-6xl border-t border-white/10 pt-10">
          <h2 id="yucatan-guide-title" className="text-2xl font-black tracking-tight md:text-3xl">Guía de carreras en Yucatán</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 md:text-base">
            Encuentra eventos de running y otras disciplinas en el estado. Compara las fechas y sedes de las carreras publicadas, revisa la información de cada organizador y elige la opción que se ajuste a tu distancia y presupuesto.
          </p>
          {cities.size ? (
            <div className="mt-9">
              <h3 className="text-lg font-bold">Carreras por ciudad y sede</h3>
              <p className="mt-2 text-sm leading-6 text-white/60">Explora las ciudades de Yucatán que actualmente tienen eventos en el directorio:</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[...cities].slice(0, 8).map(([slug, city]) => (
                  <a key={slug} href={`/carreras/${slug}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-[#c9f24b] hover:text-[#c9f24b]">Carreras en {city}</a>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-9 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-bold">Próximas carreras, rutas e inscripciones</h3>
              <p className="mt-2 text-sm leading-7 text-white/65">Usa la pestaña «Próximos» para ver los siguientes eventos. Cada ficha muestra los detalles disponibles de fecha, lugar, modalidad, distancia, ruta y precio; consulta el enlace oficial antes de inscribirte.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold">Resultados y reseñas de carreras finalizadas</h3>
              <p className="mt-2 text-sm leading-7 text-white/65">En «Finalizados» puedes buscar ediciones pasadas, consultar resultados cronometrados si se han publicado y compartir tu experiencia mediante una reseña. Dorsalia no realiza el cronometraje.</p>
            </div>
          </div>
          <p className="mt-9 text-sm leading-6 text-white/55">¿Buscas otras opciones? <a href="/carreras" className="font-semibold text-[#c9f24b] underline underline-offset-4">Explora todas las carreras en México</a> o vuelve al <a href="/" className="font-semibold text-[#c9f24b] underline underline-offset-4">inicio de Dorsalia</a>.</p>
        </div>
      </section>
    ) : null}
  </>;
}
