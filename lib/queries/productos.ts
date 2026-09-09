import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Producto, Receta } from "@/lib/types";

export async function listProductos(opts?: { soloActivos?: boolean }): Promise<Producto[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("productos").select("*").order("nombre", { ascending: true });
  if (opts?.soloActivos) query = query.eq("activo", true);

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar productos: ${error.message}`);
  return data as Producto[];
}

export async function getProducto(id: string): Promise<Producto | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("productos").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Error al cargar el producto: ${error.message}`);
  return data as Producto | null;
}

export async function listRecetaDeProducto(productoId: string): Promise<Receta[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("recetas")
    .select("*, insumo:insumos(*)")
    .eq("producto_id", productoId);

  if (error) throw new Error(`Error al cargar la receta: ${error.message}`);
  return data as unknown as Receta[];
}

/** Costo estimado del producto (centavos) sumando cantidad_necesaria * costo_por_unidad de su receta. */
export function calcularCostoReceta(receta: Receta[]): number {
  return receta.reduce((total, r) => {
    const costoUnidad = r.insumo?.costo_por_unidad ?? 0;
    return total + Math.round(r.cantidad_necesaria * costoUnidad);
  }, 0);
}
