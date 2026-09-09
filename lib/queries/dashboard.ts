import "server-only";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Insumo, Pedido } from "@/lib/types";

export interface ResumenMes {
  ingresos: number; // centavos
  gastos: number; // centavos
  balance: number; // centavos
}

export async function getProximasEntregas(): Promise<Pedido[]> {
  const supabase = getSupabaseAdmin();
  const hoy = format(new Date(), "yyyy-MM-dd");
  const limite = format(addDays(new Date(), 3), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .gte("fecha_entrega", hoy)
    .lte("fecha_entrega", limite)
    .not("estado", "in", "(cancelado,completado)")
    .order("fecha_entrega", { ascending: true })
    .order("hora_entrega", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`Error al cargar próximas entregas: ${error.message}`);
  return data as Pedido[];
}

export async function getAlertasInventario(): Promise<Insumo[]> {
  const supabase = getSupabaseAdmin();
  // PostgREST no permite comparar dos columnas entre sí en un filtro simple,
  // así que se trae todo (la lista de insumos de un negocio familiar es
  // chica) y se filtra en el servidor.
  const { data, error } = await supabase.from("insumos").select("*").order("nombre", { ascending: true });

  if (error) throw new Error(`Error al cargar alertas de inventario: ${error.message}`);
  return (data as Insumo[]).filter((i) => i.cantidad_actual <= i.cantidad_minima);
}

export async function getResumenMes(): Promise<ResumenMes> {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const desde = format(startOfMonth(now), "yyyy-MM-dd");
  const hasta = format(endOfMonth(now), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("movimientos_financieros")
    .select("tipo, monto")
    .eq("anulado", false)
    .gte("fecha", desde)
    .lte("fecha", hasta);

  if (error) throw new Error(`Error al cargar el resumen del mes: ${error.message}`);

  let ingresos = 0;
  let gastos = 0;
  for (const m of data as { tipo: string; monto: number }[]) {
    if (m.tipo === "ingreso") ingresos += m.monto;
    else gastos += m.monto;
  }

  return { ingresos, gastos, balance: ingresos - gastos };
}
