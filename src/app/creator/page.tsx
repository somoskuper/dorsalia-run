import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import CreatorWorkspace from "@/components/creator/CreatorWorkspace";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
export const metadata: Metadata = { title: "Panel creador · Dorsalia" };
export default function CreatorPage() { return <div className={`${roboto.className} min-h-screen bg-[#070707] text-white`}><CreatorWorkspace section="home" /></div>; }
