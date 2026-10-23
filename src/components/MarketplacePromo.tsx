import Image from "next/image";
import Button from "@/components/ui/Button";
import { PORTAL_URL } from "@/lib/races";

const PROMO_ITEMS = [
  {
    src: "/images/promo/crea-carrera.jpg",
    alt: "Crea tu primera carrera gratis en Dorsalia",
    href: PORTAL_URL,
  },
  {
    src: "/images/promo/plataforma.png",
    alt: "Descubre la plataforma Dorsalia",
    href: PORTAL_URL,
  },
  {
    src: "/images/promo/proveedor.jpg",
    alt: "Sé proveedor oficial de Dorsalia",
    href: PORTAL_URL,
  },
] as const;

export default function MarketplacePromo() {
  return (
    <section className="border-t border-[var(--border)] bg-black">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-14 md:py-20">
        <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              Dorsalia
            </p>
            <h2 className="font-akira mt-2 text-2xl md:text-3xl text-white leading-[1.05]">
              Organiza, vende y gestiona tu evento
            </h2>
          </div>
          <Button variant="secondary" href={PORTAL_URL} className="hidden sm:inline-flex shrink-0">
            Ir al portal
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 lg:gap-8">
          {PROMO_ITEMS.map((item) => (
            <a
              key={item.src}
              href={item.href}
              className="group block overflow-hidden rounded-sm bg-[#141414] ring-1 ring-white/10 hover:ring-[var(--accent)]/60 transition-[box-shadow,transform] hover:-translate-y-0.5"
              rel="noopener noreferrer"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 md:mt-20 pt-14 md:pt-16 border-t border-white/10">
          <div className="grid gap-10 md:gap-12 items-center md:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                Panel de organizador
              </p>
              <h3 className="mt-3 font-akira text-2xl md:text-3xl text-white leading-[1.05]">
                Explora el administrador
              </h3>
              <p className="mt-4 text-sm md:text-[15px] text-white/65 leading-relaxed max-w-md">
                Inscripciones, mapas, cobros y analítica en un solo lugar. Todo lo que
                necesitas para organizar tu evento desde el primer día.
              </p>
              <Button variant="primary" href={PORTAL_URL} className="mt-8">
                Crear carrera gratis
              </Button>
            </div>
            <div className="relative w-full overflow-hidden rounded-lg ring-1 ring-white/10 bg-[#141414]">
              <Image
                src="/images/features/portal-dashboard.webp"
                alt="Vista del panel de administración de Dorsalia"
                width={1024}
                height={625}
                className="w-full h-auto"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
