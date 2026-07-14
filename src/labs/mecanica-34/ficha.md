# Ficha de práctica — Temporizador 555 astable: f, duty cycle y umbrales internos (`mecanica-34`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimotercera práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, tercera del sub-arco de circuitos integrados analógicos que abrió
> mecanica-32/d2-11 (amplificador operacional) y continuó mecanica-33/d2-12 (comparador
> Schmitt trigger). Continúa el tramo final de D2 (d2-11…d2-18: op-amp, comparador Schmitt,
> 555, filtro Sallen-Key, buck, boost/flyback, amplificador de instrumentación, etapa clase
> AB) reutilizando el molde S+P, ahora sobre un oscilador autónomo de relajación en vez de un
> bloque de ganancia lineal o un comparador con histéresis frente a una entrada externa.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-34
sector: mecanica-electronica
practica_maestra: "d2-13 — Genera temporizaciones y oscilaciones con el 555: f=1.44/((RA+2RB)C), duty cycle y la curva real de carga/descarga del capacitor entre los umbrales 1/3 Vcc y 2/3 Vcc (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.2 (Electrónica/Tecnología, resultado I.2) — misma trazabilidad que trae la fila de d2-11 en docs/LISTA-MAESTRA-200-PRACTICAS.md; confirmado por lectura directa de la fila de d2-13 en esa lista maestra, no un error de transcripción"   # ⚑ sin código Mecatrónica (MEC-x.x) asignado en la lista maestra para esta fila, a diferencia de d2-01/d2-06/d2-09/d2-10; confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Osciladores y temporizadores integrados (multivibrador astable)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23/32/33; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar cómo el divisor resistivo interno de
  tres resistores iguales del 555 fija los dos umbrales de conmutación (2/3 Vcc de threshold
  y 1/3 Vcc de trigger); deducir tHigh=0.693(RA+RB)C, tLow=0.693·RB·C, el periodo T, la
  frecuencia f=1/T (equivalente a f=1.44/((RA+2RB)C)) y el duty cycle=(RA+RB)/(RA+2RB) de la
  configuración astable de 3 terminales; explicar por qué esa topología nunca puede producir
  un duty cycle menor a 50%, dado que la carga del capacitor (a través de RA+RB) siempre
  tarda más que su descarga (solo a través de RB); reconocer la curva exponencial real de
  carga/descarga del capacitor entre ambos umbrales, en vez de una rampa lineal; identificar
  por qué diseñar RA por debajo de aproximadamente 1kΩ es una práctica desaconsejada (riesgo
  para el transistor interno de descarga); y diseñar RA, RB y C para alcanzar una frecuencia
  objetivo manteniendo el duty cycle razonablemente cerca de 50%.
actividad_clave: >
  Sobre un banco 3D con RA, RB, un capacitor y un NE555 en encapsulado DIP, con displays de
  fuente/info, medición y osciloscopio virtual, en el modo Explora ajusta Vcc, RA, RB y C con
  steppers y observa tHigh, tLow, f, el duty cycle, la curva de carga/descarga del capacitor
  entre los umbrales 1/3 Vcc y 2/3 Vcc, y el osciloscopio actualizarse en tiempo real; en
  Predicción, predice la frecuencia o el duty cycle antes de revelar el valor real; en
  Medición, ejecuta un barrido automático de RB que muestra en vivo cómo el duty cycle se
  acerca a 50% mientras la frecuencia baja; y en el Reto, diseña RA/RB/C para alcanzar una
  frecuencia objetivo aleatoria (±15% de tolerancia) manteniendo el duty cycle razonablemente
  cerca de 50% y RA por encima del mínimo recomendado, recibiendo retroalimentación específica
  sobre qué ajustar cuando el diseño no cumple.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: riel de Vcc, RA entre Vcc y el pin de descarga (pin 7), RB entre el pin de descarga y el nodo de threshold/trigger unidos (pines 6+2), C entre ese nodo y tierra, y el 555 con su salida Vout (pin 3) — sin resistor de pull-up, a diferencia de mecanica-33/d2-12, porque la salida del 555 es push-pull (no de colector abierto como el LM393 del comparador Schmitt trigger)."
  - "Modo Explora: ajusta Vcc, RA, RB y C con los steppers del panel, y observa tHigh, tLow, T, f, el duty cycle, la curva de carga/descarga del capacitor y el osciloscopio virtual actualizarse en tiempo real."
  - "Verifica que tHigh=0.693(RA+RB)C y tLow=0.693·RB·C se calculan por fórmula cerrada, que T=tHigh+tLow y f=1/T coinciden con la forma clásica f=1.44/((RA+2RB)C), y que duty=(RA+RB)/(RA+2RB) siempre resulta ≥50% para cualquier combinación de RA/RB/C disponible en el simulador."
  - "Confirma que la curva del capacitor se calcula con la exponencial RC real —V(t)=Vcc−(2Vcc/3)e^(−t/τcarga) durante la carga (τcarga=(RA+RB)C) y V(t)=(2Vcc/3)e^(−t/τdescarga) durante la descarga (τdescarga=RB·C)— y no con una rampa lineal, con los umbrales 2/3 Vcc y 1/3 Vcc marcados de forma explícita sobre la gráfica."
  - "Confirma que el simulador reporta una advertencia explícita cuando RA se diseña por debajo de 1kΩ (el simulador incluye deliberadamente un valor de RA de 470Ω, por debajo del mínimo recomendado, para que la advertencia sea observable), y que la advertencia depende únicamente de RA, nunca de RB ni de C."
  - "Modo Predicción: predice la frecuencia f o el duty cycle con los valores actuales de RA/RB/C/Vcc, antes de que el simulador confirme la respuesta."
  - "Modo Medición: ejecuta un barrido automático de RB (dejando RA y C fijos) y observa cómo el duty cycle se acerca a 50% mientras la frecuencia baja simultáneamente, registrado en una tabla en vivo."
  - "Modo Reto: diseña RA, RB y C para alcanzar una frecuencia objetivo aleatoria dentro de ±15% de tolerancia, manteniendo el duty cycle ≤55% y RA≥1kΩ, y verifica que el simulador reporta la razón específica de incumplimiento (frecuencia fuera de rango, duty cycle demasiado alto, o RA por debajo del mínimo) cuando el diseño no cumple."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (resistor, capacitor, bloque de circuito integrado, tierra) — el estándar de representación de este lab."
  - "⚑ No se identificó una norma que aplique directamente al diseño de un multivibrador astable a nivel de componente — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-23/d2-10 y mecanica-32/d2-11, mecanica-33/d2-12; el ancla técnica de esta práctica son las fórmulas de diseño estándar del fabricante (Texas Instruments, Diodes Incorporated), no una norma."
simulador_modela:      # 🔒
  - "Fórmulas estándar de la configuración astable de 3 terminales del NE555: tHigh=0.693(RA+RB)C, tLow=0.693·RB·C, T=tHigh+tLow, f=1/T (equivalente a f=1.44/((RA+2RB)C)), y duty=(RA+RB)/(RA+2RB) — verificadas contra la hoja de datos vigente de Texas Instruments (SLFS022I) y cruzadas contra la de Diodes Incorporated."
  - "Curva de voltaje del capacitor calculada con la exponencial RC real (no una rampa lineal): carga V(t)=Vcc−(2Vcc/3)e^(−t/τcarga) con τcarga=(RA+RB)C partiendo de Vcc/3, y descarga V(t)=(2Vcc/3)e^(−t/τdescarga) con τdescarga=RB·C partiendo de 2Vcc/3, con los umbrales internos 2/3 Vcc y 1/3 Vcc marcados explícitamente."
  - "Rango de alimentación real del NE555 (4.5V–16V), respetado por los tres valores de Vcc ofrecidos (5V/9V/12V)."
  - "Advertencia de diseño explícita cuando RA cae por debajo de 1kΩ, guía de diseño ampliamente citada por fabricantes y tutoriales para no exceder la corriente que el transistor interno de descarga conduce a tierra durante tLow."
  - "Modo Reto con una frecuencia objetivo aleatoria (±15% de tolerancia) y la restricción de mantener el duty cycle razonablemente cerca de 50% sin bajar RA de 1kΩ, y modo Medición con barrido automático de RB que deja C fijo."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El pin de control de voltaje (pin 5): en un circuito real normalmente se desacopla a tierra con un capacitor de 0.01–0.1µF, o puede usarse para modular externamente el umbral 2/3 Vcc; este simulador no expone ese pin."
  - "La tolerancia real de fabricación de RA/RB/C ni del propio 555: varias fuentes técnicas consultadas señalan que las fórmulas de diseño del astable pueden diferir hasta aproximadamente 20% del resultado medido en un circuito real; este simulador calcula f, duty, tHigh y tLow de forma exacta según las fórmulas ideales."
  - "El nivel bajo de salida real (VOL) como una tensión de saturación distinta de 0V: se aproxima Vout bajo a 0V exacto, la simplificación estándar de la mayoría de los tratamientos introductorios."
  - "La corriente máxima de salida, la disipación de potencia ni el calentamiento del encapsulado a alta frecuencia o alta corriente de carga."
  - "El diseño con diodo en paralelo con RB (variante común que independiza aproximadamente tHigh de RB y permite duty cycles menores a 50%): este simulador modela únicamente la topología básica de 3 terminales."
  - "La comparación contra otras familias de temporizadores: este laboratorio modela solo el NE555 bipolar, sin contrastarlo contra variantes CMOS de bajo consumo (p. ej. TLC555, ICM7555)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de RA, RB y C elegidos, y confirmación del simulador de que el diseño cumple simultáneamente la frecuencia objetivo (±15% de tolerancia), el límite de duty cycle (≤55%) y el mínimo de RA (≥1kΩ), o la retroalimentación específica reportada (frecuencia fuera de rango, duty cycle demasiado alto, o RA por debajo del mínimo) cuando el diseño no cumple."
evidencia_desempeno: "Guía de observación del modo Predicción (frecuencia o duty cycle predicho antes de la confirmación) y del modo Medición (identificación en vivo de cómo el barrido de RB acerca el duty cycle a 50% mientras la frecuencia baja)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el 555 (el circuito integrado más fabricado de la historia) puede oscilar sin ninguna señal de entrada, usando solo un divisor interno de tres resistores iguales y dos componentes externos (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo Vcc/RA/RB/C cambian tHigh, tLow, f y el duty cycle → predice frecuencia o duty cycle → barrido automático de RB con el duty cycle acercándose a 50% en vivo → reto de diseño con una frecuencia objetivo y restricciones de duty cycle y RA mínimo."
cierre: "Ficha técnica (capa 2) con el NE555, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con osciloscopio y frecuencímetro."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Texas Instruments, 'NE555 Precision Timers' (SLFS022I) — https://www.ti.com/lit/ds/symlink/ne555.pdf: hoja de datos vigente del fabricante; fuente principal de las fórmulas de diseño astable, el rango de alimentación y los umbrales internos usados por este modelo."
  - "Diodes Incorporated, 'NE555/SA555/NA555' datasheet — https://www.diodes.com/datasheet/download/NE555.pdf: segunda fuente usada para cruzar el rango de alimentación y las fórmulas de diseño estándar del astable."
  - "Daycounter, 'NE555 Astable Multivibrator Frequency and Duty Cycle Calculator' — https://www.daycounter.com/Calculators/NE555-Calculator.phtml: calculadora técnica de referencia, consultada para contrastar las fórmulas de f y duty cycle."
  - "All About Circuits, '555 Timer Astable Oscillator Circuit' — https://www.allaboutcircuits.com/tools/555-timer-astable-circuit/: tutorial técnico de referencia, consultado para contrastar el comportamiento cualitativo de carga/descarga y la guía de RA≥1kΩ."
  - "Electronics Tutorials, '555 Oscillator Tutorial - The Astable Multivibrator' — https://www.electronics-tutorials.ws/waveforms/555_oscillator.html: tutorial técnico de referencia, consultado para contrastar la deducción de tHigh/tLow a partir de los umbrales 2/3 Vcc y 1/3 Vcc."
  - "Electronics Club, '555 Astable' — https://electronicsclub.info/555astable.htm: tutorial técnico adicional, consultado como fuente de convergencia para la guía de diseño de RA mínimo."
banderas_incertidumbre:
  - "⚑ El límite de 'RA≥1kΩ' es una guía de diseño ampliamente citada por fabricantes y tutoriales, no una única cifra de una hoja de datos específica con un valor numérico exacto y uniforme entre fuentes — se presenta en el simulador y en esta ficha como recomendación de buena práctica, no como límite absoluto de hoja de datos."
  - "⚑ La cifra de '~20% de posible diferencia entre el resultado calculado y el medido en un circuito real' proviene de convergencia de varias fuentes técnicas secundarias (tutoriales/calculadoras), no de una única hoja de datos con esa cifra exacta — confirmar contra la hoja de datos del componente físico específico antes de diseñar con cifras exactas."
  - "⚑ Submódulo curricular ('Osciladores y temporizadores integrados') no verificado contra un catálogo externo del plan vigente — mismo tipo de reserva ya documentada en mecanica-32/d2-11 y mecanica-33/d2-12."
  - "✅ Verificación con Playwright de este simulador: COMPLETADA — 71/71 aserciones PASS (fase 1: DOM/keys/4 modos, sin errores de consola/página/requests fallidos; fase 2: physics de solveAstable y curveVC contra fórmulas derivadas de forma independiente, predicción f/duty, los 4 ramales de reto, el barrido de medición, los 4 steppers en sus límites, y click-picking en banco 3D y panel esquemático). La primera corrida de la fase 2 reportó 1 fallo que resultó ser un error en la aserción del propio script de prueba (esperaba que el duty cycle fuera no-decreciente al crecer RB; la física real —y correcta— es que decrece monótonamente hacia 0.5), no un defecto de la app; corregida la aserción, la corrida siguiente pasó 71/71. Cero defectos encontrados en la implementación."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimotercera práctica de Tanda 1 / D2, tercera del sub-arco de
   circuitos integrados analógicos):** d2-13 continúa el sub-arco que abrió d2-11 (op-amp) y
   siguió d2-12 (comparador Schmitt trigger), pasando ahora de un dispositivo de decisión
   binaria disparado por una entrada externa a un oscilador autónomo de relajación que no
   necesita ninguna señal de entrada. El eje pedagógico se mueve de "diseñar una ventana de
   histéresis que rechace ruido" a "diseñar un par RA/RB y un capacitor C que fijen una
   frecuencia y un duty cycle objetivo" — el mismo divisor de umbrales internos (2/3 Vcc,
   1/3 Vcc) que en el Schmitt trigger era externo (R1/R2), aquí vive dentro del propio 555.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/ne555.html](../../../public/labs/ne555.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) con las fórmulas exactas de tHigh,
   tLow, f y duty cycle, el rango de alimentación del NE555, y la naturaleza de recomendación
   (no de límite absoluto de hoja de datos) de la guía RA≥1kΩ, documentada en la sección 2 de
   la ficha técnica in-app — de modo que el alumno y el evaluador ven las fronteras del
   modelo y la incertidumbre real de esa guía de diseño dentro de la práctica misma.
3. **Verificación de implementación:** COMPLETADA. Se ejecutó una verificación con Playwright
   (Chromium headless, sirviendo `public/labs/` por HTTP local) en dos etapas, siguiendo el
   mismo procedimiento usado en mecanica-33/d2-12: primero un escaneo dedicado de coordenadas
   de click (clicking sistemático en rejilla sobre el banco 3D y el panel esquemático, leyendo
   el toast de la app para ubicar el centroide real de cada zona clicable) antes de escribir
   las aserciones de picking; después, dos pasadas de pruebas: fase 1 (DOM/claves de
   `window.__labDebug`/los 4 modos, cero errores de consola/página/requests fallidos) y fase 2
   (sanidad física de `solveAstable` en 7 combinaciones de Vcc/RA/RB/C contrastadas contra
   fórmulas derivadas de forma independiente —no copiadas del código fuente de la app—,
   incluyendo la advertencia de RA<1kΩ; sanidad de `curveVC` contra las identidades RC del
   umbral de threshold 2/3 Vcc y trigger 1/3 Vcc; modo predicción para f y duty; los 4 ramales
   del modo reto; el barrido de medición de RB; los 4 steppers en sus límites; y el
   click-picking sobre el banco 3D y el panel esquemático). Resultado: 71/71 aserciones PASS,
   cero errores de consola/página/requests fallidos, cero defectos de implementación
   encontrados. La primera corrida de la fase 2 reportó 1 fallo que resultó ser un error en la
   aserción del propio script de prueba (dirección esperada del duty cycle al crecer RB,
   invertida respecto a la física real), no un defecto de la app; corregida la aserción, la
   corrida siguiente pasó 71/71.
4. **Petición concreta al experto:** (a) confirmar la clave exacta del submódulo curricular
   ("Osciladores y temporizadores integrados") contra el plan vigente, dado que no fue
   verificada contra un catálogo externo; (b) confirmar si el margen de diseño del modo Reto
   (±15% de tolerancia en frecuencia, duty cycle≤55%, RA≥1kΩ) refleja una práctica de diseño
   real razonable o si conviene ajustar esos factores; (c) confirmar si el NE555 bipolar es
   representativo de lo que un técnico encuentra en campo para esta aplicación, o si
   convendría sustituir/añadir una variante CMOS de referencia (p. ej. TLC555) dado su menor
   consumo y mayor frecuencia máxima de operación; (d) confirmar o corregir la guía de
   "RA≥1kΩ" contra la documentación oficial del fabricante específico del componente físico
   cuando esté disponible, dado que se presenta aquí como convergencia de varias fuentes
   secundarias y no como una única cifra de hoja de datos.
