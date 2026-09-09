import TopHeader from "@/components/TopHeader";
import NotificacionesToggle from "@/components/NotificacionesToggle";
import { APP_NAME } from "@/lib/config";

export default function ConfiguracionPage() {
  return (
    <div>
      <TopHeader title="Configuración" />
      <main className="space-y-4 px-4 py-4">
        <NotificacionesToggle />

        <div className="rounded-2xl bg-white p-4 text-sm text-[var(--color-ink-muted)] shadow-sm ring-1 ring-black/5">
          <p className="font-medium text-[var(--color-ink)]">{APP_NAME}</p>
          <p className="mt-1">Acceso compartido — gestión de pedidos, inventario y finanzas.</p>
        </div>
      </main>
    </div>
  );
}
