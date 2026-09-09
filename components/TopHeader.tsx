import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/config";
import { LogOut, Settings } from "lucide-react";

export default function TopHeader({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 px-4 py-3 backdrop-blur pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-muted)]">
          {APP_NAME}
        </p>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h1>
      </div>
      <div className="flex items-center gap-1">
        <Link
          href="/configuracion"
          aria-label="Configuración"
          className="rounded-full p-2 text-[var(--color-ink-muted)] transition hover:bg-black/5"
        >
          <Settings size={20} />
        </Link>
        <form action={logout}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            className="rounded-full p-2 text-[var(--color-ink-muted)] transition hover:bg-black/5"
          >
            <LogOut size={20} />
          </button>
        </form>
      </div>
    </header>
  );
}
