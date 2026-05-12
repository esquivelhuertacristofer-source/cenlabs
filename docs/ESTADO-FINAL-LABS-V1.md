# CEN Labs — Estado Final V1

> Fecha: 2026-05-11  
> Sprint: Cierre al 100% como producto serio  
> Resultado: **LISTO PARA PILOTO INSTITUCIONAL**

---

## Resumen

CEN Labs es una plataforma de simuladores de ciencias para educación media superior. Esta versión (V1) fue construida y validada entre abril y mayo de 2026 por Cristofer Huerta Esquivel (Antigravity) con asistencia de Claude (Anthropic).

V1 entra al piloto institucional con 40 simuladores funcionales, autenticación estable, monitoreo de errores, tests automatizados y CI/CD.

---

## Estado de la plataforma

### Simuladores
| Materia | Cantidad | Estado |
|---|---|---|
| Química | 10 | ✅ Funcionales |
| Física | 10 | ✅ Funcionales |
| Biología | 10 | ✅ Funcionales |
| Matemáticas | 10 | ✅ Funcionales |
| **Total** | **40** | ✅ |

### Infraestructura
| Componente | Estado | Notas |
|---|---|---|
| Deploy | ✅ Vercel | Auto-deploy desde main |
| Base de datos | ✅ Supabase | RLS activo, triggers configurados |
| Autenticación | ✅ PKCE (supabase/ssr) | Bug de flowType resuelto |
| Rate limiting | ✅ `/api/resultados` | Upstash Redis + fallback in-process |
| Monitoreo de errores | ✅ Sentry | Configurado, filtros de ruido activos |
| Analytics | ✅ Vercel Analytics | Activo |

### Tests
| Suite | Tests | Estado |
|---|---|---|
| `smoke.test.ts` | 14 | ✅ PASS |
| `simuladores-routing.test.ts` (integración) | 44 | ✅ PASS |
| `domain/quimica.test.ts` | variable | ✅ PASS |
| `domain/fisica.test.ts` | variable | ✅ PASS |
| `domain/biologia.test.ts` | variable | ✅ PASS |
| `domain/matematicas.test.ts` | variable | ✅ PASS |
| `api/resultados.test.ts` | 14 | ✅ PASS |
| `validators.test.ts` | variable | ✅ PASS |
| `labObjetivos.test.ts` | variable | ✅ PASS |
| **Total** | **262** | ✅ PASS |

### CI/CD
| Workflow | Trigger | Acciones |
|---|---|---|
| `ci.yml` | Push a main/develop, PRs | tsc, jest, next build |
| `preview-tests.yml` | Manual | HTTP check 40 simuladores |

---

## Bugs resueltos en este sprint

### Bug 1 — Profesor ve 0 alumnos en dashboard
- **Causa:** Dos clientes Supabase con `flowType` diferente (implicit vs PKCE)
- **Fix:** Unificado a `createBrowserClient` de `@supabase/ssr` en todos los componentes
- **Archivos:** 12 archivos migrados, `lib/supabase.ts` eliminado

### Bug 2 — Botón "Vincular Alumno" sin handler
- **Causa:** UI parcialmente implementada sin acción conectada
- **Fix:** Handler implementado con llamada a server action

### Bug 3 — Score no se guardaba
- **Causa:** Upsert de Supabase sin `await` ni `catch` (fire-and-forget)
- **Fix:** Operación con `await` + `try/catch` + logging

### Incidente producción — 30/40 simuladores devolvían 404
- **Causa:** Guard `notFound()` sobre `MASTER_DATA` objeto grande con `as const` — inicialización parcial en Vercel serverless
- **Fix:** Guard eliminado — `SimuladorClient` maneja IDs inválidos en cliente
- **Prevención:** Test de integración `simuladores-routing.test.ts` + CI pipeline

---

## Mejoras de ingeniería aplicadas

### Fase 1 — Sentry
- `sentry.client.config.ts`: filtros de ruido (browser extensions, CSP, THREE.Clock, ResizeObserver, ad blockers)
- `sentry.server.config.ts`: tagging de incidentes 404 de simuladores con fingerprint único
- `next.config.ts`: `withSentryConfig` wrapper con source maps condicionados a `SENTRY_AUTH_TOKEN`
- `src/app/global-error.tsx`: creado para captura de errores de render React con Sentry

### Fase 2 — Supabase unificado
- Creado `src/lib/supabase-helpers.ts`: cliente único + todos los tipos de dominio + helpers (`guardarResultado`, `syncIntento`, `getCurrentProfile`, `isSupabaseConfigured`)
- Creado `src/lib/supabase-admin.ts`: cliente server-only con `service_role` key para operaciones admin
- Eliminado `src/lib/supabase.ts` (cliente vanilla con flowType incorrecto)
- 12 archivos migrados

### Fase 3 — Tests y CI/CD
- 262 tests pasando, 0 fallos
- Test de integración crítico: `simuladores-routing.test.ts` (previene recurrencia del incidente)
- CI: `ci.yml` con tsc + jest + build
- Smoke HTTP: `preview-tests.yml` para verificar las 40 rutas post-deploy

### Fase 4 — UX
- `SimuladorClient.tsx`: corregido bug de `simuladorId` vs `normalizedId` en lookup de MASTER_DATA (línea 236)
- `global-error.tsx`: creado para captura de errores de render

---

## Documentación generada en este sprint

| Documento | Propósito |
|---|---|
| `docs/manifiesto/MANIFIESTO-ARQUITECTURAL.md` (v1.1) | Anti-patrones, patrones recomendados, stack, checklist. AP-12 añadido. |
| `docs/manifiesto/PROCESO-DE-CONSTRUCCION.md` | Metodología de trabajo |
| `docs/manifiesto/PROMPT-MAESTRO-INICIAL.md` | Prompt copiable para iniciar nuevas sesiones |
| `docs/SENTRY-SETUP-INSTRUCCIONES.md` | Pasos para configurar Sentry en cuenta nueva |
| `docs/PRUEBA-ONBOARDING-PILOTO.md` | Validación e2e del flujo de piloto institucional |
| `docs/POSTMORTEM-2026-05-11-LABS-30-SIMULADORES-CAIDOS.md` | Análisis del incidente en producción |
| `docs/ESTADO-FINAL-LABS-V1.md` | Este documento |

---

## Variables de entorno requeridas (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
UPSTASH_REDIS_REST_URL=        (opcional — sin esto, rate limiting usa in-process Map)
UPSTASH_REDIS_REST_TOKEN=      (opcional)
IP_SALT=                       (opcional — tiene default)
```

---

## Próximos pasos (V2 — fuera del alcance de este sprint)

- [ ] Mover `sentry.client.config.ts` a `instrumentation-client.ts` (Turbopack compatibility)
- [ ] Mobile-responsive para simuladores simples (física, matemáticas)
- [ ] Sistema de grupos/cursos para docentes
- [ ] Reportes exportables por grupo desde el dashboard
- [ ] Internacionalización (inglés) para el módulo admin
- [ ] Migración a Vitest (más rápido y mejor integrado con Next.js 15)
