export type EstadoPedido = "pendiente" | "en_preparacion" | "completado" | "cancelado";
export type TipoMovimiento = "ingreso" | "gasto";

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_venta: number; // centavos
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
}

export interface Insumo {
  id: string;
  nombre: string;
  unidad_medida: string;
  cantidad_actual: number;
  cantidad_minima: number;
  costo_por_unidad: number; // centavos
  created_at: string;
}

export interface Receta {
  id: string;
  producto_id: string;
  insumo_id: string;
  cantidad_necesaria: number;
  insumo?: Insumo;
}

export interface Pedido {
  id: string;
  nombre_cliente: string;
  telefono_cliente: string | null;
  fecha_entrega: string; // YYYY-MM-DD
  hora_entrega: string | null; // HH:MM:SS
  estado: EstadoPedido;
  notas: string | null;
  monto_total: number; // centavos
  created_at: string;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario_en_el_momento: number; // centavos
  producto?: Producto;
}

export interface PedidoConItems extends Pedido {
  pedido_items: PedidoItem[];
}

export interface MovimientoFinanciero {
  id: string;
  tipo: TipoMovimiento;
  monto: number; // centavos
  concepto: string;
  categoria: string;
  pedido_id: string | null;
  insumo_id: string | null;
  fecha: string;
  created_at: string;
  es_automatico: boolean;
  anulado: boolean;
  pedidos?: Pick<Pedido, "id" | "nombre_cliente"> | null;
  insumos?: Pick<Insumo, "id" | "nombre"> | null;
}

export interface CompraInsumo {
  id: string;
  insumo_id: string;
  cantidad_comprada: number;
  costo_total: number; // centavos
  fecha: string;
  created_at: string;
  anulada: boolean;
  insumos?: Pick<Insumo, "id" | "nombre" | "unidad_medida"> | null;
}

export const ESTADOS_PEDIDO: { value: EstadoPedido; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_preparacion", label: "En preparación" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
];

export const CATEGORIAS_MOVIMIENTO = [
  "venta",
  "compra_insumo",
  "otro",
] as const;
