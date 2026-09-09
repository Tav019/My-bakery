import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Phone } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import EstadoBadge from "@/components/EstadoBadge";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { getPedido } from "@/lib/queries/pedidos";
import { cambiarEstadoPedido } from "@/app/(app)/pedidos/actions";
import { formatFechaLarga, formatHora } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pedido = await getPedido(id);
  if (!pedido) notFound();

  const editable = pedido.estado === "pendiente" || pedido.estado === "en_preparacion";

  return (
    <div>
      <TopHeader title="Detalle del pedido" />

      <main className="space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="mb-2 flex items-center justify-between">
            <EstadoBadge estado={pedido.estado} />
            {editable && (
              <Link
                href={`/pedidos/${pedido.id}/editar`}
                className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)]"
              >
                <Pencil size={14} /> Editar
              </Link>
            )}
          </div>

          <h2 className="text-lg font-semibold text-[var(--color-ink)]">{pedido.nombre_cliente}</h2>
          {pedido.telefono_cliente && (
            <a
              href={`tel:${pedido.telefono_cliente}`}
              className="mt-0.5 flex items-center gap-1 text-sm text-[var(--color-ink-muted)]"
            >
              <Phone size={13} /> {pedido.telefono_cliente}
            </a>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-[var(--color-ink-muted)]">Entrega</p>
              <p className="font-medium capitalize text-[var(--color-ink)]">
                {formatFechaLarga(pedido.fecha_entrega)}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-ink-muted)]">Hora</p>
              <p className="font-medium text-[var(--color-ink)]">
                {pedido.hora_entrega ? formatHora(pedido.hora_entrega) : "Sin especificar"}
              </p>
            </div>
          </div>

          {pedido.notas && (
            <div className="mt-3 rounded-lg bg-[var(--color-bg)] p-3 text-sm text-[var(--color-ink)]">
              {pedido.notas}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-ink)]">Productos</h3>
          <ul className="divide-y divide-black/5">
            {pedido.pedido_items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-ink)]">
                    {item.producto?.nombre ?? "Producto eliminado"}
                  </p>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {item.cantidad} × {formatMoney(item.precio_unitario_en_el_momento)}
                  </p>
                </div>
                <p className="font-medium text-[var(--color-ink)]">
                  {formatMoney(Math.round(item.cantidad * item.precio_unitario_en_el_momento))}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2">
            <span className="font-semibold text-[var(--color-ink)]">Total</span>
            <span className="text-lg font-semibold text-[var(--color-accent)]">
              {formatMoney(pedido.monto_total)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Estado del pedido</h3>
          <div className="flex flex-wrap gap-2">
            {pedido.estado === "pendiente" && (
              <form action={cambiarEstadoPedido}>
                <input type="hidden" name="id" value={pedido.id} />
                <input type="hidden" name="estado" value="en_preparacion" />
                <button className="rounded-xl bg-[var(--color-accent-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent)]">
                  Marcar en preparación
                </button>
              </form>
            )}

            {(pedido.estado === "pendiente" || pedido.estado === "en_preparacion") && (
              <form action={cambiarEstadoPedido}>
                <input type="hidden" name="id" value={pedido.id} />
                <input type="hidden" name="estado" value="completado" />
                <ConfirmSubmitButton
                  message="Al completar el pedido se descontará el inventario según la receta de cada producto y se registrará el ingreso en Finanzas. ¿Continuar?"
                  className="rounded-xl bg-[var(--color-success)] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Marcar completado
                </ConfirmSubmitButton>
              </form>
            )}

            {(pedido.estado === "pendiente" || pedido.estado === "en_preparacion" || pedido.estado === "completado") && (
              <form action={cambiarEstadoPedido}>
                <input type="hidden" name="id" value={pedido.id} />
                <input type="hidden" name="estado" value="cancelado" />
                <ConfirmSubmitButton
                  message={
                    pedido.estado === "completado"
                      ? "Este pedido ya está completado: cancelarlo revertirá el descuento de inventario y anulará el ingreso registrado. ¿Continuar?"
                      : "¿Seguro que quieres cancelar este pedido?"
                  }
                  className="rounded-xl bg-[var(--color-danger-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-danger)]"
                >
                  Cancelar pedido
                </ConfirmSubmitButton>
              </form>
            )}

            {pedido.estado === "cancelado" && (
              <p className="text-sm text-[var(--color-ink-muted)]">Este pedido está cancelado.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
