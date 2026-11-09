import { Suspense } from "react";
import { Roboto } from "next/font/google";
import CreatorEditor from "@/components/creator/CreatorEditor";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
export default function CreatorNewPage() { return <div className={`${roboto.className} min-h-screen bg-[#070707] text-white`}><Suspense fallback={<p className="px-5 py-10">Cargando…</p>}><CreatorEditor /></Suspense></div>; }
