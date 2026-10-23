import type { Metadata } from "next";
import RutasView from "@/components/RutasView";
import { fetchPublicRaces } from "@/lib/races";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rutas",
  description: "Motion graphic de rutas GPS · Dorsalia",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://rutas.dorsalia.run",
  },
};

export default async function RutasPage() {
  const races = await fetchPublicRaces({ status: "active" });
  return <RutasView races={races} />;
}
