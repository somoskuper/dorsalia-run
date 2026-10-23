"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  EMPTY_SEARCH_FILTERS,
  filtersFromSearchParams,
  writeFiltersToSearchParams,
  type RaceSearchFilters,
} from "@/lib/raceSearch";

const GREEN = "#c5e500";

const field =
  "box-border w-full h-10 rounded-lg border-0 bg-white/[0.06] px-3 text-[13px] text-white outline-none placeholder:text-white/30 focus:bg-white/[0.1] [&>option]:bg-[#1c1c1e] [&>option]:text-white";

type Props = {
  open: boolean;
  onClose: () => void;
  cities: string[];
  boundMin: number;
  boundMax: number;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (lo: number, hi: number) => void;
}) {
  const span = Math.max(max - min, 1);
  const left = ((valueMin - min) / span) * 100;
  const right = ((valueMax - min) / span) * 100;

  return (
    <div>
      <div className="relative h-7">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/15" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
          style={{
            left: `${left}%`,
            right: `${100 - right}%`,
            background: GREEN,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={25}
          value={valueMin}
          onChange={(e) => {
            const next = Math.min(Number(e.target.value), valueMax);
            onChange(next, valueMax);
          }}
          className="mp-range-thumb absolute inset-0 z-[2] w-full appearance-none bg-transparent"
          aria-label="Precio mínimo"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={25}
          value={valueMax}
          onChange={(e) => {
            const next = Math.max(Number(e.target.value), valueMin);
            onChange(valueMin, next);
          }}
          className="mp-range-thumb absolute inset-0 z-[3] w-full appearance-none bg-transparent"
          aria-label="Precio máximo"
        />
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[12px] text-white/55">
        <span>{formatMoney(valueMin)}</span>
        <span>{formatMoney(valueMax)}</span>
      </div>
    </div>
  );
}

/** Compact filter panel inline on home — no full-screen drawer. */
export default function SearchFiltersSheet({
  open,
  onClose,
  cities,
  boundMin,
  boundMax,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<RaceSearchFilters>(EMPTY_SEARCH_FILTERS);
  const [sliderMin, setSliderMin] = useState(boundMin);
  const [sliderMax, setSliderMax] = useState(boundMax);

  const urlFilters = useMemo(
    () => filtersFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  useEffect(() => {
    if (!open) return;
    setDraft({ ...urlFilters });
    setSliderMin(urlFilters.priceMin ?? boundMin);
    setSliderMax(urlFilters.priceMax ?? boundMax);
  }, [open, urlFilters, boundMin, boundMax]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointer(e: MouseEvent | TouchEvent) {
      const el = panelRef.current;
      if (!el) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-mp-filters-trigger]")) return;
      if (!el.contains(target)) onClose();
    }
    window.addEventListener("keydown", onKey);
    // Delay so the opening click doesn't immediately close
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onPointer);
      document.addEventListener("touchstart", onPointer);
    }, 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onClose]);

  function pushFilters(next: RaceSearchFilters, lo: number, hi: number) {
    const fullRange = lo <= boundMin && hi >= boundMax;
    const payload: RaceSearchFilters = {
      ...next,
      priceMin: fullRange ? null : lo,
      priceMax: fullRange ? null : hi,
    };
    const params = writeFiltersToSearchParams(
      new URLSearchParams(searchParams.toString()),
      payload,
    );
    const e = searchParams.get("e");
    if (e) params.set("e", e);
    else params.delete("e");
    const status = searchParams.get("status");
    if (status) params.set("status", status);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function clearAll() {
    const cleared = { ...EMPTY_SEARCH_FILTERS, q: draft.q };
    setDraft(cleared);
    setSliderMin(boundMin);
    setSliderMax(boundMax);
    pushFilters(cleared, boundMin, boundMax);
  }

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="mp-section-enter mb-4 rounded-[16px] border border-white/10 bg-[#111] px-3.5 py-3 md:mb-6"
      role="region"
      aria-label="Filtros de búsqueda"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/45">
          Filtros
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-semibold text-white/45 hover:text-white"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            aria-label="Cerrar filtros"
          >
            <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="col-span-2 block sm:col-span-2">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
            Ciudad
          </span>
          <select
            className={field}
            value={draft.city}
            onChange={(e) => {
              const city = e.target.value;
              const next = { ...draft, city };
              setDraft(next);
              pushFilters(next, sliderMin, sliderMax);
            }}
          >
            <option value="">Todas</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
            Desde
          </span>
          <input
            type="date"
            className={field}
            value={draft.dateFrom}
            onChange={(e) => {
              const dateFrom = e.target.value;
              const next = { ...draft, dateFrom };
              setDraft(next);
              pushFilters(next, sliderMin, sliderMax);
            }}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
            Hasta
          </span>
          <input
            type="date"
            className={field}
            value={draft.dateTo}
            min={draft.dateFrom || undefined}
            onChange={(e) => {
              const dateTo = e.target.value;
              const next = { ...draft, dateTo };
              setDraft(next);
              pushFilters(next, sliderMin, sliderMax);
            }}
          />
        </label>
      </div>

      <div className="mt-3">
        <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
          Precio
        </span>
        <PriceRangeSlider
          min={boundMin}
          max={boundMax}
          valueMin={sliderMin}
          valueMax={sliderMax}
          onChange={(lo, hi) => {
            setSliderMin(lo);
            setSliderMax(hi);
            pushFilters(draft, lo, hi);
          }}
        />
      </div>
    </div>
  );
}
