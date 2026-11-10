import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { markPasswordCodeSent, passwordCodeSendAllowed, sendPasswordCodeEmail } from "@/lib/passwordCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function adminClient() {
  const key = process.env.SERVICE_ROLE_KEY?.trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://portal.dorsalia.run";
  if (!key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no válida." }, { status: 403 });
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });

  const rateKey = `reset:${email}`;
  const allowed = passwordCodeSendAllowed(rateKey);
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: 429 });

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: "No pudimos enviar el código. Inténtalo de nuevo." }, { status: 503 });

  const link = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (link.error) {
    const message = link.error.message.toLowerCase();
    if (message.includes("not found") || message.includes("no user")) {
      markPasswordCodeSent(rateKey);
      return NextResponse.json({ ok: true });
    }
    if (link.error.status === 429 || message.includes("rate")) return NextResponse.json({ error: "Pediste demasiados códigos. Inténtalo más tarde." }, { status: 429 });
    return NextResponse.json({ error: "No pudimos enviar el código. Inténtalo de nuevo." }, { status: 502 });
  }

  const code = link.data.properties?.email_otp || "";
  if (!/^\d{6,10}$/.test(code)) return NextResponse.json({ error: "No pudimos enviar el código. Inténtalo de nuevo." }, { status: 502 });
  const sent = await sendPasswordCodeEmail(email, code, "reset");
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 });
  markPasswordCodeSent(rateKey);
  return NextResponse.json({ ok: true });
}
