# INFORME MAESTRO TÉCNICO — CEN LABS
**Plataforma de Laboratorios Virtuales de Ciencias**

> Documento generado: 2026-05-10  
> Versión de plataforma auditada: Diamond State v5.2 (commit `4439c92`)  
> Propósito: Referencia técnica para abogados, desarrolladores, inversores y asistentes IA

---

## ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Técnica](#2-arquitectura-técnica)
3. [Estructura del Código](#3-estructura-del-código)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Autenticación y Autorización](#5-autenticación-y-autorización)
6. [Contenido Educativo](#6-contenido-educativo)
7. [Flujos de Usuario](#7-flujos-de-usuario)
8. [Integraciones Externas](#8-integraciones-externas)
9. [Deploy e Infraestructura](#9-deploy-e-infraestructura)
10. [Estado de Testing y Monitoreo](#10-estado-de-testing-y-monitoreo)
11. [Capacidades Reales del Producto](#11-capacidades-reales-del-producto)
12. [Deuda Técnica Documentada](#12-deuda-técnica-documentada)
13. [Seguridad y Privacidad](#13-seguridad-y-privacidad)
14. [Limitaciones de Escalabilidad](#14-limitaciones-de-escalabilidad)
15. [Historia de Construcción](#15-historia-de-construcción)
16. [Documentación Existente](#16-documentación-existente)
17. [Aspectos Únicos de Plataforma de Laboratorios](#17-aspectos-únicos-de-plataforma-de-laboratorios)
18. [Recomendaciones para Profesionalización](#18-recomendaciones-para-profesionalización)
19. [Preguntas Abiertas](#19-preguntas-abiertas)

---

## 1. RESUMEN EJECUTIVO

### Qué es en una frase
CEN Labs es una plataforma web de laboratorios virtuales de ciencias exactas con 40 simuladores interactivos para nivel preparatoria/licenciatura, dashboard de seguimiento docente y sistema de evaluación automática.

### Estado actual
**MVP funcional desplegado en producción.** La plataforma opera, tiene usuarios reales, y cuenta con funcionalidad completa end-to-end: estudiantes acceden a simuladores, completan prácticas, el sistema valida resultados y el profesor monitorea el progreso. No es un prototipo.

### Audiencia target
- Instituciones educativas mexicanas de nivel preparatoria y licenciatura
- Materias: Química, Física, Biología y Matemáticas
- Roles: Alumnos (40 simuladores) y Profesores (dashboard de seguimiento)

### Stack tecnológico (resumen)
Next.js 15 + React 19 + TypeScript estricto + Zustand + Supabase + Vercel

### Métricas clave de contenido
| Métrica | Valor |
|---|---|
| Simuladores interactivos | 40 (10 por materia) |
| Bitácoras de laboratorio | 42 componentes |
| Líneas de código (estimado) | ~35,000 |
| Componentes Piloto (simuladores) | ~12,348 líneas en total |
| Componentes Bitácora | ~8,879 líneas en total |
| Tests automáticos | 199 (todos pasan) |
| Páginas Next.js generadas | 18 |
| Archivos de documentación | 16 archivos markdown |

### Estado de madurez
**MVP → Producto** — La funcionalidad core está completa. Falta principalmente la capa de comercialización (billing, onboarding self-service, multi-tenant completo).

---

## 2. ARQUITECTURA TÉCNICA

### Stack completo con versiones

| Capa | Tecnología | Versión |
|---|---|---|
| Framework web | Next.js | 15.1.9 |
| UI Library | React | 19.2.4 |
| Lenguaje | TypeScript | ^5 (strict mode) |
| Estado global | Zustand | ^5.0.12 |
| Persistencia local | Zustand persist + localStorage | — |
| Base de datos | Supabase (PostgreSQL) | ^2.103.0 |
| Auth | Supabase Auth | ^2.103.0 (SSR ^0.10.3) |
| Rate limiting | Upstash Ratelimit + Redis | 2.0.8 / 1.38.0 |
| Estilos | Tailwind CSS | ^4 |
| Animaciones | Framer Motion | ^12.38.0 |
| Gráficas | Recharts | ^3.8.1 |
| 3D/WebGL | Three.js + React Three Fiber | 0.184.0 / ^9.6.0 |
| Audio | Web Audio API (nativo) | — |
| Ecuaciones matemáticas | KaTeX + react-katex | 0.16.45 / ^3.1.0 |
| PDF | jsPDF | ^4.2.1 |
| Iconos | Lucide React | ^1.7.0 |
| Componentes UI | shadcn + Base UI | ^4.1.2 / ^1.3.0 |
| Temas | next-themes | ^0.4.6 |
| Node.js | Node | 22.x |
| Deploy | Vercel | — |
| CI/CD | GitHub Actions | — |

### Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Navegador)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────────────────────────────────┐ │
│  │   Zustand    │  │         Next.js App Router (React 19)        │ │
│  │   Store      │  │                                              │ │
│  │  (5 slices)  │  │  /login  /alumno/**  /admin/**  /profesor/** │ │
│  │ localStorage │  │  /planeamiento  /auditoria  /alumnos         │ │
│  └──────┬───────┘  └─────────────────┬────────────────────────────┘ │
│         │                            │                              │
│  ┌──────▼──────────────────────────────────────────────────────────┐ │
│  │              Componentes (React)                                 │ │
│  │  Piloto*.tsx (x41)  Bitácora*.tsx (x42)  Dashboard Components  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ HTTP / Fetch
┌──────────────────────────────────▼──────────────────────────────────┐
│                    SERVIDOR (Vercel — Edge/Serverless)               │
│                                                                     │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐│
│  │  middleware.ts        │    │  API Routes (Next.js)               ││
│  │  - Auth JWT check     │    │  POST /api/resultados               ││
│  │  - Route protection   │    │  - Auth Bearer token                ││
│  │  - Security headers   │    │  - Rate limiting (IP + user)        ││
│  └──────────────────────┘    │  - Input validation                  ││
│                               │  - Supabase insert                  ││
│  ┌──────────────────────┐    └──────────────────────────────────────┘│
│  │  src/lib/             │                                           │
│  │  rateLimiter.ts       │    ┌──────────────────────────────────────┐│
│  │  (Upstash/InMemory)   │    │  Server Actions                     ││
│  └──────────────────────┘    │  onboardInstitutionalUsers()         ││
│                               └──────────────────────────────────────┘│
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
              ┌────────────────────┴─────────────────────┐
              │                                           │
┌─────────────▼──────────────┐          ┌────────────────▼────────────┐
│   Supabase (PostgreSQL)     │          │   Upstash Redis             │
│   - profiles                │          │   (Rate limiting)           │
│   - intentos                │          │   Opcional, sin él usa      │
│   - bitacora_entries        │          │   InMemoryMap               │
│   - asignaciones            │          └─────────────────────────────┘
│   - grupos (auth schema)    │
│   RLS activo                │
└─────────────────────────────┘
```

### Decisiones arquitectónicas clave

**1. Domain Extraction (src/domain/)**  
Toda la lógica de validación científica vive en funciones puras, sin dependencia del framework. Permite testearlas unitariamente sin levantar React ni Zustand. Decisión tomada para aumentar la confiabilidad de las 40 validaciones.

**2. Zustand con persist + deepMerge**  
El estado del simulador se persiste en localStorage para que el alumno no pierda su progreso si cierra accidentalmente. Se usa deepMergeState custom porque el merge nativo de Zustand es shallow — reemplazaría objetos completos y perdería constantes (listas de reacciones, sustancias) que viven en el código, no en el estado.

**3. Capa de dominio separada de la capa de UI**  
Los slices de Zustand son "wrappers delgados" — llaman al dominio para calcular, y solo manejan efectos secundarios (actualizar estado, registrar hallazgo, detener timer). El cálculo científico no tiene dependencia de React ni de Zustand.

**4. Rate limiting dual**  
Dos capas: IP (pre-autenticación, 30/min) para protección DoS, y user.id (post-autenticación, 10/min) para control por identidad. La capa de IP usa el primer valor de `x-forwarded-for` para evitar spoofing básico. Backend Upstash Redis en producción (estado compartido entre instancias), InMemoryMap en desarrollo.

**5. No hay backend propio**  
El stack es completamente serverless: Next.js en Vercel + Supabase. No hay servidor Node.js gestionado. Esto reduce costo operativo pero limita ciertos patrones (websockets nativos, jobs en background).

---

## 3. ESTRUCTURA DEL CÓDIGO

### Árbol de carpetas

```
cen-dashboard/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Router RBAC raíz (82 líneas)
│   │   ├── layout.tsx              # Root layout con providers
│   │   ├── globals.css             # Tokens de diseño (173 líneas)
│   │   ├── error.tsx               # Página de error global con Dr. Quantum
│   │   ├── not-found.tsx           # Página 404
│   │   ├── login/page.tsx          # Login con Supabase Auth
│   │   ├── landing/page.tsx        # Landing pública
│   │   ├── alumno/
│   │   │   ├── inicio/page.tsx     # Dashboard del alumno
│   │   │   ├── laboratorio/
│   │   │   │   ├── quimica/        # Selección de prácticas de Química
│   │   │   │   ├── fisica/         # Selección de prácticas de Física
│   │   │   │   ├── biologia/       # Selección de prácticas de Biología
│   │   │   │   └── matematicas/    # Selección de prácticas de Matemáticas
│   │   │   ├── simulador/[id]/     # Simulador dinámico por ID
│   │   │   └── ruta/[id]/          # Vista de ruta de aprendizaje
│   │   ├── admin/usuarios/page.tsx # Onboarding masivo de usuarios
│   │   ├── alumnos/page.tsx        # Directorio de alumnos (profesor)
│   │   ├── auditoria/page.tsx      # Consola de auditoría (profesor)
│   │   ├── laboratorios/page.tsx   # Biblioteca de labs (profesor)
│   │   ├── planeamiento/page.tsx   # Planeación de clase (profesor)
│   │   ├── actions/
│   │   │   └── adminActions.ts     # Server Action: onboardInstitutionalUsers
│   │   └── api/
│   │       └── resultados/route.ts # POST endpoint con auth + rate limit
│   │
│   ├── components/
│   │   ├── Piloto*.tsx             # 41 simuladores interactivos (~12,348 líneas)
│   │   ├── bitacoras/
│   │   │   └── Bitacora*.tsx       # 42 bitácoras de laboratorio (~8,879 líneas)
│   │   ├── AlumnosContent.tsx      # Directorio de alumnos con radar charts
│   │   ├── AuditoriaContent.tsx    # Consola de auditoría en tiempo real
│   │   ├── LaboratoriosContent.tsx # Biblioteca de 40 labs
│   │   ├── PlaneamientoContent.tsx # 40 planes de clase (506 líneas)
│   │   ├── StudentProfileModal.tsx # Perfil profundo + PDF
│   │   ├── MissionBriefing.tsx     # Briefing pre-simulador con Dr. Quantum
│   │   ├── Sidebar.tsx             # Navegación con filtro de grupo
│   │   ├── ErrorBoundary.tsx       # Error boundary React (clase)
│   │   ├── ThemeProvider.tsx       # Tema claro/oscuro
│   │   └── ui/                     # Componentes shadcn reutilizables
│   │
│   ├── context/
│   │   └── AppContext.tsx          # Estado de grupo seleccionado (29 líneas)
│   │
│   ├── domain/                     # Lógica de validación científica pura
│   │   ├── quimica.ts              # validarQ1..Q10
│   │   ├── fisica.ts               # validarF1..F10
│   │   ├── biologia.ts             # validarB1..B10
│   │   └── matematicas.ts          # validarM1..M10 + feedbackM1
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Cliente Supabase + helpers
│   │   ├── supabase-browser.ts     # Cliente SSR para navegador
│   │   ├── rateLimiter.ts          # Rate limiter dual backend
│   │   ├── planeamientos.ts        # 40 planes de clase (399 líneas)
│   │   └── reportUtils.ts          # Generación PDF con jsPDF
│   │
│   ├── store/
│   │   ├── simuladorStore.ts       # Master store Zustand con persist
│   │   ├── types.ts                # SimuladorState + tipos de slices
│   │   └── slices/
│   │       ├── coreSlice.ts        # Auth, timer, score, bitácora
│   │       ├── quimicaSlice.ts     # Estado de 10 prácticas de Química
│   │       ├── fisicaSlice.ts      # Estado de 10 prácticas de Física
│   │       ├── biologiaSlice.ts    # Estado de 10 prácticas de Biología
│   │       └── matematicasSlice.ts # Estado de 10 prácticas de Matemáticas
│   │
│   ├── utils/
│   │   ├── audioEngine.ts          # Síntesis de audio Web Audio API (276 líneas)
│   │   └── validators.ts           # validatePracticaId, validateScore
│   │
│   ├── middleware.ts               # Gateway de auth + headers de seguridad
│   │
│   └── __tests__/
│       ├── smoke.test.ts           # Tests de integración básicos
│       ├── validators.test.ts      # Tests de validadores
│       ├── labObjetivos.test.ts    # Tests de objetivos de laboratorio
│       └── domain/
│           ├── quimica.test.ts     # 55 tests
│           ├── fisica.test.ts      # 29 tests
│           ├── biologia.test.ts    # 31 tests
│           └── matematicas.test.ts # 48 tests
│
├── docs/                           # Documentación (este archivo)
├── .github/workflows/ci.yml        # Pipeline CI/CD GitHub Actions → Vercel
├── next.config.ts                  # Configuración Next.js + CSP headers
├── tsconfig.json                   # TypeScript strict mode
├── eslint.config.mjs               # ESLint con reglas relajadas (any → warn)
├── jest.config.js                  # Configuración de tests
└── package.json                    # Dependencias
```

### Convenciones de nomenclatura

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes simulador | `Piloto` + PascalCase | `PilotoLeyOhm.tsx` |
| Bitácoras | `Bitacora` + PascalCase | `BitacoraLeyOhm.tsx` |
| Validaciones dominio | `validar` + Materia + Número | `validarQ1`, `validarF10` |
| Slices Zustand | `create` + Materia + `Slice` | `createQuimicaSlice` |
| Tipos de slice | Materia + `Slice` | `QuimicaSlice` |
| IDs de práctica | `materia-número` | `quimica-1`, `fisica-10` |
| Tests de dominio | Mismo nombre con `.test.ts` | `quimica.test.ts` |

### Patrones de código identificados

**Patrón 1 — Wrapper delgado de slice:**
```typescript
// Slice no calcula — delega al dominio y solo maneja efectos
validarF1: () => {
  const isOk = FisicaDomain.validarF1(get().tiro1);
  if (isOk) set((s) => ({ tiro1: { ...s.tiro1, estado: 'success' } }));
  return isOk;
},
```

**Patrón 2 — Función pura de dominio:**
```typescript
// Recibe estado como parámetro, no tiene dependencia de Zustand
export function validarF1(state: Pick<SimuladorState, 'tiro1'>): boolean {
  const { resultado, municion } = state.tiro1;
  return resultado === 'exito' && municion >= 0;
}
```

**Patrón 3 — Rate limiter con fallback:**
```typescript
// Factory detecta env vars y elige backend automáticamente
const ipLimiter   = createLimiter(30, 60_000, 'cen:rl:ip');
const userLimiter = createLimiter(10, 60_000, 'cen:rl:user');
```

---

## 4. MODELO DE DATOS

### Tablas (inferidas de `src/lib/supabase.ts`)

> **Nota:** No se encontraron archivos de migración SQL en el repositorio. El esquema se infiere del código TypeScript. La fuente de verdad del esquema es el dashboard de Supabase del proyecto.

#### `profiles`
| Columna | Tipo inferido | Notas |
|---|---|---|
| `id` | `string` (UUID) | FK → auth.users.id |
| `email` | `string` | Único |
| `full_name` | `string` | Nombre completo |
| `avatar_url` | `string?` | Opcional |
| `role` | `'alumno' \| 'profesor' \| 'admin'` | Enum |
| `created_at` | `string` (ISO 8601) | Auto |

#### `intentos`
| Columna | Tipo inferido | Notas |
|---|---|---|
| `id` | `string` (UUID) | PK |
| `id_alumno` | `string` | FK → profiles.id |
| `sim_id` | `string` | Ej: `'quimica-1'`, `'fisica-10'` |
| `status` | `'in_progress' \| 'completed' \| 'abandoned'` | Estado |
| `score` | `number` | 0-100 |
| `total_time_seconds` | `number` | Duración |
| `last_step` | `number` | Último paso completado |
| `started_at` | `string` (ISO 8601) | Auto |
| `completed_at` | `string?` | Nullable |
| `bitacora_data` | `JSONB` | Datos de la bitácora |

**Conflict resolution:** `ON CONFLICT (id_alumno, sim_id, status)` — un intento por alumno+simulador+estado.

#### `bitacora_entries`
| Columna | Tipo inferido | Notas |
|---|---|---|
| `id` | `string` (UUID) | PK |
| `id_intento` | `string` | FK → intentos.id |
| `variable_key` | `string` | Nombre del evento registrado |
| `value` | `any` | Valor (puede ser número, objeto, string) |
| `created_at` | `string` | Auto |

#### `asignaciones`
| Columna | Tipo inferido | Notas |
|---|---|---|
| `id` | `string` (UUID) | PK |
| `id_profesor` | `string` | FK → profiles.id |
| `id_grupo` | `string` | FK → grupos.id |
| `sim_id` | `string` | Práctica asignada |
| `planned_date` | `string?` | Fecha planificada |
| `notes` | `string?` | Notas del profesor |
| `created_at` | `string` | Auto |

#### `grupos` (tabla referenciada, no documentada en supabase.ts)
Referenciada en joins de `AlumnosContent.tsx` a través de `alumnos_grupos`. Estructura exacta no disponible en el código fuente del repositorio.

### RLS
Row Level Security está activo en Supabase. Las políticas específicas se configuraron a través del dashboard de Supabase y no están en el repositorio como código. Esto es un riesgo de documentación — si se pierde acceso al dashboard, las políticas no son recuperables desde el repo.

### Triggers
Un trigger de Supabase auto-crea un registro en `profiles` cuando se crea un usuario en `auth.users`. El código de este trigger no está en el repositorio.

---

## 5. AUTENTICACIÓN Y AUTORIZACIÓN

### Cómo funciona el login

1. El usuario entra a `/login` e introduce email y contraseña
2. El cliente llama a `supabase.auth.signInWithPassword()`
3. Supabase devuelve un JWT (access token) y un refresh token
4. `@supabase/ssr` persiste la sesión en cookies HttpOnly
5. En cada request, `middleware.ts` llama a `supabase.auth.getUser()` (validación server-side, no solo `getSession()`)
6. Si el JWT es inválido o expirado, redirige a `/login?redirect=<ruta-original>`

**Archivo clave:** `src/middleware.ts` (72 líneas)

### Roles soportados

| Rol | Acceso | Ruta de entrada |
|---|---|---|
| `alumno` | Simuladores, su propio progreso | `/alumno/inicio` |
| `profesor` | Dashboard completo, todos los alumnos | `/` (home) |
| `admin` | Gestión de usuarios | `/admin/usuarios` |

Los roles se almacenan en `profiles.role` y se leen en `page.tsx` para RBAC.

### Mecanismos de seguridad

- **JWT validación server-side** — `getUser()` en middleware, no `getSession()` (que solo lee la cookie sin validar con el servidor)
- **Cookies HttpOnly** — Los tokens no son accesibles desde JavaScript del cliente
- **Refresh automático** — `autoRefreshToken: true` en el cliente Supabase
- **Rate limiting** en `/api/resultados` — 30 req/min por IP, 10 req/min por usuario autenticado
- **Headers de seguridad** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-XSS-Protection, Permissions-Policy
- **CSP** — Content Security Policy configurada en `next.config.ts`, allowlist explícita

### Limitaciones conocidas

- **No hay MFA** — Solo email/password. Sin segundo factor.
- **Dominio de email hardcodeado** — El onboarding genera emails `@cenlaboratorios.com`. Si el cliente tiene otro dominio, requiere cambio en código (`src/app/actions/adminActions.ts` línea ~60).
- **Contraseña institucional única** — El onboarding masivo asigna la misma contraseña a todos los usuarios de un lote. El alumno puede cambiarla después, pero el flujo inicial no fuerza el cambio.
- **Sin recuperación de contraseña documentada** — No se encontró flujo de "olvidé mi contraseña" en el código auditado.

---

## 6. CONTENIDO EDUCATIVO

### Materias y nivel educativo

| Materia | Prácticas | Nivel |
|---|---|---|
| Química | 10 | Preparatoria / Licenciatura básica |
| Física | 10 | Preparatoria / Licenciatura básica |
| Biología | 10 | Preparatoria / Licenciatura básica |
| Matemáticas | 10 | Preparatoria / Licenciatura básica |
| **Total** | **40** | |

### Catálogo completo de simuladores

#### QUÍMICA

| ID | Nombre | Qué simula | Interacción | Tecnología |
|---|---|---|---|---|
| `quimica-1` | Construcción Atómica | Estructura del átomo, protones/neutrones/electrones, isótopos, iones | Drag & drop de partículas subatómicas | Canvas 2D / React state |
| `quimica-2` | Leyes de Gases Ideales | PV=nRT, leyes de Boyle, Charles, Gay-Lussac, Avogadro | Controles de T, V, n; alerta de explosión | React + cálculo JS |
| `quimica-3` | Balanceo de Ecuaciones | Ajuste estequiométrico de 5 reacciones | Botones +/- de coeficientes | React + verificación atómica |
| `quimica-4` | Reactivo Limitante | Cálculo de rendimiento teórico y masa en exceso | Input de masas, selección de reacción | React + cálculo JS |
| `quimica-5` | Preparación de Soluciones | Molariedad, pesado en balanza, matraz aforado | Drag & drop, balanza virtual | React + animación |
| `quimica-6` | Solubilidad y Cristalización | Curvas de solubilidad, temperatura, precipitación | Ajuste de temperatura y cantidad | React + cálculo exponencial |
| `quimica-7` | Titulación Ácido-Base | Punto de equivalencia, indicadores, pH | Dosificación gota a gota | React + cálculo pH |
| `quimica-8` | Equilibrio Químico | Sistema NO₂/N₂O₄, Le Chatelier, temperatura | Jeringas virtuales con temperatura | React + cálculo Keq |
| `quimica-9` | Celdas Galvánicas | Potencial estándar de reducción, voltaje | Selección de metales y electrolitos | React + tabla de potenciales |
| `quimica-10` | Destilación Fraccionada | Punto de ebullición, pureza, reflujo | Control de calor de manta | React + simulación temporal |

#### FÍSICA

| ID | Nombre | Qué simula | Interacción | Tecnología |
|---|---|---|---|---|
| `fisica-1` | Tiro Parabólico | Movimiento proyectil, ángulo, velocidad, obstáculos | Control de ángulo y velocidad, disparo | Canvas 2D / animación |
| `fisica-2` | Plano Inclinado | Descomposición de fuerzas, coeficiente de rozamiento | Ajuste de ángulo y coeficiente | React + cálculo vectorial |
| `fisica-3` | Péndulo Simple | T = 2π√(L/g), período, longitud | Control de longitud y ángulo inicial | React + Framer Motion |
| `fisica-4` | Ley de Hooke | F = -kx, oscilación, constante elástica | Control de k y masa | React + animación |
| `fisica-5` | Prensa Hidráulica | Principio de Pascal, presión, área | Ajuste de radios y fuerza | React + cálculo |
| `fisica-6` | Principio de Arquímedes | Empuje, densidad, flotabilidad | Selección de fluido y material | React + cálculo |
| `fisica-7` | Dilatación Térmica | ΔL = αL₀ΔT, coeficientes de materiales | Selección de material y temperaturas | React + tabla de α |
| `fisica-8` | Ley de Ohm | V = IR, circuitos simples, potencia | Conexión de componentes virtuales | React + cálculo eléctrico |
| `fisica-9` | Electrostática | Ley de Coulomb, fuerza entre cargas | Ajuste de cargas y distancia | React + cálculo |
| `fisica-10` | Motor Eléctrico | Campo magnético, corriente, espiras, RPM | Control de imanes, voltaje y espiras | React + animación |

#### BIOLOGÍA

| ID | Nombre | Qué simula | Interacción | Tecnología |
|---|---|---|---|---|
| `biologia-1` | Microscopía Virtual | Enfoque, magnificación, iluminación, profundidad de campo | Control de objetivo, foco macro/micro, diafragma | Canvas / React |
| `biologia-2` | Transporte Celular | Ósmosis, difusión, equilibrio de concentraciones | Ajuste de concentraciones | React + simulación temporal |
| `biologia-3` | Síntesis de Proteínas | Transcripción ADN→ARNm, traducción, codones | Selección de nucleótidos, avance del ribosoma | React + tabla de codones |
| `biologia-4` | Fotosíntesis | Espectro de luz, distancia, acumulación de O₂ | Control de color y distancia de lámpara | React + simulación temporal |
| `biologia-5` | Genética Mendeliana | Cruces monohíbridos/dihíbridos, tabla de Punnett | Selección de genotipos parentales | React + combinatoria |
| `biologia-6` | Evolución (Selección Natural) | Mariposas de Manchester, presión ambiental, generaciones | Caza de polillas, selección de ambiente | React + simulación poblacional |
| `biologia-7` | Sistema Nervioso | Arco reflejo, potencial de acción, sinapsis, mielina | Disparo de reflejo, ajuste de mielina | React + animación por fases |
| `biologia-8` | Sistema Cardiovascular | ECG, BPM, fases cardíacas, estados fisiológicos | Ajuste de estado fisiológico | React + Recharts |
| `biologia-9` | Sistema Digestivo | Enzimas, pH, macronutrientes, absorción | Selección de enzima y macronutriente | React + tabla enzimática |
| `biologia-10` | Ecosistema Lotka-Volterra | Depredador-presa, ciclos poblacionales | Control de parámetros α, β, γ, δ | React + integración numérica |

#### MATEMÁTICAS

| ID | Nombre | Qué simula | Interacción | Tecnología |
|---|---|---|---|---|
| `matematicas-1` | Ecuaciones Cuadráticas | Parábola y = ax²+bx+c, discriminante, vértice | Sliders de a, b, c | React + KaTeX |
| `matematicas-2` | Sistemas 2×2 | Intersección de rectas, solución gráfica | Ajuste de pendientes e intersecciones | Recharts |
| `matematicas-3` | Escala Richter | Escala logarítmica, factor de energía entre sismos | Input numérico del factor | React + KaTeX |
| `matematicas-4` | Teorema de Pitágoras | a²+b²=c², triángulos rectángulos, aplicaciones | Ajuste de catetos | React + SVG |
| `matematicas-5` | Trigonometría | Seno, coseno, circunferencia unitaria, fase | Rotación de ángulo | React + animación |
| `matematicas-6` | Transformaciones Geométricas | Traslación, rotación, escala sobre figura | Sliders de transformación | React + SVG/Canvas |
| `matematicas-7` | Óptica / Ley de Snell | Refracción, índice de refracción misterioso | Input del índice calculado | React + KaTeX |
| `matematicas-8` | Derivadas | f'(x) = 0, puntos críticos, f(x) = x³-4x²+3x | Selector de punto x | Recharts |
| `matematicas-9` | Integral de Riemann | Sumas izquierda/derecha/punto medio, n rectángulos | Control de n y método | React + Canvas |
| `matematicas-10` | Tablero de Galton | Distribución binomial, probabilidad, histograma | Control de n y p, lanzamiento de bolitas | React + animación |

### Bitácoras de laboratorio

Cada simulador tiene un componente `Bitácora*` paralelo (~8,879 líneas en total) que funciona como cuaderno de laboratorio digital. Características comunes:
- Registro de datos experimentales en tiempo real
- Cálculos derivados mostrados paso a paso
- Gráficas de resultados (Recharts)
- Sección de conclusiones (input de texto, mínimo 50 palabras)
- Hallazgos registrados como eventos en el store

---

## 7. FLUJOS DE USUARIO

### Flujo del alumno

```
/login
  ↓ (auth exitoso, role='alumno')
/alumno/inicio
  ↓ (selecciona materia)
/alumno/laboratorio/{materia}
  ↓ (selecciona práctica)
/alumno/simulador/{materia-número}
  │
  ├── Paso 1: Misión (contexto narrativo)
  ├── Paso 2: Briefing (MissionBriefing.tsx — instrucciones + tip Dr. Quantum)
  ├── Paso 3: Práctica (Piloto*.tsx + Bitácora*.tsx — simulación interactiva)
  └── Paso 4: Validación (dominio valida, score calculado, datos guardados)
```

**Persistencia del progreso:** Zustand + localStorage. El alumno puede cerrar y retomar donde dejó.

**Envío de resultados:** Al completar, el cliente hace POST a `/api/resultados` con Bearer token. El servidor verifica el JWT, aplica rate limiting, valida el body y guarda en Supabase.

### Flujo del profesor

```
/login
  ↓ (auth exitoso, role='profesor')
/ (home — dashboard)
  │
  ├── Alumnos (/alumnos)
  │   ├── Vista de directorio con radar charts por competencia
  │   ├── Filtro por grupo
  │   ├── Búsqueda por nombre
  │   ├── Modal de perfil individual con historial
  │   └── Exportación de reporte PDF grupal
  │
  ├── Auditoría (/auditoria)
  │   ├── Tabla de todos los intentos con estado, score, duración
  │   ├── 4 KPI cards (Total, Completados, En Progreso, Puntaje Bajo)
  │   ├── Filtros por nombre y estado
  │   └── Exportación CSV
  │
  ├── Laboratorios (/laboratorios)
  │   ├── Biblioteca visual de 40 labs
  │   └── Estadísticas de participación por lab
  │
  └── Planeamiento (/planeamiento)
      ├── 40 planes de clase detallados (teoría, estrategia, evaluación)
      ├── Banco de quiz (6 preguntas por práctica)
      ├── Modo proyector (pantalla completa para clase)
      └── Exportación PDF del plan
```

### Flujo del admin

```
/login → /admin/usuarios
  ├── Input de lista de nombres (textarea)
  ├── Selección de rol (alumno/profesor)
  ├── Selección de grupo (para alumnos)
  ├── Contraseña institucional
  └── Generación masiva de cuentas → PDF con credenciales
```

---

## 8. INTEGRACIONES EXTERNAS

| Servicio | Propósito | Criticidad | Costo |
|---|---|---|---|
| **Supabase** | Auth + base de datos PostgreSQL | **Crítica** — sin esto no hay login ni persistencia | Free tier hasta 500MB / 50k usuarios activos. Luego $25/mes |
| **Vercel** | Hosting y deploy serverless | **Crítica** — sin esto no hay app | Free tier con limitaciones. Pro $20/mes |
| **GitHub Actions** | CI/CD automático | Alta — deploy manual sin esto | Gratis en repo público |
| **Upstash Redis** | Rate limiting distribuido | Baja — tiene fallback en memoria | Free tier 10k req/día. $10/mes para producción |
| **Google Fonts** | Tipografías Outfit + Geist Mono | Baja — se puede hospedar localmente | Gratis |
| **Web Audio API** | Síntesis de audio | Media — sin audio la experiencia es peor pero funciona | Nativo del navegador — sin costo |
| **KaTeX (CDN)** | Renderizado de ecuaciones | Media — afecta labs de Matemáticas | Gratis (CDN jsDelivr) |

### Dependencias técnicas críticas sin las cuales el producto no funciona

1. **Supabase** — Auth y base de datos. Si el proyecto de Supabase se cierra o migra, hay que actualizar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.

2. **Node.js 22** — Requerido explícitamente en `package.json`. Las versiones inferiores pueden causar problemas con React 19 y el API de Web Streams.

3. **React 19 + Next.js 15** — Stack de vanguardia. Algunas librerías de terceros pueden tener problemas de compatibilidad (documentado en AGENTS.md).

---

## 9. DEPLOY E INFRAESTRUCTURA

### Flujo de deploy

```
Developer hace push a 'main'
        ↓
GitHub Actions ci.yml se activa
        ↓
1. Checkout del código
2. Setup Node.js 22
3. npm install --no-frozen-lockfile
4. next build (con env vars inyectadas)
5. amondnet/vercel-action@v25 despliega a Vercel
        ↓
Vercel URL de producción actualizada
```

**Archivo:** `.github/workflows/ci.yml`

### Variables de entorno en producción

| Variable | Dónde se configura | Nivel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Hardcodeado en ci.yml | Público |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Hardcodeado en ci.yml | Público |
| `SUPABASE_SERVICE_ROLE_KEY` | GitHub Secrets | **Secreto** |
| `UPSTASH_REDIS_REST_URL` | Vercel Dashboard | Opcional |
| `UPSTASH_REDIS_REST_TOKEN` | Vercel Dashboard | Opcional |
| `IP_SALT` | Vercel Dashboard | Recomendado |
| `VERCEL_TOKEN` | GitHub Secrets | Secreto |
| `VERCEL_ORG_ID` | GitHub Secrets | Secreto |
| `VERCEL_PROJECT_ID` | GitHub Secrets | Secreto |

### ⚠️ Observación de seguridad
El `NEXT_PUBLIC_SUPABASE_ANON_KEY` es una clave pública por diseño (el prefijo `NEXT_PUBLIC_` indica que va al cliente). Sin embargo, está hardcodeado en el archivo `ci.yml` visible en el repositorio. Esto es técnicamente aceptable para la clave pública, pero se recomienda moverlo a variables de entorno de GitHub Actions por consistencia.

### Ambientes
- **Producción:** Vercel, rama `main`
- **Desarrollo local:** `npm run dev`, localhost:3000, usa `.env.local`
- **No existe ambiente de staging documentado**

---

## 10. ESTADO DE TESTING Y MONITOREO

### Tests existentes

| Archivo | Tests | Cobertura |
|---|---|---|
| `domain/quimica.test.ts` | 55 | validarQ1..Q10 — casos normales y límite |
| `domain/fisica.test.ts` | 29 | validarF1..F10 — casos normales y límite |
| `domain/biologia.test.ts` | 31 | validarB1..B10 — casos normales y límite |
| `domain/matematicas.test.ts` | 48 | validarM1..M10 — casos normales y límite |
| `validators.test.ts` | ~13 | validatePracticaId, validateScore |
| `labObjetivos.test.ts` | ~8 | getLabObjetivos |
| `smoke.test.ts` | ~15 | MASTER_DATA, store, API, middleware |
| **Total** | **199** | **100% pasando** |

### Qué NO tiene tests (honestidad explícita)

- ❌ Componentes React (Piloto*, Bitácora*, dashboard) — sin tests de UI
- ❌ API route `/api/resultados` — sin tests de integración (auth, rate limit, errores 400/401/429/500)
- ❌ Slices de Zustand — sin tests de store
- ❌ Server Action `onboardInstitutionalUsers` — sin tests
- ❌ Middleware de auth — no se puede testear con Jest sin Next.js test runner
- ❌ Flujos end-to-end (Playwright/Cypress) — no implementados

### Monitoreo

- **No hay monitoreo de errores en producción** (sin Sentry, Datadog, o similar)
- **No hay analytics** de uso (sin PostHog, Mixpanel, o similar)
- **Logs:** Solo `console.error` con requestId en `/api/resultados`. Visibles en Vercel Dashboard → Functions → Logs
- **Uptime:** Delegado a Vercel (99.9% SLA en plan Pro)

---

## 11. CAPACIDADES REALES DEL PRODUCTO

### Lo que SÍ hace bien

- **40 simuladores interactivos funcionales** con lógica científica real (no solo visual)
- **Validación automática de resultados** con tolerancias calibradas por dominio
- **Dashboard del profesor completo:** auditoría, directorio de alumnos, radar de competencias, planeamiento, exportación PDF
- **Onboarding masivo de usuarios** institucional con generación de credenciales
- **Persistencia de progreso** — el alumno puede retomar donde dejó
- **Diseño premium consistente** en los 40 simuladores
- **Sistema de audio** — síntesis procedural sin archivos externos
- **Seguridad básica** — JWT server-side, rate limiting, headers de seguridad, CSP
- **TypeScript strict** — 0 errores de compilación
- **199 tests automáticos** pasando

### Lo que hace con limitaciones

- **Precisión científica:** Los simuladores son aproximaciones educativas, no simulaciones de ingeniería. La física es correcta en orden de magnitud pero no considera efectos de segundo orden (viscosidad del aire en tiro parabólico, resistencia de cables en circuitos, etc.). Adecuado para educación, no para investigación.
- **3D:** Importado (Three.js/R3F) pero uso limitado. La mayoría de simuladores son 2D con CSS/Canvas.
- **Offline:** Funciona sin conexión para simulación (localStorage), pero requiere internet para login y guardar resultados en Supabase.
- **Móvil:** La app es responsive pero está optimizada para pantalla ancha. Los simuladores son usables en tablet, con experiencia degradada en teléfono.

### Lo que NO hace todavía

- ❌ Billing / pagos / suscripciones — no hay modelo de monetización implementado
- ❌ Onboarding self-service — un admin debe crear las cuentas manualmente
- ❌ Multi-tenant — todos los datos están en una sola base de Supabase, sin aislamiento por institución
- ❌ Notificaciones — no hay emails transaccionales ni notificaciones push
- ❌ Recuperación de contraseña — no se encontró flujo implementado
- ❌ Analytics de aprendizaje — no hay métricas de tiempo en tarea, trayectoria de errores, etc.
- ❌ Certificados o badges exportables por alumno
- ❌ App nativa iOS/Android — solo web

---

## 12. DEUDA TÉCNICA DOCUMENTADA

### Bugs conocidos
Ninguno documentado en el código como bug crítico al momento de este informe.

### Mejoras pendientes identificadas en el código

| Ítem | Archivo | Severidad |
|---|---|---|
| `any[]` sin tipar en `types.ts` (reacciones, sustancias, bugs, poblacionF1) | `src/store/types.ts` | Media |
| `alumnos_grupos` y `grupos` tables referenciadas en componentes pero no documentadas | `src/components/AlumnosContent.tsx` | Media |
| Schema de Supabase no está en el repositorio como migraciones SQL | — | Alta |
| No hay ambiente de staging | CI/CD | Media |
| No hay monitoreo de errores en producción | — | Alta |
| Rate limiting in-memory no es compartido entre instancias Vercel | `src/lib/rateLimiter.ts` | Baja (si se configura Upstash) |
| Email domain hardcodeado como `cenlaboratorios.com` | `src/app/actions/adminActions.ts` | Media |
| Trigger de Supabase para auto-crear perfil no está en el repo | — | Media |
| RLS policies no están en el repo como código | — | Alta |

### Decisiones diferidas documentadas

- **Tipado completo de estructuras de datos complejas** — Las listas de reacciones químicas, sustancias y bugs usan `any[]`. Se marcó como pendiente porque requiere crear interfaces propias (30-40 tipos nuevos).
- **Tests de integración para la API** — El endpoint `/api/resultados` no tiene tests automáticos.
- **Vista de progreso agregado del profesor** — Toggle cards/grid iniciado, sin completar.
- **i18n** — Todo en español hardcodeado. Sin librería de internacionalización.

---

## 13. SEGURIDAD Y PRIVACIDAD

### Datos personales recolectados

| Dato | Dónde se almacena | Propósito |
|---|---|---|
| Nombre completo | Supabase `profiles.full_name` | Identificación en dashboard |
| Email | Supabase `auth.users` + `profiles.email` | Login y comunicación |
| Rol educativo | Supabase `profiles.role` | Control de acceso |
| Historial de prácticas | Supabase `intentos` | Seguimiento académico |
| Eventos de interacción | Supabase `bitacora_entries` | Análisis de aprendizaje |
| IP hasheada (SHA-256 + salt) | Supabase `intentos` (campo ip_hash) | Auditoría anti-fraude |
| Progreso en localStorage | Navegador del alumno | Persistencia offline |

### Riesgos identificados

**Riesgo 1 — Schema y RLS no versionados:**  
Las políticas de Row Level Security se configuraron en el dashboard de Supabase pero no están en el repositorio como código SQL. Si se pierde acceso al dashboard o se necesita recrear la base de datos, las políticas se pierden.  
*Mitigación recomendada:* Exportar y commitear `supabase/migrations/` con Supabase CLI.

**Riesgo 2 — Menores de edad:**  
La plataforma está orientada a estudiantes que pueden ser menores de edad. No hay implementación de COPPA (EE.UU.) ni cumplimiento documentado de la Ley Federal de Protección de Datos Personales en México (LFPDPPP) para datos de menores.  
*Acción requerida:* Consultar con abogado especializado en privacidad educativa antes de despliegue masivo.

**Riesgo 3 — Consentimiento de datos:**  
No hay flujo de aceptación de términos de servicio o política de privacidad en el registro/login.

**Riesgo 4 — Sin cifrado de datos en reposo más allá de Supabase:**  
Los datos están cifrados por Supabase/PostgreSQL en reposo. No hay cifrado adicional a nivel de aplicación.

### Aspectos legales pendientes

- Política de privacidad pública (para cumplir con LFPDPPP México)
- Términos de servicio
- Aviso de privacidad para menores / consentimiento parental
- Contrato de datos con Supabase (Data Processing Agreement) para compliance institucional

---

## 14. LIMITACIONES DE ESCALABILIDAD

### Capacidad actual estimada

| Escenario | Viabilidad |
|---|---|
| 100 usuarios concurrentes | Sin problemas |
| 500 usuarios concurrentes | Funciona, monitorear Supabase |
| 1,000 usuarios concurrentes | Requiere plan Pro de Supabase |
| 10,000 usuarios concurrentes | Requiere optimización y escala horizontal |

### Cuellos de botella identificados

**1. Supabase Free Tier**
- Límite: 500MB almacenamiento, 2GB transferencia/mes, 50,000 usuarios activos
- Cada `intentos` con `bitacora_data` (JSONB) puede ser grande. 1,000 alumnos × 40 prácticas × ~5KB promedio = ~200MB solo en bitácoras.

**2. Rate limiting in-memory sin Upstash**
- Sin Upstash Redis, cada instancia de Vercel tiene su propio contador. Con 10 instancias concurrentes, el límite efectivo se multiplica por 10.
- *Mitigación:* Configurar Upstash Redis (variable de entorno).

**3. localStorage como estado del simulador**
- El estado de Zustand persiste en localStorage del navegador. Cada alumno tiene su propio estado. No hay sincronización cross-dispositivo.
- Un alumno que cambia de computadora pierde su progreso (a menos que haya guardado en Supabase).

**4. Sin CDN para assets estáticos educativos**
- Si se añaden videos o assets 3D grandes, Vercel tiene límite de 100MB por deployment.

### Costo de escalar

| Usuarios | Costo mensual estimado |
|---|---|
| 0-500 | $0 (tiers gratuitos) |
| 500-2,000 | ~$45/mes (Supabase Pro + Vercel Hobby) |
| 2,000-10,000 | ~$200/mes (Supabase Pro + Vercel Pro + Upstash) |
| 10,000-100,000 | ~$1,500/mes+ (requiere arquitectura multi-tenant activa) |

---

## 15. HISTORIA DE CONSTRUCCIÓN

### Cronología

| Período | Hito | Herramientas |
|---|---|---|
| Fase inicial | Diseño y construcción de los 40 simuladores base | Google Gemini |
| Fase de estabilización | Diamond State v5.2 — refactoring visual y pedagógico | Google Gemini |
| 2026-05-09 | Domain extraction, 163 tests de dominio, rate limiting dual, Zustand persist optimizado | Claude (Anthropic) |
| 2026-05-10 | Páginas de error, KaTeX a11y, type safety, commit + push | Claude (Anthropic) |

### Asistentes IA usados

**Google Gemini** — Construcción primaria. Diseñó la arquitectura Diamond State, construyó los 40 simuladores, el dashboard del profesor, el sistema de auth, el deploy a Vercel. La mayoría del código base viene de sesiones con Gemini.

**Claude (Anthropic)** — Refinamiento y robustez. Responsable de: extracción de capa de dominio (funciones puras testeables), 199 tests automáticos, rate limiting con fallback Upstash/InMemory, deepMergeState para Zustand persist, páginas de error Diamond State, accesibilidad KaTeX, documentación técnica (este informe).

### Iteraciones mayores

1. **Diamond State Standard** — El estándar visual y pedagógico que unifica todos los simuladores. Flujo: Misión → Briefing → Práctica → Validación. Personajes Dr. Quantum y Dra. Helix.
2. **Extracción de dominio** — Los validadores científicos se separaron del store de Zustand en funciones puras testeables. Esto fue un refactor arquitectural significativo que no cambió el comportamiento visible.
3. **Zustand persist optimizado** — La serialización del estado a localStorage se rediseñó para excluir constantes grandes y usar deep merge en la hidratación.

### Aciertos en retrospectiva

- El patrón "domain extraction" resultó en código más testeable sin cambiar la funcionalidad
- Usar Supabase + Vercel eliminó la necesidad de infraestructura propia
- La síntesis de audio con Web Audio API (sin archivos externos) fue una decisión inteligente — cero assets de audio que gestionar
- El estándar Diamond State da coherencia visual a 40 simuladores construidos incrementalmente

### Errores en retrospectiva

- El schema de Supabase no se versionó con migraciones desde el inicio — ahora es deuda
- Los `any[]` en types.ts se acumularon sin crear interfaces propias
- No hay ambiente de staging — todo se prueba en local antes de ir a producción directamente
- La ausencia de analytics desde el inicio significa que no hay datos históricos de uso

---

## 16. DOCUMENTACIÓN EXISTENTE

| Archivo | Contenido | Utilidad |
|---|---|---|
| `README.md` | Overview del proyecto, diagrama de arquitectura | Alta |
| `CLAUDE.md` | Configuración para Claude Code CLI | Solo para Claude |
| `AGENTS.md` | Advertencia sobre Next.js breaking changes | Alta para devs |
| `AUDIT_REPORT.md` | Reporte de auditoría de seguridad previo | Alta |
| `ENTREGA_CREDENTIALS.md` | Guía de gestión de credenciales | Alta |
| `ESTANDAR_VISUAL_LABS.md` | Estándares de diseño UI | Alta para diseñadores |
| `GDD_BIOLOGIA.md` | Game Design Document — Biología | Alta para educadores |
| `GDD_FISICA.md` | Game Design Document — Física | Alta para educadores |
| `GDD_MATEMATICAS.md` | Game Design Document — Matemáticas | Alta para educadores |
| `GDD_PRACTICAS.md` | GDD maestro de prácticas y simuladores | Alta |
| `NAVEGACION.md` | Flujos de navegación y routing | Media |
| `PROYECTO_LABS_REPORTE_TECNICO.md` | Reporte técnico anterior | Media |
| `STABLE_VERSION_REGISTRY.md` | Historial de versiones estables | Media |
| `WHITELABEL_UI_GUIDELINES.md` | Guías para white-label | Alta (si se whitelabelea) |
| `notebooklm_prompts.md` | Prompts para NotebookLM | Baja |
| `video_production_registry.md` | Registro de assets de video | Media |
| `docs/INFORME-MAESTRO-LABORATORIOS.md` | Este documento | Alta |

---

## 17. ASPECTOS ÚNICOS DE PLATAFORMA DE LABORATORIOS

### Simulación física/química/biológica

**¿Qué motores se usan?**
No se usa un motor de física externo (sin Box2D, Cannon.js, Rapier). Toda la física es implementación propia en JavaScript puro:
- Ecuaciones diferenciales simples (Euler) para péndulo, resorte, oscilaciones
- Integración numérica para Lotka-Volterra (ecosistema)
- Tablas de datos reales para constantes: potenciales de reducción, coeficientes de dilatación, factores de solubilidad, pesos moleculares

**¿Qué precisión tienen?**
Precisión educativa, no de ingeniería:
- Los cálculos son correctos en el dominio de validación (las respuestas que el sistema acepta están verificadas)
- No se modelan efectos de segundo orden: resistencia del aire, fluctuaciones cuánticas, termodinámica completa
- El tiro parabólico ignora la resistencia del aire en el cálculo de validación (aunque tiene parámetros de densidad de aire en la interfaz)
- La titulación usa curvas pH simplificadas para ácidos/bases fuertes

**Qué pueden simular vs qué es solo visual**
| Simulador | Parte calculada correctamente | Parte visual/aproximada |
|---|---|---|
| Tiro parabólico | Ecuaciones cinemáticas completas | Animación de trayectoria |
| Péndulo | Período T = 2π√(L/g) correcto | Amortiguación simplificada |
| Titulación | pH = -log[H⁺] correcto | Curva de titulación simplificada |
| Celda galvánica | Potencial de Nernst para metales estándar | Solo metales con datos tabulados |
| Ecosistema | Lotka-Volterra numérico real | Discretización de tiempo simple |

### Interactividad

**Controles disponibles por tipo:**
- **Sliders** — temperatura, voltaje, ángulo, resistencia, masas
- **Botones +/-** — coeficientes de balanceo, partículas subatómicas
- **Inputs numéricos** — respuestas calculadas por el alumno
- **Drag & drop** — partículas atómicas, reactivos, metales en celdas
- **Selección de opciones** — materiales, gases, enzimas, ambientes
- **Simulación temporal** — tick automático con dt configurable (fotosíntesis, ecosistema, transporte celular)

**Sin uso de mouse para dibujo libre** — No hay herramienta de dibujo o anotación.

### Visualización

| Tecnología | Uso en la plataforma |
|---|---|
| SVG (React) | Diagramas estáticos, figuras geométricas |
| Canvas 2D | Tiro parabólico, microscopía, animaciones de partículas |
| CSS + Framer Motion | Animaciones de UI, transiciones, efectos de laboratorio |
| Recharts | ECG, gráficas logarítmicas, histogramas, curvas pH |
| Three.js + R3F | Importado como dependencia, uso actual limitado |

**Performance:** Las animaciones corren a 60 FPS en hardware de escritorio normal. En dispositivos de gama baja puede haber degradación en simuladores con Canvas intensivo.

**Dispositivos soportados:**
- ✅ Desktop (Chrome, Firefox, Edge, Safari) — experiencia completa
- ✅ Tablet (iPad, Android) — funcional con limitaciones de pantalla
- ⚠️ Móvil — usable pero diseño no optimizado para pantalla pequeña
- ❌ Sin modo offline completo (requiere conexión para login)

### Pedagogía científica

**Relación con currículo mexicano:**
El contenido está alineado con el Nuevo Marco Curricular de la Educación Media Superior (MCCEMS) y temas frecuentes en el IPN, UNAM y preparatorias nacionales. Los GDD de cada materia documentan la relación con objetivos de aprendizaje específicos.

**Niveles cognitivos (Taxonomía de Bloom):**
- **Recordar/Comprender** — Briefings con Dr. Quantum, conceptos teóricos en bitácoras
- **Aplicar** — Manipulación de variables en simuladores
- **Analizar** — Registro de hallazgos, comparación de experimentos
- **Evaluar** — Validación con criterios calibrados, sistema de estrellas (1-3)

**Flujo pedagógico obligatorio:**
El flujo Misión → Briefing → Práctica → Validación no puede saltarse. Esto es una decisión pedagógica explícita del estándar Diamond State.

---

## 18. RECOMENDACIONES PARA PROFESIONALIZACIÓN

### Alta prioridad

| Ítem | Descripción | Esfuerzo estimado | Costo estimado |
|---|---|---|---|
| **Versionar schema de Supabase** | Exportar y commitear todas las migraciones SQL con Supabase CLI. Sin esto el schema se puede perder. | 1-2 días | $0 (trabajo manual) |
| **Monitoreo de errores** | Integrar Sentry o similar para capturar errores de producción con stack trace | 1 día | $0-$26/mes (Sentry free tier) |
| **Tests de integración API** | Tests para `/api/resultados` cubriendo auth, rate limit, errores 400/401/429/500 | 2-3 días | $0 |
| **Política de privacidad** | Redactar política de privacidad cumpliendo LFPDPPP y publicarla en la plataforma | 1 semana (abogado) | $500-2,000 |
| **Recuperación de contraseña** | Implementar flujo "olvidé mi contraseña" con Supabase | 1 día | $0 |

### Media prioridad

| Ítem | Descripción | Esfuerzo estimado | Costo estimado |
|---|---|---|---|
| **Onboarding self-service** | Que una institución pueda registrarse sin intervención manual | 1 semana | $0 (dev time) |
| **Billing con Stripe** | Integración de pagos para modelo de suscripción | 2 semanas | $0 + comisión Stripe 2.9% |
| **Multi-tenant** | Aislamiento de datos por institución (schema por tenant o tenant_id column) | 2-3 semanas | $0 (dev time) + más Supabase |
| **Analytics de aprendizaje** | PostHog o similar para métricas de uso, tiempo en tarea, abandono | 2-3 días | $0-$20/mes |
| **Staging environment** | Ambiente de pruebas antes de producción | 1 día | $0-$20/mes |
| **Interfaces TypeScript** | Reemplazar `any[]` en types.ts con interfaces propias | 3-5 días | $0 |

### Baja prioridad

| Ítem | Descripción | Esfuerzo estimado |
|---|---|---|
| **App móvil (PWA)** | Configurar manifest, service worker, instalable desde navegador | 2-3 días |
| **App nativa (Capacitor)** | Envolver la web en app nativa para App Store / Play Store | 1-2 semanas |
| **i18n** | Soporte multiidioma con next-intl | 1 semana |
| **Tests E2E** | Playwright para flujos críticos (login, simulador completo) | 1 semana |
| **CDN para assets** | Cloudflare o similar para assets estáticos | 1 día |

---

## 19. PREGUNTAS ABIERTAS

### Decisiones de producto pendientes

1. **¿Modelo de negocio?** — ¿Por alumno, por institución, freemium, licencia anual? Determina qué construir en billing y multi-tenant.

2. **¿El contenido es fijo o configurable?** — ¿Las instituciones pueden añadir sus propios simuladores? ¿O el catálogo de 40 es fijo?

3. **¿Qué pasa con los datos cuando una institución cancela?** — ¿Se borran, se exportan, se archivan?

4. **¿Certificación/validación del contenido?** — ¿Hay alguna institución educativa que avale el rigor científico del contenido?

5. **¿Soporte en español mexicano vs otros países hispanohablantes?** — El currículo está alineado con México. ¿Es el mercado solo México?

### Decisiones técnicas pendientes

6. **¿Supabase como base de datos a largo plazo?** — Supabase es excelente para MVP. Para 100k+ usuarios puede ser necesario migrar a infraestructura propia con PostgreSQL.

7. **¿Sincronización cross-dispositivo del progreso del alumno?** — Actualmente el progreso está en localStorage. Un alumno que usa dos computadoras pierde el progreso del otro dispositivo.

8. **¿Cómo se manejarán las actualizaciones del store?** — Al actualizar el schema del store de Zustand, los alumnos con datos en localStorage de la versión anterior pueden tener problemas. El storage key `cen-sim-v10` se bumpeó manualmente — necesita un proceso formal.

9. **¿Qué sucede con los datos de Supabase en el proyecto actual si se construye una versión nueva?** — ¿Se migran los datos? ¿Se crea un proyecto de Supabase separado?

### Preguntas legales/de negocio

10. **¿Quién es el dueño de los datos de los alumnos?** — ¿La plataforma, la institución, o el alumno?

11. **¿Hay registro de propiedad intelectual del software?** — Los 40 simuladores representan trabajo significativo. ¿Están protegidos formalmente?

12. **¿Existe contrato con el cliente actual que limite el uso del código en nuevos proyectos?** — Verificar con abogado antes de usar el código de CEN Labs en la versión propia.

---

*Fin del informe — generado el 2026-05-10*  
*Auditado por Claude Sonnet 4.6 (Anthropic)*  
*Verificable en commit `4439c92` del repositorio*
