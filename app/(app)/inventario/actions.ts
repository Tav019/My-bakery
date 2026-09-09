"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { inputToCents } from "@/lib/money";

export interface InsumoFormState {
  error?: string;
}

function revalidarInventario(insumoId?: string) {
  revalidatePath("/inventario");
  if (insumoId) revalidatePath(`/inventario/${insumoId}`);
  revalidatePath("/");
  revalidatePath("/finanzas");
}

function parseCantidad(value: FormDataEntryValue | null): number {
  const parsed = parseFloat(String(value || "0").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function crearInsumo(_prevState: InsumoFormState, formData: FormData): Promise<InsumoFormState> {
  const nombre = String(formData.get("nombre") || "").trim();
  const unidad_medida = String(formData.get("unidad_medida") || "").trim();
  const cantidad_actual = parseCantidad(formData.get("cantidad_actual"));
  const cantidad_minima = parseCantidad(formData.get("cantidad_minima"));
  const costo_por_unidad = inputToCents(String(formData.get("costo_por_unidad") || "0"));

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!unidad_medida) return { error: "La unidad de medida es obligatoria." };
  if (cantidad_actual < 0 || cantidad_minima < 0) return { error: "Las cantidades no pueden ser negativas." };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("insumos")
    .insert({ nombre, unidad_medida, cantidad_actual, cantidad_minima, costo_por_unidad })
    .select("id")
    .single();

  if (error || !data) return { error: "No se pudo crear el insumo. Intenta de nuevo." };

  revalidarInventario(data.id);
  redirect(`/inventario/${data.id}`);
}

export async function actualizarInsumo(_prevState: InsumoFormState, formData: FormData): Promise<InsumoFormState> {
  const id = String(formData.get("id") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const unidad_medida = String(formData.get("unidad_medida") || "").trim();
  const cantidad_minima = parseCantidad(formData.get("cantidad_minima"));
  const costo_por_unidad = inputToCents(String(formData.get("costo_por_unidad") || "0"));

  if (!id) return { error: "Insumo inválido." };
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!unidad_medida) return { error: "La unidad de medida es obligatoria." };
  if (cantidad_minima < 0) return { error: "La cantidad mínima no puede ser negativa." };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("insumos")
    .update({ nombre, unidad_medida, cantidad_minima, costo_por_unidad })
    .eq("id", id);

  if (error) return { error: "No se pudo actualizar el insumo." };

  revalidarInventario(id);
  redirect(`/inventario/${id}`);
}

export async function registrarCompra(_prevState: InsumoFormState, formData: FormData): Promise<InsumoFormState> {
  const insumo_id = String(formData.get("insumo_id") || "");
  const cantidad_comprada = parseCantidad(formData.get("cantidad_comprada"));
  const costo_total = inputToCents(String(formData.get("costo_total") || "0"));
  const fecha = String(formData.get("fecha") || "") || undefined;

  if (!insumo_id) return { error: "Insumo inválido." };
  if (cantidad_comprada <= 0) return { error: "La cantidad comprada debe ser mayor a 0." };
  if (costo_total < 0) return { error: "El costo total no puede ser negativo." };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("fn_registrar_compra_insumo", {
    p_insumo_id: insumo_id,
    p_cantidad: cantidad_comprada,
    p_costo_total: costo_total,
    p_fecha: fecha,
  });

  if (error) return { error: `No se pudo registrar la compra: ${error.message}` };

  revalidarInventario(insumo_id);
  redirect(`/inventario/${insumo_id}`);
}

export async function anularCompra(formData: FormData): Promise<void> {
  const compraId = String(formData.get("compra_id") || "");
  const insumoId = String(formData.get("insumo_id") || "");
  if (!compraId) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("fn_anular_compra_insumo", { p_compra_id: compraId });
  if (error) throw new Error(error.message);

  revalidarInventario(insumoId);
}
