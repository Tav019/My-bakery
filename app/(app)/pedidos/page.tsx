import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import EstadoBadge from "@/components/EstadoBadge";
import { listPedidos } from "@/lib/queries/pedidos";
import { formatFechaCorta, formatHora } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { EstadoPedido } from "@/lib/types";
import { ESTADOS_PEDIDO } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  estado?: string;
  desde?: string;
  hasta?: string;
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const estado = (sp.estado as EstadoPedido | "todos" | undefined) || "todos";
  const desde = sp.desde || "";
  const hasta = sp.hasta || "";

  const pedidos = await listPedidos({ estado, desde: desde || undefined, hasta: hasta || undefined });

  return (
    <div>
      <TopHeader title="Pedidos" />

      <main className="px-4 py-4">
        <Link
          href="/pedidos/nuevo"
          className="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
        >
          <Plus size={18} />
          Nuevo pedido
        </Link>

        <form className="mb-4 space-y-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5" method="get">
          <div className="flex gap-2">
            <select
              name="estado"
              defaultValue={estado}
              className="flex-1 rounded-lg border border-black/10 bg-[var(--color-bg)] px-2 py-2 text-sm"
            >
              <option value="todos">Todos los estados</option>
              {ESTADOS_PEDIDO.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
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
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--color-ink)] py-2 text-sm font-medium text-white"
          >
            Filtrar
          </button>
        </form>

        {pedidos.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
            No hay pedidos que coincidan con el filtro.
          </div>
        ) : (
          <ul className="space-y-2">
            {pedidos.map((pedido) => (
              <li key={pedido.id}>
                <Link
                  href={`/pedidos/${pedido.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1">
                      <EstadoBadge estado={pedido.estado} />
                    </div>
                    <p className="truncate font-medium text-[var(--color-ink)]">{pedido.nombre_cliente}</p>
                    <p className="text-xs text-[var(--color-ink-muted)]">
                      {formatFechaCorta(pedido.fecha_entrega)}
                      {pedido.hora_entrega ? ` · ${formatHora(pedido.hora_entrega)}` : ""} ·{" "}
                      {formatMoney(pedido.monto_total)} · {pedido.pedido_items.length}{" "}
                      {pedido.pedido_items.length === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-[var(--color-ink-muted)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
