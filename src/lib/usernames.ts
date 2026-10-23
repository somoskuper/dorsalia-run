export const USERNAME_PATTERN = /^[a-z0-9]([a-z0-9._]{1,28}[a-z0-9])?$/;

export function normalizeUsername(value: string) {
  return value
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, 30);
}

export function usernameError(value: string) {
  if (!value) return "El username es obligatorio.";
  if (value.length < 3) return "Usa al menos 3 caracteres.";
  if (!USERNAME_PATTERN.test(value)) return "Usa letras, números, punto o guion bajo; empieza y termina con letra o número.";
  return null;
}
