import type { MetadataRoute } from "next";
import { isPortfolioName } from "@/lib/creatorPortfolio";
import { EVENT_PHOTOS_URL, HOME_COLLECTION_URLS } from "@/lib/homeCollectionUrls";
import { eventLocationSlug, eventPhotosUrl, fetchPublicRaces, MARKETPLACE_HOST, marketplaceEventUrl, raceFacetSlugs, sportCategory } from "@/lib/races";

export const dynamic = "force-dynamic";

async function photoGalleries() {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!key) return [] as { id: string; race_event_id: string; published_at: string | null; title: string; gallery_name: string }[];
  const response = await fetch(`${base}/rest/v1/creator_publications?select=id,race_event_id,published_at,title,gallery_name&status=eq.published`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const data = await response.json();
  return (Array.isArray(data) ? data : []).filter((row) => !isPortfolioName(row.title) && !isPortfolioName(row.gallery_name));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `https://${MARKETPLACE_HOST}`;
  const [races, galleries] = await Promise.all([fetchPublicRaces({ status: "all" }), photoGalleries()]);

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/carreras`, changeFrequency: "daily", priority: 0.9 },
    ...Object.values(HOME_COLLECTION_URLS).map((path) => ({ url: `${base}${path}`, changeFrequency: "daily" as const, priority: 0.8 })),
    { url: `${base}${EVENT_PHOTOS_URL}`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/iniciar` },
    { url: `${base}/docs/comisiones` },
    { url: `${base}/cookies` },
    { url: `${base}/privacidad` },
    { url: `${base}/terminos` },
    { url: `${base}/normas-comunidad` },
  ];

  const seen = new Set(entries.map((entry) => entry.url));
  const facets = new Set<string>();
  const combinations = new Set<string>();
  const facetModified = new Map<string, string>();
  const combinationModified = new Map<string, string>();
  for (const race of races) {
    if (race.is_published && race.robots_index !== false) {
      const url = marketplaceEventUrl(race);
      if (seen.has(url)) continue;
      seen.add(url);
      entries.push({
        url,
        lastModified: race.updated_at || race.event_date || undefined,
        changeFrequency: "weekly",
        priority: race.is_active ? 0.9 : 0.6,
      });
      const raceGalleries = galleries.filter((item) => item.race_event_id === race.id);
      if (raceGalleries.length) {
        const photosUrl = eventPhotosUrl(race);
        if (!seen.has(photosUrl)) {
          seen.add(photosUrl);
          const latest = raceGalleries.map((item) => item.published_at || "").sort().at(-1) || undefined;
          entries.push({ url: photosUrl, lastModified: latest, changeFrequency: "weekly", priority: 0.7 });
        }
        for (const gallery of raceGalleries) {
          const galleryUrl = `${photosUrl}/${gallery.id}`;
          if (seen.has(galleryUrl)) continue;
          seen.add(galleryUrl);
          entries.push({ url: galleryUrl, lastModified: gallery.published_at || undefined, changeFrequency: "weekly", priority: 0.6 });
        }
      }
      const category = sportCategory(race);
      const modified = String(race.updated_at || race.event_date || "");
      for (const facet of raceFacetSlugs(race)) {
        facets.add(facet);
        if (modified > (facetModified.get(facet) || "")) facetModified.set(facet, modified);
        if (facet !== category) {
          const combination = `${facet}/${category}`;
          combinations.add(combination);
          if (modified > (combinationModified.get(combination) || "")) combinationModified.set(combination, modified);
        }
      }
      const canonicalCombination = `${eventLocationSlug(race)}/${category}`;
      combinations.add(canonicalCombination);
      if (modified > (combinationModified.get(canonicalCombination) || "")) combinationModified.set(canonicalCombination, modified);
    }
  }

  for (const facet of [...facets].sort()) {
    const url = `${base}/carreras/${facet}`;
    if (!seen.has(url)) entries.push({ url, lastModified: facetModified.get(facet) || undefined, changeFrequency: "daily", priority: 0.8 });
  }

  for (const combination of [...combinations].sort()) {
    const url = `${base}/carreras/${combination}`;
    if (!seen.has(url)) entries.push({ url, lastModified: combinationModified.get(combination) || undefined, changeFrequency: "daily", priority: 0.85 });
  }

  return entries;
}
