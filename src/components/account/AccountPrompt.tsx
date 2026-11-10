"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Prompt = { action: string; next: string; intent?: string };

export function askForAccount(action: string, next?: string, intent?: string) {
  const destination = next || (typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`);
  window.dispatchEvent(new CustomEvent<Prompt>("dorsalia:account-required", { detail: { action, next: destination, intent } }));
}

export default function AccountPrompt() {
  const router = useRouter();
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  useEffect(() => {
    const onAsk = (event: Event) => {
      const detail = (event as CustomEvent<Prompt>).detail;
      if (detail?.action) setPrompt(detail);
    };
    window.addEventListener("dorsalia:account-required", onAsk);
    return () => window.removeEventListener("dorsalia:account-required", onAsk);
  }, []);

  useEffect(() => {
    if (!prompt) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setPrompt(null); };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [prompt]);

  if (!prompt) return null;
  const current = prompt;

  function continueToAccount() {
    const params = new URLSearchParams({ next: current.next });
    if (current.intent) params.set("intent", current.intent);
    setPrompt(null);
    router.push(`/auth?${params.toString()}`);
  }

  return (
    <div className="fixed inset-0 z-[240] flex items-end justify-center bg-black/55 px-4 pb-8 backdrop-blur-sm sm:items-center sm:pb-0" onClick={() => setPrompt(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="account-prompt-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-[420px] rounded-[28px] bg-[#070707] px-5 pb-5 pt-7 text-white" style={{ fontFamily: "Roboto, Arial, sans-serif" }}>
        <h2 id="account-prompt-title" className="text-[24px] font-semibold leading-tight">Crea una cuenta para {current.action}</h2>
        <p className="mt-3 text-[16px] leading-6 text-white/55">Es gratis. En el siguiente paso también puedes iniciar sesión si ya tienes cuenta.</p>
        <button type="button" onClick={continueToAccount} className="mt-8 h-[52px] w-full rounded-full bg-[#C5E500] text-[16px] font-bold text-[#070707]">Crear cuenta</button>
        <button type="button" onClick={() => setPrompt(null)} className="mt-2 h-11 w-full text-[15px] text-white/55">Ahora no</button>
      </section>
    </div>
  );
}
