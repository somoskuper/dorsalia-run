"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function SettingsProfileHeader() {
  const { user, loading, profile } = useAthleteAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [isPhotographer, setIsPhotographer] = useState(false);

  useEffect(() => {
    if (!user) { setUsername(null); setIsPhotographer(false); return; }
    let active = true;
    const supabase = createClient();
    void supabase
      .from("athlete_profiles")
      .select("username")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setUsername(typeof data?.username === "string" ? data.username : null);
      });
    void supabase.from("creator_profiles").select("creator_type, is_active").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (active) setIsPhotographer(data?.creator_type === "photographer" && data.is_active === true); });
    return () => { active = false; };
  }, [user]);

  if (loading || !user) return null;

  return (
    <section className="mb-10 flex w-full items-center gap-[10px]" aria-label="Tu perfil">
      <span className="grid h-[39px] w-[39px] shrink-0 place-items-center overflow-hidden rounded-full border-[4px] border-[#C5E500] bg-[#191919]">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : <span className="text-[14px] font-semibold text-white">{profile.fullName.charAt(0).toUpperCase()}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[20px] font-semibold leading-[23px] text-white">{profile.fullName}</p>
        {username ? <p className="truncate text-[14px] font-semibold leading-[16px] text-white/50">@{username}</p> : null}
      </div>
      {isPhotographer ? <Link href="/creator" style={{ color: "#0E0E0E" }} className="inline-flex shrink-0 self-start items-center gap-[5px] rounded-full bg-[#C5E500] px-[15px] py-[5px] text-[16px] font-semibold leading-5">
        <span>Fotógrafo</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/settings-icons/creador-verificado.svg" alt="" width={16} height={16} className="h-4 w-4" />
      </Link> : null}
    </section>
  );
}
