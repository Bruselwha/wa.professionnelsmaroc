# WA Professionnels Maroc

Plataforma web multiusuario para que cualquier comercio cree su **catálogo online**
(productos y servicios) y reciba los pedidos **por WhatsApp**. Sin pasarela de pago:
el pedido se envía como mensaje estructurado al WhatsApp del negocio.

- **Dominio:** https://wa.professionnelsmaroc.click
- **WhatsApp de soporte:** +212 670 964 030
- HTML, CSS y JavaScript puros. **Sin paso de compilación.**
- Backend **Supabase** (Postgres + Auth + Storage).
- PWA (manifest + service worker), listo para **Vercel**.
- Tres idiomas: **español, francés y árabe (RTL)**.
- Panel del negocio (pedidos, contactos, agenda, ventas, productos, categorías,
  porfolio, biblioteca, ajustes, plan) y **panel de super administración**.

---

## 1. Estructura

```
index.html              Landing pública
login.html              Registro / acceso
dashboard.html          Panel del negocio
catalogo.html           Catálogo público      → /catalogo?b=slug
porfolio.html           Porfolio público      → /porfolio?b=slug
manifest.webmanifest
sw.js                   Service worker (CACHE_VERSION)
vercel.json             cleanUrls + cabeceras
robots.txt / sitemap.xml
assets/css/             styles, landing, catalog, portfolio, assistant
assets/js/              config, i18n, panel-i18n, store, common, auth,
                        dashboard, catalog, portfolio, assistant, policies
assets/demo/            Imágenes del catálogo de ejemplo
supabase/schema.sql     Esquema COMPLETO para un proyecto nuevo
supabase/*.sql          Migraciones incrementales (proyectos ya existentes)
```

### Páginas y URLs

| Página | URL limpia |
|---|---|
| Home | `/` |
| Acceso | `/login` |
| Catálogo de un negocio | `/catalogo?b=slug-del-negocio` |
| Porfolio de un negocio | `/porfolio?b=slug-del-negocio` |
| Panel | `/dashboard` (no indexado) |

---

## 2. Puesta en marcha desde cero

### Paso 1 · GitHub

1. Crea un repositorio nuevo (puede ser privado).
2. Sube **el contenido** de esta carpeta a la raíz del repo (no la carpeta).
3. No hay `npm install`, ni build, ni dependencias.

### Paso 2 · Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com) (región
   `eu-west-1` o `eu-central-1` para Marruecos).
2. **SQL Editor → New query** → pega **todo** `supabase/schema.sql` → **Run**.
   - Crea tablas, funciones, triggers, RLS, políticas, el bucket público
     `catalog-images` y todas las columnas de las últimas versiones.
   - Es idempotente: puedes volver a ejecutarlo sin miedo.
3. **Settings → API**: copia `Project URL` y la clave `anon public`.
4. **Authentication → Providers → Email**: desactiva *Confirm email* para que el
   registro sea inmediato (si la dejas activa, el usuario debe confirmar antes
   de poder entrar).
5. **Authentication → URL Configuration**:
   - *Site URL*: `https://wa.professionnelsmaroc.click`
   - *Redirect URLs*: `https://wa.professionnelsmaroc.click/**`
   - (Para probar en local añade también `http://localhost:8080/**`).
6. **Primer super administrador**: regístrate desde `/login` y luego ejecuta en
   el SQL Editor, cambiando el correo:

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'tu@correo.com'
   on conflict (email) do update set user_id = excluded.user_id;
   ```

### Paso 3 · Configurar el proyecto

Edita `assets/js/config.js`:

```js
SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOi...',   // clave anon/public, nunca la service_role
publicDomain: 'wa.professionnelsmaroc.click',
supportWhatsapp: '+212670964030',
```

> La clave `anon` es pública por diseño: va en el navegador y RLS protege los
> datos. **Nunca** pongas la `service_role` ni la *Secret key* aquí.

### Paso 4 · Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
2. Framework preset: **Other**. Sin build command ni output directory.
3. **Deploy**. `vercel.json` ya aplica `cleanUrls`, `trailingSlash: false` y las
   cabeceras de caché de `/sw.js`, el manifest y `/assets/*`.

### Paso 5 · Cloudflare (dominio)

El dominio `professionnelsmaroc.click` está en Cloudflare y el subdominio que
usamos es `wa`.

1. En Cloudflare → **DNS → Records → Add record**:
   - **Type:** `CNAME`
   - **Name:** `wa`
   - **Target:** `cname.vercel-dns.com`
   - **Proxy status:** **DNS only** (nube gris) ← importante para que Vercel
     emita el certificado sin conflictos.
2. En Vercel → **Project → Settings → Domains → Add**:
   `wa.professionnelsmaroc.click` y pulsa **Add**. Vercel verificará el CNAME y
   emitirá el certificado (puede tardar unos minutos).
3. Si más adelante quieres activar el proxy de Cloudflare (nube naranja):
   - SSL/TLS → **Full (strict)**
   - Rules → desactivar *Rocket Loader* y el *caching* de HTML para `/dashboard`.

### Paso 6 · Comprobaciones

- `https://wa.professionnelsmaroc.click/` carga la home.
- `/catalogo?b=demo` muestra el catálogo de ejemplo.
- `/login` permite crear una cuenta; al entrar aparece el asistente de 5 pasos.
- `/dashboard` muestra el panel; con el `insert` del paso 2.6 aparece
  **🛡️ Administración**.

---

## 3. Después de cada despliegue

Los HTML enlazan los assets con `?v=N` y el service worker tiene
`CACHE_VERSION`. **Hay que subir los dos** o los visitantes verán la versión
antigua:

1. Cambia `CACHE_VERSION` en `sw.js` (por ejemplo `cw-v14` → `cw-v15`).
2. Cambia el `?v=N` de los archivos que hayas tocado en los HTML.
3. Despliega y recarga con Ctrl+Shift+R.

---

## 4. Modelo de datos

| Tabla | Contenido |
|---|---|
| `businesses` | Un negocio por cuenta: identidad, WhatsApp, moneda, marca, entrega, pagos, SEO, plan y cuotas. |
| `categories` | Categorías de producto o servicio, con `active` para mostrarlas u ocultarlas. |
| `products` | Productos y servicios: precio, promoción, hasta 5 imágenes, `short_desc` para las tarjetas. |
| `portfolio` | Trabajos del porfolio: imagen, título, descripción y orden. |
| `orders` | Pedidos con ítems (`jsonb`), total, estado y cita. |
| `library` | Biblioteca de imágenes (URL y tamaño). |
| `admins` | Super administradores. |
| `business_members` | Cobertura: colaboradores con acceso a un negocio. |
| `admin_audit` | Auditoría de acciones de administración. |
| `site_settings` | Ajustes globales clave/valor (imágenes de la home). |

Funciones SQL: `is_admin()`, `owns_business()`, `can_access_business()`,
`can_manage_business()`, `make_admin()`, `increment_product_views()`.

RLS activado en todas las tablas. El catálogo y el porfolio leen sin sesión;
cualquiera puede **crear** un pedido; solo dueño, colaborador o admin los leen.

---

## 5. Idiomas

`assets/js/i18n.js` contiene los diccionarios `es` / `fr` / `ar` con las mismas
claves. Si añades texto nuevo, añádelo a los tres. Los nombres de categorías y
productos son datos del usuario y **no** se traducen.

---

## 6. Problemas frecuentes

| Problema | Causa | Solución |
|---|---|---|
| No aparece Administración | Tu usuario no está en `admins` | Ejecuta el `insert` del paso 2.6 y vuelve a entrar. |
| Sigue en modo demo | `SUPABASE_URL`/`ANON_KEY` vacías | Rellénalas en `assets/js/config.js`. |
| `permission denied for table` | RLS sin política | Ejecuta `supabase/schema.sql` completo. |
| Al registrarse no se crea el negocio | Falta el trigger | Ejecuta el bloque de triggers de `schema.sql`. |
| Las imágenes no suben | Bucket o políticas | Verifica el bucket público `catalog-images`. |
| El dominio da error 404 en Vercel | Dominio no añadido | Settings → Domains → añádelo y espera la verificación. |
| Error de certificado en Cloudflare | Proxy activado con SSL flexible | Pon SSL/TLS en **Full (strict)** o desactiva el proxy. |
| Veo la versión antigua tras desplegar | Caché del service worker | Sube `CACHE_VERSION` y los `?v=N`. |
| El árabe no se refleja | `dir` no aplicado | Recarga; lo aplica `i18n.js`. |
| «A consultar» en el precio | El precio es 0 | Comportamiento previsto para servicios sin precio. |

---

## 7. Licencia

Uso libre para el proyecto. Ajusta marca y contenidos a tu medida.
