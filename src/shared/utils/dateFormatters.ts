import dayjs from "dayjs";

/** YYYY-MM-DD (o ISO) -> Date local (evita shift por zona horaria) */
export function parseYmdOrIsoToLocalDate(s?: string | null): Date | undefined {
  if (!s) return undefined;
  const ymd = s.includes("T") ? s.slice(0, 10) : s;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date -> 'YYYY-MM-DD' (si no es válida, undefined) */
export function toYmd(date?: Date | null): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return dayjs(date).format("YYYY-MM-DD");
}

/** 'YYYY-MM-DD' -> ISO 'YYYY-MM-DDT00:00:00.000Z' (si necesitas UTC para algún endpoint) */
export function ymdToIsoUtc(ymd?: string | null): string | undefined {
  return ymd ? `${ymd}T00:00:00.000Z` : undefined;
}

/** Render para badges (lectura) */
export function formatDateBadge(s?: string | null): string {
  const ymd = s ? (s.includes("T") ? s.slice(0, 10) : s) : undefined;
  return ymd ? dayjs(ymd).format("DD/MM/YYYY") : "-";
}

/** Rango de proyecto (strings) -> límites como Date locales */
export function projectRangeToDates(
  fromYmd?: string | null,
  untilYmd?: string | null
): { min?: Date; max?: Date } {
  return {
    min: parseYmdOrIsoToLocalDate(fromYmd ?? undefined),
    max: parseYmdOrIsoToLocalDate(untilYmd ?? undefined),
  };
}

/** Recorta un Date a [min, max] (si existen) */
export function clampDate(d: Date, min?: Date, max?: Date): Date {
  let x = d;
  if (min && x < min) x = min;
  if (max && x > max) x = max;
  return x;
}

/** Hoy → 'YYYY-MM-DD', recortado al rango del proyecto si corresponde */
export function todayClampedYmd(min?: Date, max?: Date): string {
  const today = clampDate(new Date(), min, max);
  return dayjs(today).format("YYYY-MM-DD");
}
