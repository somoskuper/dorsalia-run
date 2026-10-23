import type { MetadataRoute } from "next";
import { HOME_COLLECTION_URLS } from "@/lib/homeCollectionUrls";
import { eventLocationSlug, fetchPublicRaces, MARKETPLACE_HOST, marketplaceEventUrl, raceFacetSlugs, sportCategory } from "@/lib/races";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `https://${MARKETPLACE_HOST}`;
  const races = await fetchPublicRaces({ status: "all" });

  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/carreras`, changeFrequency: "daily", priority: 0.9 },
    ...Object.values(HOME_COLLECTION_URLS).map((path) => ({ url: `${base}${path}`, changeFrequency: "daily" as const, priority: 0.8 })),
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
