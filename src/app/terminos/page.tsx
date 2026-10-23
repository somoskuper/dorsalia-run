import type { Metadata } from "next";
import Link from "next/link";
import {
  ORGANIZER_CONTRACT_LAST_UPDATED,
  ORGANIZER_CONTRACT_SECTIONS,
  ORGANIZER_CONTRACT_VERSION,
} from "@/lib/organizerContractContent";

export const metadata: Metadata = {
  title: "Términos y contrato digital",
  description:
    "Contrato completo para organizadores: responsabilidades, comisiones, Stripe, dominios, mapas OSM/Esri, Resend y derechos de Dorsalia Run en México.",
  alternates: { canonical: "https://dorsalia.run/terminos" },
};

export default function TerminosPage() {
  const year = new Date().getFullYear();
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted)] mb-3">Legal</p>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
        Términos y contrato digital
      </h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Versión {ORGANIZER_CONTRACT_VERSION} · Última actualización: {ORGANIZER_CONTRACT_LAST_UPDATED}
      </p>
      <p className="mt-6 text-[var(--muted)] leading-relaxed">
        Este es el texto completo del contrato digital que el organizador debe aceptar al crear un
        evento en portal.dorsalia.run (Dalia o formulario clásico). Léelo con calma: está redactado
        para dejar poco espacio a la interpretación.
      </p>

      <div className="mt-10 rounded-2xl border border-[var(--border)] bg-white/5 p-5 md:p-6 space-y-3">
        <h2 className="text-lg font-bold text-white">Servicios operados por Dorsalia (México)</h2>
        <ul className="space-y-2 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <strong className="text-white">dorsalia.run</strong> — marketplace e índice público de
            carreras.
          </li>
          <li>
            <strong className="text-white">portal.dorsalia.run</strong> — panel del organizador
            (eventos, cobros, Dalia, configuración).
          </li>
          <li>
            <strong className="text-white">editor.dorsalia.run</strong> — editor visual del sitio del
            evento.
          </li>
        </ul>
        <p className="text-sm text-[var(--muted)] leading-relaxed pt-1">
          Las tres propiedades son operadas por Dorsalia en México. Los sitios bajo *.dorsalia.run
          son propiedad de Dorsalia (préstamo de hosting al organizador). Los dominios personalizados
          siguen siendo del organizador. Todos los derechos reservados.
        </p>
      </div>

      <div className="mt-12 space-y-12">
        {ORGANIZER_CONTRACT_SECTIONS.map((s) => (
          <section key={s.id} id={s.id}>
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">{s.title}</h2>
            <div className="space-y-3 text-[var(--muted)] leading-relaxed text-sm md:text-[15px]">
              {s.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
              {s.bullets?.length ? (
                <ul className="list-disc pl-5 space-y-2.5">
                  {s.bullets.map((b) => (
                    <li key={b.slice(0, 48)}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-14 text-sm text-[var(--muted)]">
        También:{" "}
        <Link href="/privacidad" className="text-white hover:underline">
          Privacidad
        </Link>
        ,{" "}
        <Link href="/normas-comunidad" className="text-white hover:underline">
          Normas de la comunidad
        </Link>
        ,{" "}
        <Link href="/cookies" className="text-white hover:underline">
          Cookies
        </Link>
        .
      <Link href="/indexacion" className="text-white hover:underline">
          Indexación
        </Link>.
      </p>
      <p className="mt-4 text-xs text-[var(--muted)]">
        © {year} Dorsalia Run · México · Versión {ORGANIZER_CONTRACT_VERSION}
      </p>
    </div>
  );
}
