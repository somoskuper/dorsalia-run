"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/client";

export default function CreatorPortfolioGallery({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<{ id: string; image_url: string }[]>([]);
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.from("creator_portfolio_photos").select("photo_id").eq("creator_id", userId).order("sort_order")
      .then(async ({ data }) => {
        const ids = (data || []).map((item) => item.photo_id);
        if (!ids.length) return;
        const { data: images } = await supabase.from("creator_photos").select("id,image_url").in("id", ids);
        if (active) setPhotos(ids.map((id) => (images || []).find((image) => image.id === id)).filter((item): item is { id: string; image_url: string } => Boolean(item)));
      });
    return () => { active = false; };
  }, [userId]);
  return <div className="px-[15px] pb-20"><PageHeader fallbackHref={`/perfil/${userId}`} title="Galería" sticky /><main className="mx-auto mt-10 max-w-[640px]"><h1 className="text-[20px] font-semibold">Galería</h1>{photos.length ? <div className="mt-[10px] grid grid-cols-2 gap-[10px]">{photos.map((photo) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={photo.id} src={photo.image_url} alt="Fotografía del portafolio" className="aspect-square w-full rounded-[20px] object-cover" />)}</div> : <p className="mt-5 text-white/50">No hay fotografías destacadas.</p>}</main></div>;
}
