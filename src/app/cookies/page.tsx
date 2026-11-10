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
        sitio. Abrir la ficha de un evento cuenta una visita, aunque no aceptes la analítica y
        aunque llegues desde Google. Solo si aceptas las cookies de analítica activamos Meta Pixel
        para medir páginas vistas e interacciones como pulsar botones para crear una cuenta o
        contactar. Puedes rechazarlo y seguir utilizando el sitio; en ese caso no cargamos ese
        píxel. Tu elección se guarda en tu navegador.
      </p>
    </div>
  );
}
