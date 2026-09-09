"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";

type Estado = "cargando" | "no_soportado" | "activo" | "inactivo" | "denegado";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificacionesToggle() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    async function verificar() {
      const soportado =
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!soportado) {
        setEstado("no_soportado");
        return;
      }

      if (Notification.permission === "denied") {
        setEstado("denegado");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setEstado(subscription ? "activo" : "inactivo");
      } catch {
        setEstado("no_soportado");
      }
    }

    verificar();
  }, []);

  async function activar() {
    setProcesando(true);
    setMensaje(null);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMensaje("Las notificaciones no están configuradas en este servidor.");
        return;
      }

      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado("denegado");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) throw new Error("No se pudo registrar la suscripción en el servidor.");

      setEstado("activo");
      setMensaje("Notificaciones activadas.");
    } catch {
      setMensaje("No se pudieron activar las notificaciones en este dispositivo.");
    } finally {
      setProcesando(false);
    }
  }

  async function desactivar() {
    setProcesando(true);
    setMensaje(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setEstado("inactivo");
      setMensaje("Notificaciones desactivadas.");
    } catch {
      setMensaje("No se pudieron desactivar las notificaciones.");
    } finally {
      setProcesando(false);
    }
  }

  if (estado === "cargando") return null;

  if (estado === "no_soportado") {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-[var(--color-ink-muted)] shadow-sm ring-1 ring-black/5">
        <p className="mb-1 flex items-center gap-2 font-medium text-[var(--color-ink)]">
          <BellOff size={16} /> Notificaciones no disponibles
        </p>
        <p>
          Este navegador o dispositivo no soporta notificaciones push (en iPhone, primero instala la app desde
          Safari con &quot;Agregar a pantalla de inicio&quot;). No hay problema: la sección{" "}
          <strong>Próximas entregas</strong> del Inicio siempre muestra los pedidos urgentes al abrir la app.
        </p>
      </div>
    );
  }

  if (estado === "denegado") {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-[var(--color-ink-muted)] shadow-sm ring-1 ring-black/5">
        <p className="mb-1 flex items-center gap-2 font-medium text-[var(--color-ink)]">
          <BellOff size={16} /> Notificaciones bloqueadas
        </p>
        <p>Bloqueaste los permisos de notificación para esta app. Actívalos desde los ajustes del sistema.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="mb-1 flex items-center gap-2 font-medium text-[var(--color-ink)]">
        {estado === "activo" ? <BellRing size={16} /> : <Bell size={16} />}
        Recordatorios push
      </p>
      <p className="mb-3 text-sm text-[var(--color-ink-muted)]">
        Recibe un aviso cuando falten 3 días para una entrega.
      </p>

      {estado === "activo" ? (
        <button
          onClick={desactivar}
          disabled={procesando}
          className="w-full rounded-xl bg-black/5 px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] disabled:opacity-60"
        >
          {procesando ? "Procesando..." : "Desactivar notificaciones"}
        </button>
      ) : (
        <button
          onClick={activar}
          disabled={procesando}
          className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {procesando ? "Procesando..." : "Activar notificaciones"}
        </button>
      )}

      {mensaje && <p className="mt-2 text-xs text-[var(--color-ink-muted)]">{mensaje}</p>}
    </div>
  );
}
