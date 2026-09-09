"use client";

import { useActionState, useMemo, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { PedidoFormState } from "@/app/(app)/pedidos/actions";
import type { PedidoConItems, Producto } from "@/lib/types";
import { formatMoney } from "@/lib/money";

interface ItemRow {
  key: string;
  producto_id: string;
  cantidad: string;
}

let rowId = 0;
function newRow(producto_id = "", cantidad = "1"): ItemRow {
  rowId += 1;
  return { key: `row-${rowId}`, producto_id, cantidad };
}

export default function PedidoForm({
  action,
  productos,
  pedido,
}: {
  action: (prevState: PedidoFormState, formData: FormData) => Promise<PedidoFormState>;
  productos: Producto[];
  pedido?: PedidoConItems;
}) {
  const [state, formAction, pending] = useActionState(action, {} as PedidoFormState);

  const [rows, setRows] = useState<ItemRow[]>(() =>
    pedido && pedido.pedido_items.length > 0
      ? pedido.pedido_items.map((item) => newRow(item.producto_id, String(item.cantidad)))
      : [newRow()]
  );

  const precioPorId = useMemo(() => new Map(productos.map((p) => [p.id, p.precio_venta])), [productos]);

  const totalEstimado = rows.reduce((sum, r) => {
    const precio = precioPorId.get(r.producto_id) || 0;
    const cantidad = parseFloat(r.cantidad.replace(",", ".")) || 0;
    return sum + Math.round(precio * cantidad);
  }, 0);

  function addRow() {
    setRows((rs) => [...rs, newRow()]);
  }

  function removeRow(key: string) {
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.key !== key)));
  }

  function updateRow(key: string, patch: Partial<ItemRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <form action={formAction} className="space-y-4 px-4 pb-28 pt-4">
      {pedido && <input type="hidden" name="id" value={pedido.id} />}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Nombre del cliente *</label>
        <input
          name="nombre_cliente"
          required
          defaultValue={pedido?.nombre_cliente}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          placeholder="Ej. María Pérez"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Teléfono</label>
        <input
          name="telefono_cliente"
          type="tel"
          defaultValue={pedido?.telefono_cliente ?? ""}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          placeholder="Ej. 555 123 4567"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Fecha de entrega *</label>
          <input
            name="fecha_entrega"
            type="date"
            required
            defaultValue={pedido?.fecha_entrega}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Hora</label>
          <input
            name="hora_entrega"
            type="time"
            defaultValue={pedido?.hora_entrega?.slice(0, 5) ?? ""}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-[var(--color-ink)]">Productos *</label>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)]"
          >
            <Plus size={14} /> Agregar producto
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((row) => {
            const precio = precioPorId.get(row.producto_id) || 0;
            const cantidad = parseFloat(row.cantidad.replace(",", ".")) || 0;
            return (
              <div key={row.key} className="rounded-xl border border-black/10 bg-white p-3">
                <div className="flex items-center gap-2">
                  <select
                    name="producto_id"
                    required
                    value={row.producto_id}
                    onChange={(e) => updateRow(row.key, { producto_id: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-sm"
                  >
                    <option value="">Selecciona un producto</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — {formatMoney(p.precio_venta)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="shrink-0 rounded-lg p-2 text-[var(--color-danger)]"
                    aria-label="Quitar producto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateRow(row.key, { cantidad: String(Math.max(1, cantidad - 1)) })
                      }
                      className="rounded-lg bg-[var(--color-bg)] p-1.5"
                      aria-label="Restar"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      name="cantidad"
                      type="number"
                      min="0.001"
                      step="any"
                      required
                      value={row.cantidad}
                      onChange={(e) => updateRow(row.key, { cantidad: e.target.value })}
                      className="w-16 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-1.5 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateRow(row.key, { cantidad: String(cantidad + 1) })}
                      className="rounded-lg bg-[var(--color-bg)] p-1.5"
                      aria-label="Sumar"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {formatMoney(Math.round(precio * cantidad))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-[var(--color-accent-soft)] px-4 py-3">
        <span className="text-sm font-medium text-[var(--color-ink)]">Total estimado</span>
        <span className="text-lg font-semibold text-[var(--color-accent)]">{formatMoney(totalEstimado)}</span>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Notas</label>
        <textarea
          name="notas"
          rows={3}
          defaultValue={pedido?.notas ?? ""}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          placeholder="Ej. sin nueces, dedicatoria 'Feliz cumpleaños'..."
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Guardando..." : pedido ? "Guardar cambios" : "Crear pedido"}
      </button>
    </form>
  );
}
