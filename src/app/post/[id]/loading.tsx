import { PostSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return <div className="min-h-screen bg-[#070707] pt-[84px]"><div className="mx-auto max-w-2xl"><PostSkeleton count={1} /></div></div>;
}
