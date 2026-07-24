# Ficha de práctica — Sistemas Trifásicos Y/Δ Balanceados y Secuencia de Fases (`mecanica-72`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** sexta práctica del sub-dominio D1-CA y la primera que abandona el
> tratamiento monofásico. `mecanica-67..71` caracterizan, miden o corrigen un circuito de
> CA tratado como una sola fase equivalente; aquí se introduce el sistema trifásico
> completo —las dos conexiones Y/Δ, la relación √3 y la secuencia de fases— que es la base
> real de la distribución de energía y de las máquinas eléctricas del dominio D5. Cierra
> explícitamente la deuda que `mecanica-71` dejó anotada ("sistemas trifásicos Y/Δ es el
> alcance de d1-14").

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-72
sector: mecanica-electronica
practica_maestra: "d1-14 🔴 — Analiza sistemas trifásicos Y/Δ balanceados y verifica secuencia (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-V; EM-I.2"   # LISTA-MAESTRA-200-PRACTICAS.md, fila d1-14: "VL=√3·VF; P=√3·VL·IL·cos φ" · "ELE-V; EM-I.2"
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Corriente alterna: sistemas trifásicos balanceados, conexiones estrella/delta y secuencia de fases"   # ⚑ heredado por analogía del submódulo de mecanica-67..71; confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado sin cambio de mecanica-60..71; confirmar que sigue aplicando a análisis de sistemas trifásicos
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de analizar un sistema trifásico balanceado
  alimentado a una tensión de línea VL, distinguiendo las relaciones de la conexión
  estrella (VF=VL/√3, IL=IF) de las de la conexión delta (VF=VL, IL=√3·IF); calcular la
  potencia trifásica P=√3·VL·IL·cosφ (con Q, S y FP) y reconocer que, a igual impedancia
  y tensión de línea, la conexión delta entrega exactamente el triple de potencia que la
  estrella; explicar por qué la corriente de neutro es nula en régimen balanceado; y
  determinar el efecto de la secuencia de fases (ABC/ACB) sobre el sentido de giro de un
  motor de inducción, sabiendo que permutar dos líneas invierte el giro sin alterar las
  magnitudes.
actividad_clave: >
  Explora libremente la tensión de línea VL, la magnitud de impedancia |Z|, el ángulo de
  carga φ, la conexión (Y/Δ) y la secuencia (ABC/ACB), observando en el pizarrón fasorial
  cómo el triángulo de tensiones de línea nace de la estrella de tensiones de fase
  (VL=√3·VF) y cómo la potencia se triplica al pasar de Y a Δ con la misma impedancia; en
  el modo Diseña, con VL y φ dados, alcanza una potencia de línea objetivo eligiendo
  conexión y |Z| y ajusta la secuencia al sentido de giro pedido, con retroalimentación
  en vivo sin calificación; en el Reto, con un escenario sorteado, elige la conexión y la
  |Z| que dan la potencia objetivo dentro de ±8% y la secuencia que produce el giro
  requerido, aprobando solo si ambos objetivos se cumplen.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: tensión de línea VL seleccionable de VL_CANDS=[220,440] V (valores normalizados de baja tensión), magnitud de impedancia |Z| de Z_CANDS=[6,8,10,12,15,20] Ω, ángulo de carga φ de PHI_CANDS=[0,30]° (FP=1.000 resistiva y 0.866 inductiva), conexión Y/Δ y secuencia ABC/ACB. Modelo puro: VFsource=VL/√3; en Y la impedancia ve VFload=VL/√3 con IL=IF, en Δ ve VFload=VL con IL=√3·IF; IF=VFload/|Z|; P=√3·VL·IL·cosφ; Q=√3·VL·IL·senφ; S=√3·VL·IL; FP=cosφ."
  - "Resultado central verificado numéricamente (node -e): a igual |Z| y VL, PΔ/PY=3 exacto, porque la potencia por rama va como VF²/|Z| y (VF_Δ/VF_Y)²=(√3)²=3. Confirmado en navegador con Playwright sobre el hook window.__labDebug (PΔ=3·PY con tolerancia de 1 W)."
  - "Pizarrón fasorial: a la izquierda, la estrella de las tres tensiones de fase (VAN, VBN, VCN) separadas 120°, con el triángulo punteado que une sus puntas — cada lado es una tensión de línea de magnitud √3·VF, lo que hace visible el origen geométrico del √3. A la derecha, tabla de magnitudes por conexión (VF sobre Z, IF, IL, P, Q/S, corriente de neutro). Al pie, la secuencia y el sentido de giro resultante. Una flecha curva indica el orden A→B→C y su inversión al cambiar a ACB."
  - "Corriente de neutro: en régimen balanceado IA+IB+IC=0 fasorialmente, por lo que se reporta In=0 en estrella y 'sin neutro' en delta. El nodo neutro 3D solo es visible y cableado cuando la conexión es Y."
  - "Secuencia de fases: SEQS=[ABC,ACB]. En balanceado no cambia P, Q, S ni las corrientes (verificado: magnitudes idénticas entre ABC y ACB), pero fija el sentido de giro del motor (convención del simulador: ABC↻ horario, ACB↺ antihorario). El eje 3D del motor gira en el sentido correspondiente. Permutar dos líneas equivale a invertir la secuencia."
  - "Modo Diseña: con VL y φ del escenario dados y visibles, el estudiante elige conexión y |Z| para alcanzar una potencia de línea objetivo (tomada de una celda real conexión×|Z|) dentro de ±8%, y ajusta la secuencia al giro pedido; la telemetría indica en vivo si la potencia y el giro coinciden, sin calificación."
  - "Modo Reto: se sortea VL, φ, una conexión y |Z| sellados de los catálogos; el objetivo de potencia es P de esa celda y el objetivo de giro es una secuencia sorteada. Verificado numéricamente que cada escenario (VL,|Z|,φ) tiene EXACTAMENTE 1 par (conexión,|Z|) que alcanza la potencia objetivo dentro de ±8% (min=max=1 solución sobre el catálogo completo, 0 escenarios sin solución) — Δ@Z y Y@Z' no colisionan al 8%. El giro es un segundo objetivo independiente resuelto por la secuencia. Aprueba solo si ambos se cumplen (verificado en navegador: conexión equivocada, secuencia equivocada y ambas equivocadas fallan; solo la combinación correcta completa aprueba)."
  - "Recorrido guiado (runAuto): compara Y vs Δ a igual Z mostrando el triple de potencia, invierte la secuencia mostrando el cambio de giro sin cambio de magnitudes, resuelve un objetivo de diseño y aplica la solución sellada del Reto; responde el quiz correcto de cada modo."
normatividad:          # 🔒 verificar clave y vigencia
  - "NOM-001-SEDE-2022 (Instalaciones Eléctricas — utilización): sistemas trifásicos de baja tensión, conductores de fase y de neutro (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-14). ⚑ Confirmar artículo/sección específica aplicable a las relaciones Y/Δ y a la selección del conductor de neutro en cargas balanceadas."
  - "IEC 60038 — tensiones normalizadas: origen de los valores VL∈{220,440} V usados como catálogo de baja tensión. ⚑ Confirmar que 220/440 V son los valores nominales representativos del contexto mexicano (CFE) frente a 208/480 V de práctica estadounidense."
  - "ELE-V; EM-I.2 — anclaje curricular tomado del mapeo interno (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-14); confirmar claves y vigencia exacta con el plan de estudios."
simulador_modela:      # 🔒
  - "Relaciones exactas de un sistema trifásico balanceado en régimen permanente senoidal: VL=√3·VF en la fuente; carga Y con VF=VL/√3 e IL=IF; carga Δ con VF=VL e IL=√3·IF; P=√3·VL·IL·cosφ=3·VF·IF·cosφ; Q=√3·VL·IL·senφ; S=√3·VL·IL; FP=cosφ; S²=P²+Q²."
  - "Resultado Δ=3×Y a igual |Z| y VL, verificado con ratio exacto=3 (node -e y Playwright); origen geométrico del √3 mostrado como el lado del triángulo de tensiones de línea sobre la estrella de tensiones de fase."
  - "Corriente de neutro nula en balanceado (IA+IB+IC=0); el neutro solo existe en estrella. Secuencia de fases ABC/ACB que invierte el sentido de giro sin alterar magnitudes."
  - "Reto verificado numéricamente: cada escenario (VL,|Z|,φ) tiene exactamente 1 par (conexión,|Z|) que alcanza la potencia objetivo dentro de ±8%; el objetivo de giro es independiente. Calificación exige ambos objetivos."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Desbalance de cargas o de fuente y componentes simétricas: las tres ramas se modelan siempre idénticas, por lo que In=0 por construcción; el análisis de sistemas desbalanceados queda fuera de alcance."
  - "Impedancia de los conductores de línea y del neutro, y las caídas de tensión asociadas — la fuente entrega VL ideal en los terminales de la carga."
  - "Armónicos y cargas no lineales (variadores, rectificadores): el modelo es de régimen permanente senoidal puro a una sola frecuencia."
  - "Transitorios de arranque del motor (par, deslizamiento, corriente de arranque reales): el motor es solo un indicador del sentido de giro que fija la secuencia, no un modelo dinámico de máquina."
  - "El sentido de giro concreto (ABC↻ horario / ACB↺ antihorario) es una CONVENCIÓN del simulador; el sentido físico real depende del devanado y del criterio de conexión de la máquina. Lo que sí es general y no depende de la convención es que invertir la secuencia invierte el giro."
  - "Efectos térmicos, saturación magnética del núcleo y pérdidas en el hierro del motor."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: la conexión (Y/Δ), la |Z| y la secuencia que el estudiante elige para un escenario sorteado, calificada por el sistema como correcta si la potencia de línea resultante cae dentro de ±8% del objetivo Y la secuencia produce el sentido de giro requerido."
evidencia_desempeno: "Guía de observación del uso correcto de las relaciones Y (VF=VL/√3, IL=IF) y Δ (VF=VL, IL=√3·IF), del cálculo de P=√3·VL·IL·cosφ, del reconocimiento del factor 3 entre Δ y Y, y de la corrección por inversión de secuencia (permutar dos líneas) para ajustar el sentido de giro."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué se distribuye en tres fases, qué diferencia hay entre estrella y delta, de dónde sale el √3 y el factor 3 de potencia, y cómo la secuencia de fases determina el giro de un motor (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (ajusta VL, |Z|, φ, conexión y secuencia; observa el triángulo de línea sobre la estrella de fase y el triple de potencia Δ vs Y) → diseña (con VL y φ dados, alcanza la potencia objetivo eligiendo conexión y |Z|, ajusta la secuencia al giro pedido, sin calificar) → reto (escenario sorteado, elige conexión + |Z| para la potencia objetivo ±8% y la secuencia para el giro requerido)."
cierre: "Ficha técnica (capa 2) con las relaciones completas Y/Δ, el origen del √3 y del factor 3, la corriente de neutro en balanceado y el efecto de la secuencia de fases sobre el giro."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): sistemas polifásicos, conexiones Y y Δ, potencia trifásica y secuencia de fases."
  - "Boylestad, R. — Introductory Circuit Analysis (Pearson): sistemas trifásicos balanceados, relaciones de tensión y corriente en Y y Δ."
  - "Enríquez Harper, G. — El ABC de las máquinas eléctricas y de las instalaciones eléctricas industriales (Limusa): conexiones trifásicas, secuencia de fases e inversión de giro. ⚑ Verificar edición/capítulo exacto con el experto."
  - "LISTA-MAESTRA-200-PRACTICAS.md, fila d1-14: VL=√3·VF; P=√3·VL·IL·cos φ; NOM-001-SEDE-2022; ELE-V; EM-I.2."
  - "Verificación numérica propia (sesión de construcción, node -e): ratio Δ/Y de potencia = 3 exacto; catálogo del Reto con exactamente 1 solución (conexión,|Z|) por escenario dentro de ±8%, 0 escenarios sin solución. Verificación dinámica en navegador (Playwright, window.__labDebug): 31 checks OK, 0 errores de consola."
banderas_incertidumbre:
  - "⚑ Catálogo VL_CANDS=[220,440] V: elegidos como tensiones de baja tensión representativas del contexto mexicano (CFE: 220 V entre líneas / 127 V de fase). Confirmar con el experto si conviene incluir 440 V (uso industrial común) y si 208 V debe aparecer para alinear con equipos de importación."
  - "⚑ Convención de giro ABC↻/ACB↺: el simulador asigna horario a la secuencia positiva por convención didáctica; el sentido físico real depende del devanado del motor y del criterio de marcado de terminales. Se declara explícitamente en el contrato NO-modela. Confirmar que la convención elegida no induce un error conceptual (lo invariante es 'invertir secuencia ⇒ invertir giro')."
  - "⚑ φ restringido a {0°,30°}: cubre carga resistiva pura y un caso inductivo típico (FP=0.866); no se incluyen cargas capacitivas ni φ intermedios para mantener acotado el catálogo del Reto y garantizar la unicidad de solución (min=max=1). Confirmar si el experto desea un rango de φ más amplio a costa de revisar la unicidad."
  - "⚑ Tolerancia del Reto ±8% sobre la potencia objetivo: calibrada numéricamente para que cada escenario tenga exactamente 1 par (conexión,|Z|) solución sin colisiones. Confirmar si el experto prefiere una tolerancia distinta (revisaría la unicidad con node -e antes de cambiarla)."
  - "⚑ Aplicabilidad exacta de NOM-001-SEDE-2022 a las relaciones Y/Δ: la norma regula instalaciones de utilización; confirmar el artículo específico o si conviene citar además un texto de máquinas eléctricas para el efecto de la secuencia sobre el giro."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (sexta práctica del hueco D1-CA, primera trifásica):** `d1-14`
   es la transición del análisis monofásico equivalente (`mecanica-67..71`, que tratan la
   CA como una sola fase) al sistema trifásico real que sustenta todo el dominio D5 de
   máquinas eléctricas ya construido. Introduce las dos conexiones Y/Δ, el origen
   geométrico del √3 y del factor 3 de potencia, la corriente de neutro nula en
   balanceado y el efecto de la secuencia de fases sobre el giro — todo verificado numérica
   y dinámicamente.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/sistemas-trifasicos.html](../../../public/labs/sistemas-trifasicos.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el resto
   de la familia, declarando explícitamente que las tres ramas son idénticas (In=0 por
   construcción, sin desbalance), que no se modela impedancia de línea ni armónicos, y que
   el sentido de giro ABC↻/ACB↺ es una convención (lo invariante es que invertir la
   secuencia invierte el giro) — siguiendo la regla de honestidad del proyecto.
3. **Petición concreta al experto:** (a) confirmar que VL∈{220,440} V son las tensiones de
   baja tensión representativas del contexto mexicano; (b) validar que la convención de
   giro ABC↻/ACB↺ no induce error conceptual; (c) confirmar la cita normativa exacta de
   NOM-001-SEDE-2022 aplicable a las relaciones Y/Δ y al conductor de neutro; (d) confirmar
   las claves curriculares ⚑ heredadas por analogía (submódulo, ocupación SINCO).
