import { etiquetaUrgencia } from "@/lib/dates";

const TONE_STYLES = {
  rojo: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  amarillo: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  neutro: "bg-black/5 text-[var(--color-ink-muted)]",
};

export default function UrgenciaBadge({ dias }: { dias: number }) {
  const { label, tone } = etiquetaUrgencia(dias);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_STYLES[tone]}`}>
      {label}
    </span>
  );
}
