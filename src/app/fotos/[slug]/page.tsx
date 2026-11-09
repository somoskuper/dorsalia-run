import { notFound } from "next/navigation";
import { Roboto } from "next/font/google";
import { Suspense } from "react";
import { fetchPublicRaceBySlug } from "@/lib/races";
import CreatorEventGallery from "@/components/creator/CreatorEventGallery";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
export default async function EventPhotosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = await fetchPublicRaceBySlug(slug);
  if (!race) notFound();
  return <div className={`${roboto.className} min-h-screen bg-[#070707] text-white`}><Suspense fallback={<p className="px-5 py-10">Cargando fotos…</p>}><CreatorEventGallery event={{ id: race.id, name: race.name, cover: race.cover_image_url, slug }} /></Suspense></div>;
}
