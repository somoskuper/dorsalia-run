import { Suspense } from "react";
import { Roboto } from "next/font/google";
import CreatorEditor from "@/components/creator/CreatorEditor";
import { SettingsFieldsSkeleton } from "@/components/ui/Skeleton";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });
export default function CreatorNewPage() { return <div className={`${roboto.className} min-h-screen bg-[#070707] text-white`}><Suspense fallback={<div className="mx-auto max-w-[640px] px-[15px] pt-5"><SettingsFieldsSkeleton /></div>}><CreatorEditor /></Suspense></div>; }
