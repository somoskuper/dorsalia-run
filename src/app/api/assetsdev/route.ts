import { mkdir, readdir, rename, stat, writeFile, unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ROOT = path.join(process.cwd(), "public");
const ALLOWED_DIRS = new Set(["assetsdev", "branding"]);
const ALLOWED_EXT = new Set([
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".otf",
  ".ttf",
  ".css",
  ".json",
  ".txt",
  ".md",
  ".pdf",
]);
const MAX_BYTES = 8 * 1024 * 1024;

function safeName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(0, 120);
}

function fileUrl(dir: string, name: string) {
  return `/api/assetsdev/file/${dir}/${encodeURIComponent(name)}`;
}

async function listDir(rel: string) {
  const abs = path.join(ROOT, rel);
  await mkdir(abs, { recursive: true });
  const entries = await readdir(abs);
  const files = [];
  for (const name of entries) {
    if (name.startsWith(".")) continue;
    const full = path.join(abs, name);
    const s = await stat(full);
    if (!s.isFile()) continue;
    files.push({
      name,
      dir: rel,
      url: fileUrl(rel, name),
      publicPath: `/${rel}/${name}`,
      size: s.size,
      mtime: s.mtime.toISOString(),
      ext: path.extname(name).toLowerCase(),
    });
  }
  files.sort((a, b) => b.mtime.localeCompare(a.mtime));
  return files;
}

export async function GET() {
  const [assetsdev, branding] = await Promise.all([
    listDir("assetsdev"),
    listDir("branding"),
  ]);
  return NextResponse.json({ files: [...assetsdev, ...branding] });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  const dirRaw = String(form.get("dir") || "assetsdev");
  const dir = ALLOWED_DIRS.has(dirRaw) ? dirRaw : "assetsdev";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta archivo" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Máximo 8MB" }, { status: 400 });
  }

  const original = safeName(file.name || "archivo");
  const ext = path.extname(original).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: `Extensión no permitida: ${ext || "(sin extensión)"}` },
      { status: 400 },
    );
  }

  const absDir = path.join(ROOT, dir);
  await mkdir(absDir, { recursive: true });
  const dest = path.join(absDir, original);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buf);

  // Keep branding in sync when icon assets are uploaded via assetsdev
  if (dir === "assetsdev" && (original === "compartir-icon.svg" || original === "guardado-icon.svg")) {
    const brandingDir = path.join(ROOT, "branding");
    await mkdir(brandingDir, { recursive: true });
    await writeFile(path.join(brandingDir, original), buf);
  }

  return NextResponse.json({
    ok: true,
    file: {
      name: original,
      dir,
      url: fileUrl(dir, original),
      publicPath: `/${dir}/${original}`,
      size: buf.length,
    },
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { dir?: string; name?: string; newName?: string }
    | null;
  const dir = body?.dir || "";
  const name = body?.name || "";
  const newNameRaw = body?.newName || "";
  if (!ALLOWED_DIRS.has(dir) || !name || name.includes("..") || name.includes("/")) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }

  const newName = safeName(newNameRaw);
  if (!newName) {
    return NextResponse.json({ error: "Nombre nuevo inválido" }, { status: 400 });
  }
  const ext = path.extname(newName).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: `Extensión no permitida: ${ext}` }, { status: 400 });
  }

  const from = path.join(ROOT, dir, path.basename(name));
  const to = path.join(ROOT, dir, path.basename(newName));
  if (from === to) {
    return NextResponse.json({
      ok: true,
      file: { name: newName, dir, url: fileUrl(dir, newName) },
    });
  }

  try {
    await accessExists(from);
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    await accessExists(to);
    return NextResponse.json({ error: "Ya existe un archivo con ese nombre" }, { status: 409 });
  } catch {
    /* destino libre */
  }

  await rename(from, to);
  return NextResponse.json({
    ok: true,
    file: {
      name: path.basename(newName),
      dir,
      url: fileUrl(dir, path.basename(newName)),
      publicPath: `/${dir}/${path.basename(newName)}`,
    },
  });
}

async function accessExists(abs: string) {
  await stat(abs);
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { dir?: string; name?: string }
    | null;
  const dir = body?.dir || "";
  const name = body?.name || "";
  if (!ALLOWED_DIRS.has(dir) || !name || name.includes("/") || name.includes("..")) {
    return NextResponse.json({ error: "Ruta inválida" }, { status: 400 });
  }
  const abs = path.join(ROOT, dir, path.basename(name));
  try {
    await unlink(abs);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
}
