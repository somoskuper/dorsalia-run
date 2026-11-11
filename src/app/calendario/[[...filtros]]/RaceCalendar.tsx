"use client";

import { useMemo } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import EventSearchBar from "@/components/search/EventSearchBar";
import type { PublicRace } from "@/lib/races";
import { filterRaces, filtersFromSearchParams } from "@/lib/raceSearch";

const SPORTS = [["running", "Running"], ["trail", "Trail"], ["cycling", "Ciclismo"], ["triathlon", "Triatlón"], ["swimming", "Natación"], ["padel", "Pádel"]];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const slug = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const money = (n: number, currency: string) => n <= 0 ? "Gratis" : `$${n.toLocaleString("es-MX")} ${currency || "MXN"}`;

export default function RaceCalendar({ races }: { races: PublicRace[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ filtros?: string[] }>();
  const searchParams = useSearchParams();
  const searchFilters = useMemo(() => filtersFromSearchParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const parts = params.filtros || [];
  const year = parts[0] && /^\d{4}$/.test(parts[0]) ? parts[0] : "";
  const ci = parts.indexOf("ciudad");
  const city = ci >= 0 ? parts[ci + 1] || "" : "";
  const ti = parts.indexOf("tipo");
  const sport = ti >= 0 ? parts[ti + 1] || "" : "";
  const price = parts.includes("gratis") ? "gratis" : parts.includes("pago") ? "pago" : "";
  const month = searchParams.get("mes") || "";
  const change = (next: { year?: string; city?: string; sport?: string; price?: string }) => {
    const y = next.year ?? year, c = next.city ?? city, s = next.sport ?? sport, p = next.price ?? price;
    const path = ["/calendario"];
    if (y || c || s || p) path.push(y || "2026");
    if (c) path.push("ciudad", slug(c));
    if (s) path.push("tipo", s);
    if (p) path.push(p);
    const qs = searchParams.toString();
    router.push(qs ? `${path.join("/")}?${qs}` : path.join("/"));
  };
  const changeMonth = (nextMonth: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (nextMonth) next.set("mes", nextMonth); else next.delete("mes");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const filtered = useMemo(() => filterRaces(races, searchFilters).filter(r => {
    const d = r.event_date ? new Date(r.event_date) : null;
    return (!year || (!!d && String(d.getFullYear()) === year)) && (!month || (!!d && String(d.getMonth() + 1) === month)) && (!city || slug(`${r.city || ""}-${r.state || ""}`).includes(city) || slug(r.city || "").includes(city)) && (!sport || (r.sport_category || "running") === sport) && (!price || (price === "gratis" ? r.is_free || (r.min_price ?? r.default_kit_price) <= 0 : !r.is_free && (r.min_price ?? r.default_kit_price) > 0));
  }).sort((a,b) => {
    const aDate = a.event_date ? new Date(a.event_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.event_date ? new Date(b.event_date).getTime() : Number.MAX_SAFE_INTEGER;
    const aUpcoming = aDate >= Date.now(), bUpcoming = bDate >= Date.now();
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return aUpcoming ? aDate - bDate : bDate - aDate;
  }), [races, searchFilters, year, month, city, sport, price]);
  return <main className="min-h-screen bg-[#070707] px-4 pb-24 pt-28 text-white md:px-8"><div className="mx-auto max-w-7xl">
    <p className="font-mono text-xs uppercase tracking-[.22em] text-[#c9f24b]">Dorsalia · Calendario nacional</p><h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-6xl">Eventos deportivos en México</h1><p className="mt-3 max-w-2xl text-sm text-white/55">Encuentra eventos de enero a diciembre, compara distancias y consulta dónde inscribirte.</p>
    <EventSearchBar races={races} className="mt-6 max-w-[720px]" filtersExtra={<>
      <section className="mt-[30px]"><h3 className="text-[16px] font-semibold">Año</h3><select value={year} onChange={e=>change({year:e.target.value})} aria-label="Año" className="mt-[10px] h-11 w-full rounded-[20px] bg-[#191919] px-[15px] text-[16px] text-white outline-none [&>option]:bg-[#191919]"><option value="">Todos</option><option value="2025">2025</option><option value="2026">2026</option><option value="2027">2027</option></select></section>
      <section className="mt-[30px]"><h3 className="text-[16px] font-semibold">Mes</h3><select value={month} onChange={e=>changeMonth(e.target.value)} aria-label="Mes" className="mt-[10px] h-11 w-full rounded-[20px] bg-[#191919] px-[15px] text-[16px] text-white outline-none [&>option]:bg-[#191919]"><option value="">Todo el año</option>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m[0].toUpperCase()+m.slice(1)}</option>)}</select></section>
    </>} />
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
  const eventHref = `/evento/${r.slug}`;
  const eventDate = date ? new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric", timeZone: r.timezone || "America/Mexico_City" }).format(date) : "Fecha por confirmar";
  return <div key={r.id} id={month ? `mes-${month}` : undefined}>
    <a href={eventHref} className={`flex min-h-[86px] items-center gap-3 border-b border-white/10 py-5 lg:hidden ${upcoming ? "text-white" : "text-white/55"}`}>
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[8px] bg-white/10">{flyer ? /* eslint-disable-next-line @next/next/no-img-element */<img src={flyer} alt="" onError={e => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" /> : null}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-[20px] leading-6">{r.name}</span><span className="mt-1 block truncate text-[12px] text-white/50">{eventDate} · {[r.city, r.state].filter(Boolean).join(", ") || "México"}</span></span>
      <span className="flex shrink-0 items-center gap-2"><span className="text-[14px] font-semibold text-white">{money(r.min_price ?? r.default_kit_price, r.currency)}</span><span aria-hidden="true" className="text-[32px] leading-none text-white/45">›</span></span>
    </a>
    <article className={`hidden gap-3 border-b border-white/[.08] px-2 py-4 lg:grid lg:grid-cols-[64px_minmax(260px,1fr)_120px_90px_110px_120px_120px] lg:items-center ${upcoming ? "text-white" : "text-white/55"}`}><a href={eventHref} className="relative block aspect-[4/5] w-14 overflow-hidden rounded bg-white/[.06]">{flyer ? /* eslint-disable-next-line @next/next/no-img-element */<img src={flyer} alt={`Flyer de ${r.name}`} onError={e => { e.currentTarget.style.display = "none"; }} className="absolute inset-0 h-full w-full object-cover" /> : null}</a><div className="min-w-0"><a href={eventHref} className={`font-bold hover:text-[#c9f24b] ${upcoming ? "text-base" : "text-sm"}`}>{r.name}</a><p className="mt-1 text-xs text-white/50">{[r.venue_name, r.city, r.state].filter(Boolean).join(" · ") || "México"}</p><div className="mt-2 flex flex-wrap gap-1">{(r.distances || []).map(d => <span key={d.key} className="rounded-full bg-white/[.08] px-2 py-1 text-[10px] text-white/65">{d.label}</span>)}</div></div><span className="text-xs">{eventDate}</span><span className="text-xs">{hour}</span><span className="text-sm font-semibold">{money(r.min_price ?? r.default_kit_price, r.currency)}</span><span className="text-xs">{SPORTS.find(([v]) => v === (r.sport_category || "running"))?.[1] || r.sport_category || "Running"}</span><a href={signup} target={signup.startsWith("http") ? "_blank" : undefined} rel="noreferrer" style={{ backgroundColor: upcoming ? "#c9f24b" : "#ffffff", color: "#080808", fontWeight: 700 }} className="rounded-full px-3 py-2 text-center text-xs">{upcoming ? "Inscribirse" : "Ver más"}</a></article>
  </div>;
}
