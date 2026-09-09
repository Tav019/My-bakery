"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { crearMovimientoManual, type MovimientoFormState } from "@/app/(app)/finanzas/actions";

export default function MovimientoForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(crearMovimientoManual, {} as MovimientoFormState);

  // Cierra el formulario al guardar con éxito. Se ajusta durante el render
  // (patrón recomendado por React) en vez de con useEffect, comparando
  // contra el último estado visto para no reabrirlo en renders posteriores.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.success) setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
      >
        <Plus size={18} />
        Registrar movimiento manual
      </button>
    );
  }

  return (
    <form action={formAction} className="mb-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">Nuevo movimiento manual</h3>
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">
          <X size={16} className="text-[var(--color-ink-muted)]" />
        </button>
      </div>

      <div className="flex gap-2">
        <label className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/10 py-2.5 text-sm font-medium has-[:checked]:border-[var(--color-success)] has-[:checked]:bg-[var(--color-success-soft)] has-[:checked]:text-[var(--color-success)]">
          <input type="radio" name="tipo" value="ingreso" defaultChecked className="hidden" />
          Ingreso
        </label>
        <label className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-black/10 py-2.5 text-sm font-medium has-[:checked]:border-[var(--color-danger)] has-[:checked]:bg-[var(--color-danger-soft)] has-[:checked]:text-[var(--color-danger)]">
          <input type="radio" name="tipo" value="gasto" className="hidden" />
          Gasto
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Concepto *</label>
        <input
          name="concepto"
          required
          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base"
          placeholder="Ej. Pago de renta del local"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Categoría</label>
        <input
          name="categoria"
          defaultValue="otro"
          className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base"
          placeholder="Ej. otro, servicios, transporte..."
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Monto *</label>
          <input
            name="monto"
            type="number"
            min="0.01"
            step="0.01"
            required
            className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--color-ink)]">Fecha</label>
          <input
            name="fecha"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base"
          />
        </div>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar movimiento"}
      </button>
    </form>
  );
}
