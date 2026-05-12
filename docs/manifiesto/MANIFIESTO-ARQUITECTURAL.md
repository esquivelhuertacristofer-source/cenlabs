# MANIFIESTO ARQUITECTURAL — Antigravity / CEN Plataformas

> Versión 1.0 — Mayo 2026  
> Destilado de: CEN Educación Financiera + CEN Labs (Sprint 1–3 + validación piloto institucional)

---

## 1. Audiencia y propósito

Este documento existe por una razón concreta: Claude no tiene memoria entre conversaciones. Cuando Cristofer Huerta Esquivel abre una nueva sesión para construir un proyecto nuevo, el asistente empieza desde cero. Este manifiesto es la única forma de que el conocimiento acumulado sobreviva.

**Quién debe leerlo:**
- El asistente IA al inicio de cualquier sesión de construcción
- Cualquier colaborador técnico que se integre al proyecto
- Cristofer, como referencia rápida antes de tomar decisiones de arquitectura

**Cómo usarlo:**
Pegarlo en el contexto inicial de la sesión (ver `PROMPT-MAESTRO-INICIAL.md`). No es un documento para leer de corrido — es una referencia. Ir directo a la sección relevante cuando surge una decisión.

---

## 2. Contexto del autor

**Cristofer Huerta Esquivel** es artista mexicano, director de Antigravity. No es desarrollador de software en el sentido convencional. Construye plataformas educativas digitales con asistencia de IA (Claude, Gemini) como herramienta principal de desarrollo.

Esto tiene implicaciones concretas para el trabajo:

- Las explicaciones deben ser conceptuales antes que técnicas cuando hay ambigüedad
- El asistente IA asume mayor responsabilidad en decisiones de arquitectura
- Los errores de "debería saber esto" no existen — toda decisión no obvia debe documentarse
- El flujo de trabajo es iterativo y basado en validación real, no en teoría
- Español neutro en toda la documentación y comunicación. No argentino, no modismos mexicanos excesivos

---

## 3. Anti-patrones descubiertos

Estos errores se cometieron en proyectos reales. Se documentan no para señalar culpables sino para no repetirlos.

---

### AP-1: Dos clientes Supabase con `flowType` diferente

**Qué pasó en CEN Labs:**  
El proyecto tenía dos archivos de cliente Supabase:

```typescript
// lib/supabase.ts — cliente vanilla (flowType: 'implicit')
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true }
})

// lib/supabase-browser.ts — cliente SSR (flowType: 'pkce')
export const supabase = createBrowserClient(url, anonKey)
```

Login usaba `supabase-browser` → guardaba la sesión en localStorage en formato PKCE. El dashboard usaba `supabase.ts` vanilla → intentaba leer la misma key (`sb-[project]-auth-token`) pero no podía parsear el formato PKCE → ejecutaba todas las consultas como **anónimo**. RLS bloqueaba todo → 406 PGRST116 en producción.

**Consecuencia visible:** El panel del profesor mostraba "0 ALUMNOS ACTIVOS", "0 PRÁCTICAS", errores 406 en toda consulta a `grupos`.

**La regla:** Un solo cliente Supabase en todo el frontend. Siempre `createBrowserClient` de `@supabase/ssr`. Nunca `createClient` vanilla en componentes de navegador.

```typescript
// lib/supabase-browser.ts — ÚNICO cliente para componentes browser
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

### AP-2: Fire-and-forget en operaciones de base de datos

**Qué pasó en CEN Labs:**  
El callback que guardaba el resultado del quiz del alumno al completar el simulador era:

```typescript
// ANTES — nunca fallaba visiblemente porque nadie escuchaba
onComplete={(quizScore) => {
  setShowSuccess(true)
  supabase.from('intentos').upsert({
    id_alumno: user.id,
    sim_id: simuladorId,
    status: 'completed',
    score: quizScore,
  }, { onConflict: 'id_alumno, sim_id, status' })
  // sin await, sin catch, sin logging
}}
```

El upsert fallaba silenciosamente durante semanas. Los alumnos completaban prácticas pero el profesor no veía progreso. No había forma de saber que estaba fallando porque no había ningún log de error.

**La regla:** Toda operación de escritura a DB lleva `await`, `try/catch` y logging contextual.

```typescript
// DESPUÉS
onComplete={async (quizScore) => {
  setShowSuccess(true)
  console.log('[onComplete] Guardando intento', { sim_id: simuladorId, score: quizScore })
  try {
    const { data, error } = await supabase
      .from('intentos')
      .upsert({ ... }, { onConflict: 'id_alumno, sim_id, status' })
      .select()
      .single()
    if (error) {
      console.error('[onComplete] Error al guardar:', { code: error.code, message: error.message })
    } else {
      console.log('[onComplete] Guardado OK:', data)
    }
  } catch (e) {
    console.error('[onComplete] Exception inesperada:', e)
  }
}}
```

---

### AP-3: `ignoreBuildErrors: true` en la configuración de Next.js

**El problema:**  
Cuando se agrega `typescript: { ignoreBuildErrors: true }` en `next.config.ts`, los errores de TypeScript no detienen el build. El deploy llega a producción con código roto. El compilador que debería ser la primera línea de defensa queda desactivado.

**La regla:** Esta opción no existe en proyectos de producción. Si el build falla por errores de TypeScript, se arreglan los errores, no se silencia el compilador.

```typescript
// next.config.ts — NUNCA esto
const config: NextConfig = {
  typescript: { ignoreBuildErrors: true }, // NO
}

// next.config.ts — siempre esto (la ausencia ya es la configuración correcta)
const config: NextConfig = {
  // sin typescript.ignoreBuildErrors
}
```

---

### AP-4: Triggers de seguridad no versionados en código

**Qué pasó:**  
El trigger `handle_new_user` en Supabase (que crea automáticamente un row en `profiles` cuando se registra un usuario nuevo) fue creado manualmente desde el dashboard de Supabase. No existía en ningún archivo de migración en el repositorio. Si el esquema se resetea o se crea un proyecto nuevo, el trigger desaparece sin aviso.

**La regla:** Todo trigger, función PL/pgSQL y política RLS debe existir en `supabase/migrations/`. El dashboard es solo para inspección, nunca para crear objetos de producción.

```sql
-- supabase/migrations/20260101000000_handle_new_user.sql
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'role', 'alumno')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

---

### AP-5: Contenido educativo como archivos TypeScript acoplados al deploy

**El problema en CEN Labs:**  
Los 40 simuladores tienen sus pasos de laboratorio definidos como objetos TypeScript dentro de archivos `.tsx`. Cambiar una instrucción de laboratorio requiere editar código, hacer commit, y esperar el deploy de Vercel. Esto es innecesariamente frágil para contenido que debería ser editable por un docente.

**La regla:** Separar contenido de código. Para proyectos futuros, las instrucciones, preguntas y textos educativos van en la base de datos o en archivos JSON/Markdown en un directorio `content/`. Los componentes los consumen en tiempo de ejecución.

---

### AP-6: `.env.local` en el historial de git

**El problema:**  
Si `.env.local` se commitea aunque sea una vez, las credenciales quedan en el historial incluso después de borrarlo. `git log` puede recuperarlas.

**La regla:** `.env.local` debe estar en `.gitignore` antes del primer commit. Verificar con `git status` antes de cada commit que no aparezca staging. Si ya se comprometió, rotar las credenciales inmediatamente (nueva service_role key, nuevo anon key).

```
# .gitignore — verificar que siempre incluye:
.env.local
.env*.local
```

---

### AP-7: `global.headers` que sobrescriben `apikey` en el cliente Supabase

**El problema:**  
Cuando se pasa `global: { headers: { apikey: '...' } }` en la configuración del cliente Supabase, puede sobrescribir el header `Authorization` en requests y hacer que las consultas lleguen sin sesión. Este patrón aparece en algunos ejemplos de la documentación pero causa comportamiento inesperado con RLS.

**La regla:** No usar `global.headers` para manipular `apikey`. Dejar que `createBrowserClient` maneje los headers de autenticación automáticamente.

---

### AP-8: Acceder a objeto como si fuera array

**El problema:**  
Cuando se usa `.single()` en Supabase, el resultado es un objeto, no un array. Sin embargo es fácil escribir accidentalmente:

```typescript
// INCORRECTO — grupos es un objeto { id: '...' }, no un array
const nombre = grupos?.[0]?.nombre

// CORRECTO
const nombre = grupo?.nombre
```

Este error no siempre genera un error de TypeScript visible si los tipos no están bien definidos. Resulta en `undefined` silencioso.

---

### AP-9: `.single()` en queries que pueden devolver 0 filas

**Qué pasó en CEN Labs:**  
Todos los componentes del dashboard usaban el patrón:

```typescript
const { data: grupo } = await supabase
  .from('grupos')
  .select('id')
  .eq('nombre', selectedGroup)
  .single() // PGRST116 si RLS bloquea o no hay match
```

Cuando el cliente corría como anónimo (ver AP-1), RLS devolvía 0 filas. `.single()` en 0 filas devuelve error PGRST116 con status HTTP 406. El componente no podía continuar y fallaba silenciosamente mostrando estados vacíos.

**La regla:** Usar `.maybeSingle()` cuando el resultado puede ser nulo por diseño. Usar `.single()` solo cuando la ausencia de resultado es un error genuino.

```typescript
// .maybeSingle() devuelve null sin error si no hay filas
const { data: grupo, error } = await supabase
  .from('grupos')
  .select('id')
  .eq('nombre', selectedGroup)
  .maybeSingle()

if (!grupo) {
  // handle gracefully
  return
}
```

---

### AP-10: Botones sin handlers conectados en producción

**Qué pasó en CEN Labs:**  
El botón "Vincular Alumno" existía en la UI del dashboard del profesor durante varios sprints. Tenía estilos, ícono, y se mostraba a los profesores. Pero `onClick` no estaba conectado a ninguna función. Presionarlo no hacía nada.

**La regla:** Todo elemento interactivo que llegue a producción debe tener su handler conectado, o bien estar visualmente deshabilitado con una explicación. Un botón inerte en producción destruye la confianza del usuario.

---

### AP-11: Políticas RLS creadas en el dashboard sin versionar

**El problema:**  
Las políticas de Row Level Security de Supabase se crean fácilmente desde el dashboard web. Si solo existen ahí, no son reproducibles. Un esquema nuevo (staging, nuevo proyecto) no tendrá las mismas políticas. Un reset de la base de datos las borra.

**La regla:** Toda política RLS va en un archivo de migración.

```sql
-- supabase/migrations/20260101000001_rls_policies.sql
alter table grupos enable row level security;

-- Profesores ven sus propios grupos
create policy "profesor_read_own_grupos"
  on grupos for select
  using (id_profesor = auth.uid());

-- Alumnos ven grupos a los que pertenecen
create policy "alumno_read_own_grupos"
  on grupos for select
  using (
    id in (
      select id_grupo from alumnos_grupos
      where id_alumno = auth.uid()
    )
  );
```

---

## 4. Patrones recomendados

### PR-1: Un solo cliente Supabase con SSR

```typescript
// lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Este es el único cliente que deben importar los componentes de navegador. El servidor usa `createServerClient` de `@supabase/ssr` (solo en Server Components, Route Handlers y middleware).

---

### PR-2: Operaciones DB con await + try/catch + logging contextual

El logging contextual no es "ruido" — es la diferencia entre un bug que tarda 30 minutos en diagnosticar y uno que tarda 3 días.

```typescript
async function guardarResultado(payload: IntentoPatch) {
  console.log('[guardarResultado] Iniciando', { sim_id: payload.sim_id, user_id: payload.id_alumno })
  try {
    const { data, error } = await supabase
      .from('intentos')
      .upsert(payload, { onConflict: 'id_alumno, sim_id, status' })
      .select()
      .single()

    if (error) {
      console.error('[guardarResultado] Error Supabase:', {
        code: error.code,
        message: error.message,
        hint: (error as any).hint
      })
      return { data: null, error }
    }

    console.log('[guardarResultado] OK:', data.id)
    return { data, error: null }
  } catch (e) {
    console.error('[guardarResultado] Exception:', e)
    return { data: null, error: e }
  }
}
```

---

### PR-3: TypeScript strict desde el inicio

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

No negociar esto. Los errores de TypeScript en el CI son regalos, no obstáculos.

---

### PR-4: Domain extraction — lógica pura y testeable

La lógica de negocio no debe vivir dentro de componentes React. Extraerla a funciones puras permite testearla sin render, sin mocks de DOM, sin efectos secundarios.

```typescript
// lib/domain/calcularNota.ts — función pura, testeable con Vitest
export function calcularNota(correctas: number, total: number): number {
  if (total === 0) return 0
  return Math.round((correctas / total) * 100)
}

// lib/domain/calcularNota.test.ts
import { calcularNota } from './calcularNota'
describe('calcularNota', () => {
  it('devuelve 0 para total 0', () => expect(calcularNota(0, 0)).toBe(0))
  it('calcula porcentaje correctamente', () => expect(calcularNota(4, 5)).toBe(80))
})
```

En CEN Labs se extrajeron 199 tests de esta manera con cobertura completa de la lógica de dominio.

---

### PR-5: RLS versionada en migraciones

Ver AP-11. Todo en `supabase/migrations/`. El schema completo debe ser reproducible ejecutando `supabase db reset`.

---

### PR-6: Triggers documentados con propósito y dependencias

```sql
-- supabase/migrations/20260101000000_handle_new_user.sql
-- PROPÓSITO: Crear perfil automáticamente al registrar usuario en auth.users
-- DEPENDE DE: tabla 'profiles' con columnas (id, email, full_name, role)
-- DISPARADO POR: INSERT en auth.users (via Supabase Auth)
-- ÚLTIMA MODIFICACIÓN: 2026-01-01
```

---

### AP-12: Guards de `notFound()` sobre datos grandes con `as const` en serverless

**Qué pasó en CEN Labs (2026-05-11 — incidente en producción):**  
Se agregó un guard en `app/alumno/simulador/[id]/page.tsx`:

```typescript
import { MASTER_DATA } from '@/data/simuladoresData';
if (!MASTER_DATA[normalizedId]) notFound();
```

El objeto `MASTER_DATA` tiene 40 entradas y usa modificador `as const`. En local funcionaba correctamente. En Vercel (serverless), el módulo se resolvía parcialmente antes del timeout — `quimica-1` (primera clave) resolvía; `fisica-*`, `biologia-*`, `matematicas-*` (claves posteriores) devolvían `undefined` y activaban `notFound()`. **30 de 40 simuladores cayeron durante una demo institucional en vivo.**

**Root cause:**  
Los módulos ESM grandes con `as const` pueden sufrir inicialización lazy en entornos serverless con límites de CPU. El guard asumía que el módulo siempre estaría completamente inicializado — asunción válida en Node.js persistente, no en lambdas con cold start.

**El fix:**  
Eliminar el guard completamente. El componente `SimuladorClient` ya maneja el caso `!data` con un UI de error amigable. No se necesita guardar en el servidor.

**La regla:** No colocar guards de `notFound()` que dependan de la inicialización completa de objetos de datos grandes importados como módulo. Dejar el manejo al componente cliente.

---

## 5. Stack base para proyectos nuevos

Versiones validadas en CEN Labs (Mayo 2026). Actualizar con cautela — siempre leer changelogs antes de bump de versión mayor.

| Capa | Tecnología | Versión | Razón |
|---|---|---|---|
| Framework | Next.js | 15.x (App Router) | RSC + middleware de auth integrado |
| UI | React | 19.x | Concurrent features |
| Lenguaje | TypeScript | 5.x strict | Elimina una clase entera de bugs |
| Estado global | Zustand | 5.x | Mínimo boilerplate, compatible con SSR |
| Base de datos | Supabase | 2.x | RLS, Auth, Storage en un solo servicio |
| Auth (browser) | @supabase/ssr | 0.10.x | PKCE, cookies httpOnly, middleware |
| Estilos | Tailwind CSS | 3.x | Sin forzar build setup personalizado |
| Componentes | shadcn/ui | latest | Headless, accesible, copiable al proyecto |
| Gráficos | Recharts | 3.x | Declarativo, bien integrado con React |
| PDFs | jsPDF + jspdf-autotable | 4.x | Generación programática sin servidor |
| Tests | Vitest | latest | Nativo ESM, rápido, compatible con Next.js |
| Deploy | Vercel | — | Zero-config con Next.js |
| Monitoreo | Vercel Analytics | — | Sin configuración adicional |
| Errores | Sentry | 9.x | Requiere configuración manual inicial |

**Dependencias opcionales según proyecto:**
- `three` + `@react-three/fiber` + `@react-three/drei` — visualizaciones 3D en simuladores
- `katex` + `react-katex` — ecuaciones matemáticas
- `framer-motion` — animaciones complejas
- `@upstash/ratelimit` + `@upstash/redis` — rate limiting en API routes

---

## 6. Decisiones arquitecturales tomadas

Estas decisiones fueron tomadas por Cristofer con contexto educativo específico. No son defaults universales — son decisiones informadas para el caso de uso de plataformas educativas institucionales mexicanas.

### PC-first sobre mobile-first

**Decisión:** Los simuladores y el dashboard están diseñados para pantallas de escritorio (1280px+).

**Razón:** Los laboratorios de cómputo de preparatorias y secundarias mexicanas operan con computadoras de escritorio. Los alumnos hacen las prácticas en clase, no en el teléfono. Optimizar para mobile en esta etapa desplazaría recursos de funcionalidad core.

---

### Contraseñas compartidas únicas por lote escolar

**Decisión:** Todos los alumnos de un grupo piloto comparten la misma contraseña temporal (`piloto2026`). Se entrega en PDF impreso por el docente.

**Razón:** El onboarding de 30 alumnos con contraseñas individuales y recuperación self-service es logísticamente inviable para docentes sin soporte técnico. La contraseña por lote reduce el tiempo de activación de días a minutos.

**Consideración de seguridad:** Las cuentas institucionales no contienen información sensible personal. La contraseña se considera semi-pública dentro del grupo y puede cambiarse individualmente después del primer acceso.

---

### Sin recuperación de contraseña en la versión institucional

**Decisión:** No hay enlace de "olvidé mi contraseña" en la versión piloto para alumnos.

**Razón:** Los correos institucionales (`@cenlaboratorios.com`) son ficticios — no hay bandeja de entrada real. La recuperación de contraseña la hace el administrador manualmente o reasignando credenciales.

---

### Onboarding masivo desde código con `service_role` key

**Decisión:** Los alumnos se crean programáticamente desde un script Node.js usando la `service_role` key de Supabase, que bypasea RLS.

**Razón:** Evita que el administrador registre 30 alumnos manualmente en el dashboard. El script es idempotente (puede ejecutarse varias veces sin duplicar) y genera el PDF de credenciales automáticamente.

```typescript
// scripts/piloto-setup.ts — fragmento
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

for (const alumno of ALUMNOS) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email: alumno.email,
    password: alumno.password,
    user_metadata: { full_name: alumno.nombre, role: 'alumno' },
    email_confirm: true
  })
}
```

---

## 7. Checklist pre-release

Ejecutar antes de cada push a `main` que llegue a producción.

**Build:**
- [ ] `npx tsc --noEmit` pasa sin errores
- [ ] `npm run build` completa sin errores (en local, con webpack)
- [ ] No hay `console.log` de debug no intencionales en código crítico

**Autenticación:**
- [ ] Login funciona en ventana de incógnito
- [ ] Sesión persiste entre recargas
- [ ] Logout limpia session correctamente
- [ ] Middleware redirige correctamente rutas protegidas

**Base de datos:**
- [ ] Todas las operaciones de escritura tienen `await` + `try/catch`
- [ ] No hay `.single()` en queries que puedan devolver 0 filas sin manejo de error
- [ ] Los upserts tienen `onConflict` definido explícitamente
- [ ] RLS verificada: rol alumno no ve datos de otros alumnos

**UI:**
- [ ] Todos los botones visibles tienen handler conectado
- [ ] Estados de carga (`loading`) implementados en formularios
- [ ] Mensajes de error son visibles al usuario, no solo en consola
- [ ] No hay elementos UI rotos o incompletos en flujos principales

**Seguridad:**
- [ ] `.env.local` no aparece en `git status`
- [ ] No hay `service_role` key en código de componentes cliente
- [ ] Variables de entorno sensibles marcadas como no-`NEXT_PUBLIC_`

**Deploy:**
- [ ] Variables de entorno configuradas en Vercel
- [ ] Re-test manual en URL de Vercel después del deploy
- [ ] Vercel Analytics activo

---

## 8. Cambios futuros previstos

Este documento debe actualizarse cuando:
- Se descubre un anti-patrón nuevo en un sprint
- Se toma una decisión arquitectural con contexto relevante
- El stack base cambia de versión mayor (Next.js 16, Supabase v3, etc.)
- Se añade un proyecto nuevo con learnings distintos

**Historial:**
| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-05-11 | Versión inicial — CEN Financiera + CEN Labs Sprint 1–3 |
| 1.1 | 2026-05-11 | AP-12: incidente serverless `as const` guard — 30/40 simuladores caídos en producción |
