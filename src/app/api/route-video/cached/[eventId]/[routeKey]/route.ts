import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safePart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "route";
}

function videoPath(eventId: string, routeKey: string) {
  const root = process.env.ROUTE_VIDEO_DIR || "/data/route-videos";
  return join(root, safePart(eventId), `${safePart(routeKey)}.mp4`);
}

export async function GET(_request: Request, context: { params: Promise<{ eventId: string; routeKey: string }> }) {
  const { eventId, routeKey } = await context.params;
  try {
    const path = videoPath(eventId, routeKey);
    const [bytes, info] = await Promise.all([readFile(path), stat(path)]);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(info.size),
        "Content-Disposition": `inline; filename="dorsalia-${safePart(routeKey)}.mp4"`,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        "Last-Modified": info.mtime.toUTCString(),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ status: "pending" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}

export async function HEAD(_request: Request, context: { params: Promise<{ eventId: string; routeKey: string }> }) {
  const { eventId, routeKey } = await context.params;
  try {
    const info = await stat(videoPath(eventId, routeKey));
    return new Response(null, { status: 200, headers: { "Content-Type": "video/mp4", "Content-Length": String(info.size), "Cache-Control": "no-store" } });
  } catch {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
