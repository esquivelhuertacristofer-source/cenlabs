# Ficha de práctica — Convertidor reductor (buck): D, rizo de IL y CCM/DCM (`mecanica-36`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimoquinta práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, primera del sub-arco de electrónica de potencia (fuentes conmutadas), que se
> abre aquí tras cerrar el sub-arco de circuitos integrados analógicos con mecanica-32/d2-11
> (amplificador operacional), mecanica-33/d2-12 (comparador Schmitt trigger), mecanica-34/d2-13
> (temporizador astable 555) y mecanica-35/d2-14 (filtro activo Sallen-Key). El eje pedagógico
> se mueve de "procesar una señal" a "convertir y regular energía": el primer contacto del
> alumno, en esta tanda, con una topología de conmutación de potencia (buck), el balance
> volt-segundo de un inductor, y la frontera entre conducción continua y discontinua.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-36
sector: mecanica-electronica
practica_maestra: "d2-15 — Diseña un convertidor buck y selecciona L y C: D=Vout/Vin, ΔIL=Vout(1−D)/(L·fsw) y la frontera CCM/DCM (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-III.1 (Mecatrónica, Módulo III, Submódulo 1) — confirmado por lectura directa de la fila de d2-15 en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila 15, columna de trazabilidad)"
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Electrónica de potencia — convertidores conmutados CC-CC (topología buck)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23/32/33/34/35; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de reconocer la topología de un convertidor reductor
  (buck): transistor de conmutación, diodo de rueda libre, inductor de almacenamiento y
  capacitor de filtrado; deducir que en modo de conducción continua (CCM) el balance
  volt-segundo del inductor fija el ciclo de trabajo D=Vout/Vin, independiente de la corriente
  de carga; calcular el rizo de corriente del inductor ΔIL=Vout(1−D)/(L·fsw) y la corriente
  crítica Icrit=ΔIL/2 que marca la frontera con el modo de conducción discontinua (DCM);
  identificar cuándo un convertidor cruza de CCM a DCM al reducir la corriente de carga; leer
  la composición del rizo de voltaje de salida ΔVout en su término capacitivo y su término por
  resistencia serie equivalente (ESR); y diseñar un punto de operación (Vout, Iout, L, C) que
  se mantenga en CCM con un rizo de salida dentro de una tolerancia objetivo.
actividad_clave: >
  Sobre un banco 3D con fuente de 12 V, capacitor de entrada, un regulador tipo LM2596, diodo
  Schottky 1N5825, inductor y capacitor de salida, en el modo Explora ajusta Vout, L, C e Iout
  con steppers y observa D, ΔIL, la clasificación CCM/DCM, la forma de onda triangular de IL, el
  osciloscopio del nodo de conmutación y la composición del rizo de salida actualizarse en
  tiempo real; en Predicción, predice D, el rizo ΔVout o el modo de conducción antes de revelar
  el valor real; en Medición, ejecuta un barrido automático de corriente de salida que traza en
  una tabla cómo D, ΔIL y el modo cambian punto por punto; y en el Reto, diseña un punto de
  operación que se mantenga en CCM con un rizo de salida menor al 2% del voltaje nominal,
  recibiendo retroalimentación específica sobre qué condición falla cuando el diseño no cumple.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: fuente Vin=12 V, capacitor de entrada Cin, el bloque de conmutación (LM2596) entre el nodo de entrada y el nodo de conmutación, el diodo de rueda libre (1N5825) del nodo de conmutación a tierra, el inductor L del nodo de conmutación al nodo de salida, y el capacitor de salida Cout junto con la carga entre el nodo de salida y tierra."
  - "Modo Explora: ajusta Vout, L, C e Iout con los steppers del panel, y observa D, ΔIL, Icrit, la clasificación del modo de conducción (color/etiqueta), la forma de onda triangular de IL sobre un periodo de conmutación, el osciloscopio del nodo de conmutación (onda cuadrada con ancho D·T) y las barras de composición de ΔVout actualizarse en tiempo real."
  - "Verifica que D=Vout/Vin depende únicamente de Vout y Vin (L, C e Iout no lo mueven), que ΔIL=Vout(1−D)/(L·fsw) depende de Vout, D, L y fsw (no de Iout ni de C), y que la corriente promedio del inductor ILavg siempre iguala a Iout en estado estable."
  - "Confirma que el simulador clasifica automáticamente el modo de conducción comparando Iout contra Icrit=ΔIL/2: CCM si Iout≥Icrit (con un margen adicional que distingue 'CCM cerca del límite' de 'CCM franco'), DCM si Iout<Icrit — y que reducir Iout manteniendo L, C y Vout fijos es lo que empuja al convertidor hacia DCM, no un cambio en L, C o Vout."
  - "Confirma que el rizo de voltaje de salida ΔVout se calcula como la suma de un término capacitivo ΔIL/(8·C·fsw) y un término resistivo ESR·ΔIL, y que el simulador muestra ambos términos por separado en una barra apilada, dejando ver cuál domina según los valores de C y ESR elegidos."
  - "Modo Predicción: predice D, el rizo ΔVout o el modo de conducción (CCM/DCM) con los valores actuales de Vout/L/C/Iout, antes de que el simulador confirme el valor real."
  - "Modo Medición: ejecuta un barrido automático de corriente de salida (Iout) y observa cómo se traza punto por punto, en una tabla en vivo, D, ΔIL, el modo de conducción y ΔVout reales en cada punto del barrido."
  - "Modo Reto: diseña un punto de operación (Vout, Iout) que se mantenga en modo CCM con un rizo de salida menor al 2% del voltaje nominal, y verifica que el simulador reporta la razón específica de incumplimiento (Vout no alcanzado, Iout no alcanzado, modo DCM, o rizo excesivo) cuando el diseño no cumple."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (fuente, resistor, capacitor, diodo, inductor, interruptor, tierra) — el estándar de representación de este lab."
  - "⚑ No se identificó una norma que aplique directamente al diseño de un convertidor buck a nivel de componente (columna 'Norma ancla' = '—' en docs/LISTA-MAESTRA-200-PRACTICAS.md, fila 15) — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-23/d2-10 y mecanica-32/d2-11 a mecanica-35/d2-14; el ancla técnica de esta práctica son las notas de aplicación estándar del fabricante (Texas Instruments) y los textos de referencia de electrónica de potencia (Erickson & Maksimovic), no una norma."
simulador_modela:      # 🔒
  - "Ciclo de trabajo D=Vout/Vin en modo de conducción continua (CCM), derivado del balance volt-segundo del inductor — verificado algebraicamente contra la derivación estándar de TI SLVA477B ('Basic Calculation of a Buck Converter's Power Stage')."
  - "Rizo de corriente del inductor ΔIL=Vout(1−D)/(L·fsw), la corriente crítica Icrit=ΔIL/2 que marca la frontera CCM/DCM, y la corriente promedio de entrada Iin_avg=D·Iout — verificados contra TI SLVA477B y TI SLVA057 ('Understanding Buck Power Stages in Switchmode Power Supplies')."
  - "Clasificación automática del modo de conducción (CCM franco, CCM cerca del límite, DCM) comparando Iout contra Icrit, con la forma de onda triangular de IL dibujada tanto en su forma 'ideal' (puede cruzar a valores negativos en DCM, mostrada punteada) como en su forma físicamente recortada en cero (mostrada sólida)."
  - "Composición del rizo de voltaje de salida ΔVout≈ΔIL/(8·C·fsw)+ESR·ΔIL en su término capacitivo y su término por resistencia serie equivalente — verificada contra TI SLVA630A ('Output Ripple Voltage of Buck Switching Regulators')."
  - "Punto de referencia de diseño del LM2596 (Vin=12 V, Vout=5 V, Iout=3 A, fsw=150 kHz, L=68 µH, Cout=220 µF/25 V, Cin=470 µF/50 V, diodo 1N5825) citado en el contrato de fidelidad, verificado contra la hoja de datos del LM2596 (SNVS124)."
  - "Modo Reto con un punto de operación objetivo aleatorio (Vout, Iout) y la restricción de mantener CCM con rizo de salida menor al 2%, y modo Medición con barrido automático de Iout que traza D/ΔIL/modo/ΔVout punto por punto."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La relación de conversión real en modo de conducción discontinua (DCM): en DCM, D=Vout/Vin deja de ser válida y la relación real M(D,K) depende también de la carga (a través del parámetro adimensional K=2L/(R·Tsw)); este simulador solo clasifica cuándo el convertidor entra en DCM, sin calcular la relación de conversión real en ese régimen — se aborda en un laboratorio posterior (d2-16, boost/flyback)."
  - "Las pérdidas por conmutación y por conducción del transistor y del diodo, y por lo tanto la eficiencia η del convertidor: este simulador asume una conversión de energía ideal, sin calcular disipación de potencia en ningún componente."
  - "La rectificación síncrona (reemplazar el diodo con un segundo transistor sincronizado): este simulador modela únicamente la rectificación con diodo Schottky pasivo."
  - "La dinámica de lazo cerrado y su compensación (respuesta transitoria ante cambios de carga o de línea, estabilidad del lazo de realimentación): este simulador calcula únicamente el punto de operación en estado estable, sin modelar ningún transitorio ni la red de compensación."
  - "La tolerancia real de fabricación de L y C, y la saturación del núcleo del inductor a corrientes altas: este simulador calcula ΔIL, Icrit y ΔVout de forma exacta según los valores discretos que ofrece, sin variabilidad de componente ni límite físico de saturación."
  - "Los valores de ESR de la tabla de capacitores de este simulador son cifras típicas genéricas para fines didácticos (documentado en la 'Nota de rigor' del contrato de fidelidad), no datos literales de un fabricante específico."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de Vout e Iout elegidos, y confirmación del simulador de que el diseño cumple simultáneamente el Vout objetivo, el Iout objetivo, el modo CCM y un rizo de salida menor al 2% del voltaje nominal, o la retroalimentación específica reportada (cuál de las cuatro condiciones falla) cuando el diseño no cumple."
evidencia_desempeno: "Guía de observación del modo Predicción (D, ΔVout o modo de conducción predicho antes de la confirmación) y del modo Medición (identificación en vivo de cómo el barrido de Iout traza el cruce de CCM a DCM y su efecto sobre D, ΔIL y ΔVout)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué casi toda fuente de alimentación moderna usa un convertidor conmutado en vez de un regulador lineal, cómo el balance volt-segundo del inductor fija D=Vout/Vin en CCM, y qué significa la frontera entre conducción continua y discontinua (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo Vout/L/C/Iout cambian D/ΔIL/el modo de conducción → predice D, el rizo o el modo → barrido automático de Iout trazando el cruce CCM/DCM en vivo → reto de diseño de un punto de operación en CCM con rizo de salida bajo control."
cierre: "Ficha técnica (capa 2) con el LM2596 y el diodo 1N5825, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con osciloscopio y sonda de corriente."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Texas Instruments, 'Basic Calculation of a Buck Converter's Power Stage' (SLVA477B) — https://www.ti.com/lit/an/slva477b/slva477b.pdf: fuente principal de las ecuaciones de D, ΔIL y selección de L y C de este modelo."
  - "Texas Instruments, 'Understanding Buck Power Stages in Switchmode Power Supplies' (SLVA057) — https://www.ti.com/lit/an/slva057/slva057.pdf: fuente de la derivación de la forma de onda triangular de IL en CCM y de la frontera con DCM."
  - "Texas Instruments, 'Output Ripple Voltage of Buck Switching Regulators' (SLVA630A) — https://www.ti.com/lit/an/slva630a/slva630a.pdf: fuente de la descomposición del rizo de salida en su término capacitivo y su término por ESR."
  - "Texas Instruments, hoja de datos del LM2596 (SNVS124) — https://www.ti.com/lit/ds/symlink/lm2596.pdf: fuente del punto de referencia de diseño (fsw=150 kHz, Iout máx=3 A, rango de Vin) citado en el contrato de fidelidad."
  - "Erickson, R. W. y Maksimovic, D., 'Fundamentals of Power Electronics' (cap. 2 y 5): texto de referencia de electrónica de potencia, consultado para contrastar el análisis volt-segundo y el balance de carga del capacitor que fundamentan D=Vout/Vin y la frontera CCM/DCM."
banderas_incertidumbre:
  - "⚑ El margen que distingue 'CCM cerca del límite' de 'CCM franco' (Iout a menos del 25% por encima de Icrit) es una elección de diseño pedagógico de este simulador para hacer observable la aproximación gradual a la frontera DCM, no una cifra tomada literalmente de una única hoja de datos — confirmar si el margen es razonable para fines de enseñanza o si conviene ajustarlo."
  - "⚑ Los valores de ESR de la tabla de capacitores (0.05–0.30 Ω) son cifras típicas genéricas de capacitores electrolíticos de baja ESR en ese rango de capacitancia/voltaje, no datos literales de un fabricante específico — documentado explícitamente en el contrato de fidelidad ('Nota de rigor'); confirmar con el responsable curricular si conviene anclarlos a una familia de componentes comercial concreta."
  - "⚑ Submódulo curricular ('Electrónica de potencia — convertidores conmutados CC-CC') no verificado contra un catálogo externo del plan vigente — mismo tipo de reserva ya documentada en mecanica-32/d2-11 a mecanica-35/d2-14."
  - "✅ Verificación con Playwright completada (27/27 verificaciones automatizadas pasaron, ver nota 3 más abajo)."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimoquinta práctica de Tanda 1 / D2, primera del sub-arco de
   electrónica de potencia):** d2-15 abre un nuevo sub-arco tras cerrar el de circuitos
   integrados analógicos con d2-11 (op-amp), d2-12 (comparador Schmitt trigger), d2-13
   (temporizador 555 astable) y d2-14 (filtro activo Sallen-Key). El eje pedagógico se mueve de
   "procesar una señal" a "convertir y regular energía" — el primer contacto del alumno, en
   esta tanda, con una topología de conmutación de potencia, el balance volt-segundo de un
   inductor, y la frontera entre conducción continua (CCM) y discontinua (DCM). El sub-arco de
   potencia continuará en d2-16 con un convertidor boost/flyback, donde se abordará la relación
   de conversión real en DCM (M(D,K)) deliberadamente diferida en esta práctica.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/buck.html](../../../public/labs/buck.html)) muestra el panel "🔒 Contrato de
   fidelidad" (Sí modela / NO modela) con las fórmulas exactas de D, ΔIL, Icrit y ΔVout, el
   punto de referencia de diseño del LM2596, y la nota de rigor sobre los valores de ESR,
   documentado en la sección 2 de la ficha técnica in-app — de modo que el alumno y el
   evaluador ven las fronteras del modelo dentro de la práctica misma.
3. **Verificación de implementación:** ✅ Completada. Se ejecutó una verificación automatizada
   con Playwright (Chromium headless, sirviendo `public/labs/` por HTTP local en el puerto 8541)
   contra `buck.html`, análoga a la realizada en mecanica-35/d2-14. Resultado: **27/27
   verificaciones pasaron**, cubriendo: ausencia de errores de consola/página; las fórmulas de
   `solveBuck()` (D=Vout/Vin, ΔIL=Vout(1−D)/(L·fsw), Icrit=ΔIL/2, ILavg/ILpeak/ILvalley,
   IinAvg=D·Iout, ΔVout=ΔVoutC+ΔVoutESR) contrastadas contra cálculos derivados de forma
   independiente; la clasificación CCM/DCM tanto en el punto de referencia (Iout=3A → CCM) como
   en un caso forzado a DCM (Iout=0.1A); el botón de referencia LM2596 (`btnRef`, que fija
   Vout=5V, L=68µH, Cout=220µF, Iout=3A) y el botón de forzado a DCM (`btnDCM`); los 3 tipos de
   predicción del modo Predicción (D, rizo ΔIL y modo CCM/DCM), cada uno validado con una
   predicción correcta que produce el toast ✅; el barrido automático de `runSweep()` en modo
   Medición, confirmando que produce exactamente 7 puntos (uno por cada valor de `IOUT_VALS`)
   incluyendo al menos un punto en CCM y uno en DCM; y la generación de un objetivo válido
   (`vout`/`iout`/`rippleMaxPct`) en modo Reto.
4. **Petición concreta al experto:** (a) confirmar la clave exacta del submódulo curricular
   ("Electrónica de potencia — convertidores conmutados CC-CC") contra el plan vigente, dado
   que no fue verificada contra un catálogo externo; (b) confirmar si el margen que distingue
   "CCM cerca del límite" de "CCM franco" (25% por encima de Icrit) es razonable para fines de
   enseñanza o si conviene ajustarlo; (c) confirmar si los valores de ESR de la tabla de
   capacitores son suficientemente representativos o si conviene anclarlos a una familia
   comercial concreta; (d) confirmar si el LM2596 sigue siendo representativo de lo que un
   técnico encuentra en campo para esta aplicación, o si convendría contrastar contra otra
   familia de reguladores conmutados (p. ej. con rectificación síncrona) para una práctica
   posterior.
