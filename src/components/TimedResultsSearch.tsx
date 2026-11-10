"use client";

import Link from "next/link";
import { askForAccount } from "@/components/account/AccountPrompt";
import { useEffect, useState } from "react";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import { FirstEventBadgeModal } from "@/components/reviews/EventReviews";

const api = `${(process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.dorsalia.run").replace(/\/$/, "")}/sites/v1/public-event-results`;
type Result = { id: string; distance: string; category: string; bib: string; athlete_name: string; chip_time: string | null; gun_time: string | null; pace: string | null; overall_place: number | null; category_place: number | null; source_url: string; consented_at: string | null; can_claim: boolean; claim_method: "name" | "bib" | null };
type PublishedResult = Pick<Result, "id" | "distance" | "category" | "bib" | "athlete_name" | "chip_time" | "gun_time" | "pace" | "overall_place" | "category_place" | "consented_at"> & { category_label?: string; category_detail?: { gender?: string | null; source_gender?: string | null; source_age_category?: string | null; age_min?: number | null; age_max?: number | null; source_category?: string | null; group?: string | null } | null; branch_label?: string };

export default function TimedResultsSearch({ eventId, sourceName, sourceUrl }: { eventId: string; sourceName?: string | null; sourceUrl?: string | null }) {
  const { session, user, refresh: refreshAuth } = useAthleteAuth();
  const [available, setAvailable] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [publishedResults, setPublishedResults] = useState<PublishedResult[]>([]);
  const [publishedCategories, setPublishedCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [showFirstEventBadge, setShowFirstEventBadge] = useState(false);
  const [kind, setKind] = useState<"name" | "bib">("name");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [claim, setClaim] = useState<Result | null>(null);
  const [ownership, setOwnership] = useState(false);
  const [consent, setConsent] = useState(false);
  const [verificationBib, setVerificationBib] = useState("");
  const [verificationCategory, setVerificationCategory] = useState("");
  const [verificationName, setVerificationName] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(`${api}/${eventId}?meta=categories`).then((response) => response.json()).then((data) => {
      if (!active) return;
      setAvailable(data.available === true);
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    }).catch(() => {});
    return () => { active = false; };
  }, [eventId]);

  async function refreshPublishedResults() {
    try {
      const response = await fetch(`${api}/${eventId}?published=1`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar los tiempos");
      const nextResults = Array.isArray(data.results) ? data.results as PublishedResult[] : [];
      const nextCategories = Array.isArray(data.categories) ? data.categories as string[] : [];
      setPublishedResults(nextResults);
      setPublishedCategories(nextCategories);
      setOpenCategories((current) => nextCategories.length && !nextCategories.some((category) => current[category]) ? { ...current, [nextCategories[0]]: true } : current);
    } catch {
      setPublishedResults([]);
      setPublishedCategories([]);
    }
  }

  useEffect(() => { void refreshPublishedResults(); }, [eventId]);

  async function search() {
    if (query.trim().length < 1) return;
    setLoading(true); setError(""); setSearched(true);
    try {
      const params = new URLSearchParams({ by: kind, q: query.trim() });
      const response = await fetch(`${api}/${eventId}?${params}`, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo buscar");
      setResults(data.results || []);
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo buscar"); }
    finally { setLoading(false); }
  }

  async function publish() {
    if (!claim || !ownership || !consent || !session?.access_token) return;
    if (claim.claim_method === "name" && (!verificationBib.trim() || !verificationCategory.trim())) return;
    if (claim.claim_method === "bib" && !verificationName.trim()) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`${api}/${eventId}/claim`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ result_id: claim.id, ownership, consent, claim_method: claim.claim_method, verification: { bib: verificationBib, category: verificationCategory, name: verificationName } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo publicar");
      if (user) {
        if (user.user_metadata?.dorsalia_first_event_claim_badge_shown !== true) setShowFirstEventBadge(true);
        const medalKey = "dorsalia-first-event";
        const currentKeys = Array.isArray(user.user_metadata?.featured_medal_keys) ? user.user_metadata.featured_medal_keys.map(String) : [];
        const featuredKeys = [medalKey, ...currentKeys.filter((key: string) => key !== medalKey)].slice(0, 8);
        const supabase = createClient();
        const { error: badgeError } = await supabase.auth.updateUser({ data: { ...user.user_metadata, dorsalia_first_event_badge: true, dorsalia_first_event_claim_badge_shown: true, featured_medal_keys: featuredKeys } });
        if (!badgeError) {
          await supabase.from("athlete_profiles").update({ featured_medal_keys: featuredKeys, updated_at: new Date().toISOString() }).eq("user_id", user.id);
          await refreshAuth();
        }
      }
      setClaim(null); setOwnership(false); setConsent(false); setVerificationBib(""); setVerificationCategory(""); setVerificationName("");
      window.dispatchEvent(new Event("dorsalia:activity-published"));
      await search();
      await refreshPublishedResults();
    } catch (err) { setError(err instanceof Error ? err.message : "No se pudo publicar"); setLoading(false); }
  }

  function beginClaim(result: Result) {
    setClaim(result); setOwnership(false); setConsent(false); setVerificationBib(""); setVerificationCategory(""); setVerificationName(""); setError("");
  }

  if (!available) return null;
  return <section className="mt-10 w-full min-w-0 max-w-full">
    {showFirstEventBadge ? <FirstEventBadgeModal message="Tu primer resultado cronometrado desbloqueó esta insignia." onClose={() => setShowFirstEventBadge(false)} /> : null}
    <h3 className="text-[22px] font-semibold text-white">Resultados cronometrados</h3>
    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      <select aria-label="Buscar por" value={kind} onChange={(e) => { setKind(e.target.value as "name" | "bib"); setResults([]); setSearched(false); setQuery(""); }} className="rounded-xl border border-white/20 bg-[#181818] px-3 py-3 text-white"><option value="name">Nombre</option><option value="bib">Dorsal</option></select>
      <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void search(); }} placeholder={kind === "name" ? "Escribe un nombre, por ejemplo Luis" : "Número o parte del dorsal"} className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#181818] px-4 py-3 text-white outline-none focus:border-[#c9f24b]" />
      <button type="button" onClick={() => void search()} disabled={loading || query.trim().length < 1} className="rounded-xl bg-[#c9f24b] px-6 py-3 font-bold text-black disabled:opacity-40">{loading ? "Buscando…" : "Buscar"}</button>
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    {searched && !loading && results.length === 0 && <p className="mt-4 text-sm text-white/60">No hay resultados para esta búsqueda.</p>}
    {results.length > 0 && <div className="mt-5 space-y-3">{results.map((result) => <article key={result.id} className="border-t border-white/10 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-white">{result.athlete_name}</b><p className="text-sm text-white/55">{result.distance || "Modalidad"} · {result.category || "Categoría privada"}{result.bib && ` · Dorsal ${result.bib}`}</p></div>{result.consented_at ? <div className="text-right"><b className="text-[#c9f24b]">{result.chip_time || result.gun_time || "Sin tiempo"}</b><p className="text-xs text-white/50">{result.chip_time ? "Tiempo chip" : "Tiempo oficial"}</p></div> : <span className="text-sm text-white/50">Tiempo privado</span>}</div>{result.can_claim && (user ? <button type="button" onClick={() => beginClaim(result)} className="mt-3 rounded-lg border border-[#c9f24b] px-4 py-2 text-sm font-bold text-[#c9f24b]">¿Es tu resultado? Reclámalo</button> : <button type="button" onClick={() => askForAccount("reclamar este resultado")} className="mt-3 inline-block rounded-lg border border-[#c9f24b] px-4 py-2 text-sm font-bold text-[#c9f24b]">Reclama este resultado</button>)}{result.consented_at && <a className="mt-2 block text-xs text-white/50 underline" href={result.source_url} target="_blank" rel="noreferrer">Fuente de cronometraje</a>}</article>)}</div>}
    {publishedResults.length > 0 ? <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h4 className="text-[19px] font-semibold text-white">Tiempos reclamados</h4><p className="mt-1 text-sm text-white/50">Resultados publicados por sus titulares.</p></div>
      </div>
      <div className="mt-4 space-y-7">{publishedCategories.map((category) => {
        const allCategoryResults = publishedResults.filter((result) => (result.category_label || result.category) === category);
        const branchLabels = [...new Set(allCategoryResults.map((result) => result.branch_label || "General"))].sort((a, b) => a.localeCompare(b, "es"));
        const selectedBranch = selectedBranches[category] || branchLabels[0] || "General";
        const categoryResults = branchLabels.length > 1 || branchLabels[0] !== "General" ? allCategoryResults.filter((result) => (result.branch_label || "General") === selectedBranch) : allCategoryResults;
        const expanded = expandedCategories[category] === true;
        const categoryOpen = openCategories[category] === true;
        const visibleResults = expanded ? categoryResults : categoryResults.slice(0, 20);
        return <section key={category} aria-label={`Resultados de ${category}`}>
          <button type="button" aria-expanded={categoryOpen} onClick={() => setOpenCategories((current) => ({ ...current, [category]: !categoryOpen }))} className="mb-2 flex w-full items-center justify-between border-b border-white/10 pb-2 text-left text-sm font-semibold text-white/75 hover:text-white"><span>{category}</span><span className="text-xs text-white/45">{categoryOpen ? "Ocultar" : "Ver resultados"}</span></button>
          {categoryOpen ? <>
          {(branchLabels.length > 1 || branchLabels.some((branch) => branch !== "General")) ? <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label={`Ramas de ${category}`}>{branchLabels.map((branch) => <button key={branch} type="button" role="tab" aria-selected={selectedBranch === branch} onClick={() => { setSelectedBranches((current) => ({ ...current, [category]: branch })); setExpandedCategories((current) => ({ ...current, [category]: false })); }} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selectedBranch === branch ? "border-[#c9f24b] bg-[#c9f24b] text-black" : "border-white/15 text-white/60 hover:text-white"}`}>{branch}</button>)}</div> : null}
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead className="border-y border-white/15 text-[11px] uppercase tracking-[0.08em] text-white/45"><tr><th className="px-3 py-3 font-semibold">Lugar</th><th className="px-3 py-3 font-semibold">Atleta</th><th className="px-3 py-3 font-semibold">Dorsal</th><th className="px-3 py-3 font-semibold">Modalidad</th><th className="px-3 py-3 text-right font-semibold">Tiempo</th></tr></thead>
              <tbody>{visibleResults.map((result) => <tr key={result.id} className="border-b border-white/[0.08] text-sm text-white/80"><td className="px-3 py-3 tabular-nums">{result.category_place || "—"}</td><td className="px-3 py-3 font-medium text-white">{result.athlete_name}</td><td className="px-3 py-3 tabular-nums">{result.bib || "—"}</td><td className="px-3 py-3">{result.distance || "—"}</td><td className="px-3 py-3 text-right font-semibold tabular-nums text-[#c9f24b]">{result.chip_time || result.gun_time || "—"}</td></tr>)}</tbody>
            </table>
          </div>
          {categoryResults.length > 20 && <button type="button" onClick={() => setExpandedCategories((current) => ({ ...current, [category]: !expanded }))} className="mt-3 text-sm text-white/60 underline underline-offset-4 hover:text-white">{expanded ? "Ver menos" : `Ver más (${categoryResults.length - 20} resultados)`}</button>}
          </> : null}
        </section>;
      })}</div>
      <p className="mt-6 text-[11px] leading-relaxed text-white/40">
        {sourceName ? `Fuente de cronometraje: . ` : "Fuente de cronometraje no identificada. "}Dorsalia es independiente del organizador y no realiza el cronometraje; la fuente indicada se muestra cuando está disponible. Consulta nuestra <Link href="/indexacion" className="underline underline-offset-2">información de indexación</Link>.
        {sourceUrl && /^https?:\/\//i.test(sourceUrl) ? <> Consulta la fuente oficial desde el <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">sitio del evento</a>.</> : " Consulta el enlace oficial del evento para más información."}
      </p>
    </section> : null}
    {claim && <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setClaim(null)}><div role="dialog" aria-modal="true" aria-label="Reclamar resultado" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#151515] p-6 text-white"><h4 className="text-xl font-bold">Verifica que el resultado es tuyo</h4><p className="mt-3 text-sm text-white/65">El tiempo seguirá privado hasta validar estos datos y confirmar tu consentimiento.</p>{claim.claim_method === "name" ? <div className="mt-5 space-y-3"><label className="block text-sm">Dorsal<input value={verificationBib} onChange={(e) => setVerificationBib(e.target.value)} autoComplete="off" className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2" placeholder="Escribe tu dorsal" /></label><label className="block text-sm">Categoría<select value={verificationCategory} onChange={(e) => setVerificationCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-white/20 bg-[#181818] px-3 py-2 text-white"><option value="">Selecciona una categoría</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label></div> : <label className="mt-5 block text-sm">Nombre completo como aparece en el cronometraje<input value={verificationName} onChange={(e) => setVerificationName(e.target.value)} autoComplete="off" className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2" placeholder="Nombre y apellidos" /></label>}<label className="mt-5 flex gap-3 text-sm"><input type="checkbox" checked={ownership} onChange={(e) => setOwnership(e.target.checked)} />Declaro que soy la persona titular de este resultado.</label><label className="mt-3 flex gap-3 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />Acepto que Dorsalia muestre públicamente mi nombre, dorsal, categoría y tiempo en esta ficha.</label><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setClaim(null)} className="rounded-lg border border-white/20 px-4 py-2">Cancelar</button><button type="button" disabled={!ownership || !consent || loading || (claim.claim_method === "name" ? !verificationBib.trim() || !verificationCategory : !verificationName.trim())} onClick={() => void publish()} className="rounded-lg bg-[#c9f24b] px-4 py-2 font-bold text-black disabled:opacity-40">Confirmar y publicar</button></div></div></div>}
  </section>;
}
