"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { EstadoPedido } from "@/lib/types";

export interface PedidoFormState {
  error?: string;
}

interface ItemConPrecio {
  producto_id: string;
  cantidad: number;
  precio_unitario_en_el_momento: number;
}

/**
 * Construye los items del pedido a partir del FormData, buscando el precio
 * ACTUAL de cada producto en la base (nunca se confía en un precio enviado
 * desde el cliente) y calculando el monto_total de forma autoritativa.
 */
async function construirItems(formData: FormData): Promise<{ items: ItemConPrecio[]; montoTotal: number }> {
  const productoIds = formData.getAll("producto_id").map(String);
  const cantidadesRaw = formData.getAll("cantidad").map(String);

  const items: { producto_id: string; cantidad: number }[] = [];
  for (let i = 0; i < productoIds.length; i++) {
    const productoId = productoIds[i];
    const cantidad = parseFloat((cantidadesRaw[i] || "0").replace(",", "."));
    if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    items.push({ producto_id: productoId, cantidad });
  }

  if (items.length === 0) {
    throw new Error("Agrega al menos un producto al pedido.");
  }

  const supabase = getSupabaseAdmin();
  const ids = [...new Set(items.map((i) => i.producto_id))];
  const { data: productos, error } = await supabase.from("productos").select("id, precio_venta").in("id", ids);
  if (error || !productos) throw new Error("No se pudieron cargar los precios de los productos.");

  const precioPorId = new Map(productos.map((p) => [p.id as string, p.precio_venta as number]));

  const itemsConPrecio: ItemConPrecio[] = items.map((i) => {
    const precio = precioPorId.get(i.producto_id);
    if (precio === undefined) throw new Error("Uno de los productos seleccionados ya no existe.");
    return { ...i, precio_unitario_en_el_momento: precio };
  });

  const montoTotal = itemsConPrecio.reduce(
    (sum, i) => sum + Math.round(i.precio_unitario_en_el_momento * i.cantidad),
    0
  );

  return { items: itemsConPrecio, montoTotal };
}

function revalidarTodo(pedidoId?: string) {
  revalidatePath("/pedidos");
  if (pedidoId) revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/");
  revalidatePath("/agenda");
  revalidatePath("/inventario");
  revalidatePath("/finanzas");
}

export async function crearPedido(_prevState: PedidoFormState, formData: FormData): Promise<PedidoFormState> {
  const nombre_cliente = String(formData.get("nombre_cliente") || "").trim();
  const telefono_cliente = String(formData.get("telefono_cliente") || "").trim() || null;
  const fecha_entrega = String(formData.get("fecha_entrega") || "");
  const hora_entrega = String(formData.get("hora_entrega") || "") || null;
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!nombre_cliente) return { error: "El nombre del cliente es obligatorio." };
  if (!fecha_entrega) return { error: "La fecha de entrega es obligatoria." };

  let items: ItemConPrecio[];
  let montoTotal: number;
  try {
    ({ items, montoTotal } = await construirItems(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al procesar los productos." };
  }

  const supabase = getSupabaseAdmin();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .insert({ nombre_cliente, telefono_cliente, fecha_entrega, hora_entrega, notas, monto_total: montoTotal })
    .select("id")
    .single();

  if (error || !pedido) return { error: "No se pudo crear el pedido. Intenta de nuevo." };

  const { error: itemsError } = await supabase.from("pedido_items").insert(
    items.map((i) => ({
      pedido_id: pedido.id,
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario_en_el_momento: i.precio_unitario_en_el_momento,
    }))
  );

  if (itemsError) {
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    return { error: "No se pudieron guardar los productos del pedido." };
  }

  revalidarTodo(pedido.id);
  redirect(`/pedidos/${pedido.id}`);
}

export async function actualizarPedido(_prevState: PedidoFormState, formData: FormData): Promise<PedidoFormState> {
  const id = String(formData.get("id") || "");
  const nombre_cliente = String(formData.get("nombre_cliente") || "").trim();
  const telefono_cliente = String(formData.get("telefono_cliente") || "").trim() || null;
  const fecha_entrega = String(formData.get("fecha_entrega") || "");
  const hora_entrega = String(formData.get("hora_entrega") || "") || null;
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!id) return { error: "Pedido inválido." };
  if (!nombre_cliente) return { error: "El nombre del cliente es obligatorio." };
  if (!fecha_entrega) return { error: "La fecha de entrega es obligatoria." };

  const supabase = getSupabaseAdmin();
  const { data: actual, error: fetchError } = await supabase
    .from("pedidos")
    .select("estado")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !actual) return { error: "No se encontró el pedido." };
  if (actual.estado === "completado" || actual.estado === "cancelado") {
    return { error: "No se puede editar un pedido completado o cancelado." };
  }

  let items: ItemConPrecio[];
  let montoTotal: number;
  try {
    ({ items, montoTotal } = await construirItems(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al procesar los productos." };
  }

  const { error: updateError } = await supabase
    .from("pedidos")
    .update({ nombre_cliente, telefono_cliente, fecha_entrega, hora_entrega, notas, monto_total: montoTotal })
    .eq("id", id);

  if (updateError) return { error: "No se pudo actualizar el pedido." };

  const { error: deleteError } = await supabase.from("pedido_items").delete().eq("pedido_id", id);
  if (deleteError) return { error: "No se pudieron actualizar los productos del pedido." };

  const { error: insertError } = await supabase.from("pedido_items").insert(
    items.map((i) => ({
      pedido_id: id,
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario_en_el_momento: i.precio_unitario_en_el_momento,
    }))
  );
  if (insertError) return { error: "No se pudieron guardar los productos del pedido." };

  revalidarTodo(id);
  redirect(`/pedidos/${id}`);
}

/**
 * Cambia el estado del pedido. Completar y cancelar se delegan a funciones
 * de PostgreSQL (fn_completar_pedido / fn_cancelar_pedido) que descuentan o
 * revierten insumos y crean/anulan el movimiento financiero de forma
 * atómica. Ver supabase/schema.sql.
 */
export async function cambiarEstadoPedido(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const nuevoEstado = String(formData.get("estado") || "") as EstadoPedido;
  if (!id || !nuevoEstado) return;

  const supabase = getSupabaseAdmin();

  if (nuevoEstado === "completado") {
    const { error } = await supabase.rpc("fn_completar_pedido", { p_pedido_id: id });
    if (error) throw new Error(error.message);
  } else if (nuevoEstado === "cancelado") {
    const { error } = await supabase.rpc("fn_cancelar_pedido", { p_pedido_id: id });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", id);
    if (error) throw new Error(error.message);
  }

  revalidarTodo(id);
}
