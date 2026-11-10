"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAthleteAuth } from "@/components/AthleteAuthProvider";
import { convertImageToWebP } from "@/lib/convertImageToWebP";
import { PROFILE_COVER_PRESETS, resolveProfileCover } from "@/lib/profileCovers";
import { createClient } from "@/lib/supabase/client";
import { PhotoGridSkeleton } from "@/components/ui/Skeleton";

type MediaKind = "cover" | "avatar";

export default function ProfileMediaEditor({ kind }: { kind: MediaKind }) {
  const router = useRouter();
  const { user, loading: authLoading, patchProfile, refresh } = useAthleteAuth();
  const [original, setOriginal] = useState("");
  const [selectedCover, setSelectedCover] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/auth?next=${encodeURIComponent(`/settings/edit-profile/${kind}`)}`);
      return;
    }
    let current = true;
    void createClient().from("athlete_profiles").select("avatar_url, cover_url").eq("user_id", user.id).maybeSingle().then(({ data, error: readError }) => {
      if (!current) return;
      if (readError) setError("No se pudieron cargar tus imágenes. Inténtalo de nuevo.");
      const value = String(kind === "cover" ? data?.cover_url || "" : data?.avatar_url || user.user_metadata?.avatar_url || "");
      setOriginal(value);
      setSelectedCover(value || `preset:${PROFILE_COVER_PRESETS[0].id}`);
      setReady(true);
    });
    return () => { current = false; };
  }, [authLoading, kind, router, user?.id]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    setError("");
    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user || saving || !ready || (!file && (kind === "avatar" || selectedCover === original))) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    try {
      let value = selectedCover;
      if (file) {
        const webp = await convertImageToWebP(file, kind, { square: kind === "avatar", quality: kind === "avatar" ? 0.9 : undefined });
        const path = `avatars/${user.id}/${kind}-${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from("public-image").upload(path, webp, { contentType: "image/webp", upsert: true });
        if (uploadError) throw uploadError;
        value = supabase.storage.from("public-image").getPublicUrl(path).data.publicUrl;
      }
      const { data: existing, error: readError } = await supabase.from("athlete_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (readError) throw readError;
      const column = kind === "cover" ? "cover_url" : "avatar_url";
      const { error: saveError } = await supabase.from("athlete_profiles").upsert({ ...(existing || {}), user_id: user.id, [column]: value, updated_at: new Date().toISOString() });
      if (saveError) throw saveError;
      if (kind === "avatar") {
        const { error: authError } = await supabase.auth.updateUser({ data: { avatar_url: value, picture: value } });
        if (authError) throw authError;
        patchProfile({ avatarUrl: value });
        await refresh();
      }
      router.push("/settings/edit-profile");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la imagen.");
    } finally {
      setSaving(false);
    }
  }

  const title = kind === "cover" ? "Portada" : "Foto de perfil";
  const changed = Boolean(file) || (kind === "cover" && selectedCover !== original);
  const shown = previewUrl || (kind === "cover" ? resolveProfileCover(selectedCover) : original);
  return <>
    <PageHeader fallbackHref="/settings/edit-profile" title={title} saveFormId="profile-media-form" saveDisabled={!ready || !changed || saving} sticky />
    <main className="mx-auto mt-10 w-full max-w-[640px]">
      <form id="profile-media-form" onSubmit={(event) => void save(event)}>
        <h2 className="text-[20px] font-semibold">Cambiar {kind === "cover" ? "portada" : "foto de perfil"}</h2>
        <p className="mt-[10px] text-[14px] text-white/50">{kind === "cover" ? "Elige una portada o sube una imagen. El cambio se aplica al guardar." : "Elige una foto cuadrada o recortaremos el centro al guardar."}</p>
        {ready ? <div className="mt-5">
          {kind === "cover" ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt="Vista previa de la portada" className="aspect-[2/1] w-full rounded-[20px] bg-[#191919] object-cover" />
            <h3 className="mt-[30px] text-[20px] font-semibold">Portadas predeterminadas</h3>
            <div className="mt-[10px] grid grid-cols-3 gap-[10px] sm:grid-cols-5">
              {PROFILE_COVER_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => { setFile(null); setPreviewUrl(""); setSelectedCover(`preset:${preset.id}`); }} className={`overflow-hidden rounded-[14px] border-2 ${!file && resolveProfileCover(selectedCover) === preset.src ? "border-[#C5E500]" : "border-transparent"}`} aria-label={`Elegir ${preset.label}`} aria-pressed={!file && resolveProfileCover(selectedCover) === preset.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preset.src} alt="" className="aspect-square w-full object-cover" />
              </button>)}
            </div>
          </> : <div className="mx-auto h-[153px] w-[153px] rounded-[47px] border-4 border-[#C5E500]">
            {shown ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={shown} alt="Vista previa de la foto de perfil" className="h-[145px] w-[145px] rounded-[43px] object-cover" /> : <div className="h-[145px] w-[145px] rounded-[43px] bg-[#191919]" />}
          </div>}
          <label className="mt-5 block cursor-pointer rounded-[20px] bg-[#191919] px-[15px] py-4 text-center text-[16px] font-semibold text-white">
            {kind === "cover" ? "Subir portada" : "Subir foto de perfil"}
            <input type="file" accept="image/*,.heic,.heif" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} />
          </label>
        </div> : <div className="mt-5"><PhotoGridSkeleton count={6} columns={3} /></div>}
        {error ? <p role="alert" className="mt-4 text-[14px] text-[#DE5757]">{error}</p> : null}
      </form>
    </main>
  </>;
}
