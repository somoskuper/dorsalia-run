import { createReadStream } from "fs";
import { access, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

const ROOT = path.join(process.cwd(), "public");
const ALLOWED_DIRS = new Set(["assetsdev", "branding"]);

const MIME: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".pdf": "application/pdf",
};

type Params = { params: Promise<{ dir: string; name: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { dir, name: rawName } = await params;
  if (!ALLOWED_DIRS.has(dir)) {
    return NextResponse.json({ error: "Dir inválido" }, { status: 400 });
  }
  const name = path.basename(decodeURIComponent(rawName));
  if (!name || name.startsWith(".")) {
    return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
  }

  const abs = path.join(ROOT, dir, name);
  try {
    await access(abs);
    const s = await stat(abs);
    if (!s.isFile()) {
      return NextResponse.json({ error: "No es archivo" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const ext = path.extname(name).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const stream = createReadStream(abs);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${name.replace(/"/g, "")}"`,
    },
  });
}
