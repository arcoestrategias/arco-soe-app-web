// /shared/utils/month-helpers.ts
export type YM = { year: number; month: number };

const ES_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function ymToStr(y: number, m: number): string {
  const mm = String(m).padStart(2, "0");
  return `${y}-${mm}-01`;
}

export function monthLabel(m: number, y: number): string {
  const name = ES_MONTHS[(m - 1 + 12) % 12] ?? String(m);
  return `${name} - ${y}`;
}

export function enumerateMonths(startISO?: string, endISO?: string): YM[] {
  if (!startISO || !endISO) return [];
  const s = new Date(startISO);
  const e = new Date(endISO);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return [];
  // Normaliza a inicio de mes UTC
  const cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
  const endYM = e.getUTCFullYear() * 12 + e.getUTCMonth();
  const out: YM[] = [];
  while (cur.getUTCFullYear() * 12 + cur.getUTCMonth() <= endYM) {
    out.push({ year: cur.getUTCFullYear(), month: cur.getUTCMonth() + 1 });
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

// Devuelve los months del payload en base a frecuencia e intervalo.
export function deriveMonthsForPayload(
  periodStart: string,
  periodEnd: string,
  frequency?: "MES" | "TRI" | "QTR" | "STR" | "ANU" | "PER"
): YM[] {
  if (!periodStart || !periodEnd) return [];
  if (frequency === "PER") {
    // personalizado: el usuario elige; no derivamos nada automáticamente
    return [];
  }
  const step =
    frequency === "TRI"
      ? 3
      : frequency === "QTR"
      ? 4
      : frequency === "STR"
      ? 6
      : frequency === "ANU"
      ? 12
      : 1; // MES por defecto

  const s = new Date(periodStart);
  const e = new Date(periodEnd);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return [];

  let y = s.getUTCFullYear();
  let m = s.getUTCMonth() + 1; // 1..12
  const endYM = e.getUTCFullYear() * 12 + e.getUTCMonth();

  const out: YM[] = [];
  while (y * 12 + (m - 1) <= endYM) {
    out.push({ year: y, month: m });
    // avanza "step" meses
    const next = new Date(Date.UTC(y, m - 1, 1));
    next.setUTCMonth(next.getUTCMonth() + step);
    y = next.getUTCFullYear();
    m = next.getUTCMonth() + 1;
  }
  return out;
}

// Normaliza cualquier ISO a inicio de mes
export function toMonthStart(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return ymToStr(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

export function enumerateEndMonthsByFrequency(
  periodStart?: string,
  planEnd?: string,
  frequency?: "MES" | "TRI" | "QTR" | "STR" | "ANU" | "PER"
) {
  if (!periodStart || !planEnd) return [];
  // PER: puede terminar en cualquier mes dentro del rango
  if (!frequency || frequency === "PER") {
    return enumerateMonths(periodStart, planEnd);
  }
  // Para el resto, solo meses que caen cada "step" desde el inicio
  return deriveMonthsForPayload(periodStart, planEnd, frequency);
}
