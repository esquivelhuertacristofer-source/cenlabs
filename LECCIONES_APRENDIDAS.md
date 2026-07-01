# Lecciones Aprendidas — CEN Labs
> Documento post-mortem técnico. Escrito después de auditar y corregir 41 simuladores.
> Fecha: junio 2026

---

## 1. Malas Prácticas de Arquitectura

### 1.1 El store global como basurero

**Qué pasó:**
Zustand se usó correctamente en teoría (5 slices separados), pero cada slice terminó siendo un monolito de 800–2000 líneas que mezcla sin distinción: estado de UI, lógica de negocio, efectos secundarios, y llamadas a Supabase.

El `quimicaSlice.ts` tiene 819 líneas. El `fisicaSlice.ts` tiene más de 700. Ningún slice tiene una responsabilidad única — cada uno es "todo lo de ese dominio", que resulta siendo demasiado.

**Consecuencia directa:**
Cuando se necesitó agregar `registrarHallazgo` a laboratorios que lo faltaban, fue imposible hacer una búsqueda sistemática porque el store no tenía estructura predecible. Algunos labs lo tenían en el slice, otros en el componente, otros en ningún lado.

**Regla para el futuro:**
```
Store = estado mínimo necesario para renderizar.
Lógica = funciones puras fuera del store.
Efectos = hooks dedicados o servicios.
```

Un slice no debería superar 200 líneas. Si lo supera, está haciendo demasiado.

---

### 1.2 Contenido y plataforma nunca se separaron

**Qué pasó:**
Cada `Piloto*.tsx` importa directamente de `useSimuladorStore()` y sabe exactamente en qué campo del store vive su estado:

```tsx
// PilotoLeyOhm.tsx
const { ohm8, setOhm8, validarF8, registrarHallazgo } = useSimuladorStore();
```

No existe ninguna interfaz, ningún adapter, ningún contrato entre "el simulador" y "la plataforma". El lab y el store están pegados con cemento.

**Consecuencia directa:**
Es imposible sacar un solo simulador del proyecto sin llevarse también el store completo. No hay white-label posible sin 3 meses de refactoring.

**Regla para el futuro:**
Desde el día 1, define el contrato que tiene un simulador con la plataforma:

```tsx
interface SimuladorProps {
  onComplete: (data: HallazgoPayload) => void;
  onExit: () => void;
  seed?: number;
}
```

El simulador recibe props, no importa del store global. La plataforma pasa los callbacks. Así puedes mover, reusar, y testear simuladores de forma independiente.

---

### 1.3 No hubo criterio de cuándo usar estado global vs local

**Qué pasó:**
Estado efímero de UI (si una animación está corriendo, si un tooltip está visible, el valor de un input) terminó en el store global de Zustand. Cosas como `animandoLimite`, `showMenu`, `hoveredMetal` están en el store persistido, contaminando la serialización de localStorage.

Al mismo tiempo, cosas que SÍ debían ser globales (el estado de completion de cada lab) a veces vivían en estado local del componente y nunca se persistían.

**Regla para el futuro:**
```
Estado global:   lo que necesita sobrevivir a un refresh o a una navegación.
Estado local:    lo que solo importa mientras el componente está montado.
Estado de sesión: lo que importa mientras el usuario está logueado.
```

Si tienes dudas: empieza local. Sube al store solo cuando lo necesitas en otro lugar.

---

### 1.4 El backend sin abstracción

**Qué pasó:**
Las llamadas a Supabase están escritas directamente en `SimuladorClient.tsx`:

```tsx
await supabase.from('intentos').upsert({ alumno_id, lab_id, data });
```

No hay un servicio, no hay un repositorio, no hay ninguna capa entre "quiero guardar un hallazgo" y "mando un HTTP request a Supabase".

**Consecuencia directa:**
Si mañana quieres cambiar a Firebase, PlanetScale, o una API propia, tienes que buscar y reemplazar llamadas en todo el codebase. Y no hay forma de hacer testing sin mockear Supabase entero.

**Regla para el futuro:**
```ts
// services/intentos.service.ts
export async function registrarIntento(payload: IntentoPayload): Promise<void> {
  await supabase.from('intentos').upsert(payload);
}
```

Un archivo. Un punto de cambio. El componente no sabe qué backend usas.

---

## 2. Malas Prácticas de Componentes

### 2.1 Componentes de 700 líneas sin estructura interna

**Qué pasó:**
`PilotoConstruccionAtomica.tsx` tiene más de 700 líneas. `SimuladorClient.tsx` tiene 820 líneas. Son manejables porque el desarrollador que los escribió los conoce de memoria, pero son ilegibles para cualquier otra persona (o para ti mismo 3 meses después).

**Síntoma clave:**
Un componente de 700 líneas casi siempre está haciendo 3–4 cosas distintas que podrían ser componentes separados.

**Regla para el futuro:**
Si un componente hace scroll en tu editor, probablemente necesita split. La señal más confiable: si tienes que escribir un comentario como `// ── SECCIÓN: OVERLAY DE ÉXITO ──` adentro del JSX, eso debería ser su propio componente.

---

### 2.2 Overlays de éxito como afterthought

**Qué pasó:**
De 41 laboratorios, 11 tenían overlays de éxito rotos o inexistentes. Los problemas encontrados:

- Overlay con `pointer-events-none` → el alumno ve que completó el lab pero no puede hacer nada
- Overlay con solo botón de "reiniciar" sin forma de salir al hub
- Banner de texto plano en lugar de modal completo (B1)
- `z-index` demasiado bajo (z-20 en lugar de z-[200]) → otros elementos tapaban el modal de éxito
- Componente sin `'use client'` que usaba `useRouter` → crash silencioso en producción

**Por qué pasó:**
Los overlays se implementaron al final, con prisa, sin un estándar definido. Cada desarrollador lo hizo diferente.

**Regla para el futuro:**
Define el patrón de éxito **antes de escribir el primer simulador**, no después. Crea un componente `<SuccessOverlay>` reutilizable con props tipados:

```tsx
<SuccessOverlay
  title="Destilación Certificada"
  description="Has separado correctamente el etanol de la mezcla."
  metrics={[{ label: 'Pureza', value: '94.2%' }]}
  onExit={() => router.push('/hub')}
  onRetry={() => reset()}
/>
```

41 labs, 1 componente. No 41 implementaciones distintas del mismo patrón.

---

### 2.3 La directiva `'use client'` omitida en componentes con hooks

**Qué pasó:**
`PilotoSistemaDigestivo.tsx` y `PilotoSistemaNervioso.tsx` tenían hooks de React (`useState`, `useEffect`, `useRouter`) pero no tenían `'use client'` al inicio del archivo. En Next.js 15 App Router, esto es un error silencioso en desarrollo pero un crash en producción.

**Por qué pasó:**
Nadie corrió linting específico para Next.js Server Components. El eslint estándar no atrapa esto.

**Regla para el futuro:**
Instala `eslint-plugin-react-hooks` + el plugin de Next.js y configúralos en modo estricto. El linter debe fallar si un archivo usa hooks sin `'use client'`. No dependas de que alguien lo recuerde manualmente.

---

### 2.4 `registrarHallazgo` sin patrón consistente

**Qué pasó:**
La función crítica del negocio (`registrarHallazgo` — la que persiste que un alumno completó un lab) se llamaba desde lugares distintos según el laboratorio:

- En el **slice** (`validarBX()`) para los labs de Biología
- En el **componente** (directamente en el onClick) para algunos de Química
- En un **useEffect** que observa `allDone` para Balanceo
- **No se llamaba** en otros casos

No había ninguna regla escrita de cuándo y dónde se debía llamar.

**Regla para el futuro:**
Decide una sola convención y documéntala:

```
CONVENCIÓN: registrarHallazgo se llama SIEMPRE en el slice,
dentro de validarXX(), nunca en el componente.
Si la validación es del componente (local state), 
el componente llama onComplete() y la plataforma llama registrarHallazgo.
```

Una regla. Escrita. Revisada en code review.

---

## 3. Malas Prácticas de Proceso

### 3.1 Sin QA antes de declarar un feature completo

**Qué pasó:**
41 simuladores fueron marcados como "completados" sin un checklist de verificación. Resultado: 11 tenían bugs que cualquier alumno hubiera encontrado en los primeros 30 segundos de usar el lab.

Un overlay sin botón de salida no es un bug sutil. Es visible inmediatamente.

**Qué faltó:**
Un checklist mínimo por simulador antes de marcarlo como done:

```
[ ] El alumno puede completar el lab (happy path)
[ ] Al completar, aparece el overlay de éxito
[ ] El overlay tiene botón "Cerrar Laboratorio" que navega al hub
[ ] registrarHallazgo se llama cuando se completa
[ ] El lab no crashea al recargarse con estado previo
[ ] TypeScript compila sin errores
```

6 checks. 10 minutos por lab. Hubieran evitado 2 sesiones de debugging.

---

### 3.2 Sin tests de integración para flujos críticos

**Qué pasó:**
El proyecto tiene 1.4% de cobertura de tests. Los tests existentes verifican funciones de dominio puras (que casi nunca fallan). Lo que falló fueron los flujos de usuario: completar un lab, ver el overlay, navegar al hub.

Esos flujos no tenían ningún test.

**Regla para el futuro:**
Para una plataforma educativa, el "happy path" de cada lab es el test más importante que puedes escribir. No necesitas 100% de cobertura — necesitas que los 3 pasos críticos siempre funcionen:

```ts
test('alumno puede completar el lab y regresar al hub', async () => {
  render(<PilotoLeyOhm />);
  // 1. Interactúa con el simulador
  // 2. Valida
  // 3. Ve el overlay de éxito
  // 4. Click en "Cerrar Laboratorio"
  // 5. Está en /hub
});
```

---

### 3.3 Branding hardcodeado desde el día 1

**Qué pasó:**
"CEN Labs", "Dr. Quantum", y "Campaña de Educación Nacional" aparecen más de 120 veces en el codebase. En metadata, en componentes, en textos de misiones, en el sistema de audio.

Esto no es un problema si el proyecto es solo CEN Labs. Es un problema enorme si quieres hacer un segundo producto basado en el mismo código.

**Regla para el futuro:**
Desde el día 1 de cualquier proyecto que pueda convertirse en plataforma:

```ts
// config/branding.ts
export const BRANDING = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Mi Plataforma',
  mascot: process.env.NEXT_PUBLIC_MASCOT_NAME ?? 'Asistente',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? '#219EBC',
  authorName: process.env.NEXT_PUBLIC_AUTHOR ?? 'Mi Organización',
} as const;
```

Un archivo. Variables de entorno. Zero refactoring para hacer white-label.

---

## 4. Lo Que Sí Funcionó Bien

Es importante documentar esto también.

### 4.1 El sistema de dominio es sólido
Los archivos `src/domain/*.ts` (quimica, fisica, biologia, matematicas) son funciones puras, bien tipadas, sin efectos secundarios. Son portables, testeables, y correctos. Este fue el diseño más inteligente del proyecto.

### 4.2 El patrón visual (Diamond Standard) es consistente
Cuando se siguió el estándar visual definido en `ESTANDAR_VISUAL_LABS.md`, los resultados fueron consistentes y profesionales. El problema fue que no todos los labs lo siguieron al 100%.

### 4.3 El sistema de registro de hallazgos es una buena idea
`registrarHallazgo(eventId, data)` como función central de tracking es una abstracción correcta. El problema fue de implementación (dónde y cuándo llamarla), no de diseño.

### 4.4 El registry de simuladores es escalable
El patrón `PILOTO_REGISTRY[id] → Component` + `MASTER_DATA` para metadata es fácil de extender. Agregar un nuevo lab es mecánico y predecible.

---

## 5. Guía Para El Próximo Proyecto

Si vas a construir una segunda plataforma educativa (white-label o no), aquí está lo que haría diferente desde cero:

### Estructura de proyecto
```
src/
  core/              ← plataforma (auth, routing, timer, score, bitácora)
  labs/              ← contenido (cada lab es su propio módulo)
    fisica/
      ley-ohm/
        Piloto.tsx
        Bitacora.tsx
        domain.ts
        domain.test.ts
  config/            ← branding, feature flags, constants
  services/          ← Supabase, analytics, audio (con interfaces)
  ui/                ← componentes reutilizables (SuccessOverlay, etc.)
```

### Contrato de un simulador
```tsx
// Cada lab exporta esto. Nada más.
export interface SimuladorModule {
  id: string;
  Piloto: ComponentType<SimuladorProps>;
  Bitacora: ComponentType<BitacoraProps>;
  domain: SimuladorDomain;
  metadata: SimuladorMetadata;
}
```

### Checklist de launch por feature
```
Antes de marcar cualquier simulador como done:
[ ] Happy path funciona de inicio a fin
[ ] Overlay de éxito con botón de salida
[ ] registrarHallazgo se llama al completar
[ ] TypeScript sin errores
[ ] Test de integración del happy path
[ ] Sin logs de consola en producción
```

### Reglas de arquitectura no negociables
1. **Ningún componente importa directamente del store global.** Recibe props o usa un hook de dominio específico.
2. **Ninguna llamada a Supabase fuera de `services/`.** Si cambias de backend, cambias un archivo.
3. **Ningún string de branding hardcodeado.** Todo pasa por `config/branding.ts`.
4. **Ningún componente supera 300 líneas.** Si lo supera, se parte.
5. **Cada simulador tiene al menos 1 test de integración** del happy path antes de marcarse como done.

---

## 6. Conclusión

CEN Labs es un buen producto educativo con ingeniería apresurada. Las ideas pedagógicas son sólidas. La ejecución técnica acumuló deuda que tomó semanas de debugging para corregir.

El costo de las malas decisiones de arquitectura no se paga en el momento en que se toman — se paga cuando el proyecto crece, cuando entra otro desarrollador, cuando quieres reusar el trabajo en un segundo producto.

La próxima plataforma debería construirse con estos principios desde el día 1, no como refactoring del día 90.

---

*Generado después de auditar y corregir 41 simuladores en CEN Labs (mayo–junio 2026)*
