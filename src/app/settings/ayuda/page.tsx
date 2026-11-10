import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import PageHeader from "@/components/PageHeader";
import { APP_RELEASE, CONTACT_EMAIL } from "@/lib/release";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export const metadata: Metadata = { title: "Ayuda y soporte" };

export default function SettingsHelpPage() {
  return (
    <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-16 text-white`}>
      <PageHeader fallbackHref="/settings" title="Ayuda y soporte" sticky />
      <main className="mx-auto mt-10 w-full max-w-[640px]">
        <h2 className="text-[20px] font-semibold leading-6">Escríbenos</h2>
        <p className="mt-[10px] text-[16px] leading-6 text-white/50">Estamos en fase {APP_RELEASE}. Cuéntanos qué necesitas. Respondemos al mismo correo.</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="mt-[10px] flex h-11 items-center rounded-[20px] bg-[#191919] px-[15px] text-[16px]" style={{ color: "rgba(255,255,255,0.5)" }}>{CONTACT_EMAIL}</a>
      </main>
    </div>
  );
}
