import TopHeader from "@/components/TopHeader";
import ProductoForm from "@/components/ProductoForm";
import { listInsumos } from "@/lib/queries/inventario";
import { crearProducto } from "@/app/(app)/productos/actions";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const insumos = await listInsumos();

  return (
    <div>
      <TopHeader title="Nuevo producto" />
      <ProductoForm action={crearProducto} insumos={insumos} />
    </div>
  );
}
