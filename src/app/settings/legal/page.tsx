import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import PageHeader from "@/components/PageHeader";
import SettingsSection from "@/components/settings/SettingsSection";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export const metadata: Metadata = { title: "Información legal" };

const links = [
  { label: "Aviso de privacidad", icon: "info-legal.svg", href: "/privacidad" },
  { label: "Términos", icon: "info-legal.svg", href: "/terminos" },
  { label: "Normas de la comunidad", icon: "info-legal.svg", href: "/normas-comunidad" },
  { label: "Cookies", icon: "info-legal.svg", href: "/cookies" },
] as const;

export default function SettingsLegalPage() {
  return (
    <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-16 text-white`}>
      <PageHeader fallbackHref="/settings" title="Información legal" sticky />
      <main className="mx-auto mt-10 w-full max-w-[640px]">
        <p className="text-[16px] leading-6 text-white/50">Documentos que explican cómo funciona Dorsalia y cómo tratamos tus datos.</p>
        <div className="mt-[30px]">
          <SettingsSection title="Documentos" links={links} />
        </div>
      </main>
    </div>
  );
}
