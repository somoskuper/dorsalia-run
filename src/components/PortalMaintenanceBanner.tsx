import Button from "@/components/ui/Button";
import { PORTAL_URL } from "@/lib/races";

/** Visible while portal.dorsalia.run is in maintenance (marketplace stays open). */
export default function PortalMaintenanceBanner() {
  return (
    <aside
      className="border-b border-[var(--accent)]/25 bg-[linear-gradient(90deg,rgba(197,229,0,0.12),rgba(10,10,10,0.95)_55%)]"
      aria-label="Aviso de mantenimiento del portal"
    >
      <div className="mx-auto max-w-6xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
            Portal en mantenimiento
          </p>
          <p className="mt-1.5 text-sm md:text-[15px] text-white/90 leading-snug font-semibold">
            La gestión de organizadores se está migrando a{" "}
            <span className="text-[var(--accent)]">portal.dorsalia.run</span>
          </p>
          <p className="mt-1 text-xs md:text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
            Ahí vivirá toda la operación: inscripciones, kits, folios y pagos. Regresamos el{" "}
            <strong className="text-white/80 font-semibold">1 de septiembre de 2026 a las 7:00&nbsp;pm</strong>.
            Este marketplace sigue abierto con normalidad.
          </p>
        </div>
        <Button variant="primary" href={PORTAL_URL} className="shrink-0">
          Ir al portal →
        </Button>
      </div>
    </aside>
  );
}
