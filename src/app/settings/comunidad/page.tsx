"use client";

import { Roboto } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { SettingsFieldsSkeleton } from "@/components/ui/Skeleton";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "600"], display: "swap" });

export default function SettingsCommunityPage() {
  const { user, loading } = useAthleteAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?next=/settings/comunidad");
  }, [loading, user, router]);

  const links = user ? [
    { label: "Seguidores", icon: "community-users.svg", href: `/seguidores/${user.id}?vista=followers` },
    { label: "Siguiendo", icon: "community-users.svg", href: `/seguidores/${user.id}?vista=following` },
  ] : [];

  return (
    <div className={`${roboto.className} min-h-screen bg-[#070707] px-[15px] pb-16 text-white`}>
      <PageHeader fallbackHref="/settings" title="Seguidores y seguidos" sticky />
      <main className="mx-auto mt-10 w-full max-w-[640px]">
        {loading || !user ? <SettingsFieldsSkeleton count={2} /> : (
          <>
            <p className="text-[16px] leading-6 text-white/50">Las personas que te siguen y a las que sigues.</p>
            <div className="mt-[30px]">
              <SettingsSection title="Tu comunidad" links={links} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
