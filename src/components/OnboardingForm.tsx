"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import PhoneCountryInput from "@/components/PhoneCountryInput";
import { DateField } from "@/components/ui/DateField";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
  GENDERS,
  SHIRT_SIZES,
  isAthleteOnboarded,
  splitFullName,
} from "@/lib/athleteProfile";
import { navigateAfterAuth, resolvePostAuthNext } from "@/lib/safeAuthNext";
import { normalizeUsername, usernameError } from "@/lib/usernames";
import { highResolutionAvatar } from "@/lib/avatarImage";
import { SettingsFieldsSkeleton } from "@/components/ui/Skeleton";
import SuggestedPeople from "@/components/activity/SuggestedPeople";

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

export function OnboardingForm() {
  const { user, loading, refresh } = useAthleteAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = resolvePostAuthNext(params.get("next"));
  const reviewIntent = params.get("intent") === "review";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [shirtSize, setShirtSize] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const suggestingRef = useRef(false);
  const ownedUsername = useRef("");

  useEffect(() => {
    if (loading || suggestingRef.current) return;
    if (!user) {
      router.replace(`/auth?${reviewIntent ? "mode=register&intent=review&" : ""}next=${encodeURIComponent(next)}`);
      return;
    }

    const supabase = createClient();
    (async () => {
      const { data: prof } = await supabase
        .from("athlete_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (isAthleteOnboarded(user.user_metadata, prof)) {
        navigateAfterAuth(next, (href) => router.replace(href));
        return;
      }

      const meta = user.user_metadata || {};
      const fromMeta = splitFullName(
        (meta.full_name as string) || (meta.name as string) || "",
      );
      const initialFirstName = String(
        prof?.first_name || meta.first_name || fromMeta.first_name || "",
      ).trim();
      const initialLastName = String(
        prof?.last_name || meta.last_name || fromMeta.last_name || "",
      ).trim();
      setFirstName(initialFirstName);
      setLastName(initialLastName);
      const savedUsername = normalizeUsername(String(prof?.username || ""));
      ownedUsername.current = savedUsername;
      setUsername(
        savedUsername ||
          normalizeUsername(
            String(
              meta.username ||
                `${initialFirstName || "runner"}_${initialLastName || user.id.slice(0, 6)}`,
            ),
          ),
      );
      setPhone(String(prof?.phone || "").trim());
      setGender(String(prof?.gender || "").trim());
      setBirthDate(String(prof?.birth_date || "").trim());
      setShirtSize(String(prof?.preferred_shirt_size || "").trim());
      setReady(true);
    })();
  }, [loading, user, router, next, reviewIntent]);

  useEffect(() => {
    if (!ready || !user) return;
    const normalized = normalizeUsername(username);
    if (usernameError(normalized)) {
      setUsernameState("invalid");
      return;
    }
    if (ownedUsername.current && normalized === ownedUsername.current) {
      setUsernameState("available");
      return;
    }
    setUsernameState("checking");
    const timer = window.setTimeout(async () => {
      const supabase = createClient();
      const { data, error: availabilityError } = await supabase.rpc(
        "username_available",
        { p_username: normalized },
      );
      setUsernameState(availabilityError ? "error" : data === true ? "available" : "taken");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [username, ready, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return;
    }
    const normalizedUsername = normalizeUsername(username);
    const validationError = usernameError(normalizedUsername);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data: isAvailable, error: availabilityError } = await supabase.rpc(
      "username_available",
      { p_username: normalizedUsername },
    );
    if (ownedUsername.current !== normalizedUsername && (availabilityError || isAvailable !== true)) {
      setSaving(false);
      setError(availabilityError ? "No pudimos comprobar el username. Inténtalo de nuevo." : "Ese username ya está ocupado. Elige otro.");
      setUsernameState(availabilityError ? "error" : "taken");
      return;
    }
    const { error: profileError } = await supabase.from("athlete_profiles").upsert({
      user_id: user.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: normalizedUsername,
      phone: phone.trim() || null,
      gender: gender || null,
      birth_date: birthDate || null,
      preferred_shirt_size: shirtSize || null,
      avatar_url: highResolutionAvatar(
        user.user_metadata?.avatar_url || user.user_metadata?.picture,
      ),
      updated_at: new Date().toISOString(),
    });
    if (profileError) {
      setSaving(false);
      setError(profileError.message);
      return;
    }
    suggestingRef.current = true;
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        athlete_onboarding_done: true,
        profile_setup_required: false,
        account_type: "athlete",
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        username: normalizedUsername,
      },
    });
    setSaving(false);
    if (metaError) {
      suggestingRef.current = false;
      setError(metaError.message);
      return;
    }
    ownedUsername.current = normalizedUsername;
    setSuggesting(true);
  }

  async function finish() {
    if (!user) return;
    setError(null);
    await refresh();
    navigateAfterAuth(next, (href) => router.replace(href));
  }

  if (suggesting && user) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <SuggestedPeople viewerId={user.id} onDone={() => void finish()} />
        {error ? <p className="mt-3 px-[15px] text-sm text-[#DE5757]">{error}</p> : null}
      </div>
    );
  }

  if (loading || !ready) {
    return <div className="text-white/50 text-center py-20">Preparando tu perfil…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45">{reviewIntent ? "Último paso" : "Bienvenido"}</p>
      <h1 className="mt-2 font-akira text-3xl text-white leading-[1.05]">{reviewIntent ? "Prepara tu perfil para publicar" : "Completa tu perfil"}</h1>
      <p className="mt-3 text-sm text-white/60">
        {reviewIntent ? "Elige tu username y completa tus datos. Este perfil aparecerá junto a tu reseña y tus fotos." : "Un paso rápido para comprar e inscribirte más fácil en cualquier carrera."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre">
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Apellido">
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              autoComplete="family-name"
            />
          </Field>
        </div>
        <Field label="Username público">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-white/35">@</span>
            <input
              required
              value={username}
              onChange={(e) => setUsername(normalizeUsername(e.target.value))}
              className={`${inputClass} pl-7`}
              autoComplete="username"
              spellCheck={false}
              aria-describedby="username-status"
            />
          </div>
          <p
            id="username-status"
            className={`mt-1.5 text-xs ${
              usernameState === "available"
                ? "text-lime-300"
                : usernameState === "taken" || usernameState === "invalid" || usernameState === "error"
                  ? "text-red-400"
                  : "text-white/40"
            }`}
          >
            {usernameState === "checking"
              ? "Comprobando disponibilidad…"
              : usernameState === "available"
                ? "Username disponible"
                : usernameState === "taken"
                  ? "Ese username ya está ocupado"
                  : usernameState === "invalid"
                    ? usernameError(normalizeUsername(username))
                    : usernameState === "error"
                      ? "No pudimos comprobarlo. Puedes intentar continuar."
                      : "Será tu enlace público en dorsalia.run/perfil/username"}
          </p>
        </Field>
        <Field label="Teléfono">
          <PhoneCountryInput
            value={phone}
            onChange={setPhone}
            placeholder="10 dígitos"
            inputClassName="border-white/15 bg-white/5 text-white focus:border-[var(--accent)]"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Género">
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
              <option value="">Elige…</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nacimiento">
            <DateField
              aria-label="Fecha de nacimiento"
              value={birthDate}
              onChange={setBirthDate}
              className={`${inputClass} pr-8`}
              placeholder="dd/mm/aaaa"
            />
          </Field>
        </div>
        <Field label="Talla preferida">
          <select value={shirtSize} onChange={(e) => setShirtSize(e.target.value)} className={inputClass}>
            <option value="">Elige…</option>
            {SHIRT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button
          variant="primary"
          type="submit"
          disabled={saving || usernameState === "checking" || usernameState === "taken" || usernameState === "invalid" || usernameState === "idle"}
          fullWidth
        >
          {saving ? "Guardando…" : "Continuar"}
        </Button>
      </form>
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

export default function OnboardingPage() {
  return (
    <div className="min-h-[80vh] px-5 py-16 md:py-24">
      <Suspense fallback={<SettingsFieldsSkeleton count={3} />}>
        <OnboardingForm />
      </Suspense>
    </div>
  );
}
