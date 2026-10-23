"use client";

import { useEffect, useState } from "react";

function relativeLabel(value: string) {
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  const units: [number, string, string][] = [
    [31_536_000, "año", "años"],
    [2_629_800, "mes", "meses"],
    [604_800, "semana", "semanas"],
    [86_400, "día", "días"],
    [3_600, "hora", "horas"],
    [60, "minuto", "minutos"],
    [1, "segundo", "segundos"],
  ];
  const [seconds, singular, plural] = units.find(([size]) => elapsed >= size) || units[units.length - 1];
  const amount = Math.max(1, Math.floor(elapsed / seconds));
  return `hace ${amount} ${amount === 1 ? singular : plural}`;
}

export default function RelativeTime({ value }: { value: string }) {
  const [label, setLabel] = useState(() => relativeLabel(value));
  useEffect(() => {
    const refresh = () => setLabel(relativeLabel(value));
    refresh();
    const age = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
    const timer = window.setInterval(refresh, age < 60 ? 1000 : age < 3600 ? 30_000 : 60_000);
    return () => window.clearInterval(timer);
  }, [value]);
  return <time dateTime={value} title={new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" }).format(new Date(value))}>{label}</time>;
}
