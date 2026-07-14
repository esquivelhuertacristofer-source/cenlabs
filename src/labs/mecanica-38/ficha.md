# Ficha de práctica — Amplificador de instrumentación INA128 + puente de galgas: sensibilidad y CMRR (`mecanica-38`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimoséptima práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, y primera del sub-arco de acondicionamiento de señal de precisión que cierra
> D2 antes de la etapa de potencia de audio (d2-18, clase AB). Tras dos prácticas de fuentes
> conmutadas (mecanica-36/d2-15 buck, mecanica-37/d2-16 boost), el eje pedagógico regresa al
> acondicionamiento de señal que abrió la tanda con los op-amps (mecanica-32/d2-11), pero
> ahora sobre una señal realista de sensor: milivoltios de puente de galgas montados sobre un
> voltaje de modo común de varios voltios, resuelto con un amplificador de instrumentación de
> alto CMRR.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-38
sector: mecanica-electronica
practica_maestra: "d2-17 — Acondiciona un puente de galgas con amplificador de instrumentación: Vo=G·ΔV; CMRR (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-III.3 (Mecatrónica, Módulo III, Submódulo 3) — confirmado por lectura directa de la fila de d2-17 en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila 17, columna de trazabilidad)"
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Acondicionamiento de señal de sensores — puentes resistivos y amplificadores de instrumentación"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23/32…37; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de reconocer la topología de un puente de Wheatstone
  con 1, 2 o 4 galgas activas (¼, ½ y puente completo); calcular el voltaje diferencial de
  salida del puente para cada configuración, distinguiendo la fórmula no lineal exacta del
  cuarto de puente Vout/Vex=(GF·ε/4)/(1+GF·ε/2) de las fórmulas exactamente lineales del medio
  puente (GF·ε/2) y el puente completo (GF·ε); calcular la ganancia de un amplificador de
  instrumentación INA128 a partir de su resistencia de ganancia externa, G=1+50kΩ/R_G; y
  calcular el error de salida inducido por el rechazo de modo común (CMRR) del amplificador,
  explicando por qué ese error depende de la ganancia G y del voltaje de excitación Vex —a
  través del voltaje de modo común Vcm≈Vex/2— pero no del tipo de puente elegido, mientras que
  el error relativo a la señal sí es menor cuanto mayor es la sensibilidad del puente.
actividad_clave: >
  Sobre un banco 3D con una viga instrumentada con galga extensométrica, un resistor de
  ganancia R_G y un INA128, en el modo Explora ajusta Vex, la deformación ε, el tipo de puente
  y la ganancia G con steppers y observa Vbridge, VoutIdeal, el voltaje de modo común Vcm, el
  CMRR interpolado a la ganancia actual y el error de salida inducido, junto con el esquemático
  del puente (brazos activos resaltados según la configuración elegida) y una gráfica de
  CMRR contra ganancia con los 4 puntos ancla de la hoja de datos del INA128; en Predicción,
  predice Vbridge, VoutIdeal o si el error absoluto de CMRR cambia según el tipo de puente
  antes de revelar el valor real; en Medición, ejecuta un barrido automático de deformación ε
  que traza en una tabla cómo Vbridge, VoutIdeal y el error relativo cambian punto por punto; y
  en el Reto, alcanza un VoutIdeal objetivo (a Vex y ε fijos) eligiendo el tipo de puente y la
  ganancia G, manteniendo el error de CMRR bajo un umbral, recibiendo retroalimentación
  específica sobre qué condición falla cuando el diseño no cumple.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: la fuente de excitación Vex sobre el puente de Wheatstone (diamante de 4 brazos, resaltados en ámbar los brazos con galga activa según ¼/½/puente completo), las líneas diferenciales del puente a las entradas del INA128, el resistor de ganancia R_G en paralelo a las entradas de referencia del INA128, y la salida amplificada Vout."
  - "Modo Explora: ajusta Vex, ε, el tipo de puente y G con los steppers del panel, y observa cómo Vbridge, VoutIdeal, Vcm, el CMRR interpolado (mínimo y típico) y el error de salida inducido se actualizan en tiempo real, junto con la barra de error porcentual codificada por color (bajo/moderado/alto)."
  - "Verifica con el punto de referencia (botón dedicado, Vex=5 V, ε=+1000 µε, ¼ puente, G=100) que Vbridge≈2.4975 mV, VoutIdeal≈249.75 mV, y que el error de salida inducido por CMRR (peor caso, CMRR_mín=120 dB a G=100) es de apenas ≈0.1% de la señal."
  - "Con el botón de error alto (mismo Vex, ε reducido a +100 µε, G subido a 1000), confirma que aunque el CMRR mínimo del INA128 solo sube de 120 dB (a G=100) a 120 dB (a G=1000, según la tabla de la hoja de datos, el mínimo se mantiene en 120 dB entre esos dos puntos), el error relativo a la señal sube a ≈1% — demostrando que aumentar la ganancia para compensar una señal débil no reduce automáticamente el error relativo si el CMRR no mejora al mismo ritmo."
  - "Compara el mismo Vex y ε en ¼, ½ y puente completo: confirma que VoutIdeal escala 1:2:4 entre las tres configuraciones (a igual G), mientras que el error absoluto de salida (en voltios) permanece igual entre las tres — por lo que el error relativo (%) es siempre menor en el puente completo."
  - "Modo Predicción: predice Vbridge, VoutIdeal, o si el error absoluto de CMRR cambia según el tipo de puente, con los valores actuales de Vex/ε/tipo de puente/G, antes de que el simulador confirme el valor real."
  - "Modo Medición: ejecuta un barrido automático de la deformación ε (de compresión máxima a tensión máxima) y observa cómo se traza punto por punto, en una tabla en vivo, Vbridge, VoutIdeal y el error relativo de CMRR en cada punto del barrido."
  - "Modo Reto: alcanza un VoutIdeal objetivo (a partir de un Vex y ε objetivo generados al azar) eligiendo el tipo de puente y la ganancia G, manteniendo el error de CMRR (peor caso) menor o igual al 2% de la señal, y verifica que el simulador reporta la razón específica de incumplimiento (Vex/ε incorrectos, VoutIdeal fuera de tolerancia, o error de CMRR excesivo) cuando el diseño no cumple."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (fuente, resistor, amplificador operacional/de instrumentación, tierra) — el estándar de representación de este lab."
  - "⚑ No se identificó una norma que aplique directamente al diseño de un puente de galgas o de un amplificador de instrumentación a nivel de componente (columna 'Norma ancla' = '—' en docs/LISTA-MAESTRA-200-PRACTICAS.md, fila 17) — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-23/d2-10, mecanica-32/d2-11 a mecanica-36/d2-15 y mecanica-37/d2-16; el ancla técnica de esta práctica son la nota de aplicación de National Instruments sobre medición de deformación y la hoja de datos del fabricante (Texas Instruments), no una norma."
simulador_modela:      # 🔒
  - "Fórmula exacta del cuarto de puente (1 galga activa), con su término no lineal: Vout/Vex=(GF·ε/4)/(1+GF·ε/2) — verificada contra National Instruments, nota de aplicación AN078 'Measuring Strain with Strain Gages'."
  - "Fórmulas exactas del medio puente (2 galgas activas en oposición) y del puente completo (4 galgas activas), ambas exactamente lineales: Vout/Vex=GF·ε/2 y Vout/Vex=GF·ε respectivamente — verificadas contra la misma nota AN078; confirmado que la relación de sensibilidad entre ¼, ½ y puente completo es exactamente 1:2:4 para la misma deformación ε."
  - "Factor de galga GF=2.0 fijo, representativo de una galga de constantano típica (rango real ≈2.0–2.1) — verificado contra Vishay Precision Group 'Strain Gage Data Book' y Omega Engineering, nota técnica E-94."
  - "Ganancia del amplificador de instrumentación INA128, G=1+50kΩ/R_G (rango G=1 a 10,000 V/V) — verificada contra la hoja de datos INA128/INA129 de Texas Instruments (SBOS051)."
  - "Tabla de CMRR mínimo/típico del INA128 (grado estándar) a G=1 (80/86 dB), G=10 (100/106 dB), G=100 (120/125 dB) y G=1000 (120/130 dB), con interpolación log-lineal para valores intermedios de G — verificada por dos vías independientes de extracción de la hoja de datos SBOS051; el modelo usa el CMRR mínimo (peor caso garantizado) para el error de peor caso y el típico para el error típico."
  - "Voltaje de modo común del puente Vcm≈Vex/2 para un puente balanceado, y error de salida inducido por CMRR error≈G·Vcm/CMRR_lineal (con CMRR_lineal=10^(CMRR_dB/20)) — verificados contra Texas Instruments, nota de circuito de ingeniería analógica sboa247/tidub00 ('Bridge Measurement Circuit')."
  - "Insight derivado (no una cita externa, sino una consecuencia matemática directa de las fórmulas anteriores): el error absoluto de salida inducido por CMRR depende únicamente de G, Vex (vía Vcm) y la tabla de CMRR — NO del tipo de puente elegido; pero como VoutIdeal escala 1:2:4 entre ¼/½/puente completo para la misma ε, el error relativo (%) es siempre menor en el puente completo. Verificado con dos puntos de referencia numéricos: (a) Vex=5 V, ε=1000 µε, ¼ puente, G=100 → error≈0.1%; (b) mismo Vex/¼ puente, ε=100 µε, G=1000 → error≈1.0% (demuestra que el CMRR mínimo se estanca entre G=100 y G=1000, por lo que subir la ganancia para compensar una señal débil empeora el error relativo)."
  - "Modo Reto con un punto de operación objetivo aleatorio (Vex, ε → VoutIdeal objetivo), restringido a combinaciones con |VoutIdeal|≤12 V para garantizar un objetivo realista alcanzable; y modo Medición con barrido automático de ε que traza Vbridge, VoutIdeal y el error relativo punto por punto."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Compensación de resistencia de cables (conexión a 3 hilos): la práctica estándar para galgas remotas en campo, no simulada aquí — este laboratorio asume una conexión de 2 hilos ideal, sin resistencia de cableado ni su efecto de desbalance en el puente."
  - "Autocalentamiento de la galga como límite real del voltaje de excitación Vex: este simulador permite ajustar Vex libremente en su rango (2.5–10 V) sin advertir sobre el límite térmico real que impone la disipación de potencia en la galga."
  - "Offset de voltaje, deriva térmica y error de ganancia propios del INA128: este simulador modela únicamente el error inducido por CMRR, no los demás términos de error de un amplificador de instrumentación real (documentados en su hoja de datos)."
  - "Ruido del amplificador y del puente (ruido térmico Johnson-Nyquist de las galgas, ruido de entrada del INA128): no modelado."
  - "Recorte de salida por el rango de alimentación (rail-to-rail o no) del INA128: este simulador NO recorta VoutIdeal aunque supere el swing de salida real del amplificador para una alimentación típica — en vez de inventar una cifra de riel no verificada, se muestra una advertencia visual cuando |VoutIdeal|>12 V, dejando explícito que ese caso es un ejercicio conceptual, no una predicción de comportamiento físico real."
  - "Tolerancia real de fabricación de las galgas (±0.1–0.5% típico) y de los resistores de compleción del puente: este simulador calcula Vbridge y VoutIdeal de forma exacta según los valores discretos que ofrece, sin variabilidad de componente."
  - "El tamaño del modelo 3D del resistor de ganancia R_G no se escala según su valor de resistencia (a diferencia de los inductores/capacitores de las prácticas de fuentes conmutadas, cuyo tamaño físico real sí se correlaciona razonablemente con su valor): el tamaño físico real de un resistor no se correlaciona de forma significativa con su resistencia, así que escalarlo habría sido una convención visual engañosa."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: tipo de puente y ganancia G elegidos, y confirmación del simulador de que el diseño alcanza el VoutIdeal objetivo (±5%) y mantiene el error de CMRR (peor caso) menor o igual al 2% de la señal, o la retroalimentación específica reportada (cuál de las condiciones falla) cuando el diseño no cumple."
evidencia_desempeno: "Guía de observación del modo Predicción (Vbridge, VoutIdeal o dependencia del error con el tipo de puente, predichos antes de la confirmación) y del modo Medición (identificación en vivo de cómo el barrido de ε traza la relación lineal/no lineal según el tipo de puente elegido)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué una galga extensométrica necesita un puente de Wheatstone para volverse medible, la diferencia entre ¼/½/puente completo, y por qué el amplificador de instrumentación (y su CMRR) es indispensable frente al enorme voltaje de modo común del puente (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo Vex/ε/tipo de puente/G cambian Vbridge, VoutIdeal y el error de CMRR → predice Vbridge, VoutIdeal o la dependencia del error con el tipo de puente → barrido automático de ε trazando la relación lineal/no lineal en vivo → reto de diseño de un punto de operación con error de CMRR bajo control."
cierre: "Ficha técnica (capa 2) con el INA128, la galga extensométrica, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con un puente de galgas real y un multímetro de precisión."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "National Instruments, AN078, 'Measuring Strain with Strain Gages': fuente principal de las fórmulas exactas de ¼, ½ y puente completo."
  - "Vishay Precision Group, 'Strain Gage Data Book', sección Gauge Factor: fuente del valor típico GF≈2.0–2.1 para galgas de constantano."
  - "Omega Engineering, nota técnica E-94, 'The Strain Gage': fuente adicional de verificación cruzada del factor de galga típico."
  - "Texas Instruments, hoja de datos INA128/INA129 (SBOS051) — https://www.ti.com/lit/ds/symlink/ina128.pdf: fuente de la fórmula de ganancia G=1+50kΩ/R_G y de la tabla de CMRR mínimo/típico por ganancia."
  - "Texas Instruments, sboa247/tidub00, 'Bridge Measurement Circuit' (nota de circuito de ingeniería analógica): fuente del voltaje de modo común del puente Vcm≈Vex/2 y del cálculo de error de salida inducido por CMRR."
banderas_incertidumbre:
  - "⚑ Los valores de CMRR intermedios de G (entre los 4 puntos ancla publicados en la hoja de datos: G=1, 10, 100, 1000) se calculan por interpolación log-lineal en este simulador — una aproximación razonable pero NO un dato publicado punto a punto por el fabricante; confirmar con el responsable curricular si esta aproximación es aceptable pedagógicamente o si conviene restringir los steppers de G a los 4 valores exactos de la hoja de datos."
  - "⚑ El umbral de |VoutIdeal|≤12 V usado para la advertencia visual de swing de salida y para restringir el modo Reto es una cifra de referencia pedagógica, no una especificación verificada de un riel de alimentación real del INA128 — confirmar con el responsable curricular si conviene anclarla a una configuración de alimentación específica (p. ej. ±15 V o alimentación única de 5 V) documentada en la hoja de datos."
  - "⚑ Submódulo curricular ('Acondicionamiento de señal de sensores — puentes resistivos y amplificadores de instrumentación') no verificado contra un catálogo externo del plan vigente — mismo tipo de reserva ya documentada en mecanica-32/d2-11 a mecanica-37/d2-16."
  - "✅ Verificación con Playwright completada (ver nota 3 más abajo)."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimoséptima práctica de Tanda 1 / D2, primera del sub-arco de
   acondicionamiento de señal de precisión):** d2-17 cierra el paréntesis de fuentes
   conmutadas abierto por d2-15/d2-16 (buck/boost) y regresa al acondicionamiento de señal,
   pero con un salto de complejidad respecto a d2-11 (op-amp inversor/no inversor): ahora la
   señal de interés es minúscula (milivoltios) y está montada sobre un voltaje de modo común
   mucho mayor, lo que obliga a introducir el concepto de CMRR — no presente en las prácticas
   anteriores de la tanda. El laboratorio prepara el terreno para d2-18 (etapa clase AB y
   disipador), la última práctica de D2.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/instrumentacion.html](../../../public/labs/instrumentacion.html)) muestra el
   panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con las fórmulas exactas de ¼/½/
   puente completo, la ganancia del INA128, la tabla de CMRR, el cálculo de error de salida, y
   la nota de rigor sobre GF=2.0 y R_galga=350 Ω como valores representativos, documentado en
   la sección 2 de la ficha técnica in-app.
3. **Verificación de implementación:** ✅ Completada. Se ejecutó una verificación automatizada
   con Playwright (Chromium headless, sirviendo `public/labs/` por HTTP local en el puerto
   8541) contra `instrumentacion.html`, análoga a la realizada en mecanica-36/d2-15 y
   mecanica-37/d2-16, con **12/12 comprobaciones aprobadas**: (1) el punto de referencia
   (Vex=5 V, ε=+1000 µε, ¼ puente, G=100) reproduce Vbridge≈2.4975 mV; (2) reproduce
   VoutIdeal≈249.75 mV; (3) reproduce error de CMRR (peor caso)≈0.1%; (4) el error absoluto de
   salida inducido por CMRR es idéntico entre ¼, ½ y puente completo para el mismo Vex/ε/G,
   confirmando que depende solo de G y Vcm, no del tipo de puente; (5)-(6) las fórmulas de
   medio puente y puente completo son exactamente lineales (Vout/Vex=GF·ε/2 y GF·ε,
   respectivamente, sin término no lineal); (7) la resistencia de ganancia derivada
   RG=50kΩ/(G−1) es correcta para G=100 (≈505.05 Ω); (8) la tabla de CMRR reproduce
   exactamente los 4 puntos ancla de la hoja de datos (G=1→80/86 dB, G=10→100/106 dB,
   G=100→120/125 dB, G=1000→120/130 dB); (9) el botón de referencia (`btnRef`) fija
   correctamente Vex/ε/tipo de puente/G en la UI; (10) el barrido automático (`runSweep()`)
   genera los 8 puntos esperados (uno por cada valor de ε); (11) el modo Predicción acepta
   correctamente un valor de Vbridge correcto y marca el estado como revelado; (12) no se
   registró ningún error de consola ni de página durante toda la sesión de interacción.
4. **Petición concreta al experto:** (a) confirmar la clave exacta del submódulo curricular
   ("Acondicionamiento de señal de sensores — puentes resistivos y amplificadores de
   instrumentación") contra el plan vigente; (b) confirmar si GF=2.0 y R_galga=350 Ω son
   valores suficientemente representativos para fines didácticos o si conviene ofrecer un
   selector de tipo de galga con distintos GF; (c) confirmar si el umbral de |VoutIdeal|≤12 V
   usado en la advertencia de swing de salida y en el modo Reto debería anclarse a una
   configuración de alimentación específica documentada; (d) confirmar si la interpolación
   log-lineal de CMRR entre los 4 puntos ancla de la hoja de datos es pedagógicamente
   aceptable o si conviene restringir el stepper de G a esos 4 valores exactos; (e) confirmar
   si el INA128 sigue siendo representativo de lo que un técnico encuentra en campo para esta
   aplicación, o si convendría contrastar contra otra familia de amplificadores de
   instrumentación (p. ej. AD620) para una práctica posterior.
