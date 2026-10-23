import Image from "next/image";
import Button from "@/components/ui/Button";
import { PORTAL_URL } from "@/lib/races";

const EVENT_TYPES = [
  {
    label: "Running",
    desc: "5K, 10K, media y maratón",
    icon: (
      <path
        d="M7 20l3-6 4 2 5-9M5 12h4M15 8h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    label: "Trail",
    desc: "Montaña y terreno técnico",
    icon: (
      <path
        d="M4 18l6-12 4 8 3-5 7 9H4z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    label: "Triatlón",
    desc: "Natación, bici y carrera",
    icon: (
      <>
        <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path
          d="M12 17l3-6h5M5 17h14M9 11l3 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
  },
  {
    label: "Hyrox",
    desc: "Funcional + carrera",
    icon: (
      <path
        d="M6 18V8l4 4 4-4v10M16 8h4v10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
  {
    label: "Ciclismo",
    desc: "Ruta, gravel y MTB",
    icon: (
      <>
        <circle cx="7" cy="16" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <circle cx="17" cy="16" r="3" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path
          d="M10 16h4l2-6h3M10 16l2-6h4l1 6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
  },
  {
    label: "Obstáculos",
    desc: "Spartan, mud run y más",
    icon: (
      <path
        d="M5 18V10l4 3 4-6 4 6 3-3v8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    ),
  },
] as const;

const MEDALS = [
  { src: "/images/features/medal-3k.png", label: "3K", sub: "Caminata" },
  { src: "/images/features/medal-5k.png", label: "5K", sub: "Carrera" },
  { src: "/images/features/medal-10k.png", label: "10K", sub: "Desafío" },
] as const;

function GreenIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/30">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
        {children}
      </svg>
    </span>
  );
}

function FeatureBlock({
  eyebrow,
  title,
  body,
  children,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid gap-8 md:gap-12 items-center md:grid-cols-2 ${
        reverse ? "md:[&>div:first-child]:order-2" : ""
      }`}
    >
      <div>{children}</div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          {eyebrow}
        </p>
        <h3 className="mt-3 font-akira text-xl md:text-2xl text-white leading-[1.05]">
          {title}
        </h3>
        <p className="mt-3 text-sm md:text-[15px] text-white/65 leading-relaxed max-w-md">
          {body}
        </p>
      </div>
    </div>
  );
}

export default function MarketplaceAbout() {
  return (
    <section className="border-t border-[var(--border)] bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-14 md:py-20 space-y-16 md:space-y-24">
        {/* Qué es Dorsalia */}
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Qué es Dorsalia
          </p>
          <h2 className="mt-3 font-akira text-3xl md:text-4xl text-white leading-[1.05]">
            La plataforma para organizar y vender eventos deportivos
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/65 leading-relaxed">
            Dorsalia conecta organizadores con corredores: sitio web propio, inscripciones, pagos,
            folios, kits y comunicación — todo en un solo lugar.
          </p>
        </div>

        {/* Tipos de evento */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)] mb-6">
            Eventos que puedes organizar
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {EVENT_TYPES.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 hover:border-[var(--accent)]/40 transition-colors"
              >
                <GreenIcon>{item.icon}</GreenIcon>
                <div>
                  <p className="text-sm font-bold text-white">{item.label}</p>
                  <p className="mt-1 text-[11px] text-white/50 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modalidades + medallas */}
        <FeatureBlock
          eyebrow="Modalidades"
          title="Varias distancias, un solo evento"
          body="Configura 3K, 5K, 10K o las que necesites. Cada modalidad con su precio, medalla y cupo. Tus corredores eligen al inscribirse."
        >
          <div className="space-y-6">
            <div className="flex justify-center gap-4 sm:gap-8">
              {MEDALS.map((medal) => (
                <div key={medal.src} className="flex flex-col items-center gap-2">
                  <div className="relative w-[72px] sm:w-[88px] aspect-square">
                    <Image
                      src={medal.src}
                      alt={`Medalla ${medal.label}`}
                      fill
                      className="object-contain drop-shadow-lg"
                      sizes="88px"
                    />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                    {medal.label}
                  </p>
                  <p className="text-[10px] text-white/45">{medal.sub}</p>
                </div>
              ))}
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image
                src="/images/features/modalidades.png"
                alt="Vista de modalidades en Dorsalia"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </FeatureBlock>

        {/* Trazado de rutas */}
        <FeatureBlock
          eyebrow="Rutas"
          title="Trazado de rutas en el mapa"
          body="Dibuja el recorrido sobre el mapa: salida, meta, hidratación y puntos de control. Compártelo en el sitio del evento para que los corredores conozcan el terreno."
          reverse
        >
          <div className="relative aspect-[16/11] w-full overflow-hidden rounded-lg ring-1 ring-white/10">
            <Image
              src="/images/features/trazar-ruta.png"
              alt="Herramienta de trazado de rutas en Dorsalia"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </FeatureBlock>

        {/* CTA final */}
        <div className="rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-lg md:text-xl font-extrabold text-white tracking-tight">
              ¿Organizas carreras?
            </p>
            <p className="mt-2 text-sm text-white/60 max-w-lg">
              Crea tu evento gratis, publica tu sitio y empieza a vender inscripciones hoy.
            </p>
          </div>
          <Button variant="primary" href={PORTAL_URL} className="shrink-0">
            Crear mi evento
          </Button>
        </div>
      </div>
    </section>
  );
}
