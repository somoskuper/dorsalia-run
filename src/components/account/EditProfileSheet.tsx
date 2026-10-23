"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import GlassIconButton from "@/components/account/GlassIconButton";
import AssetIcon from "@/components/ui/AssetIcon";
import PhoneCountryInput from "@/components/PhoneCountryInput";
import { DateField } from "@/components/ui/DateField";
import Button from "@/components/ui/Button";
import { GENDERS, SHIRT_SIZES } from "@/lib/athleteProfile";
import { MX_STATES } from "@/lib/mxStates";
import { PROFILE_COVER_PRESETS } from "@/lib/profileCovers";
import type { ProfileMedal } from "@/components/account/AccountProfileView";
import { createClient } from "@/lib/supabase/client";
import { normalizeUsername, usernameError } from "@/lib/usernames";

const ICON_BACK = "/assetsdev/Chevron_Right.svg";
const ANIM_MS = 320;
export const MAX_FEATURED_MEDALS = 8;

/** Instagram-like editable field: soft fill, no colored border. */
const field =
  "box-border w-full max-w-full h-12 rounded-xl border-0 bg-[#1c1c1e] px-3.5 text-[15px] text-white outline-none placeholder:text-white/30 focus:bg-[#2c2c2e] [&>option]:bg-[#1c1c1e] [&>option]:text-white";

export type EditProfileDraft = {
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  phone: string;
  gender: string;
  birth_date: string;
  preferred_shirt_size: string;
  residence: string;
  featuredMedalKeys: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  draft: EditProfileDraft;
  onChange: (next: EditProfileDraft) => void;
  availableMedals: ProfileMedal[];
  coverSrc: string;
  coverPreviewUrl?: string | null;
  avatarUrl: string | null;
  uploading?: boolean;
  saving?: boolean;
  onSave: (e: FormEvent) => void;
  onPickCoverPreset: (coverUrl: string) => void;
  onUploadCover: () => void;
  onUploadAvatar: () => void;
  onResetCover?: () => void;
  canResetCover?: boolean;
};

export default function EditProfileSheet({
  open,
  onClose,
  draft,
  onChange,
  availableMedals,
  coverSrc,
  coverPreviewUrl,
  avatarUrl,
  uploading,
  saving,
  onSave,
  onPickCoverPreset,
  onUploadCover,
  onUploadAvatar,
  onResetCover,
  canResetCover,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [customCoverLoaded, setCustomCoverLoaded] = useState(false);

  useEffect(() => { setCustomCoverLoaded(false); }, [coverSrc, coverPreviewUrl]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = window.setTimeout(() => setMounted(false), ANIM_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mounted, onClose]);

  useEffect(() => {
    if (!mounted) return;
    const normalized = normalizeUsername(draft.username);
    if (usernameError(normalized)) {
      setUsernameState("invalid");
      return;
    }
    setUsernameState("checking");
    const timer = window.setTimeout(() => {
      const supabase = createClient();
      void supabase.rpc("username_available", { p_username: normalized }).then(({ data, error }) => {
        setUsernameState(!error && data === true ? "available" : "taken");
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft.username, mounted]);

  if (!mounted) return null;

  const displayName = [draft.first_name, draft.last_name].filter(Boolean).join(" ");
  const initials = (draft.first_name || draft.last_name || "A").slice(0, 1).toUpperCase();
  const selected = new Set(draft.featuredMedalKeys);

  function toggleMedal(key: string) {
    const has = selected.has(key);
    let next: string[];
    if (has) {
      next = draft.featuredMedalKeys.filter((k) => k !== key);
    } else if (draft.featuredMedalKeys.length >= MAX_FEATURED_MEDALS) {
      return;
    } else {
      next = [...draft.featuredMedalKeys, key];
    }
    onChange({ ...draft, featuredMedalKeys: next });
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden" role="presentation">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/55"
        style={{
          transition: `opacity ${ANIM_MS}ms ease-in-out`,
          opacity: visible ? 1 : 0,
        }}
        onClick={onClose}
      />

      <div
        className="absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col overflow-hidden bg-[#070707] shadow-2xl will-change-transform"
        style={{
          width: "100%",
          maxWidth: "28rem",
          transition: `transform ${ANIM_MS}ms ease-in-out`,
          transform: visible ? "translateX(0)" : "translateX(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Editar perfil"
      >
        <header
          className="flex shrink-0 items-center justify-between border-b border-white/10"
          style={{ padding: "12px 16px" }}
        >
          <GlassIconButton aria-label="Cerrar" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON_BACK} alt="" width={24} height={24} />
          </GlassIconButton>
          <h2 className="text-[16px] font-semibold text-white">Editar perfil</h2>
          <button
            type="submit"
            form="edit-profile-form"
            disabled={saving || usernameState !== "available"}
            className="min-w-[64px] text-right text-[15px] font-semibold text-[var(--accent)] disabled:opacity-50"
          >
            {saving ? "…" : "Listo"}
          </button>
        </header>

        <form
          id="edit-profile-form"
          onSubmit={onSave}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
          style={{ paddingBottom: 48, WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex flex-col items-center px-5 pt-8 pb-2">
            <button
              type="button"
              onClick={onUploadAvatar}
              disabled={uploading}
              className="relative overflow-hidden rounded-full"
              style={{ width: 96, height: 96 }}
              aria-label="Cambiar foto de perfil"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-neutral-800 font-akira text-2xl text-white">
                  {initials}
                </div>
              )}
              <span className="absolute inset-0 grid place-items-center bg-black/35">
                <AssetIcon name="edit-solid" size={20} className="text-white" />
              </span>
            </button>
            <button
              type="button"
              onClick={onUploadAvatar}
              disabled={uploading}
              className="mt-3 text-[14px] font-semibold text-[var(--accent)] disabled:opacity-50"
            >
              {uploading ? "Subiendo…" : "Cambiar foto de perfil"}
            </button>
            {displayName ? (
              <p className="mt-2 text-[13px] text-white/40">{displayName}</p>
            ) : null}
          </div>

          <div className="space-y-3 px-5 pt-4" style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            <Field label="Username" hint={usernameState === "checking" ? "Comprobando…" : usernameState === "available" ? "Disponible" : usernameState === "taken" ? "No disponible" : usernameState === "invalid" ? usernameError(normalizeUsername(draft.username)) || undefined : undefined}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-white/35">@</span>
                <input
                  className={`${field} pl-8`}
                  value={draft.username}
                  maxLength={30}
                  onChange={(e) => onChange({ ...draft, username: normalizeUsername(e.target.value) })}
                  placeholder="tu_username"
                  autoComplete="username"
                  aria-invalid={usernameState === "taken" || usernameState === "invalid"}
                />
              </div>
            </Field>

            <Field label="Nombre">
              <input
                className={field}
                value={draft.first_name}
                maxLength={30}
                onChange={(e) => onChange({ ...draft, first_name: e.target.value.slice(0, 30) })}
                placeholder="Nombre"
                autoComplete="given-name"
              />
            </Field>

            <Field label="Apellido">
              <input
                className={field}
                value={draft.last_name}
                maxLength={30}
                onChange={(e) => onChange({ ...draft, last_name: e.target.value.slice(0, 30) })}
                placeholder="Apellido"
                autoComplete="family-name"
              />
            </Field>

            <Field label="Descripción" hint={`${draft.bio.length}/150`}>
              <textarea
                className={`${field} h-28 resize-none py-3`}
                value={draft.bio}
                maxLength={150}
                onChange={(e) => onChange({ ...draft, bio: e.target.value.slice(0, 150) })}
                placeholder="Escribe una descripción…"
              />
            </Field>

            <Field label="Número">
              <div className="w-full max-w-full min-w-0 overflow-hidden">
                <PhoneCountryInput
                  value={draft.phone}
                  onChange={(phone) => onChange({ ...draft, phone })}
                  placeholder="10 dígitos"
                  className="w-full max-w-full min-w-0"
                  inputClassName="!border-0 bg-[#1c1c1e] text-white focus:bg-[#2c2c2e] focus:!border-0 min-w-0"
                  buttonClassName="!border-0 bg-[#1c1c1e] shrink-0"
                />
              </div>
            </Field>

            <Field label="Sexo">
              <select
                className={field}
                value={draft.gender}
                onChange={(e) => onChange({ ...draft, gender: e.target.value })}
                aria-label="Sexo"
              >
                <option value="">Seleccionar</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fecha de nacimiento">
              <DateField
                aria-label="Fecha de nacimiento"
                className={`${field} pr-8`}
                value={draft.birth_date}
                onChange={(iso) => onChange({ ...draft, birth_date: iso })}
                placeholder="dd/mm/aaaa"
              />
            </Field>

            <Field label="Talla preferida">
              <select
                className={field}
                value={draft.preferred_shirt_size}
                onChange={(e) => onChange({ ...draft, preferred_shirt_size: e.target.value })}
                aria-label="Talla preferida"
              >
                <option value="">Seleccionar</option>
                {SHIRT_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Residencia">
              <select
                className={field}
                value={draft.residence}
                onChange={(e) => onChange({ ...draft, residence: e.target.value })}
                aria-label="Residencia"
              >
                <option value="">Seleccionar estado</option>
                {MX_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Section title="Portada">
            <div className="grid grid-cols-4 gap-2">
              {PROFILE_COVER_PRESETS.map((preset) => {
                const active = coverSrc === preset.src;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onPickCoverPreset(`preset:${preset.id}`)}
                    className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition-opacity ${
                      active ? "ring-[var(--accent)]" : "ring-transparent opacity-80 hover:opacity-100"
                    }`}
                    title={preset.label}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preset.src} alt={preset.label} className="h-full w-full object-cover" />
                  </button>
                );
              })}
              {(coverPreviewUrl || !PROFILE_COVER_PRESETS.some((preset) => preset.src === coverSrc)) ? (
                <div className="relative aspect-square overflow-hidden rounded-lg ring-2 ring-[var(--accent)]" title="Tu portada personalizada">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreviewUrl || coverSrc} alt="Tu portada personalizada" onLoad={() => setCustomCoverLoaded(true)} onError={() => setCustomCoverLoaded(true)} className="h-full w-full object-cover" />
                  {(uploading && coverPreviewUrl) || !customCoverLoaded ? <span className="absolute inset-0 grid place-items-center bg-black/35"><span className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-[#c9f24b]" aria-label="Cargando portada" /></span> : null}
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={onUploadCover}
                className="h-11 flex-1 rounded-xl bg-[#1c1c1e] text-[13px] font-semibold text-white/80 hover:bg-[#2c2c2e] disabled:opacity-50"
              >
                Subir portada
              </button>
              {canResetCover && onResetCover ? (
                <button
                  type="button"
                  onClick={onResetCover}
                  className="h-11 rounded-xl px-3 text-[12px] text-white/45 hover:text-white"
                >
                  Restaurar
                </button>
              ) : null}
            </div>
          </Section>

          <Section
            title="Medallas en tu perfil"
            hint={`${draft.featuredMedalKeys.length}/${MAX_FEATURED_MEDALS}`}
          >
            {availableMedals.length === 0 ? (
              <p className="text-[13px] text-white/40">
                Cuando participes en eventos o desbloquees insignias, aquí podrás elegir cuáles mostrar.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {availableMedals.map((m) => {
                  const on = selected.has(m.key);
                  const lockedOut = !on && draft.featuredMedalKeys.length >= MAX_FEATURED_MEDALS;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggleMedal(m.key)}
                      disabled={lockedOut}
                      title={m.label}
                      className={`relative aspect-square rounded-xl bg-[#1c1c1e] p-1.5 transition-opacity ${
                        on
                          ? "ring-2 ring-[var(--accent)]"
                          : lockedOut
                            ? "opacity-30"
                            : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ opacity: m.completed || on ? undefined : 0.55 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.imageUrl}
                        alt={m.label}
                        className="h-full w-full object-contain"
                      />
                      {on ? (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-black">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          <div className="px-5 pt-4">
            <Button variant="primary" type="submit" disabled={saving || usernameState !== "available"} fullWidth>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block w-full max-w-full min-w-0">
      <span className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-white/55">{label}</span>
        {hint ? <span className="text-[11px] text-white/35">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-6 w-full max-w-full min-w-0 border-t border-white/8 px-5 pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-medium text-white/55">{title}</h3>
        {hint ? <span className="text-[11px] text-white/35">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}
