"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ActivityFeed from "@/components/activity/ActivityFeed";
import { ListRowsSkeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { fetchSuggestedPeople, hydrateSuggestedAvatars, type SuggestedPerson } from "@/lib/suggestedPeople";

function avatarThumb(url: string | null) {
  if (!url) return null;
  return url.replace(/=s\d+(-c)?(?=$|[?#])/i, "=s96$1");
}

function countLabel(count: number, one: string, many: string) {
  if (!count) return null;
  return `${count} ${count === 1 ? one : many}`;
}

function detail(person: SuggestedPerson) {
  return [
    countLabel(person.followers, "seguidor", "seguidores"),
    countLabel(person.registrations, "evento", "eventos"),
    countLabel(person.reviews, "reseña", "reseñas"),
    countLabel(person.ratings, "calificación", "calificaciones"),
  ].filter(Boolean).join(" · ");
}

export default function SuggestedPeople({ viewerId, onDone }: { viewerId?: string | null; onDone?: () => void }) {
  const [people, setPeople] = useState<SuggestedPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchSuggestedPeople(viewerId).then((next) => {
      if (!active) return;
      setPeople(next);
      setLoading(false);
      void hydrateSuggestedAvatars(next).then((full) => { if (active) setPeople(full); });
    }).catch(() => { if (active) { setPeople([]); setLoading(false); } });
    return () => { active = false; };
  }, [viewerId]);

  async function followAll() {
    if (!people.length || busy || done) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    for (const person of people) {
      const { error: followError } = await supabase.rpc("toggle_follow", { p_target_user_id: person.userId });
      if (followError) {
        setError("No pudimos seguir a todas. Inténtalo de nuevo.");
        setBusy(false);
        return;
      }
    }
    setBusy(false);
    setDone(true);
    window.dispatchEvent(new Event("dorsalia:social-updated"));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-[15px] py-2">
        <h2 className="text-[16px] font-semibold text-white">Sugeridos</h2>
        <button type="button" disabled={loading || busy || done || !people.length} onClick={() => void followAll()} className="h-9 shrink-0 rounded-full bg-[#C5E500] px-4 text-[14px] font-bold disabled:opacity-50" style={{ color: "#070707" }}>
          {busy ? "Siguiendo…" : done ? "Siguiendo" : "Seguir a todos"}
        </button>
      </div>
      {error ? <p className="px-[15px] text-sm text-[#DE5757]">{error}</p> : null}
      {loading ? <ListRowsSkeleton count={6} avatar="square" label="Cargando personas" /> : people.length ? (
        <div>
          {people.map((person) => (
            <Link key={person.userId} href={`/perfil/${person.username || person.userId}`} className="flex min-h-[64px] items-center gap-2 border-b border-white/10 px-[15px] py-3">
              <span className="relative grid h-[36px] w-[36px] shrink-0 place-items-center overflow-hidden rounded-[6px] bg-white/10 text-[14px] font-semibold text-white">
                {person.avatarUrl ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={avatarThumb(person.avatarUrl) || person.avatarUrl} alt="" width={36} height={36} decoding="async" className="h-full w-full object-cover" /> : person.displayName.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <span className="block min-w-0 truncate text-[20px] font-normal leading-6 text-white">{person.displayName}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/reviews/Chevron_Right.svg" alt="" width={16} height={16} className="shrink-0" />
                </span>
                <span className="truncate text-[10px] leading-3 text-white/50">{detail(person)}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : <p className="px-[15px] py-10 text-center text-sm text-white/45">Todavía no hay personas para sugerir.</p>}
      {onDone ? <button type="button" onClick={onDone} className="mx-auto mt-6 block text-[16px] font-semibold text-white/70">Continuar</button> : null}
    </div>
  );
}

export function FollowingFeed({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [mode, setMode] = useState<"loading" | "suggestions" | "feed">("loading");

  useEffect(() => {
    let active = true;
    async function refresh() {
      const { data } = await createClient().rpc("public_follow_stats", { p_user_id: userId });
      const following = data && typeof data === "object" ? Number((data as { following?: number }).following) || 0 : 0;
      if (active) setMode(following > 0 ? "feed" : "suggestions");
    }
    void refresh();
    window.addEventListener("dorsalia:social-updated", refresh);
    return () => { active = false; window.removeEventListener("dorsalia:social-updated", refresh); };
  }, [userId]);

  if (mode === "loading") return <ListRowsSkeleton count={6} avatar="square" label="Cargando feed" />;
  if (mode === "suggestions") return <>
    <SuggestedPeople viewerId={userId} />
    <div className="mt-4"><ActivityFeed userId={userId} refreshKey={refreshKey} emptyText="" /></div>
  </>;
  return <ActivityFeed followingOnly excludeUserId={userId} refreshKey={refreshKey} emptyText="Las personas que sigues todavía no publican." />;
}
