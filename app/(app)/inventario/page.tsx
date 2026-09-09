import Link from "next/link";
import { Plus } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import { listInsumos, getEstadoInsumo } from "@/lib/queries/inventario";

export const dynamic = "force-dynamic";

const ESTADO_STYLES = {
  ok: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  bajo: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  critico: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const ESTADO_LABELS = { ok: "Ok", bajo: "Bajo", critico: "Crítico" };

export default async function InventarioPage() {
  const insumos = await listInsumos();

  return (
    <div>
      <TopHeader title="Inventario" />

      <main className="px-4 py-4">
        <Link
          href="/inventario/nuevo"
          className="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
        >
          <Plus size={18} />
          Nuevo insumo
        </Link>

        {insumos.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
            Todavía no registraste insumos.
          </div>
        ) : (
          <ul className="space-y-2">
            {insumos.map((insumo) => {
              const estado = getEstadoInsumo(insumo);
              return (
                <li key={insumo.id}>
                  <Link
                    href={`/inventario/${insumo.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--color-ink)]">{insumo.nombre}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {insumo.cantidad_actual} {insumo.unidad_medida} disponibles · mínimo{" "}
                        {insumo.cantidad_minima} {insumo.unidad_medida}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_STYLES[estado]}`}
                    >
                      {ESTADO_LABELS[estado]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
