"use client";

import Link from "next/link";
import RelativeTime from "@/components/activity/RelativeTime";
import { ListRowsSkeleton } from "@/components/ui/Skeleton";

export type SocialNotification = {
  id: string;
  kind: "follow" | "like";
  created_at: string;
  actor_id: string;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  post_type: string | null;
  event_name: string | null;
  unread: boolean;
};

export default function SocialNotifications({ items, loading, error, signedIn }: { items: SocialNotification[]; loading: boolean; error: boolean; signedIn: boolean }) {
  if (!signedIn) return <div className="mx-auto max-w-2xl px-5 py-12 text-center text-white/55">Inicia sesión para ver tu actividad. <Link href="/auth?next=%2F" className="text-[#c9f24b]">Iniciar sesión</Link></div>;
  if (loading) return <ListRowsSkeleton count={6} label="Cargando notificaciones" />;
  if (error) return <p className="px-5 py-12 text-center text-sm text-white/50">No pudimos cargar tus notificaciones.</p>;
  if (!items.length) return <p className="px-5 py-12 text-center text-sm text-white/45">Aquí aparecerán nuevos seguidores y los Me gusta que recibas.</p>;

  return <div className="mx-auto max-w-2xl divide-y divide-white/10">
    {items.map((item) => <Link key={item.id} href={`/perfil/${item.username || item.actor_id}`} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.04]">
      {item.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={item.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">{item.display_name.slice(0, 1).toUpperCase()}</span>}
      <span className="min-w-0 flex-1 text-sm leading-snug text-white/65"><strong className="text-white">{item.username ? `@${item.username}` : item.display_name}</strong> {item.kind === "follow" ? "comenzó a seguirte" : `le dio Me gusta a tu ${item.post_type === "review" ? "reseña" : "publicación"}${item.event_name ? ` de ${item.event_name}` : ""}`}<span className="mt-1 block text-xs text-white/40"><RelativeTime value={item.created_at} /></span></span>
      {item.unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#c9f24b]" aria-label="Nueva" /> : null}
    </Link>)}
  </div>;
}
