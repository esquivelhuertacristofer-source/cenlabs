# PROCESO DE CONSTRUCCIÓN — Antigravity / CEN Plataformas

> Versión 1.0 — Mayo 2026  
> Destilado de: CEN Educación Financiera + CEN Labs (Sprint 1–3 + validación piloto institucional)

---

## 1. Propósito

Este documento describe cómo se trabaja, no qué se construye. Es el manual de operaciones del flujo de desarrollo con asistentes IA para plataformas educativas digitales. Su utilidad es que un asistente nuevo pueda leerlo y alinearse al flujo sin preguntas innecesarias.

---

## 2. Reglas operativas fundamentales

Estas reglas no son sugerencias. Se derivan de problemas reales que ocurrieron cuando se violaron.

---

### REGLA-1: Una tarea = un asistente

**No alternar entre Claude y Gemini dentro del mismo sprint.**

Cada asistente construye su propia representación del estado del proyecto a medida que avanza la sesión. Alternar rompe esa representación. El asistente nuevo no sabe qué cambió el anterior, y comete errores de contexto que son difíciles de detectar.

Dentro de un sprint: un asistente hasta el final. Si la sesión se interrumpe y hay que continuar con otro asistente, el primer paso es leer el estado actual del código — no confiar en el historial de la conversación anterior.

---

### REGLA-2: Trabajar siempre en carpetas con timestamp

```
cen-sprintN-YYYY-MM-DD-HHMM/        ← carpeta de trabajo activa
_respaldo-pre-sprintN-YYYY-MM-DD-HHMM/   ← copia intocable antes de iniciar
```

El timestamp en el nombre sirve para ordenar carpetas cronológicamente y para saber exactamente cuándo se creó cada respaldo. Sin timestamp, los nombres "respaldo-v1", "respaldo-final", "respaldo-final-2" se vuelven ambiguos.

---

### REGLA-3: Respaldos intocables

La carpeta `_respaldo-pre-sprint*` no se modifica después de creada. Si el sprint destruye algo inesperadamente, esa carpeta es el punto de restauración. Si se modifica "solo para ver algo", deja de ser confiable como punto de restauración.

Para ediciones exploratorias pequeñas dentro de un sprint, se usan mini-backups por archivo:

```
_pre-fix-backup/
  AlumnosContent.tsx.2026-05-11-1430
  SimuladorClient.tsx.2026-05-11-1445
```

---

### REGLA-4: Con `service_role` key, el asistente hace todo automatizado

Cuando Cristofer proporciona la `service_role` key de Supabase, el asistente puede:
- Crear usuarios en Auth programáticamente
- Hacer upserts que bypasean RLS
- Ejecutar scripts de onboarding completo
- Modificar datos de prueba para diagnóstico

**No pedir al usuario que haga tareas manuales en el dashboard de Supabase si el script puede hacerlo.** El objetivo es que el usuario ejecute un comando y vea el resultado.

---

### REGLA-5: Build con webpack en local, Turbopack en Vercel

**Problema real documentado:** En CEN Labs, el build con Turbopack en local generaba errores de compilación que no ocurrían con webpack, y viceversa. La discrepancia causó confusión sobre si el build estaba realmente limpio.

**La regla:** Usar el script `npm run build` (webpack, sin `--turbo`) para la validación de build en local antes de push. Vercel usa Turbopack en producción y eso está correcto — el problema era en el entorno de diagnóstico local.

---

### REGLA-6: Push a `main` solo después de validación completa

No hacer push a `main` "para guardar el progreso". Los pushes a `main` llegan a Vercel automáticamente y los ven los usuarios. La secuencia correcta es:

1. Cambios en local
2. Build limpio confirmado (`tsc --noEmit` + `npm run build`)
3. Test manual del flujo principal
4. Commit con mensaje descriptivo
5. Push a `main`
6. Verificación rápida en URL de Vercel

Si se necesita guardar progreso sin deploy, usar una rama separada (`git checkout -b sprint-N-wip`).

---

## 3. Estructura de carpetas recomendada

```
cen-[nombre]-sprint[N]-YYYY-MM-DD-HHMM/
├── src/
│   ├── app/                    ← rutas Next.js (App Router)
│   ├── components/             ← componentes reutilizables
│   ├── lib/                    ← utilidades, clientes, helpers
│   │   ├── supabase-browser.ts ← ÚNICO cliente Supabase para browser
│   │   ├── supabase-server.ts  ← cliente Supabase para Server Components
│   │   └── domain/             ← lógica pura sin efectos secundarios
│   ├── store/                  ← Zustand stores
│   └── types/                  ← tipos TypeScript compartidos
├── supabase/
│   └── migrations/             ← TODO el schema SQL versionado aquí
├── scripts/                    ← automatización: setup, onboarding, PDFs
├── docs/
│   ├── manifiesto/             ← documentos maestros (este repo)
│   └── ...                     ← informes, planes, credenciales
├── _pre-fix-backup/            ← mini-backups por archivo durante sprints
└── output/                     ← archivos generados (en .gitignore)
```

---

## 4. Workflow de sprints

### Antes de iniciar un sprint

1. **Leer el estado actual** — no asumir que el código está como lo dejó la última sesión. Leer los archivos relevantes.
2. **Crear respaldo** — copiar la carpeta de trabajo a `_respaldo-pre-sprintN-YYYY-MM-DD-HHMM/`
3. **Leer el manifiesto** — `docs/manifiesto/MANIFIESTO-ARQUITECTURAL.md` y este documento
4. **Definir el scope** — qué entra en el sprint, qué queda fuera. Acordarlo con Cristofer antes de escribir código.

### Durante el sprint

1. **Fases numeradas** — cada sprint se divide en fases claras (Fase 1: diagnóstico, Fase 2: implementación, Fase 3: validación). Reportar al completar cada fase.
2. **Build de validación después de cada fase** — `npx tsc --noEmit` mínimo. Build completo si hay cambios estructurales.
3. **Mini-backup antes de editar archivos críticos** — copiar el archivo a `_pre-fix-backup/` con timestamp antes de modificarlo.
4. **Revertir desde mini-backup si hay regresión** — si una edición rompe algo que funcionaba, restaurar desde `_pre-fix-backup/` antes de intentar arreglarlo "sobre el error".

### Al finalizar un sprint

1. **Reporte de sprint** — qué se hizo, qué quedó pendiente, qué bugs se encontraron
2. **Actualizar `docs/manifiesto/`** — si se descubrió un anti-patrón nuevo o se tomó una decisión arquitectural relevante
3. **Commit descriptivo** (ver sección de mensajes de commit)
4. **Push solo si build limpio y validación manual OK**

### Mensajes de commit

Seguir la convención `type(scope): descripción en inglés`.

```
feat(simulador): add async quiz completion with try/catch logging
fix(dashboard): replace vanilla supabase with ssr client in 11 components
docs(manifiesto): create architectural manifesto and process guide
chore(scripts): add pilot credentials PDF generator
```

Tipos: `feat` (nueva funcionalidad), `fix` (bug), `docs` (documentación), `chore` (tareas de mantenimiento sin impacto en funcionalidad), `refactor`, `test`.

---

## 5. Testing piloto institucional

Antes de entregar una plataforma a una institución, ejecutar el siguiente protocolo. No es opcional — la validación con datos reales es la única que cuenta.

### Configuración del piloto

- **10 alumnos ficticios** con nombres mexicanos realistas
- **1 grupo** (`GRUPO-PILOTO-001` o equivalente)
- **1 profesor** con acceso al dashboard
- **1 admin** con acceso completo
- Todos con correos del dominio institucional ficticio

El script de setup crea todos los usuarios programáticamente y genera el PDF de credenciales.

### Escenarios mínimos de validación

**Escenario 1 — Alumno completa una actividad:**
1. Login como alumno
2. Navegar al simulador
3. Completar todos los pasos del laboratorio
4. Completar el quiz
5. Presionar "Cerrar y Validar"
6. Verificar en DB que el intento existe con `status: 'completed'` y `score` correcto

**Escenario 2 — Profesor ve métricas:**
1. Logout del alumno
2. Login como profesor
3. Navegar al dashboard → seleccionar el grupo
4. Verificar que el alumno aparece en la lista
5. Verificar que las métricas reflejan la práctica completada (no ceros)

**Escenario 3 — Privacidad entre alumnos:**
1. Login como alumno A
2. Intentar acceder a datos del alumno B (directo por URL o consulta)
3. Verificar que RLS bloquea el acceso (0 filas, no error 500)

### Qué capturar cuando algo falla

1. **Consola del navegador** (F12 → Console) — errores JavaScript y logs de debug
2. **Network tab** (F12 → Network) — requests fallidos, status codes, response bodies
3. **Status codes como pistas:**
   - `406` + `PGRST116` → `.single()` devolvió 0 filas (problema de sesión o RLS)
   - `401` → No hay sesión válida (problema de autenticación)
   - `403` → Hay sesión pero RLS bloquea (problema de permisos)
   - `409` → Conflicto de upsert (constraint violation)

### Replicar el problema programáticamente

Si la UI falla pero no es claro por qué, escribir un script que ejecute exactamente las mismas queries que ejecutaría el frontend:

```javascript
// diag-anonimo.mjs
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://[project].supabase.co'
const anonKey = '[anon-key]'
const supabase = createClient(supabaseUrl, anonKey)

// Sin sesión — debería devolver 0 filas si RLS está activo
const { data, error, status } = await supabase
  .from('grupos').select('id').eq('nombre', 'GRUPO-PILOTO-001')
console.log({ status, rows: data?.length, error: error?.code })
```

Si el script anónimo y el frontend dan los mismos resultados, el problema es de RLS o schema. Si el script autenticado funciona pero el frontend no, el problema es de cliente (sesión no se está leyendo correctamente).

---

## 6. Deploy y monitoreo

### Proceso de deploy

```
local (dev server)
    → validación manual
    → git commit
    → git push main
    → Vercel auto-deploy
    → verificación en URL de producción
```

### Variables de entorno en Vercel

Cada proyecto nuevo requiere configurar manualmente en Vercel Dashboard → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo backend/scripts, no `NEXT_PUBLIC_`)
- `UPSTASH_REDIS_REST_URL` (si usa rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` (si usa rate limiting)
- `SENTRY_DSN` (si usa Sentry)
- `NEXT_PUBLIC_EMAIL_DOMAIN` (dominio institucional configurable)

### Monitoreo activo

- **Vercel Analytics**: activar en el proyecto desde el inicio. Dashboard → Analytics → Enable.
- **Sentry**: requiere un paso manual — `npx @sentry/wizard@latest -i nextjs` en el proyecto. El wizard crea los archivos de configuración automáticamente. No se puede automatizar desde código.

---

## 7. Comunicación con asistentes IA

### Español neutro

Toda comunicación con el asistente en español neutro — no argentino ("boludo", "laburar", "che"), no mexicano excesivo ("wey", "chido"). El objetivo es que los prompts y respuestas sean comprensibles para cualquier hispanohablante.

### Prompts estructurados

Los prompts más efectivos tienen:
1. Contexto — qué está pasando, cuál es el estado actual
2. Problema específico — qué falla o qué se quiere construir
3. Fases claras — qué validar en cada etapa
4. Restricción explícita — "NO ejecutes ningún fix todavía" o "Reportame antes de actuar"

**Lo que no funciona:**
- Prompts largos con múltiples tareas no relacionadas
- Pedir al asistente que "continúe" sin contexto del estado actual
- Mandar un prompt nuevo antes de recibir el reporte del anterior

**Lo que funciona:**
- Una tarea bien definida por prompt cuando el asistente está en medio de trabajo
- Preguntar "¿qué encontraste?" antes de pedir que proceda
- Dar acceso a `service_role` key para que el asistente pueda diagnosticar directamente

### Cuando Claude tiene `service_role`: delegar todo

Si el asistente tiene la `service_role` key y acceso a las variables de entorno, puede ejecutar cualquier operación de base de datos sin intervención manual. No tiene sentido pedir "ve al dashboard de Supabase y borra ese row" cuando el asistente puede escribir el script que lo hace.

La única tarea que el asistente no puede automatizar es configurar Sentry (requiere OAuth con la cuenta del usuario en sentry.io).

---

## 8. Cambios futuros previstos

Este documento debe actualizarse cuando:
- Se descubre un anti-patrón de proceso nuevo (no solo técnico)
- El flujo de trabajo cambia por una herramienta nueva
- Se añade un tipo de proyecto nuevo (mobile, API standalone, etc.)

**Historial:**
| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-05-11 | Versión inicial — CEN Financiera + CEN Labs Sprint 1–3 |
