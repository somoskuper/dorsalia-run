import type { Metadata } from "next";
import { EventPhotoGrid } from "@/components/activity/EventPhotoRail";
import { SeoHubHero, type SeoHubContent } from "@/components/ExploreView";
import { eventPhotoGroups, type ActivityItem, type EventPhotoGroup } from "@/lib/activity";
import { EVENT_PHOTOS_URL, HOME_COLLECTION_URLS } from "@/lib/homeCollectionUrls";
import { MARKETPLACE_HOST } from "@/lib/races";

export const revalidate = 60;

const COPY = {
  title: "Fotos de eventos",
  seoTitle: "Fotos de eventos y carreras en México",
  description: "Mira las últimas galerías de fotos publicadas por fotógrafos en carreras y eventos deportivos de México.",
  longDescription: "Cada galería reúne en un solo lugar las fotos que todos los fotógrafos publicaron de un evento. Ábrela para ver la serie completa y el enlace de compra de cada fotógrafo.",
  footerHeading: "Galerías de los eventos",
  eyebrow: "Fotógrafos de la comunidad",
  keywords: ["fotos de eventos", "fotos de carreras", "galerías de running", "fotógrafos de eventos México"],
};

const RELATED_TITLES: Record<keyof typeof HOME_COLLECTION_URLS, string> = {
  "recent-finished": "Carreras recién finalizadas",
  top: "Carreras mejor valoradas",
  near: "Carreras de esta semana",
  new: "Nuevos eventos y carreras",
  finished: "Carreras finalizadas y resultados",
};

async function loadPosts(): Promise<EventPhotoGroup[]> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!key) return [];
  const response = await fetch(`${base}/rest/v1/rpc/public_activity_feed`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_limit: 100, p_following_only: false }),
    next: { revalidate: 60 },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return eventPhotoGroups(Array.isArray(data) ? data as ActivityItem[] : []);
}

function galleryUrl(group: EventPhotoGroup) {
  return `https://${MARKETPLACE_HOST}/fotos/${encodeURIComponent(group.event_slug)}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const posts = await loadPosts();
  const url = `https://${MARKETPLACE_HOST}${EVENT_PHOTOS_URL}`;
  return {
    title: COPY.seoTitle,
    description: COPY.description,
    keywords: COPY.keywords,
    alternates: { canonical: url },
    robots: posts.length ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: COPY.seoTitle, description: COPY.description, url, type: "website", locale: "es_MX" },
  };
}

export default async function Page() {
  const posts = await loadPosts();
  const url = `https://${MARKETPLACE_HOST}${EVENT_PHOTOS_URL}`;
  const hub: SeoHubContent = {
    eyebrow: COPY.eyebrow,
    title: COPY.title,
    description: COPY.description,
    eventCount: posts.length,
    countLabel: `${posts.length} galería${posts.length === 1 ? "" : "s"} de fotos`,
    longDescription: COPY.longDescription,
    footerHeading: COPY.footerHeading,
    breadcrumbs: [
      { label: "Dorsalia", href: "/" },
      { label: "Carreras", href: "/carreras" },
      { label: COPY.title },
    ],
    relatedLinks: [
      { href: "/", label: "Inicio de Dorsalia" },
      { href: "/carreras", label: "Todas las carreras" },
      ...Object.entries(HOME_COLLECTION_URLS).map(([key, href]) => ({ href, label: RELATED_TITLES[key as keyof typeof HOME_COLLECTION_URLS] })),
    ],
  };
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage", "@id": `${url}#webpage`, url, name: COPY.seoTitle,
        description: COPY.description, inLanguage: "es-MX",
        isPartOf: { "@id": `https://${MARKETPLACE_HOST}/#website` },
        breadcrumb: { "@id": `${url}#breadcrumb` },
        mainEntity: { "@id": `${url}#photos` },
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Dorsalia", item: `https://${MARKETPLACE_HOST}/` },
          { "@type": "ListItem", position: 2, name: "Carreras", item: `https://${MARKETPLACE_HOST}/carreras` },
          { "@type": "ListItem", position: 3, name: COPY.title, item: url },
        ],
      },
      {
        "@type": "ItemList", "@id": `${url}#photos`, numberOfItems: posts.length,
        itemListElement: posts.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.event_name,
          url: galleryUrl(item),
        })),
      },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <div className="relative min-h-screen bg-[#070707]">
      <section className="relative z-10 px-5 pb-16 pt-[30px]">
        <SeoHubHero content={hub} />
        <EventPhotoGrid groups={posts} />
        <section className="mt-16 border-t border-white/10 pt-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
            <div>
              <h2 className="text-2xl font-black text-white">{hub.footerHeading}</h2>
              <p className="mt-4 max-w-3xl text-pretty text-sm leading-7 text-white/55 md:text-base">{hub.longDescription}</p>
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-white/45">Explorar también</h2>
              <div className="mt-4 flex flex-wrap gap-2">{hub.relatedLinks.map((link) => <a key={link.href} href={link.href} className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-[#c9f24b] hover:text-[#c9f24b]">{link.label}</a>)}</div>
            </div>
          </div>
        </section>
      </section>
    </div>
  </>;
}
