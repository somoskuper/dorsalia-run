"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SettingsSection from "@/components/settings/SettingsSection";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { createClient } from "@/lib/supabase/client";

type Step = "account" | "intro" | "type" | "confirm" | "success";

export default function CreatorAccountType() {
  const router = useRouter();
  const { user, loading } = useAthleteAuth();
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
      {!ready ? <p className="mt-10 text-white/50">Cargando cuenta…</p> : null}
      {ready && step === "account" ? <div className="mt-10">
        <SettingsSection title="Tu cuenta" links={isCreator ? [
          { label: "Fotógrafo activo", icon: "account-type.svg", href: "/creator" },
          { label: "Panel creador", icon: "account-business.svg", href: "/creator" },
        ] : [{ label: "Cambiar a cuenta de creador", icon: "account-type.svg", onClick: () => setStep("intro") }]} />
        {!isCreator ? <button type="button" className="mt-4 text-[14px] text-white/50" onClick={() => setStep("intro")}>Es gratis. Conservarás tu perfil, seguidores, reseñas e historial.</button> : null}
      </div> : null}
      {ready && step === "intro" ? <div className="mt-10 flex min-h-[65dvh] flex-col justify-between">
        <div><div className="mx-auto grid h-36 w-36 place-items-center rounded-[44px] border-4 border-[#C5E500] text-[70px]">✦</div>
          <h2 className="mt-8 text-center text-[24px] font-semibold">Accede gratis a más herramientas</h2>
          <p className="mt-6 text-[16px] leading-6 text-white/60">Convierte tu cuenta en un espacio para compartir tu trabajo, publicar contenido de eventos y conocer el alcance de tus publicaciones.</p>
          <p className="mt-4 text-[16px] leading-6 text-white/60">Tu cuenta, seguidores, reseñas, calificaciones e historial permanecen intactos.</p></div>
        <button type="button" onClick={() => setStep("type")} className="mt-10 w-full rounded-full bg-white px-4 py-4 text-[16px] font-bold text-[#0E0E0E]">Continuar</button>
      </div> : null}
      {ready && step === "type" ? <div className="mt-10"><h2 className="text-[20px] font-semibold">¿Qué tipo de creador eres?</h2>
        <div className="mt-[10px] rounded-[20px] bg-[#191919] px-[15px] py-[15px]">
          <button type="button" onClick={() => setStep("confirm")} className="flex w-full items-center justify-between py-1 text-left text-[16px]">Fotógrafo <span className="text-white/50">›</span></button>
          <div className="mt-4 flex items-center justify-between py-1 text-[16px] text-white/40" aria-disabled="true">Proveedor (Próximamente)</div>
        </div>
        <p className="mt-4 text-[14px] text-white/50">Publica galerías de eventos, muestra tu portafolio y consulta estadísticas.</p>
      </div> : null}
      {ready && step === "confirm" ? <div className="mt-12 flex min-h-[65dvh] flex-col justify-between text-center">
        <div><div className="mx-auto grid h-20 w-20 place-items-center rounded-[20px] bg-white text-5xl text-black">↻</div>
          <h2 className="mt-10 text-[24px] font-semibold">Estás a punto de cambiar a una cuenta de creador</h2>
          <p className="mt-5 text-[15px] text-white/50">Activaremos las herramientas de fotógrafo en tu cuenta actual.</p></div>
        <div>{error ? <p role="alert" className="mb-3 text-[#DE5757]">{error}</p> : null}<button type="button" disabled={busy} onClick={() => void activate()} className="w-full rounded-full bg-white px-4 py-4 text-[16px] font-bold text-black disabled:opacity-50">{busy ? "Activando…" : "Confirmar"}</button></div>
      </div> : null}
      {ready && step === "success" ? <div className="mt-12 flex min-h-[65dvh] flex-col justify-between text-center">
        <div><div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#C5E500] text-5xl text-black">✓</div>
          <h2 className="mt-8 text-[24px] font-semibold">¡Bienvenido!<br />Ya eres un creador en Dorsalia</h2></div>
        <div className="space-y-3"><Link href="/creator" className="block rounded-full bg-white px-4 py-4 font-bold text-black">Ir al panel de creador</Link><Link href="/settings" className="block rounded-full border border-white/20 px-4 py-4 font-bold">Salir</Link></div>
      </div> : null}
    </main>
  </>;
}
