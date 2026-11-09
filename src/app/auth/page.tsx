"use client";

import { Suspense, useEffect, useState } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail, signInWithGoogle, signUpAthlete } from "@/lib/auth";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import Button from "@/components/ui/Button";
import "./auth.css";
import { createClient } from "@/lib/supabase/client";
import { navigateAfterAuth, resolvePostAuthNext } from "@/lib/safeAuthNext";
import { trackMetaCreateAccount } from "@/components/IniciarMetaPixel";

type Mode = "welcome" | "login" | "register" | "recover" | "reset";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = resolvePostAuthNext(params.get("next"));
  const reviewIntent = params.get("intent") === "review";
  const requestedMode = params.get("mode");
  const [mode, setMode] = useState<Mode>(requestedMode === "login" || requestedMode === "register" || requestedMode === "reset" ? requestedMode : requestedMode === "folio" ? "login" : "welcome");
  const [canReset, setCanReset] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(params.has("error") ? "No pudimos completar el acceso. Inténtalo de nuevo." : null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  function selectMode(nextMode: Mode) {
    setError(null);
    setSuccess(null);
    setPassword("");
    setPin("");
    setPendingEmail(null);
    setMode(nextMode);
  }

  useEffect(() => {
    const supabase = createClient();
    if (requestedMode === "reset") {
      void supabase.auth.getUser().then(({ data }) => {
        setCanReset(!!data.user);
        if (!data.user) setError("El enlace no es válido o ya venció. Solicita uno nuevo.");
      });
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
      if (data.session.user.user_metadata?.folio_activation_pending) { router.replace("/activar-inscripcion"); return; }
      const { data: prof } = await supabase
        .from("athlete_profiles")
        .select("username, first_name, last_name, phone")
        .eq("user_id", data.session.user.id)
        .maybeSingle();
      if (!isAthleteOnboarded(data.session.user.user_metadata, prof)) {
        router.replace(`/onboarding?${reviewIntent ? "intent=review&" : ""}next=${encodeURIComponent(next)}`);
        return;
      }
      navigateAfterAuth(next, (href) => router.replace(href));
    });
  }, [router, next, reviewIntent, requestedMode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "login") {
        if (/^CRD-[A-Z0-9]{6}$/i.test(email.trim())) {
          const { data, error } = await createClient().rpc("athlete_folio_begin", { p_folio: email.trim().toUpperCase(), p_pin: password });
          if (error) throw new Error("No pudimos iniciar el acceso por folio. Intenta nuevamente.");
          if (data?.error || !data?.ticket) throw new Error(data?.error || "Folio o PIN incorrectos.");
          sessionStorage.setItem("dorsalia-folio-activation", data.ticket);
          router.replace("/activar-inscripcion");
          return;
        }
        const { error: err } = await signInWithEmail(email.trim(), password);
        if (err) throw err;
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.user_metadata?.folio_activation_pending) { router.replace("/activar-inscripcion"); return; }
        if (user) {
          const { data: prof } = await supabase
            .from("athlete_profiles")
            .select("username, first_name, last_name, phone")
            .eq("user_id", user.id)
            .maybeSingle();
          if (!isAthleteOnboarded(user.user_metadata, prof)) {
            router.replace(`/onboarding?${reviewIntent ? "intent=review&" : ""}next=${encodeURIComponent(next)}`);
            return;
          }
        }
        navigateAfterAuth(next, (href) => router.replace(href));
        return;
      }
      if (!firstName.trim() || !lastName.trim()) throw new Error("Nombre y apellido son obligatorios.");
      if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
      trackMetaCreateAccount(reviewIntent ? "review_email_registration" : "email_registration");
      const { data, error: err } = await signUpAthlete({
        email,
        password,
        firstName,
        lastName,
        next,
        intent: reviewIntent ? "review" : undefined,
      });
      if (err) throw err;
      if (data.user?.identities?.length === 0) {
        throw new Error("Este correo ya tiene cuenta. Inicia sesión.");
      }
      if (data.session) {
        router.replace(`/onboarding?${reviewIntent ? "intent=review&" : ""}next=${encodeURIComponent(next)}`);
        return;
      }
      setPendingEmail(email.trim().toLowerCase());
      setSuccess("Enviamos un código de 6 dígitos a tu correo. Escríbelo aquí para verificar tu cuenta.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo continuar.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyPin(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingEmail || !/^\d{6}$/.test(pin)) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: pendingEmail,
      token: pin,
      type: "email",
    });
    if (verifyError) {
      setError("Código incorrecto o vencido. Revísalo o solicita uno nuevo.");
      setLoading(false);
      return;
    }
    router.replace(`/onboarding?${reviewIntent ? "intent=review&" : ""}next=${encodeURIComponent(next)}`);
  }

  async function resendPin() {
    if (!pendingEmail) return;
    setLoading(true);
    setError(null);
    const { error: resendError } = await createClient().auth.resend({ type: "signup", email: pendingEmail });
    setLoading(false);
    if (resendError) setError(resendError.message);
    else setSuccess("Te enviamos un código nuevo. Revisa tu correo.");
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signInWithGoogle(next, reviewIntent ? "review" : undefined);
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo abrir Google.");
      setLoading(false);
    }
  }

  async function onRecovery(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "recover") {
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("intent", "recovery");
        callback.searchParams.set("next", next);
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: callback.toString() });
        if (error) throw error;
        setSuccess("Si existe una cuenta con ese correo, te llegará un enlace para cambiar tu contraseña.");
      } else if (mode === "reset" && canReset) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        navigateAfterAuth(next, (href) => router.replace(href));
      }
    } catch {
      setError("No pudimos completar la solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const compact = mode !== "welcome" || !!pendingEmail;
  const loginView = mode === "login";
  function back() {
    if (pendingEmail) return selectMode("register");
    if (mode === "recover") return selectMode("login");
    if (mode !== "welcome") return selectMode("welcome");
    if (window.history.length > 1) router.back();
    else router.replace("/");
  }

  return (
    <div className="auth-stage" data-view={loginView ? "login" : compact ? "form" : "welcome"}>
      <div className="auth-back">
        <GlassIconButton aria-label="Volver" onClick={back} disabled={loading}>
          {/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assetsdev/Chevron_Right.svg" alt="" />
        </GlassIconButton>
      </div>
      <div className="auth-canvas">
        {(!compact || loginView) && (
          <header className="auth-brand">
            <h1><img src="/auth-media/wordmark.svg" alt="Dorsalia" width={256.309} height={37} /></h1>
            <p>Carreras de running y eventos deportivos en México</p>
          </header>
        )}
        <div className="auth-actions">
          {!compact ? (
            <>
              <div className="auth-options">
                <Button variant="tertiary" fullWidth className="auth-social" disabled={loading} onClick={() => selectMode("register")}>
                  <MailIcon /> Registrarse con correo
                </Button>
                <Button variant="tertiary" fullWidth className="auth-social" disabled={loading} onClick={onGoogle}>
                  <GoogleIcon /> Registrarse con Google
                </Button>
              </div>
              <div className="auth-options-footer text-center text-sm font-medium">
                <p>¿Ya tienes una cuenta? <button className="auth-link" type="button" disabled={loading} onClick={() => selectMode("login")}>Iniciar sesión</button></p>
              </div>
              {error && <Feedback error={error} />}
            </>
          ) : loginView ? (
            <form onSubmit={onSubmit} className="auth-login-form">
              <h2 className="sr-only">Inicia sesión</h2>
              <label className="auth-login-field">
                <MailIcon />
                <span className="sr-only">Correo o folio de inscripción</span>
                <input required type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Correo o folio de inscripción"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </label>
              <label className="auth-login-field">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10Z"/><path d="M12 9v6"/></svg>
                <span className="sr-only">Contraseña o PIN temporal</span>
                <input required type="password" autoComplete="current-password" placeholder="Contraseña o PIN temporal"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </label>
              <Feedback error={error} />
              <Button variant="tertiary" className="auth-social auth-signin" type="submit" disabled={loading} fullWidth>
                {loading ? "Espera…" : "Iniciar sesión"} <span aria-hidden="true">→</span>
              </Button>
              <div className="space-y-2 text-center text-sm font-medium">
                <p>¿No tienes una cuenta? <button type="button" disabled={loading} className="auth-link" onClick={() => selectMode("register")}>Regístrate</button>.</p>
                <button className="auth-link block mx-auto" type="button" disabled={loading} onClick={() => selectMode("recover")}>Restablecer contraseña</button>
              </div>
            </form>
          ) : (
            <section className="rounded-[22px] border border-white/15 bg-[#101600]/85 p-5 shadow-xl sm:p-6">
              <h1 className="text-[24px] font-semibold leading-tight">
                {pendingEmail ? "Verifica tu correo" :
                  mode === "register" ? (reviewIntent ? "Crea tu cuenta para reseñar" : "Crea tu cuenta") :
                  mode === "recover" ? "Restablecer contraseña" :
                  "Crea una contraseña nueva"}
              </h1>
              {pendingEmail ? (
                <form onSubmit={verifyPin} className="mt-4 space-y-4">
                  <p className="text-sm text-white/80">Verifica <strong className="text-white">{pendingEmail}</strong> para continuar.</p>
                  <Field label="Código de verificación">
                    <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputClass + " text-center tracking-[0.35em]"} />
                  </Field>
                  <Feedback error={error} success={success} />
                  <Button type="submit" disabled={loading || pin.length !== 6} fullWidth>{loading ? "Verificando…" : "Verificar correo"}</Button>
                  <div className="flex flex-wrap justify-between gap-3 text-sm">
                    <button type="button" disabled={loading} onClick={resendPin} className="auth-link">Reenviar código</button>
                    <button type="button" disabled={loading} onClick={() => selectMode("register")} className="auth-link">Cambiar correo</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={mode === "recover" || mode === "reset" ? onRecovery : onSubmit} className="mt-4 space-y-4">
                  {mode === "register" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nombre"><input required autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} /></Field>
                      <Field label="Apellido"><input required autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} /></Field>
                    </div>
                  )}
                  {mode !== "reset" && (
                    <Field label="Correo">
                      <input required type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
                        placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
                    </Field>
                  )}
                  {mode !== "recover" && (
                    <Field label="Contraseña">
                      <input required type="password" autoComplete={mode === "register" || mode === "reset" ? "new-password" : "current-password"}
                        value={password} onChange={e => setPassword(e.target.value)} className={inputClass} minLength={mode === "register" || mode === "reset" ? 6 : 1} />
                    </Field>
                  )}
                  <Feedback error={error} success={success} />
                  <Button type="submit" disabled={loading || (mode === "reset" && !canReset)} fullWidth>
                    {loading ? "Espera…" : mode === "register" ? "Crear cuenta" : mode === "recover" ? "Enviar enlace" : mode === "reset" ? "Guardar contraseña" : "Entrar"}
                  </Button>
                </form>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return <span className="auth-google" aria-hidden="true"><img src="/auth-media/google.svg" alt="" width={22.9178} height={24.1593} /></span>;
}

function MailIcon() {
  return <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>;
}

function Feedback({ error, success }: { error: string | null; success?: string | null }) {
  return <>{error && <p role="alert" className="mt-3 rounded-lg bg-black/55 p-2 text-sm text-red-200">{error}</p>}
    {success && <p role="status" className="text-sm text-lime-100">{success}</p>}</>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm text-white/85">{label}</span>{children}</label>;
}

const inputClass = "min-h-12 w-full rounded-xl border border-white/25 bg-black/25 px-3 text-[16px] text-white outline-none placeholder:text-white/50 focus:border-[#c5e500]";

export default function AuthPage() {
  return <Suspense fallback={<div className="auth-stage grid place-items-center" role="status">Cargando…</div>}><AuthForm /></Suspense>;
}
