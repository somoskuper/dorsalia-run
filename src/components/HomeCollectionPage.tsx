import type { Metadata } from "next";
import ExploreView, { type SeoHubContent } from "@/components/ExploreView";
import { HOME_COLLECTION_URLS, type HomeCollectionId } from "@/lib/homeCollectionUrls";
import { fetchPublicRaces, isFinalized, marketplaceEventUrl, sortByClosestDate, type PublicRace } from "@/lib/races";

type CollectionCopy = {
  title: string;
  seoTitle: string;
  description: string;
  longDescription: string;
  footerHeading: string;
  eyebrow: string;
  keywords: string[];
};

const COPY: Record<HomeCollectionId, CollectionCopy> = {
  "recent-finished": {
    title: "Carreras recién finalizadas",
    seoTitle: "Carreras recién finalizadas en México: resultados y reseñas",
    description: "Explora carreras recién terminadas en México. Busca resultados disponibles, comparte tu experiencia, puntúa, califica y comenta cada evento.",
    longDescription: "Estas carreras terminaron en los últimos siete días. En sus fichas puedes buscar resultados cuando estén disponibles y, si participaste, puntuar, calificar y comentar tu experiencia. Los filtros Con resultados y Sin resultados se refieren a cronometrajes publicados en Dorsalia; consulta también la fuente oficial del evento.",
    footerHeading: "Resultados, calificaciones y comentarios",
    eyebrow: "Eventos recientes",
    keywords: ["carreras recién finalizadas", "resultados de carreras", "calificar carreras", "reseñas de eventos deportivos"],
  },
  top: {
    title: "Carreras mejor valoradas",
    seoTitle: "Carreras mejor valoradas y destacadas en México",
    description: "Descubre carreras y eventos deportivos destacados por reseñas, comentarios y actividad de la comunidad en México.",
    longDescription: "Esta selección reúne eventos vigentes destacados por la actividad de la comunidad, incluidas reseñas, comentarios, visitas y guardados. Consulta cada ficha para conocer la fecha, sede, modalidades e información de inscripción.",
    footerHeading: "Explora carreras destacadas",
    eyebrow: "Selección de la comunidad",
    keywords: ["carreras mejor valoradas", "reseñas de carreras", "eventos deportivos México"],
  },
  near: {
    title: "Carreras de esta semana",
    seoTitle: "Carreras y eventos deportivos de esta semana en México",
    description: "Encuentra carreras programadas esta semana en México: fechas, sedes, rutas, precios e inscripciones.",
    longDescription: "Revisa los eventos de la semana en curso, de lunes a domingo según la hora de Mérida. Las fechas y condiciones pueden cambiar; confirma los detalles en la ficha y con el organizador antes de asistir.",
    footerHeading: "Planea tu próxima carrera",
    eyebrow: "Agenda de carreras",
    keywords: ["carreras esta semana", "carreras este fin de semana", "eventos deportivos México"],
  },
  new: {
    title: "Nuevos eventos y carreras",
    seoTitle: "Nuevos eventos y carreras en México",
    description: "Explora las carreras y eventos deportivos añadidos o actualizados recientemente en Dorsalia, con fechas, sedes e inscripciones.",
    longDescription: "Aquí aparecen las fichas vigentes con actualizaciones recientes. Consulta la fecha, sede, modalidades y precios de cada carrera antes de inscribirte; los datos pueden cambiar conforme el organizador publique novedades.",
    footerHeading: "Descubre nuevas carreras",
    eyebrow: "Novedades del directorio",
    keywords: ["nuevas carreras", "nuevos eventos deportivos", "carreras en México"],
  },
  finished: {
    title: "Carreras finalizadas y resultados",
    seoTitle: "Carreras finalizadas en México: resultados, reseñas y comentarios",
    description: "Busca carreras finalizadas en México, consulta resultados cuando estén disponibles y comparte puntuaciones, calificaciones y comentarios.",
    longDescription: "Este archivo reúne ediciones finalizadas anteriores a las más recientes. Abre la ficha de tu carrera para buscar resultados disponibles, puntuar y calificar tu experiencia o dejar un comentario. Los filtros Con resultados y Sin resultados se refieren a cronometrajes publicados en Dorsalia, que no realiza el cronometraje; consulta también la fuente oficial del evento.",
    footerHeading: "Busca resultados y comparte tu experiencia",
    eyebrow: "Archivo de carreras",
    keywords: ["carreras finalizadas", "resultados de carreras", "puntuar carreras", "calificar eventos", "comentarios de carreras"],
  },
};

function discoveryScore(race: PublicRace) {
  const reviews = Number(race.review_count) || 0;
  const rating = Number(race.rating_average) || 0;
  const comments = (Number(race.review_comment_count) || 0) + (Number(race.community_comment_count) || 0);
  return (reviews ? rating * 60 : 0) + reviews * 22 + comments * 7 + (Number(race.share_count) || 0) * 10 + (Number(race.save_count) || 0) * 8 + Math.log1p(Number(race.view_count) || 0) * 12;
}

function currentMondayRange() {
  const merida = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Merida", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(merida.find((item) => item.type === type)?.value || 0);
  const localDate = new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
  const mondayDate = new Date(localDate.getTime() - ((localDate.getUTCDay() + 6) % 7) * 86_400_000);
  const start = mondayDate.getTime() + 6 * 60 * 60 * 1000;
  return { start, end: start + 7 * 86_400_000 };
}

function recentlyFinished(races: PublicRace[], now: number) {
  const weekAgo = now - 7 * 86_400_000;
  return races.filter((race) => {
    const eventTime = Date.parse(race.event_date || "");
    return Number.isFinite(eventTime) && eventTime <= now && eventTime >= weekAgo && (isFinalized(race) || eventTime < now);
  }).sort((a, b) => {
    const score = (race: PublicRace) => (Number(race.rating_average) || 0) * 100 + (Number(race.review_count) || 0) * 20 + Math.log1p(Number(race.view_count) || 0) * 15;
    return score(b) - score(a) || (Number(b.review_count) || 0) - (Number(a.review_count) || 0) || (Number(b.view_count) || 0) - (Number(a.view_count) || 0);
  });
}

function collectionRaces(id: HomeCollectionId, all: PublicRace[]) {
  const races = all.filter((race) => race.is_published && race.robots_index !== false);
  const now = Date.now();
  if (id === "recent-finished") return recentlyFinished(races, now);
  if (id === "top") return races.filter((race) => !isFinalized(race)).sort((a, b) => discoveryScore(b) - discoveryScore(a) || (Date.parse(a.event_date || "") || Number.MAX_SAFE_INTEGER) - (Date.parse(b.event_date || "") || Number.MAX_SAFE_INTEGER));
  if (id === "near") {
    const week = currentMondayRange();
    return sortByClosestDate(races.filter((race) => {
      const eventTime = Date.parse(race.event_date || "");
      return !isFinalized(race) && Number.isFinite(eventTime) && eventTime >= week.start && eventTime < week.end;
    }));
  }
  if (id === "new") return races.filter((race) => !isFinalized(race)).sort((a, b) => Date.parse(b.updated_at || "") - Date.parse(a.updated_at || ""));
  const recentIds = new Set(recentlyFinished(races, now).map((race) => race.id));
  return races.filter((race) => isFinalized(race) && !recentIds.has(race.id)).sort((a, b) => Date.parse(b.event_date || "") - Date.parse(a.event_date || ""));
}

export async function homeCollectionMetadata(id: HomeCollectionId): Promise<Metadata> {
  const copy = COPY[id];
  const races = collectionRaces(id, await fetchPublicRaces({ status: "all" }));
  const url = `https://dorsalia.run${HOME_COLLECTION_URLS[id]}`;
  return {
    title: copy.seoTitle,
    description: copy.description,
    keywords: copy.keywords,
    alternates: { canonical: url },
    robots: races.length ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: copy.seoTitle, description: copy.description, url, type: "website", locale: "es_MX" },
  };
}

export default async function HomeCollectionPage({ id }: { id: HomeCollectionId }) {
  const copy = COPY[id];
  const races = collectionRaces(id, await fetchPublicRaces({ status: "all" }));
  const url = `https://dorsalia.run${HOME_COLLECTION_URLS[id]}`;
  const breadcrumbs = [
    { label: "Dorsalia", href: "/" },
    { label: "Carreras", href: "/carreras" },
    { label: copy.title },
  ];
  const relatedLinks = [
    { href: "/", label: "Inicio de Dorsalia" },
    { href: "/carreras", label: "Todas las carreras" },
    ...Object.entries(HOME_COLLECTION_URLS).filter(([key]) => key !== id).map(([key, href]) => ({ href, label: COPY[key as HomeCollectionId].title })),
  ];
  const finishedCollection = id === "recent-finished" || id === "finished";
  const resultsKnown = races.every((race) => typeof race.has_timed_results === "boolean");
  const filterTabs: SeoHubContent["filterTabs"] = finishedCollection
    ? resultsKnown
      ? [{ id: "all", label: "Todos" }, { id: "with-results", label: "Con resultados" }, { id: "without-results", label: "Sin resultados" }]
      : [{ id: "all", label: "Todos" }]
    : id === "top"
      ? [{ id: "all", label: "Todos" }, { id: "with-reviews", label: "Con reseñas" }, { id: "free", label: "Gratis" }, { id: "paid", label: "De pago" }]
      : [{ id: "all", label: "Todos" }, { id: "free", label: "Gratis" }, { id: "paid", label: "De pago" }];
  const hub: SeoHubContent = {
    eyebrow: copy.eyebrow, title: copy.title, description: copy.description,
    eventCount: races.length, longDescription: copy.longDescription, footerHeading: copy.footerHeading,
    initialFilter: "all", filterTabs, preserveOrder: true, breadcrumbs, relatedLinks,
  };
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${url}#webpage`, url, name: copy.seoTitle,
        description: copy.description, inLanguage: "es-MX",
        isPartOf: { "@id": "https://dorsalia.run/#website" },
        publisher: { "@id": "https://dorsalia.run/#organization" },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#events` },
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Dorsalia", item: "https://dorsalia.run/" },
          { "@type": "ListItem", position: 2, name: "Carreras", item: "https://dorsalia.run/carreras" },
          { "@type": "ListItem", position: 3, name: copy.title, item: url },
        ],
      },
      {
        "@type": "ItemList", "@id": `${url}#events`, numberOfItems: races.length,
        itemListElement: races.map((race, index) => ({
          "@type": "ListItem", position: index + 1, name: race.name, url: marketplaceEventUrl(race),
        })),
      },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <ExploreView races={races} seoHub={hub} />
  </>;
}
