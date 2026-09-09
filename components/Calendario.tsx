"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import EstadoBadge from "@/components/EstadoBadge";
import { formatHora } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { PedidoConItems } from "@/lib/types";

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export default function Calendario({
  pedidos,
  mesInicial,
}: {
  pedidos: PedidoConItems[];
  mesInicial: Date;
}) {
  const [mesActual, setMesActual] = useState(startOfMonth(mesInicial));
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date>(new Date());

  const pedidosPorFecha = useMemo(() => {
    const map = new Map<string, PedidoConItems[]>();
    for (const p of pedidos) {
      const arr = map.get(p.fecha_entrega) || [];
      arr.push(p);
      map.set(p.fecha_entrega, arr);
    }
    return map;
  }, [pedidos]);

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesActual), { weekStartsOn: 1 });
    const fin = endOfWeek(endOfMonth(mesActual), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicio, end: fin });
  }, [mesActual]);

  const pedidosDelDia = pedidosPorFecha.get(format(diaSeleccionado, "yyyy-MM-dd")) || [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        <button
          onClick={() => setMesActual((m) => subMonths(m, 1))}
          className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-black/5"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-semibold capitalize text-[var(--color-ink)]">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </p>
        <button
          onClick={() => setMesActual((m) => addMonths(m, 1))}
          className="rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-black/5"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-[var(--color-ink-muted)]">
          {DIAS_SEMANA.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia) => {
            const key = format(dia, "yyyy-MM-dd");
            const pedidosDia = pedidosPorFecha.get(key) || [];
            const enMes = isSameMonth(dia, mesActual);
            const seleccionado = isSameDay(dia, diaSeleccionado);
            const hoy = isToday(dia);

            return (
              <button
                key={key}
                onClick={() => setDiaSeleccionado(dia)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition ${
                  seleccionado
                    ? "bg-[var(--color-accent)] text-white"
                    : hoy
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                      : enMes
                        ? "text-[var(--color-ink)]"
                        : "text-[var(--color-ink-muted)]/40"
                }`}
              >
                {format(dia, "d")}
                {pedidosDia.length > 0 && (
                  <span
                    className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                      seleccionado ? "bg-white" : "bg-[var(--color-accent)]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold capitalize text-[var(--color-ink)]">
          {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
        </h3>

        {pedidosDelDia.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
            No hay pedidos para este día.
          </div>
        ) : (
          <ul className="space-y-2">
            {pedidosDelDia.map((pedido) => (
              <li key={pedido.id}>
                <Link
                  href={`/pedidos/${pedido.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.99]"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <EstadoBadge estado={pedido.estado} />
                    {pedido.hora_entrega && (
                      <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                        {formatHora(pedido.hora_entrega)}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-[var(--color-ink)]">{pedido.nombre_cliente}</p>
                  {pedido.telefono_cliente && (
                    <p className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
                      <Phone size={12} /> {pedido.telefono_cliente}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                    {pedido.pedido_items.map((i) => i.producto?.nombre).filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-accent)]">
                    {formatMoney(pedido.monto_total)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function parseFechaISO(fecha: string) {
  return parseISO(fecha);
}
