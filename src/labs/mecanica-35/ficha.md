# Ficha de práctica — Filtro activo Sallen-Key de 2.º orden: fc, Q y Butterworth (`mecanica-35`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimocuarta práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, cuarta y última del sub-arco de circuitos integrados analógicos que abrió
> mecanica-32/d2-11 (amplificador operacional), siguió mecanica-33/d2-12 (comparador
> Schmitt trigger) y mecanica-34/d2-13 (temporizador astable 555). Cierra ese sub-arco
> pasando de un dispositivo de decisión/temporización a un bloque de procesamiento de señal
> en el dominio de la frecuencia: un filtro activo de 2.º orden construido con el mismo tipo
> de amplificador operacional (TL072) que abrió el sub-arco en d2-11.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-35
sector: mecanica-electronica
practica_maestra: "d2-14 — Diseña filtros activos Sallen-Key de 2.º orden: fc=1/(2πRC), Q=1/(3−K) y el punto de respuesta Butterworth (K≈1.586, Q≈0.7071) (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-II.1 (Electrónica/Tecnología, resultado II.1) — confirmado por lectura directa de la fila de d2-14 en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila 14, columna de trazabilidad)"   # ⚑ sin código Mecatrónica (MEC-x.x) asignado en la lista maestra para esta fila, igual que d2-13; confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Filtros activos de 2.º orden (topología Sallen-Key)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23/32/33/34; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de reconocer la topología Sallen-Key de componentes
  iguales (R1=R2=R, C1=C2=C) alrededor de un amplificador operacional no inversor; deducir
  que la frecuencia de corte fc=1/(2πRC) depende únicamente de R y C, mientras que el factor
  de calidad Q=1/(3−K) depende únicamente de la ganancia K=1+Rf/Rg fijada por el divisor de
  realimentación positiva; identificar el punto de respuesta Butterworth (K≈1.586, Q≈0.7071)
  como la curva más plana posible en la banda de paso; explicar cualitativamente por qué Q
  crece sin límite y el circuito se vuelve inestable cuando K se acerca a 3; leer una curva de
  Bode de magnitud y fase normalizada a f/fc y relacionarla con la clasificación del filtro
  (sobre-amortiguado, Butterworth, con pico de resonancia, o inestable); y diseñar R y C para
  alcanzar una frecuencia de corte objetivo manteniendo la respuesta en el punto Butterworth.
actividad_clave: >
  Sobre un banco 3D con R1, R2, C1, C2, Rf, Rg y un TL072 en encapsulado DIP, con displays de
  fuente/info, medición y osciloscopio virtual, en el modo Explora ajusta R, C y Rf con
  steppers y observa fc, K, Q, la clasificación de la respuesta, la curva de Bode
  (magnitud/fase normalizada a f/fc) y el osciloscopio de atenuación en vivo actualizarse en
  tiempo real; en Predicción, predice fc, Q o el tipo de respuesta antes de revelar el valor
  real; en Medición, ejecuta un barrido automático de la relación f/fc que traza punto por
  punto la curva de atenuación real de la salida; y en el Reto, diseña R y C para alcanzar una
  frecuencia de corte objetivo aleatoria manteniendo la respuesta en el punto Butterworth,
  recibiendo retroalimentación específica sobre qué ajustar cuando el diseño no cumple.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: fuente Vin, R1 en serie hacia el nodo intermedio, R2 en serie hacia la entrada no inversora (V+) del op-amp, C2 desde el nodo intermedio a tierra, C1 realimentando desde Vout hacia el nodo entre R1 y R2 (realimentación positiva), y el divisor Rf/Rg entre Vout y la entrada inversora (V−) fijando la ganancia K=1+Rf/Rg (realimentación negativa)."
  - "Modo Explora: ajusta R, C y Rf con los steppers del panel, y observa fc, K, Q, la clasificación de la respuesta (color/etiqueta), la curva de Bode de magnitud y fase, y el osciloscopio virtual actualizarse en tiempo real."
  - "Verifica que fc=1/(2πRC) depende únicamente de R y C (Rf no la mueve), que K=1+Rf/Rg y Q=1/(3−K) dependen únicamente de Rf (R y C no los mueven), y que la ganancia en banda de paso mostrada en la curva de Bode (20·log10(K)) coincide con la línea de referencia punteada."
  - "Confirma que la curva de magnitud y fase se calcula con la función de transferencia normalizada H(jr)=K/[(1−r²)+j(r/Q)], con r=f/fc, evaluada en magnitud (dB) y fase (grados) a lo largo de un barrido logarítmico de r, y no con una aproximación simplificada de un solo polo."
  - "Confirma que el simulador clasifica automáticamente la respuesta según Q —sobre-amortiguada (Q<0.7071), Butterworth (Q≈0.7071, dentro de ±0.03), con pico de resonancia (0.7071<Q≤8), o inestable (Q>8)— y que dos accesos directos del panel saltan al valor de Rf que produce el punto Butterworth (Rf=5.86 kΩ → K≈1.586 → Q≈0.7071) y al valor de Rf más alto disponible (Rf=19 kΩ → K≈2.9 → Q≈10, cerca de inestabilidad) para observar ambos extremos sin tener que ajustar el stepper paso a paso."
  - "Modo Predicción: predice fc, Q o el tipo de respuesta con los valores actuales de R/C/Rf, antes de que el simulador confirme la respuesta."
  - "Modo Medición: ejecuta un barrido automático de la relación f/fc (r) y observa cómo se traza punto por punto, en una tabla en vivo, la magnitud (dB) y la fase (grados) reales de la salida en cada punto del barrido."
  - "Modo Reto: diseña R y C para alcanzar una frecuencia de corte objetivo aleatoria dentro de tolerancia, manteniendo Rf en (o cerca de) el valor Butterworth, y verifica que el simulador reporta la razón específica de incumplimiento (fc fuera de rango o Q lejos del punto Butterworth) cuando el diseño no cumple."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (resistor, capacitor, bloque de amplificador operacional, tierra) — el estándar de representación de este lab."
  - "⚑ No se identificó una norma que aplique directamente al diseño de un filtro activo Sallen-Key a nivel de componente — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-23/d2-10 y mecanica-32/d2-11, mecanica-33/d2-12, mecanica-34/d2-13; el ancla técnica de esta práctica son las notas de aplicación estándar del fabricante (Texas Instruments) y los textos de referencia de electrónica analógica (Sedra & Smith), no una norma."
simulador_modela:      # 🔒
  - "Topología Sallen-Key no inversora de componentes iguales (R1=R2=R, C1=C2=C): fc=1/(2πRC), K=1+Rf/Rg, Q=1/(3−K) — verificadas algebraicamente contra la derivación estándar de la función de transferencia de TI SLOA024B ('Analysis of the Sallen-Key Architecture')."
  - "Función de transferencia completa H(jr)=K/[(1−r²)+j(r/Q)] con r=f/fc, evaluada en magnitud (dB) y fase (grados) a lo largo de un barrido logarítmico de r desde 0.1× hasta 10× fc, y no una aproximación de un solo polo."
  - "Clasificación automática de la respuesta según Q: sobre-amortiguada, Butterworth (Q≈0.7071=1/√2, dentro de ±0.03), con pico de resonancia, o inestable (Q>8) — con el punto Butterworth (K≈1.586) y un ejemplo de Q alto (K≈2.9, Q≈10) verificados contra TI SLOA024B."
  - "Especificaciones reales del TL072 (ancho de banda de ganancia unitaria GBW=3.0 MHz, slew rate SR=13 V/µs, offset de entrada Vos típico 3 mV / máximo 10 mV) citadas en el contrato de fidelidad, usando un solo amplificador operacional del encapsulado dual."
  - "Modo Reto con una fc objetivo aleatoria y la restricción de mantener Q cerca del punto Butterworth, y modo Medición con barrido automático de la relación f/fc que traza la curva de atenuación punto por punto."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El límite de ancho de banda de ganancia (GBP) del amplificador operacional real: a frecuencias suficientemente altas relativas al GBW del TL072, la ganancia real del op-amp cae y la respuesta del filtro se desvía de la curva ideal calculada aquí — efecto documentado en TI SLOA088 (§16.8.4) pero no modelado numéricamente en este simulador."
  - "El slew rate del TL072 (13 V/µs): con señales de amplitud y frecuencia suficientemente altas, la salida real se distorsionaría por limitación de slew rate; este simulador calcula la salida solo a partir de la función de transferencia lineal, sin ese límite."
  - "La tolerancia real de fabricación de R1/R2/C1/C2/Rf/Rg: en un diseño real, lograr K≈1.586 exacto rara vez cae sobre una razón exacta de resistores de la serie E12/E24 disponible comercialmente, lo que introduce una desviación pequeña pero real del punto Butterworth ideal; este simulador calcula fc, K y Q de forma exacta según los valores discretos que ofrece, sin variabilidad de componente ni de fabricación adicional."
  - "El ruido y el offset de entrada del op-amp como una fuente de error en la señal de salida: el Vos típico/máximo del TL072 se cita en el contrato de fidelidad como dato de referencia, pero no se inyecta como una perturbación numérica sobre la curva de Bode ni sobre el osciloscopio."
  - "Otras variantes de la topología Sallen-Key (componentes no iguales, configuración pasa-altas, pasa-banda, o de orden superior en cascada): este simulador modela únicamente la variante pasa-bajas de componentes iguales de 2.º orden."
  - "La comparación contra otras topologías de filtro activo (p. ej. Multiple Feedback, filtros de variable de estado): este laboratorio modela solo Sallen-Key, sin contrastarlo contra esas alternativas."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de R y C elegidos, y confirmación del simulador de que el diseño cumple simultáneamente la fc objetivo (dentro de tolerancia) y el punto Butterworth (Q dentro de ±0.05 de 1/√2), o la retroalimentación específica reportada (fc fuera de rango o Q lejos del punto Butterworth) cuando el diseño no cumple."
evidencia_desempeno: "Guía de observación del modo Predicción (fc, Q o tipo de respuesta predicho antes de la confirmación) y del modo Medición (identificación en vivo de cómo el barrido de f/fc traza la curva de atenuación real y coincide con la curva de Bode teórica)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la topología Sallen-Key de componentes iguales, con un solo amplificador operacional, desacopla el diseño de un filtro de 2.º orden en dos ecuaciones independientes —fc por R/C, Q por K— y qué significa el punto de respuesta Butterworth (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo R/C/Rf cambian fc/K/Q y la curva de Bode → predice fc, Q o el tipo de respuesta → barrido automático de f/fc trazando la curva de atenuación en vivo → reto de diseño de R/C para una fc objetivo en el punto Butterworth."
cierre: "Ficha técnica (capa 2) con el TL072, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con generador de funciones y osciloscopio."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Texas Instruments, 'Analysis of the Sallen-Key Architecture' (SLOA024B, J. Karki) — https://www.ti.com/lit/an/sloa024b/sloa024b.pdf: derivación de referencia de la función de transferencia, fc, K y Q de la topología Sallen-Key de componentes iguales; fuente principal de este modelo."
  - "Texas Instruments, 'Active Filter Design Techniques' (SLOA088, T. Kugelstadt, cap. 16 de 'Op Amps for Everyone') — https://www.ti.com/lit/an/sloa088/sloa088.pdf: fuente de la discusión sobre el límite de ancho de banda de ganancia (GBP) del op-amp real y su efecto sobre la respuesta del filtro."
  - "Texas Instruments, 'Analog Engineer's Circuit: Single-supply, 2nd-order, Sallen-Key low-pass filter circuit' (SBOA226) — https://www.ti.com/lit/an/sboa226/sboa226.pdf: ejemplo de diseño de referencia, consultado para contrastar valores típicos de componentes y el procedimiento de diseño."
  - "Texas Instruments, hoja de datos del TL072 — https://www.ti.com/lit/ds/symlink/tl072.pdf: fuente de GBW, slew rate y offset de entrada citados en el contrato de fidelidad."
  - "Kenneth A. Kuhn, 'Sallen-Key Low-pass Filter' — http://www.kennethkuhn.com/students/ee351/filters/sallen_key_lp.pdf: nota técnica de referencia, consultada para contrastar la derivación de fc/K/Q y el comportamiento cerca del punto de inestabilidad (K→3)."
  - "Sedra, A. S. y Smith, K. C., 'Microelectronic Circuits': texto de referencia de electrónica analógica, consultado para contrastar la clasificación cualitativa de la respuesta según Q (sobre-amortiguada / Butterworth / con pico / inestable)."
  - "elprocus.com, 'Sallen Key Filter: Circuit, Working, Transfer Function & Its Applications' — https://www.elprocus.com/sallen-key-filter/: tutorial técnico de referencia, consultado como fuente de convergencia adicional."
  - "electronics-tutorials.ws, 'Sallen-Key Filter Design' — https://www.electronics-tutorials.ws/filter/sallen-key-filter.html: tutorial técnico adicional, consultado como fuente de convergencia."
banderas_incertidumbre:
  - "⚑ El umbral de clasificación 'inestable' (Q>8) y el margen de tolerancia del punto Butterworth (±0.03 en Q) son elecciones de diseño pedagógico de este simulador para hacer observable la transición cualitativa, no cifras tomadas literalmente de una única hoja de datos — confirmar si el margen es razonable para fines de enseñanza o si conviene ajustarlo."
  - "⚑ La observación de que K≈1.586 rara vez cae sobre una razón exacta de resistores comerciales de la serie E12/E24 es una generalización de diseño práctico ampliamente reconocida en la literatura de filtros activos, no una cifra de una única fuente — confirmar con el responsable curricular si conviene añadir una nota sobre selección de resistores de precisión o redes de dos resistores en paralelo/serie para aproximar mejor K objetivo."
  - "⚑ Submódulo curricular ('Filtros activos de 2.º orden') no verificado contra un catálogo externo del plan vigente — mismo tipo de reserva ya documentada en mecanica-32/d2-11, mecanica-33/d2-12 y mecanica-34/d2-13."
  - "✅ Verificación con Playwright de este simulador: COMPLETA — 22/22 pruebas PASS, cero errores de consola/página durante toda la interacción. Verificado con Chromium headless contra `public/labs/sallenkey.html` servido por HTTP local: fc=1/(2πRC), K=1+Rf/Rg y Q=1/(3−K) de `solveSallenKey()` coinciden con fórmulas derivadas de forma independiente; el punto Butterworth (Rf=5.86 kΩ → K≈1.586, Q≈0.7071) se alcanza y se clasifica correctamente como 'butter'; el extremo de alta Q (Rf=19 kΩ → K≈2.9, Q≈10) se clasifica correctamente como 'unstable'; la función de transferencia `sallenKeyResponse()` verificada en r=1 (|H|=K·Q, fase=−90°) y r→0 (|H|→K, fase→0°); los 4 modos (Explora/Predicción/Medición/Reto) cambian `state.mode` correctamente vía `setMode()`; los botones de atajo Butterworth y Alta Q funcionan; el modo Medición ejecuta `runSweep()` sin errores; captura de pantalla confirma render correcto del banco 3D, la curva de Bode (magnitud/fase) y el osciloscopio."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimocuarta práctica de Tanda 1 / D2, cuarta y última del
   sub-arco de circuitos integrados analógicos):** d2-14 cierra el sub-arco que abrió d2-11
   (op-amp), continuó d2-12 (comparador Schmitt trigger) y d2-13 (temporizador 555 astable),
   volviendo al mismo tipo de amplificador operacional (TL072) de d2-11 pero ahora en una
   topología de dos polos con realimentación positiva y negativa simultáneas, en vez de una
   sola etapa de ganancia lineal o un comparador con histéresis. El eje pedagógico se mueve de
   "amplificar o decidir" a "moldear la respuesta en frecuencia" — el primer contacto del
   alumno, en esta tanda, con una curva de Bode de 2.º orden y con el concepto de factor de
   calidad Q.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/sallenkey.html](../../../public/labs/sallenkey.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) con las fórmulas exactas de fc, K y Q,
   la función de transferencia completa usada para la curva de Bode, y las especificaciones
   reales del TL072, documentado en la sección 2 de la ficha técnica in-app — de modo que el
   alumno y el evaluador ven las fronteras del modelo dentro de la práctica misma.
3. **Verificación de implementación:** COMPLETA. Se ejecutó una verificación con Playwright
   (Chromium headless, sirviendo `public/labs/` por HTTP local en el puerto 8541) contra
   `sallenkey.html`: 22/22 pruebas PASS, cero errores de consola o de página durante toda la
   interacción. Se verificó `solveSallenKey()` (fc=1/(2πRC), K=1+Rf/Rg, Q=1/(3−K)) contra
   fórmulas derivadas de forma independiente; el punto Butterworth (K≈1.586→Q≈0.7071,
   clasificado 'butter') y el extremo de alta Q (K≈2.9→Q≈10, clasificado 'unstable'); la
   función de transferencia `sallenKeyResponse()` en r=1 (|H|=K·Q, fase=−90°) y r→0 (|H|→K,
   fase→0°); el cambio entre los 4 modos vía `setMode()`; los botones de atajo Butterworth y
   Alta Q; y la ejecución de `runSweep()` en modo Medición sin errores. Una captura de pantalla
   del modo Explora confirmó el render correcto del banco 3D, la curva de Bode
   (magnitud/fase) y el osciloscopio virtual.
4. **Petición concreta al experto:** (a) confirmar la clave exacta del submódulo curricular
   ("Filtros activos de 2.º orden") contra el plan vigente, dado que no fue verificada contra
   un catálogo externo; (b) confirmar si el umbral de clasificación "inestable" (Q>8) y el
   margen de tolerancia del punto Butterworth (±0.03 en Q) son razonables para fines de
   enseñanza o si conviene ajustarlos; (c) confirmar si conviene añadir, en una práctica
   posterior, una nota sobre cómo aproximar K objetivo con resistores comerciales de la serie
   E12/E24 (redes en paralelo/serie), dado que K≈1.586 rara vez cae sobre una razón exacta
   disponible comercialmente; (d) confirmar si el TL072 sigue siendo representativo de lo que
   un técnico encuentra en campo para esta aplicación, o si convendría contrastar contra otra
   familia de op-amps de mayor ancho de banda para aplicaciones de filtrado a frecuencias más
   altas.
