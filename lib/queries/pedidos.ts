import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { EstadoPedido, PedidoConItems } from "@/lib/types";

export interface FiltrosPedidos {
  estado?: EstadoPedido | "todos";
  desde?: string;
  hasta?: string;
}

export async function listPedidos(filtros: FiltrosPedidos = {}): Promise<PedidoConItems[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("pedidos")
    .select("*, pedido_items(*, producto:productos(*))")
    .order("fecha_entrega", { ascending: true })
    .order("hora_entrega", { ascending: true, nullsFirst: false });

  if (filtros.estado && filtros.estado !== "todos") {
    query = query.eq("estado", filtros.estado);
  }
  if (filtros.desde) query = query.gte("fecha_entrega", filtros.desde);
  if (filtros.hasta) query = query.lte("fecha_entrega", filtros.hasta);

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar pedidos: ${error.message}`);
  return data as unknown as PedidoConItems[];
}

export async function getPedido(id: string): Promise<PedidoConItems | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, pedido_items(*, producto:productos(*))")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Error al cargar el pedido: ${error.message}`);
  return data as unknown as PedidoConItems | null;
}

export async function listPedidosPorRangoFechas(desde: string, hasta: string): Promise<PedidoConItems[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, pedido_items(*, producto:productos(*))")
    .gte("fecha_entrega", desde)
    .lte("fecha_entrega", hasta)
    .order("fecha_entrega", { ascending: true });

  if (error) throw new Error(`Error al cargar los pedidos del calendario: ${error.message}`);
  return data as unknown as PedidoConItems[];
}
