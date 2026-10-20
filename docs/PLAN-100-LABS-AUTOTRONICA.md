# Plan · 100 labs más de autotrónica y automovilidad

> **Estado:** PROPUESTA (2026-10-19). No ejecutado. Empieza por el validador (Fase 0).
> **Premisa:** antes de escribir 100 labs hay que abaratar y asegurar cada uno. Lo que costó caro en las tres tandas de «clase mundial» fue la revisión manual de capturas y la corrección lab por lab de los mismos fallos.
> **Complementa:** `ESTANDAR-LABS-CLASE-MUNDIAL.md` (qué debe cumplir un lab), `PLAN-ESCALABILIDAD-200-LABS.md` (datos por carpeta) y `LISTA-MAESTRA-200-PRACTICAS.md` (D7, D8 y D9 aún sin cubrir).

---

## 1. Principios

1. **Todo lo medible se mide por máquina.** Un lab no entra al catálogo si el validador no lo da por bueno. La revisión humana queda para lo que no se puede medir (¿es atractivo?, ¿es didáctico?).
2. **La física se escribe una vez.** Módulos puros con pruebas contra forma cerrada; los labs los componen.
3. **Una cifra, una fuente.** Todo número visible sale del motor; nada se calcula a mano en prosa.
4. **Un solo molde.** Los 100 nuevos nacen en React/R3F con el kit común. Los estáticos existentes no se migran en bloque.
5. **Medir en GPU real** antes del lote 3. Hoy sólo existe medición con SwiftShader.

---

## 2. Fase 0 · Validador automático de estándar (2–3 semanas de trabajo)

Hoy existen piezas sueltas: `scripts/auditoria/sonda-labs-base.mjs`, `barrido-labs.mjs`, `window.__diag3d.salud()` y los scripts de captura que cada agente reescribió. La Fase 0 las une en **un comando** (`npm run validar:lab -- <id>`) con salida pasa/falla y un informe.

| # | Regla (origen) | Cómo se mide | Umbral |
|---|---|---|---|
| V1 | Normal cero = pantalla negra | `__diag3d.salud().normalesCero` en cada estado | 0 |
| V2 | Rendimiento de dibujo | `renderer.info.render.calls` alta y media | < 150 |
| V3 | Prosa al inicio | Conteo de palabras visibles (la lógica de `palabras.mjs`) | ≤ 120 |
| V4 | Objeto en el lienzo | Fracción del alto ocupada, a 1366×768, 2020×1055 @1,25 y 390×844 | ≥ 0,55 |
| V5 | Sin texto en el 3D | No hay `Html`/`Text` de drei visibles con rótulos apagados | 0 |
| V6 | Entradas | Ningún `input type=number` nativo | 0 |
| V7 | Formato | Coma decimal y espacio fino U+202F en millares, en DOM y en lienzos | 0 incumplimientos |
| V8 | Reloj único | `useFrame` con prioridad ≤ 0 | 0 incumplimientos |
| V9 | Quiz | Posición de la respuesta correcta: ninguna posición > 40 % | pasa |
| V10 | Sin fugas de respuesta | Antes de validar, la solución del reto no aparece en el DOM | 0 coincidencias |
| V11 | Consola | Sin errores propios; los de plataforma se listan aparte | 0 |
| V12 | Sin scroll interno ni horizontal | Medido en los 4 tamaños | 0 |
| V13 | Ficha | `s4` es `{intro, items}`, `s5` declara lo que no modela | pasa |
| V14 | Ciencia | Archivo de prueba existe y cubre forma cerrada, un reloj y convergencia | revisión + cobertura |

Entregables de la fase:
- `scripts/auditoria/validar-lab.mjs` y el informe `docs/validacion/<id>.md`.
- Una acción de CI que lo ejecute sólo sobre los labs tocados (para no cargar la memoria).
- **Arreglo genérico del quiz:** barajar las opciones en el componente `LabQuiz` sin tocar los datos. Cierra el pendiente repetido en las tres tandas.
- **Línea base:** correr V1–V14 sobre los 30 destacados para fijar umbrales realistas y detectar regresiones antes de empezar.

**Criterio de salida:** los 30 destacados pasan o tienen excepción documentada.

---

## 3. Fase 1 · Núcleo de física de autotrónica (4–6 semanas)

Módulos puros en `src/physics/auto/`, cada uno con su archivo de pruebas.

| Módulo | Contenido | Pruebas de referencia |
|---|---|---|
| `motor-ci` | Otto, Diésel, Atkinson, mapas de eficiencia, mezcla y emisiones | Forma cerrada; ya hay base en mecanica-111 a 126 |
| `electrico` | Park/Clarke, dq, MTPA, debilitamiento de campo, inversor, pérdidas (base: mecanica-1 y mecanica-4) | Idas y vueltas, par contra fórmula |
| `bateria` | Circuito equivalente (1RC/2RC), SOC, resistencia y térmica, envejecimiento | Descarga a corriente constante contra solución analítica |
| `neumatico` | Pacejka, círculo de fricción, deslizamiento | Valores de libro, derivadas en cero |
| `vehiculo` | Longitudinal, bicicleta, transferencia de carga, suspensión de ¼ y ½ | Frenado a distancia exacta, modos propios |
| `abs-esc` | Control de deslizamiento, TCS, ESC | Convergencia y estabilidad por lazo |
| `redes` | CAN/CAN-FD, LIN, OBD-II, UDS, arbitraje y errores | Tramas contra ejemplos de norma |
| `termica-hvac` | Ciclo de refrigeración, A/C, bomba de calor, intercambiador | Balances de energía |
| `fotovoltaica` | Modelo de un diodo, MPPT, sombreado | Punto de máxima potencia exacto |

Regla: **los labs sólo importan del núcleo**, nunca copian ecuaciones. Un guardián en jest falla si un lab define su propia constante física duplicada.

**Datos versionados** en `src/data/auto/`: tablas de códigos DTC, perfiles de vehículo, normas y límites (NOM-041/047, SAE J1939/J1979, ISO 26262 de forma conceptual).

---

## 4. Fase 2 · Molde único y catálogo por manifiesto (2–3 semanas)

- **Plantilla `npm run new:lab`** ampliada (ya existe) para generar: carpeta del lab, escena con el kit, Dock, reloj, banco de pruebas, bitácora, quiz, ficha, prueba y entrada de manifiesto.
- **Manifiesto único por lab** (`src/labs/<id>/manifiesto.ts`): título, módulo, prerrequisitos, norma, estado, `destacada`. De ahí se generan hubs, golden, portada y mapa de dependencias. Sigue la línea de `PLAN-ESCALABILIDAD-200-LABS.md` (strangler fig).
- **Kit ampliado** con piezas reales de automoción: bloque, culata, pistón, biela, árbol, turbo, inyector, bobina, ECU, arnés, conector, rotor y estátor, pinza de freno, amortiguador, neumático, módulo de batería, compresor, condensador.
- **Un único guardián de formato** (V7) en jest y en el validador.

---

## 5. Fase 3 · Lotes de contenido

Se completa primero lo pendiente de la lista maestra (D6 restante, D7, D8, D9: 35 labs) y luego los 100 nuevos. Distribución propuesta de los 100:

| Bloque | Labs | Temas |
|---|---|---|
| Electrificación y baterías | 20 | Celdas, BMS, carga AC/DC, V2G, regeneración, gestión térmica de pack |
| Tracción eléctrica e híbridos | 15 | Control vectorial, DTC, híbridos serie/paralelo, reparto de potencia |
| Dinámica y chasis | 15 | Neumático, suspensión, dirección, ESC/TCS, frenado, estabilidad |
| Redes y electrónica del vehículo | 15 | CAN/LIN/Ethernet, OBD-II, UDS, ECU, sensores/actuadores, ciberseguridad |
| ADAS y sensores | 10 | Cámara, radar, lidar, fusión, ACC, AEB, mantenimiento de carril |
| Diagnóstico y mantenimiento | 15 | Escáner, osciloscopio, fallas por bisección, normas de emisión |
| Climatización y confort | 5 | A/C, bomba de calor, térmica de cabina |
| Combustión avanzada y alternativos | 5 | GDI, HCCI, H₂, biocombustibles, postratamiento |

**Cadencia:** lotes de 10. Un **piloto por bloque** (un lab que fija el molde y la narrativa) antes de paralelizar el resto del bloque.

**Orquestación:** agente por lab con contrato V5 (el V4 más las reglas de la Fase 0), máximo 3 en paralelo, un solo navegador a la vez y **Sonnet por defecto**. Se reserva Opus para el diseño del núcleo y los pilotos. Revisión humana sólo de las capturas y de la narrativa, porque el resto lo valida la máquina.

---

## 6. Fase 4 · Producción y medición (transversal)

- **Rendimiento real:** medir fps y memoria en GPU integrada, gama media y un móvil de gama baja. Presupuesto: ≥ 30 fps en gama baja con calidad media. Si no se cumple, bajar calidad por defecto antes del lote 3.
- **Deploy automatizado:** la acción de CI debe construir, ejecutar ESLint, desplegar a Cloudflare, comprobar que exista una **versión nueva** y correr las pruebas de humo. Se acaba el paso manual del worktree y de la voz.
- **Voz:** incluir la narración en el pipeline con la metodología aprobada (Gemini Live para el molde, Qwen3-TTS para clonar; ver `voces-naturales/README.md`).
- **Telemetría pedagógica:** dónde falla el alumno, cuánto tarda por reto, qué distractor elige. Se usa para mejorar retos, no para calificar.
- **Portadas:** `npm run gen:portadas` en la acción de CI para cada lab nuevo.

---

## 7. Calendario orientativo

| Fase | Duración | Resultado |
|---|---|---|
| 0 · Validador | 2–3 sem. | `validar:lab` y línea base de los 30 destacados |
| 1 · Núcleo de física | 4–6 sem. | Módulos con pruebas, en paralelo con la Fase 2 |
| 2 · Molde y manifiesto | 2–3 sem. | Un comando crea un lab completo |
| 3 · Lotes | 10 lotes de ~2 sem. | 100 labs, con piloto por bloque |
| 4 · Producción | transversal | CI/deploy, GPU real, telemetría |

---

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| El validador da falsos positivos | Umbrales calibrados con la línea base y excepciones documentadas |
| Núcleo de física incorrecto se propaga a 100 labs | Pruebas contra forma cerrada y revisión de Opus antes de usarlo |
| Memoria saturada con agentes en paralelo | Máximo 3 agentes, un Playwright, RAM comprobada antes de lanzar |
| Rendimiento insuficiente en equipos reales | Fase 4 antes del lote 3 y calidad media por defecto |
| Contenido que se desincroniza (cifras en prosa) | Cifras sólo desde el motor y guardián en jest |
| Fatiga de revisión humana | Revisión sólo de capturas y narrativa; el resto lo valida la máquina |

---

## 9. Decisiones que quedan para el dueño

1. ¿Se completan primero los 35 labs pendientes de la lista maestra o se mezclan con los 100?
2. ¿Se acepta migrar sólo lo nuevo al molde único y dejar los estáticos como están?
3. ¿Qué gama de equipo debe funcionar bien (laboratorio escolar, móvil del alumno)?
4. ¿Se activa la telemetría pedagógica? Requiere revisar el aviso de privacidad.
