import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Conoce cómo Dorsalia trata los datos personales en sus eventos, inscripciones y servicios para organizadores.",
  alternates: { canonical: "https://dorsalia.run/privacidad" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted)] mb-3">Legal</p>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Aviso de Privacidad</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Versión 2026-09-06.4 · Última actualización: 6 de septiembre de 2026
      </p>

      <div className="mt-10 space-y-8 text-[var(--muted)] leading-relaxed text-sm md:text-[15px]">
        <p>
          Dorsalia Run (“Dorsalia”) opera dorsalia.run, portal.dorsalia.run y editor.dorsalia.run en
          México. Este aviso describe, a nivel de plataforma, el tratamiento de datos personales
          vinculados al índice público de carreras, al portal de organizadores y a las
          inscripciones/pagos procesados en la Plataforma. El detalle contractual para organizadores
          está en{' '}
          <a className="text-white underline underline-offset-2" href="/terminos">
            /terminos
          </a>
          .
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Datos de inscripciones y pagos</h2>
          <p>
            Cuando un usuario se inscribe o completa un pago a través de Dorsalia, podemos
            almacenar identidad y contacto (nombre, correo, teléfono y campos del formulario del
            evento), datos del evento/distancia/boleto, estado de pago, folio/ticket y demás campos
            que el organizador configure.
          </p>
          <p>
            Dorsalia puede ver y conservar el registro de usuarios que completan pagos e
            inscripciones, así como registros de correos enviados por la infraestructura
            transaccional (p. ej. Resend: destinatario, tipo de mensaje, estado reportado).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Qué no vemos ni controlamos</h2>
          <p>
            Dorsalia no supervisa el día a día bancario del organizador ni tiene acceso para entrar
            a modificar CLABE, claves interbancarias, contraseñas bancarias ni credenciales de la
            cuenta Connect como si fuera el titular. Esos datos se capturan y custodian en el flujo
            de Stripe. Como plataforma Connect, Dorsalia solo puede realizar acciones que Stripe
            permita a la plataforma (estados de onboarding, comisiones, medidas de riesgo,
            desconexión/cancelación de cuenta Connect, etc.), no editar datos bancarios del
            organizador en su banco.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Finalidades</h2>
          <p>
            Usamos la base de inscripciones, pagos completados, contactos asociados al flujo y
            registros de correo para operar el servicio, soporte, seguridad/antifraude, analítica
            interna y mejora continua de la Plataforma y de la experiencia de atletas y
            organizadores.
          </p>
          <p>
            También podemos usar esa información (directa o segmentada) para mejorar la relevancia
            de comunicaciones, recomendaciones de carreras, promociones del marketplace y
            experiencias publicitarias dirigidas a usuarios y organizadores.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Cesión o comercialización a terceros</h2>
          <p>
            Dorsalia podrá compartir, licenciar o vender a terceros conjuntos de datos o segmentos
            derivados de esa base (incluidos datos de contacto de usuarios que completaron
            inscripciones/pagos y metadatos de engagement/correo), con la finalidad de mejorar la
            experiencia publicitaria y comercial de usuarios y organizadores, o fines análogos de
            marketing/publicidad, sujeto a la legislación mexicana aplicable.
          </p>
          <p>
            No vendemos PAN/CVV de tarjetas (los procesa Stripe). No entregamos a terceros CLABE ni
            claves bancarias del organizador que Dorsalia no custodia como editor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">5. Administración de la Plataforma y publicidad</h2>
          <p>
            Dorsalia, como operador, puede ejercer facultades de administración sobre eventos y
            sitios (consultar, cancelar, activar o desactivar eventos; visualizar y editar el Sitio
            en el editor aunque el personal autorizado no sea titular de la cuenta del
            organizador), con fines de operación, soporte, cumplimiento, calidad o seguridad. Eso
            no convierte a Dorsalia en el organizador deportivo del evento ni le da acceso a datos
            bancarios sensibles del organizador.
          </p>
          <p>
            Dorsalia puede mostrar avisos y publicidad propia o de terceros (incluida publicidad
            remunerada) en el portal del organizador, en dorsalia.run y en el editor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">6. Organizadores y sitios de evento</h2>
          <p>
            Los datos de cada carrera publicados en el índice pueden provenir del organizador. El
            organizador es responsable de su propio aviso de privacidad del evento cuando
            corresponda.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">7. Derechos ARCO y contacto</h2>
          <p>
            Para ejercer derechos de acceso, rectificación, cancelación u oposición (u otros que
            procedan), escribe a soporte desde el portal de organizadores o los medios publicados en
            dorsalia.run. Consulta también{' '}
            <a className="text-white underline underline-offset-2" href="/terminos">
              términos
            </a>{' '}
            y{' '}
            <a className="text-white underline underline-offset-2" href="/normas-comunidad">
              normas de la comunidad
            </a>, y <a className="text-white underline underline-offset-2" href="/indexacion">información sobre indexación y resultados</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
