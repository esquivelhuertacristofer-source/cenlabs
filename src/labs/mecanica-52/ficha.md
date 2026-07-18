# Ficha de práctica — Placas de Datos y Selección de Motores (`mecanica-52`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** novena práctica del dominio D5 (Transformadores/Máquinas eléctricas) —
> d5-09 de 16. Es una práctica de **molde S** (esquemático/tablero de cálculo puro, sin
> ensamble de hardware ni panel de instrumentos físico): el elemento central es un tablero
> tipo placa de datos dibujado en canvas 2D sobre un motor de banco 3D de contexto (sin
> función de medición). Es la primera práctica de D5 centrada en la **lectura normativa de
> la placa** en sí misma (HP, V, Hz, RPM, FP, eficiencia, FS, letra de código, Diseño NEMA),
> en vez de en un ensayo o un fenómeno físico medido — complementa d5-06/d5-07/d5-08, que
> asumían los datos de placa como entrada ya dada.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-52
sector: mecanica-electronica
practica_maestra: "d5-09 — Interpreta placas de datos y selecciona motores (molde S) — tomado literalmente de la fila d5-09 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "EM-II.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-09 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "NOM-016-ENER-2025; NEMA MG-1 — tomado literalmente de la columna 'Norma ancla' de la fila d5-09. ⚑ La columna 'Conceptos' de la fila (FS; letra de código; clases IE) menciona 'clases IE' junto a FS y letra de código, pero la investigación primaria de esta sesión encontró que NOM-016-ENER-2025 explícitamente NO usa las etiquetas IE1–IE4 de IEC 60034-30-1 — ver nota de diseño en la sección 'Notas para el revisor experto' más abajo sobre cómo se resolvió esta aparente contradicción del temario."
modulo: "Transformadores (D5)"
submodulo: "Motores de inducción trifásicos: lectura de placa de datos NEMA MG-1 y selección normativa (molde S — primera práctica de D5 centrada en la placa en sí, no en un ensayo)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..08/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de selección/especificación de máquinas eléctricas antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de identificar y explicar el significado normado
  (NEMA MG-1) de los 9 campos de una placa de datos de motor de inducción trifásico (HP,
  voltaje, frecuencia, RPM, factor de potencia, eficiencia, Factor de Servicio, letra de
  código, Diseño NEMA); calcular el rango de corriente de arranque a rotor bloqueado a partir
  de la letra de código, el HP y el voltaje de línea (I_LR=(kVA/HP·HP·1000)/(√3·V)); calcular
  el HP continuo máximo permitido por el Factor de Servicio (HP×FS) y explicar por qué NO es
  una recomendación de operación continua por encima de FS=1.00; distinguir los Diseños NEMA
  B, C y D por su par de arranque y deslizamiento típicos y asociarlos al tipo de carga que
  arrancan; y evaluar un motor candidato contra los 4 criterios normativos de una aplicación
  (HP, Factor de Servicio, corriente de arranque máxima permitida, Diseño NEMA adecuado)
  para decidir de forma razonada si es apto o no.
actividad_clave: >
  Sobre un tablero tipo placa de datos (canvas 2D con 9 casillas clicables) y un motor de
  banco 3D de contexto, el estudiante recorre cuatro modos: Explora (toca cada casilla de una
  placa de referencia y lee su significado normado, incluyendo la aclaración explícita de que
  NOM-016-ENER-2025 no usa las etiquetas IE1–IE4), Código (ajusta HP, voltaje y letra de
  código con controles y observa cómo cambia el rango de corriente de arranque calculado),
  FS (ajusta HP y Factor de Servicio y observa el HP continuo permitido calculado), y Reto
  (se le presenta un motor candidato con una placa completa y los requisitos de una aplicación
  real —carga mecánica y ambiente de operación— y debe decidir, entre 5 opciones, si el
  candidato es apto o cuál de los 4 criterios incumple). Cada modo tiene un cuestionario de
  opción múltiple con opciones generadas dinámicamente (nunca precableadas) que verifica la
  comprensión del cálculo o del concepto correspondiente.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: el estudiante hace clic en cada una de las 9 casillas de la placa de referencia (10 HP, 220 V, 60 Hz, 1750 rpm, FP 0.86, FS 1.15, letra F, Diseño B) y recibe una explicación de qué mide y para qué sirve ese campo. La casilla de eficiencia muestra explícitamente la aclaración normativa NOM-016 vs. IE."
  - "Modo Código: con HP, voltaje de línea y letra de código ajustables, calcula I_LR=(kVA/HP·HP·1000)/(√3·V) en los dos extremos del rango de kVA/HP de la letra seleccionada. Verificado con `node -e`: HP=10, V=220 V, letra F (kVA/HP 5.00–5.60) → I_LR≈131.22–146.96 A."
  - "Modo FS: con HP y Factor de Servicio ajustables, calcula el HP continuo permitido = HP×FS y muestra una nota cualitativa de por qué no es un punto de operación continua recomendado. Verificado con `node -e`: HP=10, FS=1.15 → HP continuo permitido = 11.5 HP."
  - "Modo Reto: genera un escenario (carga mecánica + ambiente de operación con sus requisitos de HP mínimo, Diseño NEMA requerido, FS mínimo y corriente de arranque máxima permitida) y un motor candidato cuya placa incumple, por construcción, EXACTAMENTE uno de los 4 criterios (o ninguno). El estudiante lee la placa del candidato en el tablero y elige, entre 5 opciones (apto / falla por HP / falla por FS / falla por corriente / falla por Diseño), cuál corresponde."
normatividad:          # 🔒 normas ancla citadas, verificación de fuente primaria donde fue posible
  - "NEMA MG-1 'Motors and Generators' — norma ancla listada en la fila d5-09 de la lista maestra. Se citan: la tabla de 19 letras de código de rotor bloqueado A–V (sin I ni O, con sus 19 rangos de kVA/HP), la definición del Factor de Servicio como margen de sobrecarga continua, y la descripción cualitativa de los Diseños B/C/D (par de arranque, deslizamiento, uso típico). ⚑ Confianza alta en los 19 rangos numéricos de letras de código (dato tabular estándar, ampliamente reproducido en literatura técnica); confianza media en la cita de cláusula exacta del Factor de Servicio — se presenta como concepto normado, no se afirma un número de subcláusula específico sin cotejo palabra por palabra."
  - "NOM-016-ENER-2025 (DOF, código de documento 5765860, publicada 19/08/2025, vigente a partir del 15/02/2026), Tabla 1 de eficiencia mínima — norma ancla listada en la fila d5-09. Fuente primaria consultada directamente en esta sesión. 4 puntos ancla verificados (motores trifásicos, 4 polos): 1 HP→85.5%, 10 HP→91.7%, 50 HP→94.5%, 500 HP→96.2%. La norma declara explícitamente en su texto que su Tabla 1 es un sistema propio de clasificación y que no adoptó las etiquetas IE1–IE4 de ninguna norma internacional."
  - "IEC 60034-30-1 (clases de eficiencia IE1–IE4) — usada ÚNICAMENTE como referencia contextual para explicar, por contraste, qué NO es la Tabla 1 de NOM-016-ENER-2025; ningún umbral numérico de IEC se presenta en este simulador como dato verificado propio."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Las 19 letras de código NEMA MG-1 (A a V, sin I ni O) con sus 19 rangos exactos de kVA/HP a rotor bloqueado, y la fórmula I_LR=(kVA/HP·HP·1000)/(√3·V_línea) — verificado por recomputación exacta con `node -e` de `lockedRotorRange()` contra el código fuente: 19 letras confirmadas, ejemplo HP=10/V=220/letra F → I_LR≈131.22–146.96 A."
  - "El cálculo de HP continuo permitido por el Factor de Servicio (HP×FS) — verificado con `node -e`: continuousHP(10,1.15)=11.5."
  - "Los Diseños NEMA B, C y D con su par de arranque y deslizamiento típicos, presentados como descripción cualitativa (rangos de catálogo), nunca como una fórmula derivada del diseño interno del motor."
  - "Los 4 puntos ancla verificados de la Tabla 1 de NOM-016-ENER-2025 y la distinción explícita y verificada de que NOM-016 NO usa las etiquetas IE1–IE4 — el campo de eficiencia del tablero (`efficiencyDisplay()`) muestra el porcentaje SOLO cuando el HP coincide exactamente con uno de los 4 puntos ancla (1/10/50/500 HP) y en cualquier otro caso muestra '— (consulta la Tabla 1 completa)', evitando fabricar una cifra interpolada. Verificado con `node -e`: efficiencyDisplay(10)='91.7%', efficiencyDisplay(20)='no-anchor' (sin dato inventado)."
  - "Un generador de reto de un único criterio de falla por construcción: se verificó con `node -e`, barriendo las 4 combinaciones de HP_POOL×V_POOL, que (a) las letras de código R–V siempre producen una corriente de arranque que excede el máximo permitido calculado con la letra de referencia H, y (b) la letra F (usada como candidato por defecto cuando el criterio de corriente no es el que falla) siempre queda por debajo de ese mismo máximo — es decir, el escenario de reto nunca puede fallar simultáneamente por dos criterios sin que el diseño lo pretenda, confirmando que `newChallenge()` aísla exactamente el criterio de falla elegido (`failMode`)."
  - "Un tablero canvas 2D (9 casillas clicables tipo placa de datos) con 4 disposiciones de pie de tablero según el modo (Explora: tabla de 4 anclas NOM-016 + aclaración IE; Código: rango de corriente calculado + fórmula; FS: HP continuo calculado + nota cualitativa; Reto: requisitos de la aplicación + veredicto gateado por `retoSolved`), y un motor de banco 3D de contexto (carcasa, tapas, cubierta de ventilador con aspa animada, caja de conexión, punto de montaje de placa) con partes inspeccionables vía picking."
  - "Un cuestionario de opción múltiple por cada uno de los 4 modos, con las opciones generadas dinámicamente a partir de los valores reales seleccionados (nunca precableadas) y mezcladas con `shuffle()` (Fisher-Yates sobre `Math.random()`), cada una con su explicación de por qué es correcta o incorrecta. La pregunta del modo Reto ('¿cuál NO es uno de los 4 criterios?') tiene como respuesta correcta la eficiencia — reforzando que la eficiencia se muestra de forma informativa pero no es un criterio de aptitud evaluado."
  - "El candado de salida de modo (`setMode()`): si el estudiante está en el modo Reto con un reto sin resolver, no puede cambiar a otro modo (ni siquiera vía los botones de modo) hasta resolverlo o pedir un candidato nuevo con 🔀 — previene la fuga de cruce de modo catalogada en la revisión adversarial de Tanda 5."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La Tabla 1 completa de NOM-016-ENER-2025: solo se muestran y usan los 4 puntos ancla verificados contra la fuente primaria (1/10/50/500 HP); cualquier otro HP muestra '— (consulta la Tabla 1 completa)' en vez de un valor interpolado o inventado."
  - "La curva de vida del aislamiento en función de la sobrecarga térmica sostenida — el simulador explica cualitativamente (`fsQualitativeNote()`) que operar cerca del límite de FS reduce la vida útil, pero no modela una curva tiempo-temperatura-vida."
  - "La derivación física de la letra de código a partir del diseño interno del motor (número de barras del rotor, reactancia de dispersión, etc.) — la letra se trata como un dato de placa dado (como en la realidad, el usuario la lee, no la calcula), no como una salida de un modelo electromagnético."
  - "Voltajes o frecuencias fuera de 220/440 V y 60 Hz — el simulador no cubre motores de 50 Hz ni voltajes de media tensión."
  - "Un motor real de catálogo de un fabricante específico — todos los valores de placa (referencia y candidatos generados) son ilustrativos, consistentes en orden de magnitud con motores de inducción trifásicos comerciales típicos, pero NO corresponden a la hoja de datos de un modelo comercial concreto."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro de los cálculos realizados en los modos Código y FS (rango de corriente de arranque y HP continuo permitido, con los valores de HP/V/letra/FS usados), y el veredicto razonado del modo Reto (criterio identificado como incumplido, o aptitud confirmada) para al menos dos motores candidatos distintos."
evidencia_desempeno: "Guía de observación de la explicación verbal correcta de al menos 3 campos de la placa (incluyendo la distinción NOM-016 vs. IE en el campo de eficiencia), de la resolución razonada (no por adivinanza) de las 4 preguntas de opción múltiple con su justificación numérica, y de la decisión correcta y argumentada del modo Reto citando el criterio específico (HP, FS, corriente de arranque o Diseño NEMA) que el candidato cumple o incumple."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la placa de datos es un contrato de desempeño normado (NEMA MG-1) y no una etiqueta genérica, y por qué seleccionar mal un motor de repuesto puede fallar en el arranque o dañarse por sobrecarga (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (lectura de los 9 campos) → Código (cálculo de corriente de arranque desde la letra de código) → FS (cálculo de HP continuo permitido) → Reto (selección de motor candidato contra 4 criterios normativos) — cada modo con su cuestionario de verificación, más un recorrido guiado automático como referencia que termina dejando un reto nuevo sin resolver."
cierre: "Ficha técnica (capa 2) con la tabla de fórmulas, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración explícita de la distinción NOM-016-ENER-2025 vs. clases IE de IEC 60034-30-1."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "NEMA MG-1 'Motors and Generators' — tabla de 19 letras de código de rotor bloqueado, definición de Factor de Servicio, descripción cualitativa de Diseños B/C/D."
  - "NOM-016-ENER-2025 (DOF, código de documento 5765860, 19/08/2025, vigente 15/02/2026), Tabla 1 — fuente primaria consultada directamente; 4 puntos ancla verificados."
  - "⚑ IEC 60034-30-1 — usada solo como referencia contextual de contraste, ningún umbral numérico propio se presenta como dato verificado de este simulador."
banderas_incertidumbre:
  - "⚑ La columna 'Conceptos' de la fila d5-09 en la lista maestra menciona 'clases IE' junto a FS y letra de código. La investigación primaria encontró que NOM-016-ENER-2025 —la norma ancla listada para esta misma fila— NO usa las etiquetas IE1–IE4. Se resolvió tratando las clases IE como referencia contextual explícita (para que el estudiante entienda qué NO es la Tabla 1 de NOM-016), no como un sistema que el motor de esta práctica clasifique activamente. Confirmar con el experto si esta interpretación del temario es la intención original de la fila d5-09."
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..08/D2/D10 — confirmar si existe una clave SINCO más específica de selección/especificación de máquinas eléctricas antes de publicar la trazabilidad."
  - "⚑ La cláusula exacta de NEMA MG-1 que define el Factor de Servicio no se cotejó palabra por palabra contra el texto de la edición vigente en esta sesión — se presenta como concepto normado ampliamente reproducido en literatura técnica, sin afirmar un número de subcláusula específico."
  - "⚑ El límite superior de kVA/HP de la letra V (26.0) se usa como techo de rango sin una cláusula de 'letra V o superior' explícitamente verificada — es el valor más alto tabulado consistentemente en fuentes secundarias de NEMA MG-1 consultadas; confirmar contra el texto vigente de la norma."
  - "✅ Verificación de implementación: física e invariantes de diseño verificados por recomputación ejecutada con `node -e` (no a mano) contra el código fuente de `placa-datos-motor.body.js`: 19 letras de código confirmadas; I_LR(10HP,220V,F)≈131.22–146.96 A; continuousHP(10,1.15)=11.5; efficiencyDisplay(10)='91.7%' y efficiencyDisplay(20)='sin ancla' (no fabrica cifra); y barrido completo de HP_POOL×V_POOL confirmando que el generador de reto (`newChallenge()`) aísla exactamente un criterio de falla por construcción (letras R–V siempre exceden el máximo de corriente calculado con letra H; letra F siempre queda por debajo). Pipeline completo ejecutado: `node scripts/build-lab.mjs placa-datos-motor` (59.8 KiB), `npm run gen:labs`, suite Jest completa (839/839 tests, snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit` (0 errores) y verificación funcional en navegador vía Playwright contra el HTML construido servido por HTTP local: 0 errores de consola, los 4 modos (`#m_explora/#m_corriente/#m_fs/#m_reto`) responden, los 3 valores recomputados coinciden exactamente con `node -e`, el panel de ficha técnica in-app renderiza su tabla §2 correctamente, y el recorrido guiado automático (`#btnAuto`) completa sin generar errores nuevos."
  - "✅ Bug real encontrado y corregido durante la verificación en navegador: `public/labs/_ficha-placa-datos-motor.js` usaba una forma incorrecta del contrato compartido de `_ficha-tecnica.js` — `s1.presentes` como arreglo en vez de string, `s1.omisidos` (typo silencioso, nunca renderizaba) en vez de `omitidos`, y sobre todo `s2.rows` como arreglo de objetos `{c,f,n}` en vez de arreglo de arreglos `[[encabezado...], [fila...], ...]`, lo que producía `TypeError: r.map is not a function` al montar la ficha técnica en cada carga de página. Corregido para seguir exactamente el contrato documentado en el encabezado de `_ficha-tecnica.js`, verificado con el mismo contrato ya usado correctamente por `_ficha-circuito-equivalente-motor-induccion.js` (d5-08) como referencia; el HTML generado por `build-lab.mjs` no necesitó reconstruirse porque las fichas se cargan como `<script src>` independiente, no se inyectan en el build."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (novena práctica de D5, primera centrada en la placa en sí):**
   d5-01 a d5-08 trabajaron con transformadores, motores de CD, generadores, motores de
   inducción y sus ensayos, casi siempre asumiendo los datos de placa (HP, ILR, TLR, Tmáx)
   como entrada ya dada. Esta práctica invierte el enfoque: enseña a **leer e interpretar la
   placa misma** como documento normado (NEMA MG-1) y a usarla para dos cálculos de ingeniería
   (corriente de arranque desde la letra de código, HP continuo desde el Factor de Servicio)
   más un criterio de selección de 4 puntos frente a los requisitos de una aplicación real.
2. **Resolución de la aparente contradicción del temario (clases IE):** la columna
   "Conceptos" de la fila d5-09 lista "FS; letra de código; clases IE", pero la norma ancla
   de la misma fila (NOM-016-ENER-2025) declara explícitamente que NO usa las etiquetas
   IE1–IE4. La decisión de diseño tomada fue mostrar las clases IE únicamente como
   **referencia contextual de contraste** —para que el estudiante entienda con precisión qué
   sistema de clasificación aplica en México y cuál no— en vez de simular una tabla de
   equivalencias IE↔NOM-016 que no existe en la norma. Esto se documenta de forma explícita
   y repetida en el HUD, el tablero, el cuestionario del modo Explora y la ficha técnica
   in-app, precisamente para no enseñar una concordancia que la norma misma niega.
3. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/placa-datos-motor.html](../../../public/labs/placa-datos-motor.html),
   generado con `build-lab.mjs`, 59.8 KiB) muestra el HUD con las fórmulas y el contrato de
   fidelidad (SÍ/NO modela) — documentado en el encabezado de fidelidad del propio archivo
   fuente (`placa-datos-motor.body.js`); la ficha técnica in-app de segunda capa
   (`_ficha-placa-datos-motor.js`) está redactada y publicada en `public/labs/`, siguiendo el
   mismo formato de 6 secciones que el resto de los labs del molde S/S+P — y ya corregida tras
   el bug de forma de datos encontrado en la verificación en navegador (ver punto 4).
4. **Verificación de implementación:** ✅ Invariantes de diseño y física verificados por
   recomputación ejecutada con `node -e` contra el código fuente — ver el bloque
   `banderas_incertidumbre` arriba para los valores exactos, incluyendo el barrido completo
   que confirma que el generador de reto aísla exactamente un criterio de falla por
   construcción. ✅ Pipeline completo (build, `gen:labs`, Jest 839/839, `tsc --noEmit`,
   verificación funcional en navegador vía Playwright) ejecutado y limpio. Durante la
   verificación en navegador se encontró y corrigió un bug real: `_ficha-placa-datos-motor.js`
   no seguía la forma de datos que exige el contrato compartido de `_ficha-tecnica.js`
   (`s2.rows` como arreglo de objetos en vez de arreglo de arreglos, más un typo silencioso
   `omisidos`/`omitidos`), lo que producía un `TypeError` real en cada carga de página —
   detalle completo en `banderas_incertidumbre`.
5. **Petición concreta al experto:** (a) confirmar si la intención original de la columna
   "Conceptos" de d5-09 ("clases IE") se satisface con el tratamiento de referencia
   contextual elegido aquí, o si se esperaba algo distinto; (b) cotejar la definición y
   cláusula del Factor de Servicio, y el techo superior de la letra V (26.0 kVA/HP), contra
   el texto vigente de NEMA MG-1; (c) confirmar si existe una clave SINCO más específica que
   la reutilizada de la familia D2/D10/d5-01..08 para selección/especificación de máquinas
   eléctricas; (d) confirmar si el alcance decidido (excluir la Tabla 1 completa de NOM-016 y
   mostrar solo 4 anclas) es pedagógicamente suficiente o si conviene ampliar los puntos
   ancla verificados en una futura iteración.
