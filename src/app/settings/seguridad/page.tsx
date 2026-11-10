import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import PasswordSecurity from "@/components/settings/PasswordSecurity";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export const metadata: Metadata = { title: "Contraseña y seguridad" };

export default function PasswordSecurityPage() {
  return <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-20 text-white`}><PasswordSecurity /></div>;
}
