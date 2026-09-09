"use client";

import { useActionState } from "react";
import { login, LoginState } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/config";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-3xl">
            🧁
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-ink)]">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Gestión de pedidos, inventario y finanzas
          </p>
        </div>

        <form action={formAction} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[var(--color-ink)]">
            Contraseña de acceso
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-black/10 bg-[var(--color-bg)] px-4 py-3 text-base text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
          />

          {state?.error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-xl bg-[var(--color-accent)] px-4 py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-ink-muted)]">
          Acceso compartido del negocio. Si olvidaste la contraseña, contacta a quien administra la app.
        </p>
      </div>
    </div>
  );
}
