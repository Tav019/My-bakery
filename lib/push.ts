import "server-only";
import webpush from "web-push";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contacto@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Faltan las variables de entorno NEXT_PUBLIC_VAPID_PUBLIC_KEY y/o VAPID_PRIVATE_KEY.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export async function guardarSuscripcion(sub: PushSubscriptionJSON): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      { onConflict: "endpoint" }
    );
  if (error) throw new Error(`No se pudo guardar la suscripción: ${error.message}`);
}

export async function eliminarSuscripcion(endpoint: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export async function enviarNotificacionATodos(payload: { title: string; body: string; url?: string }) {
  ensureVapidConfigured();
  const supabase = getSupabaseAdmin();
  const { data: subs, error } = await supabase.from("push_subscriptions").select("*");
  if (error) throw new Error(`No se pudieron cargar las suscripciones: ${error.message}`);

  const results = await Promise.allSettled(
    (subs || []).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );

  // Limpia suscripciones que ya no son válidas (dispositivo desinstaló la app, etc.)
  const invalidos = (subs || []).filter((sub, i) => {
    const r = results[i];
    return r.status === "rejected" && [404, 410].includes((r.reason as { statusCode?: number })?.statusCode ?? 0);
  });

  if (invalidos.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", invalidos.map((s) => s.endpoint));
  }

  return { enviados: results.filter((r) => r.status === "fulfilled").length, total: subs?.length ?? 0 };
}
