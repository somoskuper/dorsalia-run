import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comisiones y cargos por servicio",
  description:
    "Consulta cómo se muestran las comisiones y cargos por servicio de las inscripciones vendidas con Dorsalia.",
  alternates: { canonical: "https://dorsalia.run/docs/comisiones" },
  openGraph: {
    title: "Comisiones y cargos por servicio | Dorsalia",
    description: "Información clara sobre las comisiones aplicables a inscripciones de eventos deportivos.",
    url: "https://dorsalia.run/docs/comisiones",
    type: "article",
  },
};

const rows = [
  ["Crear cuenta y publicar", "$0 MXN", "No hay costo fijo mensual para crear una cuenta y publicar un evento."],
  ["Comisión de plataforma", "5.7% + IVA", "Se calcula sobre el precio base de cada boleto vendido."],
  ["Cargos de procesamiento", "Variable", "Dependen del método de pago y se muestran antes de confirmar la inscripción."],
  ["Eventos gratuitos", "$0 MXN", "No generan comisión por inscripción."],
];

export default function ComisionesPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f6] text-[#161616]">
      <article className="mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
        <nav className="mb-12 text-sm text-neutral-500" aria-label="Navegación contextual">
          <Link href="/" className="hover:text-black">Dorsalia</Link>
          <span className="mx-2">/</span>
          <span>Documentación</span>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">Comisiones</span>
        </nav>

        <header className="max-w-3xl border-b border-neutral-200 pb-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#829500]">Documentación para organizadores</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Comisiones y cargos por servicio</h1>
          <p className="mt-5 text-lg leading-relaxed text-neutral-600">
            Información clara sobre los cargos aplicables a las inscripciones vendidas con Dorsalia. El precio final siempre se muestra antes de confirmar el pago.
          </p>
          <p className="mt-5 text-sm text-neutral-500">Última actualización: 22 de septiembre de 2026</p>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-12">
            <section aria-labelledby="resumen">
              <h2 id="resumen" className="text-2xl font-semibold">Resumen</h2>
              <div className="mt-5 overflow-x-auto border border-neutral-200 bg-white">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-neutral-100 text-xs uppercase tracking-wide text-neutral-500">
                    <tr><th className="px-5 py-4 font-semibold">Concepto</th><th className="px-5 py-4 font-semibold">Importe</th><th className="px-5 py-4 font-semibold">Cómo aplica</th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {rows.map(([concept, amount, detail]) => (
                      <tr key={concept}><td className="px-5 py-4 font-medium">{concept}</td><td className="px-5 py-4 font-semibold">{amount}</td><td className="px-5 py-4 leading-relaxed text-neutral-600">{detail}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="como-se-calcula">
              <h2 id="como-se-calcula" className="text-2xl font-semibold">Cómo se calcula</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="border border-neutral-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">1. Precio base</p><p className="mt-3 leading-relaxed text-neutral-700">El organizador define el precio base de cada modalidad o fase de inscripción.</p></div>
                <div className="border border-neutral-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">2. Comisión Dorsalia</p><p className="mt-3 leading-relaxed text-neutral-700">Se aplica 5.7% sobre el precio base, más el IVA correspondiente a esa comisión.</p></div>
                <div className="border border-neutral-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">3. Procesamiento</p><p className="mt-3 leading-relaxed text-neutral-700">Los cargos del proveedor de pago pueden variar según el medio elegido y se detallan durante el checkout.</p></div>
                <div className="border border-neutral-200 bg-white p-6"><p className="text-xs font-bold uppercase tracking-wide text-neutral-500">4. Total visible</p><p className="mt-3 leading-relaxed text-neutral-700">Antes de pagar, la persona inscrita ve el precio base y los cargos por servicio aplicables.</p></div>
              </div>
            </section>

            <section aria-labelledby="consideraciones">
              <h2 id="consideraciones" className="text-2xl font-semibold">Consideraciones importantes</h2>
              <ul className="mt-5 space-y-3 border-l-2 border-[#c5e500] pl-5 leading-relaxed text-neutral-700">
                <li>La comisión de Dorsalia aplica únicamente a inscripciones de pago procesadas en la plataforma.</li>
                <li>El organizador mantiene la responsabilidad sobre precios, fases, cupos, reembolsos y condiciones de su evento.</li>
                <li>Los importes y cargos aplicables se muestran de forma transparente antes de completar una compra.</li>
              </ul>
            </section>
          </div>

          <aside className="h-fit border border-neutral-200 bg-white p-6 lg:sticky lg:top-8">
            <p className="text-sm font-semibold">¿Quieres publicar tu evento?</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">Crea tu cuenta, configura tus modalidades y empieza a recibir inscripciones.</p>
            <a href="https://portal.dorsalia.run" className="mt-5 inline-flex bg-[#c5e500] px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90">Comienza gratis</a>
            <div className="mt-8 border-t border-neutral-200 pt-5 text-sm text-neutral-600"><Link href="/terminos" className="underline underline-offset-4 hover:text-black">Consulta los términos y condiciones</Link></div>
          </aside>
        </div>
      </article>
    </main>
  );
}
