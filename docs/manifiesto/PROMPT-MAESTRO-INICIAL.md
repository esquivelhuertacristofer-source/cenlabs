# PROMPT MAESTRO INICIAL — Para nuevas sesiones con Claude

> Este archivo es copiable y pegable directamente en el chat de un Claude nuevo.
> Cristofer: copiar todo desde la línea de inicio hasta el final, reemplazar los
> campos marcados con `[COMPLETAR]`, y pegarlo como primer mensaje de la sesión.

---

## INICIO DEL PROMPT (copiar desde aquí)

---

Hola. Antes de empezar a trabajar, necesito darte contexto completo sobre quién soy y cómo trabajamos. Lee todo esto — es breve y te va a ahorrar muchos errores.

---

### Quién soy

Soy **Cristofer Huerta Esquivel**, artista mexicano y director de **Antigravity**. No soy desarrollador de software en el sentido convencional. Construyo plataformas educativas digitales con asistencia de IA como herramienta principal. He construido dos plataformas hasta ahora:

1. **CEN Educación Financiera** — plataforma de educación financiera para nivel preparatoria
2. **CEN Labs** — plataforma de laboratorios virtuales de ciencias con 40 simuladores interactivos (química, física, biología, matemáticas). Stack: Next.js 15 + React 19 + TypeScript strict + Zustand + Supabase + Vercel. Esta plataforma ya está en producción y tuvo validación piloto institucional con 10 alumnos y 1 profesor.

---

### Cómo trabajamos juntos

- **Español neutro** en toda la comunicación. No argentino, no modismos excesivos.
- **Explícame el porqué antes del cómo** cuando haya decisiones arquitecturales. No asumas que sé las implicaciones de una decisión técnica.
- **Reportame antes de actuar** en operaciones destructivas o cambios grandes. La regla es: diagnóstico primero, fix después.
- **No hay preguntas tontas**. Si algo no está documentado, pregunta. Si algo es ambiguo, aclara antes de escribir código.
- **Un asistente, una sesión**. No voy a alternar entre Claude y otro asistente en el mismo sprint — eso rompe el contexto.

---

### Documentos que debes leer obligatoriamente

Estos documentos existen porque tú no tienes memoria entre conversaciones. Son el contexto acumulado de todo el trabajo anterior.

**En el proyecto actual (`cen-dashboard/docs/manifiesto/`):**

1. `MANIFIESTO-ARQUITECTURAL.md` — anti-patrones reales con casos, patrones recomendados, stack base, decisiones arquitecturales tomadas, checklist pre-release
2. `PROCESO-DE-CONSTRUCCION.md` — reglas operativas, workflow de sprints, testing piloto, cómo comunicarse conmigo

Si estás en un proyecto nuevo (no `cen-dashboard`), los documentos del manifiesto de CEN Labs siguen siendo válidos como referencia de patrones y anti-patrones — aunque el código sea diferente.

**Lee esos dos documentos ahora, antes de hacer cualquier otra cosa.** Si no tienes acceso a ellos (sesión en carpeta diferente), dímelo y te los proporciono.

---

### Aprendizajes clave de proyectos anteriores (resumen ejecutivo)

Estos son los errores más costosos que cometimos. Están documentados en detalle en `MANIFIESTO-ARQUITECTURAL.md`, pero aquí el resumen para que los tengas presentes desde el inicio:

**1. Dos clientes Supabase con `flowType` diferente**
El mayor bug de CEN Labs. Login usaba `createBrowserClient` (PKCE), el dashboard usaba `createClient` vanilla (implicit). El dashboard corría como anónimo. RLS bloqueaba todo. "0 alumnos activos". Se tardó 2 sesiones en diagnosticar. La regla: un solo cliente, siempre `createBrowserClient` de `@supabase/ssr`.

**2. Fire-and-forget en operaciones de base de datos**
`supabase.from('intentos').upsert({...})` sin `await` y sin `catch`. Fallaba silenciosamente. Los alumnos completaban prácticas pero el profesor no veía nada. Toda escritura a DB lleva `await` + `try/catch` + `console.log/error`.

**3. Botones sin handlers en producción**
"Vincular Alumno" estuvo varios sprints en la UI sin función conectada. Todo elemento interactivo visible tiene su handler conectado o está visualmente deshabilitado.

**4. `.single()` en queries que pueden devolver 0 filas**
PGRST116 + 406. Usar `.maybeSingle()` cuando la ausencia es válida. `.single()` solo cuando 0 filas es un error genuino.

**5. No versionar RLS y triggers**
Si no está en `supabase/migrations/`, no existe. El dashboard de Supabase es para inspección, no para crear objetos de producción.

---

### Proyecto actual

**[COMPLETAR: describe el proyecto nuevo aquí]**

- Nombre: [ej: CEN Bachillerato MCCEMS]
- Propósito: [qué problema resuelve]
- Audiencia: [quiénes son los usuarios, nivel educativo]
- Estado actual: [nuevo desde cero / continuación de X / migración de Y]
- Objetivo de esta sesión: [qué quieres lograr hoy]
- Carpeta de trabajo: [ruta absoluta a la carpeta del proyecto]
- Variables de entorno disponibles: [sí/no, cuáles]

---

### Reglas de oro — no negociables

1. **Leer antes de escribir** — leer los archivos relevantes antes de proponer cambios
2. **Diagnóstico antes de fix** — si algo falla, diagnosticar primero; no arreglar a ciegas
3. **Build limpio = requisito** — `tsc --noEmit` pasa antes de cualquier push
4. **Un cliente Supabase** — `createBrowserClient` de `@supabase/ssr` para todo el frontend
5. **Await + try/catch** — toda escritura a DB
6. **RLS en migraciones** — nada de políticas solo en el dashboard
7. **Sin `ignoreBuildErrors`** — nunca en ningún proyecto

---

### Workflow de primera sesión — qué hacer antes de escribir código

1. Leer `MANIFIESTO-ARQUITECTURAL.md` y `PROCESO-DE-CONSTRUCCION.md`
2. Leer el estado actual del proyecto (archivos clave, `package.json`, estructura)
3. Confirmar el stack y versiones
4. Identificar si hay deuda técnica existente que afecte el objetivo de la sesión
5. Definir el scope exacto de esta sesión con Cristofer antes de escribir una línea de código
6. Proponer el plan → esperar confirmación → ejecutar

No empezar a escribir código sin haber hecho estos 6 pasos. Una sesión que empieza leyendo bien termina mejor que una que empieza "directamente en la tarea".

---

Cuando termines de leer los documentos del manifiesto, confirmame:
- Qué anti-patrones notaste que son relevantes para el proyecto de esta sesión
- Si hay algo en el estado actual del código que ya viola los patrones del manifiesto
- Cuál es tu propuesta de plan para el objetivo de esta sesión

Luego esperamos confirmación mía antes de ejecutar.

---

## FIN DEL PROMPT

---

> **Nota para Cristofer:** Reemplaza la sección `[COMPLETAR]` con el contexto del proyecto nuevo. El resto del prompt es genérico y válido para cualquier proyecto. Si el proyecto tiene su propio CLAUDE.md o AGENTS.md, menciónalo también en la sección de proyecto actual.

---

## Cómo mantener este documento actualizado

Después de cada proyecto importante, revisar:
- ¿Hay nuevos anti-patrones que agregar al punto de "aprendizajes clave"?
- ¿Cambió el stack base? Actualizar en MANIFIESTO-ARQUITECTURAL.md y reflejar aquí.
- ¿Hay una nueva regla de oro que surgió de la experiencia?

Este documento evoluciona con cada proyecto. La versión 1.0 refleja CEN Financiera + CEN Labs.

**Historial:**
| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 2026-05-11 | Versión inicial — CEN Financiera + CEN Labs Sprint 1–3 |
