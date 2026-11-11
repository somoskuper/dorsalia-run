"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RelativeTime from "@/components/activity/RelativeTime";
import { FirstEventBadgeModal } from "@/components/reviews/EventReviews";
import { ListRowsSkeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";

export type SocialNotification = {
  id: string;
  kind: "follow" | "like" | "medal";
  created_at: string;
  actor_id: string | null;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  post_type: string | null;
  event_name: string | null;
  medal_award_id: string | null;
  medal_name: string | null;
  medal_image_url: string | null;
  unread: boolean;
};

export default function SocialNotifications({ items, loading, error, signedIn }: { items: SocialNotification[]; loading: boolean; error: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState("");
  const [claimedMedal, setClaimedMedal] = useState<{ name: string; imageUrl: string } | null>(null);

  async function claimMedal(item: SocialNotification) {
    if (!item.medal_award_id || claimingId) return;
    setClaimingId(item.medal_award_id);
    setClaimError("");
    const { error: claimRpcError } = await createClient().rpc("claim_medal_award", { p_medal_award_id: item.medal_award_id });
    setClaimingId(null);
    if (claimRpcError) {
      setClaimError(claimRpcError.message || "No pudimos reclamar la medalla.");
      return;
    }
    setClaimedMedal({ name: item.medal_name || "Nueva medalla", imageUrl: item.medal_image_url || "/assetsdev/primer-evento-dorsalia.webp" });
    window.dispatchEvent(new CustomEvent("dorsalia:social-updated"));
  }

  if (!signedIn) return <div className="mx-auto max-w-2xl px-5 py-12 text-center text-white/55">Inicia sesión para ver tu actividad. <Link href="/auth?next=%2F" className="text-[#c9f24b]">Iniciar sesión</Link></div>;
  if (loading) return <ListRowsSkeleton count={6} label="Cargando notificaciones" />;
  if (error) return <p className="px-5 py-12 text-center text-sm text-white/50">No pudimos cargar tus notificaciones.</p>;
  if (!items.length && !claimedMedal) return <p className="px-5 py-12 text-center text-sm text-white/45">Aquí aparecerán tus nuevas medallas, seguidores y los Me gusta que recibas.</p>;

  return <div className="mx-auto max-w-2xl divide-y divide-white/10">
    {claimError ? <p className="px-5 py-3 text-center text-sm text-red-300">{claimError}</p> : null}
    {items.map((item) => item.kind === "medal" ? <button key={item.id} type="button" onClick={() => void claimMedal(item)} disabled={claimingId === item.medal_award_id} className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-60">
      {item.medal_image_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.medal_image_url} alt="" className="h-12 w-12 shrink-0 object-contain" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#c9f24b]/10 text-xl">🏅</span>}
      <span className="min-w-0 flex-1 text-sm leading-snug text-white/65"><strong className="block text-[#c9f24b]">{claimingId === item.medal_award_id ? "Reclamando…" : "Reclama tu medalla"}</strong>{item.medal_name || "Nueva medalla"}{item.event_name ? ` · ${item.event_name}` : ""}<span className="mt-1 block text-xs text-white/40"><RelativeTime value={item.created_at} /></span></span>
      {item.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#c9f24b]" aria-label="Nueva" /> : null}
    </button> : <Link key={item.id} href={`/perfil/${item.username || item.actor_id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.04]">
      {item.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">{item.display_name.slice(0, 1).toUpperCase()}</span>}
      <span className="min-w-0 flex-1 text-sm leading-snug text-white/65"><strong className="text-white">{item.username ? `@${item.username}` : item.display_name}</strong> {item.kind === "follow" ? "comenzó a seguirte" : `le dio Me gusta a tu ${item.post_type === "review" ? "reseña" : "publicación"}${item.event_name ? ` de ${item.event_name}` : ""}`}<span className="mt-1 block text-xs text-white/40"><RelativeTime value={item.created_at} /></span></span>
      {item.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#c9f24b]" aria-label="Nueva" /> : null}
    </Link>)}
    {claimedMedal ? <FirstEventBadgeModal
      onClose={() => setClaimedMedal(null)}
      eyebrow="¡Felicidades!"
      title={claimedMedal.name}
      imageUrl={claimedMedal.imageUrl}
      message="La medalla ya está en Tus retos. Ábrela ahí para consultar sus beneficios y usarla."
      buttonLabel="Ver en Tus retos"
      onAction={() => { setClaimedMedal(null); router.push("/cuenta?tab=perfil&section=medallas"); }}
    /> : null}
  </div>;
}
