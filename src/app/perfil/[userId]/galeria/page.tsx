import { Roboto } from "next/font/google";
import CreatorPortfolioGallery from "@/components/creator/CreatorPortfolioGallery";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
export default async function CreatorPortfolioPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <div className={`${roboto.className} min-h-screen bg-[#070707] text-white`}><CreatorPortfolioGallery userId={userId} /></div>;
}
