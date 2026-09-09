import Link from "next/link";
import { AlertTriangle, ChevronRight, ShoppingBasket } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import EstadoBadge from "@/components/EstadoBadge";
import UrgenciaBadge from "@/components/UrgenciaBadge";
import { getAlertasInventario, getProximasEntregas, getResumenMes } from "@/lib/queries/dashboard";
import { diasHastaEntrega, formatFechaCorta, formatHora } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [entregas, alertas, resumen] = await Promise.all([
    getProximasEntregas(),
    getAlertasInventario(),
    getResumenMes(),
  ]);

  return (
    <div>
      <TopHeader title="Inicio" />

      <main className="space-y-6 px-4 py-4">
        {/* Próximas entregas */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">Próximas entregas</h2>
            <Link href="/agenda" className="text-xs font-medium text-[var(--color-accent)]">
              Ver agenda
            </Link>
          </div>

          {entregas.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
              No hay entregas en los próximos 3 días.
            </div>
          ) : (
            <ul className="space-y-2">
              {entregas.map((pedido) => {
                const dias = diasHastaEntrega(pedido.fecha_entrega);
                return (
                  <li key={pedido.id}>
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <UrgenciaBadge dias={dias} />
                          <EstadoBadge estado={pedido.estado} />
                        </div>
                        <p className="truncate font-medium text-[var(--color-ink)]">{pedido.nombre_cliente}</p>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                          {formatFechaCorta(pedido.fecha_entrega)}
                          {pedido.hora_entrega ? ` · ${formatHora(pedido.hora_entrega)}` : ""} ·{" "}
                          {formatMoney(pedido.monto_total)}
                        </p>
                      </div>
                      <ChevronRight size={18} className="shrink-0 text-[var(--color-ink-muted)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Alertas de inventario */}
        {alertas.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-base font-semibold text-[var(--color-ink)]">
              <AlertTriangle size={17} className="text-[var(--color-danger)]" />
              Alertas de inventario
            </h2>
            <ul className="space-y-2">
              {alertas.map((insumo) => (
                <li
                  key={insumo.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[var(--color-ink)]">{insumo.nombre}</p>
                    <p className="text-xs text-[var(--color-danger)]">
                      Quedan {insumo.cantidad_actual} {insumo.unidad_medida} (mínimo {insumo.cantidad_minima})
                    </p>
                  </div>
                  <Link
                    href={`/inventario/${insumo.id}?compra=1`}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <ShoppingBasket size={14} />
                    Registrar compra
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Resumen del mes */}
        <section>
          <h2 className="mb-2 text-base font-semibold text-[var(--color-ink)]">Resumen del mes</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">Ingresos</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-success)]">
                {formatMoney(resumen.ingresos)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">Gastos</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-danger)]">
                {formatMoney(resumen.gastos)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">Balance</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-ink)]">{formatMoney(resumen.balance)}</p>
            </div>
          </div>
          <Link
            href="/finanzas"
            className="mt-2 block text-center text-xs font-medium text-[var(--color-accent)]"
          >
            Ver finanzas completas
          </Link>
        </section>
      </main>
    </div>
  );
}
