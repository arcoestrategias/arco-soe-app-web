import { format } from "date-fns";
import { es } from "date-fns/locale";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateRange(from?: Date, to?: Date): string {
  if (!from || !to) return "Seleccionar fechas";

  const sameYear = from.getFullYear() === to.getFullYear();
  const sameMonth = sameYear && from.getMonth() === to.getMonth();

  if (sameMonth) {
    return `${format(from, "dd", { locale: es })} - ${format(
      to,
      "dd MMM yyyy",
      { locale: es }
    )}`;
  }

  if (sameYear) {
    return `${format(from, "dd MMM", { locale: es })} - ${format(
      to,
      "dd MMM yyyy",
      { locale: es }
    )}`;
  }

  return `${format(from, "dd MMM yyyy", { locale: es })} - ${format(
    to,
    "dd MMM yyyy",
    { locale: es }
  )}`;
}
