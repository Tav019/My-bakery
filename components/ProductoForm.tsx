"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ProductoFormState } from "@/app/(app)/productos/actions";
import type { Insumo, Producto, Receta } from "@/lib/types";
import { formatMoney } from "@/lib/money";

interface RecetaRow {
  key: string;
  insumo_id: string;
  cantidad: string;
}

let rowId = 0;
function newRow(insumo_id = "", cantidad = ""): RecetaRow {
  rowId += 1;
  return { key: `receta-${rowId}`, insumo_id, cantidad };
}

export default function ProductoForm({
  action,
  insumos,
  producto,
  receta,
}: {
  action: (prevState: ProductoFormState, formData: FormData) => Promise<ProductoFormState>;
  insumos: Insumo[];
  producto?: Producto;
  receta?: Receta[];
}) {
  const [state, formAction, pending] = useActionState(action, {} as ProductoFormState);
  const [rows, setRows] = useState<RecetaRow[]>(() =>
    receta && receta.length > 0
      ? receta.map((r) => newRow(r.insumo_id, String(r.cantidad_necesaria)))
      : []
  );
  const [precioVenta, setPrecioVenta] = useState(
    producto ? (producto.precio_venta / 100).toFixed(2) : ""
  );
  const [preview, setPreview] = useState<string | null>(producto?.imagen_url ?? null);

  const insumoPorId = useMemo(() => new Map(insumos.map((i) => [i.id, i])), [insumos]);

  const costoEstimado = rows.reduce((total, r) => {
    const insumo = insumoPorId.get(r.insumo_id);
    const cantidad = parseFloat(r.cantidad.replace(",", ".")) || 0;
    return total + Math.round(cantidad * (insumo?.costo_por_unidad ?? 0));
  }, 0);

  const precioCentavos = Math.round((parseFloat(precioVenta.replace(",", ".")) || 0) * 100);
  const margen = precioCentavos - costoEstimado;
  const margenPorcentaje = precioCentavos > 0 ? (margen / precioCentavos) * 100 : 0;

  function addRow() {
    setRows((rs) => [...rs, newRow()]);
  }
  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }
  function updateRow(key: string, patch: Partial<RecetaRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function handleImagenChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={formAction} className="space-y-4 px-4 pb-10 pt-4">
      {producto && <input type="hidden" name="id" value={producto.id} />}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Nombre *</label>
        <input
          name="nombre"
          required
          defaultValue={producto?.nombre}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          placeholder="Ej. Torta de chocolate"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Descripción</label>
        <textarea
          name="descripcion"
          rows={2}
          defaultValue={producto?.descripcion ?? ""}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Precio de venta *</label>
        <input
          name="precio_venta"
          type="number"
          min="0"
          step="0.01"
          required
          value={precioVenta}
          onChange={(e) => setPrecioVenta(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Imagen</label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vista previa" className="mb-2 h-32 w-32 rounded-xl object-cover" />
        )}
        <input
          name="imagen"
          type="file"
          accept="image/*"
          onChange={handleImagenChange}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
        <input type="checkbox" name="activo" defaultChecked={producto?.activo ?? true} className="h-4 w-4" />
        Producto activo (disponible para pedidos)
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-[var(--color-ink)]">Receta (insumos)</label>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)]"
          >
            <Plus size={14} /> Agregar insumo
          </button>
        </div>

        {insumos.length === 0 ? (
          <p className="text-xs text-[var(--color-ink-muted)]">
            No hay insumos registrados. Crea insumos en Inventario para poder armar la receta.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => {
              const insumo = insumoPorId.get(row.insumo_id);
              return (
                <div key={row.key} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-2">
                  <select
                    name="receta_insumo_id"
                    value={row.insumo_id}
                    onChange={(e) => updateRow(row.key, { insumo_id: e.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-sm"
                  >
                    <option value="">Selecciona insumo</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({i.unidad_medida})
                      </option>
                    ))}
                  </select>
                  <input
                    name="receta_cantidad"
                    type="number"
                    min="0.001"
                    step="any"
                    value={row.cantidad}
                    onChange={(e) => updateRow(row.key, { cantidad: e.target.value })}
                    placeholder={insumo?.unidad_medida || "cant."}
                    className="w-20 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="shrink-0 rounded-lg p-2 text-[var(--color-danger)]"
                    aria-label="Quitar insumo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl bg-[var(--color-accent-soft)] p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink)]">Costo estimado de receta</span>
            <span className="font-semibold text-[var(--color-ink)]">{formatMoney(costoEstimado)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-[var(--color-ink)]">Margen</span>
            <span
              className={`font-semibold ${margen >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}
            >
              {formatMoney(margen)} ({margenPorcentaje.toFixed(0)}%)
            </span>
          </div>
        </div>
      )}

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}
