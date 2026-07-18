# Ficha de práctica — Motor Monofásico: Fase Partida y Capacitor — Diagnóstico (`mecanica-53`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** décima práctica del dominio D5 (Transformadores/Máquinas eléctricas) —
> d5-10 de 16. Es la **tercera práctica de molde E+S** de la colección (tras d5-04, motor de
> CD, y d5-06, motor de inducción trifásico): el estudiante arma primero el motor monofásico
> pieza por pieza sobre un banco de trabajo y **solo entonces** se desbloquean los modos de
> comparación (Tipos) y diagnóstico (Diagnóstico, Reto). A diferencia de d5-06/d5-08 (motor
> trifásico), esta práctica no modela el circuito eléctrico ni la curva par-velocidad: se
> limita deliberadamente a (a) comparar el par de arranque relativo de las cuatro
> arquitecturas monofásicas más comunes y (b) enseñar el patrón de diagnóstico por
> resistencia entre terminales C-S-R que usa un técnico de campo con un motor desenergizado.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-53
sector: mecanica-electronica
practica_maestra: "d5-10 — Diagnostica motores monofásicos de fase partida y capacitor (molde E+S) — tomado literalmente de la fila d5-10 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-10 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "— (la lista maestra no asigna una norma ancla a esta práctica; la columna 'Norma ancla' de la fila d5-10 está vacía). Se citan como referencia contextual, no como norma ancla: NEMA MG-1 (clasificación general de motores monofásicos) y la teoría estándar de conversión electromecánica de textos de referencia del sector."
modulo: "Transformadores (D5)"
submodulo: "Motores monofásicos de inducción: comparación de tipos y diagnóstico de fallas por resistencia (molde E+S — tercer híbrido ensamble+simulación de la colección, tras d5-04 y d5-06)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..09/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de mantenimiento de motores monofásicos antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de identificar y ensamblar, en el orden correcto,
  las piezas principales de un motor monofásico de jaula de ardilla (devanado principal,
  devanado auxiliar, rotor de jaula de ardilla, tapas trasera y delantera, interruptor
  centrífugo, ventilador con su cubierta y capacitor de arranque, sobre una carcasa fija);
  explicar por qué un devanado monofásico único no puede arrancar un rotor detenido (campo
  pulsante, no giratorio) y por qué el devanado auxiliar —con o sin capacitor— resuelve ese
  problema mediante un desfase eléctrico de su corriente respecto a la del devanado
  principal; comparar las cuatro arquitecturas monofásicas más comunes (fase partida RSIR,
  capacitor de arranque CSIR, capacitor permanente PSC, capacitor de arranque y marcha CSCR)
  por su par de arranque relativo, corriente de arranque, presencia de interruptor
  centrífugo y número de capacitores; e interpretar lecturas de resistencia entre los
  terminales Común (C), Start (S) y Run (R) de un motor desenergizado para diagnosticar seis
  escenarios: motor sano, devanado auxiliar abierto, devanado principal abierto, capacitor en
  corto, capacitor abierto y devanado principal en corto a tierra.
actividad_clave: >
  Arma un motor monofásico de jaula de ardilla pieza por pieza sobre un banco de trabajo
  (modo Ensamble) — los modos de comparación y diagnóstico permanecen bloqueados hasta
  completar el armado. Con el motor ya ensamblado, se desbloquean tres modos adicionales
  sobre el mismo tablero esquemático: Tipos (compara las cuatro arquitecturas monofásicas por
  su rango de par de arranque en una gráfica de barras, y consulta la ficha detallada de cada
  una), Diagnóstico (explora seis escenarios de falla con sus lecturas de óhmetro C-R/C-S/S-R,
  continuidad a tierra, estado del capacitor y síntoma observable) y Reto (dado un escenario
  de falla sin nombre, identifica el diagnóstico correcto entre las seis opciones a partir de
  sus lecturas).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Ensamble: identifica cada pieza resaltada en la bandeja de piezas (devanado principal de marcha, devanado auxiliar de arranque, rotor de jaula de ardilla, tapa trasera, tapa delantera, interruptor centrífugo, ventilador con su cubierta, capacitor de arranque) y colócala en su pedestal numerado correspondiente sobre la carcasa fija; el simulador rechaza colocar una pieza en un pedestal equivocado y confirma visualmente cada acierto."
  - "Al completar las ocho piezas móviles sobre la carcasa fija, el simulador desbloquea automáticamente los modos Tipos, Diagnóstico y Reto (antes bloqueados, con aviso si se intenta acceder antes de tiempo) — replicando la práctica real de no energizar ni probar un motor a medio ensamblar."
  - "Modo Tipos: selecciona entre las cuatro arquitecturas (RSIR, CSIR, PSC, CSCR) y observa en el tablero una gráfica de barras horizontales con el rango de par de arranque de cada una (RSIR 100-175% FLT, CSIR/CSCR 350-450% FLT, PSC 50-100% FLT) junto con su corriente de arranque relativa, presencia de interruptor centrífugo, número de capacitores, desfase eléctrico aproximado y uso típico — verifica el ordenamiento con `node -e`: PSC tiene el menor par de arranque y RSIR uno intermedio, mientras que CSIR y CSCR (ambos con capacitor de arranque) alcanzan el mayor par."
  - "Modo Diagnóstico: selecciona uno de seis escenarios de falla desde un menú desplegable y lee en el tablero las tres resistencias entre terminales (C-R, C-S, S-R), el resultado de la prueba de continuidad a tierra, el estado del capacitor y el síntoma observable descrito en lenguaje de campo — el tablero recuerda explícitamente que toda prueba de continuidad se realiza con el motor desenergizado."
  - "Verifica la regla de campo con las lecturas del tablero en el caso 'motor sano': R(C-R) + R(C-S) ≈ R(S-R) — confirmado por construcción con `node -e` para los seis escenarios con lecturas finitas (2.0 Ω + 3.6 Ω = 5.6 Ω exactos), consistente con que C-R y C-S son las resistencias de cada devanado por separado y S-R es la suma de ambas en serie."
  - "Modo Reto: el simulador elige al azar uno de los seis escenarios de falla (único uso de aleatoriedad en la práctica) y muestra sus lecturas sin revelar el nombre del diagnóstico; el estudiante elige, entre seis botones de opción múltiple, cuál de los seis diagnósticos corresponde a esas lecturas, y recibe retroalimentación inmediata."
normatividad:          # 🔒 sin norma ancla asignada — referencias contextuales únicamente
  - "La lista maestra no asigna una norma ancla a la fila d5-10 (columna 'Norma ancla' vacía) — a diferencia de d5-06/d5-08/d5-09, esta práctica no cita ni pretende verificar una cláusula normativa específica."
  - "NEMA MG-1 'Motors and Generators' — se cita únicamente como referencia contextual de la clasificación general de motores monofásicos (fase partida, capacitor de arranque, capacitor permanente, capacitor de arranque y marcha); ⚑ no se verificó una cláusula específica de esta norma contra el texto primario en esta sesión, y no se le trata como norma ancla de la práctica."
  - "Teoría estándar de conversión electromecánica de motores monofásicos de inducción (campo pulsante, teoría de doble campo giratorio, desfase por devanado auxiliar y capacitor) — consistente con textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas')."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La razón física por la que un devanado monofásico único no puede arrancar un rotor detenido (campo pulsante, par neto nulo en reposo) y el rol del devanado auxiliar —con o sin capacitor— para crear, mientras dura el arranque, el desfase eléctrico necesario para un campo giratorio parcial."
  - "La comparación cualitativa y de rango entre las cuatro arquitecturas monofásicas más comunes (RSIR, CSIR, PSC, CSCR) por par de arranque relativo (%FLT), corriente de arranque, número de capacitores, presencia de interruptor centrífugo y desfase eléctrico aproximado — verificado por `node -e`: los cuatro rangos son válidos (mínimo ≤ máximo) y el ordenamiento (PSC < RSIR < CSIR ≈ CSCR) es internamente consistente."
  - "Seis escenarios de diagnóstico por resistencia entre terminales C-S-R con lecturas internamente consistentes — verificado por `node -e`: para los cinco escenarios con lecturas finitas, R(C-R) + R(C-S) = R(S-R) exactamente (2.0 Ω + 3.6 Ω = 5.6 Ω), consistente con la relación serie de dos devanados medidos desde un terminal común."
  - "El ensamble mecánico completo del motor (8 piezas móviles sobre una carcasa fija, con verificación de pedestal correcto por pieza) como precondición explícita para desbloquear los modos Tipos/Diagnóstico/Reto — mecanismo de bloqueo de modo (`simUnlocked`) implementado, reutilizando el patrón de d5-04/d5-06 (mecanica-47/mecanica-49)."
  - "El procedimiento real de prueba de continuidad en motores monofásicos: se declara explícitamente en el tablero de Diagnóstico que toda lectura se toma con el motor desenergizado y desconectado de la línea — práctica de seguridad eléctrica real, no solo un detalle de ambientación."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Valores exactos de placa de un motor monofásico real: los rangos de par de arranque por tipo (50-100%, 100-175%, 350-450% FLT) son valores típicos de catálogo/texto de referencia con desacuerdo documentado entre fuentes — se presentan como rango orientativo, nunca como una cifra normativa única o certificada."
  - "El comportamiento dinámico de arranque en el tiempo: ni la corriente de irrupción (inrush) en función del tiempo, ni la aceleración del rotor desde s=1 hasta la velocidad de operación del interruptor centrífugo (≈75% de la velocidad nominal) — el simulador no modela un transitorio temporal."
  - "La curva par-velocidad completa del motor monofásico (con su característica \"joroba\" al desconectarse el devanado auxiliar) — ese análisis dinámico se deja fuera de alcance; el motor trifásico ya cubre la curva par-deslizamiento de Kloss en d5-06."
  - "Un multímetro real con imprecisión de instrumento, ruido de medición o resistencia de contacto de las puntas de prueba — las lecturas de los seis escenarios son valores exactos de guion didáctico, no una simulación de instrumento con tolerancia."
  - "La teoría de doble campo giratorio a nivel de ecuaciones (descomposición del campo pulsante en dos campos giratorios contrarrotantes de igual magnitud) — se explica solo cualitativamente en el HUD; no hay ecuaciones de campo ni fasores animados en el tablero."
  - "El circuito interno específico de un motor CSCR con dos capacitores (arranque + marcha, con sus valores de capacitancia distintos y el relé/interruptor que los conmuta) — el ensamble 3D representa la arquitectura genérica de un capacitor y un interruptor centrífugo; las diferencias de PSC (sin interruptor) y CSCR (dos capacitores) se explican en el modo Tipos como texto comparativo, no como un segundo modelo 3D."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro del motor ensamblado correctamente (captura o confirmación del HUD de progreso 8/8), tabla comparativa de los cuatro tipos de motor con su par de arranque y sus atributos (capacitores, interruptor centrífugo), tabla de al menos cuatro escenarios de falla explorados en modo Diagnóstico con sus lecturas C-R/C-S/S-R, y el diagnóstico correcto resuelto en modo Reto."
evidencia_desempeno: "Guía de observación del orden y correctitud del ensamble pieza por pieza, de la explicación correcta de por qué un devanado único no arranca un motor monofásico, de la identificación del tipo de motor más adecuado para una carga de ejemplo (arranque ligero vs. pesado), y de la justificación de la lectura de terminales usada para llegar al diagnóstico correcto en el modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un motor monofásico no puede arrancar solo con su devanado principal, y por qué este laboratorio exige armar el motor antes de poder compararlo o diagnosticarlo (briefing.ts)."
desarrollo: "Práctica en el simulador: Ensamble (arma las 8 piezas móviles sobre el banco, desbloquea los demás modos) → Tipos (compara las cuatro arquitecturas monofásicas por par de arranque) → Diagnóstico (explora seis escenarios de falla con sus lecturas de óhmetro) → Reto (identifica el diagnóstico correcto a partir de lecturas sin nombre) → recorridos guiados automáticos de ensamble, de tipos y de fallas como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de las cuatro arquitecturas y los seis escenarios de falla, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración de que la lista maestra no asigna norma ancla a esta práctica."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de conversión electromecánica de motores monofásicos de inducción (campo pulsante, devanado auxiliar, desfase por capacitor, interruptor centrífugo) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman)."
  - "⚑ NEMA MG-1 (clasificación general de motores monofásicos: fase partida, capacitor de arranque, capacitor permanente, capacitor de arranque y marcha) — referencia contextual citada por la práctica; no es la norma ancla (la lista maestra no asigna ninguna a esta fila) y no se verificó una cláusula específica contra el texto primario en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..09/D2/D10 — confirmar si existe una clave SINCO más específica de mantenimiento de motores monofásicos antes de publicar la trazabilidad."
  - "⚑ Los rangos de par de arranque por tipo de motor (RSIR 100-175%, CSIR/CSCR 350-450%, PSC 50-100% FLT) son valores típicos de múltiples fuentes de conversión electromecánica y de mantenimiento industrial, con desacuerdo documentado de fuente a fuente en la cifra exacta — confirmar con el experto si conviene citar una fuente única autorizada antes de publicar la práctica a escala."
  - "⚑ La lista maestra no asigna norma ancla a esta práctica — confirmar con el experto si esto es intencional (práctica de comparación/diagnóstico conceptual, sin cláusula normativa aplicable) o si conviene identificar una norma ancla apropiada (p. ej. una parte específica de NEMA MG-1) en una futura revisión."
  - "⚑ El valor base de resistencia de los devanados (R_principal=2.0 Ω, R_auxiliar=3.6 Ω) es un valor ilustrativo del simulador elegido para que la regla de campo R(C-R)+R(C-S)≈R(S-R) sea clara y verificable, no la placa de un motor comercial real — confirmar con el experto si conviene sustituirlo por valores de catálogo real en una futura iteración."
  - "⚑ El ensamble 3D representa la arquitectura genérica de un capacitor y un interruptor centrífugo; el motor CSCR (dos capacitores) y el PSC (sin interruptor) se explican solo como texto comparativo en el modo Tipos, no como un segundo modelo 3D — confirmar con el experto si esta simplificación es pedagógicamente aceptable o si amerita un modelo 3D adicional."
  - "✅ Verificación de implementación: datos de `MOTOR_TYPES` y `FALLAS` verificados por recomputación ejecutada con `node -e` (no a mano) — consistencia aritmética de las seis lecturas de falla (R(C-R)+R(C-S)=R(S-R) exacto) y validez/ordenamiento de los cuatro rangos de par de arranque. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 4 modos, el bloqueo/desbloqueo de modo, el modo Reto con sus seis opciones, y los recorridos guiados automáticos, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (décima práctica de D5, tercera de molde E+S):** d5-10 reutiliza
   el patrón de ensamble 3D + simulación esquemática con bloqueo de modo introducido en d5-04
   (motor de CD) y d5-06 (motor de inducción trifásico), aplicado ahora al motor monofásico.
   La decisión de diseño más importante de esta práctica es de **alcance**: a diferencia de
   d5-06/d5-08 (que modelan cinemática y circuito equivalente del motor trifásico), d5-10 se
   limita deliberadamente a (a) una comparación cualitativa/de rango de las cuatro
   arquitecturas monofásicas por par de arranque, y (b) un patrón de diagnóstico por
   resistencia entre terminales — sin modelar ecuaciones de campo, corriente en el tiempo, ni
   curva par-velocidad. Esta separación se declara explícitamente en el HUD del simulador y
   en la ficha técnica in-app.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/diagnostico-motor-monofasico-capacitor.html](../../../public/labs/diagnostico-motor-monofasico-capacitor.html))
   muestra el HUD con el contrato de fidelidad y el estado de ensamble/desbloqueo —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-diagnostico-motor-monofasico-capacitor.js](../../../public/labs/_ficha-diagnostico-motor-monofasico-capacitor.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`diagnostico-motor-monofasico-capacitor.body.js`).
3. **Verificación de implementación:** ✅ Datos verificados por recomputación ejecutada con
   `node -e` (no a mano): consistencia aritmética de las seis lecturas de falla y validez de
   los cuatro rangos de par de arranque. Pendiente al momento de escribir esta ficha: corrida
   completa de Jest tras `npm run gen:labs`, `tsc --noEmit`, y verificación funcional con
   Playwright contra el HTML construido y servido localmente — completar antes del commit
   final y actualizar esta nota con el resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si la ausencia de norma ancla en la lista
   maestra para esta fila es intencional o si conviene asignar una (p. ej. una parte
   específica de NEMA MG-1); (b) confirmar si los rangos de par de arranque citados (que
   varían de fuente a fuente) deberían anclarse a una única referencia autorizada; (c)
   confirmar si la simplificación de modelar un solo capacitor genérico en el ensamble 3D
   (en vez de distinguir físicamente PSC/CSCR) es pedagógicamente aceptable; (d) confirmar si
   existe una clave SINCO más específica que la reutilizada de la familia D2/D10/d5-01..09
   para mantenimiento de motores monofásicos.
