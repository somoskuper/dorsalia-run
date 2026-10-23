import { Suspense } from "react";
import SearchPageView from "@/components/SearchPageView";
import { fetchPublicRaces } from "@/lib/races";

export const revalidate = 60;

export default async function SearchPage() {
  const races = await fetchPublicRaces({ status: "all" });
  return <Suspense fallback={<div className="min-h-screen bg-[#070707]" />}><SearchPageView races={races} /></Suspense>;
}
