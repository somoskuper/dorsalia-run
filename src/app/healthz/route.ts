import { APP_RELEASE } from "@/lib/release";

export async function GET() {
  return Response.json({ ok: true, service: "dorsalia-carreras", release: APP_RELEASE });
}
