import { Suspense } from "react";
import SearchPageView from "@/components/SearchPageView";
import { fetchPublicRaces } from "@/lib/races";
import { ListPageSkeleton } from "@/components/ui/Skeleton";

export const revalidate = 60;

export default async function SearchPage() {
  const races = await fetchPublicRaces({ status: "all" });
  return <Suspense fallback={<ListPageSkeleton label="Cargando búsqueda" />}><SearchPageView races={races} /></Suspense>;
}
