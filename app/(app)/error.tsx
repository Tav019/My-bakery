"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-4xl">😕</div>
      <h1 className="text-lg font-semibold text-[var(--color-ink)]">Algo salió mal</h1>
      <p className="max-w-xs text-sm text-[var(--color-ink-muted)]">
        {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
      </p>
      <button
        onClick={reset}
        className="mt-2 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
