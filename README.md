# Mi Repostería

App web (PWA instalable en iOS) para gestionar un negocio familiar de repostería: pedidos, agenda de entregas, inventario de insumos, productos/recetas y finanzas. Pensada para 2 dueñas con un único acceso compartido, mobile-first, en español.

- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Storage)
- **Auth:** contraseña única compartida (sin tabla de usuarios), cookie de sesión firmada de 30 días

> La base de datos de Supabase ya está creada (ver [`supabase/schema.sql`](./supabase/schema.sql) si necesitas revisar el esquema). Los pasos de abajo son solo los necesarios para abrir la app en un iPhone.

## 1. Variables de entorno

Crea un archivo `.env.local` con:

```bash
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
APP_PASSWORD=elige-una-contraseña-segura
SESSION_SECRET=una-cadena-aleatoria-larga-para-firmar-la-sesion
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son las de tu proyecto ya creado (**Project Settings → API** en Supabase; usa la **service_role key**, no la `anon`).

## 2. Desplegar en Vercel

iOS solo permite instalar la app como PWA ("Agregar a pantalla de inicio") si se sirve por **HTTPS**, así que necesitas desplegarla:

1. Sube el proyecto a un repositorio (GitHub/GitLab/Bitbucket) o usa `vercel` desde la CLI.
2. En Vercel, **Import Project** y selecciona el repositorio.
3. En **Environment Variables**, agrega las 4 variables del paso 1 con tus valores reales.
4. Deploy.

## 3. Instalar la PWA en iPhone

1. Abre la URL desplegada en **Safari** (no funciona desde Chrome en iOS).
2. Toca el ícono de **Compartir** (el cuadrado con la flecha hacia arriba).
3. Elige **"Agregar a pantalla de inicio"**.
4. Confirma el nombre y toca **Agregar**.
5. Abre la app desde el ícono en la pantalla de inicio: se abre a pantalla completa (sin la barra de Safari).

Al abrir la app, te pedirá la contraseña configurada en `APP_PASSWORD`.
