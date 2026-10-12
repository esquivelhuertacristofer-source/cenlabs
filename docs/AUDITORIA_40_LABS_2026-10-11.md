# Auditoría de los 40 labs base (Física, Química, Biología, Matemáticas) — 2026-10-11

Método: lectura completa de Piloto + escena 3D + validador de dominio + slice de cada lab (4 revisores, uno por materia), y sonda en Chromium real (Playwright, 1600×900 y 1920×1080) que abre los 40 labs, pasa la portada, recoge errores de consola y captura la escena. Severidad: 🔴 rompe el lab · 🟠 resultado incorrecto · 🟡 menor. «Probable» = visto en código, falta confirmarlo ejecutando.

## 1. Fallos transversales (afectan a muchos labs a la vez)

| # | Fallo | Labs | Arreglo |
|---|---|---|---|
| T1 | El overlay de éxito propio del Piloto manda a `router.push('/hub')`, **ruta que no existe** (404). Además se salta el quiz y el upsert del intento como `completed`. | 21 labs con `/hub` (Q1-Q4, Q6-Q10, B1, B2, B6-B10, F1, M7-M10…) + otros que salen a `/alumno/laboratorio/<materia>` (F2, F5…) o abren `SuccessModal` directo (B3, B4, B5) | Todo éxito del Piloto llama `onValidate` → flujo único `handleManualValidation` → `LabQuiz`. Usar `hubPath`. |
| T2 | **Dos validadores divergentes**: el botón del Piloto usa una regla y «Validar práctica» (`validarXN` del dominio) otra. | casi todos | `src/domain/*.ts` como única fuente; el Piloto escribe `resultado:'exito'` y el dominio lo lee. |
| T3 | **Éxito persistido sin reinicio**: `status`/progreso se guardan en `cen-sim-v10` y la semilla no los limpia → al volver aparece «Misión completada» tapando el lab o se valida sin hacer nada; editar localStorage falsea resultados. | Q2-Q9, B5, B8, B9, B10, F5-F10, M5, M6, M9, M10 | `partialize` excluye `status`; cada semilla/montaje resetea estado de reto. |
| T4 | **Validadores triviales** (pasan sin hacer el reto). | F3, F4, F7, F8, F9, M5, M9, B5, B6, B7, B10, Q4 | Reescribir con el objetivo real del lab. |
| T5 | **Respuesta visible en pantalla**. | F1, F2, F3, F9, F10, Q2 (botón Auto-Cal), Q4, Q7, Q8, M1, M3, M6, M7, M8, B2, B6, B9 | Ocultar hasta validar. |
| T6 | Semillas fuera del rango de los controles (reto irresoluble). | M4, M6, M10 | Test que recorra cada semilla contra rango/paso de cada slider. |
| T7 | Rendimiento: `useSimuladorStore()` sin selector + intervalos/`useFrame` que escriben al store persistido (localStorage en cada tick, 10–60 Hz). `new Vector2` en `EffectComposer` cada render; geometrías sin `dispose`; pointLights que montan/desmontan. | ~25 labs | Selectores `useShallow`, estado de animación en refs, `useMemo` + dispose. |
| T8 | **Layout**: los HUD/paneles tapan la escena 3D o desbordan (visto en ejecución, también a 1920×1080). | F1, F2, F3, F4, F5, Q7 (desborda en horizontal, «Validar» cortado) | Plantilla de layout común: escena a ancho completo, HUD en franjas superior/inferior compactas. |
| T9 | Estética «espacio» (Stars/Sparkles/bloom/aberración) en lugar de laboratorio; casi ninguna escena con `Environment` HDR ni sombras. | ~30 escenas | Kit compartido (ver §4). |

## 2. Triage de los 40

Nota 3D: 1 = primitivas sueltas · 5 = objeto reconocible, PBR, entorno, sombras.

| Lab | Título | 3D | 🔴/🟠/🟡 | Lo más grave | Recomendación |
|---|---|---|---|---|---|
| fisica-1 | Tiro parabólico | 3.5 | 0/3/7 | Trayectoria real dibujada antes de disparar; disparo fallido posterior borra el acierto | Lógica + pulido |
| fisica-2 | Plano inclinado | 2 | 0/5/6 | Es un cohete, no un plano; dos μ distintas (0.1 vs 0.30); bucle infinito si F≤fricción | **Refactor 3D** + lógica |
| fisica-3 | Péndulo simple | 2 | 2/1/4 | Valida al registrar 1 muestra; `g` en el DOM; paneles tapan el péndulo | **Refactor 3D** + lógica |
| fisica-4 | Ley de Hooke | 1.5 | 1/2/4 | Valida con la 1ª muestra; no hay resorte (amortiguador telescópico) | **Refactor 3D** + lógica |
| fisica-5 | Prensa hidráulica | 1.5 | 0/3/5 | Éxito persistido para siempre; émbolo con altura negativa (r1=1, r2=4) | **Refactor 3D** + lógica |
| fisica-6 | Arquímedes | 1 | 1/4/3 | **Sin 3D** (div 2D; `Arquimedes3DScene` huérfana); inmersión 110 % | **Refactor 3D** + lógica |
| fisica-7 | Dilatación térmica | 3 | 1/1/5 | Valida con ΔT≥50 sin calcular α; incandescente a 120 °C | Lógica + pulido |
| fisica-8 | Ley de Ohm | 2 | 2/3/3 | Pide R para 20 mA (600 Ω) pero compara con la R actual; valida con solo cerrar circuito; senoide en CD; error SVG en consola | **Refactor 3D** + lógica |
| fisica-9 | Electrostática | 3 | 2/1/4 | F mostrada en vivo; validador verdadero por defecto; unidades cm/m mezcladas | Lógica + pulido |
| fisica-10 | Motor eléctrico | 3 | 2/3/3 | Validación inalcanzable (efecto apaga el motor tras el éxito); eje ∥ B (torque 0) | Lógica + refactor geometría |
| quimica-1 | Construcción atómica | 3 | 0/1/5 | Salida a `/hub`; fuga de geometrías por clic | Pulido |
| quimica-2 | Leyes de los gases | 2 | 1/2/4 | Botón «Auto-Cal» resuelve el reto; el vidrio desaparece tras explotar | Lógica + refactor 3D |
| quimica-3 | Balanceo | 2 | 0/3/4 | Átomos en NaN (invisibles) en moléculas >10 átomos; temática de fusión nuclear | Lógica + refactor 3D |
| quimica-4 | Reactivo limitante | 1 | 2/1/3 | Validación tautológica; reto casi siempre irresoluble (solo se puede añadir masa) | **Refactor 3D completo** + lógica |
| quimica-5 | Soluciones molares | 3 | 1/2/5 | **Imposible pesar**: con tara, `addPolvo` da `polvo+amount−polvo` = no acumula; aforo mal colocado | Lógica (bloqueante) + pulido |
| quimica-6 | Solubilidad | 2 | 0/1/3 | Curvas de solubilidad erróneas (KNO₃ 98 g a 100 °C, real ≈246) | Datos + refactor 3D |
| quimica-7 | Titulación | 3 | 1/1/4 | Línea «V. equiv.» dibujada = respuesta; layout desborda, 3D no visible | Lógica + layout + pulido |
| quimica-8 | Le Châtelier | 2 | 3/1/3 | Requisito oculto (jeringa #3 al hielo); «transparente» vs «incoloro»; un solo reactor con temp. media | **Refactor 3D completo** + lógica |
| quimica-9 | Celdas galvánicas | 2 | 1/2/4 | Animaciones congeladas (closure de `useEffect([])`); doble canvas; en ejecución no se ve 3D | **Refactor 3D** (a R3F) + lógica |
| quimica-10 | Destilación | 2 | 1/3/2 | Escena congelada (mismo bug); pureza sube con T (al revés); doble canvas | **Refactor 3D completo** + lógica |
| biologia-1 | Microscopio | 2 | 1/2/4 | Enfoque nítido fijo en 50.5 pero el validador usa foco aleatorio 30–70 | Lógica + refactor 3D |
| biologia-2 | Transporte celular | 2 | 0/3/3 | ΔOsm visible = respuesta; sin acoplamiento volumen–concentración | Lógica + refactor 3D |
| biologia-3 | Síntesis de proteínas | 2 | 0/3/4 | Valida con el 1er aminoácido; keydown global captura lo que se escribe en la bitácora | Lógica + refactor 3D |
| biologia-4 | Fotosíntesis | 3 | 0/2/4 | Reto trivial (cualquier config. llega esperando); «verde no sirve» incorrecto | Lógica + pulido |
| biologia-5 | Mendel | 2 | 0/3/4 | Cualquier clic aprueba; F2 rotulada como F1 | Lógica + refactor 3D |
| biologia-6 | Selección natural | 2 | 1/4/3 | Valida con `generacion>=3` (esperar); no hay reproducción; la polilla mal camuflada brilla | Lógica + refactor 3D |
| biologia-7 | Arco reflejo | 3 | 0/3/4 | Éxito al primer clic; no hay arco (ni médula, ni músculo) | Lógica + pulido |
| biologia-8 | ECG | 2 | 1/4/5 | El corazón se agranda en el QRS; «estabilizar» induciendo taquicardia; BPM objetivo «132.7003245…» | Lógica + **refactor 3D** (corazón anatómico) |
| biologia-9 | Sistema digestivo | 2 | 1/4/3 | Enzima correcta resaltada; bolo recorre todo el tubo sea cual sea la enzima | Lógica + **refactor 3D** |
| biologia-10 | Poblaciones | 3 | 2/4/4 | Valida en ~1 s (`historial>50` frames); Euler con dt variable; inventa K en Lotka-Volterra | Lógica + pulido |
| matematicas-1 | Cuadráticas | 4 | 0/2/3 | Raíces complejas conjugadas dibujadas en el mismo punto; objetivo a, b, c visible | Pulido |
| matematicas-2 | Sistemas 2×2 | 2 | 0/0/4 | Grid de canto (invisible); «inconsistente» cuando es dependiente | **Refactor 3D** |
| matematicas-3 | Richter / Mw | 3 | 1/2/3 | **Irresoluble**: `targetM` no se muestra en ningún sitio | Lógica |
| matematicas-4 | Pitágoras | 2 | 0/1/3 | Semillas 12–24 con sliders 1–10; escena negra en ejecución | **Refactor 3D** + semillas |
| matematicas-5 | Círculo trigonométrico | 2 | 0/2/5 | Toro en el plano XZ (el punto no recorre el círculo); dos clics aprueban | **Refactor 3D** + lógica |
| matematicas-6 | Transformaciones | 1 | 1/0/3 | **Irresoluble en ~58 %** de semillas (tx,ty ±8, sliders ±5) | **Refactor 3D completo** + lógica |
| matematicas-7 | Snell | 4 | 0/2/4 | V₂ = 1/n₂ visible; sin control de ángulo; arcos en espejo | Pulido |
| matematicas-8 | Derivada | 3 | 1/1/4 | **Certificación imposible** (dominio lee `xActual` que nadie escribe; 3 funciones distintas) | Lógica + encuadre |
| matematicas-9 | Riemann | 1 | 1/3/2 | **Siempre aprueba** (`validarM9(0.15)` constante); barras solo alambre; cima fuera de cuadro | **Refactor 3D completo** + lógica |
| matematicas-10 | Galton | 3 | 1/3/3 | **Sin botón para soltar bolas** en el Piloto (solo en la bitácora); bolas al contenedor k+½ | Lógica + pulido |

Huérfanos: `fis05/Colisiones3DScene` + `PilotoColisiones1D` + `BitacoraColisiones1D` (ningún lab los usa), `fis06/Arquimedes3DScene` (nadie la importa).

## 3. Verificado en ejecución (Chromium)

- Ningún lab truena al cargar ni dispara ErrorBoundary.
- fisica-6: 0 canvas (no hay 3D).
- quimica-9 / quimica-10: dos canvas superpuestos a 1600×900 (cleanup no retira el canvas); quimica-9 sin canvas a 1920×1080; ninguna de las dos muestra montaje visible.
- matematicas-4: escena negra.
- fisica-3/4/5, quimica-7: escena tapada por paneles o layout desbordado, incluso a 1920×1080.
- fisica-8: `Error: <path> attribute d: Expected moveto… "undefined"` (gráfica SVG).
- Avatar del tutor en fisica-3 bloqueado por CSP (`api.dicebear.com` no está en `img-src`).
- Confirmado a mano en código: Q5 `addPolvo`, M8 `validarM8`, M10 sin `lanzarBolitasM10` en el Piloto, Q9 `animate` en `useEffect([])`.

## 4. Kit 3D compartido propuesto (`src/components/simuladores/_kit/`)

- **Entorno**: `<LabRoom/>` / `<LabBench/>` (mesa, azulejo, `Environment` HDR, `ContactShadows`, preset de luz y postFX sobrio) para sustituir Stars/Sparkles.
- **Vidrio y líquidos**: `<GlassMaterial/>` (`MeshTransmissionMaterial`), `<Liquid volume color meniscus/>`, cristalería por `LatheGeometry` con perfiles reales: `<Beaker/>`, `<Erlenmeyer/>`, `<VolumetricFlask aforo/>`, `<Burette graduada + llave/>`, `<Syringe/>`, `<DistillationKit/>`, `<SaltBridgeU/>`.
- **Soportes e instrumentos**: `<RingStand/>`, `<Clamp/>`, `<HotPlateStirrer/>`, `<IceBath/>`, `<Thermometer/>`, `<AnalogGauge/>` (manómetro/comparador), `<Multimeter/>` con puntas, `<Dynamometer/>`, `<Photogate/>`, `<Ruler/>` graduada, `<HelixSpring/>`, `<ForceArrow/>`.
- **Matemáticas**: `<PlanoCartesiano/>` (rejilla XY en shader + `<Text>` troika en vez de decenas de `<Html>`), `<CurvaFuncion/>`, `<ArcoAngulo/>`, `useFitCamera(bounds)`.
- **Biología**: `tissueMaterial()` (physical con transmission/sheen/thickness), `<BioMembrane/>`, `<OrganelleKit/>`, `<MoleculeInstancer/>`, `<NeuronKit/>`, glTF anatómicos (corazón, tubo digestivo), `useSimClock` compartido HUD/escena, `<ECGPaper/>` 25 mm/s.
- **Layout**: plantilla de HUD común que no tape la escena (T8).

## 5. Orden propuesto

1. **Sprint 0 — transversales** (T1, T2, T3, T8) en el shell y el store: arregla de golpe la salida 404, el bypass del quiz y el «éxito pegado» en ~30 labs.
2. **Sprint 1 — los irresolubles/rotos**: Q5, M3, M6, M8, M10, F10, Q9, Q10, B1, Q4.
3. **Sprint 2 — validadores triviales y respuestas filtradas** (T4, T5) por materia, con pruebas de dominio.
4. **Sprint 3+ — refactor 3D con el kit**, empezando por los de nota ≤ 2: F6, F4, F5, M9, M6, Q4, Q8, Q10, F3, F2, F8, M2, M4, M5, B8, B9, B5, B6, Q2, Q3, Q9.
5. **Pulido** de los que ya están bien (≥ 3): M1, M7, F1, F7, F9, Q1, Q5, Q7, B4, B7, B10, M10.
