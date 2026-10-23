"use client";

import { Suspense, type ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppNav from "@/components/AppNav";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import SiteFooter from "@/components/SiteFooter";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import ActivityComposer from "@/components/activity/ActivityComposer";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAthleteAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loggedIn = mounted && !loading && !!user;
  const isAccount = pathname.startsWith("/cuenta");
  const isLanding = pathname.startsWith("/iniciar");
  const isSearch = pathname.startsWith("/buscar");
  const isFollowers = pathname.startsWith("/seguidores/");
  const isPublicProfile = pathname.startsWith("/perfil/") || pathname.startsWith("/org/");

  return (
    <>
      {!isLanding && !isPublicProfile && !isSearch && !isFollowers ? (
        <Suspense fallback={null}>
          <AppNav />
        </Suspense>
      ) : null}
      {!isPublicProfile && !isSearch && !isFollowers ? (
        <Suspense
          fallback={isAccount ? null : <div className="h-[65px] bg-[#070707] md:h-[63px]" />}
        >
          <MarketplaceNavbar />
        </Suspense>
      ) : null}
      <div
        className={
          isLanding
            ? loggedIn
              ? "md:pt-[63px]"
              : undefined
            : isPublicProfile || isSearch || isFollowers
            ? undefined
            : loggedIn
            ? isAccount
              ? "pb-[78px] md:pb-0 md:pl-[63px]"
              : "pb-[78px] md:pb-0 md:pl-[63px] md:pt-[63px]"
            : undefined
        }
      >
        <main>{children}</main>
        {!isAccount && !isLanding && !isPublicProfile && !isSearch && !isFollowers ? <SiteFooter /> : null}
      </div>
      <ActivityComposer />
    </>
  );
}
