/** 32 estados de México + CDMX — valores guardados en athlete profile `residence`. */
export const MX_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
] as const;

export type MxState = (typeof MX_STATES)[number];

/** Common city / alias → estado for “Cerca de ti” matching. */
const CITY_TO_STATE: Record<string, MxState> = {
  cdmx: "Ciudad de México",
  "ciudad de mexico": "Ciudad de México",
  "ciudad de méxico": "Ciudad de México",
  mexico: "Ciudad de México",
  "méxico": "Ciudad de México",
  "df": "Ciudad de México",
  guadalajara: "Jalisco",
  zapopan: "Jalisco",
  tijuana: "Baja California",
  mexicali: "Baja California",
  monterrey: "Nuevo León",
  "san pedro": "Nuevo León",
  puebla: "Puebla",
  merida: "Yucatán",
  mérida: "Yucatán",
  cancun: "Quintana Roo",
  cancún: "Quintana Roo",
  "playa del carmen": "Quintana Roo",
  leon: "Guanajuato",
  león: "Guanajuato",
  queretaro: "Querétaro",
  querétaro: "Querétaro",
  toluca: "Estado de México",
  "estado de mexico": "Estado de México",
  "estado de méxico": "Estado de México",
  edomex: "Estado de México",
  veracruz: "Veracruz",
  oaxaca: "Oaxaca",
  morelia: "Michoacán",
  culican: "Sinaloa",
  culiacan: "Sinaloa",
  culiacán: "Sinaloa",
  hermosillo: "Sonora",
  chihuahua: "Chihuahua",
  saltillo: "Coahuila",
  tampico: "Tamaulipas",
  "san luis": "San Luis Potosí",
  "san luis potosi": "San Luis Potosí",
  "san luis potosí": "San Luis Potosí",
  acapulco: "Guerrero",
  cuernavaca: "Morelos",
  villahermosa: "Tabasco",
  campeche: "Campeche",
  chetumal: "Quintana Roo",
  "la paz": "Baja California Sur",
  "cabo san lucas": "Baja California Sur",
  "los cabos": "Baja California Sur",
};

function fold(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export function isMxState(value: string | null | undefined): value is MxState {
  if (!value) return false;
  return (MX_STATES as readonly string[]).includes(value);
}

/** True if event place text matches the athlete's selected Mexican state. */
export function eventMatchesResidence(
  placeParts: Array<string | null | undefined>,
  residence: string | null | undefined,
): boolean {
  if (!residence) return false;
  const target = fold(residence);
  const blob = fold(placeParts.filter(Boolean).join(" "));
  if (!blob) return false;
  if (blob.includes(target)) return true;

  // CDMX aliases
  if (target.includes("ciudad de mexico") || target === "cdmx") {
    if (/\b(cdmx|df|ciudad de mexico)\b/.test(blob)) return true;
  }

  for (const part of placeParts) {
    if (!part) continue;
    const mapped = CITY_TO_STATE[fold(part)];
    if (mapped && fold(mapped) === target) return true;
    // also try first token of "City, State"
    const first = fold(part.split(",")[0] || "");
    const mappedFirst = CITY_TO_STATE[first];
    if (mappedFirst && fold(mappedFirst) === target) return true;
  }
  return false;
}
