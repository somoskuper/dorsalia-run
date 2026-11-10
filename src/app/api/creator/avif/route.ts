import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SharpLike = (input: Buffer) => { rotate: () => { resize: (options: object) => { avif: (options: object) => { toBuffer: () => Promise<Buffer> } } } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 20 * 1024 * 1024;
let activeJobs = 0;

function loadSharp(): SharpLike {
  const require = createRequire(join(process.cwd(), "package.json"));
  try {
    return require("sharp") as SharpLike;
  } catch {
    const root = join(process.cwd(), "node_modules/.pnpm");
    const dir = readdirSync(root).find((name) => name.startsWith("sharp@"));
    if (!dir) throw new Error("No se pudo convertir la imagen.");
    return require(join(root, dir, "node_modules/sharp")) as SharpLike;
  }
}

async function encodeWithSharp(bytes: Uint8Array) {
  const sharp = loadSharp();
  return sharp(Buffer.from(bytes)).rotate().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).avif({ quality: 50, effort: 4 }).toBuffer();
}

function convert(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", input,
      "-frames:v", "1", "-vf", "scale='min(1800,iw)':-2", "-c:v", "libaom-av1", "-still-picture", "1",
      "-crf", "32", "-cpu-used", "6", "-f", "avif", output], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk).slice(0, 1000); });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("La conversión tardó demasiado.")); }, 60_000);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(stderr || "No se pudo convertir la imagen.")); });
  });
}

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return NextResponse.json({ error: "Inicia sesión para subir fotos." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  const supabase = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth.user) return NextResponse.json({ error: "Sesión no válida." }, { status: 401 });
  const { data: creator } = await supabase.from("creator_profiles").select("creator_type,is_active").eq("user_id", auth.user.id).maybeSingle();
  if (creator?.creator_type !== "photographer" || !creator.is_active) return NextResponse.json({ error: "Activa tu cuenta de fotógrafo." }, { status: 403 });
  if (activeJobs >= 2) return NextResponse.json({ error: "Hay otras imágenes en proceso. Inténtalo de nuevo." }, { status: 429 });
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES) return NextResponse.json({ error: "La imagen supera 20 MB." }, { status: 413 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) return NextResponse.json({ error: "Archivo vacío o demasiado grande." }, { status: 400 });
  activeJobs += 1;
  const id = randomUUID();
  const input = join(tmpdir(), `creator-${id}.input`);
  const output = join(tmpdir(), `creator-${id}.avif`);
  try {
    let avif: Uint8Array;
    try {
      await writeFile(input, bytes);
      await convert(input, output);
      avif = await readFile(output);
    } catch (error) {
      const missing = error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";
      if (!missing) throw error;
      avif = await encodeWithSharp(bytes);
    }
    return new Response(Buffer.from(avif), { headers: { "Content-Type": "image/avif", "Content-Length": String(avif.length), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    console.error("[creator-avif]", error);
    return NextResponse.json({ error: "No se pudo convertir la imagen AVIF." }, { status: 422 });
  } finally {
    activeJobs -= 1;
    await Promise.allSettled([unlink(input), unlink(output)]);
  }
}
