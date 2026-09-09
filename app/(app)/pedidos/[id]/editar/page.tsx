import { notFound, redirect } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import PedidoForm from "@/components/PedidoForm";
import { getPedido } from "@/lib/queries/pedidos";
import { listProductos } from "@/lib/queries/productos";
import { actualizarPedido } from "@/app/(app)/pedidos/actions";

export const dynamic = "force-dynamic";

export default async function EditarPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [pedido, productos] = await Promise.all([getPedido(id), listProductos({ soloActivos: true })]);

  if (!pedido) notFound();
  if (pedido.estado === "completado" || pedido.estado === "cancelado") {
    redirect(`/pedidos/${id}`);
  }

  return (
    <div>
      <TopHeader title="Editar pedido" />
      <PedidoForm action={actualizarPedido} productos={productos} pedido={pedido} />
    </div>
  );
}
