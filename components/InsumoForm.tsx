"use client";

import { useActionState } from "react";
import type { InsumoFormState } from "@/app/(app)/inventario/actions";
import type { Insumo } from "@/lib/types";
import { centsToInputValue } from "@/lib/money";

const UNIDADES_SUGERIDAS = ["g", "kg", "ml", "l", "unidad"];

export default function InsumoForm({
  action,
  insumo,
}: {
  action: (prevState: InsumoFormState, formData: FormData) => Promise<InsumoFormState>;
  insumo?: Insumo;
}) {
  const [state, formAction, pending] = useActionState(action, {} as InsumoFormState);

  return (
    <form action={formAction} className="space-y-4 px-4 py-4">
      {insumo && <input type="hidden" name="id" value={insumo.id} />}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Nombre *</label>
        <input
          name="nombre"
          required
          defaultValue={insumo?.nombre}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          placeholder="Ej. Harina de trigo"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Unidad de medida *</label>
        <input
          name="unidad_medida"
          required
          list="unidades-sugeridas"
          defaultValue={insumo?.unidad_medida}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          placeholder="Ej. kg"
        />
        <datalist id="unidades-sugeridas">
          {UNIDADES_SUGERIDAS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
      </div>

      {!insumo && (
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Cantidad actual</label>
          <input
            name="cantidad_actual"
            type="number"
            min="0"
            step="any"
            defaultValue="0"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">
          Cantidad mínima (alerta de reabastecimiento) *
        </label>
        <input
          name="cantidad_minima"
          type="number"
          min="0"
          step="any"
          required
          defaultValue={insumo?.cantidad_minima ?? 0}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[var(--color-ink)]">Costo por unidad</label>
        <input
          name="costo_por_unidad"
          type="number"
          min="0"
          step="0.01"
          defaultValue={insumo ? centsToInputValue(insumo.costo_por_unidad) : "0"}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-base"
        />
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Usado para calcular el costo estimado de las recetas.
        </p>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-base font-semibold text-white active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Guardando..." : insumo ? "Guardar cambios" : "Crear insumo"}
      </button>
    </form>
  );
}
