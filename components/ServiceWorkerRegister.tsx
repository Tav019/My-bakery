"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silencioso: si falla el registro (ej. navegador sin soporte),
      // la app sigue funcionando normalmente sin capacidades offline/push.
    });
  }, []);

  return null;
}
