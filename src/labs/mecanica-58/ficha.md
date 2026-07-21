# Ficha de práctica — Inversión de Giro con Contactores y Enclavamiento (`mecanica-58`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimoquinta práctica del dominio D5 (Transformadores/Máquinas
> eléctricas) — d5-15 de 16. Es la **cuarta práctica de molde E+S** de la colección (tras
> d5-04 motor de CD, d5-06 motor de inducción trifásico y d5-10 motor monofásico): el
> estudiante arma primero el arrancador reversible pieza por pieza sobre un panel de montaje
> y **solo entonces** se desbloquean los modos de simulación esquemática (Circuito, Térmico,
> Reto). A diferencia de d5-10 (sin norma ancla asignada), esta práctica **sí tiene una norma
> ancla real y citable**: IEC 60947-4-1, que fija el tiempo máximo de disparo de un relevador
> térmico por clase — el simulador implementa esa fórmula directamente y la usa como base del
> modo Reto.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-58
sector: mecanica-electronica
practica_maestra: "d5-15 — Cablea la inversión de giro con contactores y enclavamiento (molde E+S) — tomado literalmente de la fila d5-15 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "EM-IV.1; ELE-III.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-15 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEC 60947-4-1 — tomado literalmente de la columna 'Norma ancla' de la fila d5-15 en docs/LISTA-MAESTRA-200-PRACTICAS.md. A diferencia de d5-10 (sin norma ancla asignada), esta fila SÍ tiene una norma ancla real: el simulador implementa la fórmula de tiempo máximo de disparo a 7.2×In por clase (10A/10/20/30) que la norma fija, hedgeando explícitamente que el tiempo MÍNIMO de disparo no está fijado de forma única por la norma (depende del fabricante)."
modulo: "Transformadores (D5)"
submodulo: "Arrancadores reversibles: enclavamiento mecánico/eléctrico y clases de disparo de relevador térmico (molde E+S — cuarto híbrido ensamble+simulación de la colección, tras d5-04, d5-06 y d5-10)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..14/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de control de motores/arrancadores antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de identificar y ensamblar, en el orden correcto,
  las piezas principales de un arrancador reversible (terminales de línea, contactor KM1 de
  Adelante, contactor KM2 de Reversa, enclavamiento mecánico, enclavamiento eléctrico con
  contactos NC cruzados, relevador térmico, terminales al motor y botonera de tres hilos)
  sobre un panel de montaje fijo; explicar por qué un arrancador reversible necesita DOS
  barreras independientes contra el cierre simultáneo de KM1 y KM2 (enclavamiento mecánico y
  eléctrico) y qué falla concreta —un cortocircuito fase-fase— previene cada una; identificar
  la secuencia de fases invertida que produce el sentido de giro contrario (intercambio de
  dos de las tres líneas); y aplicar la fórmula de IEC 60947-4-1 para el tiempo máximo de
  disparo de un relevador térmico (t = t_máx(clase)·(7.2/m)²) para elegir la clase de disparo
  (10, 20 o 30) mínima que no dispare en falso durante el arranque normal de un motor dado.
actividad_clave: >
  Arma un arrancador reversible pieza por pieza sobre un panel de montaje (modo Ensamble) —
  los modos de simulación esquemática permanecen bloqueados hasta completar el armado. Con el
  arrancador ya ensamblado, se desbloquean tres modos adicionales sobre un tablero
  esquemático: Circuito (opera Adelante/Paro/Reversa, observa la secuencia de fases invertida
  en vivo, y desactiva el enclavamiento eléctrico a propósito para ver, de forma controlada,
  la falla de cortocircuito fase-fase que ambas barreras existen para prevenir), Térmico
  (ajusta el múltiplo de sobrecarga m y la clase del relevador térmico, y lee en una gráfica
  de barras el tiempo máximo de disparo de cada clase según IEC 60947-4-1) y Reto (dado el
  múltiplo de arranque y el tiempo real de arranque de un motor, elige la clase de relevador
  térmico mínima que no dispara en falso).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Ensamble: identifica cada pieza resaltada en la bandeja (terminales de línea, KM1, KM2, enclavamiento mecánico, enclavamiento eléctrico, relevador térmico, terminales al motor, botonera de 3 hilos) y colócala en su pedestal numerado correspondiente sobre el panel de montaje fijo; el simulador rechaza colocar una pieza en un pedestal equivocado y confirma visualmente cada acierto."
  - "Al completar las ocho piezas móviles sobre el panel de montaje fijo, el simulador desbloquea automáticamente los modos Circuito, Térmico y Reto (antes bloqueados, con aviso si se intenta acceder antes de tiempo) — replicando la práctica real de no energizar un arrancador a medio cablear."
  - "Modo Circuito: opera Adelante (KM1: L1→U, L2→V, L3→W), Paro y Reversa (KM2: L1→W, L2→V, L3→U) sobre un diagrama de fuerza y control en vivo; con el enclavamiento eléctrico activo, el simulador bloquea el cambio directo de sentido y exige pasar por Paro primero — verifica con `node -e` que el intercambio de fases entre KM1 y KM2 corresponde exactamente a intercambiar L1↔L3 manteniendo L2 fija."
  - "Modo Circuito (demostración de falla controlada): al desactivar manualmente el enclavamiento eléctrico y presionar Adelante seguido de Reversa (o viceversa), el simulador entra en un estado de falla explícito (`fault=true`) que representa KM1 y KM2 energizados simultáneamente — un cortocircuito fase-fase — con retroalimentación visual y textual explícita de por qué esto nunca debe ocurrir en un arrancador real."
  - "Modo Térmico: ajusta el múltiplo de sobrecarga m (4.0-8.0 × Ir) y la clase del relevador (10/20/30); el tablero grafica el tiempo de disparo máximo de las tres clases con la fórmula t=t_máx(clase)·(7.2/m)² — verificado con `node -e`: a m=6.0, clase 10 dispara en máximo 14.4 s, clase 20 en 28.8 s y clase 30 en 43.2 s, consistente con que un múltiplo de sobrecarga menor a 7.2 alarga el tiempo de disparo respecto al tiempo de referencia de cada clase."
  - "Modo Reto: el simulador elige al azar uno de nueve escenarios curados {m, tiempo real de arranque ts} (único uso de aleatoriedad en la práctica) y el estudiante elige, entre tres botones (clase 10/20/30), la clase mínima cuyo tiempo de disparo máximo excede ts — verificado con `node -e` para los nueve escenarios: cada uno tiene un margen positivo saludable (4.6 s a 15.6 s) entre el tiempo de disparo de la clase correcta y el tiempo de arranque real, evitando ambigüedad en la respuesta esperada."
normatividad:          # 🔒 norma ancla real — revisión experta obligatoria antes de publicar
  - "IEC 60947-4-1 (Low-voltage switchgear and controlgear — Part 4-1: Contactors and motor-starters) — norma ancla asignada explícitamente a la fila d5-15 de la lista maestra. Confianza alta en los tiempos MÁXIMOS de disparo por clase de relevador térmico a 7.2×In: Clase 10A 2-10 s, Clase 10 ≤10 s, Clase 20 ≤20 s, Clase 30 ≤30 s — son los valores que implementa directamente la fórmula del simulador."
  - "⚑ El tiempo MÍNIMO de disparo de cada clase no está fijado de forma única por la norma (depende de la curva propia de cada fabricante) — el simulador declara esto explícitamente como zona no modelada, tanto en el HUD como en el tablero Térmico y en la ficha técnica in-app; no se presenta ningún valor mínimo como si fuera normativo."
  - "Convenciones de cableado del enclavamiento eléctrico (contacto NC cruzado en la bobina del contactor opuesto) e inversión de fases (intercambio de dos de las tres líneas) — prácticas estándar de la industria de control de motores, ampliamente documentadas; no se cita aquí una cláusula numerada de IEC 60947-4-1 específica para el cableado del enclavamiento, solo el marco general de la norma sobre contactores y arrancadores."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Por qué un arrancador reversible necesita DOS enclavamientos independientes (mecánico y eléctrico) y la falla concreta —cortocircuito fase-fase por cierre simultáneo de KM1 y KM2— que cada uno previene, incluida una demostración controlada de esa falla cuando el enclavamiento eléctrico se desactiva a propósito."
  - "La secuencia de fases invertida correcta entre los sentidos Adelante (L1→U, L2→V, L3→W) y Reversa (L1→W, L2→V, L3→U) — verificado por `node -e`: el intercambio corresponde exactamente a invertir L1↔L3 manteniendo L2 fija, la convención estándar de inversión de giro trifásico."
  - "La fórmula normativa de IEC 60947-4-1 para el tiempo MÁXIMO de disparo de un relevador térmico de clase 10/20/30 a un múltiplo arbitrario de sobrecarga m: t=t_máx(clase)·(7.2/m)² — verificado por `node -e` en múltiples valores de m y las tres clases."
  - "La relación correcta entre el tiempo de arranque real de un motor y la clase de relevador térmico mínima que no dispara en falso durante ese arranque mientras sigue protegiendo ante una sobrecarga sostenida — verificado por `node -e` para los nueve escenarios curados del modo Reto, todos con margen positivo saludable."
  - "El ensamble mecánico completo del arrancador (8 piezas móviles sobre un panel de montaje fijo, con verificación de pedestal correcto por pieza) como precondición explícita para desbloquear los modos Circuito/Térmico/Reto — mecanismo de bloqueo de modo (`simUnlocked`) implementado, reutilizando el patrón de d5-04/d5-06/d5-10 (mecanica-47/mecanica-49/mecanica-53)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El esquemático eléctrico normalizado completo del circuito de control (bobinas, fusibles, contactos auxiliares con numeración IEC, protecciones de sobrecorriente instantánea) — el tablero de circuito es un diagrama simplificado didáctico, no un plano de control industrial listo para cablear."
  - "El tiempo MÍNIMO real de disparo del relevador térmico por clase — la norma no lo fija de forma única (depende del fabricante) y el simulador nunca presenta un valor mínimo como si fuera normativo."
  - "El dimensionamiento de calibre de conductor, la corriente de plena carga real del motor o el ajuste de disparo (Ir) del relevador en amperios — el simulador trabaja únicamente con el múltiplo adimensional m=I/Ir."
  - "El rebote de contactos, arco eléctrico de apertura o desgaste mecánico de un contactor real — los contactores se modelan como interruptores ideales (abierto/cerrado) sin dinámica de conmutación."
  - "El comportamiento térmico del motor bajo carga variable, rotor bloqueado prolongado o ciclos de arranque repetidos — el simulador evalúa un único evento de arranque contra la curva de disparo del relevador, no un historial térmico acumulado."
  - "El proceso real de verificación de continuidad y aislamiento con instrumentos antes de energizar por primera vez un arrancador — el simulador no incluye esa fase previa, se centra en la lógica de control ya energizado."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro del arrancador ensamblado correctamente (captura o confirmación del HUD de progreso 8/8), registro de al menos un ciclo Adelante→Paro→Reversa operado correctamente en modo Circuito con el enclavamiento activo, registro de la demostración controlada de falla al desactivar el enclavamiento, tabla de tiempos de disparo máximo de las tres clases a un múltiplo de sobrecarga dado en modo Térmico, y el escenario resuelto correctamente en modo Reto."
evidencia_desempeno: "Guía de observación del orden y correctitud del ensamble pieza por pieza, de la explicación correcta de por qué un arrancador reversible necesita enclavamiento mecánico Y eléctrico (no solo uno), de la identificación correcta de la secuencia de fases invertida, y de la justificación numérica usada para elegir la clase de relevador térmico correcta en el modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué invertir el giro de un motor trifásico exige intercambiar dos fases, por qué eso vuelve indispensable un doble enclavamiento (mecánico y eléctrico), y por qué este laboratorio exige armar el arrancador antes de poder operarlo o diagnosticarlo (briefing.ts)."
desarrollo: "Práctica en el simulador: Ensamble (arma las 8 piezas móviles sobre el panel de montaje, desbloquea los demás modos) → Circuito (opera Adelante/Paro/Reversa, observa la secuencia de fases invertida, y explora de forma controlada la falla que previene el enclavamiento) → Térmico (aplica la fórmula de IEC 60947-4-1 para el tiempo máximo de disparo por clase) → Reto (elige la clase de relevador mínima correcta dado un escenario de arranque) → recorridos guiados automáticos de ensamble, circuito y térmico como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de tiempos máximos de disparo por clase de IEC 60947-4-1, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración explícita de que el tiempo mínimo de disparo no está fijado por la norma y no se modela."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "✅ IEC 60947-4-1 (Low-voltage switchgear and controlgear — Part 4-1: Contactors and motor-starters) — norma ancla real asignada a la fila d5-15 de la lista maestra. Confianza alta en los tiempos máximos de disparo por clase (10A/10/20/30) a 7.2×In, que son los valores implementados directamente por la fórmula del simulador."
  - "⚑ Convenciones de cableado del enclavamiento eléctrico (contacto NC cruzado en la bobina opuesta) y de inversión de fases (intercambio de dos de las tres líneas) — prácticas estándar de la industria de control de motores, ampliamente documentadas en literatura técnica y de catálogo de fabricantes de contactores; no se verificó una cláusula numerada específica de IEC 60947-4-1 para el cableado del enclavamiento en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..14/D2/D10 — confirmar si existe una clave SINCO más específica de control/arranque de motores antes de publicar la trazabilidad."
  - "⚑ El tiempo MÍNIMO de disparo de cada clase de relevador térmico no está fijado de forma única por IEC 60947-4-1 (depende del fabricante) — confirmar con el experto si conviene citar un rango típico de catálogo (con fuente específica) en una futura iteración, o si la zona 'no modelada' declarada actualmente es la decisión correcta a mantener."
  - "⚑ Las convenciones de cableado del enclavamiento eléctrico e inversión de fases no citan una cláusula numerada específica de IEC 60947-4-1 — confirmar con el experto si existe una cláusula puntual de la norma que debiera citarse en vez de solo el marco general de contactores y arrancadores."
  - "✅ Verificación de implementación: `TRIP_CLASSES`/`tripTime`/`minClassFor` y los nueve escenarios de `RETO_SCENARIOS` verificados por recomputación ejecutada con `node -e` (no a mano) — la fórmula t=t_máx(clase)·(7.2/m)² y el margen positivo saludable de los nueve escenarios curados. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 4 modos, el bloqueo/desbloqueo de modo, la demostración de falla del enclavamiento, el modo Reto con sus tres clases, y los recorridos guiados automáticos, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimoquinta práctica de D5, cuarta de molde E+S):** d5-15
   reutiliza el patrón de ensamble 3D + simulación esquemática con bloqueo de modo
   introducido en d5-04 (motor de CD), d5-06 (motor de inducción trifásico) y d5-10 (motor
   monofásico), aplicado ahora a un arrancador reversible con contactores. La decisión de
   diseño más importante de esta práctica es que, a diferencia de d5-10 (sin norma ancla
   asignada), **sí existe una norma ancla real y citable** — IEC 60947-4-1 — y el simulador
   implementa directamente su fórmula de tiempo máximo de disparo por clase de relevador
   térmico, en vez de limitarse a comparaciones cualitativas. El simulador también incluye
   deliberadamente una demostración controlada de la falla de cortocircuito fase-fase que
   ocurre al desactivar el enclavamiento eléctrico — una decisión pedagógica explícita para
   que el estudiante entienda por qué la doble barrera es obligatoria, nunca algo que se haría
   con equipo real.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/inversion-giro-contactores.html](../../../public/labs/inversion-giro-contactores.html))
   muestra el HUD con el contrato de fidelidad y el estado de ensamble/desbloqueo —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-inversion-giro-contactores.js](../../../public/labs/_ficha-inversion-giro-contactores.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`inversion-giro-contactores.body.js`).
3. **Verificación de implementación:** ✅ Datos verificados por recomputación ejecutada con
   `node -e` (no a mano): la fórmula de tiempo de disparo de IEC 60947-4-1 y el margen
   positivo de los nueve escenarios curados del modo Reto. Pendiente al momento de escribir
   esta ficha: corrida completa de Jest tras `npm run gen:labs`, `tsc --noEmit`, y
   verificación funcional con Playwright contra el HTML construido y servido localmente —
   completar antes del commit final y actualizar esta nota con el resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si el tiempo mínimo de disparo por clase
   debería citarse con un valor típico de catálogo (y de qué fabricante o fuente) en vez de
   dejarse como zona explícitamente no modelada; (b) confirmar si existe una cláusula
   numerada específica de IEC 60947-4-1 aplicable al cableado del enclavamiento eléctrico que
   debiera citarse en vez del marco general de la norma; (c) confirmar si la demostración
   controlada de la falla de cortocircuito fase-fase (al desactivar el enclavamiento) es
   pedagógicamente apropiada o si debería atenuarse/advertirse de otra forma; (d) confirmar si
   existe una clave SINCO más específica que la reutilizada de la familia D2/D10/d5-01..14
   para control y arranque de motores.
