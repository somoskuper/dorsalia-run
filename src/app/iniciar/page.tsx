import type { Metadata } from "next";
import { IniciarPortalCta } from "@/components/IniciarMetaPixel";
import LandingRouteExperience from "@/components/LandingRouteExperience";
import { fetchPublicRaces, PORTAL_URL } from "@/lib/races";

export const metadata: Metadata = {
  title: "Crea, organiza y vende tu evento deportivo",
  description:
    "Crea la página de tu evento deportivo, publica inscripciones, cobra en línea y administra corredores con Dorsalia. Empieza gratis.",
  alternates: { canonical: "https://dorsalia.run/iniciar" },
  keywords: [
    "plataforma para eventos deportivos",
    "inscripciones para carreras",
    "organizar carreras",
    "vender boletos para eventos deportivos",
    "página web para carrera",
    "Dorsalia",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Crea, organiza y vende tu evento deportivo | Dorsalia",
    description:
      "Publica tu evento, vende inscripciones, cobra en línea y opera todo desde un solo lugar. Empieza gratis con Dorsalia.",
    url: "https://dorsalia.run/iniciar",
    siteName: "Dorsalia",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/landing/iniciar-og.png",
        width: 1200,
        height: 1200,
        alt: "Organiza, crea, opera y vende tu evento deportivo con Dorsalia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crea, organiza y vende tu evento deportivo | Dorsalia",
    description:
      "Publica tu evento, vende inscripciones, cobra en línea y opera todo desde un solo lugar.",
    images: ["/landing/iniciar-og.png"],
  },
};

const landingSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Dorsalia",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es-MX",
  url: "https://dorsalia.run/iniciar",
  description:
    "Plataforma para crear, publicar, vender y operar eventos deportivos con inscripciones, pagos y páginas web.",
  image: "https://dorsalia.run/landing/iniciar-og.png",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "MXN",
    description: "Crear una cuenta y publicar un evento en Dorsalia no tiene costo fijo mensual.",
  },
  provider: {
    "@type": "Organization",
    name: "Dorsalia",
    url: "https://dorsalia.run",
  },
};

const landingImages = {
  events: [
    "/landing/event-card-placeholder.png",
    "/landing/event-card-social-run.webp",
    "/landing/event-card-ruta-pirata.webp",
  ],
  badges: ["/landing/badge-3k.png", "/landing/badge-5k.png", "/landing/badge-10k.png"],
};

const socialLinks = [
  { href: "https://instagram.com/dorsalia", src: "/assetsdev/Social-Icons-5.svg", label: "Instagram" },
  { href: "https://facebook.com/dorsalia", src: "/assetsdev/Social-Icons-4.svg", label: "Facebook" },
  { href: "https://www.tiktok.com/@dorsalia", src: "/assetsdev/Social-Icons-3.svg", label: "TikTok" },
  { href: "https://youtube.com/@dorsalia", src: "/assetsdev/Social-Icons-2.svg", label: "YouTube" },
  { href: "https://x.com/dorsalia", src: "/assetsdev/Social-Icons-1.svg", label: "X" },
];

function LandingImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    // Local exports have different intrinsic dimensions, so the layout controls their rendered ratio.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}

export default async function IniciarPage() {
  const races = await fetchPublicRaces({ status: "all" });
  const exampleRace = races.find((race) =>
    [race.public_subdomain, race.event_slug, race.slug].some(
      (slug) => String(slug || "").toLowerCase() === "micarrera2026",
    ),
  );
  const exampleRoutes = Array.isArray(exampleRace?.routes) ? exampleRace.routes : [];

  return (
    <main className="overflow-hidden bg-[#050504] text-white [font-family:'Plus_Jakarta_Sans','Segoe_UI','Helvetica_Neue',Arial,sans-serif]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(landingSchema) }} />
      <div className="flex min-h-10 w-full items-center justify-center bg-[#c5e500] px-5 py-2 text-center text-[14px] font-bold text-[#070707] md:text-[16px]">
        Gestiona tu evento deportivo con Dorsalia
      </div>
      <section className="mx-auto grid w-full max-w-[1440px] items-center pt-[30px] md:min-h-[calc(100dvh-103px)] md:grid-cols-[minmax(440px,1fr)_minmax(500px,1fr)] md:gap-12 md:px-12 md:pt-0 lg:gap-20 lg:px-20">
        <div className="w-full md:order-2 md:flex md:items-center md:justify-end">
          <LandingImage src="/landing/iniciar-hero.png" alt="La plataforma Dorsalia mostrada en un teléfono" className="h-auto w-full object-contain md:max-h-[calc(100dvh-128px)] md:w-auto md:max-w-full lg:max-h-[760px]" />
        </div>
        <div className="-mt-5 px-5 text-center md:order-1 md:mt-0 md:px-0 md:py-16 md:text-left">
          <LandingImage src="/landing/dorsalia-run-logo.svg" alt="Dorsalia" className="mx-auto h-auto w-[101px] md:mx-0" />
          <h1 className="mt-[5px] w-full break-normal text-[26px] font-black uppercase leading-[1.08] tracking-[0.02em] md:max-w-[720px] md:text-[44px] lg:text-[48px]" style={{ fontFamily: '"Akira Expanded", sans-serif' }}>
            Organiza, crea, opera y vende
          </h1>
          <p className="mx-auto mt-[5px] max-w-[680px] text-[16px] font-semibold leading-[1.55] md:mx-0 md:mt-5 md:max-w-[620px] md:text-[18px] md:leading-[1.65]">
            <span className="text-white/50">Olvídate de hojas de Excel, plataformas genéricas y cobros manuales. Con </span><span>Dorsalia</span><span className="text-white/50"> tienes un sistema nativo para </span><span>publicar</span><span className="text-white/50"> tu evento deportivo, </span><span>vender inscripciones</span><span className="text-white/50"> en minutos y </span><span>recibir el dinero</span><span className="text-white/50"> directamente en tu cuenta bancaria.</span>
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:mt-8 md:justify-start">
            <IniciarPortalCta href={PORTAL_URL} source="iniciar_hero" />
            <a href="/" className="ds-btn !border-white/30 !bg-white/5 !px-[23px] !py-[10px] !text-[16px] !font-medium !text-white hover:!bg-white/10">Ver cartelera</a>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-[75px] w-full max-w-[1180px] md:mt-32 md:px-8">
        <h2 className="mx-auto max-w-[840px] px-5 text-center text-[24px] font-semibold leading-[1.5] md:text-[44px] md:leading-[1.18]">Publica eventos de nivel profesional listos para recibir miles de inscritos</h2>
        <div className="mt-5 w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth pb-3 [scroll-padding-inline:20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-[10px] px-5 md:mx-auto md:grid md:w-full md:max-w-[950px] md:grid-cols-3 md:gap-5 md:px-0">
            {landingImages.events.map((src, index) => <LandingImage key={src} src={src} alt={`Ejemplo de evento deportivo ${index + 1}`} className="h-[167px] w-[134px] shrink-0 snap-start rounded-[28px] object-cover md:h-[390px] md:w-full md:rounded-[36px]" />)}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-[75px] w-full max-w-[1180px] md:mt-36 md:px-8">
        <h2 className="mx-auto max-w-[940px] px-5 text-center text-[24px] font-semibold leading-[1.45] md:px-0 md:text-[44px] md:leading-[1.2]">
          <span>Crea, redacta y organiza tu evento con </span>
          <span className="text-[#c5e500]">Dalia</span>
          <span>, la inteligencia artificial de Dorsalia</span>
        </h2>
        <video
          className="mt-5 block h-auto w-full md:mt-10 md:rounded-[36px]"
          src="/landing/dalia-event-builder.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label="Creación de un evento deportivo con la inteligencia artificial Dalia"
        />
      </section>

      <section className="mx-auto mt-[75px] w-full max-w-[1180px] px-5 md:mt-36 md:px-8">
        <h2 className="mx-auto max-w-[900px] text-center text-[24px] font-semibold leading-[1.25] md:text-[44px] md:leading-[1.2]">
          Crea tu propia página web gratis
        </h2>
        <a
          href="https://micarrera2026.dorsalia.run/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block w-full overflow-hidden md:mt-10 md:rounded-[36px]"
          aria-label="Visitar la página de ejemplo Mi Carrera 2026"
        >
          <LandingImage
            src="/landing/pagina-hecha-con-dorsalia.png"
            alt="Ejemplo de una página web creada con Dorsalia"
            className="block h-auto w-full border-2 border-[#c5e500] object-contain md:rounded-[36px]"
          />
        </a>
      </section>

      <section className="mx-auto mt-[75px] grid w-full max-w-[1180px] gap-5 px-5 md:mt-36 md:grid-cols-2 md:items-center md:gap-20 md:px-8">
        <div>
          <h2 className="text-[24px] font-semibold leading-normal md:text-[42px] md:leading-[1.2]"><span className="text-white/50">Supera las </span><span>páginas genéricas</span></h2>
          <p className="mt-[5px] text-[16px] font-semibold leading-normal text-white/50 md:mt-5 md:max-w-[500px] md:text-[18px] md:leading-relaxed">Traza tu ruta en Dorsalia o impórtala fácilmente. La plataforma generará el mapa animado en automático.</p>
        </div>
        <LandingRouteExperience routes={exampleRoutes} />
      </section>

      <section className="mx-auto mt-[75px] w-full max-w-[1180px] px-5 md:mt-40 md:px-8">
        <h2 className="text-center text-[24px] font-semibold leading-[1.5] md:text-[42px] md:leading-[1.2]"><span className="text-[#c5e500]">Modalidades dinámicas</span><span className="text-white/50"> con </span><span>insignias personalizadas.</span></h2>
        <div className="mt-[10px] flex items-center justify-center gap-[22px] md:mt-10 md:gap-14">
          {landingImages.badges.map((src, index) => <LandingImage key={src} src={src} alt={`Insignia personalizada ${["3K", "5K", "10K"][index]}`} className="size-20 object-contain md:size-36" />)}
        </div>
      </section>

      <section className="mx-auto mt-[75px] grid w-full max-w-[1180px] gap-5 px-5 md:mt-36 md:grid-cols-2 md:items-center md:gap-20 md:px-8">
        <h2 className="text-center text-[24px] font-semibold leading-[1.25] md:text-left md:text-[42px] md:leading-[1.2]"><span className="text-white/50">Ofrece una </span><span>pasarela de pago rápida y segura</span><span className="text-white/50"> a tus atletas</span></h2>
        <div className="flex flex-col items-center gap-5">
          <LandingImage src="/landing/payment-mockup.png" alt="Pago seguro de una inscripción en Dorsalia" className="h-auto w-[239px] object-contain md:w-[390px]" />
          <div className="flex w-full items-center justify-center gap-3" aria-label="Métodos de pago aceptados">
            <span className="flex h-[31px] w-[78px] items-center justify-center"><LandingImage src="/landing/payment-logo-1.svg" alt="Método de pago" className="h-auto max-h-[25px] w-auto max-w-full" /></span>
            <span className="flex h-[31px] w-[78px] items-center justify-center"><LandingImage src="/landing/payment-logo-2.svg" alt="Método de pago" className="h-auto max-h-[25px] w-auto max-w-full" /></span>
            <span className="flex h-[31px] w-[78px] items-center justify-center"><LandingImage src="/landing/payment-logo-3.svg" alt="Método de pago" className="size-full object-contain" /></span>
            <span className="flex h-[31px] w-[56px] items-center justify-center"><LandingImage src="/landing/payment-logo-4.svg" alt="Método de pago" className="size-full object-contain" /></span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-[75px] w-full max-w-[1180px] md:mt-36 md:px-8">
        <h2 className="mx-auto max-w-[900px] px-5 text-center text-[24px] font-semibold leading-[1.25] md:px-0 md:text-[42px] md:leading-[1.2]">
          <span>Gestiona tus cobros y </span>
          <span className="text-white/50">monitorea tus </span>
          <span>transferencias </span>
          <span className="text-white/50">en tiempo real</span>
        </h2>
        <LandingImage src="/landing/wallet-digital.png" alt="Panel de cobros, retiros y transferencias de Dorsalia" className="mt-5 block h-auto w-full object-contain md:mx-auto md:mt-10 md:max-w-[980px]" />
        <p className="mx-auto mt-5 max-w-[920px] px-5 text-center text-[16px] font-semibold leading-[1.5] md:px-0 md:text-[20px] md:leading-[1.55]">
          <span>Monitorea las ventas </span><span className="text-white/50">de tus inscripciones, </span><span>consulta tu saldo </span><span className="text-white/50">acumulado y mantén el rastreo de tus </span><span>depósitos automáticos </span><span className="text-white/50">vía Stripe Connect con </span><span>total transparencia.</span>
        </p>
      </section>

      <section className="mx-auto mt-[75px] w-full max-w-[1180px] px-5 md:mt-36 md:px-8">
        <h2 className="mx-auto max-w-[900px] text-center text-[24px] font-semibold leading-[1.25] md:text-[42px] md:leading-[1.2]"><span className="text-white/50">Un solo </span><span className="text-[#cce40a]">panel de control</span><span className="text-white/50"> para administrar, operar y analizar </span><span>todos tus eventos</span></h2>
        <LandingImage src="/landing/dashboard.png" alt="Panel de control de Dorsalia" className="mt-5 w-full object-contain md:mx-auto md:mt-12 md:max-w-[1060px]" />
      </section>

      <section className="mt-[75px] pb-20 md:mt-36 md:pb-32">
        <div className="mx-auto max-w-[1440px] md:grid md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16">
          <div className="aspect-[406/163] w-full overflow-hidden md:aspect-[16/8]"><LandingImage src="/landing/no-fees.png" alt="Organiza tu evento sin costos fijos" className="size-full object-cover object-center" /></div>
          <div className="px-[22px] pt-5 md:px-8 md:pt-0">
            <h2 className="text-[24px] font-semibold leading-[1.25] text-white/50 md:text-[42px] md:leading-[1.2]"><span className="text-[#c5e500]">Sin costos fijos:</span><span> Crear tu cuenta y publicar tu evento es</span><span className="text-white"> 100% gratis ($0/mes).</span></h2>
            <div className="mt-8"><IniciarPortalCta href={PORTAL_URL} source="iniciar_sin_costos" /></div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-20 text-center md:py-32">
        <h2 className="mx-auto max-w-[800px] text-[26px] font-semibold leading-[1.2] md:text-[48px]">
          Organiza tu próximo evento con <span className="text-[#c5e500]">Dorsalia</span>
        </h2>
        <div className="mt-8 flex justify-center">
          <IniciarPortalCta href={PORTAL_URL} source="iniciar_cta_final" />
        </div>
      </section>

      <aside className="mx-auto max-w-[1180px] px-5 pb-12 text-center font-light leading-[1.5] text-white/50 md:px-8">
        <p className="text-[8px]">
          Dorsalia es una plataforma tecnológica y no organiza ni opera los eventos publicados. Cada organizador es responsable de permisos, seguridad, reglamentos, cancelaciones, reembolsos, entrega de kits y atención a participantes. En inscripciones de pago, el atleta cubre el precio base más los cargos por servicio vigentes; la comisión de Dorsalia es 5.7% más IVA y el procesamiento de Stripe se calcula por separado. Los sitios bajo *.dorsalia.run se ofrecen como alojamiento de la plataforma. El uso de Dorsalia implica la aceptación de nuestros{" "}
          <a href="/terminos" className="text-white underline underline-offset-2">términos y condiciones</a>,{" "}
          <a href="/privacidad" className="text-white underline underline-offset-2">aviso de privacidad</a> y{" "}
          <a href="/normas-comunidad" className="text-white underline underline-offset-2">normas de la comunidad</a>.
        </p>
      </aside>

      <footer className="border-t border-white/10 px-5 pb-10 pt-14 md:px-8 md:pb-14 md:pt-20">
        <div className="mx-auto max-w-[1180px]">
          <LandingImage src="/landing/dorsalia-run-logo.svg" alt="Dorsalia" className="h-auto w-[116px]" />
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3 md:gap-16">
            <div>
              <h2 className="text-[16px] font-semibold">Dorsalia</h2>
              <nav className="mt-4 flex flex-col gap-3 text-[16px] font-light text-white/50" aria-label="Dorsalia">
                <a href="/">Eventos</a>
                <a href={PORTAL_URL}>Crear tu evento</a>
                <a href="https://editor.dorsalia.run">Editor web</a>
              </nav>
            </div>
            <div>
              <h2 className="text-[16px] font-semibold">Legal</h2>
              <nav className="mt-4 flex flex-col gap-3 text-[16px] font-light text-white/50" aria-label="Legal">
                <a href="/terminos">Términos</a>
                <a href="/docs/comisiones">Comisiones</a>
                <a href="/privacidad">Privacidad</a>
                <a href="/cookies">Cookies</a>
                <a href="/normas-comunidad">Normas de la comunidad</a>
              </nav>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h2 className="text-[16px] font-semibold">Ayuda</h2>
              <nav className="mt-4 flex flex-col gap-3 text-[16px] font-light text-white/50" aria-label="Ayuda">
                <a href="mailto:hola@dorsalia.run">Contacto</a>
                <a href="https://portal.dorsalia.run">Portal del organizador</a>
              </nav>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3" aria-label="Redes sociales de Dorsalia">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex size-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
                <LandingImage src={social.src} alt="" className="size-5 object-contain" />
              </a>
            ))}
          </div>

          <p className="mt-12 text-[12px] font-light text-white/35">© {new Date().getFullYear()} Dorsalia Run. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
