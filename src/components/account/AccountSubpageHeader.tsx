"use client";

import GlassIconButton from "@/components/account/GlassIconButton";
import { useAnimatedNavigate } from "@/lib/useAnimatedNavigate";

const ICON_BACK = "/assetsdev/Chevron_Right.svg";

type Props = {
  title: string;
  backHref?: string;
  onBack?: () => void;
};

/** Shared header for Guardados / Mis compras / Resumen — matches profile chrome padding. */
export default function AccountSubpageHeader({
  title,
  backHref = "/cuenta?tab=perfil",
  onBack,
}: Props) {
  const { exiting, navigate } = useAnimatedNavigate();

  return (
    <div
      className={exiting ? "mp-page-exit-back" : undefined}
      style={{ paddingTop: 15, paddingLeft: 20, paddingRight: 20 }}
    >
      <GlassIconButton
        aria-label="Volver"
        onClick={() => {
          if (onBack) onBack();
          else if (backHref) navigate(backHref);
          else navigate("/");
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ICON_BACK} alt="" width={24} height={24} />
      </GlassIconButton>
      <h1
        className="font-akira text-[28px] leading-[1.05] text-white"
        style={{ marginTop: 20 }}
      >
        {title}
      </h1>
    </div>
  );
}
