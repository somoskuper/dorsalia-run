"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AssetIcon from "@/components/ui/AssetIcon";
import GlassPanel from "@/components/ui/GlassPanel";
import type { PublicRace } from "@/lib/races";
import {
  EMPTY_SEARCH_FILTERS,
  SEARCH_SPORTS,
  countActiveFilters,
  filterRaces,
  filtersFromSearchParams,
  uniqueCities,
  writeFiltersToSearchParams,
  type RaceSearchFilters,
} from "@/lib/raceSearch";

const GLASS = { glassColor: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.25)", blur: 16, frost: 0, saturation: 130, aberrationIntensity: 0.02 };

const PRICES = [
  { id: "all", label: "Todos", min: null, max: null },
  { id: "free", label: "Gratis", min: null, max: 0 },
  { id: "300", label: "Hasta $300", min: 1, max: 300 },
  { id: "500", label: "$301 a $500", min: 301, max: 500 },
  { id: "more", label: "Más de $500", min: 501, max: null },
] as const;

function priceId(filters: RaceSearchFilters) {
  return PRICES.find((price) => price.min === filters.priceMin && price.max === filters.priceMax)?.id || (filters.priceMin != null || filters.priceMax != null ? "custom" : "all");
}

function sportLabel(id: string) {
  return SEARCH_SPORTS.find((sport) => sport.id === id)?.label || id;
}

function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(date).replace(".", "");
}

export default function EventSearchBar({ races = [], placeholder = "Buscar eventos", className = "", filtersExtra }: { races?: PublicRace[]; placeholder?: string; className?: string; filtersExtra?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const [value, setValue] = useState(filters.q);
  const [open, setOpen] = useState(false);
  const typed = useRef(false);
  const activeCount = countActiveFilters(filters);

  useEffect(() => { if (!typed.current) setValue(filters.q); }, [filters.q]);

  function apply(next: RaceSearchFilters) {
    const params = writeFiltersToSearchParams(new URLSearchParams(searchParams.toString()), next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  useEffect(() => {
    if (!typed.current) return;
    const timer = window.setTimeout(() => {
      typed.current = false;
      if (value.trim() !== filters.q) apply({ ...filters, q: value.trim() });
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const chips: { key: string; label: string; clear: Partial<RaceSearchFilters> }[] = [];
  if (filters.sport) chips.push({ key: "sport", label: sportLabel(filters.sport), clear: { sport: "" } });
  if (filters.city) chips.push({ key: "city", label: filters.city, clear: { city: "" } });
  if (filters.dateFrom || filters.dateTo) chips.push({ key: "date", label: [filters.dateFrom ? shortDate(filters.dateFrom) : "", filters.dateTo ? shortDate(filters.dateTo) : ""].filter(Boolean).join(" – "), clear: { dateFrom: "", dateTo: "" } });
  if (filters.priceMin != null || filters.priceMax != null) chips.push({ key: "price", label: PRICES.find((price) => price.id === priceId(filters))?.label || "Precio", clear: { priceMin: null, priceMax: null } });

  return <div className={className}>
    <GlassPanel radius={999} className="w-full" style={{ width: "100%", height: 46 }} glassProps={GLASS}>
      <form role="search" onSubmit={(event) => { event.preventDefault(); typed.current = false; apply({ ...filters, q: value.trim() }); (document.activeElement as HTMLElement | null)?.blur(); }} className="relative z-[1] flex h-[46px] w-full items-center">
        <AssetIcon name="search" size={20} className="ml-[18px] shrink-0 text-white/50" />
        <input
          type="search"
          value={value}
          onChange={(event) => { typed.current = true; setValue(event.target.value); }}
          placeholder={placeholder}
          aria-label={placeholder}
          enterKeyHint="search"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent pl-[10px] pr-2 text-[16px] text-white outline-none placeholder:text-white/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? <button type="button" onClick={() => { typed.current = false; setValue(""); apply({ ...filters, q: "" }); }} aria-label="Borrar búsqueda" className="grid h-8 w-8 shrink-0 place-items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/settings-icons/close.svg" alt="" width={16} height={16} className="h-4 w-4 opacity-60" />
        </button> : null}
        <span className="h-8 w-px shrink-0 bg-white/25" aria-hidden="true" />
        <button type="button" onClick={() => setOpen(true)} aria-label={activeCount ? `Filtros: ${activeCount} activos` : "Abrir filtros"} aria-haspopup="dialog" className="relative grid h-full w-[60px] shrink-0 place-items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mobile-home/imgGroup.svg" alt="" width={24} height={22} className={activeCount ? "opacity-100" : "opacity-50"} />
          {activeCount ? <span className="absolute right-[10px] top-[6px] grid h-4 min-w-4 place-items-center rounded-full bg-[#C5E500] px-1 text-[10px] font-bold" style={{ color: "#070707" }}>{activeCount}</span> : null}
        </button>
      </form>
    </GlassPanel>
    {chips.length ? <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((chip) => <button key={chip.key} type="button" onClick={() => apply({ ...filters, ...chip.clear })} aria-label={`Quitar filtro ${chip.label}`} className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[#191919] pl-3 pr-2 text-[13px] text-white">
        {chip.label}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/settings-icons/close.svg" alt="" width={12} height={12} className="h-3 w-3 opacity-60" />
      </button>)}
      <button type="button" onClick={() => apply({ ...EMPTY_SEARCH_FILTERS, q: filters.q })} className="h-8 shrink-0 px-2 text-[13px] text-white/50">Limpiar</button>
    </div> : null}
    {open ? <EventFiltersSheet races={races} filters={filters} filtersExtra={filtersExtra} onApply={(next) => { apply({ ...next, q: value.trim() }); setOpen(false); }} onClose={() => setOpen(false)} /> : null}
  </div>;
}

function EventFiltersSheet({ races, filters, filtersExtra, onApply, onClose }: { races: PublicRace[]; filters: RaceSearchFilters; filtersExtra?: ReactNode; onApply: (next: RaceSearchFilters) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<RaceSearchFilters>(filters);
  const cities = useMemo(() => uniqueCities(races), [races]);
  const count = useMemo(() => races.length ? filterRaces(races, draft).length : null, [races, draft]);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKeyDown); document.body.style.overflow = previous; };
  }, []);

  const set = (patch: Partial<RaceSearchFilters>) => setDraft((current) => ({ ...current, ...patch }));
  const selectedPrice = priceId(draft);
  const chip = (selected: boolean) => `h-11 shrink-0 rounded-full px-4 text-[15px] ${selected ? "" : "border border-white/25"}`;
  const chipStyle = (selected: boolean) => selected ? { background: "#ffffff", color: "#070707" } : { color: "#ffffff" };

  return createPortal(<div className="fixed inset-0 z-[210] flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-labelledby="event-filters-title">
    <button type="button" aria-label="Cerrar filtros" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div className="relative z-[1] flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#0e0e0e]/95 text-white backdrop-blur-2xl lg:max-w-[520px] lg:rounded-[28px]">
      <div className="flex items-center justify-between px-[15px] pb-2 pt-5">
        <h2 id="event-filters-title" className="text-[20px] font-semibold leading-6">Filtros</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/settings-icons/close.svg" alt="" width={16} height={16} className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto px-[15px] pb-6">
        <section className="mt-5">
          <h3 className="text-[16px] font-semibold">Disciplina</h3>
          <div className="mt-[10px] flex flex-wrap gap-2">
            <button type="button" aria-pressed={!draft.sport} onClick={() => set({ sport: "" })} className={chip(!draft.sport)} style={chipStyle(!draft.sport)}>Todas</button>
            {SEARCH_SPORTS.map((sport) => <button key={sport.id} type="button" aria-pressed={draft.sport === sport.id} onClick={() => set({ sport: draft.sport === sport.id ? "" : sport.id })} className={chip(draft.sport === sport.id)} style={chipStyle(draft.sport === sport.id)}>{sport.label}</button>)}
          </div>
        </section>
        <section className="mt-[30px]">
          <h3 className="text-[16px] font-semibold">Ciudad</h3>
          <select value={draft.city} onChange={(event) => set({ city: event.target.value })} aria-label="Ciudad" className="mt-[10px] h-11 w-full rounded-[20px] bg-[#191919] pl-[15px] pr-[10px] text-[16px] text-white outline-none [&>option]:bg-[#191919]">
            <option value="">Todo México</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
        </section>
        <section className="mt-[30px]">
          <h3 className="text-[16px] font-semibold">Fechas</h3>
          <div className="mt-[10px] grid grid-cols-2 gap-[10px]">
            <label className="block"><span className="mb-1 block text-[13px] text-white/50">Desde</span><input type="date" value={draft.dateFrom} onChange={(event) => set({ dateFrom: event.target.value })} className="h-11 w-full rounded-[20px] bg-[#191919] px-[15px] text-[15px] text-white outline-none [color-scheme:dark]" /></label>
            <label className="block"><span className="mb-1 block text-[13px] text-white/50">Hasta</span><input type="date" value={draft.dateTo} min={draft.dateFrom || undefined} onChange={(event) => set({ dateTo: event.target.value })} className="h-11 w-full rounded-[20px] bg-[#191919] px-[15px] text-[15px] text-white outline-none [color-scheme:dark]" /></label>
          </div>
        </section>
        {filtersExtra}
        <section className="mt-[30px]">
          <h3 className="text-[16px] font-semibold">Precio</h3>
          <div className="mt-[10px] flex flex-wrap gap-2">
            {PRICES.map((price) => <button key={price.id} type="button" aria-pressed={selectedPrice === price.id} onClick={() => set({ priceMin: price.min, priceMax: price.max })} className={chip(selectedPrice === price.id)} style={chipStyle(selectedPrice === price.id)}>{price.label}</button>)}
          </div>
        </section>
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 px-[15px] py-4">
        <button type="button" onClick={() => setDraft({ ...EMPTY_SEARCH_FILTERS, q: draft.q })} className="h-12 shrink-0 px-3 text-[16px] text-white/70">Limpiar</button>
        <button type="button" onClick={() => onApply(draft)} disabled={count === 0} className="h-12 flex-1 rounded-full bg-white text-[16px] font-bold disabled:opacity-50" style={{ color: "#070707" }}>{count == null ? "Ver eventos" : count === 0 ? "Sin eventos" : `Ver ${count} evento${count === 1 ? "" : "s"}`}</button>
      </div>
    </div>
  </div>, document.body);
}
