import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import CreatorAccountType from "@/components/settings/CreatorAccountType";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
export const metadata: Metadata = { title: "Tipo de cuenta · Dorsalia" };

export default function CreatorAccountTypePage() {
  return <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-16 text-white`}><CreatorAccountType /></div>;
}
