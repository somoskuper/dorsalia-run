"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmail, signInWithGoogle, signUpAthlete } from "@/lib/auth";
import { isAthleteOnboarded } from "@/lib/athleteProfile";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { navigateAfterAuth, resolvePostAuthNext } from "@/lib/safeAuthNext";
import { trackMetaCreateAccount } from "@/components/IniciarMetaPixel";

type Mode = "login" | "register";

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = resolvePostAuthNext(params.get("next"));
  const reviewIntent = params.get("intent") === "review";
  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" || reviewIntent ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pin, setPin] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session?.user) return;
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
  }, [router, next, reviewIntent]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const { error: err } = await signInWithEmail(email, password);
        if (err) throw err;
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
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

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">{reviewIntent ? "Comunidad Dorsalia" : "Cuenta Dorsalia"}</p>
      <h1 className="mt-2 font-akira text-3xl text-white leading-[1.05]">
        {reviewIntent ? (mode === "login" ? "Inicia sesión para reseñar" : "Crea tu cuenta para reseñar") : mode === "login" ? "Inicia sesión" : "Crea tu perfil"}
      </h1>
      <p className="mt-3 text-sm text-white/60">
        {reviewIntent
          ? "Tu experiencia ayuda a otros corredores. Después configurarás el perfil que aparecerá junto a tu publicación."
          : mode === "login"
          ? "Entra para ver tus compras, guardados y comprar más rápido."
          : "Los mismos datos que usas al inscribirte a una carrera."}
      </p>

      {pendingEmail ? (
        <form onSubmit={verifyPin} className="mt-8 space-y-4">
          <p className="text-sm text-white/70">Verifica <strong className="text-white">{pendingEmail}</strong> para continuar.</p>
          <Field label="Código de verificación">
            <input autoFocus required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${inputClass} text-center text-2xl tracking-[0.35em]`} aria-label="Código de seis dígitos" />
          </Field>
          {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
          {success ? <p className="text-sm text-[var(--accent)]">{success}</p> : null}
          <Button variant="primary" type="submit" disabled={loading || pin.length !== 6} fullWidth>{loading ? "Verificando…" : "Verificar correo"}</Button>
          <button type="button" disabled={loading} onClick={resendPin} className="block w-full text-center text-sm text-white/70 underline disabled:opacity-50">Reenviar código</button>
          <button type="button" disabled={loading} onClick={() => { setPendingEmail(null); setPin(""); setSuccess(null); }} className="block w-full text-center text-xs text-white/45 underline disabled:opacity-50">Cambiar correo</button>
        </form>
      ) : <>
      <Button
        variant="tertiary"
        type="button"
        onClick={onGoogle}
        disabled={loading}
        fullWidth
        className="mt-8"
      >
        Continuar con Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/35">
        <span className="flex-1 h-px bg-white/10" />
        o con correo
        <span className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "register" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre">
                <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Apellido">
                <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </>
        ) : null}

        <Field label="Correo">
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Contraseña">
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} minLength={6} />
        </Field>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-[var(--accent)]">{success}</p> : null}

        <Button variant="primary" type="submit" disabled={loading} fullWidth>
          {loading ? "Espera…" : mode === "login" ? "Entrar" : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-white/55 text-center">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <button type="button" className="text-white underline" onClick={() => setMode("register")}>
              Regístrate
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <button type="button" className="text-white underline" onClick={() => setMode("login")}>
              Inicia sesión
            </button>
          </>
        )}
      </p>
      </>}
      <p className="mt-4 text-center">
        <Link href="/" className="text-xs text-white/40 hover:text-white/70">
          Volver al marketplace
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-sans text-[8px] font-semibold uppercase tracking-[0.16em] text-white/40">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full h-11 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus:border-[var(--accent)] [&>option]:bg-[#111] [&>option]:text-white";

export default function AuthPage() {
  return (
    <div className="min-h-[80vh] px-5 py-16 md:py-24">
      <Suspense fallback={<div className="text-white/50 text-center">Cargando…</div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
