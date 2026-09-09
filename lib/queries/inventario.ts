import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { CompraInsumo, Insumo } from "@/lib/types";

export type EstadoInsumo = "ok" | "bajo" | "critico";

export function getEstadoInsumo(insumo: Pick<Insumo, "cantidad_actual" | "cantidad_minima">): EstadoInsumo {
  if (insumo.cantidad_actual <= 0 || insumo.cantidad_actual <= insumo.cantidad_minima * 0.5) return "critico";
  if (insumo.cantidad_actual <= insumo.cantidad_minima) return "bajo";
  return "ok";
}

export async function listInsumos(): Promise<Insumo[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("insumos").select("*").order("nombre", { ascending: true });
  if (error) throw new Error(`Error al cargar insumos: ${error.message}`);
  return data as Insumo[];
}

export async function getInsumo(id: string): Promise<Insumo | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("insumos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Error al cargar el insumo: ${error.message}`);
  return data as Insumo | null;
}

export async function listComprasDeInsumo(insumoId: string): Promise<CompraInsumo[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("compras_insumos")
    .select("*")
    .eq("insumo_id", insumoId)
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error al cargar el historial de compras: ${error.message}`);
  return data as CompraInsumo[];
}
