import "server-only";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { MovimientoFinanciero, TipoMovimiento } from "@/lib/types";

export interface FiltrosMovimientos {
  tipo?: TipoMovimiento | "todos";
  categoria?: string;
  desde?: string;
  hasta?: string;
}

export async function listMovimientos(filtros: FiltrosMovimientos = {}): Promise<MovimientoFinanciero[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("movimientos_financieros")
    .select("*, pedidos(id, nombre_cliente), insumos(id, nombre)")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (filtros.tipo && filtros.tipo !== "todos") query = query.eq("tipo", filtros.tipo);
  if (filtros.categoria) query = query.eq("categoria", filtros.categoria);
  if (filtros.desde) query = query.gte("fecha", filtros.desde);
  if (filtros.hasta) query = query.lte("fecha", filtros.hasta);

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar movimientos: ${error.message}`);
  return data as unknown as MovimientoFinanciero[];
}

export interface PuntoMensual {
  mes: string; // "2026-01"
  etiqueta: string; // "ene"
  ingresos: number;
  gastos: number;
  balance: number;
}

/** Serie de los últimos `meses` meses (incluyendo el actual) para el gráfico. */
export async function getSerieMensual(meses = 6): Promise<PuntoMensual[]> {
  const supabase = getSupabaseAdmin();
  const hoy = new Date();
  const desde = format(startOfMonth(subMonths(hoy, meses - 1)), "yyyy-MM-dd");
  const hasta = format(endOfMonth(hoy), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("movimientos_financieros")
    .select("tipo, monto, fecha")
    .eq("anulado", false)
    .gte("fecha", desde)
    .lte("fecha", hasta);

  if (error) throw new Error(`Error al cargar la serie mensual: ${error.message}`);

  const buckets = new Map<string, { ingresos: number; gastos: number }>();
  for (let i = meses - 1; i >= 0; i--) {
    const key = format(subMonths(hoy, i), "yyyy-MM");
    buckets.set(key, { ingresos: 0, gastos: 0 });
  }

  for (const m of data as { tipo: TipoMovimiento; monto: number; fecha: string }[]) {
    const key = m.fecha.slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    if (m.tipo === "ingreso") bucket.ingresos += m.monto;
    else bucket.gastos += m.monto;
  }

  return Array.from(buckets.entries()).map(([mes, v]) => ({
    mes,
    etiqueta: format(new Date(`${mes}-01T00:00:00`), "MMM", { locale: es }),
    ingresos: v.ingresos,
    gastos: v.gastos,
    balance: v.ingresos - v.gastos,
  }));
}
