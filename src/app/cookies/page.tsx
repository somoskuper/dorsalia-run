import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Información sobre el uso de cookies técnicas y Meta Pixel, sujeto a consentimiento, en Dorsalia.",
  alternates: { canonical: "https://dorsalia.run/cookies" },
};

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 prose prose-invert">
      <h1 className="text-3xl font-extrabold">Política de Cookies</h1>
      <p className="mt-4 text-[var(--muted)] leading-relaxed">
        Este marketplace de Dorsalia usa cookies técnicas necesarias para el funcionamiento del
        sitio. Solo si aceptas las cookies de analítica, activamos el píxel nativo de Kuper para
        medir las visitas y el uso de las páginas del dominio principal dorsalia.run. La misma
        elección permite Meta Pixel para medir páginas vistas, visitas a fichas de eventos e
        interacciones como pulsar botones para crear una cuenta o contactar. Puedes rechazarlo y seguir utilizando el sitio; en ese caso
        no cargamos estos píxeles. Tu elección se guarda en tu navegador.
      </p>
    </div>
  );
}
