"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { ProfileMedal } from "@/components/account/AccountProfileView";
import { PhotoGridSkeleton } from "@/components/ui/Skeleton";

type Registration = { id: string; dynamic_data?: Record<string, unknown>; race_event?: { medal_image_url?: string | null; routes?: { medal_image_url?: string | null; label?: string | null }[] | null; event_date?: string | null } | null };
type MedalAward = { id: string; name: string; image_url: string; featured_sort_order?: number | null };

export default function ProfileMedalEditor() {
  const router = useRouter();
  const { user, loading } = useAthleteAuth();
  const [medals, setMedals] = useState<ProfileMedal[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [usesAwardLedger, setUsesAwardLedger] = useState(false);
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
      supabase.rpc("athlete_my_medals"),
    ]).then(([profileResult, registrationsResult, awardsResult]) => {
      if (!current) return;
      if (profileResult.error || (registrationsResult.error && awardsResult.error)) { setError("No se pudieron cargar las medallas."); setReady(true); return; }
      const all: ProfileMedal[] = [];
      if (user.user_metadata?.dorsalia_first_event_badge === true) all.push({ key: "dorsalia-first-event", label: "Primer evento en Dorsalia", imageUrl: "/assetsdev/primer-evento-dorsalia.webp", completed: true });
      const awardRows = !awardsResult.error && Array.isArray(awardsResult.data) ? awardsResult.data as MedalAward[] : null;
      if (awardRows) {
        setUsesAwardLedger(true);
        for (const award of awardRows) {
          if (!award.id || !award.image_url) continue;
          all.push({ key: `award:${award.id}`, label: award.name || "Medalla", imageUrl: award.image_url, completed: true });
        }
      } else {
        for (const item of (Array.isArray(registrationsResult.data) ? registrationsResult.data : []) as Registration[]) {
          const routes = Array.isArray(item.race_event?.routes) ? item.race_event.routes : [];
          const distance = String(item.dynamic_data?.distancia || item.dynamic_data?.distance || "").toLowerCase();
          const route = routes.find((entry) => entry.medal_image_url && distance && String(entry.label || "").toLowerCase().includes(distance)) || routes.find((entry) => entry.medal_image_url);
          const imageUrl = String(route?.medal_image_url || item.race_event?.medal_image_url || "");
          if (!imageUrl) continue;
          all.push({ key: `${item.id}-${imageUrl}`, label: String(route?.label || "Medalla"), imageUrl, completed: item.race_event?.event_date ? new Date(item.race_event.event_date).getTime() < Date.now() : false });
        }
      }
      const saved = profileResult.data?.featured_medal_keys;
      if (!awardRows) {
        for (const key of Array.isArray(saved) ? saved.map(String) : []) {
          if (all.some((medal) => medal.key === key)) continue;
          const imageUrl = key.replace(/^[0-9a-f-]{36}-/i, "");
          if (imageUrl.startsWith("/") || imageUrl.startsWith("http")) all.push({ key, label: "Medalla conseguida", imageUrl, completed: true });
        }
      }
      setMedals(all);
      const stored = Array.isArray(saved) ? saved.map(String) : [];
      if (awardRows) {
        const picked: string[] = [];
        for (const key of stored) {
          if (key === "dorsalia-first-event" && all.some((medal) => medal.key === key)) {
            picked.push(key);
            continue;
          }
          if (key.startsWith("award:") && all.some((medal) => medal.key === key)) {
            picked.push(key);
            continue;
          }
          const award = awardRows.find((item) => key.startsWith(item.id));
          if (award && all.some((medal) => medal.key === `award:${award.id}`)) picked.push(`award:${award.id}`);
        }
        const featured = [...awardRows]
          .filter((award) => award.featured_sort_order != null)
          .sort((a, b) => Number(a.featured_sort_order) - Number(b.featured_sort_order))
          .map((award) => `award:${award.id}`);
        for (const key of featured) {
          if (!picked.includes(key)) picked.push(key);
        }
        setSelected(picked.filter((key, index) => picked.indexOf(key) === index).slice(0, 3));
      } else {
        setSelected(stored.filter((key) => all.some((medal) => medal.key === key)).slice(0, 3));
      }
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
      const selectedAwards = selected.filter((key) => key.startsWith("award:")).map((key) => key.slice(6));
      if (usesAwardLedger) {
        const { error: featuredError } = await supabase.rpc("set_athlete_featured_medals", { p_medal_ids: selectedAwards });
        if (featuredError && selectedAwards.length > 0) throw featuredError;
      }
      const byKey = new Map(medals.map((medal) => [medal.key, medal]));
      const legacyKeys = selected.map((key) => {
        if (key === "dorsalia-first-event") return key;
        const medal = byKey.get(key);
        const awardId = key.startsWith("award:") ? key.slice(6) : null;
        return awardId && medal ? `${awardId}-${medal.imageUrl}` : key;
      });
      const { error: saveError } = existing
        ? await supabase.from("athlete_profiles").update({ featured_medal_keys: legacyKeys, updated_at: new Date().toISOString() }).eq("user_id", user.id)
        : await supabase.from("athlete_profiles").upsert({ user_id: user.id, featured_medal_keys: legacyKeys, updated_at: new Date().toISOString() });
      if (saveError) throw saveError;
      const { error: authError } = await supabase.auth.updateUser({ data: { featured_medal_keys: legacyKeys } });
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
