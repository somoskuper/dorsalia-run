"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import { isPortfolioName } from "@/lib/creatorPortfolio";
import { createClient } from "@/lib/supabase/client";

export default function CreatorEventPhotosLink({ eventId, slug }: { eventId: string; slug: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    void createClient().from("creator_publications").select("title,gallery_name").eq("race_event_id", eventId).eq("status", "published")
      .then(({ data }) => setCount((data || []).filter((post) => !isPortfolioName(post.title) && !isPortfolioName(post.gallery_name)).length));
  }, [eventId]);
  if (!count) return null;
  return <div className="mt-6 flex justify-center">
    <GlassPanel radius={999} className="shrink-0" style={{ height: 54, width: "fit-content" }} glassProps={{ glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 }}>
      <Link href={`/fotos/${encodeURIComponent(slug)}`} className="flex h-full items-center px-[15px] text-[16px] text-white">Encuentra tus fotos</Link>
    </GlassPanel>
  </div>;
}
