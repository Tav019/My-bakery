import Link from "next/link";
import { Plus } from "lucide-react";
import TopHeader from "@/components/TopHeader";
import { listProductos } from "@/lib/queries/productos";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const productos = await listProductos();

  return (
    <div>
      <TopHeader title="Productos" />

      <main className="px-4 py-4">
        <Link
          href="/productos/nuevo"
          className="mb-4 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
        >
          <Plus size={18} />
          Nuevo producto
        </Link>

        {productos.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-[var(--color-ink-muted)] ring-1 ring-black/5">
            Todavía no registraste productos.
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {productos.map((producto) => (
              <li key={producto.id}>
                <Link
                  href={`/productos/${producto.id}`}
                  className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
                >
                  <div className="aspect-square w-full bg-[var(--color-accent-soft)]">
                    {producto.imagen_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">🧁</div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-[var(--color-ink)]">{producto.nombre}</p>
                    <p className="text-xs font-semibold text-[var(--color-accent)]">
                      {formatMoney(producto.precio_venta)}
                    </p>
                    {!producto.activo && (
                      <p className="mt-1 text-[10px] font-medium text-[var(--color-ink-muted)]">Inactivo</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
