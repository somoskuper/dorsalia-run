import Link from "next/link";
import { PORTAL_URL } from "@/lib/races";

const year = new Date().getFullYear();

export default function SiteFooter({ glass = false }: { glass?: boolean }) {
  return (
    <footer className={glass ? "relative z-10 border-t border-white/15 bg-white/[0.07] backdrop-blur-xl" : "relative z-10 border-t border-[var(--border)] bg-[#070707]"}>
      <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <p className="text-[var(--accent)] text-lg font-akira">Contacto</p>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            Marketplace de carreras Dorsalia
            <br />
            México
          </p>
        </div>
        <div>
          <p className="text-[var(--accent)] text-lg font-akira">Sitio web</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--muted)]">
            <Link href="/" className="hover:text-white transition-colors">
              Todas las carreras
            </Link>
            <Link href="/?status=active" className="hover:text-white transition-colors">
              Activas
            </Link>
            <Link href="/?status=inactive" className="hover:text-white transition-colors">
              Inactivas / pasadas
            </Link>
            <Link href="/iniciar" className="hover:text-white transition-colors">
              Organiza tu evento con Dorsalia
            </Link>
            <Link href="/docs/comisiones" className="hover:text-white transition-colors">
              Comisiones y cargos
            </Link>
            <a
              href={PORTAL_URL}
              className="hover:text-white transition-colors"
              rel="noopener noreferrer"
            >
              Organizador ↗
            </a>
          </div>
        </div>
        <div>
          <p className="text-[var(--accent)] text-lg font-akira">Dorsalia</p>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            portal.dorsalia.run, editor.dorsalia.run y dorsalia.run son operados por Dorsalia en
            México. Los sitios *.dorsalia.run son propiedad de la plataforma (préstamo de hosting al
            organizador). Todos los derechos reservados.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-5 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-[var(--muted)]">
          <span>
            Índice oficial ·{" "}
            <a href={PORTAL_URL} className="hover:text-white" rel="noopener noreferrer">
              Dorsalia
            </a>
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <a href="/sitemap.xml" className="hover:text-white" target="_blank" rel="noopener noreferrer">
              Sitemap
            </a>
            <a href="/llms.txt" className="hover:text-white" target="_blank" rel="noopener noreferrer">
              LLMs
            </a>
            <Link href="/privacidad" className="hover:text-white">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-white">
              Términos
            </Link>
            <Link href="/indexacion" className="hover:text-white">
              Indexación
            </Link>
            <Link href="/docs/comisiones" className="hover:text-white">
              Comisiones
            </Link>
            <Link href="/iniciar" className="hover:text-white">
              Para organizadores
            </Link>
            <Link href="/normas-comunidad" className="hover:text-white/60 text-[11px]">
              Normas
            </Link>
            <span>© {year} Dorsalia · México · Derechos reservados</span>
            <p className="basis-full text-center text-[10px] leading-relaxed text-[var(--muted)]">
              Dorsalia.run es una plataforma tecnológica desarrollada en México para la gestión, boletaje y publicación de eventos deportivos. No mantenemos relación ni afiliación con fabricantes de insumos físicos o empresas de imprenta internacionales.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
