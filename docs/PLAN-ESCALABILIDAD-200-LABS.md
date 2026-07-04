# Plan de Escalabilidad — De 50 a 250 Labs

> **Estado:** DISEÑO / PLANIFICACIÓN. No ejecutado.
> **Objetivo:** Preparar la arquitectura de datos para agregar ~200 labs nuevos sin que el costo por lab crezca ni el riesgo de error se dispare.
> **Fecha:** 2026-07-04

---

## 1. TL;DR

Hoy, **agregar un solo lab exige editar 7 lugares distintos en sincronía perfecta**, repartidos en archivos monolíticos que ya suman >6,000 líneas y crecerían a >80,000 con 250 labs. El sistema *funciona*, pero el modelo de crecimiento es lineal-manual: cada lab nuevo aumenta la probabilidad de desincronización.

La solución **no es reescribir**, sino **invertir el modelo de almacenamiento**: pasar de "un archivo gigante por tipo de dato" a "una carpeta autocontenida por lab", con los archivos monolíticos actuales convertidos en *facades* auto-derivados. Esto se hace con el patrón **strangler fig** (estrangulamiento incremental): en cada fase el sistema queda 100% funcional y desplegable, y **la interfaz pública nunca se rompe**, por lo que los 5 archivos consumidores no se tocan durante la migración.

**Resultado final:** agregar un lab = crear 1 carpeta con 1 comando + llenar plantillas, validado por tests. Escalar a 250 labs se vuelve lineal y seguro.

---

## 2. Estado actual (evidencia)

Los **5 stores de datos usan la misma llave `id`** (`quimica-1`, `fisica-3`, `mecanica-2`…). Ese `id` es el primitivo unificador que hace viable la co-localización.

### Los 7 puntos de edición por lab nuevo

| # | Archivo | Estructura | Líneas hoy | Proyección 250 labs |
|---|---------|-----------|-----------:|--------------------:|
| 1 | `src/data/briefingConfigs.ts` | `ALL_BRIEFING_CONFIGS: Record<string, BriefingConfig>` | 1,433 | ~50,000 🔴 |
| 2 | `src/data/quizQuestions.ts` | `ALL_QUIZZES: Record<string, Question[]>` + `getQuizForPractice()` | 3,503 | ~21,000 🔴 |
| 3 | `src/data/simuladoresData.ts` | `MASTER_DATA: Record<string, SimuladorContenido>` | 840 | ~4,000 🟡 |
| 4 | `src/data/tutorSteps.ts` | `ALL_TUTOR_STEPS: Record<string, TutorStep[]>` | 873 | ~5,000 🟡 |
| 5 | `src/data/labObjetivos.ts` | `getLabObjetivos(id, state)` switch-case + `ObjetivosState` | 91 | ~600 🟡 |
| 6 | `src/components/simulador/LabRegistry.tsx` | `PILOTO_REGISTRY` + `BITACORA_REGISTRY` (`dynamic()`) | 107 | ~600 🟡 |
| 7 | Página de catálogo de la categoría | Lista de labs (por confirmar cómo se arma) | — | — |

Además, dos **interfaces se acoplan al crecer**: `SimuladorContenido` (campos opcionales) y sobre todo `ObjetivosState`, que hoy declara un campo por lab (`gases`, `balanceo`, `tiroParabolico`, `hooke`…). Ese acoplamiento es un *wart* secundario que este plan mitiga parcialmente.

### Consumidores (buena noticia: solo 5)

```
SimuladorClient.tsx      → MASTER_DATA, ALL_BRIEFING_CONFIGS, ALL_TUTOR_STEPS,
                            getQuizForPractice, PILOTO_REGISTRY, BITACORA_REGISTRY, getLabObjetivos
MecanicaShellClient.tsx  → ALL_BRIEFING_CONFIGS
MecanicaLabClient.tsx    → ALL_BRIEFING_CONFIGS
[id]/page.tsx            → ALL_BRIEFING_CONFIGS
__tests__/*              → MASTER_DATA, getLabObjetivos
```

Que los consumidores accedan **casi siempre por `id`** (`ALL_BRIEFING_CONFIGS[id]`) es lo que permite mantener la interfaz pública intacta con facades.

### Restricción descubierta: los nombres de componente NO siguen convención limpia

```
quimica-10  → PilotoDestilacionFraccionada  /  BitacoraDestilacion      (≠ nombre)
biologia-1  → PilotoMicroscopioVirtual       /  BitacoraMicroscopio      (≠ nombre)
```

⇒ **Auto-discovery por glob de nombres de archivo es frágil.** La solución (§4) evita el problema: cada carpeta de lab **declara explícitamente** sus propios `import()`, y el registro se auto-ensambla por *codegen* sobre carpetas, no por adivinar nombres.

---

## 3. Causa raíz

No es el tamaño de los archivos en sí. Es que **el conocimiento de un lab está fragmentado horizontalmente**: los datos de `quimica-1` viven en 7 archivos, mezclados con los de otros 49 labs. Consecuencias:

- **Sincronización manual frágil:** olvidar uno de los 7 puntos = lab roto en runtime, sin error de compilación.
- **Cero cohesión:** para entender/editar un lab hay que saltar entre 7 archivos gigantes.
- **No paralelizable:** dos personas (o dos agentes) agregando labs distintos chocan en los mismos archivos (conflictos de merge).
- **Sin barrera de calidad:** nada valida que un `id` tenga sus 7 piezas completas y coherentes.

---

## 4. Arquitectura objetivo

### Principio: co-localización por lab + facades auto-derivados + codegen

```
src/labs/
  _types.ts                 ← contrato LabModule (compartido)
  _registry.ts              ← API nueva: export { LABS }  (re-exporta el generado)
  _registry.generated.ts    ← AUTO-GENERADO por codegen (no editar a mano)
  quimica-1/
    index.ts                ← default export: LabModule  (ensambla todo el lab)
    contenido.ts            ← lo que era MASTER_DATA['quimica-1']
    briefing.ts             ← lo que era ALL_BRIEFING_CONFIGS['quimica-1']
    tutorSteps.ts           ← lo que era ALL_TUTOR_STEPS['quimica-1']
    quiz.ts                 ← lo que era ALL_QUIZZES['quimica-1']
    objetivos.ts            ← el case 'quimica-1' de getLabObjetivos (opcional)
    components.ts           ← los dynamic() de Piloto + Bitacora (paths explícitos)
  quimica-2/
    ...
```

**Un lab = una carpeta autocontenida.** Todo lo que define `quimica-1` está en `src/labs/quimica-1/`. Los componentes pesados (`PilotoX`, `BitacoraX`) **siguen viviendo donde están** en `src/components/`; la carpeta del lab solo declara su `dynamic(() => import(...))`, así que **no se renombra ni mueve ningún componente** y el code-splitting se conserva.

### Contrato `LabModule` (concreto, basado en las interfaces reales)

```ts
// src/labs/_types.ts
import type { BriefingConfig }      from '@/components/MissionBriefing';
import type { SimuladorContenido }  from '@/data/simuladoresData'; // (o mover el tipo aquí)
import type { TutorStep }           from '@/components/DrQuantumTutor';
import type { Question }            from '@/components/LabQuiz';
import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';
import type { ComponentType }       from 'react';

export type Categoria = 'quimica' | 'fisica' | 'matematicas' | 'biologia' | 'mecanica';

export interface LabModule {
  id: string;                 // 'quimica-1'
  categoria: Categoria;
  orden: number;              // 1..N dentro de la categoría (para catálogos)
  contenido: SimuladorContenido;
  briefing: BriefingConfig;
  tutorSteps: TutorStep[];
  quiz: Question[];
  objetivos?: (state: ObjetivosState) => Objetivo[];   // opcional (solo ~14 labs hoy)
  Piloto: ComponentType<any>;      // resultado de dynamic()
  Bitacora: ComponentType<any>;    // resultado de dynamic()
}
```

```ts
// src/labs/quimica-1/index.ts
import type { LabModule } from '../_types';
import { contenido }  from './contenido';
import { briefing }   from './briefing';
import { tutorSteps } from './tutorSteps';
import { quiz }       from './quiz';
import { objetivos }  from './objetivos';
import { Piloto, Bitacora } from './components';

const lab: LabModule = {
  id: 'quimica-1', categoria: 'quimica', orden: 1,
  contenido, briefing, tutorSteps, quiz, objetivos, Piloto, Bitacora,
};
export default lab;
```

```ts
// src/labs/quimica-1/components.ts
import dynamic from 'next/dynamic';
import { Loader } from '@/components/simulador/LabLoader';
export const Piloto   = dynamic(() => import('@/components/PilotoConstruccionAtomica'), { loading: Loader });
export const Bitacora = dynamic(() => import('@/components/bitacoras/BitacoraConstruccionAtomica'), { loading: Loader });
```

### Codegen (por qué, no `require.context`)

El registro se ensambla con un **script Node plano** que escanea `src/labs/*/index.ts` y escribe `_registry.generated.ts` con imports estáticos explícitos:

```ts
// src/labs/_registry.generated.ts   (AUTO-GENERADO — no editar)
import quimica1 from './quimica-1';
import quimica2 from './quimica-2';
// ...
import type { LabModule } from './_types';
export const LABS: Record<string, LabModule> = {
  'quimica-1': quimica1,
  'quimica-2': quimica2,
  // ...
};
```

**Por qué codegen y no `import.meta.glob` (Vite) ni `require.context` (webpack):**
- Estamos sobre un **fork custom de Next.js** → evitar magia del bundler es más seguro y predecible.
- El output es **estático, greppeable y depurable** (se ve exactamente qué se importó).
- Corre solo, sin intervención humana: se cablea en `predev` y `prebuild` (+ un `--watch` opcional en dev). El humano nunca edita el registro → **cero sincronización manual**, que es justo el objetivo.

### Facades: la interfaz pública NO cambia

Los 6 archivos actuales se reescriben como **derivaciones delgadas** del registro. Ejemplo:

```ts
// src/data/briefingConfigs.ts  (facade — mismo import path de siempre)
import { LABS } from '@/labs/_registry';
import type { BriefingConfig } from '@/components/MissionBriefing';
export const ALL_BRIEFING_CONFIGS: Record<string, BriefingConfig> =
  Object.fromEntries(Object.entries(LABS).map(([id, m]) => [id, m.briefing]));
```

```ts
// src/data/quizQuestions.ts  (facade — CONSERVA fallback genérico + shuffle + slice(0,7))
import { LABS } from '@/labs/_registry';
import type { Question } from '@/components/LabQuiz';
const QUIZ_GENERICO: Question[] = [ /* …las 7 preguntas genéricas actuales… */ ];
export const getQuizForPractice = (id: string): Question[] => {
  const all = LABS[id]?.quiz ?? QUIZ_GENERICO;
  const shuffled = [...all];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 7);
};
```

`LabRegistry.tsx`, `simuladoresData.ts`, `tutorSteps.ts`, `labObjetivos.ts` reciben el mismo tratamiento. **Los 5 consumidores no cambian una sola línea.**

---

## 5. Estrategia de migración (Strangler Fig — 5 fases)

**Invariante en TODAS las fases:** `tsc --noEmit` limpio + tests verdes + interfaz pública idéntica ⇒ cada fase es desplegable y se puede pausar sin dejar el sistema a medias.

### Fase 0 — Andamiaje (0.5 día · sin cambio de comportamiento)
- Crear `src/labs/_types.ts` (`LabModule`, `Categoria`).
- Crear `scripts/gen-lab-registry.mjs` (escanea carpetas → escribe `_registry.generated.ts`).
- Cablear `predev` y `prebuild` en `package.json` para correr el codegen; opción `--watch`.
- Crear `src/labs/_registry.ts` (re-export del generado). Con 0 carpetas ⇒ `LABS = {}`.
- **Nada de consumidores tocado. Sin efecto en runtime.** ✅ Deploy.

### Fase 1 — Facades con merge (0.5 día · sin cambio de comportamiento)
- Reescribir los 6 archivos de datos para que su export **combine** lo legacy inline con lo del registro:
  ```ts
  export const ALL_BRIEFING_CONFIGS = { ...LEGACY_INLINE, ...fromRegistry(LABS, 'briefing') };
  ```
  El registro **sobrescribe** al legacy. Al inicio el registro está vacío ⇒ comportamiento idéntico.
- Esto habilita convivencia: un lab puede vivir **en el monolito viejo O en su carpeta nueva**; el merge cubre ambos durante la transición.
- ✅ Deploy.

### Fase 2 — Red de seguridad "golden" (0.5 día · antes de mover nada)
- Test que **serializa** el estado actual de `ALL_BRIEFING_CONFIGS`, `MASTER_DATA`, `ALL_TUTOR_STEPS`, `ALL_QUIZZES` y las salidas de `getLabObjetivos` para todos los ids, como snapshot congelado (golden master).
- Tras cada lote de migración, el test re-deriva y hace **deep-equal contra el golden**. Prueba matemáticamente que la migración es *comportamiento-neutral*.
- (Ojo con `getQuizForPractice`: usa `Math.random()`; el golden se hace sobre `ALL_QUIZZES` crudo, no sobre la salida barajada.)

### Fase 3 — Migrar lab por lab (2–3 días · mecánico · paralelizable)
- Por lab: crear `src/labs/{id}/` **cortando** (mover, no copiar) las piezas de los 6 monolitos; borrar la entrada inline vieja; correr codegen.
- Verificación por lote: `tsc` + golden test + smoke tests.
- **Commits por lote** (p.ej. por categoría = 5 commits, o de 10 en 10).
- Como cada carpeta es independiente, **se puede paralelizar con agentes en worktrees aislados** (sin conflictos de merge, a diferencia de hoy). Reduce el tiempo de pared a <1 día.
- Orden sugerido: empezar por **mecánica (10)** — es el conjunto más nuevo y aislado — para validar el patrón, luego química/física/mates/biología.

### Fase 4 — Retiro de monolitos + tooling para escalar (1 día)
- Con los 50 labs ya en carpetas, los monolitos quedan como facade puro (legacy vacío). Simplificar a re-derivación directa; borrar el andamiaje de merge.
- **Opcional** (baja prioridad, facades son baratos de mantener): migrar los 5 consumidores de `ALL_BRIEFING_CONFIGS[id]` a `LABS[id].briefing` y eliminar facades.
- Derivar catálogos: `labsByCategoria(cat)` desde `LABS` ⇒ las páginas de categoría se auto-actualizan al agregar una carpeta (elimina el punto de edición #7).
- **Scaffolder** `scripts/new-lab.mjs {categoria}`: genera la carpeta desde plantilla con stubs `TODO`.
- **Test de validación**: cada `LABS[id]` tiene campos requeridos y un `Piloto`/`Bitacora` que importa sin romper.

---

## 6. Después del refactor: agregar 1 de los 200 labs

```bash
npm run new-lab quimica          # crea src/labs/quimica-11/ con plantillas TODO
# 1. Llenar contenido.ts, briefing.ts, tutorSteps.ts, quiz.ts (+ objetivos.ts si aplica)
# 2. Crear el componente PilotoX y apuntar components.ts a él
# 3. npm run dev  → codegen auto-registra; el test de validación exige completitud
```

De **7 puntos de edición sincronizados** → **1 carpeta + 1 comando, con red de tests**. El costo por lab deja de crecer con el total, y dos personas pueden agregar labs distintos en paralelo sin conflictos.

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Fork custom de Next.js reacciona raro a bundler-magic | Codegen es `fs` de Node puro, agnóstico al bundler. Se evita `require.context`. |
| Perder code-splitting de Pilotos (pesados, three.js) | Los `dynamic()` se conservan intactos dentro de `components.ts` por lab. |
| Deriva de comportamiento al mover datos | Golden master test (Fase 2) hace deep-equal en cada lote. |
| Migración a medias deja el sistema roto | Merge-facade (Fase 1): legacy y carpeta conviven; cada lote es correcto por sí solo. |
| `ObjetivosState` monolítico sigue acoplado | `objetivos.ts` por lab lo mitiga; el desacople total del state queda **fuera de alcance** (wart conocido, no bloqueante). |
| Nombres de componente inconsistentes | Cada carpeta declara su `import()` explícito; no dependemos de convención de nombres. |

---

## 8. Esfuerzo y secuenciación

| Fase | Contenido | Esfuerzo | ¿Desplegable al terminar? |
|------|-----------|---------:|:-------------------------:|
| 0 | Andamiaje (tipos + codegen + registry vacío) | 0.5 d | ✅ |
| 1 | Facades con merge | 0.5 d | ✅ |
| 2 | Golden master tests | 0.5 d | ✅ |
| 3 | Migrar 50 labs a carpetas | 2–3 d (<1 d con agentes) | ✅ por lote |
| 4 | Retiro de monolitos + scaffolder + validación + catálogos | 1 d | ✅ |
| **Total** | | **~5–6 d** (o ~3 d con paralelización) | |

**El sistema está funcional y correcto después de CADA fase.** No hay "big bang".

---

## 9. Decisiones abiertas (para confirmar antes de ejecutar)

1. **Ruta de carpetas:** `src/labs/{id}/` (propuesto) vs `src/data/labs/{id}/`. Propongo `src/labs/` porque mezcla datos + declaración de componentes (no es solo data).
2. **Codegen vs barrel manual auto-actualizado:** propongo codegen en `predev`/`prebuild`. ¿Hay un paso de build donde encaje mejor?
3. **¿Migrar consumidores a `LABS[id]` (Fase 4 opcional)** o dejar los facades permanentes? Los facades cuestan casi nada; se pueden dejar.
4. **Catálogos:** confirmar cómo arman hoy la lista de labs las 5 páginas de categoría (punto de edición #7) para decidir el alcance del derivado `labsByCategoria`.
5. **Alcance del desacople de `ObjetivosState`:** ¿lo dejamos como wart o se incluye un rediseño del state por lab?

---

## 10. Recomendación

Ejecutar **Fases 0–2 antes de agregar cualquier lab nuevo** (andamiaje + facades + golden tests: ~1.5 días, riesgo casi nulo, cero cambio de comportamiento). Con eso, la migración de los 50 existentes (Fase 3) puede correr en paralelo con la autoría de los primeros labs nuevos, ya sobre el modelo de carpetas. **No arrancar la producción de 200 labs sobre la arquitectura actual**: alrededor del lab ~80 los monolitos y la sincronización manual empezarían a producir labs rotos en runtime.
