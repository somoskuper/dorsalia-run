import Link from "next/link";

export const metadata = {
  title: "Normas de la comunidad",
  description:
    "Normas, sanciones y procedimiento de moderación para organizadores y eventos en Dorsalia.",
  alternates: { canonical: "https://dorsalia.run/normas-comunidad" },
};

const REPORT_EMAIL = "contacto@dorsalia.run";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      <div className="space-y-3 text-[var(--muted)]">{children}</div>
    </section>
  );
}

export default function NormasComunidadPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
        <p className="text-xs font-mono uppercase tracking-widest text-[var(--muted)] mb-4">Legal</p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Normas de la Comunidad</h1>
        <p className="text-sm text-[var(--muted)] mb-2">Última actualización: septiembre 2026</p>
        <p className="text-[var(--muted)] leading-relaxed mb-10">
          Estas normas aplican a todas las cuentas de organizador, sitios web de eventos, contenido publicado en
          Dorsalia y cualquier interacción con atletas a través de la plataforma. El incumplimiento puede derivar en
          sanciones, incluida la eliminación de la cuenta.
        </p>

        <div className="space-y-10 leading-relaxed">
          <Section title="1. Alcance">
            <p>
              Dorsalia es una plataforma para crear, promover y administrar eventos deportivos. Al registrarte,
              reservar un subdominio, diseñar tu sitio o solicitar publicación, aceptas cumplir estas normas. Nos
              reservamos el derecho de actualizarlas; los cambios relevantes se comunicarán por correo o en el portal.
            </p>
            <p>
              <strong className="text-white">Organizador</strong> es quien crea la cuenta, el evento y el sitio.
              <strong className="text-white"> Contenido</strong> incluye textos, imágenes, videos, logos, banners,
              enlaces, precios, descripciones y cualquier material visible en el sitio o en el proceso de inscripción.
            </p>
          </Section>

          <Section title="2. Contenido permitido">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Información <strong className="text-white">veraz y verificable</strong> sobre el evento: nombre, fecha,
                lugar, distancias, horarios, reglamento, precios, inclusiones del kit y políticas de reembolso o cambio.
              </li>
              <li>
                Imágenes, videos y logotipos de los que seas titular o tengas <strong className="text-white">licencia
                o autorización expresa</strong> del titular de derechos.
              </li>
              <li>
                Comunicación profesional y respetuosa hacia atletas, patrocinadores, staff y terceros.
              </li>
              <li>
                Sitios completos y funcionales: no se aceptan páginas vacías, “en construcción” permanentes o con
                información engañosa para obtener aprobación.
              </li>
              <li>
                Cobros procesados únicamente a través de los medios habilitados por Dorsalia (Stripe Connect vinculado
                y verificado).
              </li>
            </ul>
          </Section>

          <Section title="3. Contenido y conductas prohibidas">
            <p className="font-semibold text-white">Queda estrictamente prohibido:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong className="text-white">Contenido sexual explícito o pornográfico:</strong> desnudos, actos
                sexuales, insinuaciones pornográficas o material sexualizado en banners, héroes, galerías o cualquier
                sección del sitio.
              </li>
              <li>
                <strong className="text-white">Odio, violencia y discriminación:</strong> contenido que promueva odio,
                acoso, amenazas o violencia contra personas o grupos por raza, etnia, nacionalidad, religión, género,
                orientación sexual, identidad de género, discapacidad u otra condición protegida.
              </li>
              <li>
                <strong className="text-white">Spam y abuso de la plataforma:</strong> crear múltiples cuentas o
                eventos duplicados sin justificación, páginas genéricas repetidas, keyword stuffing, enlaces masivos
                no relacionados con el evento o uso de Dorsalia como directorio publicitario ajeno al deporte.
              </li>
              <li>
                <strong className="text-white">Suplantación e identidad falsa:</strong> hacerse pasar por otra
                persona, marca, evento o institución; usar nombres, logos o imágenes de terceros sin autorización.
              </li>
              <li>
                <strong className="text-white">Fraude y engaño:</strong> eventos inexistentes, precios falsos,
                promesas de premios o servicios que no se entregarán, desvío de pagos fuera de la plataforma para
                evadir comisiones o controles, manipulación de inscripciones o datos de atletas.
              </li>
              <li>
                <strong className="text-white">Seguridad:</strong> enlaces maliciosos, malware, phishing, recolección
                de datos personales o bancarios fuera de los formularios oficiales de Dorsalia/Stripe.
              </li>
              <li>
                <strong className="text-white">Propiedad intelectual:</strong> uso no autorizado de marcas, fotografías,
                música, tipografías con licencia restringida o material de otros eventos.
              </li>
              <li>
                <strong className="text-white">Actividades ilegales:</strong> cualquier contenido o evento que viole la
                legislación aplicable en México o en la jurisdicción del evento.
              </li>
            </ul>
          </Section>

          <Section title="4. Reseñas, mensajes y críticas">
            <p>Se permiten opiniones y críticas negativas basadas en experiencias propias. Distingue con claridad tus opiniones de los hechos verificables y aporta contexto cuando sea posible.</p>
            <p>Prohibimos acoso, amenazas, suplantación y acusaciones fácticas deliberadamente falsas o sin sustento. Una palabra como «estafa» no provoca por sí sola la eliminación automática: evaluamos el contexto y ofrecemos un canal de reporte a contacto@dorsalia.run.</p>
          </Section>

          <Section title="4. Obligaciones del organizador">
            <ul className="list-disc pl-5 space-y-2">
              <li>Completar la vinculación de Stripe Connect antes de publicar el sitio.</li>
              <li>Mantener actualizada la información del evento (fecha, precio, cupo, reglamento).</li>
              <li>Responder de forma oportuna a consultas de atletas sobre inscripciones, pagos y entrega de kits.</li>
              <li>Corregir de inmediato cualquier contenido señalado por el equipo de moderación.</li>
              <li>No publicar datos personales de atletas (dorsales, correos, teléfonos) sin base legal y consentimiento.</li>
            </ul>
          </Section>

          <Section title="5. Revisión y publicación">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Diseñas tu sitio en borrador dentro del editor visual (no es público).</li>
              <li>Reservas tu subdominio en Configuración → Sitio.</li>
              <li>Vinculas Stripe Connect en Cobros.</li>
              <li>Publicas desde el portal o el editor. El sitio queda visible de inmediato.</li>
              <li>
                Al publicar, una revisión automática revisa textos e imágenes nuevas contra estas normas. Si hay un
                hallazgo, el equipo de Dorsalia recibe un aviso y puede retirar el sitio. La publicación no espera
                una aprobación humana.
              </li>
            </ol>
            <p className="mt-3">
              Nos reservamos el derecho de revisar sitios ya publicados en cualquier momento. Un sitio publicado puede
              ser retirado si infringe estas normas o recibe reportes fundados.
            </p>
          </Section>

          <Section title="6. Sanciones">
            <p>
              Las infracciones se clasifican por gravedad. Dorsalia puede aplicar una o varias medidas, con o sin
              previo aviso, según el caso:
            </p>
            <div className="mt-4 space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <div>
                <p className="font-semibold text-white">Nivel 1 — Advertencia</p>
                <p className="text-sm mt-1">
                  Rechazo de la solicitud de publicación con indicación concreta de qué corregir. El organizador puede
                  modificar el sitio y reenviar la solicitud.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Nivel 2 — Retiro de sitio</p>
                <p className="text-sm mt-1">
                  El sitio deja de ser público de forma inmediata. Las inscripciones pueden quedar suspendidas hasta
                  resolver el incidente. Se notifica por correo el motivo.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Nivel 3 — Suspensión temporal de cuenta</p>
                <p className="text-sm mt-1">
                  Bloqueo del acceso al portal por un periodo determinado. No podrás editar sitios, publicar eventos
                  ni procesar nuevas inscripciones durante la suspensión.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Nivel 4 — Bloqueo permanente de cuenta</p>
                <p className="text-sm mt-1">
                  Acceso al portal revocado de forma definitiva. Todos los sitios asociados se retiran. No se permite
                  crear nuevas cuentas para eludir el bloqueo.
                </p>
              </div>
              <div>
                <p className="font-semibold text-white">Nivel 5 — Eliminación de cuenta y datos</p>
                <p className="text-sm mt-1">
                  En casos graves (fraude reiterado, contenido ilegal, amenazas, suplantación sistemática), procedemos
                  a la eliminación de la cuenta y, cuando la ley lo permita, la conservación de registros necesarios
                  para cooperar con autoridades o procesos legales.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm">
              Las sanciones no eximen de responsabilidades civiles, mercantiles o penales ante atletas, patrocinadores
              o autoridades. Dorsalia puede retener fondos en trámite con Stripe cuando exista investigación de fraude,
              conforme a las políticas de Stripe y la legislación aplicable.
            </p>
          </Section>

          <Section title="7. Fraude y reportes">
            <p>
              Si detectas un evento fraudulento, cobros sospechosos, suplantación, contenido ilegal o cualquier
              violación grave de estas normas, repórtalo de inmediato a:
            </p>
            <p className="mt-3">
              <a
                href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent("Reporte de fraude o violación — Dorsalia")}`}
                className="text-[var(--accent)] font-semibold underline"
              >
                {REPORT_EMAIL}
              </a>
            </p>
            <p className="mt-3">Incluye, si es posible:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>URL del sitio o nombre del evento.</li>
              <li>Descripción clara de la conducta sospechosa.</li>
              <li>Capturas de pantalla o evidencia.</li>
              <li>Tu correo de contacto (opcional, para seguimiento).</li>
            </ul>
            <p className="mt-3">
              Revisamos todos los reportes. Los casos de fraude confirmado pueden derivar en bloqueo inmediato,
              eliminación de cuenta y, cuando corresponda, notificación a Stripe y autoridades competentes.
            </p>
          </Section>

          <Section title="8. Apelaciones">
            <p>
              Si tu sitio fue rechazado o retirado y consideras que hubo un error, puedes:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mt-2">
              <li>Corregir el contenido señalado y volver a publicar desde el portal o el editor.</li>
              <li>
                Escribir a{" "}
                <a href={`mailto:${REPORT_EMAIL}`} className="text-[var(--accent)] underline">
                  {REPORT_EMAIL}
                </a>{" "}
                con el asunto «Apelación — [nombre del evento]», explicando por qué crees que la decisión debe
                revisarse.
              </li>
            </ol>
            <p className="mt-3">
              Las apelaciones se responden en un plazo razonable. Una segunda revisión no garantiza la restitución
              del sitio si el contenido sigue incumpliendo estas normas.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Dudas sobre estas normas, moderación o reportes:{" "}
              <a href={`mailto:${REPORT_EMAIL}`} className="text-[var(--accent)] underline">
                {REPORT_EMAIL}
              </a>
            </p>
          </Section>
        </div>

        <p className="mt-14 text-xs text-[var(--muted)] border-t border-white/10 pt-6">
          <Link href="/" className="hover:text-white underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
