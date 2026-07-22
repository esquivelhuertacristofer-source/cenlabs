# Ficha de práctica — Transitorio RC: Mide la Constante de Tiempo τ en el Osciloscopio (`mecanica-64`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** primera práctica del sector con un **osciloscopio simulado como
> instrumento de medición manual** (base de tiempo seleccionable + cursor deslizante),
> distinto del pizarrón de curvas ya calculadas de `mecanica-63` (d1-05) y del pizarrón
> de esquema estático de `mecanica-13`/`mecanica-61`/`mecanica-62`. Reutiliza el patrón
> de **caja negra parcialmente sellada** (solo C, no todo el circuito) introducido en
> los retos de `mecanica-62`/`mecanica-63`, adaptado a caracterización de un solo
> componente en vez de una red completa de dos terminales.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-64
sector: mecanica-electronica
practica_maestra: "d1-06 — Analiza el transitorio RC y mide τ en el osciloscopio (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1"   # ⚑ confirmar clave exacta del plan vigente (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-06)
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Régimen transitorio de circuitos de primer orden"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de predecir la constante de tiempo τ=R·C de un
  circuito RC serie de primer orden, seleccionar una base de tiempo de osciloscopio
  adecuada para hacer visible el transitorio completo, medir τ manualmente con un cursor
  sobre la traza de carga o descarga leyendo el cruce del 63.2 %/36.8 % de la excursión
  total de voltaje, y aplicar esa medición para caracterizar experimentalmente un
  capacitor de valor desconocido a partir de una resistencia conocida (C=τ_medido/R) —
  el mismo procedimiento que usa un técnico para diagnosticar un capacitor degradado
  o sin marcaje legible en campo.
actividad_clave: >
  Explora un circuito RC serie visible (R, C, fuente de 12 V) alternando entre carga y
  descarga y variando R y C, observando cómo τ=R·C estira o comprime la curva
  exponencial en el eje del tiempo sin cambiar su forma; en el modo Medición, elige
  entre tres bases de tiempo ofrecidas —una demasiado rápida que corta la traza, una
  demasiado lenta que la comprime, y una correcta que hace visible el cruce del 63.2 %—
  y mide τ arrastrando un cursor hasta ese cruce, contrastando la lectura contra el
  τ=R·C calculado (visible en este modo); y en el reto, caracteriza un capacitor
  sellado —solo R es visible— midiendo τ con el cursor (base de tiempo ya ajustada
  automáticamente) y calculando C=τ/R, validado contra una tolerancia pedagógica sin
  revelar el valor real de C si la respuesta es incorrecta.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: sobre un circuito RC serie visible (fuente V=12 V fija, resistor R seleccionable de un banco de 4 valores E12, capacitor C seleccionable de 4 valores), alterna entre fase de carga (v(t)=V(1−e^(−t/τ))) y descarga (v(t)=V·e^(−t/τ)) y observa la traza resultante en el osciloscopio simulado, con la base de tiempo ajustada automáticamente a un valor razonable para la τ actual."
  - "Confirma que duplicar R o C duplica τ (relación lineal τ=R·C), estirando la curva en el eje del tiempo sin alterar su forma exponencial ni el valor asintótico final (V en carga, 0 en descarga)."
  - "Modo Medición: selecciona entre tres bases de tiempo (µs/div o ms/div) generadas con una secuencia realista 1-2-5 (como el dial físico de un osciloscopio real) — una deliberadamente demasiado rápida (la traza se corta antes de completar el transitorio), una demasiado lenta (la traza queda comprimida contra el borde de la pantalla) y una calibrada para que la ventana completa de 10 divisiones cubra aproximadamente 5τ (el transitorio completo es visible con buena resolución en el cruce del 63.2 %)."
  - "Con la base de tiempo correcta seleccionada, arrastra el cursor deslizante (0–10 divisiones) hasta el cruce visible de la línea punteada de referencia (63.2 % de V en carga, 36.8 % en descarga) y presiona 'Medir τ'; el sistema compara la lectura contra τ=R·C calculado y da retroalimentación inmediata (dentro o fuera de ±6 %) — la base de tiempo incorrecta bloquea la medición con una advertencia explícita en vez de aceptar una lectura inválida."
  - "Modo Reto: sobre una caja negra donde solo el capacitor está sellado (❓, R permanece visible y con su código de colores real), con la base de tiempo ya ajustada automáticamente (redondeada a la misma secuencia 1-2-5 del dial, no un valor exacto), mide τ con el cursor —sin retroalimentación de exactitud sobre τ mismo, para no filtrar el valor de C indirectamente— y calcula C=τ_medido/R usando la R conocida, reportando el resultado en nanofaradios; el sistema valida contra una tolerancia relativa (±8 %) sin revelar el valor real de C si la respuesta es incorrecta."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (mismo estándar usado en el esquema del pizarrón: fuente, resistor, capacitor y tierra)."
  - "IEC 60063 — series de valores normalizados E12 y código de colores para el resistor del banco 3D (el capacitor usa etiqueta impresa, no bandas de color, siguiendo la convención real de capacitores electrolíticos)."
  - "ETR-I.1 — régimen transitorio de circuitos de primer orden como resultado de aprendizaje del módulo de circuitos eléctricos CD."
simulador_modela:      # 🔒
  - "Respuesta exponencial exacta de un circuito RC serie de primer orden ante un escalón de CD: carga v(t)=V(1−e^(−t/τ)) y descarga v(t)=V·e^(−t/τ), verificada numéricamente (v(τ)=63.2 %V en carga, v(τ)=36.8 %V en descarga; v(5τ)≈99.3 %/0.7 % respectivamente)."
  - "Selección realista de base de tiempo de osciloscopio con secuencia de dial 1-2-5, incluyendo las dos formas típicas de fallar la medición (traza cortada por base de tiempo muy rápida, traza comprimida por base de tiempo muy lenta) antes de llegar a la elección correcta."
  - "Medición manual con cursor deslizante sobre la traza, replicando el procedimiento real de lectura de un osciloscopio (identificar visualmente el cruce del 63.2 %/36.8 % de la excursión total, no un valor leído automáticamente por el instrumento)."
  - "Caracterización experimental de un componente desconocido (C) a partir de un componente conocido (R) y una medición temporal (τ), con verificación cruzada del redondeo de la base de tiempo del dial para evitar que el estudiante despeje C por álgebra directa desde un valor de pantalla sin medir de verdad."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Resistencia de fuente, resistencia serie equivalente (ESR) del capacitor, ni efecto de carga de la impedancia de entrada del propio osciloscopio sobre el circuito medido — modelo de parámetros concentrados ideal."
  - "Ruido de instrumento, jitter de disparo (trigger) o cuantización propia de un osciloscopio digital real; la traza mostrada es la solución analítica exacta, sin artefactos de muestreo."
  - "Circuitos RC de segundo orden o con múltiples constantes de tiempo — el laboratorio cubre únicamente el caso de primer orden con un único R y un único C en serie."
  - "Tolerancias reales de fabricación de resistores y capacitores (el simulador usa valores nominales exactos, salvo el valor de C en el reto, que es intencionalmente desconocido para el estudiante pero exacto internamente)."
  - "Las tolerancias de retroalimentación (±6 % en τ para el modo Medición, ±8 % en C para el modo Reto) son un margen pedagógico definido por el ejercicio, no una especificación de fabricante ni de instrumento real — se comunican así explícitamente en el HUD y en la ficha técnica (capa 2)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: la medición de τ hecha con el cursor del osciloscopio, el cálculo de C=τ/R derivado de ella, y el valor de C en nanofaradios que el estudiante envía como respuesta."
evidencia_desempeno: "Guía de observación de la selección correcta de base de tiempo antes de medir (rechazando las opciones demasiado rápida o demasiado lenta) y de la colocación precisa del cursor sobre el cruce del 63.2 %/36.8 % en la traza."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el instante de conexión/desconexión de una fuente —el transitorio— tiene su propia física, y cómo esa física gobierna temporizadores, filtros y el debounce de un botón mecánico (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (varía R, C y fase, observa cómo τ=R·C escala la curva) → medición (elige la base de tiempo correcta y mide τ con el cursor, contrastando contra R·C calculado) → reto (capacitor sellado: mide τ y despeja C=τ/R conociendo solo R)."
cierre: "Ficha técnica (capa 2) con la relación τ=R·C completa, sus límites frente a ESR y efectos de carga del instrumento, y el procedimiento real de caracterización de un capacitor desconocido en campo."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): capítulo de circuitos de primer orden (RC y RL), respuesta natural y forzada."
  - "Sadiku, M. N. O. — Fundamentos de circuitos eléctricos (McGraw-Hill): sección de respuesta natural y forzada de circuitos RC, constante de tiempo."
  - "IEC 60617 — Graphical symbols for diagrams (símbolos normalizados, mismo estándar que mecanica-13/mecanica-61/mecanica-62/mecanica-63)."
  - "IEC 60063 — Preferred number series for resistors and capacitors (serie E12) y código de colores para el resistor del banco."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.1 / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Las tolerancias de retroalimentación (±6 % en τ medido, ±8 % en C calculado, con piso absoluto de 5 nF en el reto) son restricciones pedagógicas definidas por el ejercicio, no cifras de instrumento real. Confirmar que el nivel es adecuado para el semestre destino."
  - "⚑ El voltaje de fuente V se deja fijo (12 V) en todos los modos, para que el estudiante concentre la variable de caracterización en R/C/τ; verificar si el revisor prefiere que también sea seleccionable."
  - "⚑ La base de tiempo usa una secuencia de dial 1-2-5 discreta (10 µs/div – 200 ms/div) en vez de un valor continuo; confirmar que este nivel de realismo instrumental (replicando un dial físico) es el adecuado y no excesivo para el semestre destino."
  - "⚑ El modo Reto no da ninguna retroalimentación de exactitud sobre τ (para no filtrar C indirectamente) — solo evalúa el C final calculado por el estudiante; confirmar que este nivel de opacidad intermedia es pedagógicamente adecuado, igual que se preguntó en las fichas de mecanica-62/mecanica-63 sobre el nivel de retroalimentación parcial del reto."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primer instrumento de medición manual del sector):**
   d1-06 introduce el primer **osciloscopio simulado** del backlog: a diferencia del
   pizarrón de curvas ya calculadas de d1-05 (`mecanica-63`) o del esquema estático de
   d1-02/d1-03/d1-04, aquí el estudiante debe *elegir* una base de tiempo antes de que
   la medición sea siquiera posible, y *leer* manualmente un cursor sobre una traza —
   dos decisiones instrumentales que pueden fallar de forma realista (traza cortada o
   comprimida) antes de producir una lectura útil. Es también la primera práctica con
   una caja negra que sella **un solo componente** (el capacitor) en vez de una red
   completa de dos terminales, como hacían los retos de mecanica-62/mecanica-63.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/transitorio-rc.html](../../../public/labs/transitorio-rc.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que las
   prácticas previas de D1, y rotula explícitamente las tolerancias de retroalimentación
   como un margen pedagógico del ejercicio, no como una especificación de fabricante ni
   de instrumento real, para cumplir la regla de honestidad del proyecto
   (`ESTANDAR-MOLDE-LAB-3D.md`).
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares
   ⚑; (b) validar que el nivel de realismo instrumental de la base de tiempo (secuencia
   de dial 1-2-5, con opciones deliberadamente incorrectas) es pedagógicamente
   apropiado y no una complicación innecesaria para este resultado de aprendizaje;
   (c) señalar si el nivel de opacidad del reto (sin retroalimentación de exactitud
   sobre τ, solo sobre C final) es adecuado, o si el revisor prefiere una
   retroalimentación intermedia distinta.
