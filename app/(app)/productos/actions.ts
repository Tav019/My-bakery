"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { inputToCents } from "@/lib/money";

export interface ProductoFormState {
  error?: string;
}

function revalidarProductos(productoId?: string) {
  revalidatePath("/productos");
  if (productoId) revalidatePath(`/productos/${productoId}`);
  revalidatePath("/pedidos/nuevo");
}

async function subirImagenSiCorresponde(formData: FormData, productoId: string): Promise<string | null | undefined> {
  const file = formData.get("imagen");
  if (!(file instanceof File) || file.size === 0) return undefined; // sin cambios

  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La imagen no puede pesar más de 5MB.");
  }

  const supabase = getSupabaseAdmin();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${productoId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from("productos").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) throw new Error(`No se pudo subir la imagen: ${error.message}`);

  const { data } = supabase.storage.from("productos").getPublicUrl(path);
  return data.publicUrl;
}

function parseReceta(formData: FormData): { insumo_id: string; cantidad_necesaria: number }[] {
  const insumoIds = formData.getAll("receta_insumo_id").map(String);
  const cantidades = formData.getAll("receta_cantidad").map(String);

  const receta: { insumo_id: string; cantidad_necesaria: number }[] = [];
  const vistos = new Set<string>();

  for (let i = 0; i < insumoIds.length; i++) {
    const insumoId = insumoIds[i];
    const cantidad = parseFloat((cantidades[i] || "0").replace(",", "."));
    if (!insumoId || !Number.isFinite(cantidad) || cantidad <= 0) continue;
    if (vistos.has(insumoId)) continue; // evita duplicados si se agregó dos veces el mismo insumo
    vistos.add(insumoId);
    receta.push({ insumo_id: insumoId, cantidad_necesaria: cantidad });
  }

  return receta;
}

export async function crearProducto(_prevState: ProductoFormState, formData: FormData): Promise<ProductoFormState> {
  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const precio_venta = inputToCents(String(formData.get("precio_venta") || "0"));
  const activo = formData.get("activo") === "on";

  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = getSupabaseAdmin();
  const { data: producto, error } = await supabase
    .from("productos")
    .insert({ nombre, descripcion, precio_venta, activo })
    .select("id")
    .single();

  if (error || !producto) return { error: "No se pudo crear el producto." };

  try {
    const imagenUrl = await subirImagenSiCorresponde(formData, producto.id);
    if (imagenUrl) {
      await supabase.from("productos").update({ imagen_url: imagenUrl }).eq("id", producto.id);
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir la imagen." };
  }

  const receta = parseReceta(formData);
  if (receta.length > 0) {
    const { error: recetaError } = await supabase
      .from("recetas")
      .insert(receta.map((r) => ({ producto_id: producto.id, ...r })));
    if (recetaError) return { error: "El producto se creó, pero no se pudo guardar la receta." };
  }

  revalidarProductos(producto.id);
  redirect(`/productos/${producto.id}`);
}

export async function actualizarProducto(
  _prevState: ProductoFormState,
  formData: FormData
): Promise<ProductoFormState> {
  const id = String(formData.get("id") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const precio_venta = inputToCents(String(formData.get("precio_venta") || "0"));
  const activo = formData.get("activo") === "on";

  if (!id) return { error: "Producto inválido." };
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = getSupabaseAdmin();

  let imagenUrl: string | null | undefined;
  try {
    imagenUrl = await subirImagenSiCorresponde(formData, id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo subir la imagen." };
  }

  const update: Record<string, unknown> = { nombre, descripcion, precio_venta, activo };
  if (imagenUrl !== undefined) update.imagen_url = imagenUrl;

  const { error } = await supabase.from("productos").update(update).eq("id", id);
  if (error) return { error: "No se pudo actualizar el producto." };

  const receta = parseReceta(formData);
  const { error: deleteError } = await supabase.from("recetas").delete().eq("producto_id", id);
  if (deleteError) return { error: "No se pudo actualizar la receta." };

  if (receta.length > 0) {
    const { error: insertError } = await supabase
      .from("recetas")
      .insert(receta.map((r) => ({ producto_id: id, ...r })));
    if (insertError) return { error: "No se pudo guardar la receta." };
  }

  revalidarProductos(id);
  redirect(`/productos/${id}`);
}

export async function eliminarProducto(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("productos").delete().eq("id", id);

  if (error) {
    // La FK de pedido_items → productos usa "on delete restrict": si el
    // producto ya fue usado en algún pedido, la base rechaza el borrado.
    throw new Error(
      "No se puede eliminar: este producto ya fue usado en algún pedido. Puedes marcarlo como inactivo en su lugar."
    );
  }

  revalidarProductos();
  redirect("/productos");
}
