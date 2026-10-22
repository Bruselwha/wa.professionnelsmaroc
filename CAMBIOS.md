# Cambios acumulados (v11 → v13)

## 1. Menú de Administración que desaparecía

**Causa.** `store.isAdmin()` comprobaba el rol con:

```js
sb.from('admins').select('user_id').maybeSingle()
```

Dos problemas en una sola línea:

- No filtraba por usuario: dependía por completo de que las políticas RLS devolvieran una única fila.
- `maybeSingle()` **falla** (error `PGRST116`) en cuanto la tabla `admins` tiene **más de una fila**. Un `.catch(function () { return false; })` se comía el error, así que la app concluía «no eres admin» sin avisar. En cuanto añadiste un segundo super administrador (o una fila por correo sin `user_id`), el botón desapareció.

**Solución** (`assets/js/store.js`):

1. Se usa primero la función SQL `is_admin()`, que es `SECURITY DEFINER` y filtra por `auth.uid()`.
2. Si esa función no existe o falla, se consulta `admins` filtrando por el id del usuario con `limit(1)`.
3. Tercera vía: filas añadidas por correo con `user_id` todavía nulo (se compara el correo de la sesión).
4. Los errores reales ya no se silencian: se registran en la consola con `console.warn`.

**Además** (`assets/js/dashboard.js`): nuevo `applyAdmin()` que muestra/oculta el enlace en ambos sentidos; al entrar en `#admin` se vuelve a comprobar el permiso en lugar de mostrar un `403` seco; y se revalida al volver a la pestaña.

## 2. Información del negocio que no se guardaba

**Causa A (la principal).** La ficha envía `region`, `city` y `address`, pero la tabla `businesses` **no tiene esas columnas**. Postgres rechaza entonces **toda** la actualización con el error `42703`. La promesa se quedaba sin manejar: ni guardado, ni aviso, ni error visible.

**Causa B.** Los avisos usaban la clase `.cw-toast`, que **no tenía estilos** en `styles.css` (solo existía `.toast`). Aunque el guardado hubiera funcionado, el usuario no veía ninguna confirmación.

**Solución:** `saveBusiness()` limpia el parche y reintenta sin las columnas inexistentes; la ficha valida, bloquea el botón mientras guarda y avisa de errores; se añaden los estilos de `.cw-toast`; y un SQL nuevo añade las tres columnas.

> Ejecuta `supabase/actualizacion-info-negocio.sql` para que ciudad, región y dirección se guarden de verdad.

## 3. Catálogo: barra superior y sin orden

- La barra con **selector de categorías y buscador** pasa a ser el **primer bloque del catálogo**, justo debajo de la cabecera (antes de la portada y de las tarjetas de entrega/pago). Sigue siendo fija al desplazarse.
- Se **elimina el selector de orden** (recomendado / precio ascendente / precio descendente / novedades) y todo su código. El orden queda fijo por el campo `sort_order`, que ya se edita en el panel.
- Las categorías del selector se agrupan por tipo igual que antes y el filtro por tipo se conserva.

## 4. Activar y desactivar categorías

Funciona exactamente igual que en Productos:

- **Base de datos:** nueva columna `active boolean not null default true` en `categories`
  (`supabase/actualizacion-categorias-activas.sql`).
- **Panel:** columna «Estado» con interruptor en la tabla de Categorías. Al pulsarlo se guarda al instante, con aviso de confirmación. Si falta la columna, el aviso explica qué SQL ejecutar.
- **Catálogo público:** las categorías desactivadas **no aparecen en el selector**, y sus artículos **tampoco se muestran** en la rejilla (igual que un producto inactivo). No se borra nada: al reactivarla vuelve todo.

## 5. Home

- **Sección de planes eliminada** del HTML, junto con los tres enlaces «Precios» que apuntaban a `#planes` (navegación de escritorio, menú móvil y pie). No quedan anclas muertas.
- **En móvil (≤720 px)**, «Iniciar sesión» y «Crear mi catálogo» desaparecen de la cabecera y quedan **solo dentro del menú desplegable**. El selector de idioma permanece visible.

## 6. Pop-up de políticas en login y catálogo

- `policies.js` enlazaba los enlaces **una sola vez** al cargar el documento. En el catálogo el pie se genera después de cargar los datos, así que los enlaces no hacían nada. Ahora usa **delegación de eventos**: funciona con cualquier pie, presente o futuro.
- **Login:** nuevo pie legal con los 6 enlaces (Aviso legal, Privacidad, Cookies, Términos, Devoluciones, Envíos) y el año, dentro de la tarjeta de acceso, más el script de políticas.

## 7. Traducciones

11 claves nuevas en español, francés y árabe:

`set.save.error`, `set.save.partial`, `set.name.required`, `set.link.required`, `adm.checking`, `adm.denied`, `adm.denied.desc`, `cat.toggle`, `cat.toggle.hint`, `cat.toggle.on`, `cat.toggle.off`, `cat.toggle.missing`.

## 8. Caché

`CACHE_VERSION` pasa a `cw-v12` y los `?v=` suben: `catalog.js` 11, `policies.js` 7, `landing.css` 7, `styles.css`/`i18n.js`/`store.js` 11, `dashboard.js` 11.

## Archivos tocados

    assets/js/store.js        (isAdmin, saveBusiness tolerante)
    assets/js/dashboard.js    (applyAdmin, #admin, guardado, interruptor categorías)
    assets/js/catalog.js      (barra arriba, sin orden, categorías activas)
    assets/js/policies.js     (delegación de eventos)
    assets/js/i18n.js         (+12 claves × 3 idiomas)
    assets/css/styles.css     (.cw-toast, .auth-legal, .is-saving, .invalid)
    assets/css/landing.css    (botones de cabecera en móvil)
    index.html / login.html / dashboard.html / catalogo.html
    sw.js                     (cw-v12)
    supabase/actualizacion-info-negocio.sql       (NUEVO)
    supabase/actualizacion-categorias-activas.sql (NUEVO)

## Verificación

**51 pruebas con jsdom, todas correctas** (24 de panel/datos + 27 de catálogo, panel de categorías, políticas y home).

---

# Añadidos en v13

## 9. Descripción corta en las tarjetas

- **Supabase:** columna `short_desc text` en `products` → `supabase/actualizacion-descripcion-corta.sql`.
- **Panel:** nuevo campo «Descripción corta para las tarjetas» en el formulario de producto, limitado a 90 caracteres.
- **Catálogo:** la tarjeta muestra ese texto. Si está vacío, se recorta la descripción larga a **90 caracteres** (corte en palabra completa y puntos suspensivos). Se aplica a tarjetas de producto y de servicio.

## 10. Porfolio

**Página pública** `porfolio.html?b=<slug>`:

- Cabecera con la marca del negocio, selector de idioma, enlace al catálogo y WhatsApp.
- Rejilla de trabajos: imagen, título y descripción breve.
- Pie con las políticas en pop-up y enlace de vuelta al catálogo.
- Solo muestra los trabajos activos.
- El catálogo enlaza al porfolio en la cabecera y en el pie **solo si hay trabajos publicados**.

**Editor en el panel** (`#portfolio`, dentro del grupo Catálogo):

- Lista con miniatura, título, orden, interruptor de visible/oculto, editar y eliminar.
- Formulario con título (obligatorio), descripción breve (máx. 220), imagen desde la biblioteca, orden y visibilidad.
- Botón para abrir la página pública en otra pestaña.

**Base de datos:** `supabase/portfolio.sql` crea la tabla `portfolio` con índices, RLS y políticas (lectura pública; escritura para dueño, colaborador gestor o super administrador mediante `can_manage_business`).

## 11. Categorías desactivadas: cambio de criterio

Ahora la categoría desactivada **solo desaparece del selector**, pero **sus artículos siguen visibles bajo «Todas»**. El interruptor del panel no cambia.

## 12. Extras

- Se añaden las imágenes de ejemplo `assets/demo/*.svg` que faltaban en la entrega anterior.
- Si la tabla `portfolio` todavía no existe, el panel y el catálogo siguen funcionando: simplemente no muestran porfolio.

## 13. Caché

`CACHE_VERSION` pasa a `cw-v13`; `catalog.js` 12, `dashboard.js` 12, `catalog.css` 7, `portfolio.js`/`portfolio.css` 1.

## Archivos nuevos

    porfolio.html
    assets/js/portfolio.js
    assets/css/portfolio.css
    supabase/actualizacion-descripcion-corta.sql
    supabase/portfolio.sql

## Verificación

**74 pruebas con jsdom, todas correctas.**

---

# Añadidos en v14

## 14. Reordenar el porfolio arrastrando

- La lista de trabajos del panel (`#portfolio`) ya no es una tabla: es una lista con **asa de arrastre** (⠿).
- Se arrastra con ratón, dedo o lápiz (Pointer Events, no HTML5 drag & drop, para que funcione también en táctil).
- Mientras arrastras, la fila se coloca en su nueva posición; al soltar se guarda el orden de golpe y solo se actualizan los trabajos que han cambiado de sitio.
- También funciona con **teclado**: con el asa enfocada, las flechas ↑ ↓ suben y bajan el trabajo.
- El formulario ya **no pide el número de orden**. Un trabajo nuevo se coloca al final y luego se mueve arrastrando.
- La columna «Orden» desaparece de la lista; el orden real es el de las filas.

## 15. Teléfonos de la home

Cambiado el móvil de ejemplo (`.phone`) para que sea un marco tipo iPhone y escale bien:

- **Bisel casi negro** de 11 px y **isla superior** (notch) superpuesta al contenido, en lugar de una píldora gris dentro del flujo.
- **Proporción fija 9:19.5** con `aspect-ratio`: la altura se calcula sola a partir del ancho, así el móvil no se deforma ni se estira cuando cambia el tamaño de pantalla.
- Radio exterior de 46 px (38 px en el pequeño) y radio interior de 36 px, proporcionales al ancho.
- Sombra suave y algo de luz en el borde para que despegue del fondo.
- **Móvil:** el del hero pasa a `min(72vw, 248px)` y los dos de la sección del problema a `min(46vw, 160px)`, con el contenido interior compactado para que no se recorte dentro del marco.
- Pie de foto en cursiva, como en la referencia.

> La captura que enviaste mide 238 × 2048 px (página completa): cada móvil ocupa unos 66 px de ancho. De ahí se pueden leer **el estilo y las proporciones** (bisel negro, isla, esquinas muy redondeadas, sombra, vertical 9:19.5), pero **no los tamaños exactos en píxeles**. He igualado estilo y proporciones; para clavar el tamaño haría falta una captura a resolución completa (o solo del hero, sin reducir).

## 16. Caché

`CACHE_VERSION` pasa a `cw-v14`; `styles.css` 12, `landing.css` 8, `i18n.js` 12, `dashboard.js` 13.

## Verificación

**83 pruebas con jsdom, todas correctas** (las nuevas cubren el reordenado: orden inicial, arrastre hacia abajo, guardado de `sort_order`, flechas del teclado y ausencia del campo numérico).

---

# v15 · Proyecto nuevo: WA Professionnels Maroc

Preparado para desplegarse como proyecto independiente.

## Marca

- Nombre visible: **WA Professionnels Maroc** (logo `WA` + `Professionnels Maroc`).
- Cambiado en: los 5 HTML (títulos y logotipos), `manifest.webmanifest`,
  `config.js` (`appName`), `i18n.js` (`app.name` en es/fr/ar), `catalog.js`
  (título de página, pie y botón de catálogo no encontrado), `portfolio.js`,
  `common.js` (texto al compartir) y el nombre de caché del service worker.
- `short_name` del manifest: **WA Maroc** (para que quepa bajo el icono).

## Dominio y teléfono

- `publicDomain: 'wa.professionnelsmaroc.click'` en `config.js`.
- `supportWhatsapp: '+212670964030'` (activa el botón flotante de WhatsApp).
- `canonical`, `og:url`, `og:image`, `hreflang`, `sitemap.xml` y `robots.txt`
  apuntan al dominio nuevo.
- `schema.org` de la organización incluye `telephone` y `contactPoint` con
  `+212670964030` y los tres idiomas.

## Supabase

- Nuevo **`supabase/schema.sql`**: esquema completo para un proyecto nuevo.
  Incluye las 10 tablas, las 6 funciones, los 2 triggers sobre `auth.users`,
  RLS y políticas de todas las tablas, el bucket público `catalog-images` con
  sus políticas y los permisos.
- Ya incorpora las columnas de las últimas versiones (`region/city/address`,
  `categories.active`, `products.short_desc`) y la tabla `portfolio`.

## Imágenes que faltaban

- `assets/og.png` (1200 × 630) para compartir en redes y mensajería.
- `assets/icon-192.png` y `assets/icon-512.png` para instalar la PWA.

## Documentación

- `README.md` reescrito como guía de despliegue: GitHub → Supabase → Vercel →
  Cloudflare, con el paso del primer super administrador, comprobaciones y
  problemas frecuentes.

## Ajustes de interfaz por el nombre más largo

- `.brand-name` del panel se parte en dos líneas sin romper el sidebar.
- En móvil el logotipo de la home usa `clamp(.82rem, 3.4vw, 1rem)` para que
  quepa junto al selector de idioma y el botón de menú a 360 px.

---

# v16 · Verificación del esquema contra PostgreSQL real

## Comprobado

Se montó un PostgreSQL 16 real simulando lo que aporta Supabase (`auth.users`,
`auth.uid()`, `auth.jwt()`, `storage.buckets/objects` y los roles
`anon`/`authenticated`) y se ejecutó `supabase/schema.sql` dos veces, con 41
comprobaciones:

- Se crean las 10 tablas, las 8 funciones, los 2 triggers, 32 políticas, el
  bucket público y los permisos.
- Al registrarse se crea el negocio con el slug del formulario, se crea la
  categoría «Otros» y los slugs repetidos se hacen únicos.
- `is_admin()` y `make_admin()`: bootstrap del primero, enlace del `user_id` y
  bloqueo para quien no es admin.
- Permisos por rol: anon lee catálogo/porfolio y crea pedidos, pero no lee
  pedidos; el dueño edita lo suyo y otro usuario no; el gestor de cobertura sí;
  `site_settings` solo lo escribe el admin.
- Enlace de invitaciones por correo, contador de visitas y borrado en cascada.
- Re-ejecutar el esquema con datos dentro no rompe nada ni pierde datos.

## Correcciones

1. **Pedidos que fallaban con `permission denied`** (fallo real, habría roto la
   creación de pedidos en el proyecto nuevo): `createOrder()` hacía
   `insert(...).select()`, y `RETURNING` exige privilegio de **lectura** sobre
   `orders`, que `anon` no tiene (ni debe tener). Ahora inserta sin `RETURNING`
   y devuelve el objeto que ya está en memoria (`assets/js/store.js`).
2. **`pgcrypto`**: la creación de la extensión va dentro de un bloque tolerante,
   porque `gen_random_uuid()` es nativo desde PostgreSQL 13. En Supabase no
   cambia nada; fuera de Supabase evita que el script aborte.

## Documentación

- Nuevo **`GUIA-SUPABASE.md`**: pantalla por pantalla (crear proyecto, SQL
  Editor, claves, autenticación, primer admin, comprobaciones y errores).

---

# v17 · Menú del catálogo

- «Todas las categorías» y el buscador pasan a ser una **barra de menú blanca
  pegada a la cabecera**, fija al desplazarse (antes era una banda gris suelta).
- El selector lleva icono de menú a la izquierda y flecha a la derecha,
  dibujados en CSS (sin imágenes externas), con foco visible.
- El buscador lleva la lupa dentro del campo.
- En móvil se despliega con el botón «Filtros» y cada campo ocupa todo el ancho,
  como una lista de menú.
- Reflejado también en árabe (RTL): lupa e iconos cambian de lado.
- `styles.css` → 13, `catalog.css` → 8, `CACHE_VERSION` → `cw-v15`.

---

# v18 · Asistente, menú, porfolio, reservas de servicio y más

## 1. Asistente en lugar de WhatsApp

- El botón de WhatsApp de la cabecera del catálogo pasa a ser **🤖 Asistente**,
  que abre el asistente inteligente existente (responde sobre el catálogo y
  recopila nombre, teléfono y necesidad). El botón flotante se mantiene.

## 2. Menú del catálogo

- «Todas las categorías» + buscador viven ahora **dentro de la cabecera**, entre
  el logo y el selector de idioma.
- En móvil la cabecera queda **solo con el logo, el título y la hamburguesa**;
  el desplegable contiene buscador, categorías, tipo, idioma, porfolio y asistente.

## 3. Porfolio

- Las imágenes se ven **completas** (`object-fit: contain`) en un marco uniforme,
  también en móvil (marco cuadrado).
- Al pulsar un trabajo se abre un **pop-up** con imagen grande, descripción,
  **detalles en lista**, cliente, lugar y fecha, más un botón «Quiero algo así».
- El editor del panel incorpora esos campos (detalles, cliente, lugar, fecha).

## 4. Reserva de servicios

- Los servicios reservables muestran **📅 Reservar**, que abre un formulario
  propio (distinto del de producto): calendario del mes, días cerrados según el
  horario del negocio, **horas reales ya ocupadas** y detalles de la cita.
- La cita viaja con el artículo en el carrito y se incluye en el mensaje de
  WhatsApp (fecha, hora, detalles y dirección si es a domicilio).
- Nueva función SQL `busy_slots()`: el catálogo consulta la disponibilidad sin
  permiso de lectura sobre los pedidos.

## 5. Home

- Padding del móvil del hero ajustado en pantallas estrechas.
- Las tarjetas de **TIPOS DE NEGOCIO** son botones y abren un pop-up con qué
  vender, categorías que funcionan y funciones útiles para ese negocio.

## 8. Página de servicios en el panel

- Nueva sección **🔧 Servicios** con su lista (solo servicios), buscador,
  interruptor de estado, editar y eliminar.
- «Nuevo servicio» abre la ficha con: duración, modalidad, reserva con
  calendario y **requisitos o información previa** (se muestran al reservar).
- La página de Productos ahora lista solo productos.

## 10. Biblioteca

- Zona de **arrastrar y soltar** imágenes (también sobre la propia rejilla),
  con resaltado al pasar por encima y aviso si el archivo no es una imagen.

## SQL nuevo

    supabase/schema.sql                          (actualizado)
    supabase/actualizacion-porfolio-detalles.sql
    supabase/actualizacion-servicios.sql
    supabase/actualizacion-citas.sql

## Caché

`CACHE_VERSION` → `cw-v16`; `styles.css` 14, `landing.css` 9, `catalog.css` 9,
`portfolio.css` 2, `i18n.js` 13, `catalog.js` 13, `dashboard.js` 14,
`portfolio.js` 2, `assistant.js` 7, `landing.js` 1.

## Pendiente (siguiente bloque)

- **6. Contenido en varios idiomas**: campos traducibles en negocio, categorías,
  productos, servicios y porfolio, con editor en el panel y respaldo al idioma
  base.
- **7. Editar el contenido de la demo** desde el panel.

## Verificación

145 comprobaciones: 77 jsdom catálogo/panel, 24 jsdom datos y 44 sobre
PostgreSQL 16 real.

---

# v19 · Contenido multiidioma

Cada negocio, categoría, artículo y trabajo del porfolio puede tener su versión
en **francés** y **árabe**. El español (o el idioma en que se escribe) sigue
siendo el idioma base.

## Cómo funciona

- Nueva columna `i18n` (jsonb) en `businesses`, `categories`, `products` y
  `portfolio`, con esta forma:

      { "fr": { "name": "...", "description": "..." }, "ar": { "name": "..." } }

- Nuevo helper `CW.tx(fila, campo)`: devuelve la traducción del idioma activo y,
  si no existe o está vacía, **cae al idioma base**. Nunca deja un hueco.
- El catálogo público, la ficha de cada artículo, el carrito, el mensaje de
  WhatsApp, la reserva de servicios y el porfolio usan ya ese helper, así que
  todo el contenido cambia al pulsar la bandera.

## Editor en el panel

- **Negocio** → Ajustes → Información del negocio: nombre, descripción, título
  y descripción del encabezado, en francés y árabe.
- **Categoría** → nombre y texto alternativo.
- **Producto / Servicio** → nombre, descripción corta y descripción.
- **Porfolio** → título, descripción y detalles.

Cada ficha muestra una tarjeta «Traducciones» con una columna por idioma (la
árabe con `dir="rtl"`). Lo que se deje vacío no se guarda y se muestra el texto
base. El buscador del catálogo también encuentra por el nombre traducido.

## SQL

    supabase/schema.sql                     (actualizado)
    supabase/actualizacion-multidioma.sql   (para bases existentes)

## Caché

`CACHE_VERSION` → `cw-v17`; `styles.css` 15, `i18n.js` 14, `common.js` 11,
`catalog.js` 14, `portfolio.js` 3, `dashboard.js` 15.

## Verificación

162 comprobaciones: 90 jsdom de catálogo/panel (incluye traducciones y respaldo),
24 de datos y 48 sobre PostgreSQL 16 real.

---

# v20 · Editar la demo desde el panel

La página de demostración (`catalogo.html?b=demo` y `porfolio.html?b=demo`) deja
de estar en el código: su contenido se guarda en `site_settings.demo_catalog` y
se edita desde el panel.

## Dónde

**Administración → Demo** (nueva pestaña, solo super administradores). Desde ahí:

- **Negocio:** nombre, descripción, WhatsApp, moneda, color de marca, título y
  descripción del encabezado, plazo de entrega, tarifa, horario e intervalo de
  citas.
- **Categorías:** añadir, renombrar, cambiar entre producto/servicio y eliminar.
- **Artículos y servicios:** imagen (biblioteca o URL), nombre, precio, precio
  de oferta, descripción corta, descripción, categoría y tipo. Añadir y eliminar.
- **Porfolio:** imagen, título y descripción de cada trabajo. Añadir y eliminar.

Botones **Guardar** y **Restaurar original** (vuelve al contenido de fábrica).

## Cómo funciona

- `CW.demoCatalog()` define el contenido por defecto; `CW.demoCatalogMerged()`
  mezcla lo guardado encima, así que si un campo falta se usa el original.
- El catálogo y el porfolio públicos leen `site_settings.demo_catalog` cuando
  entran en modo demo. Sin cambios, se ven exactamente como antes.
- No hace falta SQL nuevo: usa la tabla `site_settings` que ya existe (lectura
  pública, escritura solo para el super administrador).

## Caché

`CACHE_VERSION` → `cw-v18`; `styles.css` 16, `i18n.js` 15, `common.js` 12,
`catalog.js` 15, `portfolio.js` 4, `dashboard.js` 16.

## Verificación

173 comprobaciones: 101 jsdom de catálogo/panel (incluye guardar la demo y verla
reflejada en el catálogo público), 24 de datos y 48 sobre PostgreSQL 16 real.
