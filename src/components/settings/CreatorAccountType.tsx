"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ProfileIdentity from "@/components/account/ProfileIdentity";
import SettingsSection from "@/components/settings/SettingsSection";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";
import { SettingsFieldsSkeleton } from "@/components/ui/Skeleton";

type Step = "account" | "intro" | "type" | "confirm" | "success";

export default function CreatorAccountType() {
  const router = useRouter();
  const { user, loading, profile } = useAthleteAuth();
  const [step, setStep] = useState<Step>("account");
  const [isCreator, setIsCreator] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/auth?next=/settings/account-type"); return; }
    let active = true;
    void createClient().from("creator_profiles").select("creator_type, is_active").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (active) { setIsCreator(data?.creator_type === "photographer" && data?.is_active === true); setReady(true); } });
    return () => { active = false; };
  }, [loading, user, router]);

  async function activate() {
    if (busy || !user) return;
    setBusy(true); setError("");
    const { error: activationError } = await createClient().rpc("activate_photographer_creator");
    if (activationError) { setError(activationError.message); setBusy(false); return; }
    setIsCreator(true); setStep("success"); setBusy(false);
    window.dispatchEvent(new Event("dorsalia:creator-updated"));
  }

  const goBack = () => { if (step === "account") router.push("/settings"); else if (step === "intro") setStep("account"); else if (step === "type") setStep("intro"); else if (step === "confirm") setStep("type"); else router.push("/settings"); };
  return <>
    <PageHeader title={step === "account" ? "Tipo de cuenta" : "Cuenta de creador"} onBack={goBack} sticky />
    <main className="mx-auto w-full max-w-[640px]">
      {!ready ? <SettingsFieldsSkeleton count={2} /> : null}
      {ready && step === "account" ? <div className="mt-10">
        <SettingsSection title="Tu cuenta" links={isCreator ? [
          { label: "Fotógrafo activo", icon: "account-type.svg", href: "/creator" },
          { label: "Panel creador", icon: "account-business.svg", href: "/creator" },
        ] : [{ label: "Cambiar a cuenta de creador", icon: "account-type.svg", onClick: () => setStep("intro") }]} />
        {!isCreator ? <button type="button" className="mt-4 text-[14px] text-white/50" onClick={() => setStep("intro")}>Es gratis. Conservarás tu perfil, seguidores, reseñas e historial.</button> : null}
      </div> : null}
      {ready && step === "intro" ? <div className="mt-10 pb-36">
        <ProfileIdentity avatarOnly displayName={profile.fullName} avatarUrl={profile.avatarUrl} coverSrc="" readOnly creatorType="photographer" />
        <h2 className="mx-auto mt-8 max-w-[280px] text-center text-[24px] font-bold leading-tight">Accede gratis para tener más herramientas</h2>
        <ul className="mt-8 space-y-6">
          <li className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/settings-icons/swich.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
            <p className="text-[16px] leading-6">Las cuentas de creador están hechas para interactuar de una manera diferente dentro de la plataforma.</p>
          </li>
          <li className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/settings-icons/arrow-up.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
            <p className="text-[16px] leading-6">Cambiar de cuenta hace que interactúes diferente con la plataforma.</p>
          </li>
        </ul>
        <button type="button" onClick={() => setStep("type")} className="fixed bottom-[70px] left-1/2 z-20 w-[min(640px,calc(100%-30px))] -translate-x-1/2 rounded-full bg-white px-4 py-4 text-[16px] font-bold text-[#0E0E0E]">Continuar</button>
      </div> : null}
      {ready && step === "type" ? <div className="mt-10">
        <SettingsSection title="¿Qué tipo de creador eres?" links={[
          { label: "Fotógrafo", icon: "account-type.svg", onClick: () => setStep("confirm") },
          { label: "Proveedor (Próximamente)", icon: "account-business.svg", disabled: true },
        ]} />
        <p className="mt-4 text-[14px] text-white/50">Publica galerías de eventos, muestra tu portafolio y consulta estadísticas.</p>
      </div> : null}
      {ready && step === "confirm" ? <div className="mt-10 pb-36 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/settings-icons/swich.svg" alt="" width={78} height={78} className="mx-auto h-[78px] w-[78px]" />
        <h2 className="mx-auto mt-8 max-w-[320px] text-[24px] font-bold leading-tight">Estás a punto de cambiar a una cuenta de creador</h2>
        <p className="mt-5 text-[15px] text-white/50">Activaremos las herramientas de fotógrafo en tu cuenta actual.</p>
        {error ? <p role="alert" className="mt-4 text-[#DE5757]">{error}</p> : null}
        <button type="button" disabled={busy} onClick={() => void activate()} className="fixed bottom-[70px] left-1/2 z-20 w-[min(640px,calc(100%-30px))] -translate-x-1/2 rounded-full bg-white px-4 py-4 text-[16px] font-bold text-[#0E0E0E] disabled:opacity-50">{busy ? "Activando…" : "Confirmar"}</button>
      </div> : null}
      {ready && step === "success" ? <div className="mt-10 pb-52 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/settings-icons/check-verde.svg" alt="" width={78} height={78} className="mx-auto h-[78px] w-[78px]" />
        <h2 className="mx-auto mt-8 text-[24px] font-bold leading-tight">¡Bienvenido!<br />Ya eres un creador en Dorsalia</h2>
        <div className="fixed bottom-[70px] left-1/2 z-20 flex w-[min(640px,calc(100%-30px))] -translate-x-1/2 flex-col gap-3">
          <Link href="/creator" style={{ color: "#0E0E0E" }} className="block rounded-full bg-white px-4 py-4 text-center text-[16px] font-bold">Ir al panel de creador</Link>
          <Link href="/settings" className="block rounded-full border border-white/20 px-4 py-4 text-center text-[16px] font-bold text-white">Salir</Link>
        </div>
      </div> : null}
    </main>
  </>;
}
