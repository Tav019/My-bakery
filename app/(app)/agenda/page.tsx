import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import TopHeader from "@/components/TopHeader";
import Calendario from "@/components/Calendario";
import { listPedidosPorRangoFechas } from "@/lib/queries/pedidos";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const hoy = new Date();
  const desde = format(startOfMonth(subMonths(hoy, 3)), "yyyy-MM-dd");
  const hasta = format(endOfMonth(addMonths(hoy, 3)), "yyyy-MM-dd");

  const pedidos = await listPedidosPorRangoFechas(desde, hasta);

  return (
    <div>
      <TopHeader title="Agenda" />
      <main className="px-4 py-4">
        <Calendario pedidos={pedidos} mesInicial={hoy} />
      </main>
    </div>
  );
}
