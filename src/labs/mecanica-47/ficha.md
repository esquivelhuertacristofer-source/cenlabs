# Ficha de práctica — Motor de CD: Par y Velocidad (`mecanica-47`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** cuarta práctica del dominio D5 (Transformadores/Máquinas eléctricas) —
> d5-04 de 16. Es la **primera práctica de molde E+S** de toda la colección (ensamble 3D +
> simulación esquemática combinados en un solo lab, con bloqueo de modo): a diferencia de
> d5-01/d5-02 (molde E+P y S+P, con panel de instrumentos) y d5-03 (molde S puro), aquí el
> estudiante arma primero el motor pieza por pieza sobre un banco de trabajo y **solo
> entonces** se desbloquean los tres modos de simulación (circuito, curva, reto). Este
> patrón de "ensamble como llave de acceso a la simulación" es nuevo en la colección y
> sienta precedente para futuras prácticas E+S (p. ej. d5-06, d5-10).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-47
sector: mecanica-electronica
practica_maestra: "d5-04 — Controla par y velocidad de un motor de CD (molde E+S) — tomado literalmente de la fila d5-04 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II.1 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-04 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "— (sin norma ancla listada) — tomado literalmente de la columna 'Norma ancla' de la fila d5-04; a diferencia de d5-01/d5-02/d5-03 (que sí citan la familia IEC 60076), esta fila de la lista maestra no lista ninguna norma de ensayo o construcción. El simulador se apoya en teoría estándar de conversión electromecánica de motores de CD (ver normatividad abajo), no en una norma de certificación específica."
modulo: "Transformadores (D5)"
submodulo: "Motores de CD: excitación independiente, par y velocidad (molde E+S — primer híbrido ensamble+simulación de la colección)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01/d5-02/d5-03/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de mantenimiento de máquinas rotativas de CD antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de identificar y ensamblar, en el orden correcto,
  las piezas principales de un motor de CD de excitación independiente (yugo/carcasa,
  polos de campo, armadura, conmutador, escobillas, tapas); calcular, a partir de la
  tensión de armadura (Va), la corriente de campo (If) y el par de carga (TL), el flujo
  relativo KΦ=KM·(If/If_nominal), la corriente de armadura Ia=TL/KΦ, la fuerza
  contraelectromotriz Ea=Va−Ia·Ra, la velocidad angular ω=Ea/KΦ y el par electromagnético
  T=KΦ·Ia; reconocer que la corriente de armadura queda determinada por la carga mecánica
  y el flujo del campo —no por la tensión aplicada—; identificar condiciones de
  sobrecorriente y de operación no física (Ea≤0); y resolver escenarios numéricos de
  predicción (modo Reto) sobre esas mismas cuatro cantidades.
actividad_clave: >
  Arma un motor de CD de excitación independiente pieza por pieza sobre un banco de
  trabajo (modo Ensamble) — los controles de simulación permanecen bloqueados hasta
  completar el armado. Con el motor ya ensamblado, se desbloquean tres modos adicionales
  sobre el mismo tablero esquemático: Circuito (ajusta Va/If/TL con deslizadores y observa
  el circuito equivalente de armadura y campo con telemetría en vivo), Curva (explora la
  curva par-velocidad resultante y localiza el punto de operación) y Reto (dado un
  escenario con Va/If/TL fijos, predice Ia, Ea, T o n antes de verificar la respuesta con
  tolerancia porcentual).
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Ensamble: identifica cada pieza resaltada en la bandeja de piezas (yugo/carcasa con ventana de corte, polos de campo con devanado, armadura con núcleo laminado y eje, conmutador de delgas, portaescobillas con escobillas de grafito, tapa delantera con muñón de eje, tapa trasera) y colócala en su pedestal numerado correspondiente; el simulador rechaza colocar una pieza en un pedestal equivocado y confirma visualmente cada acierto."
  - "Al completar las seis piezas móviles sobre el yugo fijo, el simulador desbloquea automáticamente los modos Circuito, Curva y Reto (antes bloqueados, con aviso sonoro/visual si se intenta acceder antes de tiempo) — replicando la práctica real de no energizar un motor a medio ensamblar."
  - "Modo Circuito: ajusta los tres deslizadores (Va∈[0,130] V, If∈[0.4,1.3] A, TL∈[0,6] N·m) y observa en el tablero la malla de armadura (Ra, Ea) y el devanado de campo, con telemetría en vivo de Ia, Ea, T, n, potencia de entrada/salida y eficiencia — verifica que subir Va sin cambiar TL ni If mueve la velocidad pero deja Ia sin cambiar (confirmado por recómputo exacto con `node -e`: Ia idéntica a 5.882 A para Va=60 V y Va=130 V con If=1.0 A, TL=5 N·m)."
  - "Modo Curva: recorre la curva par-velocidad trazada para el If actual (barrido de Ia de 0 a 1.6×la corriente de referencia de sobrecorriente) y ubica el punto de operación correspondiente a los valores actuales de Va/If/TL; observa cómo la curva completa se desplaza al cambiar If (a menor flujo, mayor velocidad para el mismo par, y menor margen antes de la corriente de referencia de sobrecorriente)."
  - "Verifica al menos dos casos límite con las lecturas del tablero: (a) sobrecorriente — con If en su mínimo (0.4 A) y TL alto (5–6 N·m), Ia supera la corriente de referencia (9 A) y el HUD muestra la advertencia correspondiente; (b) estado no físico — con Va en su mínimo (0 V) y TL>0, Ea resulta ≤0 y el simulador reporta la combinación como no realizable (motor no puede sostener ese par a esa tensión) en vez de mostrar una velocidad negativa o indefinida."
  - "Modo Reto: con un escenario de Va/If/TL fijado por el simulador (visible en el tablero) y una cantidad objetivo (Ia, Ea, T o n) oculta, calcula el valor con las fórmulas de §6 y verifica tu respuesta con la tolerancia porcentual indicada."
normatividad:          # 🔒 sin norma ancla en la lista maestra — ver banderas_incertidumbre
  - "Sin norma ancla específica en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila d5-04) — a diferencia de d5-01/02/03. El simulador se apoya en teoría estándar de conversión electromecánica de motores de CD de excitación independiente, presente en textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas'), no en una cláusula normativa de ensayo o certificación."
  - "IEEE 113 'IEEE Guide: Test Procedures for Direct-Current Machines' — norma de contraste plausible para procedimientos de ensayo de motores de CD reales (arranque, medición de par y velocidad); ⚑ no se verificó una cláusula específica de esta norma contra el texto primario en esta sesión — citada como candidata a revisión experta, no como fuente confirmada."
  - "CFE / NOM-016-ENER — normas de eficiencia energética de motores eléctricos citadas en otras prácticas de D5 (d5-09) para motores de inducción; ⚑ no se verificó si aplican o tienen un equivalente directo para motores de CD de excitación independiente — pendiente de confirmación experta."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La relación T=KΦ·Ia, la FEM inducida Ea=KΦ·ω, la malla de armadura en estado estacionario Va=Ea+Ia·Ra, y que KΦ depende linealmente de If (KΦ=KM·If/If_nominal) — verificado por recomputación exacta con `node -e` de motorState() contra el código fuente de par-velocidad-motor-cd.body.js para 8 combinaciones de esquina (Va∈{0,30,60,120,130}, If∈{0.4,1.0,1.3}, TL∈{0,5,6}): caso por defecto (Va=120,If=1.0,TL=5)→Ia=5.882 A, Ea=112.941 V, n=1268.8 rpm, η=94.12%; carga nula (TL=0)→Ia=0 A exacto; campo mínimo con carga (If=0.4,TL=5)→Ia=14.706 A (sobrecorriente confirmado, >9 A de referencia); Va mínimo con carga (Va=0,TL=5)→Ea=−7.059 V (estado no físico confirmado, Ea≤0)."
  - "Que Ia=TL/KΦ queda fijada por la carga mecánica y el flujo del campo, independiente de Va — verificado explícitamente: motorState(60,1.0,5).Ia === motorState(130,1.0,5).Ia (igualdad exacta en punto flotante, 5.882352941176471 A en ambos casos)."
  - "Los estados de advertencia: sobrecorriente (Ia > 9 A de referencia ilustrativa) y no físico (Ea≤0, tratado como velocidad cero en vez de negativa o indefinida) — ambos reproducidos y confirmados dentro del rango alcanzable de los deslizadores (Va∈[0,130] V, If∈[0.4,1.3] A, TL∈[0,6] N·m)."
  - "El ensamble mecánico completo del motor (6 piezas móviles sobre un yugo fijo, con verificación de pedestal correcto por pieza) como precondición explícita para desbloquear la simulación — mecanismo de bloqueo de modo (`simUnlocked`) implementado y confirmado en el código fuente, sin precedente en d5-01/02/03."
  - "Un tablero esquemático (canvas 2D sobre panel 3D) que alterna entre circuito equivalente, curva par-velocidad y escenario de reto, con telemetría en vivo derivada siempre de motorState(), nunca de una tabla precalculada."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El transitorio de arranque del motor: en la realidad, aplicar Va con el rotor detenido (Ea=0) produce una corriente de arranque muy alta que exige un reóstato de arranque o arrancador electrónico — el simulador solo calcula estados de operación ya establecidos (estacionarios), nunca la dinámica de arranque ni inductancias."
  - "Saturación magnética del hierro: KΦ es estrictamente lineal con If en todo el rango del deslizador (0.4–1.3 A); un motor real se aplana a corrientes de campo altas — esta simplificación se declara explícitamente en la ficha in-app (§5 de _ficha-par-velocidad-motor-cd.js)."
  - "Fricción, ventilación y corriente de vacío: con TL=0, el modelo da Ia=0 exactamente; un motor real siempre consume una corriente de vacío pequeña por pérdidas mecánicas, no modeladas aquí."
  - "El circuito de campo derivado de una fuente real (Vf, Rf): If se controla como parámetro directo en el simulador, no como resultado de aplicar una tensión de campo a través de una resistencia de campo real."
  - "La secuencia de energización seguridad-crítica de un motor de excitación independiente real (energizar primero el campo, luego la armadura, para evitar embalamiento por pérdida de campo) — los tres controles del simulador son libres una vez desbloqueados, sin imponer ni verificar ese orden."
  - "Reacción de armadura, chispeo o desgaste del conmutador, rodamientos, ventilador de enfriamiento ni caja de terminales — omitidos del ensamble 3D por no aportar a la física de par-velocidad-corriente que es el objeto de esta práctica."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Registro del motor ensamblado correctamente (captura o confirmación del HUD de progreso 6/6), tabla de al menos 4 combinaciones Va/If/TL con sus Ia/Ea/T/n resultantes (incluyendo un caso de sobrecorriente y uno no físico), y la predicción resuelta del modo Reto."
evidencia_desempeno: "Guía de observación del orden y correctitud del ensamble pieza por pieza, de la identificación correcta de que Ia depende de TL y KΦ y no de Va, del reconocimiento de los estados de sobrecorriente y no físico con su causa, y de la justificación numérica de la respuesta del modo Reto con la fórmula correspondiente."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la corriente de armadura de un motor de CD depende de la carga y no de la tensión aplicada, y por qué este laboratorio exige armar el motor antes de poder simularlo (briefing.ts)."
desarrollo: "Práctica en el simulador: Ensamble (arma las 6 piezas móviles sobre el banco, desbloquea la simulación) → Circuito (ajusta Va/If/TL y lee el circuito equivalente con telemetría en vivo) → Curva (explora la curva par-velocidad y el punto de operación) → Reto (predice Ia/Ea/T/n de un escenario dado) → recorridos guiados automáticos de ensamble y de barrido de parámetros como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de ecuaciones que gobiernan el motor, el contrato de fidelidad completo (SÍ/NO modela) y la aclaración de que los parámetros del motor son ilustrativos del simulador, no de un datasheet real."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de conversión electromecánica de motores de CD de excitación independiente (T=KΦIa, Ea=KΦω, malla de armadura Va=Ea+IaRa) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman); no se cita una cláusula normativa específica porque la lista maestra no ancla esta práctica a una norma."
  - "⚑ IEEE 113 (procedimientos de ensayo de máquinas de CD) — candidata a norma de contraste para procedimientos reales de banco de pruebas; no verificada contra el texto primario en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01/d5-02/d5-03/D2/D10 — confirmar si existe una clave SINCO más específica de mantenimiento de máquinas rotativas de CD antes de publicar la trazabilidad."
  - "⚑ Sin norma ancla en la lista maestra (a diferencia del resto de D5) — confirmar con el experto si esto es intencional (por tratarse de teoría de control más que de un procedimiento de ensayo normado) o si conviene identificar una norma de referencia antes de publicar la práctica a escala."
  - "⚑ Los parámetros del motor de ejemplo (Ra=1.2 Ω, KM=0.85 V·s/rad, If nominal=1.0 A, corriente de referencia de sobrecorriente≈9 A) son valores ilustrativos del simulador, elegidos para que el rango de controles produzca resultados físicamente consistentes y pedagógicamente claros — NO corresponden a la placa de un motor comercial real; confirmar con el experto si conviene sustituirlos por los de un motor de catálogo real en una futura iteración."
  - "⚑ El límite inferior del deslizador de If (0.4 A en vez de 0 A) es una decisión de diseño del simulador para evitar la división entre un flujo nulo (KΦ→0, que produciría una corriente de armadura infinita) — no representa un límite físico documentado del motor de ejemplo; confirmar si esta salvaguarda debe explicarse más explícitamente en el texto visible del simulador."
  - "⚑ El mecanismo de bloqueo de modo (simulación inaccesible hasta completar el ensamble) es una decisión de diseño pedagógico sin precedente en d5-01/02/03 — confirmar con el experto si refuerza correctamente la práctica real de seguridad (no energizar un motor a medio armar) o si conviene permitir exploración parcial de los controles antes de terminar el ensamble."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node -e` (no a mano) de `motorState()` contra 8 combinaciones de esquina de Va/If/TL, incluyendo confirmación exacta de que Ia es independiente de Va y de que los estados de sobrecorriente y no físico son alcanzables dentro del rango de los deslizadores. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`) y verificación funcional con Playwright contra el HTML construido y servido localmente (los 4 modos, el bloqueo/desbloqueo de modo, el modo Reto, y los recorridos guiados automáticos, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (cuarta práctica de D5, primera de molde E+S):** d5-04 introduce
   el patrón híbrido de ensamble 3D + simulación esquemática con bloqueo de modo, nuevo en
   la colección. La decisión de diseño más importante es que la simulación permanece
   inaccesible hasta que el motor está completamente armado — una elección pedagógica
   deliberada, declarada explícitamente en esta ficha y en el HUD del simulador, que
   refuerza (sin modelarla como procedimiento de seguridad eléctrica) la práctica real de
   no energizar equipo a medio ensamblar.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/par-velocidad-motor-cd.html](../../../public/labs/par-velocidad-motor-cd.html))
   muestra el HUD con las fórmulas del motor y el estado de ensamble/desbloqueo —
   documentado en la sección 5 de la ficha técnica in-app
   ([_ficha-par-velocidad-motor-cd.js](../../../public/labs/_ficha-par-velocidad-motor-cd.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`par-velocidad-motor-cd.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada con
   `node -e` (no a mano) de `motorState()` para 8 combinaciones de esquina de Va/If/TL,
   incluyendo la independencia de Ia respecto de Va y los estados límite de sobrecorriente
   y no físico. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras
   `npm run gen:labs` y verificación funcional con Playwright contra el HTML construido y
   servido localmente — completar antes del commit final y actualizar esta nota con el
   resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si esta práctica debería tener una norma
   ancla propia (p. ej. IEEE 113) en vez de quedar sin ella, como indica la lista maestra;
   (b) confirmar si los parámetros ilustrativos del motor de ejemplo deberían sustituirse
   por los de un motor de catálogo real en una futura iteración; (c) confirmar si el
   mecanismo de bloqueo de modo (ensamble como precondición de simulación) es
   pedagógicamente correcto o si conviene permitir exploración parcial antes de terminar el
   armado; (d) confirmar si existe una clave SINCO más específica que la reutilizada de la
   familia D2/D10/d5-01/02/03 para mantenimiento de máquinas rotativas de CD.
