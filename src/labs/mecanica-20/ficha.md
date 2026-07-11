# Ficha de práctica — Conmutación de carga inductiva: diodo de marcha libre y clamp activo por zener (`mecanica-20`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** séptima práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Primera práctica de D2 centrada en el
> transitorio de una carga inductiva al abrir un switch — distinta de las prácticas de
> polarización DC en reposo (mecanica-14, mecanica-18, mecanica-19); introduce un motor de
> resolución en forma cerrada de tres topologías de protección con una comparación
> explícita entre la energía disipada exacta y una aproximación de bolsillo.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-20
sector: mecanica-electronica
practica_maestra: "d2-07 — Conmutación de carga inductiva y diodo de marcha libre (flyback/snubber): comparación de topologías de protección (sin protección, diodo de marcha libre, clamp activo por zener) con física de transitorio RL en forma cerrada (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "EM-I.3 (Mecatrónica/Electrónica, Módulo I, Submódulo 3)"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Conmutación de cargas inductivas y protección de switch"          # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-19; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar por qué abrir el switch de una carga
  inductiva sin protección genera un pico de voltaje destructivo sobre ese mismo switch;
  calcular el tiempo de apagado (τ=L/R) y el voltaje pico sobre el switch para las
  topologías de diodo de marcha libre y de clamp activo por zener; comparar la energía
  disipada exacta contra la aproximación rápida ≈2·Vf/Vsupply y cuantificar el error de
  esa aproximación; y diseñar una combinación de topología de protección y zener que
  cumpla simultáneamente un tiempo de apagado máximo y un presupuesto de voltaje sobre el
  switch, para una carga y un dispositivo de conmutación dados.
actividad_clave: >
  Recorre tres cargas inductivas (relevador de 5 V, relevador/solenoide de 12 V, motor DC
  con rotor detenido) bajo tres topologías de protección (sin protección, diodo de marcha
  libre, clamp activo por zener) sobre un banco 3D con osciloscopio integrado: en el modo
  Explora, elige carga/diodo/zener/topología, abre el switch y observa la corriente
  colapsar en cámara lenta declarada (ventana fija de 1.6 s, con el factor de escala real
  mostrado en pantalla); en Predicción, predice el tiempo de apagado (topología diodo) o el
  voltaje pico sobre el switch (topología clamp) antes de que el simulador lo confirme; en
  Medición/Barrido, captura el transitorio, arrastra un cursor de tiempo para verificar τ,
  y activa la superposición de comparación entre topologías; y en el Reto, elige la
  topología de protección (y el zener, si aplica) que cumpla a la vez un tiempo de apagado
  máximo y un presupuesto de voltaje sobre el switch — el simulador garantiza que siempre
  existe al menos una combinación que resuelve el reto antes de sortearlo.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce las tres topologías sobre el esquema: sin protección (switch abre directamente sobre la bobina, sin trayectoria de descarga), diodo de marcha libre (diodo en antiparalelo con la bobina, conduce solo durante la descarga) y clamp activo por zener (zener en serie con un diodo, fuerza una caída de voltaje mayor durante la descarga)."
  - "Modo Explora: toca el esquema o los componentes del banco 3D para revelar los valores; elige entre tres cargas (Songle SRD-05VDC-SL-C, relevador/solenoide de 12 V, motor DC con rotor detenido), dos diodos (1N4007, 1N5819 Schottky) y dos zeners de clamp (1N4742A 12 V, 1N4744A 15 V); abre el switch y observa la corriente I(t) colapsar en el osciloscopio del banco, en cámara lenta declarada."
  - "Verifica que la topología de diodo se resuelve con el decaimiento exponencial estándar de un circuito RL con diodo de marcha libre (τ=L/R, I(t)=I0·e^(−t/τ)), y que el tiempo de apagado mostrado corresponde a un criterio explícito (no 'hasta cero', que es asintótico)."
  - "Verifica que la topología de clamp se resuelve con un decaimiento lineal más rápido (Vclamp=Vz+Vf constante durante toda la descarga), y que el voltaje pico sobre el switch en esta topología es mayor que en la topología de diodo — el simulador lo muestra explícitamente en el modo Medición mediante la superposición de comparación entre topologías."
  - "Verifica la comparación entre la energía disipada exacta en el diodo (derivación cerrada Ediodo=Vf·(τ·I0−(Vf/R)·tOff)) contra la aproximación rápida de bolsillo ≈2·Vf/Vsupply, con el error de esa aproximación mostrado explícitamente — no se presenta la aproximación como si fuera exacta."
  - "Modo Predicción: con la topología de diodo, predice el tiempo de apagado en milisegundos (tolerancia ±22%); con la topología de clamp, predice el voltaje pico sobre el switch en voltios (tolerancia ±10%) — antes de que el simulador lo confirme."
  - "Modo Medición/Barrido: captura el transitorio completo, arrastra un cursor de tiempo sobre la curva I(t) para verificar τ contra el valor calculado, y activa la superposición de comparación entre topologías sobre la misma carga."
  - "Modo Reto: el simulador sortea un tiempo de apagado máximo y un presupuesto de voltaje sobre el switch garantizando matemáticamente que al menos una combinación de topología/zener los cumple ambos a la vez (construcción ligada al caso diodo-solo como referencia de solvabilidad); el estudiante elige la combinación y el simulador verifica ambos criterios."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito: switch, bobina, diodo, zener)."
  - "⚑ No se identificó una NOM mexicana que aplique directamente a la protección de switch frente a conmutación de carga inductiva a nivel de diseño de circuito — mismo hueco normativo ya documentado en mecanica-19/d2-06. Confirmar con el equipo curricular si el programa MCCEMS exige citar alguna norma específica para esta práctica."
simulador_modela:      # 🔒
  - "Transitorio RL en forma cerrada para tres topologías: sin protección (cualitativo, sin física real cuantificada — el switch se modela como destruible, no se calcula un voltaje de pico real sin fundamento), diodo de marcha libre (decaimiento exponencial, τ=L/R) y clamp activo por zener (decaimiento lineal, Vclamp=Vz+Vf constante durante la descarga)."
  - "Comparación explícita entre la energía disipada exacta en el diodo y la aproximación rápida ≈2·Vf/Vsupply, con el error de la aproximación mostrado en pantalla en vez de ocultado."
  - "Tres cargas con parámetros de fábrica (Songle SRD-05VDC-SL-C con tolerancia de resistencia ±10% citada de hoja de datos; relevador/solenoide 12 V y motor DC con rango típico ajustable, ya que ningún fabricante de relevador publica la inductancia de bobina como dato de catálogo — ver TE Connectivity AN 13C3344)."
  - "Dos diodos de marcha libre (1N4007 genérico, 1N5819 Schottky de Vf bajo) y dos zeners de clamp (1N4742A 12 V, 1N4744A 15 V), cada uno con su Vf/Vz de hoja de datos."
  - "Cámara lenta declarada: el simulador siempre reproduce el transitorio capturado en una ventana fija de 1.6 s, mostrando en pantalla el factor de escala real (span real del tOff de la topología vs. duración de la animación) — nunca finge una velocidad de reproducción en tiempo real que el ojo humano no podría percibir en un transitorio de microsegundos a milisegundos."
  - "Modo Reto con solvabilidad garantizada matemáticamente: el presupuesto de voltaje del switch se construye a partir de la combinación de clamp con el zener de mayor Vz más un margen aleatorio estrictamente positivo, asegurando que siempre existe al menos una combinación válida antes de sortear el reto."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Física del arco eléctrico o de avalancha en el propio switch mecánico/MOSFET durante el colapso sin protección — el caso 'sin protección' es intencionalmente cualitativo (advertencia de riesgo), no un cálculo cuantitativo de voltaje de arco o de ruptura por avalancha."
  - "Tiempo de recuperación inversa (trr) del diodo de marcha libre: se asume encendido instantáneo del diodo al abrir el switch — relevante en conmutación PWM repetitiva a alta frecuencia, no en el pulso único que modela esta práctica."
  - "Fuerza contraelectromotriz (back-EMF) de un motor en movimiento: la carga 'motor DC' se modela con el rotor detenido (bobinado puro), no con un motor girando que generaría una FCEM adicional."
  - "La inductancia de bobina como dato de catálogo verificado: los fabricantes de relevador no publican L típicamente (TE Connectivity AN 13C3344); los valores de inductancia de este lab son rangos ajustables tratados explícitamente como típicos/estimados, nunca como cifra exacta de hoja de datos."
  - "Efectos de segundo orden del transitorio: sin capacitancia parásita, sin anillo de resonancia (ringing) posterior al pico, sin snubber RC — el modelo es un RL de primer orden puro en cada topología."
  - "Dependencia térmica de Vf del diodo o Vz del zener: se usan valores constantes de hoja de datos, sin variación con la corriente instantánea o la temperatura de operación."
  - "Tolerancia de fabricación de los componentes: salvo la resistencia del Songle (±10% citada de hoja de datos), los demás componentes se tratan como valores nominales de catálogo, no como rangos de tolerancia de fabricación."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: combinación de topología de protección y zener elegida, y confirmación del simulador de que cumple simultáneamente el tiempo de apagado máximo y el presupuesto de voltaje sobre el switch sorteados."
evidencia_desempeno: "Guía de observación del modo Predicción (tiempo de apagado o voltaje pico predicho antes de la confirmación del simulador) y del modo Medición (verificación de τ con el cursor de tiempo y comparación de energía exacta vs. aproximada)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el colapso del campo magnético de una bobina al abrir un switch puede destruirlo, y el compromiso entre velocidad de apagado y voltaje pico entre diodo de marcha libre y clamp activo por zener (briefing.ts)."
desarrollo: "Práctica en el simulador: explora tres cargas y tres topologías en cámara lenta declarada → predice tiempo de apagado o voltaje pico → mide y verifica τ con cursor → reto de diseño con solvabilidad garantizada."
cierre: "Ficha técnica (capa 2) con los parámetros de hoja de datos de los diodos, zeners y la carga Songle, la nota de que la inductancia de bobina nunca es dato de catálogo del fabricante, y el procedimiento de medición física con LCRmetro y osciloscopio."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "ON Semiconductor / diversos fabricantes, datasheet '1N4007' — Vf, corriente máxima directa, del diodo de marcha libre genérico usado en este lab."
  - "Vishay / diversos fabricantes, datasheet '1N5819' — Vf (Schottky, bajo), corriente máxima directa, del diodo de marcha libre rápido usado en este lab."
  - "ON Semiconductor / diversos fabricantes, datasheets '1N4742A' y '1N4744A' — Vz nominal (12 V y 15 V respectivamente) de los zeners de clamp usados en este lab."
  - "TE Connectivity, nota de aplicación AN 13C3344 — confirma que la inductancia de bobina no se publica típicamente en hojas de datos de relevador, fundamento de por qué este lab trata L como rango ajustable, no como cifra de catálogo."
  - "Songle Relay, datasheet 'SRD-05VDC-SL-C' — única cifra de este lab totalmente verificada contra un dato de fabricante explícito (tolerancia de resistencia de bobina ±10%)."
  - "Infineon (anteriormente International Rectifier), datasheet 'IRF540N' — Rds(on)=0.033–0.044 Ω, citado en el switch MOSFET de referencia del lab; nota explícita de que esta cifra corresponde al IRF540N (con sufijo N) y no debe confundirse con el IRF540 sin sufijo, que tiene un Rds(on) mayor (0.052–0.077 Ω) según su propia hoja de datos."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (EM-I.3 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); no confirmadas contra un catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ La corrección del Rds(on) del IRF540N (0.033–0.044 Ω) frente al IRF540 sin sufijo (0.052–0.077 Ω) es un punto de confusión común entre hojas de datos de MOSFET de la misma familia; se aplicó la cifra correcta para el IRF540N en el texto del lab y en la ficha técnica, pero se pide al experto confirmar que el dispositivo de referencia real disponible en el laboratorio del curso es efectivamente el IRF540N y no una variante sin sufijo."
  - "⚑ La inductancia de bobina de las tres cargas (Songle, relevador/solenoide 12 V, motor DC) se trata en todo el lab como rango típico/ajustable, nunca como cifra exacta de hoja de datos, siguiendo la nota de aplicación de TE Connectivity AN 13C3344 (los fabricantes de relevador no publican L). Se pide al experto confirmar si el plantel tiene acceso a mediciones reales de L por LCRmetro de los relevadores/solenoides físicos del kit, para eventualmente estrechar estos rangos con datos propios en vez de estimaciones editoriales."
  - "✔ Verificación con Playwright de este simulador: PASS limpio (10/10 checks), sin defectos encontrados. `pickerFor` se llama directamente sin redefinición local; `el`/`showToast` están definidos localmente desde la primera versión de `diodomarchalibre.body.js` — el patrón de bug documentado en mecanica-19/d2-06 no se repitió aquí. Ver nota 3 en 'Notas para el revisor experto' para el detalle completo del reporte."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (séptima práctica de Tanda 1 / D2):** d2-07 introduce el
   primer transitorio (no punto de operación en reposo) de la tanda: qué pasa en el
   instante en que se abre un switch que alimenta una bobina, comparando tres topologías
   de protección. A diferencia de mecanica-14/mecanica-18/mecanica-19 (todas en DC
   estacionario), aquí el eje pedagógico es el compromiso velocidad-de-apagado vs.
   voltaje-pico-sobre-el-switch, y la honestidad explícita sobre qué tan rápido ocurre
   realmente el fenómeno (de ahí la cámara lenta declarada). Si este enfoque en el
   transitorio, en vez de en un análisis de régimen permanente, es el nivel adecuado para
   esta práctica dentro de la secuencia curricular, es una pregunta abierta para el
   experto.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/diodomarchalibre.html](../../../public/labs/diodomarchalibre.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros
   de hoja de datos de los diodos, zeners y la carga Songle, de modo que el alumno y el
   evaluador ven las fronteras del modelo dentro de la práctica.
3. **Verificación de implementación (continuación de la vigilancia iniciada en
   mecanica-19/d2-06) — importante para d2-08…d2-10:** `diodomarchalibre.body.js` se
   escribió desde el inicio llamando directamente a la función global `pickerFor(scene,
   camera, dom, onHit)` del framework (sin redefinirla localmente) y definiendo `el(id)` y
   `showToast(msg)` como helpers locales propios del body.js, siguiendo exactamente la
   lección documentada en la ficha de mecanica-19 tras el defecto encontrado ahí. Se lanzó
   un agente de verificación con Playwright (Chromium headless real, sirviendo
   `public/labs/` por HTTP local, no solo inspección estática de código) que confirmó en
   tiempo de ejecución: **cero errores de consola/página** (solo ruido benigno de GPU en
   modo headless); canvas WebGL 1440×900 renderiza correctamente; las cuatro transiciones de
   modo (Explora/Predice/Medición/Reto) cambian `#modeLabel` y muestran/ocultan las
   secciones del panel correctamente; el interruptor dispara la animación de cámara lenta
   sin errores en ningún frame; la API `window.__labDebug` devuelve física finita y coherente
   — con carga Songle por defecto, topología diodo: `tOff=7.34 ms`, `I0=71.4 mA`; topología
   clamp: `tOff=1.64 ms` (más rápido ✓) con `vPeak=18.1 V` frente a `6.1 V` del diodo (mayor
   ✓, confirmando numéricamente el compromiso velocidad-vs-voltaje central del lab); cargas
   `motor` y `relay12` devuelven valores finitos y sanos sin NaN; el modo Predicción confirma
   el flujo de respuesta correcta; el modo Reto sorteó una meta (`t_off≤11.98 ms`,
   `Vswitch≤31.1 V`) donde el diodo solo falla correctamente (`12.39 ms` > límite) mientras
   que **ambos** clamps (z12 y z15) pasan — confirmando numéricamente la garantía de
   solvabilidad, no solo la confianza en el diseño; el modo Medición confirmó captura +
   cursor + `verifTau()` (toast "En τ=4.29 ms la corriente cae a ≈36.8% de I0"); dos clics
   reales sobre el canvas 3D no produjeron excepciones, confirmando el cableado de
   `pickerFor`. **Resultado: PASS limpio, 0 defectos encontrados, ninguna corrección
   necesaria** — el patrón de bug framework/body.js documentado en mecanica-19 no se
   repitió aquí. Únicas observaciones (puramente cosméticas, no bugs, compartidas con otros
   labs de este donor): los componentes 3D de diodo/zener quedan cerca del borde derecho del
   ángulo de cámara por defecto en Explora, y el panel de información derecho (`overflow-y:
   auto`) puede recortar sus últimas líneas según la altura del viewport.
4. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑
   (EM-I.3 y el submódulo); (b) confirmar si el MOSFET de referencia real del kit del
   laboratorio es el IRF540N (Rds(on)=0.033–0.044 Ω) y no el IRF540 sin sufijo
   (Rds(on)=0.052–0.077 Ω), dado que es un punto de confusión común entre hojas de datos de
   la misma familia; (c) confirmar si el plantel tiene mediciones reales de inductancia (por
   LCRmetro) de los relevadores/solenoides físicos disponibles, para eventualmente estrechar
   los rangos de L actualmente basados en la nota de aplicación de TE Connectivity en vez de
   en datos propios; (d) confirmar si la ausencia de una NOM aplicable a esta práctica (igual
   que en mecanica-19/d2-06) es aceptable, dado que se trata de una práctica de diseño
   analógico sin implicación directa de seguridad eléctrica normada.
