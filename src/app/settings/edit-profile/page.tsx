import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import PageHeader from "@/components/PageHeader";
import EditProfileSettings from "@/components/settings/EditProfileSettings";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });
export const metadata: Metadata = { title: "Editar perfil" };

export default function EditProfilePage() {
  return (
    <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-20 text-white`}>
      <PageHeader fallbackHref="/settings" title="Editar perfil" sticky />
      <main className="mx-auto mt-[50px] w-full max-w-[640px]"><EditProfileSettings /></main>
    </div>
  );
}
