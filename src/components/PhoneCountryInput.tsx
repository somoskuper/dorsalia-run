"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type PhoneCountry = {
  iso: string;
  dial: string;
  name: string;
};

/** Curated LatAm + common dial codes. Default México (+52). */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "mx", dial: "52", name: "México" },
  { iso: "us", dial: "1", name: "Estados Unidos" },
  { iso: "ca", dial: "1", name: "Canadá" },
  { iso: "gt", dial: "502", name: "Guatemala" },
  { iso: "sv", dial: "503", name: "El Salvador" },
  { iso: "hn", dial: "504", name: "Honduras" },
  { iso: "ni", dial: "505", name: "Nicaragua" },
  { iso: "cr", dial: "506", name: "Costa Rica" },
  { iso: "pa", dial: "507", name: "Panamá" },
  { iso: "co", dial: "57", name: "Colombia" },
  { iso: "pe", dial: "51", name: "Perú" },
  { iso: "cl", dial: "56", name: "Chile" },
  { iso: "ar", dial: "54", name: "Argentina" },
  { iso: "uy", dial: "598", name: "Uruguay" },
  { iso: "py", dial: "595", name: "Paraguay" },
  { iso: "bo", dial: "591", name: "Bolivia" },
  { iso: "ec", dial: "593", name: "Ecuador" },
  { iso: "ve", dial: "58", name: "Venezuela" },
  { iso: "br", dial: "55", name: "Brasil" },
  { iso: "es", dial: "34", name: "España" },
  { iso: "gb", dial: "44", name: "Reino Unido" },
];

export function flagSvgUrl(iso: string) {
  return `https://flagcdn.com/${iso.toLowerCase()}.svg`;
}

export function parseE164(
  raw: string | null | undefined,
  fallbackIso = "mx",
): { country: PhoneCountry; national: string } {
  const fallback =
    PHONE_COUNTRIES.find((c) => c.iso === fallbackIso) || PHONE_COUNTRIES[0];
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { country: fallback, national: "" };

  const digits = trimmed.replace(/[^\d+]/g, "");
  const withPlus = digits.startsWith("+") ? digits : digits.replace(/\D/g, "");
  const only = withPlus.replace(/\D/g, "");

  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (only.startsWith(c.dial) && only.length > c.dial.length) {
      // Prefer MX when dial is shared (e.g. +1): keep US/CA only if already that iso in raw metadata — default MX for bare numbers.
      if (c.dial === "1" && !trimmed.startsWith("+1")) continue;
      return { country: c, national: only.slice(c.dial.length) };
    }
  }
  if (only.startsWith("52") && only.length >= 12) {
    return { country: fallback, national: only.slice(2) };
  }
  return { country: fallback, national: only };
}

export function formatE164(country: PhoneCountry, national: string) {
  const local = national.replace(/\D/g, "");
  if (!local) return "";
  return `+${country.dial}${local}`;
}

type Props = {
  value: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  /** light = dark text on light form; dark = white text on dark marketplace */
  tone?: "light" | "dark";
};

export default function PhoneCountryInput({
  value,
  onChange,
  onBlur,
  className = "",
  inputClassName = "",
  buttonClassName = "",
  placeholder = "Número",
  name,
  id,
  disabled,
  tone = "dark",
}: Props) {
  const parsed = useMemo(() => parseE164(value), [value]);
  const [country, setCountry] = useState<PhoneCountry>(parsed.country);
  const [national, setNational] = useState(parsed.national);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = parseE164(value);
    setCountry(next.country);
    setNational(next.national);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function emit(nextCountry: PhoneCountry, nextNational: string) {
    onChange(formatE164(nextCountry, nextNational));
  }

  const panel =
    tone === "dark"
      ? "bg-[#121212] border-white/15 text-white"
      : "bg-white border-neutral-200 text-neutral-900";
  const btn =
    tone === "dark"
      ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
      : "border-neutral-300 bg-neutral-50 text-neutral-800 hover:bg-neutral-100";

  return (
    <div ref={rootRef} className={`relative flex gap-2 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-sm outline-none ${btn} ${buttonClassName}`}
        aria-label={`Código de país: ${country.name} +${country.dial}`}
        aria-expanded={open}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagSvgUrl(country.iso)}
          alt=""
          width={20}
          height={14}
          className="h-3.5 w-5 rounded-[2px] object-cover"
        />
        <span className="tabular-nums text-[13px]">+{country.dial}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="opacity-60">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        disabled={disabled}
        value={national}
        placeholder={placeholder}
        onBlur={onBlur}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d\s-]/g, "");
          setNational(next);
          emit(country, next);
        }}
        className={`min-w-0 flex-1 h-11 rounded-xl border px-3 text-sm outline-none ${inputClassName}`}
        autoComplete="tel-national"
      />

      {open ? (
        <div
          className={`absolute left-0 top-[calc(100%+6px)] z-40 max-h-56 w-[min(100%,18rem)] overflow-y-auto rounded-xl border shadow-xl ${panel}`}
          role="listbox"
        >
          {PHONE_COUNTRIES.map((c) => (
            <button
              key={`${c.iso}-${c.dial}-${c.name}`}
              type="button"
              role="option"
              aria-selected={c.iso === country.iso && c.dial === country.dial}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] ${
                tone === "dark" ? "hover:bg-white/10" : "hover:bg-neutral-100"
              }`}
              onClick={() => {
                setCountry(c);
                setOpen(false);
                emit(c, national);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagSvgUrl(c.iso)}
                alt=""
                width={20}
                height={14}
                className="h-3.5 w-5 rounded-[2px] object-cover"
              />
              <span className="flex-1 truncate">{c.name}</span>
              <span className="tabular-nums opacity-60">+{c.dial}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
