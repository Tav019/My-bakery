import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function diasHastaEntrega(fechaISO: string): number {
  return differenceInCalendarDays(parseISO(fechaISO), new Date());
}

export function formatFechaCorta(fechaISO: string): string {
  return format(parseISO(fechaISO), "d MMM", { locale: es });
}

export function formatFechaLarga(fechaISO: string): string {
  return format(parseISO(fechaISO), "EEEE d 'de' MMMM", { locale: es });
}

export function formatHora(hora: string | null): string {
  if (!hora) return "";
  const [h, m] = hora.split(":");
  const hourNum = parseInt(h, 10);
  const suffix = hourNum >= 12 ? "pm" : "am";
  const hour12 = ((hourNum + 11) % 12) + 1;
  return `${hour12}:${m} ${suffix}`;
}

export function etiquetaUrgencia(dias: number): { label: string; tone: "rojo" | "amarillo" | "neutro" } {
  if (dias <= 1) return { label: dias === 0 ? "Hoy" : "Mañana", tone: "rojo" };
  if (dias <= 3) return { label: `En ${dias} días`, tone: "amarillo" };
  return { label: `En ${dias} días`, tone: "neutro" };
}
