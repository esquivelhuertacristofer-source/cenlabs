# Ficha de práctica — Resonancia RLC: Sintoniza, Mide Q y Caracteriza el Ancho de Banda (`mecanica-69`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** tercera práctica del hueco D1-CA y cierre declarado del tema que
> `mecanica-68` (d1-10) dejó explícitamente fuera de alcance («Resonancia, factor de
> calidad Q ni ancho de banda… tema de la siguiente práctica del backlog»). Reutiliza
> el mismo modelo de impedancia RLC serie/paralelo de d1-10 (`Z=R+j(ωL−1/ωC)` en serie,
> `Y=1/R+j(ωC−1/ωL)` en paralelo), pero en vez de leer Z en una sola frecuencia, barre
> f y caracteriza la curva `|Z(f)|` completa: su extremo (f₀), su forma (Q, Δf) y las
> ecuaciones de inversión que permiten recuperar un componente sellado a partir de
> f₀ y Q medidos.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-69
sector: mecanica-electronica
practica_maestra: "d1-11 🔴 — Sintoniza la resonancia y caracteriza Q y ancho de banda (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-II"   # LISTA-MAESTRA-200-PRACTICAS.md, fila d1-11: "f₀=1/(2π√LC); Q=f₀/Δf" · "ETR-II"
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Corriente alterna: resonancia RLC, factor de calidad y ancho de banda"   # ⚑ heredado por analogía del submódulo de mecanica-68; confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado sin cambio de mecanica-60..68; confirmar que sigue aplicando a resonancia RLC
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de identificar la frecuencia de resonancia
  f₀=1/(2π√LC) de un circuito RLC serie o paralelo, medir experimentalmente f₀ y el
  factor de calidad Q=f₀/Δf con un analizador de barrido de frecuencia (curva |Z(f)|
  y tres cursores: pico/valle y dos de media potencia), y despejar el valor de un
  componente oculto (R, L o C, según la ronda) a partir de esa medición y las
  ecuaciones de resonancia de la topología activa.
actividad_clave: >
  Explora libremente la topología (serie o paralelo) y los valores de R, L y C de un
  circuito RLC, observando en tiempo real cómo se desplaza f₀ sobre la curva |Z(f)| y
  cómo cambia su forma (angosta o ancha) según Q; en el modo Medición, con R, L, C y
  la topología visibles, mide f₀ con el cursor de pico/valle y f₁/f₂ con los cursores
  de media potencia (nivel objetivo = |Z(f₀)|·√2 en serie, |Z(f₀)|/√2 en paralelo),
  calcula Q=f₀/(f₂−f₁) y compáralo contra el valor real calculado internamente; y en
  el reto, con un componente sellado, mide f₀ y Q de la misma forma y despeja el
  componente oculto aplicando las ecuaciones de inversión de la topología activa.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: selector de topología (serie / paralelo). Componentes seleccionables de listas de candidatos — L∈{10,22,47,100} mH, C∈{1,2.2,4.7,10} µF (compartidos por ambas topologías), R∈{8,14,22,33} Ω en serie, R∈{220,470,1000,2200} Ω en paralelo (rangos distintos porque Q=ω₀L/R en serie y Q=R/(ω₀L) en paralelo requieren R en escalas opuestas para producir un Q razonable). f₀, |Z(f₀)| y Q se calculan y muestran en tiempo real con cada cambio."
  - "Modelo de resonancia (idéntico al de impedancia de d1-10, evaluado ahora en un barrido de frecuencia): f₀=1/(2π√(LC)) es la misma fórmula en ambas topologías, consecuencia directa de XL=XC. En serie, |Z| alcanza su MÍNIMO en f₀ (Z=R); en paralelo, su MÁXIMO (Z=R). Factor de calidad: Qserie=ω₀L/R=1/(ω₀RC); Qparalelo=R/(ω₀L)=ω₀RC. Ancho de banda Δf=f₀/Q en ambas topologías; frecuencias de media potencia f₁,f₂ tales que |Z(f₁,f₂)|=|Z(f₀)|·√2 (serie) o |Z(f₀)|/√2 (paralelo). Verificado algebraicamente y numéricamente antes de implementar (ver más abajo)."
  - "Analizador de barrido: se traza |Z(f)| exacta (analítica, sin ruido de muestreo) sobre una ventana de frecuencia [0.25·f₀, 3·f₀] con 601 muestras en eje lineal, suficientemente denso para que un cursor de paso discreto (por muestra) resuelva el pico/valle y ambos cruces de media potencia con precisión práctica."
  - "Filtro de elegibilidad Q: solo se generan rondas (Explora/Medición/Reto) donde 1.2≤Q≤18 — un Q por debajo de 1.2 produce una curva demasiado plana para que los cursores de media potencia sean distinguibles del pico dentro de la ventana de barrido; un Q por encima de 18 produce una resonancia tan angosta que cae en muy pocas muestras, dificultando el cursor de forma no realista para instrumentación educativa."
  - "Mecánica de medición: cursor de pico/valle (barrido discreto por muestra, sin búsqueda automática de extremo — se ubica por inspección visual de la curva). El nivel objetivo de media potencia se calcula EN VIVO a partir de la lectura actual del cursor de pico/valle: objetivo=Z(pico)·√2 (serie) o Z(pico)/√2 (paralelo). Los cursores izquierdo/derecho de media potencia se ajustan (snap) al cruce de nivel objetivo más cercano entre todos los cruces detectados en la curva muestreada — mismo patrón de snap-al-cruce-más-cercano que el mecanismo de cruce por cero de mecanica-67/68, adaptado de dominio temporal a dominio de frecuencia. El botón 'Medir resonancia' congela f₀, |Z(f₀)|, f₁, f₂ y Q=f₀/(f₂−f₁) en variables selladas, en una sola acción — a diferencia de d1-10 (una medición → una cantidad calificada), aquí una medición produce DOS cantidades calificadas (f₀ y Q) porque ambas provienen de la misma lectura de tres cursores sobre la misma curva."
  - "Modo Medición: topología, R, L, C todos conocidos y visibles; f₀ y Q sellados (no se muestran como texto) hasta medirlos. Calificación de dos etapas independientes sobre la MISMA acción de medir: f₀ con tolerancia ±5% (verificado numéricamente: error máximo real bajo perturbación de ±1 muestra en los tres cursores, 2,808 combinaciones, fue 0.63% — ±5% deja margen amplio); Q con tolerancia ±22% (verificado numéricamente: error máximo real bajo la misma perturbación fue 20.14% — ±22% es el mínimo margen que garantiza que una medición cuidadosa en el peor caso observado siga calificando como correcta, sin ampliar la tolerancia más de lo necesario)."
  - "Modo Reto: topología conocida; UNO de los tres componentes (R, L o C, elegido al azar por ronda) queda sellado (🔒), los otros dos permanecen visibles. El estudiante mide f₀ y Q con el analizador (misma técnica que en Medición) y aplica la fórmula de inversión correspondiente para calcular el componente sellado; reporta un único número (en Ω, mH o µF) calificado con tolerancia ±25% (idéntica a d1-10, mismo margen pedagógico para absorber el error propio de una medición gráfica por cursores)."
  - "Fórmulas de inversión del componente sellado (a partir de f₀ medida y Q medida): si L es el sellado, L=1/((2πf₀)²·C_conocida); si C es el sellado, C=1/((2πf₀)²·L_conocida); si R es el sellado, en serie R=ω₀L_conocida/Q, en paralelo R=Q·ω₀·L_conocida (ω₀=2πf₀). Las dos primeras dependen solo de f₀; la tercera depende de f₀ y Q simultáneamente."
  - "Filtro anti-degeneración en la generación de rondas del Reto (mismo patrón que d1-10, umbral idéntico ≤20%): antes de sellar un componente, se calcula por fuerza bruta el peor error del componente recuperado bajo una perturbación de ±1 muestra de índice en cada uno de los tres cursores (imitando el error de instrumento realista de un cursor de paso discreto), y solo se acepta la ronda si ese peor caso es ≤20%. Verificado numéricamente antes de implementar sobre el espacio completo de combinaciones filtradas por Q∈[1.2,18]."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60027-1 — Letter symbols to be used in electrical technology: notación de impedancia, reactancia, frecuencia de resonancia y factor de calidad."
  - "IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering: convenciones de símbolos para resonancia y ancho de banda."
  - "ETR-II — anclaje curricular tomado del mapeo interno (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-11); confirmar clave y vigencia exacta con el plan de estudios."
simulador_modela:      # 🔒
  - "Modelo exacto de resonancia RLC en topología serie y paralelo: f₀=1/(2π√(LC)) idéntica en ambas; Qserie=ω₀L/R, Qparalelo=R/(ω₀L); Δf=f₀/Q; frecuencias de media potencia f₁,f₂ definidas por |Z(f₁,f₂)|=|Z(f₀)|·√2 (serie) o /√2 (paralelo) — todo evaluado sin aproximación a partir del modelo de impedancia exacto ya usado en mecanica-68."
  - "Analizador de barrido con curva |Z(f)| trazada analíticamente (no simulación de ruido de muestreo) sobre una ventana centrada en f₀, con snap de cursores de media potencia al cruce de nivel más cercano — mismo patrón de instrumentación que el snap-a-cruce-por-cero de mecanica-67/68, adaptado a dominio de frecuencia."
  - "Filtro de elegibilidad Q∈[1.2,18] que garantiza que toda ronda generada tenga una curva de resonancia distinguible dentro de la ventana de barrido, ni demasiado plana ni demasiado angosta para el paso discreto del cursor."
  - "Fórmulas de inversión algebraicamente exactas para recuperar un componente sellado (R, L o C) a partir de f₀ y Q medidos, en ambas topologías."
  - "Filtro de generación de rondas del Reto basado en el peor error de recuperación bajo perturbación realista de cursor (±1 muestra), no solo en el valor nominal — evita rondas numéricamente mal condicionadas, mismo patrón que mecanica-68."
  - "Calificación de dos cantidades independientes (f₀ y Q) derivadas de una sola acción de medición sobre tres cursores, con tolerancias calibradas numéricamente contra el error de medición real observable (no arbitrarias)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Componentes reales con pérdidas parásitas (resistencia serie equivalente de una bobina o capacitor real) — R, L y C se modelan como elementos ideales puros, igual que en mecanica-68."
  - "Ruido de instrumentación, ancho de banda finito del analizador ni efecto de carga del instrumento sobre el circuito medido — la curva |Z(f)| es analítica y exacta; la única fuente de error de medición es el paso discreto (snap) de los cursores, no ruido añadido."
  - "Resonancias múltiples, circuitos RLC de más de tres elementos ni redes mixtas serie-paralelo — el banco cubre estrictamente los dos casos canónicos de resonancia simple (serie pura, paralelo puro) con un elemento de cada tipo, mismo alcance que mecanica-68."
  - "Fenómenos de resonancia en sistemas trifásicos, armónicos de red ni resonancia mecánica — es un análisis puramente eléctrico de un circuito RLC de una sola frecuencia fundamental barrida."
  - "Efecto Q sobre la fase θz ni medición de fase en el dominio del tiempo — a diferencia de mecanica-67/68, esta práctica no usa cursores de cruce por cero sobre un osciloscopio; mide f₀ y Q directamente sobre la curva |Z(f)| en el dominio de la frecuencia, por lo que la pendiente de fase no se caracteriza aquí."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: el valor del componente sellado (R, L o C, según la ronda) despejado por el estudiante a partir de f₀ y Q medidos, calificado por el sistema con tolerancia ±25%."
evidencia_desempeno: "Guía de observación del uso correcto del analizador de barrido (ubicación del cursor de pico/valle, snap de los cursores de media potencia al nivel objetivo √2 calculado en vivo) para obtener f₀ y Q en el modo Medición, y de la aplicación correcta de las ecuaciones de inversión en el modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué existe una frecuencia especial donde XL=XC, qué significan f₀, Δf y Q físicamente, y cómo el analizador de barrido extiende el modelo de impedancia de la práctica anterior de un punto a una curva completa (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (elige topología, ajusta R, L, C, observa cómo se mueve f₀ y cambia la forma de la curva |Z(f)| según Q) → medición (con todos los componentes visibles, mide f₀ y Q con los tres cursores del analizador y compáralos contra el valor real) → reto (un componente sellado, mide f₀ y Q, despeja el componente oculto con las ecuaciones de inversión de la topología)."
cierre: "Ficha técnica (capa 2) con el modelo de resonancia completo para ambas topologías, la deducción de Δf=f₀/Q, la mecánica de medición por tres cursores, y las fórmulas de inversión para cada componente sellado."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): resonancia serie y paralelo, factor de calidad, ancho de banda y frecuencias de media potencia."
  - "Boylestad, R. — Introductory Circuit Analysis (Pearson): resonancia RLC, curvas de respuesta en frecuencia."
  - "IEC 60027-1 — Letter symbols to be used in electrical technology."
  - "IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering."
  - "Verificación numérica propia (sesión de construcción, node -e, 4 pasadas independientes): exactitud algebraica de f₀/Q/inversión sin ruido; error de f₀/Q medido bajo perturbación de ±1 muestra en 2,808 combinaciones del espacio filtrado por Q∈[1.2,18] (máximo observado: f₀ 0.63%, Q 20.14%); peor error del componente recuperado bajo la misma perturbación, usado para calibrar el filtro anti-degeneración del Reto (umbral ≤20%, mismo patrón que mecanica-68)."
banderas_incertidumbre:
  - "⚑ Convención de fase (heredada de mecanica-67/68, sin resolver): a diferencia de esas dos prácticas, ésta NO mide fase en el dominio del tiempo — el analizador de barrido trabaja enteramente sobre |Z(f)|, una magnitud real que no depende de si la referencia de fase del generador es seno o coseno. La pregunta pendiente para el experto (seno vs. coseno como convención estándar de la industria) sigue abierta para mecanica-67/68 pero NO afecta la validez de esta práctica; se documenta aquí solo para que quede explícito que d1-11 no la hereda por construcción, no porque se haya resuelto."
  - "⚑ Rangos de R distintos por topología (R_serie∈{8,14,22,33}Ω vs. R_paralelo∈{220,470,1000,2200}Ω): son rangos elegidos para que, combinados con L∈{10,22,47,100}mH y C∈{1,2.2,4.7,10}µF, el filtro de elegibilidad Q∈[1.2,18] deje suficientes combinaciones válidas en ambas topologías. Confirmar que estos valores son representativos de componentes comerciales típicos usados en un banco de resonancia didáctico real, y no solo una elección numérica conveniente para el simulador."
  - "⚑ Ventana de barrido [0.25·f₀,3·f₀] con 601 muestras y paso de cursor discreto (snap a la muestra más cercana) en vez de una búsqueda continua o automática del extremo/cruces: es una elección pedagógica deliberada (obliga al estudiante a leer la curva, no a que el software encuentre el punto por él), verificada numéricamente para mantener el error de medición dentro de las tolerancias declaradas. Confirmar que esta densidad de muestreo es representativa de un analizador de barrido real de gama educativa."
  - "⚑ Tolerancia de Q en Medición (±22%, no un número 'redondo' como ±20% o ±25%): se derivó directamente del peor error numérico observado (20.14%) más un margen mínimo, no de una convención de instrumentación citada en la literatura. Confirmar si el experto prefiere un valor más convencional (p. ej. ±25%, igual que la tolerancia del componente en Reto) a costa de ser menos ajustado al error real medido, o mantener el valor calibrado numéricamente."
  - "⚑ Calificación de dos cantidades (f₀ y Q) a partir de una sola acción de medición en el modo Medición: es una decisión de diseño explícita para esta práctica (distinta del patrón de una-cantidad-por-medición de d1-09/d1-10), justificada porque ambas cantidades emergen de la misma lectura de tres cursores sobre la misma curva. Confirmar que evaluar dos resultados por una sola interacción es pedagógicamente apropiado, o si el experto preferiría separar la medición de f₀ y de Q en dos acciones distintas."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (tercera práctica del hueco D1-CA, cierre del tema declarado
   pendiente por `mecanica-68`):** `d1-11` extiende el modelo de impedancia RLC de la
   práctica anterior de un solo punto de frecuencia a una curva `|Z(f)|` completa, y
   caracteriza su forma con tres cantidades clásicas — resonancia (f₀), ancho de banda
   (Δf) y factor de calidad (Q) — que determinan qué tan selectivo o tolerante es un
   circuito sintonizado. El mecanismo de "sellar una cantidad, medirla con cursores,
   despejar un componente oculto" se reutiliza del patrón ya validado en d1-09/d1-10,
   ahora aplicado al dominio de la frecuencia en vez del dominio del tiempo.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/resonancia-rlc.html](../../../public/labs/resonancia-rlc.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el
   resto de la familia, y declara explícitamente que el circuito es lineal e ideal (sin
   pérdidas parásitas) y que la curva es analítica sin ruido de muestreo — siguiendo la
   regla de honestidad del proyecto (`ESTANDAR-MOLDE-LAB-3D.md`: rangos, no cifras
   inventadas).
3. **Petición concreta al experto:** (a) confirmar que los rangos de R distintos por
   topología (8–33 Ω en serie, 220–2200 Ω en paralelo) son representativos de un banco
   de resonancia didáctico real; (b) validar la tolerancia de Q en Medición (±22%,
   calibrada numéricamente contra el peor error observado) frente a la alternativa de
   usar un valor más convencional; (c) confirmar si calificar f₀ y Q simultáneamente a
   partir de una sola acción de medición es pedagógicamente apropiado; (d) confirmar
   las claves curriculares ⚑ heredadas por analogía (submódulo, ocupación SINCO).
