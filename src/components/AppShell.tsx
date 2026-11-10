"use client";

import { Suspense, type ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AppNav from "@/components/AppNav";
import MarketplaceNavbar from "@/components/MarketplaceNavbar";
import SiteFooter from "@/components/SiteFooter";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import ActivityComposer from "@/components/activity/ActivityComposer";
import CommentSheetHost from "@/components/activity/CommentSheetHost";
import AccountPrompt from "@/components/account/AccountPrompt";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAthleteAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname === "/auth") return <main>{children}</main>;

  const loggedIn = mounted && !loading && !!user;
  const isAccount = pathname.startsWith("/cuenta") || pathname.startsWith("/miscompras");
  const isCouponDetail = /^\/(?:cuenta|miscompras)\/cupones\/[^/]+/.test(pathname);
  const isSettings = pathname === "/settings" || pathname.startsWith("/settings/");
  const isCreatorSurface = pathname === "/creator" || pathname.startsWith("/creator/") || pathname.startsWith("/fotos/");
  const isPost = pathname.startsWith("/post/");
  const isLanding = pathname.startsWith("/iniciar");
  const isSearch = pathname.startsWith("/buscar");
  const isFollowers = pathname.startsWith("/seguidores/");
  const isPublicProfile = pathname.startsWith("/perfil/") || pathname.startsWith("/org/");

  return (
    <>
      {!isLanding && !isPublicProfile && !isSearch && !isFollowers && !isCouponDetail && !isSettings && !isCreatorSurface && !isPost ? (
        <Suspense fallback={null}>
          <AppNav />
        </Suspense>
      ) : null}
      {!isSettings && !isPublicProfile && !isCreatorSurface && !isPost ? <Suspense fallback={isAccount ? null : <div className="h-[65px] bg-[#070707] lg:h-[63px]" />}>
        <MarketplaceNavbar />
      </Suspense> : null}
      <div
        className={
          isCouponDetail || isSettings || isCreatorSurface || isPost
            ? undefined
            :
          isLanding
            ? loggedIn
              ? "lg:pt-[63px]"
              : undefined
            : isSearch || isFollowers
            ? loggedIn ? "lg:pt-[63px]" : undefined
            : loggedIn
            ? isAccount
              ? "pb-[78px] lg:pb-0 lg:pt-[63px]"
              : "pb-[78px] lg:pb-0 lg:pt-[63px]"
            : undefined
        }
      >
        <main>{children}</main>
        {!isAccount && !isLanding && !isPublicProfile && !isSearch && !isFollowers && !isSettings && !isCreatorSurface && !isPost ? <SiteFooter glass={pathname === "/review"} /> : null}
      </div>
      <ActivityComposer />
      <CommentSheetHost />
      <AccountPrompt />
    </>
  );
}
