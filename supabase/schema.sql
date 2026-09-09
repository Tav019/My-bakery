-- ============================================================================
-- Mi Repostería — esquema de base de datos (Supabase / PostgreSQL)
--
-- Cómo usarlo:
--   1. Entra a tu proyecto de Supabase → SQL Editor → New query
--   2. Pega TODO este archivo y ejecútalo (Run)
--   3. Verifica en Table Editor que se crearon las tablas
--
-- Notas de diseño:
--   - Los montos de dinero (precio_venta, costo_por_unidad, monto_total,
--     monto, costo_total, precio_unitario_en_el_momento) se guardan como
--     ENTEROS en CENTAVOS para evitar errores de punto flotante.
--     Ej: $150.50 se guarda como 15050.
--   - Las cantidades de insumos/recetas usan NUMERIC(12,3) porque pueden
--     ser fraccionarias (ej: 0.5 kg, 250.5 ml).
--   - Todas las tablas tienen Row Level Security (RLS) habilitado y SIN
--     policies. La app usa un único acceso compartido (sin Supabase Auth)
--     y todas las lecturas/escrituras se hacen desde el servidor con la
--     Service Role Key, la cual ignora RLS. Esto bloquea cualquier acceso
--     directo desde el navegador con la anon key.
-- ============================================================================

-- Extensión necesaria para gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------
-- Tipos enumerados
-- ------------------------------------------------------------------
do $$ begin
  create type estado_pedido as enum ('pendiente', 'en_preparacion', 'completado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('ingreso', 'gasto');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------
-- productos
-- ------------------------------------------------------------------
create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio_venta integer not null default 0 check (precio_venta >= 0), -- centavos
  imagen_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- insumos (ingredientes / materiales)
-- ------------------------------------------------------------------
create table if not exists insumos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  unidad_medida text not null, -- g, kg, ml, l, unidad, etc.
  cantidad_actual numeric(12,3) not null default 0,
  cantidad_minima numeric(12,3) not null default 0,
  costo_por_unidad integer not null default 0 check (costo_por_unidad >= 0), -- centavos
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- recetas (insumos y cantidades que lleva cada producto)
-- ------------------------------------------------------------------
create table if not exists recetas (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references productos(id) on delete cascade,
  insumo_id uuid not null references insumos(id) on delete restrict,
  cantidad_necesaria numeric(12,3) not null check (cantidad_necesaria > 0),
  unique (producto_id, insumo_id)
);

create index if not exists idx_recetas_producto on recetas (producto_id);
create index if not exists idx_recetas_insumo on recetas (insumo_id);

-- ------------------------------------------------------------------
-- pedidos
-- ------------------------------------------------------------------
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  nombre_cliente text not null,
  telefono_cliente text,
  fecha_entrega date not null,
  hora_entrega time,
  estado estado_pedido not null default 'pendiente',
  notas text,
  monto_total integer not null default 0 check (monto_total >= 0), -- centavos
  created_at timestamptz not null default now()
);

create index if not exists idx_pedidos_fecha_entrega on pedidos (fecha_entrega);
create index if not exists idx_pedidos_estado on pedidos (estado);

-- ------------------------------------------------------------------
-- pedido_items (detalle de productos de cada pedido)
-- ------------------------------------------------------------------
create table if not exists pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid not null references productos(id) on delete restrict,
  cantidad numeric(12,3) not null check (cantidad > 0),
  precio_unitario_en_el_momento integer not null check (precio_unitario_en_el_momento >= 0) -- centavos
);

create index if not exists idx_pedido_items_pedido on pedido_items (pedido_id);
create index if not exists idx_pedido_items_producto on pedido_items (producto_id);

-- ------------------------------------------------------------------
-- movimientos_financieros
-- ------------------------------------------------------------------
create table if not exists movimientos_financieros (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_movimiento not null,
  monto integer not null check (monto >= 0), -- centavos, siempre positivo; el signo lo da "tipo"
  concepto text not null,
  categoria text not null, -- venta, compra_insumo, otro, ...
  pedido_id uuid references pedidos(id) on delete set null,
  insumo_id uuid references insumos(id) on delete set null,
  fecha date not null default current_date,
  created_at timestamptz not null default now(),
  es_automatico boolean not null default false, -- generado por el sistema (venta/compra) vs. manual
  anulado boolean not null default false -- permite anular movimientos automáticos sin editar el monto
);

create index if not exists idx_movimientos_fecha on movimientos_financieros (fecha);
create index if not exists idx_movimientos_tipo on movimientos_financieros (tipo);
create index if not exists idx_movimientos_pedido on movimientos_financieros (pedido_id);
create index if not exists idx_movimientos_insumo on movimientos_financieros (insumo_id);

-- ------------------------------------------------------------------
-- compras_insumos (reabastecimiento de insumos)
-- ------------------------------------------------------------------
create table if not exists compras_insumos (
  id uuid primary key default gen_random_uuid(),
  insumo_id uuid not null references insumos(id) on delete cascade,
  cantidad_comprada numeric(12,3) not null check (cantidad_comprada > 0),
  costo_total integer not null check (costo_total >= 0), -- centavos
  fecha date not null default current_date,
  created_at timestamptz not null default now(),
  anulada boolean not null default false, -- permite anular la compra (revierte stock y su movimiento)
  movimiento_id uuid references movimientos_financieros(id) on delete set null
);

create index if not exists idx_compras_insumo on compras_insumos (insumo_id);

-- ------------------------------------------------------------------
-- push_subscriptions
-- Soporte técnico para notificaciones push web (recordatorios de entregas).
-- No forma parte del modelo de negocio, solo guarda las suscripciones del
-- o los dispositivos donde se activó "Activar notificaciones".
-- ------------------------------------------------------------------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Funciones (operaciones críticas de negocio)
--
-- El descuento de inventario, la creación de movimientos financieros y la
-- reversión de ambos ante una cancelación se ejecutan como funciones de
-- PostgreSQL (transacciones atómicas dentro de la base de datos) en lugar
-- de varios pasos separados desde el servidor de la app. Así se evita que
-- una falla a mitad de camino deje datos inconsistentes (ej. insumos
-- descontados sin el movimiento financiero correspondiente).
--
-- Se marcan SECURITY DEFINER para poder actualizar todas las tablas
-- involucradas a pesar de RLS, y el EXECUTE se otorga solo a
-- "service_role" (nunca a "anon"/"authenticated"), que es el único rol
-- que usa esta aplicación desde el servidor.
-- ============================================================================

-- ------------------------------------------------------------------
-- fn_completar_pedido: descuenta insumos según receta y registra el
-- ingreso correspondiente al monto_total del pedido.
-- ------------------------------------------------------------------
create or replace function fn_completar_pedido(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado estado_pedido;
  v_monto_total integer;
  v_nombre_cliente text;
begin
  select estado, monto_total, nombre_cliente
    into v_estado, v_monto_total, v_nombre_cliente
    from pedidos
   where id = p_pedido_id
   for update;

  if not found then
    raise exception 'Pedido % no encontrado', p_pedido_id;
  end if;

  if v_estado = 'completado' then
    raise exception 'El pedido ya está completado';
  end if;

  if v_estado = 'cancelado' then
    raise exception 'No se puede completar un pedido cancelado';
  end if;

  update insumos i
     set cantidad_actual = i.cantidad_actual - descuentos.cantidad
    from (
      select r.insumo_id, sum(r.cantidad_necesaria * pi.cantidad) as cantidad
        from pedido_items pi
        join recetas r on r.producto_id = pi.producto_id
       where pi.pedido_id = p_pedido_id
       group by r.insumo_id
    ) as descuentos
   where i.id = descuentos.insumo_id;

  update pedidos set estado = 'completado' where id = p_pedido_id;

  insert into movimientos_financieros (tipo, monto, concepto, categoria, pedido_id, fecha, es_automatico)
  values ('ingreso', v_monto_total, 'Venta - pedido de ' || v_nombre_cliente, 'venta', p_pedido_id, current_date, true);
end;
$$;

-- ------------------------------------------------------------------
-- fn_cancelar_pedido: si el pedido estaba completado, revierte el
-- descuento de insumos y anula el movimiento de ingreso asociado.
-- ------------------------------------------------------------------
create or replace function fn_cancelar_pedido(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado estado_pedido;
begin
  select estado into v_estado from pedidos where id = p_pedido_id for update;

  if not found then
    raise exception 'Pedido % no encontrado', p_pedido_id;
  end if;

  if v_estado = 'cancelado' then
    raise exception 'El pedido ya está cancelado';
  end if;

  if v_estado = 'completado' then
    update insumos i
       set cantidad_actual = i.cantidad_actual + reversion.cantidad
      from (
        select r.insumo_id, sum(r.cantidad_necesaria * pi.cantidad) as cantidad
          from pedido_items pi
          join recetas r on r.producto_id = pi.producto_id
         where pi.pedido_id = p_pedido_id
         group by r.insumo_id
      ) as reversion
     where i.id = reversion.insumo_id;

    update movimientos_financieros
       set anulado = true
     where pedido_id = p_pedido_id
       and categoria = 'venta'
       and es_automatico = true
       and anulado = false;
  end if;

  update pedidos set estado = 'cancelado' where id = p_pedido_id;
end;
$$;

-- ------------------------------------------------------------------
-- fn_registrar_compra_insumo: crea la compra, suma stock y registra
-- el gasto correspondiente.
-- ------------------------------------------------------------------
create or replace function fn_registrar_compra_insumo(
  p_insumo_id uuid,
  p_cantidad numeric,
  p_costo_total integer,
  p_fecha date default current_date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_compra_id uuid;
  v_movimiento_id uuid;
  v_insumo_nombre text;
begin
  if p_cantidad <= 0 then
    raise exception 'La cantidad comprada debe ser mayor a 0';
  end if;

  select nombre into v_insumo_nombre from insumos where id = p_insumo_id for update;
  if not found then
    raise exception 'Insumo % no encontrado', p_insumo_id;
  end if;

  insert into compras_insumos (insumo_id, cantidad_comprada, costo_total, fecha)
  values (p_insumo_id, p_cantidad, p_costo_total, coalesce(p_fecha, current_date))
  returning id into v_compra_id;

  update insumos set cantidad_actual = cantidad_actual + p_cantidad where id = p_insumo_id;

  insert into movimientos_financieros (tipo, monto, concepto, categoria, insumo_id, fecha, es_automatico)
  values ('gasto', p_costo_total, 'Compra de ' || v_insumo_nombre, 'compra_insumo', p_insumo_id, coalesce(p_fecha, current_date), true)
  returning id into v_movimiento_id;

  update compras_insumos set movimiento_id = v_movimiento_id where id = v_compra_id;

  return v_compra_id;
end;
$$;

-- ------------------------------------------------------------------
-- fn_anular_compra_insumo: revierte el stock sumado y anula el gasto.
-- ------------------------------------------------------------------
create or replace function fn_anular_compra_insumo(p_compra_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_insumo_id uuid;
  v_cantidad numeric;
  v_anulada boolean;
  v_movimiento_id uuid;
begin
  select insumo_id, cantidad_comprada, anulada, movimiento_id
    into v_insumo_id, v_cantidad, v_anulada, v_movimiento_id
    from compras_insumos
   where id = p_compra_id
   for update;

  if not found then
    raise exception 'Compra % no encontrada', p_compra_id;
  end if;

  if v_anulada then
    raise exception 'La compra ya está anulada';
  end if;

  update insumos set cantidad_actual = cantidad_actual - v_cantidad where id = v_insumo_id;

  if v_movimiento_id is not null then
    update movimientos_financieros set anulado = true where id = v_movimiento_id;
  end if;

  update compras_insumos set anulada = true where id = p_compra_id;
end;
$$;

revoke all on function fn_completar_pedido(uuid) from public;
revoke all on function fn_cancelar_pedido(uuid) from public;
revoke all on function fn_registrar_compra_insumo(uuid, numeric, integer, date) from public;
revoke all on function fn_anular_compra_insumo(uuid) from public;

grant execute on function fn_completar_pedido(uuid) to service_role;
grant execute on function fn_cancelar_pedido(uuid) to service_role;
grant execute on function fn_registrar_compra_insumo(uuid, numeric, integer, date) to service_role;
grant execute on function fn_anular_compra_insumo(uuid) to service_role;

-- ------------------------------------------------------------------
-- Row Level Security: habilitado, sin policies (ver nota al inicio)
-- ------------------------------------------------------------------
alter table productos enable row level security;
alter table insumos enable row level security;
alter table recetas enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table movimientos_financieros enable row level security;
alter table compras_insumos enable row level security;
alter table push_subscriptions enable row level security;

-- ------------------------------------------------------------------
-- Storage: bucket público para imágenes de productos
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- ============================================================================
-- Fin del script. La base queda lista para usarse con la app.
-- ============================================================================
