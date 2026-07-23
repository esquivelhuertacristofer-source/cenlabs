# Ficha de práctica — Potencia en CA: Mide P, Q, S y el Factor de Potencia de Cargas Reales (`mecanica-70`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** cuarta práctica del hueco D1-CA. A diferencia de `mecanica-67`
> (fasores), `mecanica-68` (impedancias RLC) y `mecanica-69` (resonancia), que
> caracterizan UN circuito a la vez, ésta combina DOS cargas reales en paralelo sobre
> el mismo bus y expone una propiedad no trivial: la potencia activa y reactiva se
> suman directamente entre cargas, pero la potencia aparente total NO es la suma de
> las aparentes individuales. Es también la práctica que sienta las bases para
> `d1-13` (banco de capacitores para corrección de factor de potencia, `Qc=P(tan
> φ₁−tan φ₂)`), que reutilizará este mismo triángulo de potencias.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-70
sector: mecanica-electronica
practica_maestra: "d1-12 🔴 — Mide P, Q, S y factor de potencia de cargas reales (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-I; UAX"   # LISTA-MAESTRA-200-PRACTICAS.md, fila d1-12: "S=P+jQ; FP=cos φ" · "ELE-I; UAX"
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Corriente alterna: potencia activa, reactiva, aparente y factor de potencia"   # ⚑ heredado por analogía del submódulo de mecanica-67..69; confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado sin cambio de mecanica-60..69; confirmar que sigue aplicando a medición de potencia
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la potencia activa (P), reactiva
  (Q), aparente (S) y el factor de potencia (FP) de una carga real R+jX, combinar dos
  cargas reales en paralelo sobre el mismo bus de voltaje comprobando que P y Q se
  suman directamente mientras que S debe recalcularse como S_total=√(P_total²+Q_total²)
  (no como S1+S2), y medir experimentalmente el ángulo de potencia y la corriente
  total con un osciloscopio de dos canales para calcular P, Q, S o FP totales a partir
  de esa lectura.
actividad_clave: >
  Explora libremente el tipo (resistiva, inductiva o capacitiva) y los valores de dos
  cargas reales en paralelo, observando en el triángulo de potencias cómo se suman los
  vectores (P,Q) de cada carga para dar la resultante total; en el modo Medición, con
  ambas cargas conocidas y visibles, mide el ángulo de potencia total θ_total con el
  osciloscopio (cursores de cruce por cero sobre V e I_total, mismo mecanismo de
  d1-10/d1-11) y calcula P, Q, S y FP totales, comparándolos contra el valor real
  calculado internamente; en el reto, con ambas cargas conocidas pero la corriente
  total (magnitud y fase) sellada, lee la traza y los cursores del osciloscopio para
  reconstruir I_total y calcula la cantidad pedida (P, Q, S o FP total, según la
  ronda) a partir de esa lectura.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: dos cargas independientes (Carga 1, Carga 2) combinadas en paralelo sobre un bus común V=10∠0° (misma escala que d1-10/d1-11). Cada carga tiene tipo seleccionable {resistiva (X=0), inductiva (X=+Xcand), capacitiva (X=−Xcand)} y candidatos R∈{10,22,47,100} Ω, |X|∈{10,22,47,100} Ω. Los valores R/X/tipo de AMBAS cargas están siempre visibles en los tres modos (a diferencia de d1-10, ninguna carga individual se sella nunca) — se calculan y muestran P, Q, S y FP de cada carga y de la resultante total en tiempo real con cada cambio."
  - "Modelo físico por carga: Z=R+jX, |Z|=√(R²+X²), θ=atan2(X,R) (ángulo entre V e I), I=V/|Z|, S=V·I, P=S·cos θ, Q=S·sin θ. Combinación de dos cargas en paralelo: P_total=P1+P2 y Q_total=Q1+Q2 son EXACTAMENTE aditivos (verificado dos formas independientes: suma directa de potencias por carga, y recombinación por admitancias Y=1/Z, Y_total=Y1+Y2, Z_total=1/Y_total con recálculo completo de P/Q/S/FP desde Z_total — discrepancia máxima entre ambos métodos sobre las 1,280 combinaciones del barrido completo: 3.553e-15, es decir, coinciden a precisión de punto flotante). S_total=√(P_total²+Q_total²) NO es S1+S2 — ejemplo verificado: carga 1 inductiva 22Ω/47Ω + carga 2 capacitiva 47Ω/22Ω da S1+S2=3.854 VA pero S_total real=2.725 VA, porque las corrientes de ambas cargas no están en fase entre sí. Esta no-aditividad de S es el hallazgo pedagógico central de la práctica."
  - "Barrido completo de verificación: 1,280 combinaciones de tipo×R×X para ambas cargas (excluyendo el par resistiva+resistiva, ver abajo). Rango de magnitudes resultantes: S_total entre 0.198 y 15.811 VA; FP_total entre 0.0995 y 1.0000 — confirmado 0 combinaciones con FP fuera del rango físico (0,1] para cargas pasivas."
  - "Exclusión de diseño: el par (resistiva, resistiva) se excluye de la generación de rondas de Medición/Reto — con ambas cargas puramente resistivas, FP_total=1 siempre y Q_total=0 siempre, un caso trivial/degenerado para preguntas basadas en Q. Explora sí permite configurar ambas cargas como resistivas para que el estudiante pueda observarlo por sí mismo."
  - "Mecánica de medición: reutiliza EXACTAMENTE el mecanismo de cursores de cruce por cero sobre un osciloscopio de dos canales de d1-10/d1-11 (V en canal 1 como referencia, I_total en canal 2 vía resistencia de derivación/shunt) para leer el desfase θ_total entre voltaje y corriente total. En el modo Medición, solo θ_total queda sellado (la magnitud de I_total permanece visible, igual que el patrón de Medición de d1-10) — calificación con tolerancia ±5° (TOL_PHI_DEG), idéntica a la usada en d1-10/d1-11. En el modo Reto, TANTO la magnitud como la fase de I_total quedan selladas — ambas deben leerse de la traza (gridlines) y del snap de cursores, exactamente como en el Reto de d1-10/d1-11 — y el estudiante debe además calcular y capturar UNA cantidad (P, Q, S o FP total, rotando por ronda) derivada de esa lectura."
  - "Filtro de degeneración (modo Reto, mismo patrón que d1-10/d1-11, mismo modelo de error de instrumento): se perturba la fase medida ±5° y la amplitud medida ±8% (nueve combinaciones por ronda: 3 valores de fase × 3 de amplitud) y se calcula el peor error relativo (absoluto para FP) resultante en la cantidad pedida. Umbral de aceptación ≤20%. Evaluado sobre 5,120 rondas (1,280 combos × 4 cantidades pedidas P/Q/S/FP): 79.8% elegibles en total, pero MUY desigual por cantidad — P 83.1% elegibles, Q solo 40.9% elegibles, S 100.0% elegibles, FP 95.2% elegibles. La generación de rondas del Reto debe muestrear del conjunto de pares (combo, cantidad) ya filtrados como elegibles, NO elegir la cantidad pedida de forma independiente del combo, o las preguntas de Q caerían desproporcionadamente en rondas mal condicionadas."
  - "Tolerancias finales de calificación del Reto, calibradas numéricamente sobre las rondas elegibles: ±25% relativo para P, Q y S (TOL_FRAC); ±0.10 absoluto para FP (TOL_FP_ABS). El valor de FP se ajustó de una propuesta inicial de ±0.08 (que fallaba en ~40 rondas elegibles, p.ej. valor real=0.4138 vs. valor bajo peor perturbación=0.3329, diferencia 0.0809 > 0.08) a ±0.10, verificado después de la corrección: el 100% de las rondas elegibles caen dentro de esta tolerancia final."
  - "Pizarrón dividido en dos paneles: IZQUIERDO — triángulo de potencias (P en eje X, Q en eje Y, S como hipotenusa); en Explora se superponen los vectores individuales (P,Q) de Carga 1 y Carga 2 junto con el vector resultante total, visualizando la suma vectorial de potencia compleja. DERECHO — osciloscopio de dos canales, reutilizado sin cambios del diseño de d1-10/d1-11 (V canal 1, I_total canal 2, cursores de cruce por cero con snap)."
normatividad:          # 🔒 verificar clave y vigencia
  - "Sin norma específica citada en LISTA-MAESTRA-200-PRACTICAS.md, fila d1-12 (columna 'norma' = '—'). Referencia bibliográfica general de notación: IEC 60050-131 — International Electrotechnical Vocabulary, Part 131: Circuit theory (definiciones de potencia activa, reactiva y aparente)."
  - "ELE-I; UAX — anclaje curricular tomado del mapeo interno (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-12); confirmar clave y vigencia exacta con el plan de estudios."
simulador_modela:      # 🔒
  - "Modelo exacto de potencia compleja para dos cargas R+jX en paralelo sobre un bus común: P_total=P1+P2 y Q_total=Q1+Q2 exactamente aditivos (verificado por dos métodos independientes, discrepancia máxima 3.553e-15 en 1,280 combinaciones); S_total=√(P_total²+Q_total²) explícitamente NO igual a S1+S2, con ejemplo numérico verificado."
  - "Ambas cargas (tipo, R, X) siempre visibles en los tres modos — a diferencia de d1-10, esta práctica no sella componentes individuales, solo la lectura instrumental de la corriente total (magnitud y/o fase, según el modo), consistente con el enunciado literal de LISTA-MAESTRA ('mide P, Q, S y FP', una habilidad de medición/cálculo, no de recuperación de componente oculto)."
  - "Reutilización exacta del mecanismo de medición de fase por cursores de cruce por cero sobre un osciloscopio de dos canales, ya validado en d1-10/d1-11 (incluye el snap de cursores y el modelo de error de instrumento ±5°/±8%)."
  - "Filtro de generación de rondas del Reto basado en el peor error de la cantidad pedida (P, Q, S o FP) bajo perturbación combinada de fase y amplitud, muestreado por par (combo, cantidad) para respetar la elegibilidad desigual entre cantidades (Q es la más restrictiva, 40.9% elegible)."
  - "Tolerancias de calificación calibradas numéricamente contra el peor error observado en las rondas elegibles (±25% relativo P/Q/S, ±0.10 absoluto FP), no valores arbitrarios."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Pérdidas parásitas o comportamiento no lineal de cargas reales (saturación magnética, armónicos de corriente) — cada carga se modela como una impedancia R+jX ideal y constante, igual que el resto de la familia D1-CA."
  - "Sistemas trifásicos ni cargas desbalanceadas — el análisis es estrictamente monofásico, dos cargas sobre un único bus de voltaje."
  - "Corrección de factor de potencia (banco de capacitores) — esta práctica solo MIDE P, Q, S y FP; el diseño del banco correctivo es el alcance declarado de la siguiente práctica del backlog (d1-13, Qc=P(tan φ₁−tan φ₂))."
  - "Potencia instantánea p(t) ni formas de onda en el dominio del tiempo más allá de las trazas de V e I usadas para medir el desfase — todas las cantidades calificadas (P, Q, S, FP) son fasoriales de régimen permanente senoidal."
  - "Ruido de instrumentación real ni ancho de banda finito del osciloscopio — la única fuente de error de medición modelada es la perturbación deliberada de fase (±5°) y amplitud (±8%) usada para calibrar el filtro de degeneración y las tolerancias, no ruido añadido a las trazas."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: la cantidad total pedida (P, Q, S o FP, según la ronda) calculada por el estudiante a partir de su propia lectura de magnitud y fase de I_total en el osciloscopio, calificada por el sistema con tolerancia ±25% relativo (±0.10 absoluto si la cantidad pedida es FP)."
evidencia_desempeno: "Guía de observación de la lectura correcta del ángulo de potencia (Medición) o de la magnitud y fase completas de I_total (Reto) con los cursores del osciloscopio, y de la aplicación correcta de P=S·cos θ, Q=S·sin θ, S=V·I y FP=P/S sobre esa lectura, incluyendo la combinación correcta de las dos cargas conocidas cuando la cantidad pedida lo requiere."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: qué son P, Q y S físicamente, por qué el factor de potencia importa en la práctica (facturación, dimensionamiento de transformadores), y por qué combinar dos cargas reales revela que S NO se suma como P y Q (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (configura tipo y valores de dos cargas en paralelo, observa la suma vectorial en el triángulo de potencias) → medición (con ambas cargas visibles, mide el ángulo de potencia total con el osciloscopio y calcula P/Q/S/FP totales) → reto (con la corriente total sellada en magnitud y fase, léela del osciloscopio y calcula la cantidad pedida)."
cierre: "Ficha técnica (capa 2) con el modelo completo de potencia compleja para dos cargas en paralelo, la demostración numérica de la no-aditividad de S, y la mecánica de medición por osciloscopio reutilizada de d1-10/d1-11."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): potencia compleja, potencia activa/reactiva/aparente, factor de potencia."
  - "Boylestad, R. — Introductory Circuit Analysis (Pearson): triángulo de potencias, combinación de cargas en paralelo."
  - "IEC 60050-131 — International Electrotechnical Vocabulary, Part 131: Circuit theory."
  - "Verificación numérica propia (sesión de construcción, node -e sobre script standalone, 8 secciones): aditividad exacta de P/Q por dos métodos independientes (discrepancia máxima 3.553e-15 en 1,280 combos); no-aditividad de S con ejemplo numérico; rango físico de S_total (0.198–15.811 VA) y FP_total (0.0995–1.0000); filtro de degeneración con 5,120 rondas evaluadas (79.8% elegibles, desglose por cantidad P 83.1%/Q 40.9%/S 100.0%/FP 95.2%); calibración de tolerancia final TOL_FP_ABS de 0.08 (fallido, ~40 violaciones) a 0.10 (verificado, 100% de rondas elegibles dentro de tolerancia)."
banderas_incertidumbre:
  - "⚑ Ambas cargas siempre visibles/conocidas en los tres modos, sin componente sellado individual (a diferencia de d1-09/d1-10): decisión deliberada para ajustarse al enunciado literal de LISTA-MAESTRA ('mide P, Q, S y FP', una habilidad de medición, no de recuperación de componente oculto) y para evitar la complejidad de despejar una reactancia/resistencia oculta por sustracción (que arriesgaba ambigüedad de raíz múltiple). Confirmar con el experto si esta simplificación es pedagógicamente suficiente o si se prefiere una variante futura con una carga parcialmente oculta."
  - "⚑ Tolerancia de FP en Reto (±0.10 absoluto, no un valor 'redondo' como ±0.05 o ±0.15): se derivó directamente de que ±0.08 fallaba en el peor caso numérico observado (diferencia real de 0.0809 en al menos una ronda elegible). Confirmar si el experto prefiere un valor más convencional a costa de ser menos ajustado, o mantener el valor calibrado numéricamente."
  - "⚑ Elegibilidad muy desigual entre cantidades pedidas (Q 40.9% vs. S 100.0%): implica que las preguntas de Reto sobre Q serán necesariamente más escasas/restringidas en el espacio de combos que las de S. Confirmar que esta frecuencia no uniforme de tipos de pregunta es pedagógicamente aceptable, o si el experto prefiere ampliar los candidatos de R/X para equilibrar mejor la elegibilidad de Q."
  - "⚑ Bus V=10V y candidatos R,|X|∈{10,22,47,100}Ω: heredados por convención directa de d1-10/d1-11 sin justificación independiente de que sean representativos de cargas industriales reales combinadas en este contexto específico de potencia. Confirmar representatividad."
  - "⚑ Exclusión del par (resistiva,resistiva) de Medición/Reto pero no de Explora: confirmar que dejarlo disponible solo para exploración libre (sin calificación) es la decisión correcta, en vez de excluirlo por completo del banco."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (cuarta práctica del hueco D1-CA, primera en combinar dos
   circuitos independientes):** `d1-12` da un paso distinto a `mecanica-67..69`, que
   caracterizan un solo circuito RLC a la vez — aquí se combinan DOS cargas reales en
   paralelo sobre el mismo bus, y el hallazgo central es que la potencia aparente total
   NO hereda la aditividad de la potencia activa y reactiva. El mecanismo de medición
   (osciloscopio, cursores de cruce por cero) se reutiliza sin cambios de d1-10/d1-11;
   lo nuevo es la capa de cálculo de potencia sobre esa medición y la combinación de
   dos cargas.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/potencia-ac.html](../../../public/labs/potencia-ac.html)) muestra el
   panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el resto de la
   familia, y declara explícitamente que las cargas son impedancias ideales sin
   pérdidas parásitas ni armónicos, y que la corrección de factor de potencia queda
   fuera de alcance (es el tema de la siguiente práctica) — siguiendo la regla de
   honestidad del proyecto (`ESTANDAR-MOLDE-LAB-3D.md`: rangos, no cifras inventadas).
3. **Petición concreta al experto:** (a) confirmar que mantener ambas cargas siempre
   visibles (sin componente oculto) es pedagógicamente suficiente para el enunciado de
   LISTA-MAESTRA; (b) validar la tolerancia de FP en Reto (±0.10, calibrada
   numéricamente) frente a un valor más convencional; (c) confirmar si la elegibilidad
   desigual entre cantidades pedidas (Q mucho más restrictiva que S) es aceptable o si
   conviene ampliar los candidatos de R/X; (d) confirmar las claves curriculares ⚑
   heredadas por analogía (submódulo, ocupación SINCO).
