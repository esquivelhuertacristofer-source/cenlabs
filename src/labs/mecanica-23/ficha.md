# Ficha de práctica — Pérdidas de un MOSFET de potencia en PWM (`mecanica-23`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** décima y última práctica de la **Tanda 1 (D2 — Electrónica analógica y
> de potencia)**, cerrando el arco iniciado en mecanica-14/18 (diodo), continuado en
> mecanica-19/20/21 (BJT) y mecanica-22 (MOSFET, regiones de operación). Retoma el mismo
> MOSFET de canal N de mecanica-22 pero cambia el eje pedagógico de "¿en qué región opera?"
> a "¿cuánto calor disipa al conmutar?" — y es aquí donde RDS(on), que en mecanica-22 era
> solo una cifra de referencia sin uso en el cálculo, pasa a ser un parámetro activo de la
> pérdida de conducción.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-23
sector: mecanica-electronica
practica_maestra: "d2-10 — Evalúa las pérdidas de conducción y conmutación de un MOSFET de potencia en PWM: Pcond=D·I²·RDS(on), Psw=½·V·I·fsw·(tr+tf), y la frecuencia de cruce donde ambas se igualan (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-III.1 (Mecatrónica, Módulo III, Submódulo 1) — liga explícita a mecanica-4 (Inversor Trifásico de Potencia) según docs/LISTA-MAESTRA-200-PRACTICAS.md"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Pérdidas y eficiencia en conmutación de potencia (PWM)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-19/20/21/22; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la pérdida de conducción de un MOSFET
  de potencia en PWM (Pcond=D·I²·RDS(on)) y su pérdida de conmutación mediante la
  aproximación lineal estándar (Psw=½·V·I·fsw·(tr+tf)); despejar y explicar la frecuencia de
  cruce fsw*=2·D·I·RDS(on)/(V·(tr+tf)) donde ambas pérdidas se igualan, y predecir cuál
  domina por encima y por debajo de ese punto; reconocer que RDS(on) y tr+tf son cifras de
  hoja de datos medidas a una condición de prueba fija del fabricante (no la del circuito
  propio) y que por tanto son estimaciones de primer orden; y distinguir un caso real de
  dato de catálogo ausente (tr+tf no especificado para el 2N7000) de una aproximación, sin
  inventar una cifra donde el fabricante no la publica.
actividad_clave: >
  Sobre un banco 3D con MOSFET, carga y osciloscopio virtual, en el modo Explora ajusta el
  bus V, la corriente de carga I, el ciclo de trabajo D y la frecuencia de conmutación fsw
  con steppers, elige entre tres MOSFET (IRF540N, IRLZ44N, 2N7000) y observa en tiempo real
  cómo se reparten Pcond y Psw en una gráfica contra fsw, con la frecuencia de cruce marcada
  en vivo; en Predicción, predice cuál pérdida domina a una fsw dada o calcula Ptot
  numéricamente antes de que el simulador lo confirme; en Barrido, anima fsw a lo largo de
  un rango y observa el cruce exacto entre Pcond y Psw; y en el Reto, ajusta D, I y fsw para
  mantener al dispositivo elegido dentro de sus límites de catálogo (ID máx, VDS máx, Ptot).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: MOSFET de canal N conmutando una carga resistiva entre un bus V y GND, con control independiente de ciclo de trabajo D y frecuencia fsw — la misma familia de dispositivo que mecanica-22, ahora en un circuito de conmutación PWM en vez de polarización DC estática."
  - "Modo Explora: ajusta V/I/D/fsw con los steppers del panel, elige entre tres MOSFET (IRF540N, IRLZ44N, 2N7000) y observa Pcond, Psw, Ptot y la posición de fsw relativa a la frecuencia de cruce actualizarse en tiempo real sobre la gráfica."
  - "Verifica que Pcond se calcula por fórmula cerrada Pcond=D·I²·RDS(on), usando el RDS(on) máximo garantizado de hoja de datos del dispositivo elegido a su condición de prueba fija (VGS e ID específicos del fabricante, no los del circuito simulado)."
  - "Verifica que Psw se calcula por la aproximación lineal estándar de libro de texto Psw=½·V·I·fsw·(tr+tf), con tr+tf tomado directamente de hoja de datos a la condición de prueba fija del fabricante (VDD, ID, RG y VGS específicos, declarados en el panel) — y que el simulador trata esa cifra como constante del dispositivo, no como función del RG real de un circuito distinto."
  - "Verifica que la frecuencia de cruce fsw*=2·D·I·RDS(on)/(V·(tr+tf)) se despeja algebraicamente de Pcond=Psw y se marca en vivo sobre la gráfica de Pcond/Psw/Ptot contra fsw; confirma que por debajo de fsw* domina la conducción y por encima domina la conmutación."
  - "Confirma la divulgación explícita del 2N7000: ninguna hoja de datos consultada especifica tr+tf para este dispositivo, así que el simulador muestra 'no disponible' para Psw y la frecuencia de cruce, y solo calcula y grafica Pcond — sin aproximar ni inventar una cifra."
  - "Modo Predicción: predice cuál pérdida domina a una fsw dada (tipo A) o calcula Ptot numéricamente con tolerancia definida (tipo B) antes de que el simulador confirme la respuesta."
  - "Modo Barrido: anima fsw a lo largo de un rango logarítmico con V/I/D fijos, y observa el cruce exacto donde Pcond y Psw se igualan, deteniéndose en ese punto."
  - "Modo Reto: ajusta D, I y fsw para mantener al dispositivo elegido dentro de sus límites de catálogo simultáneamente (ID máx, VDS máx, Ptot) para un bus V asignado."
  - "Verifica las advertencias de telemetría en vivo de sobrecorriente (I>ID máx de catálogo) y sobrepotencia (Pcond o Ptot>Ptot de catálogo), entendiendo que son comparaciones contra límites estáticos de hoja de datos a TC=25°C, no un modelo térmico dinámico — el simulador advierte pero no detiene ni recorta el cálculo cuando se exceden."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito: MOSFET de canal N, carga, fuente de bus V)."
  - "⚑ IEC 60747-8 (dispositivos semiconductores discretos — transistores de efecto de campo) podría ser la norma más pertinente para la definición y metodología de medición de tiempos de conmutación (tr, tf) que reportan los fabricantes y que usa este simulador — no se confirmó el alcance ni la vigencia exactos de la edición durante la investigación; se pide al experto confirmar aplicabilidad. Esto respondería la pregunta abierta que dejó la ficha de mecanica-22/d2-09 sobre si esta práctica hermana debía anclarse a alguna norma de eficiencia energética o de conmutación."
  - "⚑ No se identificó una NOM mexicana que aplique directamente al diseño de circuitos de conmutación con MOSFET a nivel de componente — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-22/d2-09."
simulador_modela:      # 🔒
  - "Pérdida de conducción exacta por fórmula cerrada Pcond=D·I²·RDS(on), usando el RDS(on) máximo garantizado de hoja de datos del dispositivo elegido — la misma cifra que en mecanica-22/d2-09 se mostraba solo como referencia de catálogo, ahora participando en el cálculo."
  - "Pérdida de conmutación por la aproximación lineal estándar de libro de texto Psw=½·V·I·fsw·(tr+tf), con tr+tf tomado directamente de hoja de datos a la condición de prueba fija del fabricante, declarada explícitamente en el panel junto con esa condición (VDD/ID/RG/VGS de prueba)."
  - "Frecuencia de cruce fsw*=2·D·I·RDS(on)/(V·(tr+tf)) despejada algebraicamente de Pcond=Psw, marcada en vivo sobre la gráfica de Pcond/Psw/Ptot contra fsw, con un modo Barrido que anima fsw y se detiene en el cruce exacto."
  - "Manejo explícito de dato de catálogo ausente: el 2N7000 no tiene tr+tf publicado en ninguna hoja de datos consultada, así que el simulador muestra 'no disponible' para su Psw y su frecuencia de cruce en vez de aproximar o inventar una cifra, y solo calcula su Pcond."
  - "Advertencias de telemetría en vivo contra los límites estáticos de hoja de datos del dispositivo elegido: ID máximo, VDS máximo y potencia total disipada (Ptot)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La forma de onda real no lineal de la conmutación (meseta de Miller incluida) — Psw=½·V·I·fsw·(tr+tf) trata el solape de tensión y corriente durante tr y tf como una rampa lineal, la aproximación de primer orden estándar de libro de texto, no una simulación de la transición real."
  - "La dependencia de tr+tf con la resistencia de compuerta (RG) real del circuito — tr y tf se tratan como constantes del dispositivo tomadas de la condición de prueba fija de hoja de datos, no como función del RG o el driver de compuerta que se use en un circuito real; un RG distinto al de prueba del fabricante cambia tr+tf de forma apreciable y no está capturado aquí."
  - "La pérdida de carga de compuerta (gate-drive loss, ≈½·Qg·VGS·fsw) — no se suma a Ptot; el dimensionamiento del driver de compuerta es el eje de mecanica-22/d2-09, un laboratorio distinto."
  - "La pérdida de descarga de la capacitancia de salida Coss (≈½·Coss·V²·fsw), relevante sobre todo a fsw altas — no está incluida en Psw."
  - "La recuperación inversa de diodo (Qrr) de un convertidor real con diodo de rueda libre (buck, boost, medio puente) — este laboratorio trata la carga como puramente resistiva, sin diodo de conmutación."
  - "La dependencia térmica de RDS(on) por autocalentamiento — el modelo usa el RDS(on) de catálogo a 25°C como constante fija; en operación continua real, RDS(on) sube con la temperatura de unión y Pcond real termina siendo mayor a lo mostrado aquí."
  - "La resistencia y red térmica (RθJC, RθCA, capacidad térmica) — las advertencias de Ptot comparan la disipación instantánea contra el rating estático de catálogo a TC=25°C; no hay modelo de temperatura de unión, disipador ni transitorio térmico."
  - "Los límites dinámicos de área de operación segura (SOA) — no hay curva de derrateo por pulso, energía de avalancha, ni límites de dV/dt o dI/dt."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de D, I y fsw elegidos y confirmación del simulador de que el dispositivo asignado queda dentro de sus límites de catálogo (ID máx, VDS máx, Ptot) para el bus V dado."
evidencia_desempeno: "Guía de observación del modo Predicción (pérdida dominante o Ptot numérico predicho antes de la confirmación del simulador) y del modo Barrido (ubicación de la frecuencia de cruce observada al animar fsw)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un MOSFET conmutando pierde energía por dos caminos distintos — conducción (crece con I² y D) y conmutación (crece con fsw) — y por qué RDS(on), que en la práctica anterior era solo una cifra de catálogo, ahora entra directo al cálculo (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo V/I/D/fsw reparten Pcond y Psw → predice cuál pérdida domina → barrido animado de fsw hasta el cruce → reto de diseño dentro de los límites de catálogo del dispositivo."
cierre: "Ficha técnica (capa 2) con RDS(on) y tr+tf de los tres MOSFET, el contrato de fidelidad completo (SÍ/NO modela) — incluyendo la divulgación honesta de que el 2N7000 no tiene tr+tf publicado — y el procedimiento de medición física con osciloscopio para capturar la forma de onda real de conmutación."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Ned Mohan, Tore M. Undeland, William P. Robbins, Power Electronics: Converters, Applications, and Design (Wiley) — modelo lineal de primer orden de la pérdida de conmutación Psw≈½·V·I·fsw·(tr+tf), la referencia principal del motor de cálculo de esta práctica."
  - "International Rectifier / Infineon, datasheet 'IRF540NPbF' PD-94812 (rev. 11/3/03, vigente) — RDS(on), tr, tf, ID máx, VDS máx y Ptot del IRF540N; misma hoja de datos ya usada como fuente primaria en mecanica-22/d2-09."
  - "International Rectifier, datasheet 'IRLZ44N' PD-9.1346B (25/8/97) — RDS(on), tr, tf, ID máx, VDS máx y Ptot del IRLZ44N; única hoja de datos localizada para este número de parte pese a búsqueda exhaustiva, igual que en mecanica-22/d2-09."
  - "Fairchild Semiconductor, datasheet '2N7000.SAM' Rev. A1 (nov. 1995) y ON Semiconductor Rev. 5 — RDS(on), ID máx, VDS máx y Ptot del 2N7000; tr/tf no especificado en ninguna de las dos revisiones consultadas (dispositivo de señal, no de potencia)."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-III.1 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); no confirmadas contra un catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad. En particular, confirmar la liga curricular explícita a mecanica-4 (Inversor Trifásico de Potencia) que señala docs/LISTA-MAESTRA-200-PRACTICAS.md — las pérdidas de conmutación que calcula esta práctica ocurren, en principio, en cada uno de los seis transistores de ese inversor."
  - "⚑ IEC 60747-8 se propone como norma pertinente para la definición de tr/tf pero no se confirmó su alcance ni vigencia exactos (ver normatividad) — pedir al experto que confirme o descarte."
  - "⚑ tr+tf se trata como una constante del dispositivo tomada de la condición de prueba fija de cada hoja de datos (VDD/ID/RG/VGS específicos del fabricante, distintos entre IRF540N e IRLZ44N) — no como función del RG real de un circuito. Esto es una limitación conocida y declarada del modelo de primer orden (ver simulador_NO_modela), no un error; se pide al experto confirmar que es aceptable para el nivel de esta práctica, o si debería añadirse una nota más visible en el panel."
  - "⚑ El 2N7000 no tiene tr+tf publicado en ninguna de las dos hojas de datos consultadas (Fairchild Rev. A1, ON Semiconductor Rev. 5) — es un MOSFET de señal pequeña, no pensado para conmutación de potencia, y los fabricantes consultados simplemente no lo caracterizan para ese uso. El simulador declara Psw y la frecuencia de cruce como 'no disponible' para este dispositivo en vez de aproximar un valor; se pide al experto confirmar si existe una hoja de datos alternativa que sí reporte tr/tf, o si la ausencia misma es un punto pedagógico válido (no todo MOSFET sirve para conmutación de potencia)."
  - "⏳ Verificación con Playwright de este simulador: en curso al momento de escribir esta ficha. Esta línea y la nota 3 de 'Notas para el revisor experto' deben actualizarse con el resultado real (PASS/FAIL, defectos encontrados y corregidos) antes de considerar esta ficha completa — no se debe publicar un resultado de verificación sin haberlo ejecutado."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (décima y última práctica de Tanda 1 / D2):** d2-10 cierra el
   arco de semiconductores de la tanda (d2-01…d2-10: diodo → BJT → MOSFET) retomando el
   mismo MOSFET de canal N de mecanica-22/d2-09, pero cambiando el eje pedagógico de "¿en
   qué región opera?" a "¿cuánto calor disipa al conmutar?". Es aquí donde RDS(on) — que en
   mecanica-22 se mostraba solo como referencia de catálogo, sin uso en el cálculo — pasa a
   ser un parámetro activo de la pérdida de conducción, cerrando explícitamente el hueco de
   alcance que la propia ficha de mecanica-22 dejó señalado en su nota 4(b). La práctica
   también introduce un segundo mecanismo de pérdida (conmutación, ligado a fsw) ausente por
   completo en mecanica-22, y con él, el concepto de frecuencia de cruce entre dos pérdidas
   con dependencias físicas distintas (I²·D vs. fsw lineal).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/mosfet-pwm.html](../../../public/labs/mosfet-pwm.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros de
   hoja de datos de los tres MOSFET, las fórmulas exactas de Pcond/Psw/frecuencia de cruce, y
   la condición de prueba fija de fabricante bajo la que se midió cada tr+tf — de modo que el
   alumno y el evaluador ven las fronteras del modelo dentro de la práctica misma, incluyendo
   la divulgación explícita de "no disponible" para el 2N7000.
3. **Verificación de implementación:** `mosfet-pwm.body.js` se escribió siguiendo la misma
   convención ya validada en mecanica-19…22 (llamada directa a `pickerFor` del framework,
   `el(id)`/`showToast(msg)` como helpers locales, y un objeto `window.__labDebug` con
   getters/setters deterministas para automatizar la verificación). ⏳ **Pendiente de
   completar antes de escalar el patrón:** actualizar este párrafo con el resultado real de
   la verificación con Playwright (Chromium headless, sirviendo `public/labs/` por HTTP
   local) — específicamente: cero errores de consola/página; renderizado correcto del banco
   3D; las cuatro transiciones de modo (Explora/Predicción/Barrido/Reto); cambio de
   dispositivo válido en los tres MOSFET, incluyendo la rama sin Psw del 2N7000; el cálculo
   de Pcond/Psw/Ptot y de la frecuencia de cruce contrastado numéricamente contra un cálculo
   independiente; y el texto del modo Reto reflejando el estado real del dispositivo/bus V
   asignado. No se debe declarar "PASS" en esta ficha sin haber ejecutado esa verificación.
4. **Petición concreta al experto:** (a) confirmar o corregir la clave curricular ⚑
   (MEC-III.1, el submódulo, y en particular la liga explícita a mecanica-4 que señala la
   lista maestra — ¿vale la pena una referencia cruzada visible al alumno entre ambas
   prácticas?); (b) confirmar si IEC 60747-8 es en efecto la norma pertinente para la
   definición de tr/tf, respondiendo la pregunta que dejó abierta la ficha de mecanica-22;
   (c) confirmar si tratar tr+tf como constante de hoja de datos (en vez de función del RG
   real) es aceptable para el nivel de esta práctica, dado que es la simplificación más
   fuerte del modelo; (d) confirmar si existe una hoja de datos alternativa del 2N7000 que sí
   reporte tr/tf, o si su ausencia es en sí un punto pedagógico válido para discutir con el
   grupo.
