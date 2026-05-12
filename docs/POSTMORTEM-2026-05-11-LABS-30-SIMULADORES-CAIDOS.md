# Postmortem: 30/40 Simuladores Caídos en Producción

**Fecha del incidente:** 2026-05-11  
**Duración:** ~30 minutos (detectado durante demo institucional en vivo)  
**Severidad:** Alta — 75% de los simuladores inaccesibles para usuarios reales  
**Estado:** Resuelto (commit `1b6bec6`)

---

## Resumen ejecutivo

El 11 de mayo de 2026, durante una demostración de CEN Labs ante autoridades institucionales, 30 de los 40 simuladores de la plataforma devolvieron error 404. Solo los simuladores del módulo de Química (parcialmente) respondían. El incidente duró aproximadamente 30 minutos hasta que se identificó la causa raíz y se aplicó el fix.

---

## Cronología

| Hora (aprox.) | Evento |
|---|---|
| 10:00 | Demo institucional inicia. Módulo de Química funciona. |
| 10:10 | Intento de acceso a simuladores de Física, Biología, Matemáticas — todos devuelven 404. |
| 10:15 | Inicio de diagnóstico. Se revisa git log, estructura de datos, lógica de `page.tsx`. |
| 10:35 | Causa raíz identificada: guard `notFound()` en `page.tsx` sobre objeto parcialmente inicializado en Vercel. |
| 10:40 | Fix aplicado: guard eliminado. Commit y push a `main`. |
| 10:45 | Vercel redeploy completado. Los 40 simuladores responden 200. |

---

## Causa raíz

### El código problemático

```typescript
// src/app/alumno/simulador/[id]/page.tsx — ANTES del fix
import { MASTER_DATA } from '@/data/simuladoresData';

export default async function SimuladorPage({ params }) {
  const resolvedParams = await params;
  const normalizedId = normalizeId(resolvedParams.id);
  
  if (!MASTER_DATA[normalizedId]) notFound();  // ← CAUSA DEL INCIDENTE
  
  return <SimuladorClient simuladorId={resolvedParams.id} />;
}
```

### Por qué falló solo en Vercel

`MASTER_DATA` es un objeto TypeScript grande (~1,000 líneas de código) que usa el modificador `as const`. En el entorno de desarrollo local (Node.js persistente), el módulo se inicializa completamente en el primer acceso y queda en memoria. En Vercel (funciones serverless con cold start), la inicialización del módulo puede resolverse parcialmente dentro del presupuesto de CPU del cold start.

**Resultado:** Las primeras claves del objeto (`quimica-1`, `quimica-2`...) resolvían correctamente. Las claves de módulos posteriores (`fisica-*`, `biologia-*`, `matematicas-*`) devolvían `undefined` porque el módulo no había terminado de inicializarse cuando el guard las evaluaba.

El guard, diseñado como protección de integridad, se convirtió en el punto de fallo.

### Por qué no fue detectado antes del deploy

1. En local el bug no existía — el módulo Node.js se inicializa completamente antes de cualquier request
2. No había tests que verificaran que `MASTER_DATA[id]` existía para todos los IDs
3. No había verificación HTTP post-deploy de los 40 simuladores

---

## Impacto

- 30 de 40 simuladores inaccesibles (los del primero al décimo de cada módulo excepto quimica-1 a quimica-2)
- Demo institucional interrumpida durante ~30 minutos
- Confianza institucional en el piloto afectada momentáneamente

---

## Fix aplicado

```typescript
// src/app/alumno/simulador/[id]/page.tsx — DESPUÉS del fix
import SimuladorClient from './SimuladorClient';
import { ALL_BRIEFING_CONFIGS } from '@/data/briefingConfigs';

export const dynamic = 'force-dynamic';

export default async function SimuladorPage({ params }) {
  const resolvedParams = await params;
  return <SimuladorClient simuladorId={resolvedParams.id} />;
}
```

El guard fue eliminado completamente. `SimuladorClient` ya implementa manejo graceful de IDs inválidos — muestra un UI de error amigable ("Simulador no Identificado") en lugar de una página 404 genérica. Esta es la arquitectura correcta: **el servidor solo delega, el cliente maneja.**

---

## Acciones correctivas implementadas

### 1. Test de regresión (previene recurrencia)

Creado `src/__tests__/integration/simuladores-routing.test.ts`:

```typescript
describe('Simuladores routing — MASTER_DATA integrity', () => {
  it('has exactly 40 simulators', () => {
    expect(Object.keys(MASTER_DATA).length).toBe(40);
  });
  it.each(['quimica', 'fisica', 'biologia', 'matematicas'])(
    '%s has exactly 10 simulators', (subject) => {
      const keys = Object.keys(MASTER_DATA).filter(k => k.startsWith(subject + '-'));
      expect(keys.length).toBe(10);
    }
  );
  it.each([/* todos los 40 IDs */])('simulator "%s" exists', (id) => {
    expect(MASTER_DATA[id]).toBeDefined();
  });
});
```

Este test habría atrapado el bug si hubiera existido antes del incidente (hubiera fallado en staging).

### 2. CI pipeline con tests obligatorios

Creado `.github/workflows/ci.yml` — corre en cada push a `main` y en PRs:
- `tsc --noEmit` 
- `jest --passWithNoTests` (incluye el test de integración)
- `next build`

### 3. Workflow de verificación HTTP post-deploy

Creado `.github/workflows/preview-tests.yml` — workflow manual que hace HTTP GET a los 40 simuladores y falla si alguno devuelve !== 200.

### 4. Documentación del anti-patrón

Añadido AP-12 en `docs/manifiesto/MANIFIESTO-ARQUITECTURAL.md` con la descripción completa del patrón a evitar.

---

## Lecciones aprendidas

1. **El comportamiento de módulos grandes en serverless difiere del de Node.js persistente.** Nunca asumir que un objeto importado está completamente inicializado en cold starts.

2. **Los guards de `notFound()` en Server Components deben ser seguros respecto al entorno de ejecución.** Si dependen de datos grandes, el riesgo de falso negativo en serverless es real.

3. **Sin tests de integración que cubran todos los IDs de una feature crítica, no se puede confiar en que un deploy no rompe esa feature.**

4. **Los deploys a producción deben ir seguidos de una verificación HTTP rápida de las rutas críticas.** 40 URLs × 1 segundo = 40 segundos. Un script o un workflow de GitHub Actions es suficiente.

5. **El componente cliente ya tenía manejo de error correcto. El server guard era redundante y peligroso.** La defensa en profundidad no siempre requiere duplicar validaciones en el servidor — a veces añade puntos de fallo.

---

## Decisión arquitectural actualizada

**Regla:** En App Router de Next.js, los Server Components de rutas dinámicas NO deben hacer lookups sobre módulos de datos grandes para decidir si llamar `notFound()`. El componente cliente es el lugar correcto para manejar IDs inválidos con UI apropiada.
