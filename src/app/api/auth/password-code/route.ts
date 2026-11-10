import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { issuePasswordCode, markPasswordCodeSent, PASSWORD_CODE_COOKIE, passwordCodeCookieOptions, passwordCodeSendAllowed, sendPasswordCodeEmail } from "@/lib/passwordCode";

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

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no válida." }, { status: 403 });
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email?.trim().toLowerCase();
  if (!user || !email) return NextResponse.json({ error: "Inicia sesión para cambiar tu contraseña." }, { status: 401 });

  const allowed = passwordCodeSendAllowed(user.id);
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: 429 });

  const issued = issuePasswordCode(user.id);
  if (!issued) return NextResponse.json({ error: "Falta RESEND_API_KEY en el servidor." }, { status: 503 });

  const sent = await sendPasswordCodeEmail(email, issued.code);
  if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 502 });
  markPasswordCodeSent(user.id);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PASSWORD_CODE_COOKIE, issued.token, passwordCodeCookieOptions());
  return response;
}
