"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import SettingsSectionEdit from "@/components/settings/SettingsSectionEdit";
import PageHeader from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/client";
import { GENDERS, SHIRT_SIZES } from "@/lib/athleteProfile";
import { MX_STATES } from "@/lib/mxStates";
import { normalizeUsername, usernameError } from "@/lib/usernames";
import ProfileIdentity from "@/components/account/ProfileIdentity";
import { resolveProfileCover } from "@/lib/profileCovers";
import { SettingsFieldsSkeleton } from "@/components/ui/Skeleton";

export type FieldKey = "username" | "first_name" | "last_name" | "phone" | "gender" | "preferred_shirt_size" | "residence";
type Fields = Record<FieldKey, string>;

const fieldDetails: { key: FieldKey; title: string }[] = [
  { key: "username", title: "Usuario" },
  { key: "first_name", title: "Nombre" },
  { key: "last_name", title: "Apellido" },
  { key: "phone", title: "Teléfono" },
  { key: "gender", title: "Género" },
  { key: "preferred_shirt_size", title: "Talla preferida" },
  { key: "residence", title: "Residencia" },
];

const descriptions: Record<FieldKey, string> = {
  username: "Tu nombre de usuario identifica tu perfil y permite que otras personas te encuentren.",
  first_name: "Este nombre se muestra en tu perfil y junto a tu actividad.",
  last_name: "Tu apellido aparece junto a tu nombre en tu perfil.",
  phone: "Mantén actualizado el número de contacto de tu cuenta.",
  gender: "Elige cómo quieres registrar este dato en tu perfil.",
  preferred_shirt_size: "Tu talla preferida sirve como referencia al inscribirte en eventos.",
  residence: "Tu estado de residencia ayuda a mostrarte eventos cercanos.",
};

const emptyFields: Fields = {
  username: "", first_name: "", last_name: "", phone: "", gender: "", preferred_shirt_size: "", residence: "",
};

export default function EditProfileSettings({ field }: { field?: FieldKey }) {
  const router = useRouter();
  const { user, loading: authLoading, patchProfile, refresh } = useAthleteAuth();
  const [fields, setFields] = useState<Fields | null>(null);
  const [media, setMedia] = useState<{ avatarUrl: string | null; coverUrl: string | null }>({ avatarUrl: null, coverUrl: null });
  const active = field || null;
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"checking" | "available" | "taken" | "invalid" | "error">("checking");

  useEffect(() => {
    if (active !== "username" || !fields) return;
    const username = normalizeUsername(draft);
    if (usernameError(username)) { setUsernameStatus("invalid"); return; }
    if (username === fields.username) { setUsernameStatus("available"); return; }
    setUsernameStatus("checking");
    let current = true;
    const timer = window.setTimeout(() => {
      void createClient().rpc("username_available", { p_username: username }).then(({ data, error: checkError }) => {
        if (current) setUsernameStatus(checkError ? "error" : data === true ? "available" : "taken");
      });
    }, 350);
    return () => { current = false; window.clearTimeout(timer); };
  }, [active, draft, fields]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/auth?next=${encodeURIComponent("/settings/edit-profile")}`);
      return;
    }
    let current = true;
    const meta = user.user_metadata || {};
    void createClient().from("athlete_profiles")
      .select("username, first_name, last_name, phone, gender, preferred_shirt_size, residence, avatar_url, cover_url")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!current) return;
        const next = { ...emptyFields };
        for (const key of Object.keys(next) as FieldKey[]) {
          next[key] = String(data?.[key] || meta[key] || "");
        }
        setFields(next);
        setMedia({ avatarUrl: String(data?.avatar_url || meta.avatar_url || "") || null, coverUrl: String(data?.cover_url || "") || null });
        if (field) setDraft(next[field]);
      });
    return () => { current = false; };
  }, [authLoading, user?.id, router, field]);

  function openField(key: FieldKey) {
    router.push(`/settings/edit-profile/${key}`);
  }

  async function saveField(event: FormEvent) {
    event.preventDefault();
    if (!user || !fields || !active || saving) return;
    let value = draft.trim();
    if (active === "username") {
      value = normalizeUsername(value);
      const problem = usernameError(value);
      if (problem) { setError(problem); return; }
      if (usernameStatus !== "available") { setError("Espera a comprobar que el usuario esté disponible."); return; }
    }
    if (active === "first_name" && !value) { setError("El nombre es obligatorio."); return; }
    if (active === "first_name" || active === "last_name" || active === "username") value = value.slice(0, 30);
    if (value === fields[active]) { router.push("/settings/edit-profile"); return; }

    setSaving(true);
    setError("");
    const supabase = createClient();
    try {
      if (active === "username") {
        const { data: available, error: checkError } = await supabase.rpc("username_available", { p_username: value });
        if (checkError || available !== true) throw new Error("Ese usuario ya no está disponible. Elige otro.");
      }
      const { data: existing, error: readError } = await supabase.from("athlete_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (readError) throw readError;
      const { error: saveError } = await supabase.from("athlete_profiles").upsert({
        ...(existing || {}), user_id: user.id, [active]: value || null, updated_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;

      const next = { ...fields, [active]: value };
      if (active === "first_name" || active === "last_name" || active === "username") {
        const fullName = [next.first_name, next.last_name].filter(Boolean).join(" ");
        const { error: metaError } = await supabase.auth.updateUser({ data: {
          first_name: next.first_name, last_name: next.last_name, full_name: fullName, username: next.username,
        } });
        if (metaError) throw metaError;
        patchProfile({ firstName: next.first_name, lastName: next.last_name, fullName });
        void refresh();
      }
      setFields(next);
      router.push("/settings/edit-profile");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el cambio.");
    } finally {
      setSaving(false);
    }
  }

  if (!fields && !field) return <SettingsFieldsSkeleton />;

  const activeTitle = fieldDetails.find((item) => item.key === active)?.title || "";
  const options = active === "gender" ? GENDERS : active === "preferred_shirt_size" ? SHIRT_SIZES : active === "residence" ? MX_STATES : null;
  if (field) return <>
    <PageHeader fallbackHref="/settings/edit-profile" title={activeTitle} saveFormId="profile-field-form" saveDisabled={!fields || saving || (field === "username" && usernameStatus !== "available")} sticky />
    <main className="mx-auto w-full max-w-[640px]">{!fields ? <SettingsFieldsSkeleton /> : <form id="profile-field-form" onSubmit={(event) => void saveField(event)} className="mt-10">
    <h2 className="text-[20px] font-semibold">{field === "username" ? "Cambiar nombre de usuario" : `Cambiar ${activeTitle.toLowerCase()}`}</h2>
    {options ? <select value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-[10px] h-[44px] w-full rounded-full bg-[#191919] px-[15px] text-[16px] text-white outline-none"><option value="">Seleccionar</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
      : <input type={field === "phone" ? "tel" : "text"} maxLength={30} value={field === "username" ? `@${draft}` : draft} onChange={(event) => setDraft(field === "username" ? event.target.value.replace(/^@/, "") : event.target.value)} className="mt-[10px] h-[44px] w-full rounded-full bg-[#191919] px-[15px] text-[16px] text-white outline-none placeholder:text-white/50" />}
    {field === "username" ? <p aria-live="polite" className={`mt-3 text-[14px] ${usernameStatus === "available" ? "text-[#C5E500]" : usernameStatus === "taken" || usernameStatus === "error" ? "text-[#DE5757]" : "text-white/50"}`}>
      {usernameStatus === "checking" ? "Comprobando disponibilidad…" : usernameStatus === "available" ? draft === fields.username ? "Tu usuario actual" : "Usuario disponible" : usernameStatus === "taken" ? "Este usuario ya está en uso." : usernameStatus === "error" ? "No se pudo comprobar la disponibilidad." : usernameError(normalizeUsername(draft))}
    </p> : null}
    <p className="mt-[15px] text-[14px] text-white/50">{descriptions[field]}</p>
    {error ? <p role="alert" className="mt-3 text-sm text-[#DE5757]">{error}</p> : null}
  </form>}</main>
  </>;

  if (!fields) return <SettingsFieldsSkeleton />;

  return <>
    <ProfileIdentity displayName={[fields.first_name, fields.last_name].filter(Boolean).join(" ") || "Atleta"} username={fields.username} avatarUrl={media.avatarUrl} coverSrc={resolveProfileCover(media.coverUrl)} editMode />
    <div className="mt-10 space-y-[30px]">
      {fieldDetails.map(({ key, title }) => <SettingsSectionEdit key={key} title={title} value={key === "username" && fields[key] ? `@${fields[key]}` : fields[key]} onClick={() => openField(key)} />)}
    </div>
  </>;
}
