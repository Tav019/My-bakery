import TopHeader from "@/components/TopHeader";
import PedidoForm from "@/components/PedidoForm";
import { listProductos } from "@/lib/queries/productos";
import { crearPedido } from "@/app/(app)/pedidos/actions";

export const dynamic = "force-dynamic";

export default async function NuevoPedidoPage() {
  const productos = await listProductos({ soloActivos: true });

  return (
    <div>
      <TopHeader title="Nuevo pedido" />
      {productos.length === 0 ? (
        <div className="mx-4 mt-4 rounded-2xl bg-white p-6 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
          No hay productos activos todavía. Crea al menos un producto antes de armar un pedido.
        </div>
      ) : (
        <PedidoForm action={crearPedido} productos={productos} />
      )}
    </div>
  );
}
