"use client";

import { useActionState, useState } from "react";
import { ShoppingBasket, X } from "lucide-react";
import { registrarCompra, type InsumoFormState } from "@/app/(app)/inventario/actions";
import type { Insumo } from "@/lib/types";

export default function RegistrarCompraForm({ insumo, defaultOpen }: { insumo: Insumo; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [state, formAction, pending] = useActionState(registrarCompra, {} as InsumoFormState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
      >
        <ShoppingBasket size={16} />
        Registrar compra
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <input type="hidden" name="insumo_id" value={insumo.id} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Registrar compra</h3>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
          <X size={16} className="text-[var(--color-ink-muted)]" />
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">
          Cantidad comprada ({insumo.unidad_medida}) *
        </label>
        <input
          name="cantidad_comprada"
          type="number"
          min="0.001"
          step="any"
          required
          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Costo total *</label>
        <input
          name="costo_total"
          type="number"
          min="0"
          step="0.01"
          required
          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Fecha</label>
        <input
          name="fecha"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base"
        />
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar compra"}
      </button>
      <p className="text-center text-[11px] text-[var(--color-ink-muted)]">
        Se sumará al stock y se registrará automáticamente como gasto en Finanzas.
      </p>
    </form>
  );
}
