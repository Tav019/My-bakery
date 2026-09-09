/**
 * Todos los montos de dinero se manejan como enteros en CENTAVOS
 * en la base de datos y en la lógica de negocio, para evitar errores
 * de redondeo de punto flotante. Estas utilidades convierten entre
 * centavos (almacenamiento/cálculo) y unidades "normales" (entrada/
 * visualización para el usuario).
 */

export function pesosToCents(pesos: number): number {
  if (!Number.isFinite(pesos)) return 0;
  return Math.round(pesos * 100);
}

export function centsToPesos(cents: number): number {
  return cents / 100;
}

export function formatMoney(cents: number | null | undefined): string {
  const value = centsToPesos(cents ?? 0);
  const formatted = Math.abs(value).toLocaleString("es", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}$${formatted}`;
}

/** Parsea un valor de <input type="number"> (string) a centavos. */
export function inputToCents(value: string): number {
  const parsed = parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return pesosToCents(parsed);
}

export function centsToInputValue(cents: number | null | undefined): string {
  return centsToPesos(cents ?? 0).toFixed(2);
}
