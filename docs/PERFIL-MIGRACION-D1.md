# Perfil de la migración de CEN Laboratorios a Cloudflare D1

Medido el **2026-11-03**. Encargo: `C:\Users\crist\Desktop\nem-d1\docs\PROMPT-MIGRACION-LABS.md`. Método: `MANUAL-VERIFICACION-PLATAFORMAS.md` (secciones 1–10).

Etiquetas: **[medido]** salió de un comando de hoy · **[estimado]** cálculo sobre lo medido · **[no verificado]** no se pudo comprobar.

**Producción no se tocó.** Solo se usaron:
- `wrangler whoami` y `wrangler deployments list` (lectura);
- un GET a `/login`;
- la analítica GraphQL (lectura);
- la API de Supabase **solo con GET/HEAD**, imprimiendo solo agregados.

No se usó ningún comando `wrangler` que escriba ni se entró con ninguna cuenta.

> **Dónde vive este archivo.** El encargo pedía el perfil en el worktree `cen-dashboard`. Ahí trabajan Codex y otras sesiones (163 archivos sin commit), así que el perfil vive en la carpeta del piloto, `C:\Users\crist\Desktop\labs-d1\docs\`. Esa carpeta será la de producción después del cambio (decisión del usuario del 2026-11-03, como en Financiera).

---

## 0. Decisiones tomadas

| Tema | Decisión | Quién y cuándo |
|---|---|---|
| Recuperación de contraseña por correo | **Se quita.** El login dice «Avísale a tu maestro» y CEN cambia la clave con `cambiar-clave.mjs`, como en NEM | Usuario, 2026-11-03 |
| Next 16 | **Sí, en esta migración, pero como etapa A medida aparte** (Next 16 todavía sobre Supabase). La etapa B es D1. Si Next 16 trae algo que no se resuelve rápido, D1 va sobre 15.5 y Next 16 se pospone | Usuario («si es sin fallas»), 2026-11-03 |
| Qué carpeta queda como producción | **La del piloto** (`Desktop\labs-d1`). `cen-dashboard` y `cen-deploy` se bloquean al final (10e.20) | Usuario, 2026-11-03 |
| Congelación de contenido | Codex lleva ~2 días quieto (usuario). Lo medido: último cambio en `cen-dashboard` el 2026-11-01 a las 11:50 (ver §1.3). **Falta fijar la fecha** a partir de la cual no se publica en `cen-dashboard` | Pendiente |

---

## 1. Qué está en producción y cómo se demostró **[medido]**

### 1.1 La versión activa

`npx wrangler deployments list --name cen-dashboard` (solo lectura): la versión activa es **`8028185d-32c1-494e-aad7-d5446876346a`**, al 100 %, creada el **2026-11-01 01:42:49 UTC** (31-oct, 19:42 en México).

Despliegues anteriores, para el regreso:

| Versión | Fecha (UTC) |
|---|---|
| e5ed9461 | 2026-10-31 01:31 |
| 194e6667 | 2026-10-31 00:55 |
| 3cfad647 | 2026-10-29 14:47 |
| d3c1059c | 2026-10-29 14:19 |

### 1.2 El commit

- **Producción = `0b9ddf8` construido en el worktree `cen-deploy`.**
- **La prueba:**
  - el HTML de `https://cenlaboratorios.com.mx/login` contiene el `BUILD_ID` **`NDf8dIzn1FTspSvklMkoh`**;
  - es el mismo de `cen-deploy/.next/BUILD_ID`, escrito el 31-oct a las 19:26, 16 min antes del despliegue;
  - `next-env.mjs` es de las 19:27.
- **Lo que trae además de `0b9ddf8`:** `cen-deploy` tiene 13 archivos sin commit, todos generados por `deploy:cf` (`gen-lab-registry` y `gen-lab-briefings`):
  - `public/labs-data/briefing/mecanica-251…260.json`;
  - `src/labs/_briefing-meta.generated.ts`, `_catalogo.generated.ts` y `_registry.generated.ts`.
- **`main` (`534d168`) frente a `0b9ddf8`:** solo agrega docs de continuidad, una captura y `scripts/auditoria/solidos-produccion.mjs`. Ningún archivo servido.
- **El piloto parte de `534d168`.** Tiene el mismo código que producción.

### 1.3 Lo que hay en `cen-dashboard` y no está en producción

- **163 archivos sin commit:** 110 nuevos y 53 modificados.
- **Qué son:** el trabajo de **Mecánica 261–270**, a medio hacer y sin publicar:
  - `public/labs`: 44;
  - `public/labs-data`: 50;
  - `scripts/auditoria`: 16;
  - `src/labs`: 13;
  - `docs/continuidad`: 12;
  - `scripts/lab-src`: 10;
  - portadas: 10;
  - además `src/lib/voz/hecha.ts`, `scripts/build-lab.mjs` y 3 pruebas.
- **Último cambio:** 2026-11-01 a las 11:50 (`docs/continuidad/mecanica-270.md`).
- **El piloto NO los incluye.** Para no perderlos, hay que elegir una de dos:
  - **(a)** terminarlos y hacer commit en `cen-dashboard` antes de la congelación, y el piloto los trae con `git pull`;
  - **(b)** se mudan al piloto después del cambio.

  Ver §12.

---

## 2. La base de Supabase (`wbvcclpxxwzkuddjxqig`)

### 2.1 Lo que se ve por la API (solo GET) **[medido]**

| Tabla | Filas | Columnas |
|---|---:|---|
| `profiles` | 42 | id uuid, email, full_name, role, created_at |
| `intentos` | 304 | id, id_alumno, sim_id, status, score, total_time_seconds, last_step, **bitacora_data jsonb**, started_at, completed_at |
| `alumnos_grupos` | 22 | id_alumno, id_grupo |
| `grupos` | 4 | id, nombre, id_profesor, created_at |
| `asignaciones` | 0 | id, id_profesor, sim_id, planned_date (date), **id_grupo text**, created_at |
| **Total** | **372** | |

- **Funciones expuestas por la API:** `rls_auto_enable`. Por el nombre, parece la función de evento que agrega Supabase **[no verificado]**.
- **`auth.users`:** 43, en 5 dominios de correo y 42 confirmados.
  - Iniciaron sesión en los últimos 30 días: **2**.
  - Nunca han iniciado sesión: **34**.
  - 1 usuario de auth no tiene `profiles`.
- **Roles en `profiles`:** 33 `alumno`, 8 `profesor` y 1 `admin`.
- **Storage:** 0 buckets.
- **Auth:** solo correo y contraseña. **Registro público ENCENDIDO** (`disable_signup: false`), con confirmación por correo (`autoconfirm: false`). Hay que apagarlo antes de la ventana (criterio 13).

**Comparado con NEM** (38,575 filas) y Financiera (15 tablas), Labs es **la base más chica de las tres**: 5 tablas y 372 filas. Mover los datos es lo de menos.

### 2.2 Lo que se ve por Postgres **[medido: `scripts/d1/exportar.mjs`, una transacción `READ ONLY`, 2026-11-03]**

- **5 tablas** con RLS activo. Ninguna vista. Los mismos conteos que por la API.
- **12 políticas, todas `PERMISSIVE`** (ninguna `RESTRICTIVE`: el traductor no tiene que unir con AND). Por tabla:
  - `profiles`: SELECT para cualquier autenticado, UPDATE e INSERT del propio;
  - `intentos`: el alumno lee, inserta y actualiza los suyos; el profesor lee los de sus grupos; el admin, todos;
  - `alumnos_grupos`: el alumno lee los suyos; el profesor los de sus grupos; el admin, todos. **No hay política de INSERT:** el upsert de `AlumnosContent` (asignar alumno a grupo desde el panel) **ya falla hoy en producción** **[por confirmar con el oráculo]**;
  - `grupos`: SELECT para cualquier autenticado;
  - `asignaciones`: SELECT para cualquier autenticado, y ALL para el profesor dueño.
- **2 funciones `SECURITY DEFINER`:**
  - `handle_new_user`, del trigger `on_auth_user_created` en `auth.users`: crea el perfil y el vínculo al grupo;
  - `rls_auto_enable`: la función de evento de Supabase que activa RLS en tablas nuevas. No aplica a D1.
- **Restricciones:**
  - `intentos` UNIQUE `(id_alumno, sim_id, status)` y CHECK de status (`in_progress`, `completed`, `abandoned`);
  - `profiles` UNIQUE en el correo y CHECK de rol (`alumno`, `profesor`, `admin`);
  - FK con CASCADE / SET NULL;
  - `asignaciones.id_grupo` es texto con valor por omisión `'all'`.
- **Permisos:** las tablas tienen todos los GRANT para anon y authenticated (lo de siempre en Supabase; manda RLS). No hay `REVOKE` por columna que emular.
- **Nada que corra solo:** sin `pg_cron`, sin storage, sin `pg_net` en uso. Las extensiones son las estándar.
- **Auth:** 43 usuarios, **los 43 con hash bcrypt**, solo el proveedor de correo, ninguno baneado ni borrado.
- **Revisión de abuso:** las 9 cuentas de profesor y admin son de dominios de CEN, su rol coincide con el de su alta y ninguna se creó después de octubre. **No hay señales de que alguien haya usado la escalada de §10.1.**

> La exportación `.export/dump.json` es **de antes** del arreglo de §10.1. La exportación fresca de la ventana ya trae el estado nuevo.

### 2.3 Las cuentas raras que ya existen (10c.9) **[medido]**

| Caso del manual | En Labs |
|---|---|
| Docente **sin grupos** | **7 de 8 docentes.** Es el caso que en Financiera mandó 7,396 peticiones en 12 s. Aquí es lo normal, no la excepción |
| Docente con muchos salones | El que más tiene, 3 grupos |
| Alumno en dos grupos | 0 casos; habrá que crearlo con cuentas sintéticas |
| Alumno sin grupo | 12 |
| Grupo guardado por id | **`asignaciones.id_grupo` es `text`**, no uuid: el grupo se guarda como texto. Hoy hay 0 asignaciones, pero el camino existe |
| Clave más corta que el mínimo del formulario | [no verificado]: requiere revisar el formulario y no se puede medir sin las claves |

### 2.4 Cuándo se usa **[medido]**

Por `intentos.started_at`, en hora de México:
- **Por mes:** abr 47, may 16, jun 8, jul 4, ago 6, sep 10, **oct 163**, nov 50.
- **Por hora:** de 9 a 10 h (124), 19 h (39) y 17 h (21).
- **Por día:** domingo (91) y miércoles (72) son los más cargados.

Con 2 cuentas activas en 30 días, buena parte del avance reciente parece de las verificaciones del equipo («login confirmado» en los relevos) **[estimado]**.

---

## 3. Lo que toca la base fuera de la app (1b, 10a.1) **[medido]**

Búsqueda del id `wbvcclpxxwzkuddjxqig` y de la ruta de la carpeta (`Proyecto LABS`, `cen-dashboard`, `cenlaboratorios`). Se buscó en:
- el Escritorio, Documentos y Descargas;
- `.gemini\antigravity\scratch`, `OneDrive\Escritorio`, `C:\tmp` y `.claude`.

Se excluyeron node_modules, .next, .open-next, .git y los medios. No se ejecutó ningún script.

### 3.1 Scripts del repositorio

| Script | Qué hace | Destino tras el cambio |
|---|---|---|
| `scripts/crear-cuentas-demo.mjs` | **Escribe** en `auth.users` (createUser) y hace upsert en `profiles` | Pasar a D1 (`cliente-node.mts`): es la herramienta de altas de Labs |
| `scripts/piloto-setup.ts` | **Escribe**: auth.users, update de profiles, insert en grupos y alumnos_grupos | Bloquear (uso único, mayo) |
| `scripts/final_cleanup.ts` | **Borra TODO** profiles y todos los usuarios de auth | Bloquear. Es destructivo |
| `scripts/import_real_data.ts` | **Escribe** en auth.users; el trigger llena profiles y alumnos_grupos | Bloquear (uso único, abril) |
| `scripts/check_profiles.ts` | Solo lee profiles | Declarar muerto |
| `scripts/auditoria/ciencias50-produccion.mjs`, `elementos-produccion.mjs`, `solidos-produccion.mjs` | Son las auditorías que siguen a cada publicación (**flujo en curso** de Codex y otras sesiones). Entran con la cuenta piloto real, completan labs (la app escribe en `intentos`) y releen con GET a `/rest/v1/intentos` | Adaptar. Tras el cambio no escriben en silencio: **fallan**, porque tienen fija la URL de PostgREST |

Los 4 que escriben leen las llaves de `.env.local`. Al apartar las llaves a `.env.supabase-archivo` (§12), truenan en vez de escribir en la base vieja.

### 3.2 Fuera del repositorio

| Archivo | Riesgo |
|---|---|
| `scratch\Proyecto LABS\list_users.ts` (abril) | **Trae escrita la llave `service_role` VIGENTE.** Comprobé que es idéntica a la de `.env.local` sin imprimirla. Solo lista usuarios, pero la llave sirve para todo. **Rotar la llave y borrar el archivo** |
| `Documents\Codex\2026-10-21\…\work\lee-escala-notas50.mjs` (29-oct, Codex) | **Lee el `.env.local` de Labs** (URL y anon) y las credenciales del piloto. Entra por `/auth/v1/token` y hace GET a `intentos`. Solo lee. Tras el cambio leería datos viejos: retirarlo o pasarlo a D1 |
| `scratch\Proyecto LABS\cen-deploy\.env.local` y `.dev.vars` | Es el worktree de despliegue. Se bloquea en 10e.20 |
| `scratch\Proyecto LABS\temp_labs_full\`, `_respaldo-pre-cierre-100-2026-05-11-2136\` y `Depuracion de Plataforma\temp_dashboard\` | Copias viejas con el id (y la anon escrita en el archivo, en temp_dashboard). Inertes mientras nadie las ejecute. Apartar sus llaves en la misma ventana |
| `ALTAS-ESCUELAS\herramientas\` | **Labs no está registrado** en `plataformas.mjs`, que solo tiene financiera, nem, bachiller, tecnologia y robotica. Ninguna herramienta lee su `.env.local`. Hoy las altas de Labs se hacen desde el panel de admin de la app o con `crear-cuentas-demo.mjs`. **Propuesta:** crear `d1-labs.mjs`, hermano de `d1-nem.mjs`, y registrar Labs con `d1.base` |
| `CEN-LABS-ENTREGA-UAEMEX-20260513-175444` | Solo trae un `.env.example` de muestra. No toca la base |
| `.github\workflows\ci.yml` | Usa los secretos URL y ANON de GitHub solo para compilar. Tras el cambio sobran |

### 3.3 Tareas programadas y lo que corre solo

- **«CEN Respaldos D1»** (diaria, 3:30): respalda solo `nem-produccion` y `financiera-produccion`. **Hay que agregar la base de Labs** (criterio 13).
- **«NEM Centinela»** (cada hora): descubre todas las bases y workers de la cuenta y ya vigila `cen-dashboard`.
- Ninguna tarea toca Supabase. Las 21 `Nem*`/`Robotica*`/`Tecnia*` y «Numi noche voz labs» están deshabilitadas.
- Dentro de Supabase, visto desde el código: sin Edge Functions, cron, `pg_net`, webhooks ni realtime. El único trigger documentado es **`handle_new_user`** (`docs/manifiesto/MANIFIESTO-ARQUITECTURAL.md`), creado a mano en el panel. Llena `profiles` (y el grupo) con los `user_metadata` del alta. Lo que haya en el panel queda **[no verificado]** hasta la exportación por Postgres.
- Ningún otro worker ni proyecto usa la base. No hay variables SUPABASE_* en Windows ni token del CLI de Supabase.

---

## 4. El puente de los labs al panel y el service worker **[medido en código]**

**El puente** es `public/labs/_puente.js` (220 líneas), cargado por 261 archivos de `public/labs`.
- Cada segundo lee `window.__labDebug` y el DOM.
- Manda `window.parent.postMessage({fuente:'cen-lab', v:1, tipo:'listo'|'avance'|'cierre', slug, cobertura, segundos, modo, modos, resuelto, quiz}, location.origin)`, con un latido cada 15 s y un `cierre` en `pagehide`.
- **No usa la red.** Si el lab no está dentro de un iframe, no hace nada.

**Lo recibe** `src/app/alumno/simulador/[id]/MecanicaShellClient.tsx`:
- valida el origen con `src/lib/puente.ts`;
- **escribe directo desde el navegador en `intentos`**, con upsert `in_progress` al montar y `completed` con score y tiempo, cada vez que cambia la nota (tras ≥ 20 s).
- **Para D1:** el puente y los 261 HTML **no cambian**. Solo cambia el receptor, que escribirá por una acción de servidor con el score validado.

**Los labs de ciencias** (React, `SimuladorClient.tsx`) también hacen upsert directo, y `SyncManager.tsx` autoguarda cada 3 s por la acción `syncIntentoServer`.

**El service worker** es `public/sw.js`, versión `cen-labs-v3`:
- semilla: `/`, el manifest, los íconos y los 5 hubs;
- navegación: red primero, con la caché de respaldo;
- `/labs/` y `/labs-data/`: red primero;
- `/assets/`, `/images/` y `/_next/static/`: caché primero.

Solo guarda GET del mismo origen, así que **no guarda nada de Supabase** y la migración no le afecta. Cuando cambie la sesión conviene subirlo a `cen-labs-v4`. Así se tiran las páginas privadas guardadas con la sesión vieja, porque hoy guarda el HTML de `/` y `/alumno/inicio`.

**Lo que los labs abren por su cuenta:** importan three.js desde `cdn.jsdelivr.net` (está en la CSP) y la voz desde `/assets/voz`. La comparación de pantallas abre labs con 3D y voz (punto 6 del encargo).

---

## 5. Pantallas del navegador que pasan al servidor **[medido en código]**

**Son 21 archivos.** Cómo se reconcilian las cifras que circulaban:
- **16** tienen `.from('tabla')` directo;
- **20** importan `supabase-browser`, porque suman las 4 de solo auth: `/`, `/login`, `/forgot-password` y `/reset-password`;
- **21** cuentan además `SyncManager`, que escribe por acción de servidor;
- **22** cuentan además `supabase-helpers.ts`, que corre en el navegador pero no es pantalla.

| Grupo | Archivos | Qué hacen | Escriben |
|---|---|---|---|
| Panel del docente (`/`) | MetricCards, WelcomeBanner, LabProgressRings, GroupRadarChart, LatestDeliveries, PerformanceChart, TopAlumnos | Conteos y gráficas de `intentos` × `profiles` × `grupos` × `alumnos_grupos`, filtrados por grupo | — |
| `/alumnos`, `/auditoria`, `/laboratorios` | AlumnosContent, AuditoriaContent, LaboratoriosContent | Listas con relaciones anidadas (`profiles(full_name)`, `alumnos_grupos→grupos`) | **AlumnosContent**: upsert en `alumnos_grupos` (asignar alumno a grupo, por correo y nombre de grupo) |
| `/planeamiento` | CalendarPanel | Intentos completados y asignaciones | **Insert en `asignaciones`** |
| Menú | Sidebar | `grupos.select('nombre')` y `signOut` | — |
| Alumno | `alumno/inicio`, SimuladorClient, MecanicaShellClient, SyncManager | Su avance; guardar intentos | **Upsert en `intentos`** (3 caminos) |
| Admin | `admin/usuarios` | Lista de grupos; altas por lote | Alta, por acción |
| Auth | `/`, `/login`, `/forgot-password`, `/reset-password` | Sesión y reparto por rol | — |

**Tablas que se escriben:** `intentos` (upsert sobre la llave única `id_alumno, sim_id, status`), `alumnos_grupos`, `asignaciones` y `profiles`. **No hay** `.rpc`, `.storage` ni `.channel` (realtime). Esto es más simple que Financiera, que tenía 2 RPC.

**Cómo se hará:** con el patrón de Financiera (`src/lib/d1/navegador.ts` + `POST /api/datos`). El navegador solo puede pedir las formas que la app usa de verdad, y cada una pasa por las políticas traducidas. Lo demás responde 42501. Las escrituras de `intentos` pasan a una acción de servidor que calcula o valida la nota.

**Ciclos (10c.10):** se revisaron las 51 apariciones de `?? []`, `?? {}`, `|| []` y `|| {}`. **Ninguna entra como objeto nuevo en las dependencias de un efecto que guarde estado.** Lo más cercano:
- `PilotoBalanceoEcuaciones.tsx:46` rompe un `useMemo`, sin bucle;
- `alumno/inicio/page.tsx:253` relanza su efecto **una** vez y repite la consulta de intentos.

Aun así, **7 de 8 docentes no tienen grupos** (§2.3). Las peticiones por pantalla se cuentan con un docente sin grupos antes de cualquier otra cosa.

---

## 6. Login, registro y recuperación **[medido en código]**

- **Login:** `login/page.tsx` en el navegador, con `signInWithPassword` → `getCurrentProfile`. Si falta el perfil, `ensureProfileServer`. Reparte por rol:
  - admin → `/admin/usuarios`;
  - profesor → `/`;
  - alumno → `/alumno/inicio`.

  Pasa a una acción de servidor con la sesión HMAC de NEM y Financiera: cookie HttpOnly, bcrypt, pausas en la base. **Hay que exportar los hashes de `auth.users`**, como en Financiera, para que nadie cambie de clave.
- **Registro:** la app **no tiene registro público** (no hay `signUp`). Las altas son del admin, con `onboardInstitutionalUsers` → `auth.admin.createUser` (lote con una clave común y correo generado del nombre) + el trigger `handle_new_user`. En D1, la acción hace las dos cosas en una transacción. Pero **el registro público de Supabase está encendido**: cualquiera con la anon key (que va en el navegador) puede crear cuentas en `auth.users` sin pasar por la app. Ver §10, H1.
- **Recuperación por correo:** **se quita** (decisión del usuario).
  - Se borran `/forgot-password` y `/reset-password`.
  - El login dice «Avísale a tu maestro».
  - CEN usa `cambiar-clave.mjs` con `BASE_D1`.

  Dato: el flujo actual quizá ni funcione. `@supabase/ssr` usa PKCE (`?code=`), la página espera el evento `PASSWORD_RECOVERY` y no existe ruta de callback **[no verificado]**.
- **Cerrar sesión:** hoy es `signOut()` desde el navegador, en 4 lugares. Pasa a `POST /auth/signout`, que mata la sesión en la base.
- **`middleware.ts`:**
  - protege `/`, `/alumno`, `/admin`, `/laboratorios`, `/planeamiento`, `/auditoria` y `/alumnos`, **sin revisar el rol**;
  - **llama a `supabase.auth.getUser()` (un viaje de red a Supabase) en cada petición que llega a Next.** Su exclusión `public/` no coincide con ninguna URL real, pero en Cloudflare los estáticos (`/labs/*`, `/assets/*`…) los sirve el binding de assets **antes** del worker. Así que en producción, probablemente, solo las páginas pagan ese viaje **[no verificado]**. Corrección del 2026-11-03: una versión anterior de este perfil decía «60 viajes por lab», y eso no estaba medido.
  - En D1 se reemplaza por la verificación local de la firma HMAC, sin red, con un matcher que deja fuera los estáticos también en `next dev`.

---

## 7. El despliegue de hoy y sus trampas **[medido]**

### 7.1 La llave de Supabase viaja dentro del paquete de producción

`cen-deploy/.open-next/cloudflare/next-env.mjs`, del build desplegado (se leyeron solo nombres y largos):

| Bloque | Variables sensibles |
|---|---|
| `production` | `SUPABASE_SERVICE_ROLE_KEY` (41 caracteres), `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `VERCEL_OIDC_TOKEN` (JWT de 1,340 caracteres que **caducó el 2026-04-28**), más 20 variables `VERCEL_*` y `TURBO_*` |
| `development` | `SUPABASE_SERVICE_ROLE_KEY` y la anon key |

- **Una copia más:** `.env.production` va también entero en `.open-next/server-functions/default/.env.production`.
- **De dónde sale:** el procedimiento de despliegue (memoria `despliegue_produccion_cloudflare.md`) copia `.env.local`, `.env.production` y `.dev.vars` a `cen-deploy` antes del build. El `.env.production` viene de un `vercel env pull`, de cuando el sitio estaba en Vercel.
- **Qué protege hoy:** el worker tiene el secreto `SUPABASE_SERVICE_ROLE_KEY` puesto, y OpenNext solo usa lo empaquetado si falta (`??=`). Aun así, la llave de servicio va dentro del paquete. Cualquiera con acceso a la cuenta de Cloudflare, o un error que imprima el entorno, la expone.
- **El paquete desplegado no se descargó.** Lo infiero por el `BUILD_ID` idéntico.
- **Se cierra con la migración:**
  - el código nuevo no lee ninguna llave de Supabase;
  - `revisar-paquete.mjs` frena el despliegue si encuentra una;
  - las llaves pasan a `.env.supabase-archivo`.
- **Recomendación independiente de la migración:** rotar la `service_role` de Supabase después del cambio, porque estuvo empaquetada desde que Labs se publica en Cloudflare.

### 7.2 La voz y los estáticos

- **Voz:** `public/assets/voz/` está ignorada en git; son 7,556 MP3 y 341 MB según la memoria. El build de producción tiene **7,706** archivos en `.open-next/assets/assets/voz`. El piloto la necesita copiada para la comparación de labs.
- **Estáticos del build de producción:** **9,568** de los **20,000** del tope. Quedan 10,432 de margen. Cada tanda de 10 labs suma ~100–150 archivos con voz **[estimado]**.
- **Disco C: al 98–99 %** (19 GB libres al empezar). Cada build necesita ~1 GB. El piloto se clonó sin node_modules, .next ni medios.

### 7.3 El build corre fuera de soporte

- `cf:build` usa `opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion`, con OpenNext 1.20.1 sobre Next 15.5.28.
- `eslint-config-next` es 15.1.0, desfasado de Next.
- La etapa A quita la bandera (§8).

---

## 8. Next 16 (etapa A)

- **Versiones:** las mismas que NEM probó en producción: `next` y `eslint-config-next` 16.4.3, `react` y `react-dom` 19.2.7, `@opennextjs/cloudflare` 1.20.14 y `wrangler` 4.155.0.
- **`npm audit --omit=dev` de hoy, en `cen-dashboard` (Next 15.5.28):** 30 avisos (2 low, 27 moderate, **1 high** y **0 critical**). El alto es `postcss <= 8.5.22`.
- **`middleware.ts`:** Labs lo tiene, de 76 líneas. NEM lo conservó en Next 16.4.3 y funciona en OpenNext.
- **`next/image`:** Labs lo usa en 4 archivos (`alumno/inicio`, `alumno/ruta/[id]`, `AsistenteVirtual` y `BitacoraMicroscopio`). Antes de poner `images.unoptimized` (manual 3c) hay que ver de dónde vienen esas imágenes.

### 8.1 Resultado de la etapa A en el piloto (2026-11-03) **[medido]**

| Revisión | Resultado |
|---|---|
| `npm install` | Limpio, 1,293 paquetes |
| `npm audit --omit=dev` | De 1 alto y 0 críticos (Next 15.5.28) a **0 altos y 0 críticos** (28 avisos: 2 low y 26 moderate) |
| jest | **50/50 suites, 4,288 pruebas en verde** (1 omitida, como antes) |
| ESLint | **0 errores** (`npm run lint` = `eslint --quiet`), tras dos cambios de configuración (abajo) |
| `npm run cf:build` (OpenNext 1.20.14, **sin** `--dangerouslyUseUnsupportedNextVersion`) | Correcto. Dos avisos: `middleware` → `proxy` (sigue funcionando, como en NEM) y `metadataBase` (ya existía) |
| Paquete sin secretos (`revisar-paquete.mjs` de NEM) | **Sin secretos**. Solo van las 2 variables públicas `NEXT_PUBLIC_*`. La `service_role` del piloto vive en `.dev.vars`, que no se empaqueta |
| **Estáticos contra el build de producción, byte a byte** | **1,534 idénticos.** Son todo lo que no es de Next: los 262 labs, `labs-data`, imágenes, puente, vendor y sw.js. Cambian solo `BUILD_ID` y los 327 fragmentos con hash de `_next/static`, como debe ser. Con la voz, **9,568 archivos, el mismo número que producción** |

### 8.2 Lo que hubo que cambiar para Next 16 (todo en `Desktop\labs-d1`)

1. **`package.json`:**
   - `next` y `eslint-config-next` 16.4.3; `react` y `react-dom` 19.2.7; `@opennextjs/cloudflare` 1.20.14; `wrangler` 4.155.0;
   - `cf:build` sin la bandera;
   - **`build` = `next build --webpack`**. Next 16 compila con Turbopack por omisión, y `next.config.ts` personaliza webpack: aliasa `@sentry/nextjs` y `jspdf` a stubs para que no entren al worker. Con `--webpack` el paquete queda como hoy. Pasar a Turbopack es otro cambio, no se mezcla.
2. **`next.config.ts`:** `reactCompiler: false` sale de `experimental`. Sigue apagado.
3. **`eslint.config.mjs`:**
   - Sin `FlatCompat`, que con la config 16 truena con «Converting circular structure to JSON». Se importan las configuraciones planas, igual que NEM.
   - Las 7 reglas nuevas del compilador de React (`react-hooks/*`, **673 marcas**, 465 en los simuladores 3D) pasan a **aviso**. Describen supuestos de un compilador que Labs tiene **apagado**, así que no cambian cómo corre nada.
   - Se ignora `public/labs/vendor` (47 errores de three.js de terceros).
4. **Trampa nueva de Next 16:** `next build` ya **no corre ESLint**. En Labs, ESLint dentro del build fue lo que frenó el despliegue roto del 2026-10-18 (memoria `despliegue_produccion_cloudflare.md`). **`npm run lint` tiene que ir en el script de despliegue**, antes del build.

### 8.3 Comparación anónima contra producción

**[medido, cerrado el 2026-11-03]** `scripts/d1/comparar-anonimo.mjs` recorrió, sin cuentas, la build de la etapa A (`wrangler dev --local`) contra producción: 18 pantallas fijas, 12 MP3 de voz y 262 labs abiertos con su 3D.

| | Páginas | Status distinto | Destino distinto | Más errores en el piloto | Lienzo 3D distinto | Texto distinto |
|---|---|---|---|---|---|---|
| Fijas | 18 | 0 | 0 | 0 | — | 2 |
| Voz | 12 | 0 | 0 | 0 | — | 0 |
| Labs | 262 | 0 | 0 | 0 | 0 | 157 |

- **Status (292/292).** Al principio un lab salió con status distinto: fue `ERR_CONNECTION_CLOSED` del lado de **producción**. Se repitió y quedó igual, y su HTML pesa 770 bytes en los dos lados.
- **Textos de las páginas fijas.** `/api/health` cambia por la hora. `sw.js` es idéntico byte por byte (6,119 bytes), pero producción lo sirve sin `charset` y el navegador lo decodifica distinto.
- **Textos de los labs.** Se tomó una muestra de 8 de los 157 y cada uno se abrió **dos veces en producción**. En 6, producción también cambia de una carga a otra. Los otros 2 son una animación en curso (el barrido de velocidad de `motor-electrico`: 1,461 contra 1,413 rpm) y el orden barajado de un quiz (`sincronizacion-distribucion-puesta-a-punto`).
- No apareció ninguna diferencia que venga de Next 16.

### 8.4 Etapa B (D1), lo medido en local (2026-11-03) **[medido]**

Base nueva `labs-d1` (D1 `0d75ce94…`, KV `c12796fe…`), sin rutas. Nada de esto toca `cen-dashboard`.

| Prueba | Resultado |
|---|---|
| Integridad D1 remota contra la exportación (SHA-256 por fila, 6 tablas) | 6/6 idénticas |
| Lecturas por rol, D1 contra el oráculo Postgres (`equivalencia-rls.mts`) | 220/220 iguales; el control negativo (alumno vuelto profesor) da 187/220, como debe |
| Escrituras por rol: 23 escenarios × 5 actores (`equivalencia-escrituras.mts`) | **105/115 iguales, 10 diferencias deliberadas y 0 fallas**. El control negativo (al oráculo se le quita la política de INSERT de `intentos`) da 81/115 y sale con error, como debe |
| Login real, 5 cuentas sintéticas (`.invalid`), `next dev` sobre D1 local (`sonda-roles.mjs`) | 40/40 recorridos sin error de consola ni 4xx/5xx; cada rol termina donde debe |

Las 10 diferencias deliberadas:
- **8 son el trigger del arreglo del 2026-11-03.** Producción ignora en silencio el cambio de rol o de correo; D1 lo rechaza con P0001. En los dos lados la tabla queda igual.
- **2 son de `asignaciones` con un alumno.** En producción un ALUMNO también puede planear prácticas a su nombre, porque la política `ALL` solo pide `id_profesor = auth.uid()`. D1 lo cierra con un trigger que solo deja a profesor y admin.

**H4 cerrado en el piloto.** `/`, `/alumnos`, `/auditoria`, `/laboratorios` y `/planeamiento` deciden el rol en el servidor (`src/lib/guardia-docente.ts`). El alumno va a su panel, y quien no tiene sesión o no tiene rol va al acceso. Mismo destino que ya usaba la página en el navegador.

**Fallo encontrado y corregido.** El detector de bucles de `src/lib/d1/binding.ts` contaba por `ctx`, y en `next dev` ese objeto es uno solo para todas las peticiones. Al pasar de 300 consultas acumuladas cortaba las siguientes. Ninguna cuenta vio una pantalla ajena: `usuarioConRol` falla cerrado. En dev la llave ahora es la petición de React (`cache`). **Pendiente de medir en el piloto desplegado:** que en Workers el contador se reinicie en cada petición.

### 8.5 El piloto desplegado (`labs-d1.campanaeducativanacional.workers.dev`, versión `d6f9ffcd`) **[medido]**

Se desplegó con `npm run deploy:piloto`. El script revisa la configuración: nombre, que no haya rutas, y que la D1 y el KV sean los del piloto. Después corre lint y build, y revisa que el paquete no lleve secretos ni el proyecto de Supabase. `SESION_SECRETO` es una clave nueva, subida con `wrangler secret bulk` desde un archivo temporal que se borró. La siembra sintética es de 300 alumnos en 10 grupos «Piloto carga», un docente, un docente sin grupos, un admin, un alumno sin grupo y un alumno en dos grupos.

| Batería | Resultado |
|---|---|
| Sonda por rol con login real (`sonda-roles.mjs`), 6 cuentas × 8 rutas | 48/48 sin error de consola ni 4xx/5xx; cada rol termina donde debe |
| Seguridad (`probar-seguridad-labs.mjs`) | **100/100** (cookie, permisos por rol, H1–H4, inyección, CSRF, límites, fuerza bruta, enumeración, cabeceras, secretos en el JS, archivos internos) |
| Frenos: ráfaga de 150 seguidas con una sesión | corta (8 × 429) |
| Frenos: 50 conexiones durante 60 s, ~21 por segundo (`probar-frenos-labs.mjs`) | **no corta** (0 de 1,287), sin ningún 5xx. En Financiera cortó 112 de 1,288, tarde. El limitador nativo de Cloudflare es aproximado, y con 80 por 10 s no alcanzó |
| Detector de bucles de D1 en Workers | 0 «ALERTA/se corta» en `wrangler tail` durante las ráfagas y las sondas. Si el contador se compartiera entre peticiones, habría cortado como en dev |

**Escuela simulada (`carga-labs.mjs`, criterio 7, pico esperado de 100 × 2).** Todos salen por una sola IP. Los lotes se copiaron del navegador real. Cada alumno entra, abre su panel y hace 3 labs, guardando cada resultado con `syncIntentoServer`:

| Alumnos que arrancan en 30 s | Completos | 429 | 5xx | Guardados en la base | p95 login | p95 datos | p95 guardar |
|---|---|---|---|---|---|---|---|
| 100 | 100/100 | 0 | 0 | 300/300 | 2.2 s | 0.8 s | 1.0 s |
| **200** | **200/200** | 0 | 0 | **600/600** | 3.9 s | 1.5 s | 1.9 s |

Lo más lento es el login: bcrypt de los hashes migrados, igual que en Financiera.

**Peticiones por pantalla, en reposo (10c.10).** Las pantallas pesadas de cada rol se dejaron quietas 60 s. Ninguna hizo peticiones a `/api/datos` después de cargar, así que no hay bucles. Ninguno de los `?? []` / `?? {}` del código entra en un efecto que pida datos: están en simuladores y en funciones de dominio.

**Pico legítimo de peticiones que llegan al worker (10c.12)** [medido con navegación real, incluyendo un usuario con prisa que abre todas sus pantallas seguidas]:

| Rol | Al worker | Pico en 10 s |
|---|---|---|
| Alumno | 119 | **55** |
| Docente sin grupos | 123 | 46 |
| Docente | 108 | 44 |
| Admin | 52 | 31 |

El tope de 80 por 10 s queda **confirmado**: deja 1.45× sobre el alumno. Con 30, como NEM, el alumno se frenaría. Lo que el freno no para es un script con muchas conexiones en paralelo. Producción tampoco lo para. Su worker es el de OpenNext sin envoltorio, y el único limitador del código de 0b9ddf8 es el de Upstash en `/api/resultados`, una ruta que la app ya no usa y que el piloto quitó. Las lecturas y escrituras van directo a Supabase desde el navegador, sin freno propio [medido en código]. Si los límites de la API de Supabase frenan a un script así: [no verificado].

**Lo que se arregló en el piloto por estas baterías:**
- **Cabeceras duplicadas.** `X-Frame-Options: SAMEORIGIN, SAMEORIGIN` y lo mismo con `nosniff`; producción también las tiene así. El middleware ya no las repite y `X-XSS-Protection` pasó a `next.config.ts`.
- **Cierre de sesión.** La cookie vieja muere al instante en el isolate que atendió el cierre, y en los demás tarda a lo más 30 s (la sesión se guarda en memoria 30 s por isolate). Medido: a los 31 s ya no sirve en ninguno. En producción con Supabase, el token sigue valiendo hasta que caduca (hasta 1 h).

**Comparación anónima repetida contra el piloto D1** (regla 6: después de cada cambio de código). Mismas 292 páginas, producción contra `labs-d1.*.workers.dev`, en `.export/comparar-anonimo-d1/`:

| | Páginas | Status distinto | Destino distinto | Más errores en el piloto | Lienzo 3D distinto | Texto distinto |
|---|---|---|---|---|---|---|
| Fijas | 18 | 2 | 0 | 0 | — | 13 |
| Voz | 12 | 0 | 0 | 0 | — | 0 |
| Labs | 262 | 0 | 0 | 0 | 1 | 146 |

Todas las diferencias están explicadas:
- **Status 404 en `/forgot-password` y `/reset-password`.** Es deliberado: el usuario decidió quitar la recuperación por correo.
- **Texto de las 10 pantallas que mandan al login, y del propio `/login`.** El único renglón distinto es «REINICIAR», que pasó a «¿LA OLVIDASTE? AVÍSALE A TU MAESTRO» (medido renglón por renglón).
- **`/api/health`.** Cambia la hora.
- **Lienzo de `divisor-tension-corriente`.** En esa corrida producción no llegó a pintarlo. Se repitió dos veces en cada lado: hay lienzo en los dos y el HTML es el mismo (83,818 bytes).
- **Texto de los labs.** Animaciones y quizzes barajados, como en la etapa A.

### 8.6 Ensayo de la ventana en `labs-d1-ensayo` (2026-11-03) **[medido]**

Recursos nuevos del ensayo: D1 `labs-d1-ensayo` (`f7d74fd0…`, WNAM), KV `ea0beee8…` y frenos 93011–93013, en `wrangler.ensayo.jsonc`.

| Paso | Resultado |
|---|---|
| `pasar-datos.mjs` contra la base vacía del ensayo: exportación **fresca** de solo lectura, generar, ¿esquema igual al probado?, importar, integridad | **24 s en total.** Esquema y reglas idénticos a los probados; 6/6 tablas idénticas fila por fila (43 usuarios, 42 perfiles, 304 intentos, 22 inscripciones, 4 grupos, 0 asignaciones) |
| Código al ensayo, con su propio `SESION_SECRETO` nuevo | ✓ |
| Sonda por rol con login real (cuentas sintéticas) | 48/48 limpias |
| `desplegar-produccion.mjs --ensayo` (el camino de la ventana) | **1 sola versión** con el secreto adentro (`c73d9e59`); humo ✓ |
| **Regreso:** `wrangler rollback` a la versión anterior | 6 s; humo ✓ (login, panel, getUser, lab) |
| **Ida otra vez** a la versión nueva | 5 s; humo ✓ |
| Regreso a una versión desplegada **antes** de subir el secreto aparte | **el sitio se queda sin login** (humo ✗) |

**Lección del ensayo:** subir el secreto aparte crea una versión intermedia sin él, y un regreso a esa versión deja a todos fuera. Por eso `desplegar-produccion.mjs` sube el secreto **en el mismo despliegue** (`--secrets-file`), como Financiera.

**Scripts de la ventana** (probados en seco con la configuración FINAL):

| Script | Qué hace | Probado | Se retira solo |
|---|---|---|---|
| `pasar-datos.mjs` | Supabase → `labs-produccion`, con las 6 compuertas de arriba | en el ensayo, de verdad | sí: `.pasar-datos-retirado` (repetido pisaría los datos nuevos de D1) |
| `desplegar-produccion.mjs` | Revisa la config (nombre `cen-dashboard`, las 2 rutas, KV de siempre, frenos 93021–3, ningún recurso del piloto), que la base no esté vacía, que el build tenga menos de 3 h y no lleve secretos, y que la versión activa siga siendo la del regreso; después despliega con el secreto nuevo adentro | `--ensayo` de verdad; `--seco` contra producción: solo falla el id `PENDIENTE` de `labs-produccion`, como se espera, y confirma que la activa sigue siendo `8028185d` | sí: `.desplegar-produccion-retirado` |
| `cambiar-carpeta.mjs` | `labs-d1` pasa a ser la carpeta de producción. `cen-dashboard` y `cen-deploy` quedan bloqueadas por los 5 lados del 10e.20 y se respalda cada archivo antes | `--aplicar` sobre **copias** (con `.env` falsos): todo en su lugar, y la segunda corrida se niega | sí: `.cambiar-carpeta-retirado` |

`wrangler.produccion.jsonc` ya tiene el nombre, el dominio, la fecha de compatibilidad y el KV del `cen-dashboard` de hoy. El id de `labs-produccion` queda `PENDIENTE`: la base se crea en la ventana.

### 8.7 La ventana: Labs ya corre sobre D1 (2026-11-03, hora de México; 2026-11-04 05:2x UTC) **[medido]**

El usuario aprobó la ventana («Adelante hazlo»). Producción es ahora la versión **`a0f08c72-3d4d-4a0d-8502-958e45c65df7`** de `cen-dashboard`, sobre la base **`labs-produccion`** (`45ee2bad-698a-47b0-bbe4-c6eaa3750463`, WNAM).

| Paso | Resultado |
|---|---|
| Antes de empezar | La activa seguía siendo `8028185d`; nadie había desplegado desde el 1-nov. tsc ✓, lint 0, jest 49/49 suites (4,273 pruebas), build ✓ y `revisar-paquete` ✓ |
| `pasar-datos` → `labs-produccion` | **10 s**; 6/6 tablas idénticas fila por fila. Se retiró solo |
| `desplegar-produccion --ventana` | Pasó todas las revisiones; `a0f08c72` quedó en `cenlaboratorios.com.mx` y `www` con el secreto nuevo adentro. Se retiró solo |
| Primer humo con login | **Falló**: después de entrar regresaba a `/login`. **Se regresó a Supabase en 4 s** (`rollback 8028185d`) |
| Causa | **Era la cuenta de humo, no la versión.** Le inventé un id que no era UUID («0e0e0e0e-humo-…»), y `consulta.ts` solo mete en las reglas de acceso un `uid` con forma de UUID, así que el perfil no se veía y el rol salía vacío. Se reprodujo igual en el ensayo; con un id válido entra (200). Las cuentas reales tienen UUID |
| Antes de volver a D1 | Exportación nueva de Supabase (solo lectura) contra `labs-produccion`: 6/6 idénticas. Nadie escribió en Supabase en esos minutos |
| `rollback a0f08c72` (de vuelta a D1) y humo con cuenta válida | ✓: login → `/alumno/inicio`, getUser correcto; el alumno en `/` y en `/admin/usuarios` sale de ahí; el lab abre; 0 errores de JS y 0 4xx/5xx; el intento se guardó en D1 |
| Tiempos en caliente | login **0.6 s**, panel del alumno 0.3 s; la primera vuelta en frío, 1.8 s y 1 s |
| Limpieza | Se borraron la cuenta de humo y su intento. La base quedó en 43 usuarios, 42 perfiles y 304 intentos, igual que la exportación. La fila que queda en `auth_fallos` es el contador global de logins por minuto (`__todos__`), no una persona |
| `cambiar-carpeta --aplicar --parcial` | `labs-d1` es la carpeta de producción (`wrangler.jsonc` = producción, el del piloto en `wrangler.piloto.jsonc`, «npm run deploy» con compuertas). En `cen-dashboard` y `cen-deploy`: `deploy:cf` se niega con un mensaje, `wrangler.jsonc` quedó sin nombre ni rutas, y hay aviso en CLAUDE/AGENTS/README. **Parcial, por decisión del usuario:** Codex conserva sus llaves locales, su servidor del 3011 y el push hasta terminar los labs. La corrida completa (`--aplicar` sin `--parcial`) aparta las llaves y anula el push |
| Respaldo nocturno | `labs-produccion` agregada a la tarea «CEN Respaldos D1» (`financiera-d1/scripts/d1/respaldo-nocturno.mjs`). Primer respaldo verificado: 7 tablas, 416 filas, idénticas |
| Centinela | Lista todas las bases y workers: ya ve `labs-produccion` y `cen-dashboard` |

**Lección de la ventana:** una cuenta de prueba tiene que tener la misma forma que las reales, con un UUID de verdad (`crypto.randomUUID()`). Si no, la prueba falla por la cuenta y parece que falló la versión.

**El regreso, a partir de ahora:**
- `npx wrangler rollback 8028185d-32c1-494e-aad7-d5446876346a --name cen-dashboard` es limpio **solo mientras nadie guarde nada en D1**.
- Después, el regreso es a una versión D1 anterior, más `d1 time-travel restore labs-produccion`.

**Quedó pendiente:**
- **Quitar el secreto `SUPABASE_SERVICE_ROLE_KEY` del worker `cen-dashboard`.** La versión nueva lo hereda aunque el código D1 no lo usa. El permiso automático no me dejó borrarlo (`wrangler secret delete`): lo decide el usuario.
- El recorrido con cuentas reales de cada rol, que necesita las claves.
- Apagar el registro de Supabase, rotar sus llaves y cambiar la contraseña de la base.
- La corrida completa de `cambiar-carpeta` cuando Codex termine.

**Hueco que la migración conserva a propósito (decisión del usuario).** `alumnos_grupos` no tiene política de INSERT. Por eso «asignar alumno a grupo» (AlumnosContent) falla en producción para todos, y en D1 falla igual. Arreglarlo es un cambio de comportamiento: no se hace sin su OK.

---

## 9. Costo **[medido + estimado]**

**Uso real de `cen-dashboard`, del 4-oct al 3-nov** (analítica GraphQL):
- 42,510 peticiones, **0 errores**, 1,294 s de CPU;
- pico diario: 3,100 (27-oct);
- media: ~1,400 por día.

**Supuesto de concurrencia:**
- hoy, a lo más 1 o 2 personas a la vez (2 cuentas activas en 30 días);
- para dimensionar, una escuela piloto de **300 alumnos con 100 activos a la vez en hora pico**;
- las pruebas de carga se hacen con el doble: **200 simultáneos** (criterio 7).

**Costo:**
- Con el uso de hoy: **$0 adicional**. Cabe dentro de los $5 que la cuenta ya paga. Toda la cuenta usa ~0.7 M de 10 M peticiones y ~19 M de 30 M ms de CPU (reporte del piloto NEM).
- Con 300 alumnos × 2 h/mes, a ≈ 10 s de CPU y 273 peticiones por alumno-hora (la cifra de NEM, que habrá que medir con Labs): ≈ 6,000 s de CPU y 164 mil peticiones al mes. **≈ $0 adicional** **[estimado]**.
- D1: 372 filas. El almacenamiento no se nota.
- **Lo que no se mide en NEM y aquí sí pesa:** abrir un laboratorio es casi todo estático (HTML, JS, voz). Los estáticos de Workers no se cobran por petición. Lo confirmo con la sonda de CPU por pantalla en el piloto.

---

## 10. Riesgos

### 10.1 Huecos que producción YA tiene (no los trae la migración; no se tocaron)

Salen de leer el código. **No se explotaron para comprobarlos:** eso sería escribir en producción. Las RLS reales quedan **[no verificadas]** hasta la exportación por Postgres. El encargo pide reportarlos aparte y no arreglarlos sin preguntar.

| # | Hueco | Qué permite | Gravedad |
|---|---|---|---|
| **H1** | `ensureProfileServer` (`src/app/actions/auth.ts`) es una acción de servidor exportada **sin comprobar la sesión**. Recibe `userId` y `metadata.role` del navegador y hace upsert en `profiles` con la llave de servicio, que se salta RLS. Su id de acción viaja en el código de `/login` | Cambiar el rol de cualquier perfil, **incluso a `admin`**, sabiendo su uuid, o crear perfiles basura. Con el **registro público de Supabase encendido**, alguien sin cuenta puede crearse una con la anon key y hacerse admin | **Alta** |
| H2 | `syncIntentoServer` fuerza `id_alumno` = la sesión, pero copia del navegador `score` y `status` | Un alumno se pone la nota que quiera | Media |
| H3 | Los upserts de `intentos`, `alumnos_grupos` y el insert de `asignaciones` salen directo del navegador con la anon key. Solo los frena RLS | Depende de las políticas **[no verificado]** | Por medir con el oráculo |
| H4 | `/alumnos`, `/auditoria`, `/laboratorios` y `/planeamiento` no revisan el rol en el servidor. Solo `/` redirige, y desde el navegador | Un alumno abre pantallas de docente. Lo que vea depende de RLS **[no verificado]** | Por medir |
| H5 | La llave `service_role` vigente va **dentro del paquete del worker** (§7.1) **y escrita en `scratch\Proyecto LABS\list_users.ts`** | Quien lea cualquiera de los dos tiene la base entera | Alta |
| H6 | `/api/resultados` usa el cliente del navegador dentro del servidor, ignora el error y responde 200. Nadie la llama | Código muerto que dice «guardado» sin guardar | Baja; se borra en la migración |

**La base real lo empeoraba** (§2.2):
- la política «Usuario puede actualizar su propio perfil» no limita columnas, así que **cualquier alumno con sesión se ponía `role='admin'`** desde la consola del navegador;
- `handle_new_user` copiaba el rol de los metadatos del alta, así que con el registro público encendido **cualquiera se registraba como admin**;
- cualquier usuario con sesión leía nombre y correo de los 42 perfiles.

### 10.1b Arreglo aplicado en producción (2026-11-03, aprobado por el usuario) **[medido]**

- **Qué se cambió:** en Supabase de Labs, solo SQL, sin desplegar código:
  - **Trigger `cen_proteger_perfil`:** por la API (PostgREST, con `authenticated` y también con `service_role`), el rol, el id y el correo de un perfil no cambian, y un perfil nuevo toma el rol de su alta. Con eso H1 queda sin efecto aunque `ensureProfileServer` siga igual.
  - **`handle_new_user`** solo da `alumno` o `profesor`.
  - **Nueva política de lectura de `profiles`:** el propio perfil, o todos si eres docente o admin (función `cen_es_docente`, `SECURITY DEFINER`, para no caer en recursión).
  - El SQL directo (panel de Supabase) sigue pudiendo nombrar admins.
- **Archivos:** `scripts/d1/hotfix-perfiles-2026-11-03.sql`, su `.reversa.sql` (deshace exactamente lo de arriba) y `scripts/d1/aplicar-hotfix.mjs` (`--seco`, `--aplicar` y `--reversa`).
- **Cómo se probó:**
  1. **Oráculo local** (`probar-hotfix.mts`, PGlite con las políticas de producción tal cual).
     - **Control, sin el arreglo:** los 6 ataques **funcionan** (A1 el alumno se pone admin, A2 `ensureProfileServer` da admin a otro, A2b le cambia el correo, A3 crea un perfil admin, A4 se registra como admin y A5 el alumno lee los 42 perfiles).
     - **Con el arreglo:** los 6 se rechazan y los **10 usos normales siguen iguales**: alumno edita su nombre y lee su perfil, profesor y admin leen todo, el anónimo no lee nada, altas del admin como profesor y como alumno con grupo, SQL directo, crear un perfil faltante e intentos iguales (alumno 24, profesor 249).
  2. **Producción, en una sola transacción:**
     - comprobó que las 12 políticas y `handle_new_user` seguían idénticas a la exportación;
     - aplicó el arreglo;
     - simuló A1, A2, A5 y tres usos normales con usuarios reales;
     - el **ensayo en seco** terminó en ROLLBACK, 9/9;
     - la **aplicación**: 9/9 y **COMMIT**.
  3. **Lectura aparte, después:** la política y el trigger están puestos; los roles siguen igual (1 admin, 33 alumnos, 8 profesores); `/login` y `/api/health` responden 200.

| # | Estado al 2026-11-03 |
|---|---|
| H1 escalada a admin | **Cerrado en la base.** El código de `ensureProfileServer` se borra en la migración |
| H2 el alumno se pone nota | Abierto. Se cierra en la migración: la nota la valida el servidor |
| H3 escrituras directas del navegador | Abierto. Se cierra en la migración: el navegador ya no habla con la base |
| H4 pantallas de docente sin guardia de rol | Abierto. Se cierra en la migración: guardia en servidor. Los datos ya los filtra RLS |
| H5 llave en el paquete y en `list_users.ts` | **Pendiente del usuario:** borrar `scratch\Proyecto LABS\list_users.ts` (el sistema no me deja borrar fuera del proyecto). El paquete se limpia en la migración. **Rotar la `service_role` después del cambio** |
| Registro público de Supabase | **Pendiente del usuario** (es un ajuste de la plataforma, no de la base; no hay token de administración en el equipo): Authentication → Sign In / Providers → apagar «Allow new users to sign up». Ya no da admin ni deja leer otros perfiles, pero todavía deja crear cuentas de alumno basura |
| Contraseña de la base | Se pegó en el chat el 2026-11-03. **Cambiarla después de la exportación final de la ventana.** No afecta a la app, que usa las llaves de la API |

### 10.2 Riesgos de la migración

| Riesgo | Mitigación |
|---|---|
| **Se pierde contenido publicado en `cen-dashboard` después de la copia** (Codex y otras sesiones publican labs) | Congelación con fecha. `copiar-a-plataforma` / `desplegar-produccion` se detienen si `cen-dashboard` cambió después de la copia. Mecánica 261–270 (163 archivos) se decide aparte (§1.3) |
| **La voz (341 MB) no está en git** | Copiar `public/assets/voz` al piloto. `desplegar-produccion` revisa que haya ≥ 7,556 MP3 antes de subir. Si no, el sitio queda mudo |
| **El tope de 20,000 estáticos** | 9,568 hoy. `desplegar-produccion` cuenta antes de subir |
| **Next 16 + D1 a la vez** | Etapas A y B, cada una con su comparación (§8) |
| **Docentes sin grupos** (7 de 8) | Primera prueba de peticiones por pantalla (10c.10) |
| **Las auditorías de publicación de Codex se rompen** | Se adaptan a D1 en la misma ventana, o se avisa a Codex. Hoy hacen GET a `/rest/v1/intentos` |
| **El cambio cierra todas las sesiones** | Aviso previo (10d.16). Hoy solo 2 cuentas entran al mes |
| **Hashes de contraseña** | Se exportan de `auth.users` (bcrypt) y la capa los verifica. Probado en NEM y Financiera |
| **Disco al 99 %** | Copias sin node_modules ni medios. Revisar `df` antes de cada build |

---

## 11. Plan de regreso (10d.17)

**Igual que Financiera: a Supabase no se regresa después de que haya datos nuevos en D1.**

| Momento | Regreso |
|---|---|
| En la ventana, antes de que nadie escriba en D1 | `npx wrangler rollback 8028185d-32c1-494e-aad7-d5446876346a --name cen-dashboard`. Es la versión de hoy sobre Supabase; se vuelve a confirmar el día de la ventana. Supabase no se toca |
| Con datos nuevos en D1 | Código: `npx wrangler rollback <versión D1 anterior> --name cen-dashboard`. Datos: `npx wrangler d1 time-travel restore labs-produccion --timestamp=<ISO>` y las copias de cada noche |
| Ensayo | Se prueba en `labs-d1-ensayo` de ida y de vuelta. En producción, justo después del cambio, de la versión D1 a la anterior y de vuelta, con humo en cada paso (como Financiera: 3 s y 4 s) |

Los dos comandos van en el encabezado del `wrangler.jsonc` de producción. Supabase se queda intacto y en solo lectura dos semanas.

**El regreso no tiene candados:** ni la versión de hoy ni la nueva usan Durable Objects, colas ni migraciones de DO **[por confirmar con el build final]**.

---

## 12. Plan de trabajo y lo pendiente del usuario

### 12.1 Orden (del encargo, adaptado a lo medido)

1. **Etapa A, Next 16 sobre Supabase,** local:
   - lint, jest y build;
   - comparación anónima de las pantallas públicas y de **todos los labs** (3D y voz) contra producción.

   No entra con cuentas, así que no escribe nada.
2. **Exportación de solo lectura** (falta la contraseña): esquema, RLS con `permissive`, `GRANT` por columna, funciones, triggers (`handle_new_user`), `auth.users` con hashes, en una transacción `READ ONLY`.
3. **Capa D1:** se copia de Financiera (`src/lib/d1/*`, `navegador.ts`, `api/datos`) y de NEM (`worker.ts` con los frenos y la sesión HMAC). Las 21 pantallas y los 3 caminos de `intentos` pasan al servidor. Se quita la recuperación por correo y `middleware.ts` deja de llamar a la red.
4. **Piloto `labs-d1`:** base, KV, importación e integridad por huella.
5. **Oráculo** (PGlite con las políticas tal cual): lecturas como cada uno de los 43 usuarios y como anónimo, escrituras con cada rol y el control negativo. Los huecos de §10.1 se miden aquí.
6. **Baterías:** seguridad, ataques web, huecos, escrituras y frenos (con el tope **medido** en la pantalla más pesada de cada rol). También peticiones por pantalla, la escuela simulada con 200 a la vez y las cuentas raras (§2.3).
7. **Comparación de pantallas** contra producción, labs incluidos, después de **cada** cambio de código.
8. **Ensayo** en `labs-d1-ensayo` con el regreso probado. Después, los scripts de la ventana, en seco y con la configuración final, que se retiran solos.
9. ✋ **Ventana.** El tráfico es mínimo a cualquier hora (§9); se elige con la analítica de esa semana.

### 12.2 Lo que necesito del usuario

| # | Qué | Para qué |
|---|---|---|
| 1 | ~~La contraseña de la base~~ | **Hecho** (2026-11-03): está en `.export/labs.env` y la exportación se completó (§2.2) |
| 2 | **Fecha de congelación** de `cen-dashboard` | Que nada publicado ahí se pierda |
| 3 | **Mecánica 261–270** (163 archivos sin commit): ¿se terminan y se hace commit antes de la congelación, o se mudan al piloto después del cambio? | Ídem |
| 4 | **Apagar el registro público de Supabase y borrar `list_users.ts`** (§10.1b). La escalada a admin ya está cerrada en la base | Cuentas basura y la llave suelta |
| 5 | **Contraseña de cada rol** para la ventana: alumno, profesor y **admin** | Criterio 13 |
