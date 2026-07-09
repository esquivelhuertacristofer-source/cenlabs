# Estándar del Molde — Lab 3D de Ensamble/Servicio (Sector Mecánica)

> **Estado:** VIGENTE · plantilla de referencia para las ≥150 prácticas nuevas del sector mecánica-electrónica.
> **Molde de referencia (calidad objetivo):** `public/labs/ensamble-freno-disco.html` (v3).
> **Fecha:** 2026-07-09
> **Alcance:** los laboratorios 3D *standalone* (`public/labs/*.html`) construidos sobre el motor premium three.js compartido (`createStage`). NO cubre la UI React del simulador (eso vive en [`ESTANDAR_VISUAL_LABS.md`](../ESTANDAR_VISUAL_LABS.md)).
> **Relacionados:** [`PLAN-ESCALABILIDAD-200-LABS.md`](./PLAN-ESCALABILIDAD-200-LABS.md) · [`MODELO-PEDAGOGICO-SECTOR-MECANICA.md`](./MODELO-PEDAGOGICO-SECTOR-MECANICA.md) · [`PANORAMA-NECESIDADES-SECTOR.md`](./PANORAMA-NECESIDADES-SECTOR.md)

---

## 0. TL;DR — el estándar en una frase

Cada lab de ensamble/servicio se compone de **dos capas obligatorias**:

1. **Capa A — Modelo 3D didáctico** (lo que el alumno ve y manipula): banco de trabajo con piezas apoyadas en pedestales, selección que *eleva y gira* la pieza, ensamble por "toca pieza → toca hueco luminoso", física de parámetros concentrados validada.
2. **Capa B — Ficha técnica** (la honestidad de ingeniería): un overlay que convierte **cada omisión geométrica en conocimiento explícito** — componentes reales (presentes y omitidos), fijaciones y pares de apriete, herramientas, real vs. didáctico, qué física modela / no modela, y **fuentes a manuales/normas reales**.

> **Principio rector:** hacerlo **lo más real posible, no simplificado**. Donde el 3D no pueda representar algo, **decirlo en la interfaz** (no ocultarlo). Si no llegamos a fidelidad 1:1, **damos fuentes** a diagramas y manuales reales. La simplificación es un punto de partida pedagógico, nunca el destino.

---

## 1. Por qué dos capas (el problema que resuelve)

Un modelo 3D procedural tiene un **techo de fidelidad geométrica**: no es el CAD del fabricante, omite piezas pequeñas (sellos, pernos guía, herrajes) y no puede mostrar tolerancias ni pares de apriete. Simplificar sin avisar deja **huecos de conocimiento** justo en lo que un técnico necesita saber.

La solución no es simplificar menos (eso llega en la fase CAD), sino **documentar el hueco**: la Capa B toma cada omisión de la Capa A y la vuelve un dato explícito, verificable y con fuente. El alumno ve un modelo limpio para aprender el concepto **y** una ficha rigurosa para conectar con el taller real.

> La fidelidad geométrica 1:1 (modelos CAD reales) queda planificada para una **fase 2**. Hasta entonces, la Capa B es lo que cierra la brecha.

---

## 2. Capa A — Estándar visual y de animación

### 2.1 Motor compartido (`createStage`)
Todos los labs usan el mismo motor premium (three@0.160.0 vía importmap CDN):
- IBL con `PMREMGenerator` + `RoomEnvironment`, `PCFSoftShadowMap`, tone mapping `ACESFilmic`.
- Cadena de post: bloom + DOF + SMAA; piso circular reflectante.
- API: `{THREE, renderer, scene, camera, controls, composer, bloom, setAnimate, start, moveTo, flyTo, setCinematicIdle, clock}`.
- Helpers de módulo reutilizables: `roundedBox()`, `pickerFor()`, `labelSprite()`, `makeSynth()`, y generadores PBR `castAluminum() / brushedMetal() / rubber() / techPlastic() / gradientBG()`.

**El molde nuevo NO reescribe el motor:** el build (`build-freno.mjs`) rebana el framework verbatim de un lab existente y solo intercambia título, etiqueta y hint. Ver §5.

### 2.2 Banco de trabajo con pedestales (staging) — reemplaza la "bandeja flotante"
Las piezas **descansan** sobre un banco físico; nada flota en el vacío. Cada pieza tiene su propio **pedestal** con placa giratoria, **anillo luminoso** y **placa de nombre**.

- **Totalmente paramétrico para N piezas** (clave para 150 labs): un objeto `BENCH` define centro, columnas, separaciones y altura; `pedBaseXZ(i)` calcula la posición en rejilla; `N_ROWS` se deriva de `PARTS.length`. Cambiar el número de piezas **no** requiere tocar layout.
- El banco se ubica **despejado de la zona de ensamble** (el hub) para que la pieza armada no colisione con los pedestales.
- Al colocar una pieza: el anillo pasa de teal a verde brillante y aparece un check **"✓ colocada"**; la placa de nombre se oculta.

### 2.3 Reposo robusto para geometría arbitraria
Cada pieza puede tener forma cualquiera, así que la altura de reposo se calcula, no se hardcodea:
```js
const box = new THREE.Box3().setFromObject(g);
const baseY = PED_TOP_Y + 0.03 - box.min.y;   // el punto más bajo queda sobre la placa
```
Esto funciona para cualquier pieza de cualquier lab sin ajuste manual.

### 2.4 Selección = mostrar la pieza (elevar + girar en Y)
Al tocar una pieza en el banco, ésta **se eleva** y **gira en escaparate**. La rotación de escaparate/idle es **sobre el eje Y**, no Z:

> **Regla dura:** girar en `rotation.y` preserva el punto más bajo de la pieza sin importar su forma → nunca se clava en el pedestal. Girar en Z clavaría piezas asimétricas. Idle usa un `lift` suavizado (ease) + un leve bob senoidal.

### 2.5 Interacción de ensamble
Patrón único y consistente: **"Toca una pieza del banco → toca su hueco luminoso"**. Los huecos (ghosts) se controlan por `scene.add/remove`, **no** por `.visible`:

> **Insight crítico de raycasting:** el `Raycaster` de three.js **NO** ignora objetos con `.visible===false`. La pickability fantasma se controla agregando/quitando de la escena, nunca con visibilidad.

### 2.6 Encuadre, materiales y color
- Cámara enmarca banco + zona de ensamble juntos (`cam`/`target` del `createStage` alineados con el `moveTo` inicial).
- Materiales del banco/pedestal son PBR cepillados coherentes con la paleta del motor.
- **No tocar los colores de escena con significado físico** (p. ej. el disco que se calienta): el brillo/`envMapIntensity` del disco caliente es telemetría visual, no decoración. Piso y luces sí son decorativos.

### 2.7 Física (parámetros concentrados)
Modelo honesto de parámetros concentrados, **validado**, no un motor físico completo. Para el freno de referencia: `F_apriete=P·A_pistón`, `F_fricción=2·μ·F`, `τ=F·r_ef`, `ΔT=E/(m·c)`, con caída de μ por temperatura (fade). Los valores concretos (μ, r_ef, masa, c) se declaran arriba del archivo y **no se alteran** una vez validados.

---

## 3. Capa B — Estándar de documentación técnica (Ficha técnica)

Overlay accesible desde un botón **"📋 Ficha técnica"** en el HUD. Cada lab llena el **mismo esquema de 6 secciones**. Es la plantilla reutilizable:

| # | Sección | Qué contiene |
|---|---------|--------------|
| 1 | **Componentes reales** | Lista de **presentes en el modelo** + lista de **omitidos en el 3D** (marcados con ○), cada omitido con una línea de por qué existe y qué hace en el equipo real. |
| 2 | **Fijaciones y pares de apriete** | Tabla: unión · tipo de fijación (tornillo/perno/tuerca, medida) · **par representativo**. Encabezada por el aviso de rangos (§3.1). |
| 3 | **Herramientas de servicio** | Herramientas y consumibles reales: llave dinamométrica, útiles especiales, grasas/líquidos, con la advertencia de dónde SÍ y dónde NUNCA aplicarlos. |
| 4 | **Ensamble didáctico vs. procedimiento real** | Explicita que el orden del lab es una **descomposición pedagógica** y enumera lo que **añade** un servicio real (retracción, lubricación, apriete a par, purga, asentado/bed-in, patrón estrella, re-apriete…). |
| 5 | **Física: qué modela / qué no** | Dos listas honestas: lo que la simulación sí calcula y lo que deliberadamente no (para no crear falsas expectativas). |
| 6 | **Normas y fuentes** | Normas aplicables (FMVSS/ECE, SAE, etc.) + manuales reales (FSM del fabricante, Bosch Automotive Handbook, Haynes/Chilton…) para diagramas 1:1. |

Cierra con un **pie** que recuerda: modelo didáctico, geometría procedural, física de parámetros concentrados, CAD real = fase futura.

### 3.1 Regla de honestidad de ingeniería (CRÍTICA)
> **No inventar cifras exactas.** Los pares de apriete, medidas de tornillo y capacidades **varían por vehículo/equipo**. Se usan **rangos representativos** + la instrucción explícita de **"consultar el manual de taller (FSM) del modelo específico"**. Para una audiencia técnica, **la falsa precisión es peor que un rango honesto**. Cuando una fuente normativa aplica (SAE J866, FMVSS 135…), se cita por nombre.

### 3.2 Notas de fidelidad en la interfaz (no solo en el overlay)
El HUD principal lleva un **"contrato de fidelidad"** breve y siempre visible:
- **Sí modela / No modela** (una línea cada uno).
- **Geometría didáctica:** enumera lo omitido y remata con "→ detalle completo en la Ficha técnica".
Así el alumno sabe, sin abrir nada, que lo que ve es una simplificación honesta con más detalle a un clic.

---

## 4. Checklist de aceptación por lab (Definition of Done)

Un lab del molde está terminado cuando:

- [ ] **Capa A** — piezas **apoyadas** en pedestales (ninguna flotando), selección eleva+gira en Y sin clavarse, ensamble N/N completo, física validada, 0 errores de consola.
- [ ] **Capa B** — Ficha técnica con las **6 secciones** llenas; componentes omitidos marcados; tabla de torques con **rangos** + aviso FSM; herramientas; real-vs-didáctico; física sí/no; **fuentes reales**.
- [ ] **Notas de fidelidad** visibles en el HUD (contrato Sí/No + "geometría didáctica → Ficha").
- [ ] **Honestidad:** ninguna cifra exacta inventada; todo par es rango o cita norma.
- [ ] **Verificación automatizada** (Playwright + SwiftShader): screenshots de estado inicial y ensamblado; overlay abre/cierra (Escape y click-fuera); telemetría coherente.

---

## 5. Cómo se construye un lab nuevo (método de build)

1. **`build-<lab>.mjs`** lee un lab existente (`escaner-obd.html`), corta el framework **verbatim** en el marcador `/* === … LAB — …`, aplica **3 swaps de texto** (título, etiqueta `.lt`, `inspectHint`) —cada swap **asegura exactamente 1 hit**— y **anexa** el `labbody.js` del lab nuevo + tags de cierre.
2. **`labbody.js`** contiene solo la lógica específica del lab (piezas, ensamble, física, HUD, Ficha). Reutiliza el `BENCH`/pedestales paramétricos como plantilla.
3. **Verificar** con el harness Playwright antes de dar por bueno.

> Este método mantiene un **único motor** compartido: los arreglos y mejoras del engine se propagan a todos los labs sin copiar-pegar. Alinea con el patrón *strangler-fig* de [`PLAN-ESCALABILIDAD-200-LABS.md`](./PLAN-ESCALABILIDAD-200-LABS.md).

---

## 6. Roadmap de fidelidad

| Fase | Capa A (3D) | Capa B (Ficha) | Estado |
|------|-------------|----------------|--------|
| **1 (actual)** | Geometría procedural didáctica + banco/pedestales paramétricos | Ficha técnica de 6 secciones con fuentes | ✅ molde v3 (freno) |
| **2 (futura)** | Modelos **CAD reales** por lab (fidelidad ≈1:1) | Ficha se mantiene; se reduce la lista de "omitidos" | ⏳ planificada |

---

*Este documento es la Base de Verdad del molde 3D de mecánica. Todo lab nuevo del sector debe cumplirlo o justificar por qué se desvía.*
