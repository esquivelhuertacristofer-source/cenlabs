# Ficha de práctica — Impedancias RLC: Calcula y Mide un Circuito Serie o Paralelo (`mecanica-68`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** segunda práctica del hueco D1-CA, y la que le da un origen físico
> real al desfase que `mecanica-67` (d1-09) medía como un parámetro configurado o
> sellado directamente. Aquí el desfase lo produce una impedancia RLC de verdad —
> Z=R+j(ωL−1/ωC) en serie, Y=1/R+j(ωC−1/ωL) en paralelo—, y se mide con la MISMA
> técnica de osciloscopio de dos canales y cruces por cero de la práctica anterior,
> extendida con un resistor shunt de precisión para observar la corriente. Es
> prerrequisito declarado de `d1-11` (resonancia RLC, Q y ancho de banda, siguiente
> práctica del backlog).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-68
sector: mecanica-electronica
practica_maestra: "d1-10 🔴 — Calcula y mide impedancias RLC serie y paralelo (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II"   # ⚑ LISTA-MAESTRA-200-PRACTICAS.md, fila d1-10, NO trae el código "UAX" adicional que sí trae d1-09 — confirmar si es una omisión del documento maestro o una diferencia real de anclaje curricular
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Corriente alterna: impedancia RLC y medición de voltaje/corriente con desfase"   # ⚑ heredado por analogía del submódulo de mecanica-67; confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado sin cambio de mecanica-60..67; confirmar que sigue aplicando a impedancias RLC
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la impedancia Z=R+jX de un circuito
  RLC en configuración serie o paralelo a partir de sus componentes y la frecuencia de
  operación, medir experimentalmente la magnitud |Z| y el ángulo θz con un osciloscopio
  de dos canales (voltaje aplicado y corriente vía resistor shunt), y despejar el valor
  de un componente oculto (R, L o C, según la ronda) a partir de esa medición y las
  ecuaciones de la topología activa.
actividad_clave: >
  Explora libremente la topología (serie o paralelo), los valores de R, L, C y la
  frecuencia de un circuito RLC alimentado por una fuente senoidal de 10 V, observando
  en tiempo real cómo cambian |Z|, θz, el diagrama fasorial y las trazas de voltaje
  (canal 1) y corriente —vía un resistor shunt de precisión (canal 2)— en el
  osciloscopio; en el modo Medición, con R, L, C y f visibles, mide el ángulo θz con
  los cursores de cruce por cero (misma técnica de mecanica-67) y compáralo contra el
  valor real calculado internamente; y en el reto, con un componente sellado, mide |Z|
  leyendo la amplitud de corriente en la rejilla del osciloscopio y θz con los
  cursores, y despeja el valor del componente oculto aplicando las ecuaciones de la
  topología activa.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: selector de topología (serie / paralelo). Componentes seleccionables de listas de candidatos — R∈{10,22,47,100} Ω, L∈{10,22,47,100} mH, C∈{2.2,4.7,10,22} µF— y frecuencia f∈{60,120,250,500} Hz, compartida por ambas configuraciones. La fuente de voltaje es fija: Vm=10 V, φ=0° (canal 1, idéntica referencia que en mecanica-67). |Z| y θz se calculan y muestran en tiempo real con cada cambio."
  - "Modelo de impedancia: en serie, Z=R+j(ωL−1/ωC), con la MISMA corriente circulando por los tres elementos. En paralelo, se suman las admitancias Y=1/R+j(ωC−1/ωL) y Z=1/Y, con el MISMO voltaje en las tres ramas. En ambas topologías, si el voltaje aplicado se toma como referencia de fase 0° (canal 1), la corriente resultante i(t)=Im·sen(ωt+φi) tiene φi=−θz, donde θz es el ángulo de Z — propiedad verificada algebraicamente antes de implementar, válida sin excepción en ambas configuraciones."
  - "Medición de corriente por resistor shunt: un resistor de precisión conocido, Rs=1 Ω, en serie con la rama de corriente (nunca alterando la topología de R/L/C), convierte i(t) en un voltaje v_shunt(t)=Rs·i(t) observable en el canal 2 del osciloscopio. Con Rs=1 Ω, la lectura en volts del canal 2 coincide numéricamente con la corriente en amperes. El canal 1 sigue midiendo el voltaje aplicado directamente sobre las terminales del circuito RLC (no sobre la fuente), por lo que el shunt no introduce ningún error sistemático de amplitud ni de fase en la medición — verificado por razonamiento de topología de circuito antes de implementar."
  - "Osciloscopio de dos canales, mismo mecanismo de cursores de cruce por cero de mecanica-67 (snap automático al cruce más cercano de cada canal, φ_medido=−Δt·360°/T), reutilizado sin modificación: con canal 1=voltaje (fase 0°, referencia) y canal 2=voltaje del shunt (fase igual a la de la corriente), el mismo cálculo que antes daba φ2 ahora da φi=−θz directamente. El canal 2 usa una escala volts/división AUTO-seleccionada por ronda (de un conjunto de décadas candidatas) para mantener la traza de corriente legible sin impresión digital de escala manual, dado que Im varía en un rango amplio (de ≈8 mA a ≈2.9 A) según la combinación de componentes."
  - "Diagrama fasorial polar: mismo pizarrón de mecanica-67, mostrando el fasor de voltaje (10∠0°, referencia) y el fasor de corriente (Im∠φi) en la misma escala polar compartida."
  - "Modo Medición: topología, R, L, C y f todos conocidos y visibles; nada sellado como componente. |Z| y θz NO se muestran como texto — el estudiante mide θz con los cursores (misma técnica de mecanica-67) y el sistema lo compara contra el valor real calculado internamente a partir de R, L, C y f, con tolerancia ±5° (idéntica a la tolerancia de φ en mecanica-67, mismo mecanismo algebraico exacto, sin degeneración numérica posible porque no hay inversión de fórmula involucrada, solo comparación directa)."
  - "Modo Reto: topología conocida; UNO de los tres componentes (R, L o C, elegido al azar por ronda) queda sellado (🔒), los otros dos y f permanecen visibles. El estudiante lee la amplitud de corriente Im en la rejilla del canal 2 (con el volts/división auto-escalado mostrado en pantalla) para obtener |Z|=Vm/Im, mide θz con los cursores, y aplica la fórmula de inversión correspondiente a la topología y al componente sellado para calcular su valor; reporta un único número (en Ω, mH o µF según el componente) que se califica con tolerancia ±25%."
  - "Fórmulas de inversión del componente sellado (verificadas algebraicamente exactas, 0 fallos en 1,536 combinaciones numéricas antes de implementar): serie R=|Z|·cos(θz); serie L=(|Z|·sen(θz)+1/(ωC))/ω; serie C=1/(ω·(ωL−|Z|·sen(θz))); paralelo R=|Z|/cos(θz); paralelo L=1/(ω·(ωC+sen(θz)/|Z|)); paralelo C=(−sen(θz)/|Z|+1/(ωL))/ω."
  - "Filtro anti-degeneración en la generación de rondas del Reto: se detectó numéricamente que un filtro simple de sensibilidad (¿cambia Z si el componente sellado se perturba 10%?) NO detecta casos de cancelación catastrófica en la fórmula de inversión —ángulos θz cercanos a ±90° combinados con una reactancia mucho más grande que la otra pueden producir hasta 63% de error de recuperación bajo ruido de medición realista, aunque la sensibilidad simple los marque como 'aceptables'. Se reemplazó por un filtro directo: para cada combinación candidata (topología, R, L, C, f, componente sellado), se calcula el peor error de recuperación bajo una rejilla de perturbaciones de ±5°/0° en θz y ±8%/0% en |Z| (imitando el margen de error de instrumentación real), y solo se acepta la ronda si ese peor caso es ≤20%. Verificado que esto no produce combinaciones sin salida: 46.3% de aceptación global, mínimo 21.9% por combinación (topología, componente sellado) — suficiente para un bucle de redibujado sin bloqueos."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60027-1 — Letter symbols to be used in electrical technology: notación de impedancia, reactancia y fasores de corriente alterna."
  - "IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering: convenciones de símbolos para impedancia y ángulo de fase."
  - "ELE-II — anclaje curricular tomado del mapeo interno (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-10); confirmar clave y vigencia exacta con el plan de estudios."
simulador_modela:      # 🔒
  - "Modelo exacto de impedancia RLC serie (Z=R+j(ωL−1/ωC)) y paralelo (Y=1/R+j(ωC−1/ωL), Z=1/Y), evaluado sin aproximación, con fuente de voltaje fija Vm=10 V/φ=0° como referencia de fase (canal 1)."
  - "Relación exacta entre el ángulo de la impedancia y el desfase de la corriente: φi=−θz, verificada algebraicamente para ambas topologías, con la corriente evaluada como i(t)=Im·sen(ωt+φi), Im=Vm/|Z|."
  - "Medición de corriente por resistor shunt de precisión (Rs=1 Ω) en serie con la rama, sin error sistemático de amplitud ni fase (canal 1 mide directamente sobre las terminales del RLC, no sobre la fuente) — mismo mecanismo de cursores de cruce por cero de mecanica-67, reutilizado sin modificación, ahora aplicado a voltaje vs. corriente en vez de voltaje vs. voltaje."
  - "Escala volts/división auto-seleccionada por ronda en el canal de corriente, de un conjunto de décadas candidatas, para mantener la traza legible dado el amplio rango dinámico de Im según la combinación de componentes."
  - "Fórmulas de inversión algebraicamente exactas para recuperar un componente sellado (R, L o C) a partir de |Z| y θz medidos, en ambas topologías, verificadas numéricamente antes de implementar (0 fallos en 1,536 combinaciones)."
  - "Filtro de generación de rondas basado en el peor error de recuperación bajo perturbación realista (±5° en θz, ±8% en |Z|), no solo en sensibilidad simple del componente — evita rondas numéricamente mal condicionadas (cancelación catastrófica cerca de θz≈±90°) que producirían un Reto injusto o incalificable con las tolerancias declaradas."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Componentes reales con pérdidas parásitas (resistencia serie equivalente de una bobina o capacitor real, corrientes de fuga) — R, L y C se modelan como elementos ideales puros."
  - "Impedancia de entrada del osciloscopio ni efecto de carga del instrumento sobre el circuito medido — ambos canales se modelan como mediciones ideales sin consumo de corriente propio."
  - "Ruido de instrumentación, ancho de banda finito del osciloscopio ni transitorio de arranque — las señales de voltaje y corriente son senoidales puras en estado estacionario desde t=0, igual que en mecanica-67."
  - "Resonancia (f0=1/(2π√LC)), factor de calidad Q ni ancho de banda — el barrido de frecuencia en este banco es solo para explorar cómo cambia Z con f punto a punto, no para caracterizar la curva de resonancia completa; ese es el tema declarado de la siguiente práctica del backlog (d1-11)."
  - "Sistemas trifásicos ni componentes no lineales (diodos, saturación magnética) — es un circuito RLC lineal de una sola fase, en estado estacionario senoidal."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: el valor del componente sellado (R, L o C, según la ronda) despejado por el estudiante a partir de |Z| y θz medidos, calificado por el sistema con tolerancia ±25%."
evidencia_desempeno: "Guía de observación del uso correcto del mecanismo de medición por cursores (mismo tipo de cruce en ambos canales) para obtener θz en el modo Medición, y de la lectura visual de la amplitud de corriente en la rejilla del osciloscopio en el modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el desfase de la práctica anterior no era arbitrario sino producido por una impedancia real, qué es Z=R+jX, y cómo la técnica de voltaje/corriente con resistor shunt extiende sin cambios el mecanismo de cruces por cero ya aprendido (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (elige topología, ajusta R, L, C y f libremente, observa |Z|, θz, el diagrama fasorial y las trazas de voltaje/corriente en tiempo real) → medición (con todos los componentes visibles, mide θz con los cursores y compáralo contra el valor real) → reto (un componente sellado, mide |Z| en la rejilla y θz con los cursores, despeja el componente oculto con las ecuaciones de la topología)."
cierre: "Ficha técnica (capa 2) con el modelo de impedancia completo para ambas topologías, la deducción de φi=−θz, la técnica de medición de corriente por shunt, y las fórmulas de inversión para cada componente sellado."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): impedancia compleja, circuitos RLC serie y paralelo en régimen senoidal permanente."
  - "Boylestad, R. — Introductory Circuit Analysis (Pearson): reactancia inductiva y capacitiva, análisis fasorial de circuitos RLC."
  - "IEC 60027-1 — Letter symbols to be used in electrical technology."
  - "IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering."
  - "Manuales de aplicación de resistores shunt de precisión (p. ej. notas de aplicación de pinzas de corriente Fluke/Tektronix) — medición de corriente por caída de voltaje en una resistencia conocida como técnica estándar de instrumentación."
banderas_incertidumbre:
  - "⚑ Convención de fase (heredada de mecanica-67, ahora más consecuente): el simulador usa v(t)=Vm·sen(ωt) como referencia de fase 0° y deriva φi=−θz a partir de ahí. La mayoría de los textos de ingeniería eléctrica —incluyendo Hayt/Kemmerly/Durbin, citado arriba— usan COSENO como referencia fasorial estándar de la industria. En mecanica-67 un cambio de convención solo afectaba un ángulo configurado arbitrariamente; aquí afectaría el SIGNO de la relación φi=−θz frente a la convención de signo de X=XL−XC en los textos de referencia. Es la pregunta más importante para el experto antes de escalar el patrón a d1-11 (resonancia)."
  - "⚑ Anclaje curricular: 'programa_oficial' de d1-10 en LISTA-MAESTRA-200-PRACTICAS.md solo trae 'ELE-II', sin el código adicional 'UAX' que sí acompaña a d1-09 — confirmar si es una diferencia real o una omisión del documento maestro. 'submodulo' y 'ocupacion_SINCO' se heredaron sin cambio de mecanica-67 por analogía directa de módulo; confirmar que siguen aplicando."
  - "⚑ Filtro de generación de rondas por peor-error-de-recuperación (≤20%) y tolerancia de calificación del Reto (±25%): son parámetros pedagógicos elegidos tras verificación numérica exhaustiva (ver 'desarrollo' arriba) para evitar rondas mal condicionadas, no una especificación de instrumento real. Confirmar que el nivel de exigencia resultante (algunas combinaciones de componentes se descartan silenciosamente antes de mostrarse al estudiante) es pedagógicamente aceptable, o si el experto preferiría en su lugar simplemente acotar más el rango de componentes disponibles."
  - "⚑ Modelo de medición de corriente por resistor shunt (Rs=1 Ω fijo, sin resistencia parásita, sin caída de voltaje que perturbe el resto del circuito): confirmar que esta idealización es aceptable para el nivel de la práctica, dado que un shunt real sí introduce una pequeña resistencia adicional en la rama medida."
  - "⚑ Segunda práctica del hueco D1-CA: no modela resonancia, Q ni ancho de banda — el barrido de frecuencia es punto a punto, no una curva continua. Esa caracterización es el tema declarado de d1-11, la siguiente práctica del backlog. Confirmar que esta secuenciación (impedancia general primero, resonancia después) es pedagógicamente correcta."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (segunda práctica del hueco D1-CA):**
   `d1-10` le da un origen físico real al desfase que `mecanica-67` (d1-09) trataba
   como un parámetro configurado o sellado directamente. La novedad estructural es la
   extensión del osciloscopio de dos canales de voltaje-vs-voltaje a voltaje-vs-corriente,
   usando un resistor shunt de precisión (Rs=1 Ω) — el mecanismo de cursores de cruce
   por cero, la fórmula φ=−Δt·360°/T y la detección del error de 180° por tipos de
   cruce inconsistentes se reutilizan sin ninguna modificación de código, solo
   reinterpretados: ahora miden φi=−θz en vez de un φ2 arbitrario.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/impedancias-rlc.html](../../../public/labs/impedancias-rlc.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el
   resto de la familia, y declara explícitamente que el circuito es lineal e ideal (sin
   pérdidas parásitas) y que no caracteriza resonancia — siguiendo la regla de
   honestidad del proyecto (`ESTANDAR-MOLDE-LAB-3D.md`: rangos, no cifras inventadas).
3. **Petición concreta al experto:** (a) la más importante — confirmar si la
   convención de fase debe ser SENO (como está implementado, heredado de mecanica-67)
   o COSENO (más común en varios textos de referencia citados arriba), ya que aquí el
   cambio afectaría el signo de la relación φi=−θz frente a la convención de signo de
   X=XL−XC en los textos, no solo un ángulo configurado arbitrariamente como en d1-09;
   (b) validar que el filtro de generación de rondas por peor-error-de-recuperación
   (≤20%, con tolerancia de calificación ±25%) es una forma pedagógicamente aceptable
   de evitar rondas mal condicionadas, o si preferiría acotar más directamente el rango
   de componentes; (c) confirmar los rangos de R, L, C y frecuencia como representativos
   de un banco RLC didáctico real; (d) confirmar o corregir las claves curriculares ⚑,
   en particular la ausencia del código "UAX" en la fila d1-10 del documento maestro.
