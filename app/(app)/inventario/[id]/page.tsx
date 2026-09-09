import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import RegistrarCompraForm from "@/components/RegistrarCompraForm";
import { getEstadoInsumo, getInsumo, listComprasDeInsumo } from "@/lib/queries/inventario";
import { anularCompra } from "@/app/(app)/inventario/actions";
import { formatMoney } from "@/lib/money";
import { formatFechaCorta } from "@/lib/dates";

export const dynamic = "force-dynamic";

const ESTADO_STYLES = {
  ok: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  bajo: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  critico: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};
const ESTADO_LABELS = { ok: "Ok", bajo: "Bajo", critico: "Crítico" };

export default async function InsumoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ compra?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const [insumo, compras] = await Promise.all([getInsumo(id), listComprasDeInsumo(id)]);
  if (!insumo) notFound();

  const estado = getEstadoInsumo(insumo);

  return (
    <div>
      <TopHeader title="Detalle de insumo" />

      <main className="space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="mb-2 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_STYLES[estado]}`}>
              {ESTADO_LABELS[estado]}
            </span>
            <Link
              href={`/inventario/${insumo.id}/editar`}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)]"
            >
              <Pencil size={14} /> Editar
            </Link>
          </div>

          <h2 className="text-lg font-semibold text-[var(--color-ink)]">{insumo.nombre}</h2>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-[var(--color-bg)] p-2">
              <p className="text-[11px] text-[var(--color-ink-muted)]">Actual</p>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {insumo.cantidad_actual} {insumo.unidad_medida}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg)] p-2">
              <p className="text-[11px] text-[var(--color-ink-muted)]">Mínima</p>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {insumo.cantidad_minima} {insumo.unidad_medida}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--color-bg)] p-2">
              <p className="text-[11px] text-[var(--color-ink-muted)]">Costo/u</p>
              <p className="text-sm font-semibold text-[var(--color-ink)]">{formatMoney(insumo.costo_por_unidad)}</p>
            </div>
          </div>
        </div>

        <RegistrarCompraForm insumo={insumo} defaultOpen={sp.compra === "1"} />

        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Historial de compras</h3>
          {compras.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
              Todavía no hay compras registradas.
            </div>
          ) : (
            <ul className="space-y-2">
              {compras.map((compra) => (
                <li
                  key={compra.id}
                  className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 ${
                    compra.anulada ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        {compra.cantidad_comprada} {insumo.unidad_medida} · {formatMoney(compra.costo_total)}
                      </p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {formatFechaCorta(compra.fecha)}
                        {compra.anulada ? " · Anulada" : ""}
                      </p>
                    </div>
                    {!compra.anulada && (
                      <form action={anularCompra}>
                        <input type="hidden" name="compra_id" value={compra.id} />
                        <input type="hidden" name="insumo_id" value={insumo.id} />
                        <ConfirmSubmitButton
                          message="Anular esta compra revertirá el stock sumado y anulará el gasto registrado. ¿Continuar?"
                          className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-danger)]"
                        >
                          Anular
                        </ConfirmSubmitButton>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
