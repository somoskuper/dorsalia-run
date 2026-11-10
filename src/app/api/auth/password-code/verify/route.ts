import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { PASSWORD_CODE_COOKIE, passwordCodeCookieOptions, readPasswordCode } from "@/lib/passwordCode";

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
  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión para cambiar tu contraseña." }, { status: 401 });

  const token = (await cookies()).get(PASSWORD_CODE_COOKIE)?.value;
  const result = readPasswordCode(token, user.id, code);
  if (result.status === "ok") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(PASSWORD_CODE_COOKIE, "", passwordCodeCookieOptions(0));
    return response;
  }
  if (result.status === "again") {
    const response = NextResponse.json({ error: "Código incorrecto. Revisa el correo e inténtalo de nuevo." }, { status: 400 });
    response.cookies.set(PASSWORD_CODE_COOKIE, result.token, passwordCodeCookieOptions());
    return response;
  }
  const response = NextResponse.json({ error: "El código venció o ya no es válido. Pide uno nuevo." }, { status: 400 });
  response.cookies.set(PASSWORD_CODE_COOKIE, "", passwordCodeCookieOptions(0));
  return response;
}
