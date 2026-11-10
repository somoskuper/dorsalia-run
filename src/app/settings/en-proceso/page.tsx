import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export const metadata: Metadata = { title: "Estamos trabajando en ello" };

export default function SettingsInProgressPage() {
  return (
    <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-16 text-white`}>
      <PageHeader fallbackHref="/settings" title="En proceso" sticky />
      <main className="mx-auto mt-10 w-full max-w-[640px]">
        <h2 className="text-[20px] font-semibold leading-6">Estamos trabajando en ello</h2>
        <p className="mt-[10px] text-[16px] leading-6 text-white/50">Esta opción todavía no está disponible. Puedes volver a configuración y usar el resto de tu cuenta.</p>
        <Link href="/settings" className="mt-[30px] inline-flex h-[52px] items-center rounded-full bg-[#C5E500] px-6 text-[16px] font-bold" style={{ color: "#070707" }}>Volver a configuración</Link>
      </main>
    </div>
  );
}
