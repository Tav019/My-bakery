import TopHeader from "@/components/TopHeader";
import InsumoForm from "@/components/InsumoForm";
import { crearInsumo } from "@/app/(app)/inventario/actions";

export default function NuevoInsumoPage() {
  return (
    <div>
      <TopHeader title="Nuevo insumo" />
      <InsumoForm action={crearInsumo} />
    </div>
  );
}
