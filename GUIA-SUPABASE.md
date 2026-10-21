# Guía: conectar el proyecto a tu Supabase nuevo

Pantalla por pantalla. Al final tienes una lista de comprobación y los errores
más frecuentes.

---

## 0. Antes de empezar

- Cuenta en [supabase.com](https://supabase.com) (la del proyecto nuevo, no la anterior).
- El archivo `supabase/schema.sql` de este paquete. Es el único que hay que ejecutar.
- 10 minutos. El esquema tarda unos segundos.

> **Importante:** no reutilices el proyecto de Supabase antiguo. Las migraciones
> sueltas (`actualizacion-*.sql`) son para bases ya existentes; en una nueva
> **no** hacen falta: `schema.sql` ya las incluye todas.

---

## 1. Crear el proyecto

1. Entra en **supabase.com/dashboard** → botón **New project** (o el selector de
   organización → *New project*).
2. Rellena:
   - **Name:** `wa-professionnels-maroc`
   - **Database Password:** pulsa *Generate a password* y **guárdala** en tu
     gestor de contraseñas. No la necesitas para la web, pero sin ella no podrás
     hacer copias de seguridad ni conectarte por `psql`.
   - **Region:** `West EU (Ireland)` o `Central EU (Frankfurt)` — las más
     cercanas a Marruecos.
   - **Plan:** Free.
3. **Create new project** y espera 1–2 minutos a que termine el aprovisionamiento.

---

## 2. Ejecutar el esquema

1. En el menú lateral izquierdo, abre **SQL Editor**.
2. Pulsa **+ New query**.
3. Abre `supabase/schema.sql` con un editor de texto, **selecciona todo**
   (Ctrl+A) y pégalo en el editor.
4. Pulsa **Run** (o Ctrl+Enter).
5. Debe aparecer **«Success. No rows returned»**.

Si sale un error, no continúes: copia el mensaje y pásamelo. El esquema está
verificado sobre PostgreSQL 16 (más abajo tienes el detalle), así que un error
aquí suele ser que se ha pegado el archivo incompleto.

> Se puede ejecutar más de una vez. Si te falta algo, vuelve a lanzarlo entero:
> no borra datos ni duplica nada.

---

## 3. Copiar las claves a `config.js`

1. Menú lateral → **Project Settings** (la rueda dentada, abajo del todo).
2. Dentro, **API**.
3. Copia estos dos valores de la sección **Project API keys**:

   - **Project URL** → algo como `https://abcdefghijkl.supabase.co`
   - **anon / public** → una clave larga que empieza por `eyJhbGciOi...`

   > La clave `anon` es pública por diseño: va en el navegador y quien protege
   > los datos son las políticas RLS. **No copies** la `service_role` ni la
   > *Secret key*: nunca deben estar en el navegador.

4. Abre `assets/js/config.js` y deja el bloque así (respetando las comillas
   simples):

```js
CW.config = {
  appName: 'WA Professionnels Maroc',

  SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...la-clave-anon-completa...',

  publicDomain: 'wa.professionnelsmaroc.click',

  defaultLang: 'es',
  languages: ['es', 'fr', 'ar'],
  defaultCurrency: 'MAD',
  supportWhatsapp: '+212670964030',
  version: '1.0.0',
  cacheVersion: 'cw-v1',

  freeMaxProducts: 15,
  freeMaxStorageMb: 100
};
```

Solo hay que tocar **`SUPABASE_URL`** y **`SUPABASE_ANON_KEY`**. El dominio y el
teléfono ya están puestos. Si dejas esas dos claves vacías, la app arranca en
**modo demo** con `localStorage` (útil para probar sin base de datos).

---

## 4. Ajustes de autenticación

### 4.1 Desactivar la confirmación por correo

1. Menú lateral → **Authentication** → **Providers**.
2. En la lista, **Email**.
3. Desactiva **Confirm email**.
4. **Save**.

Sin esto, quien se registra no puede entrar hasta confirmar el correo (y hasta
entonces el panel no encuentra su negocio). El esquema de Supabase envía correos
con un límite bajo en el plan gratuito, así que para empezar es mejor desactivarlo.

### 4.2 URLs del sitio

1. **Authentication** → **URL Configuration**.
2. **Site URL:** `https://wa.professionnelsmaroc.click`
3. **Redirect URLs** → *Add URL*:
   - `https://wa.professionnelsmaroc.click/**`
   - `http://localhost:8080/**` (solo si vas a probar en local)
4. **Save**.

---

## 5. Tu cuenta y el primer super administrador

1. Abre tu web (`https://wa.professionnelsmaroc.click/login`) o, en local,
   `login.html` → pestaña **Crear cuenta**.
2. Regístrate con tu correo. El trigger del esquema crea automáticamente:
   - tu fila en `businesses` (con el nombre de negocio que escribas),
   - la categoría «Otros».
3. Entra al panel. Se abre el **asistente de 5 pasos**: complétalo.

4. Vuelve a **Supabase → SQL Editor → New query** y ejecuta, cambiando el correo:

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'tu@correo.com'
on conflict (email) do update set user_id = excluded.user_id;
```

5. **Cierra sesión y vuelve a entrar** en el panel. Aparecerá **🛡️ Administración**
   en el menú lateral.

> Si ya eres el primer administrador y quieres añadir a otro, puedes hacerlo desde
> el propio panel: *Administración → Super administradores*. También funciona
> `select public.make_admin('otro@correo.com');`.

---

## 6. Comprobaciones (2 minutos)

En Supabase:

1. **Table Editor** → en el desplegable *schema: public* deben estar las 10
   tablas: `admin_audit`, `admins`, `business_members`, `businesses`,
   `categories`, `library`, `orders`, `portfolio`, `products`, `site_settings`.
2. **Storage** → debe existir el bucket **`catalog-images`**, marcado como
   **Public**.
3. **Authentication → Users** → debe aparecer tu usuario.

En la web:

4. `https://wa.professionnelsmaroc.click/` carga la home.
5. `/catalogo?b=demo` muestra el catálogo de ejemplo.
6. `/login` te deja entrar y `/dashboard` abre el panel con tus datos.
7. Si publicas tu negocio (Ajustes → Enlace, o Administración → Cuentas →
   Publicar), `/catalogo?b=tu-slug` debe mostrar tu catálogo real.

---

## 7. Errores frecuentes

| Qué ves | Por qué | Solución |
|---|---|---|
| La app sigue en modo demo | `SUPABASE_URL`/`ANON_KEY` vacías o mal copiadas | Revisa `config.js`; debe haber dos cadenas no vacías. |
| `Invalid API key` | Clave incompleta o con espacios | Copia de nuevo la clave `anon` entera. |
| `permission denied for table …` | El esquema no se ejecutó completo | Vuelve a ejecutar `schema.sql` entero. |
| Al registrarse no aparece negocio | Falta el trigger `on_auth_user_created` | Revisa que la sección 3 de `schema.sql` se ejecutó; mira *Database → Triggers*. |
| «Debes confirmar tu correo» | *Confirm email* activo | Paso 4.1. |
| No aparece 🛡️ Administración | Tu usuario no está en `admins` | Paso 5.4 y vuelve a entrar. |
| Error al subir imágenes | Bucket o políticas | Paso 6.2. |
| `new row violates row-level security` | Estás editando datos de otro negocio | Es lo esperado; las políticas lo impiden. |
| Cambios que no se ven en la web | Caché del service worker | Sube `CACHE_VERSION` en `sw.js` y recarga con Ctrl+Shift+R. |

---

## 8. Qué hay dentro del esquema (resumen)

- **10 tablas** con sus índices y claves foráneas en cascada.
- **8 funciones:** `is_admin`, `owns_business`, `can_access_business`,
  `can_manage_business`, `make_admin`, `increment_product_views`,
  `handle_new_user`, `link_member`.
- **2 triggers** sobre `auth.users`: crear el negocio al registrarse y enlazar
  invitaciones/administradores añadidos por correo.
- **RLS activado en las 10 tablas** con 32 políticas: lectura pública del
  catálogo y del porfolio, creación de pedidos sin sesión, lectura solo para el
  negocio y escritura solo para dueño/gestor/admin.
- **Bucket público** `catalog-images` y sus políticas de Storage.
- **Permisos** explícitos para `anon` y `authenticated`.

### Verificación realizada

Se ha ejecutado el esquema en un **PostgreSQL 16 real**, simulando las piezas que
aporta Supabase (`auth.users`, `auth.uid()`, `auth.jwt()`, `storage.*`, roles
`anon`/`authenticated`), y se han probado 41 comprobaciones: creación de tablas,
columnas y funciones, triggers de registro, bootstrap del primer admin,
permisos por rol (anon lee el catálogo pero no los pedidos, el dueño edita lo
suyo y otro usuario no), cobertura de gestores, enlace de invitaciones, contador
de visitas, borrado en cascada y re-ejecución con datos dentro.

Como resultado se corrigió un fallo real: al crear un pedido, la app pedía la
fila insertada (`RETURNING`), lo que exige permiso de **lectura** sobre `orders`
y hacía fallar el pedido con `permission denied` para un visitante sin sesión.
Ahora el pedido se inserta sin `RETURNING` (`assets/js/store.js`).
