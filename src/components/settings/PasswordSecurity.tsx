"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { SettingsFieldsSkeleton } from "@/components/ui/Skeleton";
import { linkGoogleAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

const fieldClass = "mt-[10px] h-11 w-full rounded-[20px] bg-[#191919] px-[15px] text-[16px] text-white outline-none placeholder:text-white/50";

function passwordProblem(password: string, repeat: string) {
  if (password.length < 8) return "Usa al menos 8 caracteres.";
  if (password !== repeat) return "Las contraseñas no coinciden.";
  if (password === "56484") return "Elige una contraseña distinta a la temporal.";
  return "";
}

function googleAccount(user: User | null) {
  const identity = user?.identities?.find((item) => item.provider === "google");
  if (!identity) return null;
  const email = identity.identity_data && typeof identity.identity_data.email === "string" ? identity.identity_data.email : "";
  return { email };
}

function googleLinkMessage(err: unknown) {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  if (message.includes("manual linking")) return "Enlazar cuentas todavía no está habilitado. Avísanos para activarlo.";
  if (message.includes("already")) return "Esa cuenta de Google ya está vinculada a otra persona.";
  return "No pudimos enlazar Google. Inténtalo de nuevo.";
}

function passwordChangeMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("different")) return "Elige una contraseña distinta a la actual.";
  if (lower.includes("at least") || lower.includes("weak") || lower.includes("short")) return "La contraseña no cumple las reglas de la cuenta.";
  if (lower.includes("nonce") || lower.includes("reauthentication")) return "Pide un código nuevo e inténtalo otra vez.";
  if (lower.includes("session")) return "Tu sesión venció. Entra de nuevo.";
  return "No pudimos cambiar la contraseña. Inténtalo de nuevo.";
}

export default function PasswordSecurity() {
  const router = useRouter();
  const { user, loading, refresh } = useAthleteAuth();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth?next=/settings/seguridad");
  }, [loading, user, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") !== "vinculo") return;
    setError("No pudimos enlazar Google. Si ese correo ya pertenece a otra cuenta, entra con ella.");
    params.delete("error");
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
  }, []);

  useEffect(() => {
    if (retryAt <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [retryAt]);

  const wait = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const google = googleAccount(user);
  const problem = passwordProblem(password, repeat);
  const canConfirm = codeSent && code.length === 6 && !problem && !busy;

  async function sendCode() {
    const invalid = passwordProblem(password, repeat);
    if (invalid) { setError(invalid); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/password-code", { method: "POST" });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || "No pudimos enviar el código.");
      setCode("");
      setCodeSent(true);
      setRetryAt(Date.now() + 60_000);
      setNotice(`Enviamos un código a ${user?.email || "tu correo"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el código.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    const invalid = passwordProblem(password, repeat);
    if (invalid) { setError(invalid); return; }
    if (!/^\d{6}$/.test(code)) { setError("Escribe el código de 6 dígitos."); return; }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/password-code/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        const message = body?.error || "El código no es válido.";
        if (message.includes("venció") || message.includes("ya no es válido")) { setCode(""); setCodeSent(false); }
        throw new Error(message);
      }
      setCode("");
      setCodeSent(false);
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(passwordChangeMessage(updateError.message));
      const done = await supabase.rpc("athlete_complete_password_setup");
      if (done.error) throw new Error(done.error.message);
      await supabase.auth.refreshSession();
      await refresh();
      setPassword("");
      setRepeat("");
      setCode("");
      setCodeSent(false);
      setNotice("Tu contraseña ya quedó actualizada.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos cambiar la contraseña.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (codeSent) await confirm();
    else await sendCode();
  }

  async function onGoogle() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error: linkError } = await linkGoogleAccount();
      if (linkError) throw linkError;
    } catch (err) {
      setError(googleLinkMessage(err));
      setBusy(false);
    }
  }

  return <>
    <PageHeader fallbackHref="/settings" title="Contraseña y seguridad" saveFormId={codeSent ? "password-security-form" : undefined} saveDisabled={!canConfirm} sticky />
    <main className="mx-auto mt-10 w-full max-w-[640px]">
      {loading || !user ? <SettingsFieldsSkeleton count={3} /> : <>
        <section aria-label="Correo">
          <h2 className="text-[20px] font-semibold leading-6">Correo</h2>
          <p className="mt-[10px] flex h-11 items-center rounded-[20px] bg-[#191919] px-[15px] text-[16px] text-white/50">{user.email}</p>
        </section>

        <form id="password-security-form" onSubmit={(event) => void onSubmit(event)} className="mt-[30px]">
          <h2 className="text-[20px] font-semibold leading-6">Contraseña</h2>
          <p className="mt-[10px] text-[16px] leading-6 text-white/50">{user.identities?.some((item) => item.provider === "email") ? "Para cambiarla, confirma el código que te enviamos por correo." : "Puedes crear una contraseña para entrar también con tu correo. Te pedimos un código para confirmarlo."}</p>
          <label className="mt-[30px] block text-[20px] font-semibold leading-6">Nueva contraseña
            <input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={fieldClass} />
          </label>
          <label className="mt-[30px] block text-[20px] font-semibold leading-6">Confirmar contraseña
            <input required type="password" autoComplete="new-password" minLength={8} value={repeat} onChange={(event) => setRepeat(event.target.value)} className={fieldClass} />
          </label>
          {codeSent ? <label className="mt-[30px] block text-[20px] font-semibold leading-6">Código de verificación
            <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className={`${fieldClass} tracking-[0.3em]`} />
          </label> : null}
          {notice ? <p aria-live="polite" className="mt-[15px] text-[14px] text-[#C5E500]">{notice}</p> : null}
          {error ? <p role="alert" className="mt-[15px] text-[14px] text-[#DE5757]">{error}</p> : null}
          <button type="submit" disabled={busy || (codeSent && !canConfirm)} className="mt-[30px] inline-flex h-[52px] items-center rounded-full bg-[#C5E500] px-6 text-[16px] font-bold disabled:opacity-50" style={{ color: "#070707" }}>{busy ? "Espera…" : codeSent ? "Confirmar cambio" : "Enviar código"}</button>
          {codeSent ? <button type="button" disabled={busy || wait > 0} onClick={() => void sendCode()} className="mt-4 block text-[14px] text-white/70 disabled:text-white/30">{wait > 0 ? `Reenviar código (${wait}s)` : "Reenviar código"}</button> : null}
          <p className="mt-[15px] text-[14px] leading-5 text-white/50">El código llega con Resend y caduca en 10 minutos.</p>
        </form>

        <section aria-label="Google" className="mt-[30px]">
          <h2 className="text-[20px] font-semibold leading-6">Google</h2>
          {google ? <p className="mt-[10px] flex h-11 items-center gap-[10px] rounded-[20px] bg-[#191919] px-[15px] text-[16px] text-white/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/auth-media/google.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
            <span className="min-w-0 truncate">Vinculada{google.email ? ` · ${google.email}` : ""}</span>
          </p> : <button type="button" disabled={busy} onClick={() => void onGoogle()} className="mt-[10px] flex h-11 w-full items-center justify-between rounded-[20px] bg-[#191919] pl-[15px] pr-[10px] text-left text-[16px] disabled:opacity-50">
            <span className="flex min-w-0 items-center gap-[10px]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/auth-media/google.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />Enlazar cuenta de Google</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/settings-icons/Chevron_Right.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
          </button>}
          <p className="mt-[15px] text-[14px] leading-5 text-white/50">Enlaza Google para entrar con esa cuenta sin dejar de usar tu correo.</p>
        </section>
      </>}
    </main>
  </>;
}
