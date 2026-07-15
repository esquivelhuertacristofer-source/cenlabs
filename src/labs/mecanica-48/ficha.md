# Ficha de práctica — Generador de CD Autoexcitado: Curva de Magnetización (`mecanica-48`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** quinta práctica del dominio D5 (Transformadores/Máquinas eléctricas) —
> d5-05 de 16. Es una práctica de **molde S+P** (esquemático interactivo + panel de
> instrumentos virtual, sin fase de ensamble como su vecina d5-04): el elemento central
> es el pizarrón que combina el esquemático del circuito shunt con la gráfica en vivo de
> la curva de magnetización, donde el estudiante ve directamente dónde la recta del
> circuito de campo cruza la curva — o deja de cruzarla. Es la primera práctica de D5
> centrada en un **generador** de CD (d5-04 fue de un **motor**), y la primera en
> introducir el concepto de **resistencia crítica** como umbral de existencia de un
> punto de operación, no solo como una cantidad más a calcular.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-48
sector: mecanica-electronica
practica_maestra: "d5-05 — Caracteriza generadores de CD y su curva de magnetización (molde S+P) — tomado literalmente de la fila d5-05 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II.2 — tomado literalmente de la columna 'Trazabilidad' de la fila d5-05 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "— (sin norma ancla listada) — tomado literalmente de la columna 'Norma ancla' de la fila d5-05 (guión); igual que d5-04 (motor de CD) y a diferencia de d5-01/d5-02/d5-03 (que citan la familia IEC 60076 de transformadores), esta fila no lista ninguna norma de ensayo o construcción. El simulador se apoya en teoría estándar de generadores de CD autoexcitados (ver normatividad abajo), no en una norma de certificación específica."
modulo: "Transformadores (D5)"
submodulo: "Generadores de CD: autoexcitación shunt, curva de magnetización y resistencia crítica"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01/d5-02/d5-03/d5-04/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de mantenimiento de máquinas rotativas de CD antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar por qué un generador de CD shunt
  (derivación) se autoexcita a partir del magnetismo remanente del núcleo en vez de
  requerir una fuente de campo externa; calcular el punto de operación de autoexcitación
  en forma cerrada como la intersección entre la curva de magnetización de vacío
  E(If,n)=E0(If)·(n/n0), con E0(If)=Em·If/(Ik+If) (saturación tipo Fröhlich), y la recta
  del circuito de campo Vt=Rf·If, mediante If*=máx(0, Em·(n/n0)/Rf−Ik) y Vt*=Rf·If*;
  calcular la resistencia crítica de campo Rc(n)=Rc0·(n/n0), con Rc0=Em/Ik la pendiente
  de la curva en el origen; y predecir, dado un reóstato de campo Rf y una velocidad n,
  si el generador autoexcita (Rf<Rc(n)) o colapsa a tensión cero (Rf≥Rc(n)) antes de
  verificarlo en el simulador.
actividad_clave: >
  Sobre un banco con un generador de CD shunt, un reóstato de campo y un pizarrón que
  combina el esquemático del circuito con la gráfica de la curva de magnetización,
  explora en modo Explora cómo el punto de operación se desplaza al mover los
  deslizadores de Rf (reóstato de campo, 60–400 Ω) y n (velocidad del primomotor,
  600–1500 rpm); en modo Curva, ubica visualmente la resistencia crítica Rc(n)
  acercando Rf al umbral donde la recta del campo se vuelve tangente a la curva de
  magnetización en el origen y el punto de operación colapsa hacia cero; y en modo
  Reto, dado un Rf y una n fijados por el simulador (condición "misteriosa"), predice
  primero si el generador autoexcita o colapsa y calcula Vt antes de comprobar la
  respuesta con tolerancia porcentual.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los tres elementos del esquemático en el pizarrón: el generador (círculo 'G' con flecha de rotación, primomotor a velocidad n), la rama de campo en derivación (reóstato Rf en serie con el devanado de campo, tomando su corriente If de los mismos bornes que el generador produce) y los bornes de salida (voltímetro Vt, en circuito abierto — sin carga externa)."
  - "Modo Explora: mueve el deslizador Rf (60–400 Ω) y observa cómo cambia la pendiente de la recta amarilla Vt=Rf·If sobre la gráfica; mueve el deslizador n (600–1500 rpm) y observa cómo la curva de magnetización turquesa se escala verticalmente completa (E(If,n)=E0(If)·(n/n0)). El punto de operación Q (marcador blanco) es siempre la intersección de ambas — verifica con el caso por defecto (Rf=150 Ω, n=1200 rpm=n0): If*=0.400 A, Vt*=60.0 V (recomputado exactamente, ver simulador_modela)."
  - "Modo Curva: acerca Rf hacia la resistencia crítica Rc(n) (mostrada en el HUD y trazada como recta punteada roja sobre la gráfica) y observa que el punto Q se desliza hacia el origen conforme Rf se aproxima a Rc(n) por debajo, hasta desaparecer (Vt≈0) en cuanto Rf alcanza o supera Rc(n) — verifica que a n0=1200 rpm, Rc0=Em/Ik=250 Ω exactamente (caso límite recomputado: Rf=249 Ω → If*≈0.00241 A, Vt*≈0.60 V; Rf=250 Ω → colapso total, If*=Vt*=0; Rf=251 Ω → colapso total)."
  - "Verifica que la resistencia crítica escala con la velocidad y NO es un número fijo: a n=600 rpm, Rc(600)=125 Ω (la mitad de Rc0, porque Rc(n)=Rc0·(n/n0) es lineal en n); a n=1500 rpm, Rc(1500)=312.5 Ω. Un mismo Rf=150 Ω autoexcita a n0=1200 rpm pero podría no hacerlo a una velocidad menor si Rf superara la Rc(n) de esa velocidad más baja."
  - "Modo Reto: con una condición Rf/n fija dada por el simulador (botón 'Nuevo caso misterioso'), calcula primero Rc(n)=(Em/Ik)·(n/n0) con los valores conocidos de Em=150 V, Ik=0.6 A, n0=1200 rpm; compara Rf contra Rc(n) para predecir SÍ autoexcita / NO colapsa; si predices que autoexcita, calcula también Vt*=Rf·(Em·(n/n0)/Rf−Ik); verifica tu predicción SÍ/NO y tu Vt (tolerancia: mayor de 2 V o 5% de Vt real si autoexcita; 1.5 V si predices colapso — implementada en checkReto())."
  - "Usa 'Recorrido guiado' para ver la secuencia narrada completa (punto de operación en Explora → acercamiento de Rf a Rc(n) en Curva hasta el colapso → un caso de Reto resuelto automáticamente) como referencia antes o después de resolverlo por cuenta propia."
normatividad:          # 🔒 sin norma ancla en la lista maestra — ver banderas_incertidumbre
  - "Sin norma ancla específica en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila d5-05) — igual que d5-04 y a diferencia de d5-01/02/03. El simulador se apoya en teoría estándar de generadores de CD autoexcitados (curva de magnetización, resistencia crítica), presente en textos de referencia ampliamente usados en el sector (p. ej. Fitzgerald/Kingsley/Umans, 'Electric Machinery'; Chapman, 'Máquinas Eléctricas'; Say, 'Performance and Design of DC Machines'), no en una cláusula normativa de ensayo o certificación."
  - "IEEE 113 'IEEE Guide: Test Procedures for Direct-Current Machines' — norma de contraste plausible para el procedimiento real de levantamiento de la curva de magnetización de vacío de una máquina de CD; ⚑ no se verificó una cláusula específica de esta norma contra el texto primario en esta sesión — citada como candidata a revisión experta, no como fuente confirmada (misma candidata ya señalada en la ficha de d5-04)."
simulador_modela:      # 🔒
  - "La curva de magnetización de vacío con forma de saturación tipo Fröhlich E0(If)=Em·If/(Ik+If) y su escalamiento con la velocidad E(If,n)=E0(If)·(n/n0) (Ley de Faraday, fem ∝ velocidad a flujo constante) — implementadas literalmente como E0() y Efun() en generador-cd-magnetizacion.body.js."
  - "El punto de operación de autoexcitación en forma cerrada exacta (sin bisección ni iteración numérica), If*=máx(0, Em·(n/n0)/Rf−Ik), Vt*=Rf·If*, implementado como buildup(Rf,n) — verificado por recomputación independiente ejecutada con `node` (no a mano) contra un solver de bisección alternativo, sobre 12 combinaciones de esquina y frontera de (Rf,n) incluyendo tres pares exactamente en Rc(n) (Rf=250,n=1200; Rf=312.5,n=1500; Rf=125,n=600) y sus vecinos inmediatos (±1 Ω): error máximo entre la forma cerrada y la bisección independiente = 3.95×10⁻¹⁴ (ruido de punto flotante, no discrepancia de modelo). Caso por defecto (Rf=150 Ω, n=1200 rpm): If*=0.400000 A, Vt*=60.0000 V exactos."
  - "La resistencia crítica Rc(n)=Rc0·(n/n0), con Rc0=Em/Ik=250 Ω, implementada como Rc(n) — verificada como la pendiente exacta de E0(If) en If=0 (no un valor codificado aparte) y confirmada como el umbral binario exacto: para los 6 pares de (Rf,n) construidos exactamente en Rc(n) o a ±1 unidad de Rf, selfExcites(Rf,n) cambia de true a false en el punto correcto en los 6 casos, sin margen de error. Rc(600)=125 Ω y Rc(1500)=312.5 Ω, ambos dentro del rango del deslizador de Rf (60–400 Ω) — el rango de controles permite explorar el umbral crítico en todo el rango de velocidad."
  - "El criterio selfExcites(Rf,n)=Rf<Rc(n) como consecuencia geométrica directa del modelo (recta vs. pendiente inicial de la curva saturante), no como una regla añadida aparte — mismo valor de Rc(n) usado tanto para trazar la recta roja punteada en la gráfica como para decidir el estado 'autoexcita/colapsa' del HUD y del reto."
  - "Un pizarrón (canvas 2D sobre panel 3D) que combina el esquemático del circuito shunt (generador, reóstato de campo, devanado de campo, bornes abiertos) con la gráfica en vivo de la curva de magnetización (curva de referencia a n0, curva a la velocidad actual, recta del campo, recta de resistencia crítica, punto de operación Q), recalculado en cada cambio de Rf o n directamente desde buildup()/Rc(), nunca de una tabla precalculada."
  - "El modo Reto con condición 'misteriosa' generada dentro del rango real de los deslizadores (Rf∈[60,400], n∈[600,1500]) y verificación de predicción con tolerancia porcentual explícita sobre Vt (2 V o 5%, la mayor, si el generador autoexcita; 1.5 V si se predice colapso) implementada en checkReto()."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La resistencia de armadura ni la caída IaRa: el análisis es exclusivamente de VACÍO (bornes abiertos, sin carga externa) — el generador con carga real añadiría la caída en el devanado de armadura y un lazo de retroalimentación adicional entre la corriente de carga y la tensión de campo."
  - "La reacción de inducido: en vacío no hay corriente de armadura de carga que distorsione el flujo del campo, así que el modelo no la incluye — sería relevante en un ensayo de generador shunt bajo carga."
  - "La histéresis completa ni la posibilidad real de magnetismo remanente insuficiente o de polaridad invertida: el modelo asume que SIEMPRE existe remanente suficiente para iniciar el lazo de autoexcitación (si Rf<Rc(n)); en la práctica real, un generador puede fallar en autoexcitar por remanencia insuficiente incluso con Rf por debajo de Rc(n), y requerir 'flashear' el campo con una fuente externa."
  - "La saturación bajo carga ni la regulación de tensión: la curva de magnetización mostrada es la de VACÍO; el comportamiento de un generador shunt con carga (que exige resolver simultáneamente la malla de armadura) es un ensayo distinto no cubierto por esta práctica."
  - "La temperatura del devanado de campo: la resistencia del devanado (parte de lo que compone Rf en la práctica real) no varía con la temperatura en este modelo — Rf se controla como parámetro directo del reóstato, sin componente térmica."
  - "La inductancia de campo ni la dinámica temporal del arranque: el lab resuelve el PUNTO DE EQUILIBRIO del lazo de autoexcitación (estado estacionario), no la trayectoria en el tiempo (segundos) de cómo la tensión sube desde el remanente hasta ese punto — no hay simulación transitoria."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Tabla de al menos 3 combinaciones de Rf/n con su If*/Vt* resultante (incluyendo un caso claramente por debajo de Rc(n), uno cerca del umbral y uno por encima que colapsa), el valor de Rc(n) calculado para cada velocidad usada, y la predicción resuelta del modo Reto con su verificación."
evidencia_desempeno: "Guía de observación de la identificación correcta del lazo de autoexcitación shunt en el esquemático, del cálculo correcto de Rc(n) a partir de Em/Ik y n/n0, del reconocimiento visual de por qué el punto de operación colapsa al acercarse a la resistencia crítica, y de la justificación numérica de la predicción del modo Reto con las fórmulas correspondientes."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un generador shunt no necesita una fuente de campo externa — arranca del magnetismo remanente y se autoexcita solo si el reóstato de campo queda por debajo de un umbral preciso — y qué es la resistencia crítica (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (mueve Rf y n, observa el punto de operación desplazarse sobre la curva de magnetización) → Curva (ubica visualmente la resistencia crítica Rc(n) acercando Rf al umbral de colapso) → Reto (dado un Rf/n misterioso, predice SÍ/NO autoexcita y calcula Vt antes de comprobar) → quiz de ingeniería por modo con distractores de error conceptual real → recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de ecuaciones (curva de magnetización, resistencia crítica, punto de operación en forma cerrada), el contrato de fidelidad completo (SÍ/NO modela) y la aclaración de que los parámetros de la máquina (Em, Ik, n0) son ilustrativos del simulador, no de un datasheet real."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Teoría estándar de generadores de CD autoexcitados (curva de magnetización de saturación, condición geométrica de resistencia crítica como intersección recta-curva) — consistente con textos de referencia ampliamente usados en el sector (Fitzgerald/Kingsley/Umans; Chapman; Say); no se cita una cláusula normativa específica porque la lista maestra no ancla esta práctica a una norma."
  - "⚑ IEEE 113 (procedimientos de ensayo de máquinas de CD) — candidata a norma de contraste para el procedimiento real de levantamiento de la curva de magnetización de vacío; no verificada contra el texto primario en esta sesión."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01/d5-02/d5-03/d5-04/D2/D10 — confirmar si existe una clave SINCO más específica de mantenimiento de máquinas rotativas de CD antes de publicar la trazabilidad."
  - "⚑ Sin norma ancla en la lista maestra (igual que d5-04, a diferencia del resto de D5) — confirmar con el experto si esto es intencional (por tratarse de teoría de conversión electromecánica más que de un procedimiento de ensayo normado) o si conviene identificar una norma de referencia antes de publicar la práctica a escala."
  - "⚑ Los parámetros de la máquina de ejemplo (Em=150 V, Ik=0.6 A, n0=1200 rpm) y la forma Fröhlich de la curva de magnetización son valores ILUSTRATIVOS del simulador, elegidos para que la resistencia crítica resultante (Rc0=250 Ω) quede cómodamente dentro del rango de control del reóstato — NO corresponden a la placa de una máquina comercial real; confirmar con el experto si conviene sustituirlos por los de un generador de catálogo real en una futura iteración."
  - "⚑ El límite inferior del deslizador de Rf (60 Ω en vez de 0 Ω) es una decisión de diseño del simulador para mantener If* dentro de un rango ilustrativo en el extremo de máxima excitación (evitar valores de If muy grandes fuera del dominio graficado) — no representa un límite físico documentado de un reóstato de campo real; confirmar si esta acotación debe explicarse más explícitamente en el texto visible del simulador."
  - "⚑ El modelo asume magnetismo remanente siempre suficiente para iniciar la autoexcitación en cuanto Rf<Rc(n) — omite deliberadamente el caso real de remanencia insuficiente o de polaridad invertida (que exigiría 'flashear' el campo con una fuente externa antes de poder autoexcitar); confirmar si el programa oficial (ELE-II.2) espera que el estudiante reconozca también esa falla de arranque, no solo el criterio de resistencia crítica."
  - "✅ Verificación de implementación: física verificada por recomputación ejecutada con `node` (no a mano) de la fórmula cerrada `buildup(Rf,n)` contra un solver de bisección independiente sobre 12 combinaciones de esquina/frontera, incluyendo pares exactamente sobre Rc(n) — error máximo 3.95×10⁻¹⁴ (ruido de punto flotante). También confirmado: Rc(600)=125 Ω y Rc(1500)=312.5 Ω caen dentro del rango del deslizador de Rf, y el criterio selfExcites() conmuta en el punto exacto esperado en los 6 pares construidos sobre el umbral. Pendiente al momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`), `tsc --noEmit`, y verificación funcional con Playwright contra el HTML construido y servido localmente (los 3 modos, el umbral de resistencia crítica, el ciclo de reto/quiz, y el recorrido guiado automático, 0 errores de consola/página esperados) — completar antes del commit final y actualizar esta nota con el resultado exacto.
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (quinta práctica de D5, primera de un generador):** d5-05
   introduce el concepto de **resistencia crítica** como un umbral de existencia (no
   solo una cantidad más a calcular): por debajo de Rc(n) existe un punto de operación
   con tensión distinta de cero; en o por encima, el generador shunt simplemente no
   levanta tensión. La decisión de diseño más importante es resolver ese punto de
   operación en **forma cerrada exacta** (sin iteración numérica visible al usuario),
   de modo que el simulador pueda recalcular en tiempo real a cada movimiento de los
   deslizadores sin lag ni aproximación — declarado explícitamente en el encabezado de
   fidelidad del archivo fuente y en el HUD del simulador.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/generador-cd-magnetizacion.html](../../../public/labs/generador-cd-magnetizacion.html))
   muestra el HUD con las fórmulas del modelo y el contrato SÍ/NO modela — documentado
   en la sección 5 de la ficha técnica in-app
   ([_ficha-generador-cd-magnetizacion.js](../../../public/labs/_ficha-generador-cd-magnetizacion.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`generador-cd-magnetizacion.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada
   con `node` (no a mano) de la fórmula cerrada `buildup(Rf,n)` contra un solver de
   bisección independiente (reimplementado desde el entendimiento documentado del
   modelo, no copiando el código fuente), sobre 12 combinaciones de esquina y frontera
   de (Rf,n) incluyendo tres pares construidos exactamente sobre Rc(n) y sus vecinos a
   ±1 Ω — acuerdo con error máximo de 3.95×10⁻¹⁴ (ruido de punto flotante, no
   discrepancia de modelo). También confirmado que Rc(600)=125 Ω y Rc(1500)=312.5 Ω
   caen dentro del rango completo del deslizador de Rf (60–400 Ω), y que el criterio
   binario de autoexcitación conmuta exactamente en el punto esperado. Confirmado
   además: suite completa de Jest tras `npm run gen:labs` y la edición manual de los
   snapshots dorados (819/819 pruebas, 12/12 snapshots) y `tsc --noEmit` limpio (cero
   errores). Verificación funcional con Playwright (40/40 aserciones, 0 errores de
   consola/página) contra el HTML construido y servido con un servidor HTTP local
   temporal (el lab usa import maps + ES modules): física de forma cerrada en el caso
   por defecto y en el extremo, los tres umbrales de resistencia crítica (Rc(1200)=250 Ω,
   Rc(600)=125 Ω, Rc(1500)=312.5 Ω) y sus vecinos ±1 Ω, bloqueo de deslizadores y
   visibilidad de `#retoBox` por modo, ocultamiento de telemetría hasta resolver el
   reto, los tres desenlaces del flujo de reto (predicción correcta, SÍ/NO invertido,
   Vt fuera de tolerancia) más el caso de `checkReto()` sin elegir SÍ/NO primero, y la
   apertura/cierre de la ficha técnica in-app.
4. **Petición concreta al experto:** (a) confirmar si esta práctica debería tener una
   norma ancla propia (p. ej. IEEE 113 para el procedimiento de levantamiento de la
   curva de magnetización) en vez de quedar sin ella, como indica la lista maestra; (b)
   confirmar si los parámetros ilustrativos de la máquina de ejemplo (Em, Ik, n0)
   deberían sustituirse por los de un generador de catálogo real en una futura
   iteración; (c) confirmar si el programa oficial (ELE-II.2) espera que el estudiante
   reconozca también la falla de arranque por remanencia insuficiente/invertida (no
   modelada aquí), o si el criterio de resistencia crítica basta como alcance de esta
   práctica; (d) confirmar si existe una clave SINCO más específica que la reutilizada
   de la familia D2/D10/d5-01/02/03/04 para mantenimiento de máquinas rotativas de CD.
