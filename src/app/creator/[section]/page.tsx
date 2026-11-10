import { notFound } from "next/navigation";
import { Roboto } from "next/font/google";
import { Suspense } from "react";
import CreatorWorkspace from "@/components/creator/CreatorWorkspace";
import { PhotoGridSkeleton } from "@/components/ui/Skeleton";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
const sections = ["publications", "statistics", "activity", "profile", "files", "portfolio"] as const;
export default async function CreatorSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as typeof sections[number])) notFound();
  return <div className={`${roboto.className} min-h-screen bg-[#070707] text-white`}><Suspense fallback={<div className="mx-auto max-w-5xl px-[15px] py-6"><PhotoGridSkeleton count={6} /></div>}><CreatorWorkspace section={section} /></Suspense></div>;
}
