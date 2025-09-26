// /shared/utils/pick-plan-dates.ts
type PlanLike = {
  fromAt?: string | null;
  untilAt?: string | null;
  period?: number | null; // opcional, por si quieres fallback futuro
};

function toMonthStart(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function pickPlanDates(plan?: PlanLike | null) {
  const startISO = toMonthStart(plan?.fromAt);
  const endISO = toMonthStart(plan?.untilAt);
  return { startISO, endISO };
}
