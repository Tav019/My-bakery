import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { eliminarSuscripcion, guardarSuscripcion, type PushSubscriptionJSON } from "@/lib/push";

async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function POST(request: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PushSubscriptionJSON;
    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
    }
    await guardarSuscripcion(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al guardar la suscripción" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { endpoint?: string };
    if (!body?.endpoint) return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });
    await eliminarSuscripcion(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar la suscripción" }, { status: 500 });
  }
}
