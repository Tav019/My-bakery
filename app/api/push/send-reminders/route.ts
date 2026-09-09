import { NextRequest, NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { enviarNotificacionATodos } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * Pensado para ser invocado por un Cron Job de Vercel (ver vercel.json) una
 * vez al día. Envía un recordatorio push por los pedidos cuya entrega es en
 * exactamente 3 días. Protegido con CRON_SECRET: Vercel agrega
 * automáticamente el header "Authorization: Bearer $CRON_SECRET" en las
 * invocaciones de Cron Jobs cuando esa variable de entorno está configurada
 * en el proyecto.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const objetivo = format(addDays(new Date(), 3), "yyyy-MM-dd");

    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("id, nombre_cliente")
      .eq("fecha_entrega", objetivo)
      .not("estado", "in", "(cancelado,completado)");

    if (error) throw new Error(error.message);

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0, mensaje: "Sin entregas en 3 días." });
    }

    const body =
      pedidos.length === 1
        ? `Pedido de ${pedidos[0].nombre_cliente} — entrega en 3 días.`
        : `${pedidos.length} pedidos con entrega en 3 días.`;

    const resultado = await enviarNotificacionATodos({
      title: "Recordatorio de entrega",
      body,
      url: "/",
    });

    return NextResponse.json({ ok: true, pedidos: pedidos.length, ...resultado });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al enviar recordatorios" },
      { status: 500 }
    );
  }
}
