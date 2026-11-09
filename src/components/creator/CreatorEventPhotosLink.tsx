"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CreatorEventPhotosLink({ eventId, slug }: { eventId: string; slug: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    void createClient().from("creator_publications").select("id", { count: "exact", head: true }).eq("race_event_id", eventId).eq("status", "published")
      .then(({ count: total }) => setCount(total || 0));
  }, [eventId]);
  if (!count) return null;
  return <Link href={`/fotos/${encodeURIComponent(slug)}`} className="mt-6 flex items-center justify-between rounded-[20px] bg-[#191919] px-[15px] py-4 text-[16px] font-semibold">Fotos de fotógrafos <span className="text-white/50">{count} galerías ›</span></Link>;
}
