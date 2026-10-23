import type { Metadata } from "next";
import HomeCollectionPage, { homeCollectionMetadata } from "@/components/HomeCollectionPage";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return homeCollectionMetadata("recent-finished");
}

export default function Page() {
  return <HomeCollectionPage id="recent-finished" />;
}
