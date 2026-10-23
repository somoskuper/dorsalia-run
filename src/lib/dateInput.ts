/** Date helpers for keyboard-friendly DD/MM/YYYY fields (avoid native type=date typing bugs). */

export function formatDateDisplay(iso: string): string {
  const m = String(iso || '')
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function sanitizeDateTyping(raw: string): string {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseDateDisplay(raw: string): string | null {
  const t = String(raw ?? '').trim();
  if (!t) return null;

  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return validYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const slash = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!slash) return null;
  let y = Number(slash[3]);
  const mo = Number(slash[2]);
  const d = Number(slash[1]);
  if (slash[3].length === 2) y += y >= 70 ? 1900 : 2000;
  return validYmd(y, mo, d);
}

function validYmd(y: number, mo: number, d: number): string | null {
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
