import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import PageHeader from "@/components/PageHeader";
import SettingsProfileHeader from "@/components/settings/SettingsProfileHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsSignOut from "@/components/settings/SettingsSignOut";
import CreatorAccountToolsSection from "@/components/settings/CreatorAccountToolsSection";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export const metadata: Metadata = { title: "Configuración" };

const settings = [
  { label: "Editar perfil", icon: "edit.svg", href: "/settings/edit-profile" },
  { label: "Reseñas y Ratings", icon: "reseñas.svg", href: "/mis-resenas" },
  { label: "Guardados y colecciones", icon: "guardados.svg", href: "/cuenta?tab=guardados" },
  { label: "Medallas y logros", icon: "medallas.svg", href: "/cuenta?tab=perfil&section=medallas" },
  { label: "Beneficios y cupones", icon: "cupones.svg", href: "/cuenta?tab=historial" },
] as const;

const purchaseSettings = [
  { label: "Mis compras", icon: "Money-2.svg" },
  { label: "Mis inscripciones", icon: "ticket-expired.svg" },
  { label: "Método de pago", icon: "Money-1.svg" },
  { label: "Facturación y comprobantes", icon: "Money.svg" },
  { label: "Reembolsos y cancelaciones", icon: "refresh-square-2.svg" },
] as const;

const communitySettings = [
  { label: "Clubes y grupos", icon: "community-users.svg" },
  { label: "Seguidores y seguidos", icon: "community-users.svg" },
  { label: "Interacciones", icon: "community-heart.svg" },
] as const;

const preferenceSettings = [
  { label: "Deportes e intereses", icon: "swimming.svg" },
  { label: "Notificaciones", icon: "Notifications.svg" },
] as const;

const privacySettings = [
  { label: "Privacidad del perfil", icon: "privacy-security.svg" },
  { label: "Cuentas bloqueadas", icon: "privacy-blocked.svg" },
  { label: "Contraseña y seguridad", icon: "privacy-password.svg" },
  { label: "Sesiones y dispositivos", icon: "privacy-devices.svg" },
] as const;

const helpSettings = [
  { label: "Ayuda y soporte", icon: "info-help.svg" },
  { label: "Gestión de datos", icon: "info-data.svg" },
  { label: "Información legal", icon: "info-legal.svg" },
] as const;

export default function SettingsPage() {
  return (
    <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-20 text-white`}>
      <PageHeader fallbackHref="/" title="Configuración" sticky />
      <main className="mx-auto w-full max-w-[640px]">
        <SettingsProfileHeader />
        <SettingsSection title="Tu perfil y actividad" links={settings} />
        <div className="mt-[30px]">
          <SettingsSection title="Compras e inscripciones" links={purchaseSettings} />
        </div>
        <div className="mt-[30px]">
          <SettingsSection title="Comunidad" links={communitySettings} />
        </div>
        <div className="mt-[30px]">
          <SettingsSection title="Preferencias" links={preferenceSettings} />
        </div>
        <div className="mt-[30px]">
          <SettingsSection title="Privacidad y seguridad" links={privacySettings} />
        </div>
        <div className="mt-[30px]">
          <CreatorAccountToolsSection />
        </div>
        <div className="mt-[30px]">
          <SettingsSection title="Ayuda e información" links={helpSettings} />
        </div>
        <SettingsSignOut />
      </main>
    </div>
  );
}
