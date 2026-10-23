const IMAGE_MAX_SIZE = 1080;
const IMAGE_WEBP_QUALITY = 0.82;

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  // Prefer Image() — handles iOS Photos (HEIC / empty MIME) better than createImageBitmap alone.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("No se pudo leer la imagen"));
      el.src = url;
    });
    if (typeof createImageBitmap === "function") {
      try {
        return await createImageBitmap(img);
      } catch {
        /* fall through */
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");
    ctx.drawImage(img, 0, 0);
    if (typeof createImageBitmap === "function") {
      return createImageBitmap(canvas);
    }
    throw new Error("createImageBitmap no disponible");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resize + encode any image File to WebP in the browser. */
export async function convertImageToWebP(file: File, baseName = "image", options: { square?: boolean; quality?: number } = {}): Promise<File> {
  if (!options.square && file.type === "image/webp" && file.size < 700_000) {
    return file;
  }

  const bitmap = await loadImageBitmap(file);
  const sourceSize = Math.min(bitmap.width, bitmap.height);
  const sourceX = options.square ? Math.round((bitmap.width - sourceSize) / 2) : 0;
  const sourceY = options.square ? Math.round((bitmap.height - sourceSize) / 2) : 0;
  const scale = Math.min(1, IMAGE_MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = options.square ? IMAGE_MAX_SIZE : Math.max(1, Math.round(bitmap.width * scale));
  const height = options.square ? IMAGE_MAX_SIZE : Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    throw new Error("Canvas no disponible");
  }

  if (options.square) ctx.drawImage(bitmap, sourceX, sourceY, sourceSize, sourceSize, 0, 0, width, height);
  else ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("No se pudo convertir a WebP"))),
      "image/webp",
      options.quality ?? IMAGE_WEBP_QUALITY,
    );
  });

  const safe = (file.name.replace(/\.[^.]+$/, "") || baseName).replace(/[^\w.-]+/g, "-");
  return new File([blob], `${safe}.webp`, { type: "image/webp" });
}
