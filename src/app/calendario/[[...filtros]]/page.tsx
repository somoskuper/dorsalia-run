import type { Metadata } from "next";
import { fetchPublicRaces } from "@/lib/races";
import RaceCalendar from "./RaceCalendar";

export const revalidate = 60;
export const metadata: Metadata = {
  title: "Calendario de eventos deportivos en México | Dorsalia",
  description: "Consulta carreras y eventos deportivos en México. Filtra por año, ciudad, disciplina y precio; revisa distancias y opciones de inscripción.",
  alternates: { canonical: "https://dorsalia.run/calendario" },
};

export default async function CalendarPage() {
  const races = (await fetchPublicRaces({ status: "all" })).filter((r) => r.is_published && r.robots_index !== false);
  const states = [...new Set(races.map((race) => race.state?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "es-MX"));
  const cities = [...new Set(races.map((race) => race.city?.trim()).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "es-MX"));
  const toSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return <>
    <RaceCalendar races={races} />
    <section className="hidden bg-[#070707] px-5 pb-20 text-white md:block" aria-labelledby="calendar-guide-title">
      <div className="mx-auto max-w-7xl border-t border-white/10 pt-10">
        <h2 id="calendar-guide-title" className="text-3xl font-black tracking-tight">Guía del calendario de eventos deportivos en México</h2>
        <p className="mt-4 max-w-4xl text-base leading-8 text-white/60">Consulta carreras y eventos deportivos publicados para todo el año. Compara fechas, ciudades, disciplinas, distancias y precios; los eventos próximos aparecen primero para que encuentres con facilidad tu siguiente reto. La información puede cambiar, así que revisa la ficha y confirma los detalles de inscripción con el organizador.</p>
        <div className="mt-9">
          <h3 className="text-lg font-bold">Explora eventos por estado y ciudad</h3>
          <p className="mt-2 text-sm leading-6 text-white/55">Continúa tu búsqueda en los directorios locales de Dorsalia:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {states.slice(0, 10).map((state) => <a key={`state-${state}`} href={`/carreras/${toSlug(state)}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-[#c9f24b] hover:text-[#c9f24b]">Eventos en {state}</a>)}
            {cities.slice(0, 10).map((city) => <a key={`city-${city}`} href={`/carreras/${toSlug(city)}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-[#c9f24b] hover:text-[#c9f24b]">Eventos en {city}</a>)}
          </div>
        </div>
        <div className="mt-9 grid gap-8 md:grid-cols-2">
          <div><h3 className="text-lg font-bold">Carreras, distancias e inscripciones</h3><p className="mt-2 text-sm leading-7 text-white/60">Encuentra opciones de running, trail y otras disciplinas, desde distancias recreativas hasta 10K, medio maratón y maratón. Cada ficha reúne la información disponible del evento y enlaza con el organizador para continuar tu inscripción.</p></div>
          <div><h3 className="text-lg font-bold">Eventos gratuitos y de pago</h3><p className="mt-2 text-sm leading-7 text-white/60">Usa los filtros para explorar eventos gratuitos o de pago, elegir una ciudad y consultar las actividades de cada mes. Los precios y las modalidades dependen de cada organizador.</p></div>
        </div>
        <p className="mt-9 text-sm leading-6 text-white/55">También puedes <a href="/carreras" className="font-semibold text-[#c9f24b] underline underline-offset-4">explorar todas las carreras</a>, revisar <a href="/carreras/yucatan" className="font-semibold text-[#c9f24b] underline underline-offset-4">carreras en Yucatán</a> y <a href="/carreras/campeche" className="font-semibold text-[#c9f24b] underline underline-offset-4">carreras en Campeche</a>, o volver al <a href="/" className="font-semibold text-[#c9f24b] underline underline-offset-4">inicio de Dorsalia</a>.</p>
      </div>
    </section>
  </>;
}
