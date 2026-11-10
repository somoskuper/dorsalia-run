import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Roboto } from "next/font/google";
import { fetchPublicRaceByAnySlug, coverImage, eventPhotosPath, MARKETPLACE_HOST } from "@/lib/races";
import { isPortfolioName } from "@/lib/creatorPortfolio";
import CreatorPublicationGallery, { type PublicationGallery } from "@/components/creator/CreatorPublicationGallery";

export const revalidate = 60;

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function rest<T>(path: string): Promise<T[]> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!key) return [];
  const response = await fetch(`${base}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 60 } });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data as T[] : [];
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T | null> {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run").replace(/\/$/, "");
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  if (!key) return null;
  const response = await fetch(`${base}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify(body), next: { revalidate: 60 } });
  if (!response.ok) return null;
  const data = await response.json();
  return data && typeof data === "object" && !Array.isArray(data) ? data as T : null;
}

async function loadGallery(slug: string, publicationId: string): Promise<PublicationGallery | null> {
  if (!UUID.test(publicationId)) return null;
  const race = await fetchPublicRaceByAnySlug(slug);
  if (!race) return null;
  const [publication] = await rest<{ id: string; creator_id: string; title: string; description: string; gallery_name: string; purchase_url: string | null; race_event_id: string; activity_post_id: string | null }>(
    `creator_publications?select=id,creator_id,title,description,gallery_name,purchase_url,race_event_id,activity_post_id&or=(id.eq.${publicationId},activity_post_id.eq.${publicationId})&status=eq.published&limit=1`,
  );
  if (!publication || publication.race_event_id !== race.id || isPortfolioName(publication.title) || isPortfolioName(publication.gallery_name)) return null;
  const [photos, [creatorProfile], author] = await Promise.all([
    rest<{ id: string; image_url: string }>(`creator_photos?select=id,image_url&publication_id=eq.${publication.id}&order=sort_order.asc`),
    rest<{ social_links: Record<string, string> | null }>(`creator_profiles?select=social_links&user_id=eq.${publication.creator_id}&limit=1`),
    publication.activity_post_id ? rpc<{ user_id: string; username: string | null; display_name: string; avatar_url: string | null }>("public_activity_post", { p_post_id: publication.activity_post_id }) : Promise.resolve(null),
  ]);
  const path = `${eventPhotosPath(race)}/${publication.id}`;
  return {
    id: publication.id,
    title: publication.title,
    description: publication.description,
    galleryName: publication.gallery_name,
    purchaseUrl: publication.purchase_url,
    photos,
    eventName: race.name,
    eventCover: coverImage(race),
    eventPhotosHref: eventPhotosPath(race),
    activityPostId: publication.activity_post_id,
    path,
    url: `https://${MARKETPLACE_HOST}${path}`,
    creator: author && author.user_id === publication.creator_id ? { userId: author.user_id, username: author.username, displayName: author.display_name, avatarUrl: author.avatar_url, socialLinks: creatorProfile?.social_links || {} } : null,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; publicationId: string }> }): Promise<Metadata> {
  const { slug, publicationId } = await params;
  const gallery = await loadGallery(slug, publicationId);
  if (!gallery) return {};
  const title = `${gallery.title} · ${gallery.eventName}`;
  const description = gallery.description || `Galería ${gallery.galleryName} de ${gallery.eventName} en Dorsalia.`;
  return {
    title,
    description,
    alternates: { canonical: gallery.url },
    openGraph: { title, description, url: gallery.url, type: "website", locale: "es_MX", images: gallery.photos[0] ? [gallery.photos[0].image_url] : undefined },
  };
}

export default async function PublicationPhotosPage({ params }: { params: Promise<{ slug: string; publicationId: string }> }) {
  const { slug, publicationId } = await params;
  const gallery = await loadGallery(slug, publicationId);
  if (!gallery) notFound();
  const requested = `/fotos/${encodeURIComponent(decodeURIComponent(slug).trim())}/${publicationId}`;
  if (requested !== gallery.path) redirect(gallery.path);
  const schema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: gallery.title,
    description: gallery.description || `Galería ${gallery.galleryName} de ${gallery.eventName} en Dorsalia.`,
    url: gallery.url,
    inLanguage: "es-MX",
    isPartOf: { "@type": "CollectionPage", name: `Fotos de ${gallery.eventName}`, url: `https://${MARKETPLACE_HOST}${gallery.eventPhotosHref}` },
    image: gallery.photos.map((photo) => photo.image_url),
  };
  return <div className={roboto.className}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <CreatorPublicationGallery gallery={gallery} />
  </div>;
}
