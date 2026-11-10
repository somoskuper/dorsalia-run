import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const PASSWORD_CODE_COOKIE = "dorsalia-password-code";
const TTL_MS = 10 * 60 * 1000;
const MAX_TRIES = 5;
const sends = new Map<string, number[]>();

type Payload = { uid: string; exp: number; codeHash: string; tries: number };

function resendKey() {
  const key = process.env.RESEND_API_KEY?.trim();
  return key || null;
}

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function codeHash(userId: string, code: string, key: string) {
  return createHash("sha256").update(`${userId}:${code}:${key}`).digest("base64url");
}

function pack(body: Payload, key: string) {
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

function unpack(token: string, key: string): Payload | null {
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload, key);
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString()) as Payload;
    if (!body?.uid || !body.exp || !body.codeHash || typeof body.tries !== "number") return null;
    return body;
  } catch {
    return null;
  }
}

export function passwordCodeCookieOptions(maxAge = Math.ceil(TTL_MS / 1000)) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function recentSends(userId: string) {
  const now = Date.now();
  return (sends.get(userId) || []).filter((at) => now - at < 15 * 60 * 1000);
}

export function passwordCodeSendAllowed(userId: string) {
  const recent = recentSends(userId);
  const last = recent.at(-1) || 0;
  if (Date.now() - last < 60_000) return { ok: false as const, error: "Espera un minuto antes de pedir otro código." };
  if (recent.length >= 5) return { ok: false as const, error: "Pediste demasiados códigos. Inténtalo más tarde." };
  return { ok: true as const };
}

export function markPasswordCodeSent(userId: string) {
  const recent = recentSends(userId);
  recent.push(Date.now());
  sends.set(userId, recent);
}

export function issuePasswordCode(userId: string) {
  const key = resendKey();
  if (!key) return null;
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const token = pack({ uid: userId, exp: Date.now() + TTL_MS, codeHash: codeHash(userId, code, key), tries: 0 }, key);
  return { code, token };
}

export function readPasswordCode(token: string | undefined, userId: string, code: string):
  { status: "ok" } | { status: "again"; token: string } | { status: "invalid" } {
  const key = resendKey();
  if (!key || !token || !/^\d{6}$/.test(code)) return { status: "invalid" };
  const body = unpack(token, key);
  if (!body || body.uid !== userId || body.exp < Date.now() || body.tries >= MAX_TRIES) return { status: "invalid" };
  const expected = Buffer.from(body.codeHash);
  const actual = Buffer.from(codeHash(userId, code, key));
  if (expected.length === actual.length && timingSafeEqual(expected, actual)) return { status: "ok" };
  const tries = body.tries + 1;
  if (tries >= MAX_TRIES) return { status: "invalid" };
  return { status: "again", token: pack({ ...body, tries }, key) };
}

export async function sendPasswordCodeEmail(to: string, code: string, purpose: "change" | "reset" = "change") {
  const key = resendKey();
  if (!key) return { ok: false as const, error: "Falta RESEND_API_KEY en el servidor." };
  const from = process.env.RESEND_FROM_EMAIL?.trim() || "Dorsalia <contacto@dorsalia.run>";
  const lead = purpose === "reset" ? "Usa este código para restablecer tu contraseña en Dorsalia:" : "Usa este código para cambiar tu contraseña en Dorsalia:";
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: purpose === "reset" ? "Código para restablecer tu contraseña" : "Código para cambiar tu contraseña",
        text: `${lead} ${code}. Caduca en 10 minutos. Si no solicitaste este cambio, ignora este correo.`,
        html: `<div style="font-family:Roboto,Arial,sans-serif;background:#070707;color:#ffffff;padding:32px"><p style="font-size:16px;line-height:24px">${lead}</p><p style="font-size:32px;letter-spacing:8px;font-weight:700">${code}</p><p style="font-size:14px;line-height:22px;color:rgba(255,255,255,.6)">Caduca en 10 minutos. Si no fuiste tú, ignora este correo.</p></div>`,
      }),
    });
  } catch {
    return { ok: false as const, error: "No pudimos enviar el código. Inténtalo de nuevo." };
  }
  if (response.ok) return { ok: true as const };
  const detail = await response.json().catch(() => null) as { message?: string } | null;
  const message = typeof detail?.message === "string" ? detail.message : "";
  if (response.status === 401 || response.status === 403) return { ok: false as const, error: "La clave de Resend no es válida." };
  if (/domain|from/i.test(message)) return { ok: false as const, error: "El remitente de Resend no está verificado. Revisa RESEND_FROM_EMAIL." };
  return { ok: false as const, error: "No pudimos enviar el código. Inténtalo de nuevo." };
}
