import type { SupabaseClient } from "@supabase/supabase-js";
import { convertImageToWebP } from "@/lib/convertImageToWebP";
import { portfolioCardOptions, portfolioCardPath } from "@/lib/photoDelivery";

export type CreatorPhotoRow = { id: string; publication_id: string; image_url: string; storage_path?: string; sort_order: number };

function postWithProgress(url: string, body: Blob, headers: Record<string, string>, onRatio: (ratio: number) => void) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [key, value] of Object.entries(headers)) xhr.setRequestHeader(key, value);
    xhr.responseType = "arraybuffer";
    xhr.upload.onprogress = (event) => { if (event.lengthComputable && event.total) onRatio(Math.min(1, event.loaded / event.total)); };
    xhr.onerror = () => reject(new Error("No se pudo subir la foto."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { resolve(xhr.response); return; }
      let message = "No se pudo subir la foto.";
      try { message = JSON.parse(new TextDecoder().decode(xhr.response)).error || message; } catch { /* El servidor no devolvió un mensaje legible. */ }
      reject(new Error(message));
    };
    xhr.send(body);
  });
}

function compressAvif(file: File, token: string, onRatio: (ratio: number) => void) {
  return postWithProgress("/api/creator/avif", file, { "Content-Type": file.type || "application/octet-stream", Authorization: `Bearer ${token}` }, onRatio)
    .then((buffer) => { onRatio(1); return new Blob([buffer], { type: "image/avif" }); });
}

function uploadAvif(path: string, file: Blob, token: string, onRatio: (ratio: number) => void) {
  const base = process.env.NODE_ENV === "development" ? "" : (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return postWithProgress(`${base}/storage/v1/object/public-image/${encodeURI(path)}`, file, {
    Authorization: `Bearer ${token}`,
    apikey: key,
    "Content-Type": "image/avif",
    "x-upsert": "false",
  }, onRatio);
}

/** Converts to AVIF, stores it with its card thumbnail and registers it in creator_photos. */
export async function uploadCreatorPhoto({ supabase, userId, publicationId, file, token, sortOrder, onRatio }: {
  supabase: SupabaseClient;
  userId: string;
  publicationId: string;
  file: File;
  token: string;
  sortOrder: number;
  onRatio: (ratio: number) => void;
}): Promise<CreatorPhotoRow> {
  const compressed = await compressAvif(file, token, (ratio) => onRatio(ratio * 0.62));
  const fileId = crypto.randomUUID();
  const path = `creators/${userId}/${publicationId}/${fileId}.avif`;
  await uploadAvif(path, compressed, token, (ratio) => onRatio(0.62 + ratio * 0.28));
  try {
    const card = await convertImageToWebP(file, "card", portfolioCardOptions);
    await supabase.storage.from("public-image").upload(`activity/${userId}/cards/${fileId}.webp`, card, { contentType: "image/webp", upsert: false });
  } catch { /* La miniatura no impide guardar el AVIF original. */ }
  onRatio(1);
  const { data: publicUrl } = supabase.storage.from("public-image").getPublicUrl(path);
  const { data: photo, error } = await supabase.from("creator_photos").insert({ publication_id: publicationId, creator_id: userId, storage_path: path, image_url: publicUrl.publicUrl, sort_order: sortOrder }).select("id,publication_id,image_url,storage_path,sort_order").single();
  if (error || !photo) {
    await supabase.storage.from("public-image").remove([path]);
    throw error || new Error("No se pudo registrar la foto.");
  }
  return photo as CreatorPhotoRow;
}

/** Removes the photo row and its stored files (AVIF and card). */
export async function deleteCreatorPhoto(supabase: SupabaseClient, userId: string, photo: Pick<CreatorPhotoRow, "id" | "image_url" | "storage_path">) {
  const { error } = await supabase.from("creator_photos").delete().eq("id", photo.id).eq("creator_id", userId);
  if (error) throw error;
  let path = photo.storage_path || "";
  if (!path) { try { path = decodeURIComponent(new URL(photo.image_url).pathname.split("/public-image/")[1] || ""); } catch { path = ""; } }
  if (!path) return;
  const card = portfolioCardPath(path);
  const { error: storageError } = await supabase.storage.from("public-image").remove(card ? [path, card] : [path]);
  if (storageError) throw storageError;
}
