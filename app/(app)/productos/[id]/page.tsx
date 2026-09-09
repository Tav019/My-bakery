import { notFound } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import ProductoForm from "@/components/ProductoForm";
import ConfirmSubmitButton from "@/components/ConfirmSubmitButton";
import { listInsumos } from "@/lib/queries/inventario";
import { getProducto, listRecetaDeProducto } from "@/lib/queries/productos";
import { actualizarProducto, eliminarProducto } from "@/app/(app)/productos/actions";

export const dynamic = "force-dynamic";

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [producto, receta, insumos] = await Promise.all([
    getProducto(id),
    listRecetaDeProducto(id),
    listInsumos(),
  ]);

  if (!producto) notFound();

  return (
    <div>
      <TopHeader title={producto.nombre} />
      <ProductoForm action={actualizarProducto} insumos={insumos} producto={producto} receta={receta} />
      <div className="px-4 pb-10">
        <form action={eliminarProducto}>
          <input type="hidden" name="id" value={producto.id} />
          <ConfirmSubmitButton
            message="¿Eliminar este producto? Esta acción no se puede deshacer."
            className="w-full rounded-xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--color-danger)]"
          >
            Eliminar producto
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
