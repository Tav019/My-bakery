import type { EstadoPedido } from "@/lib/types";

const STYLES: Record<EstadoPedido, string> = {
  pendiente: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  en_preparacion: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  completado: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  cancelado: "bg-black/5 text-[var(--color-ink-muted)]",
};

const LABELS: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  completado: "Completado",
  cancelado: "Cancelado",
};

export default function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[estado]}`}>
      {LABELS[estado]}
    </span>
  );
}
