"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import { createClient } from "@/lib/supabase/client";

type Person = { user_id: string; username: string | null; display_name: string; avatar_url: string | null };

export default function SeguidoresPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = params.userId;
  const kind = searchParams.get("vista") === "following" ? "following" : "followers";
  const backHref = searchParams.get("origen") === "cuenta" ? "/cuenta?tab=perfil" : `/perfil/${userId}`;
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error: requestError } = await createClient().rpc("public_follow_list", {
      p_user_id: userId,
      p_kind: kind,
      p_limit: 200,
    });
    setError(Boolean(requestError));
    setPeople(Array.isArray(data) ? data as Person[] : []);
    setLoading(false);
  }, [userId, kind]);

  useEffect(() => {
    setLoading(true);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [refresh]);

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/10 bg-[#070707]/95 px-5 py-4 backdrop-blur-xl">
        <GlassIconButton aria-label="Regresar" onClick={() => router.push(backHref)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assetsdev/Chevron_Right.svg" alt="" width={24} height={24} />
        </GlassIconButton>
        <h1 className="text-xl font-bold">{kind === "followers" ? "Seguidores" : "Siguiendo"}</h1>
      </header>
      <div className="mx-auto max-w-2xl py-3">
        {loading ? <div className="grid min-h-40 place-items-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#c9f24b]" aria-label="Cargando seguidores" /></div> : error ? <p className="px-5 py-12 text-center text-sm text-white/50">No pudimos cargar la lista. <button type="button" onClick={() => { setLoading(true); void refresh(); }} className="text-[#c9f24b]">Reintentar</button></p> : people.length ? people.map((person) => (
          <Link key={person.user_id} href={`/perfil/${person.username || person.user_id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.05]">
            {person.avatar_url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={person.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 font-bold">{person.display_name.slice(0, 1).toUpperCase()}</span>}
            <span className="min-w-0"><strong className="block truncate text-sm">{person.username ? `@${person.username}` : person.display_name}</strong>{person.username ? <span className="block truncate text-sm text-white/45">{person.display_name}</span> : null}</span>
          </Link>
        )) : <p className="px-5 py-12 text-center text-sm text-white/45">{kind === "followers" ? "Todavía no hay seguidores." : "Todavía no sigue a nadie."}</p>}
      </div>
    </main>
  );
}
