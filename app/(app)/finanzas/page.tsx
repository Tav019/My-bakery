import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import MovimientoForm from "@/components/MovimientoForm";
import FinanzasChart from "@/components/FinanzasChart";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { getSerieMensual, listMovimientos } from "@/lib/queries/finanzas";
import { eliminarMovimientoManual } from "@/app/(app)/finanzas/actions";
import { formatFechaCorta } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { TipoMovimiento } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  tipo?: string;
  categoria?: string;
  desde?: string;
  hasta?: string;
}

export default async function FinanzasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const tipo = (sp.tipo as TipoMovimiento | "todos" | undefined) || "todos";
  const categoria = sp.categoria || "";
  const desde = sp.desde || "";
  const hasta = sp.hasta || "";

  const [movimientos, serie] = await Promise.all([
    listMovimientos({ tipo, categoria: categoria || undefined, desde: desde || undefined, hasta: hasta || undefined }),
    getSerieMensual(6),
  ]);

  const totales = movimientos.reduce(
    (acc, m) => {
      if (m.anulado) return acc;
      if (m.tipo === "ingreso") acc.ingresos += m.monto;
      else acc.gastos += m.monto;
      return acc;
    },
    { ingresos: 0, gastos: 0 }
  );

  return (
    <div>
      <TopHeader title="Finanzas" />

      <main className="px-4 py-4">
        <h2 className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Últimos 6 meses</h2>
        <div className="mb-4">
          <FinanzasChart datos={serie} />
        </div>

        <MovimientoForm />

        <form className="mb-4 space-y-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5" method="get">
          <div className="flex gap-2">
            <select
              name="tipo"
              defaultValue={tipo}
              className="flex-1 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
            </select>
            <input
              type="text"
              name="categoria"
              defaultValue={categoria}
              placeholder="Categoría"
              className="flex-1 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              name="desde"
              defaultValue={desde}
              className="flex-1 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-sm"
            />
            <input
              type="date"
              name="hasta"
              defaultValue={hasta}
              className="flex-1 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-sm"
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-[var(--color-ink)] py-2 text-sm font-medium text-white">
            Filtrar
          </button>
        </form>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] text-[var(--color-ink-muted)]">Ingresos</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-success)]">{formatMoney(totales.ingresos)}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] text-[var(--color-ink-muted)]">Gastos</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-danger)]">{formatMoney(totales.gastos)}</p>
          </div>
          <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-[11px] text-[var(--color-ink-muted)]">Balance</p>
            <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">
              {formatMoney(totales.ingresos - totales.gastos)}
            </p>
          </div>
        </div>

        {movimientos.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
            No hay movimientos que coincidan con el filtro.
          </div>
        ) : (
          <ul className="space-y-2">
            {movimientos.map((m) => (
              <li
                key={m.id}
                className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${m.anulado ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          m.tipo === "ingreso"
                            ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                            : "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                        }`}
                      >
                        {m.tipo === "ingreso" ? "Ingreso" : "Gasto"}
                      </span>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--color-ink-muted)]">
                        {m.categoria}
                      </span>
                      {m.es_automatico && (
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--color-ink-muted)]">
                          Automático
                        </span>
                      )}
                      {m.anulado && (
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] text-[var(--color-ink-muted)]">
                          Anulado
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">{m.concepto}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {formatFechaCorta(m.fecha)}
                      {m.pedidos && (
                        <>
                          {" · "}
                          <Link href={`/pedidos/${m.pedidos.id}`} className="underline">
                            {m.pedidos.nombre_cliente}
                          </Link>
                        </>
                      )}
                      {m.insumos && (
                        <>
                          {" · "}
                          <Link href={`/inventario/${m.insumos.id}`} className="underline">
                            {m.insumos.nombre}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        m.tipo === "ingreso" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
                      }`}
                    >
                      {m.tipo === "ingreso" ? "+" : "-"}
                      {formatMoney(m.monto)}
                    </p>
                    {!m.es_automatico && (
                      <form action={eliminarMovimientoManual} className="mt-1">
                        <input type="hidden" name="id" value={m.id} />
                        <ConfirmSubmitButton
                          message="¿Eliminar este movimiento manual?"
                          className="text-[11px] font-semibold text-[var(--color-danger)]"
                        >
                          Eliminar
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
