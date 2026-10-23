import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_BYTES = 40 * 1024 * 1024;
const TRANSCODE_TIMEOUT_MS = 120_000;
let activeJobs = 0;
const MAX_ACTIVE_JOBS = 2;

function runFfmpeg(input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y", "-i", input,
      "-t", "20.7", "-an", "-c:v", "libx264", "-preset", "veryfast",
      "-crf", "25", "-pix_fmt", "yuv420p", "-movflags", "+faststart", output,
    ], { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk).slice(0, 4000); });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("La conversión tardó demasiado."));
    }, TRANSCODE_TIMEOUT_MS);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(stderr || `FFmpeg terminó con código ${code}`));
    });
  });
}

export async function POST(request: Request) {
  if (activeJobs >= MAX_ACTIVE_JOBS) {
    return NextResponse.json({ error: "El generador está ocupado. Intenta de nuevo en un momento." }, { status: 429 });
  }
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: "El video excede el tamaño permitido." }, { status: 413 });
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: "Archivo vacío o demasiado grande." }, { status: 400 });
  }

  activeJobs += 1;
  const id = randomUUID();
  const input = join(tmpdir(), `dorsalia-route-${id}.input`);
  const output = join(tmpdir(), `dorsalia-route-${id}.mp4`);
  try {
    await writeFile(input, bytes);
    await runFfmpeg(input, output);
    const mp4 = await readFile(output);
    return new Response(new Uint8Array(mp4), {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(mp4.length),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[route-video-transcode]", error);
    return NextResponse.json({ error: "No se pudo finalizar el video H.264." }, { status: 500 });
  } finally {
    activeJobs -= 1;
    await Promise.allSettled([unlink(input), unlink(output)]);
  }
}
