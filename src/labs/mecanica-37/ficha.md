# Ficha de práctica — Convertidor elevador (boost): Vout=Vin/(1−D), frontera CCM/DCM y M(D,K) (`mecanica-37`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimosexta práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, segunda del sub-arco de electrónica de potencia (fuentes conmutadas), que
> continúa directamente tras mecanica-36/d2-15 (convertidor buck). El eje pedagógico avanza
> de D=Vout/Vin en CCM (buck, independiente de la carga) a Vout=Vin/(1−D) en CCM (boost,
> también independiente de la carga), y añade lo que la ficha de mecanica-36 dejó
> deliberadamente diferido: la ganancia real M(D,K) en modo de conducción discontinua
> (DCM), donde la relación ideal deja de cumplirse y el voltaje de salida "se eleva" al
> aligerar la carga. La fila de d2-16 en la lista maestra se titula "Analiza boost/flyback y
> los modos CCM/DCM"; este laboratorio modela en profundidad la topología boost y menciona el
> flyback solo de forma cualitativa (ver `simulador_NO_modela`), una decisión de alcance
> documentada explícitamente más abajo.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-37
sector: mecanica-electronica
practica_maestra: "d2-16 — Analiza boost/flyback y los modos CCM/DCM: Vo=Vin/(1−D) en CCM y la ganancia real M(D,K) en DCM (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-III.1 (Mecatrónica, Módulo III, Submódulo 1) — confirmado por lectura directa de la fila de d2-16 en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila 16, columna de trazabilidad)"
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Electrónica de potencia — convertidores conmutados CC-CC (topología boost/flyback)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23/32…36; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de reconocer la topología de un convertidor
  elevador (boost): inductor entre la fuente y el nodo de conmutación, transistor de
  conmutación a tierra, diodo del nodo de conmutación al nodo de salida, y capacitor de
  filtrado; deducir que en modo de conducción continua (CCM) el balance volt-segundo del
  inductor fija la ganancia Vout/Vin=1/(1−D), independiente de la corriente de carga;
  calcular el rizo de corriente del inductor ΔIL=Vin·D/(L·fsw); determinar la frontera entre
  CCM y DCM comparando el parámetro K=2L/(R·Ts) contra el valor crítico Kcrit(D)=D(1−D)²;
  calcular la ganancia real en conducción discontinua M(D,K)=[1+√(1+4D²/K)]/2 y explicar por
  qué el voltaje de salida se "eleva" respecto a la predicción ingenua de CCM al aligerar la
  carga; leer la composición del rizo de voltaje de salida ΔVout en su término capacitivo y
  su término por resistencia serie equivalente (ESR); y diseñar un punto de operación (Vin,
  D, R) que alcance un voltaje de salida objetivo en modo CCM con un rizo de corriente del
  inductor dentro de una tolerancia objetivo.
actividad_clave: >
  Sobre un banco 3D con fuente Vin variable, capacitor de entrada, inductor, un regulador
  tipo TPS61030, diodo y capacitor de salida, en el modo Explora ajusta Vin, D, L, C y la
  resistencia de carga R con steppers y observa K, Kcrit, la clasificación CCM/DCM, la forma
  de onda real de IL (triangular en CCM, de tres subintervalos en DCM), el osciloscopio del
  nodo de conmutación y la composición del rizo de salida actualizarse en tiempo real; en
  Predicción, predice el voltaje real de salida, el rizo ΔIL o el modo de conducción antes de
  revelar el valor real; en Medición, ejecuta un barrido automático de la resistencia de carga
  que traza en una tabla cómo el voltaje real, el voltaje ideal de CCM y el modo cambian punto
  por punto conforme la carga se aligera; y en el Reto, alcanza un voltaje de salida objetivo
  en modo CCM con un rizo de corriente menor al 2% del voltaje de salida, recibiendo
  retroalimentación específica sobre qué condición falla cuando el diseño no cumple.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: fuente Vin, capacitor de entrada Cin, el inductor L conectado entre el nodo de entrada y el nodo de conmutación, el interruptor de potencia del nodo de conmutación a tierra, el diodo del nodo de conmutación al nodo de salida, y el capacitor de salida Cout junto con la resistencia de carga R entre el nodo de salida y tierra."
  - "Modo Explora: ajusta Vin, D, L, C y R con los steppers del panel, y observa K, Kcrit(D), la clasificación del modo de conducción (color/etiqueta), la forma de onda real de IL sobre un periodo de conmutación, el osciloscopio del nodo de conmutación (onda cuadrada con polaridad invertida respecto al buck: baja durante el encendido del interruptor, alta durante la conducción del diodo) y las barras de composición de ΔVout actualizarse en tiempo real."
  - "Verifica con el punto de referencia (botón dedicado, Vin=3.6 V, D=28%, L=6.8 µH, Cout=220 µF/80 mΩ, R=2.5 Ω) que Vout/Vin=1/(1−D) produce exactamente Vout=5 V e Iout=Vout/R=2 A en CCM, y que este valor depende únicamente de Vin y D (L, C y R no lo mueven mientras el convertidor permanezca en CCM)."
  - "Confirma que ΔIL=Vin·D/(L·fsw) depende de Vin, D, L y fsw (no de R ni de C), y que la frontera CCM/DCM se determina comparando K=2L/(R·Ts) contra Kcrit(D)=D(1−D)²: CCM si K≥Kcrit, DCM si K<Kcrit — y que aumentar R (aligerar la carga) manteniendo Vin, D y L fijos es lo que empuja al convertidor hacia DCM."
  - "Con el botón de forzado a DCM (mismo punto de referencia pero R=250 Ω), confirma que K=0.033 cae por debajo de Kcrit=0.145 y que el voltaje real de salida (M(D,K)≈2.13 → Vout≈7.66 V) supera a la predicción ingenua de CCM (Vin/(1−D)=5 V) — el fenómeno de elevación en carga ligera."
  - "Confirma que el rizo de voltaje de salida ΔVout se calcula como la suma de un término capacitivo Iout·D/(C·fsw) y un término resistivo ESR·Iout, y que el simulador muestra ambos términos por separado en una barra apilada, dejando ver cuál domina según los valores de C y ESR elegidos."
  - "Modo Predicción: predice el voltaje real de salida, el rizo ΔIL o el modo de conducción (CCM/DCM) con los valores actuales de Vin/D/L/C/R, antes de que el simulador confirme el valor real."
  - "Modo Medición: ejecuta un barrido automático de la resistencia de carga R (de carga pesada/CCM a carga ligera/DCM) y observa cómo se traza punto por punto, en una tabla en vivo, el voltaje real, el voltaje ideal de CCM y el modo de conducción reales en cada punto del barrido."
  - "Modo Reto: alcanza un voltaje de salida objetivo (a partir de un Vin y D objetivo generados al azar) manteniendo el convertidor en modo CCM con un rizo de corriente menor al 2% del voltaje de salida, y verifica que el simulador reporta la razón específica de incumplimiento (Vin/D/R incorrectos, modo DCM, o rizo excesivo) cuando el diseño no cumple."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (fuente, resistor, capacitor, diodo, inductor, interruptor, tierra) — el estándar de representación de este lab."
  - "⚑ No se identificó una norma que aplique directamente al diseño de un convertidor boost a nivel de componente (columna 'Norma ancla' = '—' en docs/LISTA-MAESTRA-200-PRACTICAS.md, fila 16) — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-23/d2-10 y mecanica-32/d2-11 a mecanica-36/d2-15; el ancla técnica de esta práctica son las notas de aplicación estándar del fabricante (Texas Instruments) y los textos de referencia de electrónica de potencia (Erickson & Maksimovic), no una norma."
simulador_modela:      # 🔒
  - "Ganancia de voltaje ideal en modo de conducción continua (CCM), convertidor sin pérdidas: Vout/Vin=1/(1−D), derivada del balance volt-segundo del inductor — verificada contra Erickson & Maksimovic cap.5 y TI SLVA061 sección 2.1."
  - "Rizo de corriente del inductor pico a pico ΔIL=Vin·D/(L·fsw), idéntico en CCM y DCM porque la corriente siempre parte de un valor conocido al inicio del intervalo de encendido — verificado contra TI SLVA061 sección 2.2 y la hoja de datos TPS61030/TPS61031/TPS61032 (SLUS534G, ecuación 5) como verificación cruzada."
  - "Frontera CCM/DCM expresada con el parámetro adimensional K=2L/(R·Ts) contra el valor crítico Kcrit(D)=D(1−D)²: CCM mientras K≥Kcrit(D), DCM por debajo de ese punto — Erickson & Maksimovic tabla 5.1; TI SLVA061 sección 2.3."
  - "Ganancia de voltaje real en DCM: M(D,K)=Vout/Vin=[1+√(1+4D²/K)]/2 — Erickson & Maksimovic tabla 5.2 y TI SLVA061 sección 2.4 como re-deducción independiente; verificado numéricamente que M(D,K) es continua en la frontera (en K=Kcrit(D), coincide exactamente con el valor de CCM 1/(1−D))."
  - "Forma de onda de corriente de inductor de tres subintervalos en DCM (subida lineal de 0 a Ipico durante D·Ts, bajada lineal de Ipico a 0 durante D2·Ts con D2=Vin·D/(Vout−Vin), corriente en cero durante el resto del periodo), con la corriente promedio ILavg=0.5·Ipico·(D+D2) como consecuencia geométrica directa — misma fuente que da M(D,K) (Erickson & Maksimovic cap.5)."
  - "Composición del rizo de voltaje de salida ΔVout≈Iout·D/(C·fsw)+ESR·Iout en su término capacitivo y su término por resistencia serie equivalente — verificada contra TI SLVA061 sección 2.5 y la hoja de datos TPS61030 (ecuaciones 6-7) como verificación cruzada."
  - "Punto de referencia de diseño de la familia TPS61030/TPS61031/TPS61032 (Vin=3.6 V, D=28%, L=6.8 µH, Cout=220 µF/80 mΩ, R=2.5 Ω → Vout=5 V, Iout=2 A, CCM), que reproduce el ejemplo de diseño de la tabla 2 de la hoja de datos SLUS534G, citado en el contrato de fidelidad."
  - "Modo Reto con un punto de operación objetivo aleatorio (Vin, D → Vout objetivo exacto) restringido a resistencias de carga con solución CCM garantizada, y modo Medición con barrido automático de R que traza el voltaje real, el voltaje ideal de CCM y el modo punto por punto."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Rectificación síncrona: el TPS61030 real usa un MOSFET de baja RDS(on) en vez de un diodo para la rectificación de salida; este simulador usa un diodo ideal genérico para mantener las ecuaciones de M(D,K) y del límite CCM/DCM en su forma estándar de libro de texto — el comportamiento de conducción/no-conducción es equivalente para efectos de este modelo, pero la caída de voltaje directo real del MOSFET síncrono es menor que la de un diodo."
  - "Dinámica de lazo cerrado: D es una variable que el usuario controla directamente (lazo abierto), no el resultado de un lazo de realimentación que ajuste D para mantener Vout constante — decisión de diseño deliberada que permite observar el fenómeno de subida de Vout en carga ligera al entrar en DCM; en un regulador real de lazo cerrado, el control reduciría D automáticamente al aligerar la carga, ocultando este efecto."
  - "Pérdidas por conmutación, conducción del interruptor/diodo, y eficiencia (η<100%): este simulador trata el convertidor como ideal (Pin=Pout exactamente), aunque el TPS61030 real alcanza típicamente ~96% de eficiencia, no 100%."
  - "Límite de corriente interno del interruptor de potencia (hasta 4 A en el TPS61030 real): este simulador no recorta ni advierte si la corriente pico calculada superaría ese límite físico."
  - "La topología flyback (aislada galvánicamente) mencionada en el título de d2-16 de la lista maestra: este simulador solo cita, de forma cualitativa, la fórmula de ganancia CCM de un flyback (Vout/Vin=n·D/(1−D), con n la relación de vueltas) como topología emparentada al boost (TI SNVA603, guía de diseño flyback de Coilcraft, Analog Devices AN-2583), sin modelar su forma de onda, su transformador ni su diseño completo — decisión de alcance para mantener el laboratorio enfocado en el fenómeno pedagógico central (CCM/DCM/M(D,K)), no una omisión accidental."
  - "Tolerancia real de fabricación de L y C, deriva térmica de la ESR, y saturación del núcleo del inductor a corrientes altas: este simulador calcula ΔIL, K/Kcrit y ΔVout de forma exacta según los valores discretos que ofrece, sin variabilidad de componente ni límite físico de saturación."
  - "Los valores de ESR de la tabla de capacitores de este simulador son cifras típicas genéricas para fines didácticos (documentado en la 'Nota de rigor' del contrato de fidelidad), no datos literales de un fabricante específico."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de Vin, D y R elegidos, y confirmación del simulador de que el diseño alcanza el Vout objetivo, mantiene el modo CCM y un rizo de corriente menor al 2% del voltaje de salida, o la retroalimentación específica reportada (cuál de las condiciones falla) cuando el diseño no cumple."
evidencia_desempeno: "Guía de observación del modo Predicción (Vout real, rizo ΔIL o modo de conducción predicho antes de la confirmación) y del modo Medición (identificación en vivo de cómo el barrido de R traza el cruce de CCM a DCM y la elevación de Vout real sobre la predicción ingenua de CCM)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el boost es la topología dual del buck (eleva en vez de reducir), cómo el balance volt-segundo del inductor fija Vout/Vin=1/(1−D) en CCM, y qué significa la frontera K/Kcrit(D) con la ganancia real M(D,K) en DCM (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo Vin/D/L/C/R cambian K, Kcrit y el modo de conducción → predice Vout real, el rizo o el modo → barrido automático de R trazando el cruce CCM/DCM y la elevación de Vout en vivo → reto de diseño de un punto de operación en CCM con rizo bajo control."
cierre: "Ficha técnica (capa 2) con el TPS61030, el contrato de fidelidad completo (SÍ/NO modela, incluida la nota sobre el flyback) y el procedimiento de medición física con osciloscopio y sonda de corriente."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Robert W. Erickson y Dragan Maksimovic, 'Fundamentals of Power Electronics', cap.5 (CCM y DCM en convertidores no aislados): fuente principal de las ecuaciones de Vout/Vin, ΔIL, K/Kcrit(D) y M(D,K) de este modelo."
  - "Texas Instruments, 'Basic Calculation of a Boost Converter's Power Stage' (SLVA061) — https://www.ti.com/lit/an/slva061/slva061.pdf: fuente de la derivación de ΔIL, la frontera CCM/DCM, M(D,K) y la composición del rizo de salida."
  - "Texas Instruments, hoja de datos TPS61030/TPS61031/TPS61032 (SLUS534G) — https://www.ti.com/lit/ds/symlink/tps61030.pdf: fuente del punto de referencia de diseño (Vin=3.6 V, D=28%, L=6.8 µH, Cout=220 µF/80 mΩ, R=2.5 Ω → Vout=5 V) citado en el contrato de fidelidad, y de las ecuaciones 5-7 usadas como verificación cruzada."
  - "Texas Instruments, SNVA603, 'Flyback Converter Design' — https://www.ti.com/lit/an/snva603/snva603.pdf: fuente de la mención cualitativa de la topología flyback como pariente del boost."
  - "Coilcraft, guía de diseño de convertidores flyback: fuente adicional para la mención cualitativa del flyback."
  - "Analog Devices, AN-2583, 'Design Considerations for a Flyback Converter': fuente adicional para la mención cualitativa del flyback."
banderas_incertidumbre:
  - "⚑ La fila de d2-16 en docs/LISTA-MAESTRA-200-PRACTICAS.md se titula 'Analiza boost/flyback y los modos CCM/DCM', pero este simulador modela en profundidad únicamente la topología boost; el flyback se menciona solo de forma cualitativa (ver `simulador_NO_modela`) — confirmar con el responsable curricular si esta cobertura cualitativa es suficiente o si el flyback amerita un laboratorio dedicado en una tanda posterior."
  - "⚑ Los valores de ESR de la tabla de capacitores (0.025–0.15 Ω) son cifras típicas genéricas de capacitores electrolíticos de baja ESR en ese rango de capacitancia/voltaje, no datos literales de un fabricante específico — documentado explícitamente en el contrato de fidelidad ('Nota de rigor'); confirmar con el responsable curricular si conviene anclarlos a una familia de componentes comercial concreta."
  - "⚑ Submódulo curricular ('Electrónica de potencia — convertidores conmutados CC-CC') no verificado contra un catálogo externo del plan vigente — mismo tipo de reserva ya documentada en mecanica-32/d2-11 a mecanica-36/d2-15."
  - "⚑ El modo Reto restringe la resistencia de carga aleatoria a los primeros cuatro valores de la tabla (2.5, 5, 10 y 25 Ω) para garantizar que exista una combinación de L que mantenga CCM en el punto objetivo — confirmar si esta restricción pedagógica es razonable o si conviene ampliarla."
  - "✅ Verificación con Playwright completada (32/32 verificaciones automatizadas pasaron, ver nota 3 más abajo)."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimosexta práctica de Tanda 1 / D2, segunda del sub-arco de
   electrónica de potencia):** d2-16 continúa el sub-arco abierto por d2-15 (buck). El eje
   pedagógico avanza de una ganancia de CCM independiente de la carga (D=Vout/Vin en el buck)
   a otra también independiente de la carga en CCM (Vout=Vin/(1−D) en el boost), y añade lo
   que la ficha de mecanica-36 dejó explícitamente diferido: la relación de conversión real en
   modo de conducción discontinua, M(D,K), que sí depende de la carga a través del parámetro
   K. Este laboratorio cierra ese ciclo narrativo de dos prácticas (buck → boost) sobre
   convertidores CC-CC no aislados antes de que la Tanda 1 avance a acondicionamiento de
   señal analógico (d2-17, amplificador de instrumentación) y térmica de potencia (d2-18,
   clase AB y disipador).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/boost.html](../../../public/labs/boost.html)) muestra el panel "🔒 Contrato
   de fidelidad" (Sí modela / NO modela) con las fórmulas exactas de Vout/Vin, ΔIL, K/Kcrit(D)
   y M(D,K), el punto de referencia de diseño del TPS61030, la nota sobre el alcance
   deliberadamente cualitativo del flyback, y la nota de rigor sobre los valores de ESR,
   documentado en la sección 2 de la ficha técnica in-app.
3. **Verificación de implementación:** ✅ Completada. Se ejecutó una verificación automatizada
   con Playwright (Chromium headless, sirviendo `public/labs/` por HTTP local en el puerto 8541)
   contra `boost.html`, análoga a la realizada en mecanica-35/d2-14 y mecanica-36/d2-15.
   Resultado: **32/32 verificaciones pasaron**, cubriendo: ausencia de errores de consola/página
   tanto al cargar como tras todo el flujo de interacción; las fórmulas de `solveBoost()`
   (Vout/Vin=1/(1−D) en CCM, ΔIL=Vin·D/(L·fsw), K=2L/(R·Ts), Kcrit(D)=D(1−D)², M(D,K), D2,
   ILavg, ΔVout=ΔVoutC+ΔVoutESR) contrastadas contra una reimplementación independiente de las
   mismas ecuaciones; la continuidad de M(D,K) en la frontera K=Kcrit (coincide exactamente con
   la ganancia ingenua de CCM 1/(1−D) en ese punto); la clasificación CCM/DCM tanto en el punto
   de referencia (Vin=3.6 V, D=28%, L=6.8 µH, R=2.5 Ω → CCM, Vout=5.00 V, Iout=2.00 A, coincide
   con la tabla 2 del datasheet TPS61030) como en el punto forzado a DCM (mismo Vin/D/L,
   R=250 Ω → DCM, Vout=7.6625 V, mayor que la predicción ingenua de CCM de 5 V, confirmando el
   fenómeno de elevación en carga ligera); las cantidades intermedias de la forma de onda DCM
   (Ipico=ΔIL, D2=Vin·D/(Vout−Vin), ILavg=0.5·Ipico·(D+D2)); el botón de referencia TPS61030
   (`btnRef`, que fija Vin=3.6 V, D=28%, L=6.8 µH, C=220 µF, R=2.5 Ω) y el botón de forzado a
   DCM (`btnDCM`, que fija R=250 Ω conservando el resto); los 3 tipos de predicción del modo
   Predicción (Vout real, rizo ΔIL y modo CCM/DCM), cada uno validado con una predicción
   correcta que produce el toast ✅; el barrido automático de `runSweep()` en modo Medición
   sobre la resistencia de carga R, confirmando que produce exactamente 7 puntos (uno por cada
   valor de `R_VALS`), que incluye tanto puntos en CCM como en DCM, y que cada punto coincide
   con la reimplementación independiente de `solveBoost()`; y la generación de un objetivo
   válido en modo Reto junto con su validación mediante `checkReto()` (caso con parámetros
   correctos → toast ✅ "Diseño válido").
4. **Petición concreta al experto:** (a) confirmar la clave exacta del submódulo curricular
   ("Electrónica de potencia — convertidores conmutados CC-CC") contra el plan vigente, dado
   que no fue verificada contra un catálogo externo; (b) confirmar si la cobertura
   exclusivamente cualitativa del flyback (sin forma de onda ni diseño completo) es suficiente
   para cumplir el título de la fila d2-16 de la lista maestra, o si amerita un laboratorio
   dedicado en una tanda posterior; (c) confirmar si la restricción del modo Reto a
   resistencias de carga de 2.5–25 Ω (para garantizar una solución CCM alcanzable) es
   pedagógicamente razonable; (d) confirmar si la decisión de diseño de lazo abierto (D
   controlado directamente por el usuario, sin realimentación) es aceptable para fines de
   enseñanza, dado que hace observable el fenómeno de elevación de Vout en carga ligera que un
   regulador real de lazo cerrado ocultaría; (e) confirmar si el TPS61030 sigue siendo
   representativo de lo que un técnico encuentra en campo para esta aplicación, o si convendría
   contrastar contra otra familia de elevadores síncronos para una práctica posterior.
