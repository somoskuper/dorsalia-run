"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PublicRace } from "@/lib/races";

const SPORTS = [["running", "Running"], ["trail", "Trail"], ["cycling", "Ciclismo"], ["triathlon", "Triatlón"], ["swimming", "Natación"], ["padel", "Pádel"]];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const slug = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = (n: number, currency: string) => n <= 0 ? "Gratis" : `$${n.toLocaleString("es-MX")} ${currency || "MXN"}`;

export default function RaceCalendar({ races }: { races: PublicRace[] }) {
  const router = useRouter();
  const params = useParams<{ filtros?: string[] }>();
  const parts = params.filtros || [];
  const year = parts[0] && /^\d{4}$/.test(parts[0]) ? parts[0] : "";
  const ci = parts.indexOf("ciudad");
  const city = ci >= 0 ? parts[ci + 1] || "" : "";
  const ti = parts.indexOf("tipo");
  const sport = ti >= 0 ? parts[ti + 1] || "" : "";
  const price = parts.includes("gratis") ? "gratis" : parts.includes("pago") ? "pago" : "";
  const change = (next: { year?: string; city?: string; sport?: string; price?: string }) => {
    const y = next.year ?? year, c = next.city ?? city, s = next.sport ?? sport, p = next.price ?? price;
    const path = ["/calendario"];
    if (y || c || s || p) path.push(y || "2026");
    if (c) path.push("ciudad", slug(c));
    if (s) path.push("tipo", s);
    if (p) path.push(p);
    router.push(path.join("/"));
  };
  const filtered = useMemo(() => races.filter(r => {
    const d = r.event_date ? new Date(r.event_date) : null;
    return (!year || (!!d && String(d.getFullYear()) === year)) && (!city || slug(`${r.city || ""}-${r.state || ""}`).includes(city) || slug(r.city || "").includes(city)) && (!sport || (r.sport_category || "running") === sport) && (!price || (price === "gratis" ? r.is_free || (r.min_price ?? r.default_kit_price) <= 0 : !r.is_free && (r.min_price ?? r.default_kit_price) > 0));
  }).sort((a,b) => {
    const aDate = a.event_date ? new Date(a.event_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.event_date ? new Date(b.event_date).getTime() : Number.MAX_SAFE_INTEGER;
    const aUpcoming = aDate >= Date.now(), bUpcoming = bDate >= Date.now();
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aUpcoming ? aDate - bDate : bDate - aDate;
  }), [races, year, city, sport, price]);
  const cities = [...new Set(races.map(r => r.city).filter((v): v is string => !!v))].sort();
  return <main className="min-h-screen bg-[#070707] px-4 pb-24 pt-28 text-white md:px-8"><div className="mx-auto max-w-7xl">
    <p className="font-mono text-xs uppercase tracking-[.22em] text-[#c9f24b]">Dorsalia · Calendario nacional</p><h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-6xl">Eventos deportivos en México</h1><p className="mt-3 max-w-2xl text-sm text-white/55">Encuentra eventos de enero a diciembre, compara distancias y consulta dónde inscribirte.</p>
    <section className="mt-7 border-y border-white/10 py-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs text-white/55">Año<select value={year} onChange={e=>change({year:e.target.value})} className="mt-1 block w-full border-b border-white/20 bg-transparent py-2 text-sm text-white"><option value="">Todos</option><option value="2026">2026</option><option value="2027">2027</option><option value="2025">2025</option></select></label>
      <label className="text-xs text-white/55">Ciudad<select value={city} onChange={e=>change({city:e.target.value})} className="mt-1 block w-full border-b border-white/20 bg-transparent py-2 text-sm text-white"><option value="">Todo México</option>{cities.map(c=><option key={c} value={slug(c)}>{c}</option>)}</select></label>
      <label className="text-xs text-white/55">Tipo de evento<select value={sport} onChange={e=>change({sport:e.target.value})} className="mt-1 block w-full border-b border-white/20 bg-transparent py-2 text-sm text-white"><option value="">Todos los tipos</option>{SPORTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      <label className="text-xs text-white/55">Precio<select value={price} onChange={e=>change({price:e.target.value})} className="mt-1 block w-full border-b border-white/20 bg-transparent py-2 text-sm text-white"><option value="">Gratis y de pago</option><option value="gratis">Gratis</option><option value="pago">De pago</option></select></label>
    </div><div className="mt-3 max-w-xs"><label className="text-xs text-white/55">Mes<select defaultValue="" onChange={e=>{if(e.target.value)document.getElementById(`mes-${e.target.value}`)?.scrollIntoView({behavior:"smooth",block:"start"})}} className="mt-1 block w-full border-b border-white/20 bg-transparent py-2 text-sm text-white"><option value="">Todo el año</option>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m[0].toUpperCase()+m.slice(1)}</option>)}</select></label></div></section>
    <div className="mt-5 flex justify-between text-xs text-white/45"><span>{filtered.length} eventos</span><span>{year || "Todos los años"}</span></div>
    <div className="mt-4"><div className="hidden grid-cols-[64px_minmax(260px,1fr)_120px_90px_110px_120px_120px] gap-3 border-b border-white/15 px-2 py-3 font-mono text-[10px] uppercase text-white/40 lg:grid"><span>Flyer</span><span>Evento / lugar / distancias</span><span>Fecha</span><span>Hora</span><span>Precio</span><span>Tipo</span><span>Inscripción</span></div>
      {!filtered.length ? <p className="py-12 text-center text-sm text-white/45">No encontramos eventos con esos filtros.</p> : <>
      {filtered.some(r=>!r.event_date || new Date(r.event_date).getTime() >= Date.now()) && <><h2 className="py-4 text-lg font-bold text-[#c9f24b]">Próximos eventos</h2>{filtered.filter(r=>!r.event_date || new Date(r.event_date).getTime()>=Date.now()).map(r=>renderRace(r,true))}</>}
      {filtered.some(r=>r.event_date && new Date(r.event_date).getTime()<Date.now()) && <><h2 className="pt-8 pb-4 text-lg font-bold text-white/50">Eventos finalizados</h2>{filtered.filter(r=>r.event_date && new Date(r.event_date).getTime()<Date.now()).map(r=>renderRace(r,false))}</>}
      </>}
    </div></div></main>;
}

function renderRace(r: PublicRace, upcoming: boolean) {
  const date = r.event_date ? new Date(r.event_date) : null;
  const month = date ? date.getMonth()+1 : 0;
  const hour = date ? new Intl.DateTimeFormat("es-MX",{hour:"2-digit",minute:"2-digit",timeZone:r.timezone||"America/Mexico_City"}).format(date) : "Por confirmar";
  const flyer = r.cover_image_url || r.hero_image_url || r.flyer_url || r.og_image_url;
  const signup = r.external_registration_url || r.site_url || `/evento/${r.slug}`;
  return <article key={r.id} id={month?`mes-${month}`:undefined} className={`grid gap-3 border-b border-white/[.08] px-2 py-4 sm:grid-cols-[64px_1fr_auto] lg:grid-cols-[64px_minmax(260px,1fr)_120px_90px_110px_120px_120px] lg:items-center ${upcoming?"text-white":"text-white/55"}`}><a href={`/evento/${r.slug}`} className="relative block aspect-[4/5] w-14 overflow-hidden rounded bg-white/[.06]">{flyer?/* eslint-disable-next-line @next/next/no-img-element */<img src={flyer} alt={`Flyer de ${r.name}`} onError={e=>{e.currentTarget.style.display="none"}} className="absolute inset-0 h-full w-full object-cover"/>:null}</a><div className="min-w-0"><a href={`/evento/${r.slug}`} className={`font-bold hover:text-[#c9f24b] ${upcoming?"text-base":"text-sm"}`}>{r.name}</a><p className="mt-1 text-xs text-white/50">{[r.venue_name,r.city,r.state].filter(Boolean).join(" · ")||"México"}</p><div className="mt-2 flex flex-wrap gap-1">{(r.distances||[]).map(d=><span key={d.key} className="rounded-full bg-white/[.08] px-2 py-1 text-[10px] text-white/65">{d.label}</span>)}</div></div><span className="text-xs">{date?new Intl.DateTimeFormat("es-MX",{day:"numeric",month:"short",year:"numeric",timeZone:r.timezone||"America/Mexico_City"}).format(date):"Por confirmar"}</span><span className="text-xs">{hour}</span><span className="text-sm font-semibold">{money(r.min_price??r.default_kit_price,r.currency)}</span><span className="text-xs">{SPORTS.find(([v])=>v===(r.sport_category||"running"))?.[1]||r.sport_category||"Running"}</span><a href={signup} target={signup.startsWith("http")?"_blank":undefined} rel="noreferrer" style={{backgroundColor:upcoming?"#c9f24b":"#ffffff",color:"#080808",fontWeight:700}} className="rounded-full px-3 py-2 text-center text-xs">{upcoming?"Inscribirse":"Ver más"}</a></article>;
}
