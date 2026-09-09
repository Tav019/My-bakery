import { notFound } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import InsumoForm from "@/components/InsumoForm";
import { getInsumo } from "@/lib/queries/inventario";
import { actualizarInsumo } from "@/app/(app)/inventario/actions";

export const dynamic = "force-dynamic";

export default async function EditarInsumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const insumo = await getInsumo(id);
  if (!insumo) notFound();

  return (
    <div>
      <TopHeader title="Editar insumo" />
      <InsumoForm action={actualizarInsumo} insumo={insumo} />
    </div>
  );
}
