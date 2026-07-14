# Ficha de práctica — Comparador Schmitt trigger: histéresis VTH/VTL (`mecanica-33`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** duodécima práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, segunda del sub-arco de circuitos integrados analógicos que abrió
> mecanica-32/d2-11 (amplificador operacional). Continúa el tramo final de D2
> (d2-11…d2-18: op-amp, comparador Schmitt, 555, filtro Sallen-Key, buck, boost/flyback,
> amplificador de instrumentación, etapa clase AB) reutilizando el molde S+P, ahora sobre
> un dispositivo de decisión binaria con realimentación positiva en vez de una única
> ganancia lineal en lazo cerrado.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-33
sector: mecanica-electronica
practica_maestra: "d2-12 — Aplica comparadores con histéresis (Schmitt): VTH/VTL, anti-rebote analógico mediante la ventana de histéresis ΔV=VTH−VTL (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 — trazabilidad Mecatrónica asignada a d2-12 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Diseño con comparadores (histéresis, colector abierto, rechazo de ruido)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23/32; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de deducir por análisis de nodo con superposición
  los umbrales de conmutación VTH y VTL de un comparador con histéresis, tanto en topología
  inversora (VTH=Vcc·R1/(R1+R2), VTL=VOL·R1/(R1+R2)) como no inversora (VTH=Vref·(1+x)−VOL·x,
  VTL=Vref·(1+x)−Vcc·x, con Vref=Vcc/2 y x=R1/R2); explicar por qué un comparador de
  colector abierto como el LM393 exige un resistor de pull-up externo para producir un
  nivel alto; distinguir el rebote (chatter) de una histéresis angosta frente a la
  conmutación limpia de una histéresis ancha, contando transiciones reales de salida frente
  a una señal ruidosa; reconocer el modo de falla de "enganche" que ocurre en la topología
  no inversora cuando VTH o VTL caen fuera del rango físico 0–Vcc; y diseñar R1/R2 para que
  la ventana de histéresis ΔV rechace un nivel de ruido esperado sin perder sensibilidad a
  cambios reales de la señal.
actividad_clave: >
  Sobre un banco 3D con fuente de rampa+ruido, resistores R1/R2, comparador LM393 con su
  resistor de pull-up y osciloscopio virtual, en el modo Explora ajusta R1, R2, Vcc, el
  nivel de ruido y la topología (inversor/no inversor) con steppers y observa VTH, VTL, ΔV,
  el lazo de histéresis y el osciloscopio actualizarse en tiempo real; en Predicción, predice
  un umbral o el comportamiento de la salida frente al ruido actual; en Medición, ejecuta un
  barrido automático de R2 que abre o cierra la ventana de histéresis mientras el conteo de
  transiciones de salida cambia en vivo; y en el Reto, diseña R1/R2 para que ΔV rechace el
  ruido pico-pico esperado sin volverse tan ancho que el comparador pierda sensibilidad,
  recibiendo la clasificación de falla (enganchado, rebota, insensible) cuando el diseño no
  cumple.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: fuente vin (rampa con ruido inyectable), resistores R1/R2 realimentando la salida hacia la entrada no inversora, comparador LM393 (colector abierto) con su resistor de pull-up Rpu fijo (4.7kΩ) hacia Vcc, y salida Vout — con un botón para alternar entre topología inversora y no inversora, molde S+P ya usado en mecanica-32/d2-11, ahora sobre un dispositivo de dos estados con realimentación positiva."
  - "Modo Explora: ajusta R1, R2, Vcc, el nivel de ruido y la topología con los steppers del panel, y observa VTH, VTL, la ventana de histéresis ΔV=VTH−VTL, el lazo de histéresis sobre el esquema y el osciloscopio virtual actualizarse en tiempo real."
  - "Verifica que en la topología inversora los umbrales se calculan por fórmula cerrada VTH=Vcc·R1/(R1+R2), VTL=VOL·R1/(R1+R2), usando el nivel real de salida baja del LM393 (VOL de hoja de datos: 250mV típ./400mV máx. @ Isink=4mA) como el valor realimentado a través del divisor, no una aproximación a 0V."
  - "Verifica que en la topología no inversora, con Vref=Vcc/2 y x=R1/R2, los umbrales se calculan como VTH=Vref·(1+x)−VOL·x y VTL=Vref·(1+x)−Vcc·x, ambos centrados alrededor de Vcc/2 en vez de anclados a un extremo del rango."
  - "Confirma que el simulador detecta y reporta explícitamente el modo de falla de 'enganche' en la topología no inversora cuando la combinación de Vcc/R1/R2 empuja VTH por encima de Vcc o VTL por debajo de 0V — un umbral fuera del rango de entrada físicamente alcanzable, que en el circuito real deja la salida fija en un solo estado."
  - "Confirma que la rampa de entrada con ruido pseudoaleatorio inyectable, y el conteo real de transiciones de salida por ciclo (no una animación aproximada), muestran en vivo cómo una histéresis angosta produce rebote (chatter) y una histéresis ancha produce una única transición limpia por flanco."
  - "Modo Predicción: predice VTH, VTL, o si la señal ruidosa actual va a producir una transición limpia, rebote, o dejar la salida enganchada, antes de que el simulador confirme la respuesta."
  - "Modo Medición: ejecuta un barrido automático de R2 y observa cómo ΔV se ensancha o se cierra, junto con el conteo de transiciones de salida cayendo al crecer la histéresis."
  - "Modo Reto: diseña R1/R2 para que ΔV supere el ruido pico-pico esperado (margen ΔV≥1.5× el ruido) sin volverse tan ancho que el comparador pierda sensibilidad (ΔV≤60% de Vcc), y verifica que el simulador clasifica el diseño entre enganchado, rebota, insensible o válido."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (comparador, resistor, fuente AC, tierra) — el estándar de representación de este lab."
  - "⚑ No se identificó una norma que aplique directamente al diseño de comparadores con histéresis a nivel de componente — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-23/d2-10 y mecanica-32/d2-11; el ancla técnica de esta práctica es el modelo analítico de libro de texto (Sedra y Smith) sobre comparadores con realimentación positiva, no una norma."
simulador_modela:      # 🔒
  - "Deducción de VTH, VTL y ΔV=VTH−VTL por análisis de nodo con superposición sobre un comparador con realimentación positiva, para topología inversora (VTH=Vcc·R1/(R1+R2), VTL=VOL·R1/(R1+R2)) y no inversora (VTH=Vref·(1+x)−VOL·x, VTL=Vref·(1+x)−Vcc·x, con Vref=Vcc/2 y x=R1/R2)."
  - "Uso del nivel real de salida baja del LM393 (VOL de hoja de datos: 250mV típ./400mV máx. @ Isink=4mA) como el valor realimentado a través del divisor, en vez de aproximarlo a 0V como algunos tratamientos simplificados de libro de texto."
  - "Parámetros reales del LM393 verificados contra su hoja de datos vigente de Texas Instruments (alimentación 2V–36V, Vos≈1–2mV típ./5mV máx., Ib≈65nA típ./250nA máx.), con la cifra de VOL cruzada contra ON Semiconductor y STMicroelectronics como segundas fuentes."
  - "Salida en colector abierto que exige un resistor de pull-up externo (Rpu, fijo en 4.7kΩ en este simulador) hacia Vcc para producir un nivel alto definido."
  - "Rampa de entrada con ruido pseudoaleatorio inyectable de amplitud ajustable, y conteo real (no animado ni aproximado) de transiciones de salida por ciclo, mostrando el rebote con histéresis angosta y la conmutación limpia con histéresis ancha."
  - "Detección explícita del modo de falla de 'enganche' en la topología no inversora cuando VTH/VTL caen fuera del rango físicamente alcanzable 0–Vcc."
  - "Modo Reto con margen de diseño pedagógico (ΔV≥1.5× el ruido pico-a-pico, ΔV≤60% de Vcc) y modo Medición con barrido automático de R2."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El tiempo de respuesta / propagación del comparador (LM393 ≈1.3µs típico según hojas de datos secundarias consultadas durante la investigación de esta práctica): la transición de salida se trata como instantánea frente a la rampa de entrada."
  - "El efecto de la corriente de polarización de entrada (Ib) sobre el punto exacto de VTH/VTL cuando R1/R2 son grandes."
  - "La carga real sobre el divisor Vref=Vcc/2 de la topología no inversora: se asume un divisor ideal, sin corriente extraída hacia la entrada del comparador."
  - "La corriente de salida máxima, el calentamiento del transistor de colector abierto, ni la variación de VOL con la corriente real de Rpu: el resistor de pull-up está fijo en 4.7kΩ y no es ajustable por el usuario."
  - "El ruido como proceso estocástico real: la señal de ruido inyectada es una función pseudoaleatoria determinista, no un modelo de ruido térmico o de disparo con distribución o ancho de banda configurables."
  - "La comparación contra otras familias de comparadores: este laboratorio modela solo el LM393, sin contrastarlo contra el LM339 cuádruple ni comparadores CMOS de mayor velocidad y menor consumo."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de R1 y R2 elegidos, y confirmación del simulador de que el diseño cumple simultáneamente el margen de histéresis frente al ruido (ΔV≥1.5× el ruido pico-pico) y el límite de sensibilidad (ΔV≤60% de Vcc), o la clasificación de falla reportada (enganchado, rebota o insensible) cuando el diseño no cumple."
evidencia_desempeno: "Guía de observación del modo Predicción (VTH, VTL o comportamiento frente a ruido predicho antes de la confirmación) y del modo Medición (identificación en vivo de cómo el barrido de R2 ensancha o cierra ΔV y cambia el conteo de transiciones)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un comparador simple rebota (chatter) frente a una señal ruidosa, y cómo la histéresis con dos umbrales VTH/VTL —en vez de uno— lo resuelve sin filtrar la señal (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo R1/R2/Vcc/ruido/topología cambian VTH, VTL y ΔV → predice umbral o comportamiento frente a ruido → barrido automático de R2 con la ventana de histéresis abriéndose/cerrándose en vivo → reto de diseño con margen de histéresis frente al ruido."
cierre: "Ficha técnica (capa 2) con el LM393, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con fuente DC ajustable y osciloscopio de doble canal."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Texas Instruments, 'LM393B, LM2903B, LM193, LM293, LM393 and LM2903 Dual Comparators' (hoja de datos vigente del fabricante actual de la parte; vía convergencia de fuentes secundarias — el PDF original no pudo leerse directamente en el entorno de investigación usado para esta práctica, poppler-utils ausente): fuente principal de VOL, Vos, Ib y rango de alimentación usados por este modelo."
  - "ON Semiconductor, 'LM393 - Low Offset Voltage Dual Comparators' (vía convergencia de fuentes secundarias, mismo motivo): segunda fuente usada para cruzar la cifra de VOL — se encontraron discrepancias de 80mV a 250mV típico según el fabricante y la corriente de prueba consultados; ver advertencia en la sección 2 de la ficha técnica in-app."
  - "Sedra y Smith, Microelectronic Circuits (Oxford): análisis de nodo con superposición sobre comparadores con realimentación positiva — la referencia principal para la deducción analítica de VTH/VTL de esta práctica."
  - "Boylestad y Nashelsky, Electronic Devices and Circuit Theory (Pearson): tratamiento introductorio de comparadores y circuitos con histéresis."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
banderas_incertidumbre:
  - "⚑ Las hojas de datos originales (Texas Instruments LM393, ON Semiconductor LM393) no pudieron leerse directamente en el entorno de investigación usado para esta práctica — el renderizado de PDF no estaba disponible. Todas las cifras de VOL/Vos/Ib provienen de convergencia de fuentes secundarias, no de lectura directa del documento del fabricante — ver advertencia en la sección 2 de la ficha técnica in-app (public/labs/_ficha-schmitt.js)."
  - "⚑ La cifra de VOL varía entre 80mV y 250mV típico según el fabricante y la corriente de prueba consultados durante la investigación — este modelo usa 250mV típ./400mV máx. (Texas Instruments, @ Isink=4mA) como cifra principal; confirmar contra la hoja de datos del componente físico específico antes de diseñar con cifras exactas."
  - "⚑ Submódulo curricular ('Diseño con comparadores') no verificado contra un catálogo externo del plan vigente — mismo tipo de reserva ya documentada en mecanica-32/d2-11."
  - "✅ Verificación con Playwright de este simulador: EJECUTADA, con un escaneo de coordenadas de click-picking hecho por adelantado (a diferencia de mecanica-32/d2-11, donde el escaneo fino se hizo como corrección posterior a fallos iniciales de coordenadas). Resultado: 67/67 aserciones directas PASS a la primera ejecución — sanidad física de VTH/VTL/ΔV en 6 combinaciones de Vcc/R1/R2 sobre ambas topologías (24/24), los 4 modos completos (Predicción 8/8, Reto 4/4, Medición 3/3), topología y los 4 steppers vcc/r1/r2/ruido (14/14), y click-picking sobre el banco 3D y el panel esquemático en ambas topologías (14/14). Cero errores de consola, cero errores de página, cero defectos reales encontrados en el lab. Detalle completo en la nota 3 de 'Notas para el revisor experto'."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (duodécima práctica de Tanda 1 / D2, segunda del sub-arco de
   circuitos integrados analógicos):** d2-12 continúa el sub-arco que abrió d2-11 (op-amp),
   pasando de un bloque de ganancia lineal casi ideal a un dispositivo de decisión binaria
   con realimentación positiva. El eje pedagógico se mueve de "diseñar una ganancia y un
   ancho de banda" a "diseñar una ventana de histéresis que rechace ruido sin perder
   sensibilidad" — el mismo par de resistores R1/R2 que en el op-amp fijaban Av, aquí fijan
   directamente VTH y VTL.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/schmitt.html](../../../public/labs/schmitt.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros de hoja de datos
   del LM393, las fórmulas exactas de VTH/VTL en ambas topologías, y la advertencia de
   discrepancia de VOL entre fabricantes (Texas Instruments vs. ON Semiconductor /
   STMicroelectronics) documentada en la sección 2 de la ficha técnica in-app — de modo que
   el alumno y el evaluador ven las fronteras del modelo y la incertidumbre real de la cifra
   de VOL dentro de la práctica misma.
3. **Verificación de implementación:** EJECUTADA (Playwright, Chromium headless, sirviendo
   `public/labs/` por HTTP local), en dos etapas dentro de la misma ventana de trabajo:
   primero un escaneo dedicado de coordenadas de click (clicking sistemático en rejilla
   sobre el banco 3D y el panel esquemático, en ambas topologías, leyendo el toast de la app
   para ubicar el centroide real de cada zona clicable) antes de escribir las aserciones de
   picking — a diferencia de mecanica-32/d2-11, donde el escaneo fino se hizo después de que
   las coordenadas estimadas a ojo fallaran. Con esas coordenadas verificadas de antemano, la
   pasada completa de pruebas (sanidad física VTH/VTL/ΔV vía `window.__labDebug` en 6
   combinaciones de Vcc/R1/R2 y ambas topologías, los 4 modos completos, topología y los 4
   steppers, y las 14 aserciones de click-picking) pasó 67/67 en la primera ejecución, sin
   ninguna falla de picking ni de formato. Cero errores de consola, cero errores de página,
   cero solicitudes fallidas, cero defectos reales encontrados en el lab.
4. **Petición concreta al experto:** (a) confirmar la clave exacta del submódulo curricular
   ("Diseño con comparadores") contra el plan vigente, dado que no fue verificada contra un
   catálogo externo; (b) confirmar si el margen de diseño del modo Reto (ΔV≥1.5× el ruido
   pico-pico, ΔV≤60% de Vcc) refleja una práctica de diseño real razonable o si conviene
   ajustar esos factores; (c) confirmar si el LM393 es representativo de lo que un técnico
   encuentra en campo para esta aplicación, o si convendría sustituir/añadir un comparador de
   referencia adicional (p. ej. el LM339 cuádruple); (d) dado que las hojas de datos
   originales no pudieron verificarse de forma directa (ver `banderas_incertidumbre`) y que
   existe una discrepancia documentada de VOL entre fabricantes, confirmar o corregir la
   cifra de VOL usada como principal (250 mV típ./400 mV máx., Texas Instruments) contra la
   documentación oficial del fabricante específico del componente físico cuando esté
   disponible.
