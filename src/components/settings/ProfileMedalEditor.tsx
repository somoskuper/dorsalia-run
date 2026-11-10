"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { ProfileMedal } from "@/components/account/AccountProfileView";
import { PhotoGridSkeleton } from "@/components/ui/Skeleton";

type Registration = { id: string; dynamic_data?: Record<string, unknown>; race_event?: { medal_image_url?: string | null; routes?: { medal_image_url?: string | null; label?: string | null }[] | null; event_date?: string | null } | null };

export default function ProfileMedalEditor() {
  const router = useRouter();
  const { user, loading } = useAthleteAuth();
  const [medals, setMedals] = useState<ProfileMedal[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace(`/auth?next=${encodeURIComponent("/settings/edit-profile/medals")}`); return; }
    let current = true;
    const supabase = createClient();
    void Promise.all([
      supabase.from("athlete_profiles").select("featured_medal_keys").eq("user_id", user.id).maybeSingle(),
      supabase.rpc("athlete_my_registrations"),
    ]).then(([profileResult, registrationsResult]) => {
      if (!current) return;
      if (profileResult.error || registrationsResult.error) { setError("No se pudieron cargar las medallas."); setReady(true); return; }
      const all: ProfileMedal[] = [];
      if (user.user_metadata?.dorsalia_first_event_badge === true) all.push({ key: "dorsalia-first-event", label: "Primer evento en Dorsalia", imageUrl: "/assetsdev/primer-evento-dorsalia.webp", completed: true });
      for (const item of (Array.isArray(registrationsResult.data) ? registrationsResult.data : []) as Registration[]) {
        const routes = Array.isArray(item.race_event?.routes) ? item.race_event.routes : [];
        const distance = String(item.dynamic_data?.distancia || item.dynamic_data?.distance || "").toLowerCase();
        const route = routes.find((entry) => entry.medal_image_url && distance && String(entry.label || "").toLowerCase().includes(distance)) || routes.find((entry) => entry.medal_image_url);
        const imageUrl = String(route?.medal_image_url || item.race_event?.medal_image_url || "");
        if (!imageUrl) continue;
        all.push({ key: `${item.id}-${imageUrl}`, label: String(route?.label || "Medalla"), imageUrl, completed: item.race_event?.event_date ? new Date(item.race_event.event_date).getTime() < Date.now() : false });
      }
      const saved = profileResult.data?.featured_medal_keys;
      for (const key of Array.isArray(saved) ? saved.map(String) : []) {
        if (all.some((medal) => medal.key === key)) continue;
        const imageUrl = key.replace(/^[0-9a-f-]{36}-/i, "");
        if (imageUrl.startsWith("/") || imageUrl.startsWith("http")) all.push({ key, label: "Medalla conseguida", imageUrl, completed: true });
      }
      setMedals(all);
      setSelected(Array.isArray(saved) ? saved.map(String).filter((key) => all.some((medal) => medal.key === key)).slice(0, 3) : all.slice(0, 3).map((medal) => medal.key));
      setReady(true);
    });
    return () => { current = false; };
  }, [loading, router, user?.id]);

  function toggle(key: string) {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length < 3 ? [...current, key] : current);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user || saving || !ready) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    try {
      const { data: existing, error: readError } = await supabase.from("athlete_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (readError) throw readError;
      const { error: saveError } = await supabase.from("athlete_profiles").upsert({ ...(existing || {}), user_id: user.id, featured_medal_keys: selected, updated_at: new Date().toISOString() });
      if (saveError) throw saveError;
      const { error: authError } = await supabase.auth.updateUser({ data: { featured_medal_keys: selected } });
      if (authError) throw authError;
      router.push("/cuenta?tab=perfil");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudieron guardar las medallas."); }
    finally { setSaving(false); }
  }

  return <>
    <PageHeader fallbackHref="/settings/edit-profile" title="Medallas" saveFormId="profile-medals-form" saveDisabled={!ready || saving} sticky />
    <main className="mx-auto mt-10 w-full max-w-[640px]">
      <form id="profile-medals-form" onSubmit={(event) => void save(event)}>
        <h2 className="text-[20px] font-semibold">Medallas destacadas</h2>
        <p className="mt-[10px] text-[14px] text-white/50">Elige hasta tres medallas para mostrar en tu perfil. {selected.length}/3 seleccionadas.</p>
        {!ready ? <div className="mt-5"><PhotoGridSkeleton count={6} columns={3} /></div> : medals.length ? <div className="mt-5 grid grid-cols-3 gap-[10px]">
          {medals.map((medal) => <button key={medal.key} type="button" onClick={() => toggle(medal.key)} aria-pressed={selected.includes(medal.key)} className={`aspect-square rounded-[20px] bg-[#191919] p-[10px] ${selected.includes(medal.key) ? "ring-2 ring-[#C5E500]" : ""}`} title={medal.label}>
            {/* eslint-disable-next-line @next/next/no-img-element */}<img src={medal.imageUrl} alt={medal.label} className="h-full w-full object-contain" />
          </button>)}
        </div> : <p className="mt-5 text-[14px] text-white/50">Aún no tienes medallas disponibles.</p>}
        {error ? <p role="alert" className="mt-4 text-[14px] text-[#DE5757]">{error}</p> : null}
      </form>
    </main>
  </>;
}
