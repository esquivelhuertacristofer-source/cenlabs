# Diagnóstico de Salud Técnica — CEN Labs
**Fecha:** 2026-05-16  
**Auditor:** Diagnóstico automatizado asistido (sin modificaciones al código)  
**Rama:** main · Commit HEAD: `0c25741`  
**Carpeta productiva:** `cen-dashboard/`

---

## Resumen Ejecutivo

| Severidad | Cantidad |
|-----------|---------|
| 🔴 CRÍTICO | 5 |
| 🟠 ALTO | 8 |
| 🟡 MEDIO | 10 |
| 🔵 BAJO | 6 |
| ⚪ OBSERVACIÓN | 5 |
| **Total** | **34** |

### Top 5 problemas más serios

1. **🔴 Credenciales reales en múltiples archivos del filesystem** — `.env.local`, `ENTREGA_CREDENTIALS.md`, `MASTER_CREDENTIALS.md` (directorio padre), `docs/CREDENCIALES-PILOTO-001.md` contienen contraseñas en texto plano. El SERVICE_ROLE_KEY bypassea RLS.  
2. **🔴 Credenciales hardcodeadas en git history** — Commit `057eb45` insertó Supabase URL + ANON_KEY literalmente en `src/lib/supabase.ts`. Ese commit es inmutable y esas credenciales deben rotarse independientemente de que el archivo haya sido modificado después.  
3. **🔴 Sentry completamente no configurado** — `NEXT_PUBLIC_SENTRY_DSN` no está en `.env.local`. Los errores en producción van a ningún lado. El código de integración existe pero está silenciado.  
4. **🟠 No existen migraciones SQL** — `supabase/migrations/` no existe. El schema de la DB, las RLS policies y los triggers solo viven en el dashboard de Supabase. Si se pierde el acceso, la estructura es irrecuperable.  
5. **🟠 El health check de 40 rutas nunca corre automáticamente** — `preview-tests.yml` es solo `workflow_dispatch` (manual). No hay verificación automática post-deploy de que los 40 simuladores retornan 200.

### Nivel general de salud técnica: **5.5 / 10**

**Justificación:** La base funcional está razonablemente sólida — CI/CD existe, 262 tests pasan, la protección de rutas es correcta, Zustand + dominio están bien separados. Pero hay problemas de seguridad que en un proyecto real con usuarios reales serían bloqueantes (credenciales expuestas, Sentry apagado, historial con secrets). La deuda operacional (sin migraciones, sin monitoreo real, sin cobertura de componentes) significa que el equipo opera con baja visibilidad sobre lo que pasa en producción.

---

## Hallazgos por Categoría

### CATEGORÍA 1 — Pipeline y Deploy

**✅ Bien:**
- `ci.yml` existe y corre en push a `main` y `develop`, y en PRs a `main`
- El pipeline corre type-check → tests → build en ese orden
- Si tsc falla, el pipeline se detiene (steps son secuenciales)
- Si los tests fallan, el build no corre
- Timeout configurado en 15 minutos (evita cuelgues indefinidos)
- Vercel auto-deploy conectado al repositorio (deploy es atómico por la naturaleza de Vercel)

**❌ Mal:**
- **CI no corre ESLint** (`npm run lint` no aparece en `ci.yml`). Se puede hacer un push con 1000 warnings de lint y el pipeline pasa igual.
- **`preview-tests.yml` es manual únicamente** (`workflow_dispatch`). El workflow que verifica que los 40 simuladores responden 200 nunca se activa automáticamente post-deploy. Si un deploy rompe una ruta, nadie lo saberá hasta que un usuario lo reporte.
- **No hay healthcheck post-deploy** — ningún step en CI verifica que el deployment en Vercel fue exitoso y el sitio responde.
- **No hay rollback automático** — si Vercel deploya exitosamente pero hay un bug de runtime, no hay mecanismo automático de rollback (Vercel tiene rollback manual vía dashboard).
- **No hay environments separados** — hay un solo proyecto en Vercel. Todo push a main va directo a producción. No existe staging.
- **CI solo recibe 2 secrets** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). No recibe `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_*`, `SENTRY_*`, `IP_SALT`. El build en CI es con configuración incompleta respecto a producción.
- **No se verificó concretamente si el último commit local está en producción** — sin credenciales de Vercel en este diagnóstico, no es posible comparar git log vs URL pública.

**⚠️ Requiere decisión humana:**
- ¿Se desea environment de staging antes de que entren más usuarios?
- ¿Se activa `preview-tests.yml` en cada deploy de Vercel (requiere Vercel webhook → GitHub Actions)?

---

### CATEGORÍA 2 — Sincronización entorno local vs producción

**✅ Bien:**
- `.env.example` existe y documenta las variables
- Las URLs de Supabase están parametrizadas vía `process.env` en el código (excepto la excepción documentada abajo)
- `.env.production` fue generado por Vercel CLI y contiene solo metadata de Vercel (no credenciales reales — las Supabase keys están vacías `""`)

**❌ Mal:**
- **`.env.local` contiene credenciales reales en texto plano** — Supabase URL, ANON_KEY y SERVICE_ROLE_KEY visibles:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://wbvcclpxxwzkuddjxqig.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_WgQiB...
  SUPABASE_SERVICE_ROLE_KEY=sb_secret_esPVp...
  ```
  El `.gitignore` excluye `.env*` correctamente, pero el archivo existe en disco sin protección adicional.
- **`.env.production` tiene Supabase keys vacías** — fue generado por `vercel env pull`. Las keys reales están en el dashboard de Vercel, pero este archivo podría generar confusión. Si alguien usa este archivo creyendo que es la config de producción, el sistema no conecta a Supabase.
- **No hay `UPSTASH_REDIS_REST_URL` ni `UPSTASH_REDIS_REST_TOKEN` en `.env.local`** — el rate limiter cae en modo in-memory. En local, los límites de rate no se comparten entre instancias. No es un error, pero significa que el comportamiento de rate limiting en local no refleja producción.
- **`SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_DSN` ausentes en `.env.local`** — Sentry está completamente apagado en local y, según los hallazgos de la Cat. 11, también en producción.
- **No hay forma de saber si la DB de producción está sincronizada con local** — porque no existen migraciones (ver Cat. 5). Solo hay una DB (la de Supabase en producción) que se usa tanto para desarrollo como para pruebas.

**⚠️ Requiere decisión humana:**
- ¿Se comparte la misma DB de Supabase para desarrollo y producción? Si sí, cualquier prueba de desarrollo con datos reales contamina producción.

---

### CATEGORÍA 3 — Estado de la rama main

**✅ Bien:**
- `git status` limpio — no hay archivos modificados sin committear
- Un solo branch: `main` (sin branches de feature huérfanos)
- Solo 24 commits — historial limpio y legible
- `.gitignore` excluye correctamente: `node_modules`, `.next`, `.env*`, `coverage`, `*.tsbuildinfo`, `/output/`, `ENTREGA_CREDENTIALS.md`, `docs/CREDENCIALES-PILOTO-001.md`

**❌ Mal:**
- **Tres archivos de código muerto trackeados en git:**
  - `src/components/landing/LandingPage_old.tsx` (668 líneas)
  - `src/components/landing/LandingPage_apple.tsx` (versión alternativa de landing no usada)
  - `src/components/PilotoColisiones1D.tsx.bak`
  - `src/components/simuladores/fis05/Colisiones3DScene.tsx.bak`
- **Commit `057eb45` (2026-04-27) tiene credenciales en el historial:**
  ```
  +const supabaseUrl = 'https://wbvcclpxxwzkuddjxqig.supabase.co';
  +const supabaseAnonKey = 'sb_publishable_WgQiBEqBJiTFNfms4xzw1Q_HpvRxcYt';
  ```
  El archivo fue modificado en commits posteriores, pero la credencial PERMANECE en `git log` para siempre. El ANON_KEY en ese commit ya es público si el repo alguna vez fue público o se comparte.
- **Último commit contiene `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`** — metadato de herramienta de IA visible en el historial de un proyecto que se entrega a un cliente. Depende del contexto si esto es un problema.
- `tsconfig.tsbuildinfo` (662 KB) existe en disco pero está correctamente gitignoreado. No está trackeado. ✓
- `output/` directory existe (de scripts de piloto) y está gitignoreado. ✓

---

### CATEGORÍA 4 — Dependencias

**✅ Bien:**
- `package.json` y `package-lock.json` están sincronizados
- Dependencias críticas razonablemente actualizadas
- `strict: true` en TypeScript
- Three.js en `^0.184.0` (versión actual, no atrasada)
- React 19.2.4, Next.js 15.5.15

**❌ Mal:**
- **10 vulnerabilidades npm (2 HIGH, 4 moderate, 4 low):**
  - `HIGH`: Next.js vulnerable a cache poisoning en RSC responses (GHSA-wfc6-r584-vfw7)
  - `HIGH`: Next.js Middleware/Proxy bypass en App Router (GHSA-267c-6grr-h53f)
  - `moderate`: PostCSS XSS via `</style>` en CSS stringify (GHSA-qx2v-qp2m-jg93)
  - Las 2 HIGH son en Next.js mismo — `npm audit fix` las resuelve actualizando Next.js
- **Next.js 15.5.15 vs. 15.5.18 disponible** — el "wanted" es 15.5.18 que incluye las correcciones de las vulnerabilidades HIGH
- **`@sentry/nextjs` 9.47.1 vs. 10.53.1** — una major version atrás
- **`eslint-config-next` 15.1.0 vs `next` 15.5.15** — desincronizados (debería ser la misma versión)
- **`jspdf-autotable` en devDependencies pero usada en código de producción** — `reportUtils.ts` es código de producción que genera PDFs. `jspdf-autotable` debería estar en `dependencies`.
- **`eslint` 9.39.4 cuando la versión latest es 10.x** — no crítico pero hay major version disponible

---

### CATEGORÍA 5 — Base de datos

**✅ Bien:**
- RLS aparentemente configurada (según código y docs del proyecto)
- Service Role Key solo se usa en Server Actions (nunca expuesto al cliente)
- `supabase-admin.ts` existe y es server-only
- Las queries de Server Actions usan `getAdminClient()` (bypass intencional y justificado)

**❌ Mal:**
- **`supabase/migrations/` NO EXISTE** — el directorio `supabase/` solo contiene un `README.md` que dice que el schema vive en el dashboard. No hay archivos de migración. No hay versionado de schema. Si la cuenta de Supabase se cierra, el acceso se pierde o el proyecto se migra, toda la estructura de la base de datos (tablas, RLS, triggers, índices) es irrecuperable.
- **Sin forma de verificar qué migraciones se aplicaron** — no existe registro de cambios de schema. La única fuente de verdad es el dashboard.
- **No es posible verificar RLS sin acceso al dashboard de Supabase** — el diagnóstico no puede confirmar que TODAS las tablas tienen RLS habilitada sin ejecutar queries.
- **No es posible verificar índices, FKs, o datos huérfanos** — requiere acceso directo a la DB.

**⚠️ Requiere decisión humana:**
- ¿Se exporta el schema con Supabase CLI antes de continuar mejorando simuladores?
- Este es el hallazgo equivalente al "deploy que nunca existió" de Bachillerato: **el schema de producción nunca fue versionado. Se asumió que "está en Supabase" es suficiente.**

---

### CATEGORÍA 6 — Estructura del código

**✅ Bien:**
- `tsconfig.json` tiene `"strict": true`
- `next.config.ts` NO tiene `ignoreBuildErrors` (el build falla si hay errores de TypeScript) ✓
- Arquitectura de dominio bien separada (`src/domain/`) con lógica pura testeable
- Store de Zustand correctamente dividido en slices
- Server Actions usan admin client correctamente
- `src/lib/supabase.ts` (cliente vanilla con flow incorrecto) fue eliminado en commit HEAD ✓

**❌ Mal:**
- **`src/app/api/resultados/route.ts` tiene `createClient()` a nivel de módulo (singleton):**
  ```typescript
  const serverClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  ```
  Esto inicializa el cliente de Supabase cuando el módulo se importa (en build time o cold start). Si las env vars no están disponibles en el entorno de CI, el build puede fallar. La versión del entregable UAEMEX corrigió esto con un factory function `getServerClient()`, pero esa corrección NO se aplicó al código de producción.
- **`LandingPage_old.tsx` (668 líneas) y `LandingPage_apple.tsx` trackeadas** — código muerto en producción
- **`PilotoColisiones1D.tsx` + `BitacoraColisiones1D.tsx` son simuladores huérfanos** — `fisica-5` fue reemplazado por `PilotoPrensaHidraulica` en `LabRegistry.tsx`, pero los componentes `PilotoColisiones1D`, `BitacoraColisiones1D`, `Colisiones3DScene` siguen existiendo. Además, `LaboratoriosContent.tsx` describe física como "colisiones y circuitos" (incorrecto).
- **11 ocurrencias de `eslint-disable` en código de producción** — la mayoría justificadas por Three.js/R3F pero sin documentar el motivo específico en cada una
- **Console.log activos en SimuladorClient.tsx (prod):**
  ```typescript
  console.log('[onComplete] Iniciando guardado del intento', ...)
  console.log('[onComplete] ✅ Intento guardado exitosamente:', data)
  ```
  Esto expone datos de la sesión del alumno (sim_id, timing, score) a la consola del browser.
- **Archivos enormes que son razonables pero monitoreables:**
  - `quizQuestions.ts`: 3502 líneas (solo data, ok)
  - `SimuladorClient.tsx`: 817 líneas (lógica compleja, en el límite)
  - `quimicaSlice.ts`: 773 líneas (lógica de 10 simuladores, justificado)
- **Queries a Supabase dispersas y centralizadas** — hay una mezcla: `supabase-helpers.ts` centraliza algunos helpers, pero los componentes de admin y Server Actions importan `getAdminClient()` directamente. No es un problema crítico dado el tamaño del proyecto.

---

### CATEGORÍA 7 — Tests

**✅ Bien:**
- 262 tests pasan, 0 fallan
- 9 suites completas
- No hay tests con `xit`, `xdescribe`, `it.skip`, `describe.skip`
- El test de integración `simuladores-routing.test.ts` previene la recurrencia del incidente de 30 simuladores caídos
- El test `resultados.test.ts` cubre auth, rate limiting y validaciones del API

**❌ Mal:**
- **Cobertura real: 17.57% statements / 10.64% functions** — es una cobertura muy baja. La gran mayoría de los 40 simuladores (componentes Piloto), páginas de navegación, store y componentes UI no tienen tests.
- **CI corre sin `--coverage`** — el pipeline no evalúa cobertura. Si la cobertura baja a 0%, el CI sigue verde.
- **No hay coverage thresholds en `jest.config.js`** — sin límites definidos, no hay alerta automática si la cobertura degrada.
- **`__tests__` excluido de `tsconfig.json`** — errores de TypeScript en los tests no se detectan con `tsc --noEmit`.
- **`--forceExit` en CI** — el pipeline usa `--forceExit` porque hay handles async que no cierran limpiamente. Esto es un síntoma de que algún test o setup tiene recursos que no se limpian correctamente.
- **Las funciones de dominio tienen buena cobertura (~70-80%) pero los componentes y páginas tienen ~0%** — si un simulador tiene un bug en su JSX o en su integración con el store, ningún test lo captura.

---

### CATEGORÍA 8 — Seguridad

**✅ Bien:**
- Middleware protege rutas `/alumno`, `/admin`, `/laboratorios`, `/planeamiento`, `/auditoria`, `/alumnos` con `getUser()` (no `getSession()`) ✓
- RLS implementada (según código — no verificable sin acceso a DB)
- Service Role Key solo en Server Actions (server-side only)
- `user_id` en la API siempre del token JWT, nunca del body
- Rate limiting dual (IP + user) en el endpoint de escritura
- Headers de seguridad en `next.config.ts` y middleware
- `.env.local` está en `.gitignore` ✓

**❌ Mal:**
- **🔴 CRÍTICO: 4 archivos con credenciales reales en texto plano en el sistema de archivos:**
  1. `.env.local` — Supabase URL + ANON_KEY + SERVICE_ROLE_KEY
  2. `ENTREGA_CREDENTIALS.md` (raíz del proyecto, gitignoreado) — Supabase email/password del dashboard + Cloudflare email/password
  3. `MASTER_CREDENTIALS.md` (directorio padre, fuera del repo) — contraseñas de cuentas de plataforma
  4. `docs/CREDENCIALES-PILOTO-001.md` (gitignoreado) — cuentas de usuarios piloto
- **🔴 CRÍTICO: Credenciales en git history** — commit `057eb45` contiene Supabase URL + ANON_KEY en texto plano. Esas credenciales deben rotarse (revocar y generar nuevas).
- **CSP tiene `unsafe-inline` y `unsafe-eval`** — reduce drásticamente la protección contra XSS:
  ```
  script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: ...
  style-src 'self' 'unsafe-inline' ...
  ```
  Justificado por Three.js + R3F que requieren eval/inline, pero es deuda de seguridad conocida.
- **HSTS (`Strict-Transport-Security`) no está en `next.config.ts` ni en middleware** — Vercel lo puede agregar a nivel plataforma, pero no está documentado ni verificable desde el código.
- **Commit `057eb45` descriptor dice "hardcode correct supabase credentials to bypass incorrect environment variables"** — indica que hubo un problema de configuración de env vars en producción que se resolvió hardcodeando credentials. Esto es una red flag operacional.
- **Sin rotación de tokens documentada** — no hay política de cuándo o cómo rotar las API keys.
- **`route.ts` usa ANON_KEY para validar tokens de usuarios** — técnicamente correcto (la validación de JWT usa la clave pública, no la ANON_KEY como secreto), pero el cliente se crea como singleton a nivel módulo, lo cual tiene implicaciones en edge runtimes.

---

### CATEGORÍA 9 — Específico de Labs: Simuladores

**Inventario completo:**

| ID | Nombre | Componente Piloto | Tipo | Estado |
|----|--------|-------------------|------|--------|
| quimica-1 | Construcción Atómica | PilotoConstruccionAtomica | Química | Funcional |
| quimica-2 | Leyes de los Gases | PilotoLeyesGases | Química | Funcional |
| quimica-3 | Balanceo de Ecuaciones | PilotoBalanceoEcuaciones | Química | Funcional |
| quimica-4 | Reactivo Limitante | PilotoReactivoLimitante | Química | Funcional |
| quimica-5 | Preparación de Soluciones | PilotoPreparacionSoluciones | Química | Funcional |
| quimica-6 | Solubilidad y Cristalización | PilotoSolubilidadCristalizacion | Química | Funcional (listener sin cleanup) |
| quimica-7 | Titulación Ácido-Base | PilotoTitulacionAcidoBase | Química | Funcional (listener sin cleanup) |
| quimica-8 | Equilibrio Químico | PilotoEquilibrioQuimico | Química | Funcional (listener sin cleanup) |
| quimica-9 | Celdas Galvánicas | PilotoCeldasGalvanicas | Química | Funcional |
| quimica-10 | Destilación Fraccionada | PilotoDestilacionFraccionada | Química | Funcional |
| fisica-1 | Tiro Parabólico | PilotoTiroParabolico | Física | Funcional |
| fisica-2 | Plano Inclinado (Newton) | PilotoPlanoInclinado | Física | Funcional |
| fisica-3 | Péndulo Simple | PilotoPenduloSimple | Física | Funcional |
| fisica-4 | Ley de Hooke | PilotoLeyHooke | Física | Funcional |
| fisica-5 | Prensa Hidráulica (Pascal) | PilotoPrensaHidraulica | Física | Funcional |
| fisica-6 | Empuje Estático (Arquímedes) | PilotoArquimedes | Física | Funcional |
| fisica-7 | Dilatación Térmica | PilotoDilatacionTermica | Física | Funcional |
| fisica-8 | Ley de Ohm | PilotoLeyOhm | Física | Funcional |
| fisica-9 | Electrostática (Coulomb) | PilotoElectrostatica | Física | Funcional |
| fisica-10 | Motor Eléctrico | PilotoMotorElectrico | Física | Funcional |
| biologia-1 | Microscopio Virtual | PilotoMicroscopioVirtual | Biología | Funcional |
| biologia-2 | Transporte Celular | PilotoTransporteCelular | Biología | Funcional |
| biologia-3 | Síntesis de Proteínas | PilotoSintesisProteinas | Biología | Funcional (listener sin cleanup) |
| biologia-4 | Fotosíntesis | PilotoFotosintesis | Biología | Funcional |
| biologia-5 | Leyes de Mendel | PilotoGenetica | Biología | Funcional |
| biologia-6 | Selección Natural | PilotoSeleccionNatural | Biología | Funcional |
| biologia-7 | Sistema Nervioso | PilotoSistemaNervioso | Biología | Funcional |
| biologia-8 | Electrocardiograma | PilotoElectrocardiograma | Biología | Funcional |
| biologia-9 | Sistema Digestivo | PilotoSistemaDigestivo | Biología | Funcional |
| biologia-10 | Dinámica de Poblaciones | PilotoPoblaciones | Biología | Funcional |
| matematicas-1 | Explorador de Cuadráticas | PilotoCuadraticas | Matemáticas | Funcional |
| matematicas-2 | Sistemas 2x2 | PilotoSistemas2x2 | Matemáticas | Funcional |
| matematicas-3 | Escala Richter | PilotoRichter | Matemáticas | Funcional |
| matematicas-4 | Teorema de Pitágoras | PilotoPitagoras | Matemáticas | Funcional |
| matematicas-5 | Círculo Trigonométrico | PilotoTrigonometria | Matemáticas | Funcional |
| matematicas-6 | Transformaciones Geométricas | PilotoTransformaciones | Matemáticas | Funcional |
| matematicas-7 | Ley de Snell | PilotoSnell | Matemáticas | Funcional |
| matematicas-8 | La Derivada | PilotoDerivadas | Matemáticas | Funcional |
| matematicas-9 | Sumas de Riemann | PilotoRiemann | Matemáticas | Funcional |
| matematicas-10 | Máquina de Galton | PilotoGalton | Matemáticas | Funcional |
| *HUÉRFANO* | Colisiones 1D | PilotoColisiones1D | Física (deprecated) | **Orphan — NO en catalog** |

**Notas de simuladores:**

- **Simulador huérfano:** `PilotoColisiones1D` + `BitacoraColisiones1D` + `Colisiones3DScene` existen en el codebase pero `fisica-5` apunta a `PilotoPrensaHidraulica` en `LabRegistry.tsx`. El componente de colisiones es unreachable en runtime. `LaboratoriosContent.tsx` aún menciona "colisiones" en la descripción de física (incorrecto). Los archivos `.bak` de este simulador también están trackeados.
- **Patrón común:** Los 40 simuladores activos siguen el patrón `PilotoXxx.tsx` → importado dinámicamente en `LabRegistry.tsx` → renderizado por `SimuladorClient.tsx`. El patrón es consistente.
- **Limpieza de listeners:** 4 simuladores tienen `addEventListener` sin la correspondiente cleanup en `useEffect` return: `PilotoEquilibrioQuimico`, `PilotoSintesisProteinas`, `PilotoSolubilidadCristalizacion`, `PilotoTitulacionAcidoBase`. Potencial memory leak al navegar entre simuladores repetidamente.
- **Assets 3D:** Modelos y texturas se cargan desde CDN (`raw.githack.com`, `cdn.jsdelivr.net`) con fallback. Los 29 subdirectorios en `simuladores/` contienen las escenas Three.js de simuladores que las necesitan.
- **Performance mobile:** No se evaluó en este diagnóstico. Three.js en mobile es típicamente pesado y no hay evidencia de detección de capabilities o fallbacks para dispositivos de bajo rendimiento.
- **Persistencia de progreso:** El store de Zustand usa `persist` middleware con key `cen-sim-v10` en localStorage. El progreso se pierde si el usuario limpia localStorage o cambia de dispositivo/browser.

---

### CATEGORÍA 10 — Documentación

**✅ Bien:**
- `README.md` actualizado con stack, estructura y comandos
- `docs/` contiene arquitectura (`ARQUITECTURA.md`), modelo de datos (`MODELO-DATOS.md`), POSTMORTEM del incidente de 30 simuladores, estado final v1, setup de Sentry
- GDDs (Game Design Documents) por disciplina (`GDD_BIOLOGIA.md`, `GDD_FISICA.md`, etc.)
- `docs/manifiesto/MANIFIESTO-ARQUITECTURAL.md` documenta decisiones clave
- Backlog documentado en memoria del proyecto

**❌ Mal:**
- **No hay documentación de cómo agregar o modificar un simulador** — no existe un `COMO-AGREGAR-SIMULADOR.md`. Para un equipo nuevo (o el propio dev 6 meses después), el proceso de agregar un nuevo simulador no está documentado.
- **`PROYECTO_LABS_REPORTE_TECNICO.md` está vacío** (0 bytes)
- **`docs/AVISO-PRIVACIDAD-BORRADOR.md` existe** — indica que el aviso de privacidad es un borrador, no un documento finalizado
- **`video_production_registry.md` y `notebooklm_prompts.md` en raíz** — archivos de proceso interno visibles en el root del proyecto
- **`AUDIT_REPORT.md` en raíz** — documento de auditoría anterior no archivado

---

### CATEGORÍA 11 — Operación

**✅ Bien:**
- Sentry está integrado en el código (`withSentryConfig`, `sentry.client.config.ts`)
- Vercel proporciona logs básicos de deploy y runtime
- `rateLimiter.ts` tiene fallback a in-memory si Upstash no está configurado

**❌ Mal:**
- **🔴 CRÍTICO: Sentry NO está configurado** — `NEXT_PUBLIC_SENTRY_DSN` no existe en `.env.local` ni probablemente en las env vars de Vercel (dado que el `.env.example` lo tiene comentado). Los errores en producción van a ningún lado. El código de integración existe pero está silenciado. Esto es el hallazgo más similar al "deploy que nunca existió" de Bachillerato.
- **Sin monitoreo de performance client-side** — los simuladores Three.js pueden tener FPS drops severos en dispositivos de gama media. No hay Web Vitals, no hay performance monitoring.
- **Sin backups verificados de DB** — Supabase Free/Hobby tier tiene backups limitados. Sin saber el tier actual, no se puede confirmar si hay backups automáticos.
- **Sin alertas de downtime** — no hay Uptime Robot, Statuspage ni similar configurado.
- **Rate limiting en memoria local en desarrollo** — cuando Upstash no está configurado, el rate limiter usa un `Map` en memoria. Si hay múltiples instancias serverless (como en Vercel production sin Upstash), los límites NO se comparten entre instancias y el rate limiting no funciona correctamente en producción.
- **`VERCEL_OIDC_TOKEN` en `.env.production`** — este token tiene fecha de expiración (`exp: 1777386848` = Mayo 25 2026) y ya puede estar vencido. Fue generado por `vercel env pull`.

---

## Mapa de Cosas Latentes

| # | Problema | Probabilidad de explotar | Impacto | Cuándo abordarlo |
|---|----------|--------------------------|---------|-----------------|
| 1 | Credenciales rotadas incorrectamente tras commit de secrets en git history | Alta | Alto | **URGENTE** |
| 2 | Sentry no configurado → primer error serio de prod sin visibilidad | Alta | Alto | **URGENTE** |
| 3 | Sin migraciones SQL → pérdida de schema si cambia acceso a Supabase | Media | Alto | Pre-mejoras |
| 4 | Memory leaks en 4 simuladores con listeners sin cleanup | Media | Medio | Pre-mejoras |
| 5 | Rate limiting no funciona en Vercel multi-instance sin Upstash | Media | Medio | Pre-mejoras |
| 6 | Health check de 40 rutas nunca corre automáticamente | Media | Medio | Pre-mejoras |
| 7 | `route.ts` singleton createClient puede fallar en cold start edge | Baja | Alto | Pre-mejoras |
| 8 | Next.js HIGH vulnerabilities sin parchear | Alta | Medio | Pre-mejoras |
| 9 | Descripción errónea de física ("colisiones") llegue a usuarios | Media | Bajo | Cuando haya tiempo |
| 10 | Archivos `.bak` y `_old` acumulando deuda en git | Baja | Bajo | Cuando haya tiempo |
| 11 | Sin coverage thresholds → regresión de tests silenciosa | Baja | Medio | Pre-mejoras |
| 12 | Progreso del alumno solo en localStorage → pérdida en cambio de dispositivo | Alta | Medio | Decisión de negocio |

---

## Hallazgos Comparables al Caso Bachillerato
*"Esto se asumió que funcionaba pero nunca se verificó"*

Se encontraron **4 hallazgos de este tipo**:

1. **Sentry se asumió activo** — el código está integrado, el archivo `sentry.client.config.ts` existe y tiene configuración sofisticada (filtros de ruido para Three.js, etc.). Pero `SENTRY_DSN` no está en ningún env file. En producción, todos los errores runtime se pierden. Nadie lo habría notado hasta el primer error serio.

2. **El health check post-deploy se asumió automático** — `preview-tests.yml` existe y revisa los 40 simuladores. Pero es `workflow_dispatch` (manual). En ningún momento se activa automáticamente después de un deploy. Si un commit rompe 30 simuladores (como ya pasó el 2026-05-11), el sistema no avisa.

3. **El schema de la base de datos se asumió versionado** — el `supabase/README.md` incluso dice "este directorio debe mantenerse sincronizado" y tiene instrucciones de exportación. Pero `supabase/migrations/` no existe. El schema real nunca se exportó. Esta es la deuda más peligrosa a largo plazo.

4. **El rate limiting en producción se asumió funcionando** — el código detecta `UPSTASH_REDIS_REST_URL` y cae en `InMemoryMap` si no está. En un entorno serverless como Vercel con múltiples instancias, cada instancia tiene su propio `Map`. Los límites por IP o por usuario NO se comparten. Un atacante puede simplemente generar tráfico en múltiples instancias y esquivar el rate limit. Solo Upstash garantiza el límite real.

---

## Opinión Honesta

### ¿Cuán sólida está la base para los próximos meses de mejoras?

**Moderadamente sólida, con una deuda de seguridad que debe atenderse primero.**

La arquitectura de código es buena: separación dominio/slice/componente es correcta, los 40 simuladores son funcionales, los tests del dominio son sólidos, la protección de rutas funciona. Hay fundamentos reales de calidad.

Pero la deuda operacional es alta: sin Sentry activo, sin health check automático, sin schema versionado y con credenciales en el historial de git, se está operando con baja visibilidad y riesgo de seguridad activo. Agregar simuladores sobre esta base implica que cada nuevo bug de producción puede pasar desapercibido.

### ¿Qué priorizarías arreglar antes de empezar a tocar simuladores individuales?

En este orden estricto:

1. **Rotar credenciales expuestas en commit `057eb45`** — ANON_KEY y cualquier otro secreto comprometido. No se puede posponer.
2. **Configurar Sentry DSN en Vercel** — 30 minutos de trabajo, zero riesgo, visibilidad inmediata.
3. **Exportar schema de Supabase a `supabase/migrations/`** — protección del activo más valioso (la DB).
4. **Actualizar Next.js a 15.5.18** — parchear los 2 HIGH CVEs.
5. **Agregar `workflow_dispatch` → cron en ci.yml para el health check post-deploy**.

### ¿Hay algún problema que recomendaría PARAR todo para arreglar primero?

Sí: **la rotación de credenciales del punto 1**. El commit `057eb45` no se puede eliminar de git sin reescribir la historia (operación destructiva). Las credenciales en ese commit deben considerarse comprometidas y el ANON_KEY debe rotarse en el dashboard de Supabase. Mientras no se haga, hay credentials vivos en el historial que cualquier persona con acceso al repo puede ver.

Si el repositorio es privado y el acceso está controlado, la urgencia es media. Si alguna vez fue público o se planea abrir, es crítica.

---

*Diagnóstico generado: 2026-05-16 | Sin modificaciones al código fuente | Solo lectura*
