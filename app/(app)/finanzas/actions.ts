"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { inputToCents } from "@/lib/money";
import type { TipoMovimiento } from "@/lib/types";

export interface MovimientoFormState {
  error?: string;
  success?: boolean;
}

function revalidarFinanzas() {
  revalidatePath("/finanzas");
  revalidatePath("/");
}

export async function crearMovimientoManual(
  _prevState: MovimientoFormState,
  formData: FormData
): Promise<MovimientoFormState> {
  const tipo = String(formData.get("tipo") || "") as TipoMovimiento;
  const monto = inputToCents(String(formData.get("monto") || "0"));
  const concepto = String(formData.get("concepto") || "").trim();
  const categoria = String(formData.get("categoria") || "otro").trim() || "otro";
  const fecha = String(formData.get("fecha") || "") || new Date().toISOString().slice(0, 10);

  if (tipo !== "ingreso" && tipo !== "gasto") return { error: "Selecciona el tipo de movimiento." };
  if (!concepto) return { error: "El concepto es obligatorio." };
  if (monto <= 0) return { error: "El monto debe ser mayor a 0." };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("movimientos_financieros")
    .insert({ tipo, monto, concepto, categoria, fecha, es_automatico: false });

  if (error) return { error: "No se pudo registrar el movimiento." };

  revalidarFinanzas();
  return { success: true };
}

export async function eliminarMovimientoManual(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { data: movimiento, error: fetchError } = await supabase
    .from("movimientos_financieros")
    .select("es_automatico")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !movimiento) throw new Error("Movimiento no encontrado.");
  if (movimiento.es_automatico) {
    throw new Error(
      "Este movimiento se generó automáticamente. Para anularlo, cancela el pedido o la compra asociada."
    );
  }

  const { error } = await supabase.from("movimientos_financieros").delete().eq("id", id);
  if (error) throw new Error("No se pudo eliminar el movimiento.");

  revalidarFinanzas();
}
