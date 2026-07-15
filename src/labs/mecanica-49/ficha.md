# Ficha de práctica — Motor de Inducción: Deslizamiento y Curva Par-Velocidad (`mecanica-49`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** sexta práctica del dominio D5 (Transformadores/Máquinas eléctricas) —
> d5-06 de 16. Es la **segunda práctica de molde E+S** de la colección (tras d5-04, motor de
> CD): el estudiante arma primero el motor de inducción pieza por pieza sobre un banco de
> trabajo y **solo entonces** se desbloquean los tres modos de simulación (Operación, Curva,
> Reto). A diferencia de d5-04/d5-05 (que sí modelan el circuito eléctrico del motor), esta
> práctica se limita deliberadamente a la relación **cinemática** (ns, s, n, T, Pmec) y deja
> el circuito eléctrico equivalente del motor de inducción para la práctica siguiente del
> programa (d5-08), que lo deriva explícitamente por ensayos de vacío y rotor bloqueado.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-49
sector: mecanica-electronica
practica_maestra: "d5-06 — Mide el deslizamiento y traza la curva par-velocidad del motor de inducción (molde E+S) — tomado literalmente de la fila d5-06 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II.1; EM-II.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-06 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEEE 112; IEC 60034 — tomado literalmente de la columna 'Norma ancla' de la fila d5-06. ⚑ Ambas son citas generales de la familia normativa (IEEE 112: procedimientos de prueba de motores de inducción polifásicos; IEC 60034: máquinas eléctricas rotativas); no se verificó una cláusula específica de ninguna de las dos contra el texto primario en esta sesión."
modulo: "Transformadores (D5)"
submodulo: "Motores de inducción trifásicos: deslizamiento y curva par-velocidad (molde E+S — segundo híbrido ensamble+simulación de la colección, tras d5-04)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01..05/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de mantenimiento de máquinas de inducción antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de identificar y ensamblar, en el orden correcto,
  las piezas principales de un motor de inducción trifásico de jaula de ardilla (estátor con
  devanado trifásico, rotor de jaula de ardilla, tapas trasera y delantera, ventilador
  externo y su cubierta, sobre una carcasa fija); calcular, a partir de la frecuencia de
  línea (f), el número de polos (p) y el par de carga (TL), la velocidad síncrona
  ns=120·f/p, el deslizamiento s=(ns−n)/ns, la velocidad del rotor n y el par
  electromagnético T(s)=2·Tmáx/(s/sm+sm/s) (ecuación de Kloss); reconocer que para cada
  TL≤Tmáx existe exactamente un punto de operación estable en la rama 0<s≤sm, y que para
  TL>Tmáx el motor se cala (s=1, n=0); y resolver escenarios numéricos de predicción (modo
  Reto) sobre ns, s y n a partir de datos parciales del motor (frecuencia, polos, velocidad
  medida o deslizamiento de placa).
actividad_clave: >
  Arma un motor de inducción trifásico de jaula de ardilla pieza por pieza sobre un banco de
  trabajo (modo Ensamble) — los controles de simulación permanecen bloqueados hasta
  completar el armado. Con el motor ya ensamblado, se desbloquean tres modos adicionales
  sobre el mismo tablero esquemático: Operación (ajusta f/p/TL con deslizadores y observa un
  diagrama de deslizamiento con telemetría en vivo de ns/s/n/T/Pmec), Curva (explora la curva
  par-deslizamiento de Kloss, distingue la rama estable de la inestable y localiza el punto
  de operación) y Reto (dado un escenario con f/p fijos —y, según el tipo de pregunta, n
  medida o s0 de placa—, calcula ns, s o n antes de verificar la respuesta con tolerancia).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Ensamble: identifica cada pieza resaltada en la bandeja de piezas (estátor con núcleo laminado y devanado trifásico de tres fases A/B/C, rotor de jaula de ardilla con barras y anillos de cortocircuito, tapa trasera con muñón para el ventilador, tapa delantera con eje de salida, ventilador externo, cubierta perforada del ventilador) y colócala en su pedestal numerado correspondiente sobre la carcasa fija; el simulador rechaza colocar una pieza en un pedestal equivocado y confirma visualmente cada acierto."
  - "Al completar las seis piezas móviles sobre la carcasa fija, el simulador desbloquea automáticamente los modos Operación, Curva y Reto (antes bloqueados, con aviso si se intenta acceder antes de tiempo) — replicando la práctica real de no energizar un motor a medio ensamblar."
  - "Modo Operación: ajusta los tres deslizadores (f∈[50,60] Hz, p∈{2,4,6,8}, TL∈[0,26] N·m) y observa en el tablero un diagrama de deslizamiento (marcador del campo del estátor girando a ns, marcador del rotor girando a n) junto con telemetría en vivo de ns, s, n, T y potencia mecánica Pmec=T·ω — verifica que subir p a paridad de f reduce ns en la misma proporción (confirmado por recómputo exacto con `node -e`: ns=1800 rpm para f=60,p=4 y ns=900 rpm para f=60,p=8)."
  - "Modo Curva: recorre la curva par-deslizamiento de Kloss trazada para los Tmáx/sm del simulador, con la rama estable (0<s≤sm, sólida) y la rama inestable (sm<s<1, punteada) claramente distinguidas, y ubica el punto de operación correspondiente al TL actual — observa cómo, al superar Tmáx con el deslizador de TL, el punto de operación salta a s=1 (motor calado) y el HUD muestra la advertencia de calado."
  - "Verifica al menos dos casos límite con las lecturas del tablero: (a) carga nula — con TL=0, s=0 exacto y n=ns exacto (el motor gira a la velocidad síncrona, sin deslizamiento, condición límite no realizable en un motor real pero consistente con la ecuación de Kloss en el límite TL→0); (b) calado — con TL por encima de Tmáx (22 N·m en el simulador), el motor no encuentra punto de operación estable, s salta a 1, n cae a 0 y Pmec cae a 0."
  - "Modo Reto: con un escenario de f/p fijado por el simulador (visible en el tablero) y, según el tipo de pregunta (ns, s o n), un dato adicional (n medida por tacómetro simulado, o deslizamiento nominal de placa s0), calcula la cantidad objetivo con las fórmulas de §6 y verifica tu respuesta con la tolerancia indicada."
normatividad:          # 🔒 normas ancla citadas de forma general, sin cláusula específica verificada
  - "IEEE 112 'IEEE Standard Test Procedure for Polyphase Induction Motors and Generators' — norma ancla listada en la fila d5-06 de la lista maestra; ⚑ no se verificó una cláusula específica de esta norma contra el texto primario en esta sesión — citada como referencia general del procedimiento de ensayo de motores de inducción, no como fuente literal de los valores numéricos del simulador."
  - "IEC 60034 'Rotating electrical machines' (familia de normas, múltiples partes) — norma ancla listada en la fila d5-06 de la lista maestra; ⚑ no se identificó ni verificó la parte específica de la familia (p. ej. IEC 60034-1, -2-1, -12) aplicable a esta práctica — pendiente de confirmación experta antes de citar una cláusula concreta."
  - "Teoría estándar de conversión electromecánica de motores de inducción trifásicos (velocidad síncrona, deslizamiento, ecuación simplificada de Kloss) — consistente con textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas')."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La relación cinemática ns=120·f/p entre frecuencia de línea, número de polos y velocidad síncrona; la definición de deslizamiento s=(ns−n)/ns; y la curva par-deslizamiento simplificada de Kloss T(s)=2·Tmáx/(s/sm+sm/s) — verificado por recomputación exacta con `node -e` de `motorState()` contra el código fuente de par-velocidad-motor-induccion.body.js para combinaciones de esquina (f∈{50,60}, p∈{4,8}, TL∈{0,10,22,23}): caso por defecto (f=60,p=4,TL=10)→ns=1800 rpm, s≈0.04327, n≈1722.11 rpm, Pmec≈1803.4 W; carga nula (TL=0)→s=0 y n=ns exactos; TL=Tmáx=22→deslizamiento de vuelco s=sm=0.18 exacto, n=1476 rpm; TL=23>Tmáx→motor calado, s=1, n=0, Pmec=0, T≈7.67 N·m (par de arranque de la curva)."
  - "La forma cerrada exacta del deslizamiento de operación en la rama estable, s(TL)=sm·(1−√(1−k²))/k con k=TL/Tmáx — verificada contra un solver de bisección independiente sobre la ecuación de Kloss para el mismo rango de TL, con error máximo 3.35×10⁻⁹ sobre los casos de esquina probados."
  - "Que para cada TL≤Tmáx existe exactamente un punto de operación estable en la rama 0<s≤sm, y que para TL>Tmáx no existe ninguna solución en esa rama (el motor se cala) — propiedad derivada matemáticamente de la ecuación de Kloss, no una regla añadida aparte; confirmada para TL=22 (límite) y TL=23 (justo por encima)."
  - "El ensamble mecánico completo del motor (6 piezas móviles sobre una carcasa fija, con verificación de pedestal correcto por pieza) como precondición explícita para desbloquear la simulación — mecanismo de bloqueo de modo (`simUnlocked`) implementado, reutilizando el patrón de d5-04 (mecanica-47)."
  - "Un tablero esquemático (canvas 2D sobre panel 3D) que alterna entre diagrama de deslizamiento, curva par-deslizamiento de Kloss y escenario de reto, con telemetría en vivo derivada siempre de motorState(), nunca de una tabla precalculada. El rotor y el ventilador giran en la escena 3D a una velocidad angular proporcional a ω=n·2π/60, congelándose visualmente cuando el motor está calado."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El circuito eléctrico equivalente del motor de inducción (resistencias e impedancias de estátor y rotor, rama de magnetización) — se declara explícitamente que ese es el objeto de la práctica siguiente del programa (d5-08, 'Deriva el circuito equivalente del motor de inducción por ensayos'); esta práctica se limita a la relación cinemática ns-s-n-T."
  - "La relación V/f de un variador de frecuencia (VFD) ni el debilitamiento de campo a frecuencias altas: Tmáx y sm se tratan como constantes fijas (22 N·m, 0.18), independientes de f, en todo el rango del deslizador de frecuencia (50-60 Hz); el rango del deslizador se restringió deliberadamente a los dos estándares de red eléctrica más comunes (no a un rango típico de VFD) precisamente para no implicar esa relación sin modelarla."
  - "La corriente de línea, el factor de potencia ni la potencia eléctrica de entrada — el simulador solo calcula y reporta potencia mecánica de salida (Pmec=T·ω), nunca una eficiencia (Pmec/Pin), porque no modela el lado eléctrico del motor."
  - "El transitorio de arranque del motor: en la realidad, un motor de inducción con arranque directo consume una corriente de arranque muy alta (típicamente 6-8× la nominal) durante el instante en que s=1 — el simulador solo muestra puntos de operación ya establecidos (estacionarios) o el punto de arranque como un valor más de la curva, nunca el transitorio eléctrico ni el esfuerzo térmico asociado."
  - "Métodos de arranque reducido (estrella-delta, autotransformador, arrancador suave) — se declaran explícitamente fuera de alcance; son el objeto de la práctica d5-07 ('Compara métodos de arranque y sus corrientes de irrupción')."
  - "La rama inestable del deslizamiento (sm<s<1) como un punto de operación real y sostenible para una carga de par constante — se muestra en la curva únicamente como referencia teórica de la forma completa de la ecuación de Kloss, no como un régimen de trabajo válido."
  - "Rodamientos, aislamiento de ranura y barniz de impregnación del devanado, ni el detalle de conexión estrella/delta de la caja de terminales — omitidos del ensamble 3D por no aportar a la física de ns-s-n-T que es el objeto de esta práctica."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro del motor ensamblado correctamente (captura o confirmación del HUD de progreso 6/6), tabla de al menos 4 combinaciones f/p/TL con sus ns/s/n/T/Pmec resultantes (incluyendo el caso límite TL=0 y un caso de calado con TL>Tmáx), y la predicción resuelta del modo Reto."
evidencia_desempeno: "Guía de observación del orden y correctitud del ensamble pieza por pieza, de la identificación correcta de la relación ns=120·f/p y de que el deslizamiento es necesario para que exista par, del reconocimiento de la condición de calado (TL>Tmáx) y su causa física, y de la justificación numérica de la respuesta del modo Reto con la fórmula correspondiente."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el rotor de un motor de inducción nunca alcanza la velocidad síncrona del campo del estátor, y por qué este laboratorio exige armar el motor antes de poder simularlo (briefing.ts)."
desarrollo: "Práctica en el simulador: Ensamble (arma las 6 piezas móviles sobre el banco, desbloquea la simulación) → Operación (ajusta f/p/TL y lee el diagrama de deslizamiento con telemetría en vivo) → Curva (explora la curva par-deslizamiento de Kloss y el punto de operación, incluida la condición de calado) → Reto (calcula ns, s o n de un escenario dado) → recorridos guiados automáticos de ensamble y de barrido de parámetros como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de ecuaciones que gobiernan el motor, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración de que Tmáx y sm son parámetros ilustrativos del simulador, no de un datasheet real, y que el circuito eléctrico equivalente se deja para d5-08."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de conversión electromecánica de motores de inducción trifásicos (ns=120f/p, s=(ns−n)/ns, ecuación simplificada de Kloss T(s)=2Tmáx/(s/sm+sm/s)) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman)."
  - "⚑ IEEE 112 (procedimiento de prueba de motores y generadores de inducción polifásicos) — norma ancla listada en la lista maestra; no se verificó una cláusula específica contra el texto primario en esta sesión."
  - "⚑ IEC 60034 (máquinas eléctricas rotativas, familia de normas) — norma ancla listada en la lista maestra; no se identificó la parte específica aplicable ni se verificó una cláusula contra el texto primario en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01..05/D2/D10 — confirmar si existe una clave SINCO más específica de mantenimiento de máquinas de inducción antes de publicar la trazabilidad."
  - "⚑ Las dos normas ancla (IEEE 112, IEC 60034) se citan de forma general porque la lista maestra no especifica cláusula ni parte — confirmar con el experto la cláusula/parte exacta aplicable antes de publicar la práctica a escala."
  - "⚑ Los parámetros del motor de ejemplo (Tmáx=22 N·m, sm=0.18) son valores ilustrativos del simulador, elegidos para que el rango de controles produzca resultados físicamente consistentes y pedagógicamente claros — NO corresponden a la placa de un motor comercial real; confirmar con el experto si conviene sustituirlos por los de un motor de catálogo real en una futura iteración."
  - "⚑ El rango del deslizador de frecuencia (50-60 Hz, en vez de un rango más amplio tipo 40-70 Hz considerado en el diseño inicial) fue deliberadamente acotado a los dos estándares de red eléctrica global para no implicar una relación V/f de variador que el simulador no modela — confirmar con el experto si esta decisión de alcance es la correcta o si conviene, en cambio, modelar explícitamente la relación V/f en una iteración futura."
  - "⚑ El mecanismo de bloqueo de modo (simulación inaccesible hasta completar el ensamble), heredado de d5-04, se reutiliza sin cambios — confirmar si sigue siendo pedagógicamente correcto para esta práctica o si conviene permitir exploración parcial antes de terminar el armado."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `motorState()` contra combinaciones de esquina de f/p/TL, incluyendo el deslizamiento de vuelco exacto en TL=Tmáx y la condición de calado en TL>Tmáx, y contra un solver de bisección independiente para la forma cerrada del deslizamiento estable (error máximo 3.35×10⁻⁹). Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 4 modos, el bloqueo/desbloqueo de modo, el modo Reto con sus tres tipos de pregunta, la condición de calado, y los recorridos guiados automáticos, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (sexta práctica de D5, segunda de molde E+S):** d5-06 reutiliza el
   patrón de ensamble 3D + simulación esquemática con bloqueo de modo introducido en d5-04
   (motor de CD), aplicado ahora al motor de inducción trifásico de jaula de ardilla. La
   decisión de diseño más importante de esta práctica es de **alcance, no de mecanismo**: se
   modela deliberadamente solo la relación cinemática (ns, s, n, T, Pmec) y se deja el
   circuito eléctrico equivalente del motor de inducción —con su derivación por ensayos de
   vacío y rotor bloqueado— para la práctica siguiente del programa (d5-08). Esta separación
   se declara explícitamente en el HUD del simulador y en la ficha técnica in-app, para no
   sobreafirmar cobertura eléctrica que esta práctica no tiene.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/par-velocidad-motor-induccion.html](../../../public/labs/par-velocidad-motor-induccion.html))
   muestra el HUD con las fórmulas del motor y el estado de ensamble/desbloqueo —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-par-velocidad-motor-induccion.js](../../../public/labs/_ficha-par-velocidad-motor-induccion.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`par-velocidad-motor-induccion.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de `motorState()` para combinaciones de esquina de f/p/TL, incluyendo
   el deslizamiento de vuelco exacto en TL=Tmáx, la condición de calado en TL>Tmáx, y la forma
   cerrada del deslizamiento estable contra un solver de bisección independiente (error máximo
   3.35×10⁻⁹). Pendiente al momento de escribir esta ficha: corrida completa de Jest tras
   `npm run gen:labs`, `tsc --noEmit`, y verificación funcional con Playwright contra el HTML
   construido y servido localmente — completar antes del commit final y actualizar esta nota
   con el resultado exacto.
4. **Petición concreta al experto:** (a) confirmar la cláusula o parte específica de IEEE 112
   e IEC 60034 aplicable a esta práctica, ya que la lista maestra las cita solo de forma
   general; (b) confirmar si los parámetros ilustrativos del motor de ejemplo (Tmáx, sm)
   deberían sustituirse por los de un motor de catálogo real en una futura iteración; (c)
   confirmar si el alcance decidido —excluir el circuito eléctrico equivalente y dejarlo para
   d5-08— es pedagógicamente correcto o si conviene adelantar alguna noción eléctrica básica
   aquí; (d) confirmar si existe una clave SINCO más específica que la reutilizada de la
   familia D2/D10/d5-01..05 para mantenimiento de máquinas de inducción.
