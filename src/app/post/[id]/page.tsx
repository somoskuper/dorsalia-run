import { Roboto } from "next/font/google";
import PostDetail from "@/components/activity/PostDetail";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600", "700"], display: "swap" });

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className={roboto.className}><PostDetail postId={id} /></div>;
}
