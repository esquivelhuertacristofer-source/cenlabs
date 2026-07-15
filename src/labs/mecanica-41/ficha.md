# Ficha de práctica — Micrómetro y Comparador de Carátula: resolución 0.01 mm, runout y planitud (`mecanica-41`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** segunda práctica del sub-clúster de metrología general que cierra el
> dominio D10 (Instrumentación, diagnóstico y metrología) — d10-11 a d10-14 (calibrador
> vernier, micrómetro/comparador, incertidumbre GUM/trazabilidad, termopar/RTD/IR). Igual
> que `mecanica-40` (d10-11), esta práctica **no aparece nombrada en ninguna fila T1–T4 de
> la tabla de tandas de `docs/LISTA-MAESTRA-200-PRACTICAS.md`** (T2 solo cubrió
> d10-01…d10-10): construirla como parte de la sub-tanda discreta que cierra D10 (14/14)
> antes de continuar con D5 es la misma decisión de secuenciación documentada en la ficha
> de `mecanica-40`, no una instrucción explícita de la tabla de tandas — se documenta aquí
> con transparencia para que el responsable curricular la confirme o la ajuste (ver nota 1).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-41
sector: mecanica-electronica
practica_maestra: "d10-12 — Mide con micrómetro y comparador: runout y planitud (molde E+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "UAX metrología — tomado literalmente de la columna 'Trazabilidad' de la fila d10-12 en docs/LISTA-MAESTRA-200-PRACTICAS.md"   # ⚑ la columna 'Norma ancla' de esa misma fila está vacía ('—'); las normas ASME/ISO citadas abajo provienen de investigación propia, no de la lista maestra — confirmar con el responsable curricular
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Instrumentos de medición dimensional de precisión y comparación — micrómetro y comparador de carátula"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de mecanica-40 (misma familia D10), pensado originalmente para instrumentación ELÉCTRICA; la metrología dimensional (micrómetro/comparador) es un oficio distinto (control de calidad / metrología mecánica) — confirmar si existe una clave SINCO más específica antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de leer un micrómetro sumando sus tres términos
  (milímetros enteros del manguito + 0.5 mm si la marca intermedia está descubierta +
  división del tambor × 0.01 mm, derivado de un husillo de paso 0.5 mm/vuelta con tambor de
  50 divisiones); corregir la lectura cruda por el error de cero propio del instrumento
  (Lectura corregida = Lectura cruda − Error de cero, con su signo), reconociendo que en un
  micrómetro físico esa corrección se hace mecánicamente y no por resta aritmética; explicar
  para qué sirve el trinquete (fuerza de medición constante y repetible) sin memorizar una
  cifra de error no verificable; y usar un comparador de carátula tipo émbolo para evaluar
  runout (TIR = lectura máxima − lectura mínima en 6 ángulos de giro) y planitud (máxima −
  mínima entre 5 puntos palpados), comparando ambos resultados contra una tolerancia de
  aceptación explícita.
actividad_clave: >
  Resuelve 5 casos con dos instrumentos: en el micrómetro, un eje sin error de cero (eje A,
  11.98 mm), un eje con error de cero conocido (eje B, 19.97 mm, error +0.02 mm) y un caso
  puramente conceptual sobre el trinquete (sin cifra que leer, solo criterio de uso
  correcto); en el comparador de carátula, un eje girando sobre soportes en V con 6 lecturas
  cada 60° para evaluar runout, y una placa con 5 puntos palpados para evaluar planitud
  contra dos clases de tolerancia distintas (una exigente, una laxa) que dan veredictos
  opuestos sobre la MISMA medición.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica las partes de ambos instrumentos en el banco 3D: en el micrómetro, el husillo, el tambor graduado, el manguito con la marca intermedia, el trinquete, la palanca de bloqueo y el visor digital-analógico; en el comparador, la aguja, la carátula de 100 divisiones, el émbolo (plunger), el brazo articulado y la base magnética."
  - "Caso Eje A (Ø real 11.98 mm, sin error de cero): cierra el micrómetro sobre la pieza y confirma que la lectura se descompone en 11 mm enteros + media vuelta descubierta + división 48 del tambor × 0.01 mm = 11.98 mm, sin necesidad de corrección alguna."
  - "Caso Eje B (Ø real 19.97 mm, error de cero conocido +0.02 mm sin cuantizar): identifica en la telemetría la lectura cruda (19.99 mm, que decompone en 19 mm + media vuelta + división 49 del tambor) y calcula la lectura corregida = cruda − error de cero = 19.97 mm, confirmando que un error de cero positivo hace que la corregida sea MENOR que la cruda — mismo sentido de corrección que el Caso 2 de calibrador vernier (mecanica-40)."
  - "Caso Trinquete (conceptual, sin lectura numérica): responde qué logra el trinquete (aplicar una fuerza de medición constante y repetible entre operadores distintos) y por qué NO se debe girar el tambor directamente para el contacto final — sin que el simulador te dé una cifra de cuánto error introduce saltarse el trinquete, porque esa magnitud no está respaldada por una norma citable de forma confiable."
  - "Caso Runout (eje girando sobre soportes en V, 6 lecturas cada 60°: 0.00, 0.01, 0.04, 0.05, 0.02, 0.00 mm): recorre las 6 lecturas con 'Siguiente lectura', calcula TIR = máxima − mínima = 0.05 mm, y compáralo contra la tolerancia de aceptación (0.02 mm) para confirmar que este eje se RECHAZA por runout excesivo."
  - "Caso Planitud (placa con 5 puntos palpados: 0.000, 0.015, 0.045, 0.010, 0.030 mm): calcula planitud = máxima − mínima = 0.045 mm, y compárala contra DOS clases de tolerancia distintas mostradas en el informe (H=0.02 mm, K=0.05 mm) para confirmar que la MISMA medición se rechaza contra la clase H y se acepta contra la clase K — la tolerancia aplicable depende de lo que exige el plano, no del instrumento."
  - "En cada caso con lectura numérica, responde la pregunta de opción múltiple eligiendo entre el resultado correcto y distractores derivados de errores de lectura reales (cruda sin corregir, ±1 división de tambor, ±1 mm de manguito, TIR confundido con un promedio, planitud evaluada contra la clase de tolerancia equivocada); en el caso del trinquete, elige entre criterios de uso correctos e incorrectos, no entre cifras."
  - "Usa 'Medición automática (guiada)' para ver el procedimiento completo narrado paso a paso en cualquiera de los 5 casos, como referencia antes o después de resolverlo por cuenta propia."
normatividad:          # 🔒 verificar clave y vigencia
  - "ASME B89.1.13-2013 (R2022) 'Micrometers' — norma ancla de exactitud y diseño de micrómetros; investigación propia, NO proviene de la columna 'Norma ancla' de la lista maestra (que está vacía para esta fila) — confirmar con el responsable curricular."
  - "ISO 3611:2023 'Geometrical product specifications (GPS) — Dimensional measuring equipment: Micrometers for external measurements' — equivalente internacional."
  - "ASME B89.1.10M-2001 (R2016/R2021) 'Dial Indicators (for Linear Measurements)' — norma ancla del comparador de carátula tipo émbolo usado en runout/planitud."
  - "ISO 463:2006 'Geometrical product specifications (GPS) — Dimensional measuring equipment: Design and metrological characteristics of dial and digital indicators' — equivalente internacional."
  - "ASME Y14.5-2018 / ISO 1101 — citadas SOLO como contexto conceptual de que runout y planitud son controles geométricos normados que un plano puede exigir además de la dimensión; este lab no implementa el sistema completo de GD&T, solo el cálculo de TIR y planitud por diferencia máx−mín."
  - "ISO 2768-2:1989 — origen conceptual de la idea de clases de tolerancia general (aquí simplificadas a dos clases ilustrativas H/K con valores 0.02/0.05 mm elegidos a mano para mostrar contraste, NO tomadas literalmente de la tabla de la norma) — confirmar si deben reemplazarse por valores de una tabla real antes de escalar el patrón."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La fórmula de lectura del micrómetro en tres términos (mm enteros del manguito + 0.5 mm si la marca intermedia está descubierta + división del tambor × 0.01 mm), derivada de un husillo de paso 0.5 mm/vuelta con tambor de 50 divisiones — verificada numéricamente: `decomposeMic()` reproduce exactamente 11 mm+media+48 para 11.98 mm y 19 mm+media+49 para 19.99 mm."
  - "Corrección por error de cero con signo (nulo en el Eje A, positivo en el Eje B): Lectura corregida = Lectura cruda − Error de cero — con la declaración EXPLÍCITA, tanto en el HUD del lab como en esta ficha, de que en un micrómetro físico esa corrección se hace mecánicamente (ajuste del manguito con llave), no por resta aritmética; el modelo la resuelve aritméticamente por paridad pedagógica con calibrador vernier (mecanica-40)."
  - "El trinquete como caso puramente CONCEPTUAL: el quiz evalúa criterio de uso (para qué sirve, cuándo se usa) sin generar ni exigir ninguna cifra de error — decisión de diseño explícita para no inventar una magnitud de error no verificable contra una norma citable."
  - "Runout por TIR = lectura máxima − lectura mínima entre 6 ángulos fijos (0°/60°/120°/180°/240°/300°) de un eje girando sobre soportes en V, con comparación explícita contra una tolerancia de aceptación."
  - "Planitud por máxima − mínima entre 5 puntos fijos palpados sobre una placa, evaluada contra DOS clases de tolerancia simultáneas (H estricta, K laxa) que dan veredictos opuestos sobre la misma medición — para enseñar que la tolerancia aplicable la define el plano, no el instrumento."
  - "El comparador de carátula modelado es explícitamente de tipo ÉMBOLO (plunger), declarado como tal en el HUD, para no confundirlo con el tipo de palanca (lever), que introduce un error de coseno que este modelo no reproduce."
  - "Generador de opciones de quiz derivado de la física real de cada caso, con retroalimentación explicativa específica por distractor — no son opciones genéricas."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La magnitud exacta del error introducido por apretar el tambor directamente en vez de usar el trinquete — no se simula como cifra porque no está respaldada de forma verificable por una norma citable; se enseña solo el criterio de uso correcto (ver Caso Trinquete)."
  - "El procedimiento mecánico real de corrección de error de cero (girar el manguito con la llave de ajuste) — el modelo corrige aritméticamente, declarado explícitamente como simplificación pedagógica, no como representación de cómo se corrige un micrómetro físico."
  - "El error de coseno del comparador tipo palanca (lever) — el modelo usa exclusivamente el tipo émbolo (plunger), que no lo presenta; se declara la distinción explícitamente para que el estudiante no generalice el resultado a un comparador de palanca."
  - "La fuerza de medición variable del operador — la especificación de 5–10 N frecuentemente citada es una especificación de fabricante (p. ej. Mitutoyo serie 102), no un requisito de texto general ASME/ISO, y el modelo no la simula como variable de error."
  - "Dilatación térmica del instrumento o de la pieza medida, ni deriva/desgaste de calibración de ninguno de los dos instrumentos con el tiempo."
  - "Los valores 'verdaderos' de cada eje, sus errores de cero, las 6 lecturas de runout y los 5 puntos de planitud son constantes fijas elegidas a mano para que la lección sea clara (mismo patrón que calibrador-vernier.body.js) — no están anclados a una pieza o instrumento certificado real; igualmente, los valores de tolerancia H/K de planitud son ilustrativos, no tomados literalmente de una tabla normativa."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 5 casos: lectura cruda, error de cero (con signo) y lectura corregida para Eje A/Eje B; criterio de uso correcto del trinquete; TIR de runout con veredicto contra tolerancia; y planitud con veredicto contra las dos clases de tolerancia H/K."
evidencia_desempeno: "Guía de observación de la lectura de los tres términos del micrómetro (manguito, media vuelta, tambor), de la corrección del error de cero con el signo correcto en el Eje B, y del uso correcto del criterio del trinquete sin inventar una cifra de error."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el micrómetro suma tres términos en vez de buscar una línea coincidente como el vernier, por qué su error de cero se corrige mecánicamente en la realidad (y aquí aritméticamente por comparación pedagógica), para qué sirve el trinquete sin memorizar una cifra, y por qué un comparador de carátula mide diferencias (runout, planitud) en vez de dimensiones absolutas (briefing.ts)."
desarrollo: "Práctica en el simulador: 5 casos (Eje A/Eje B/Trinquete en el micrómetro; Runout/Planitud en el comparador) con lectura de tambor+manguito, corrección de error de cero con signo, cálculo de TIR y de planitud contra dos clases de tolerancia → quiz de opción múltiple con distractores de error de lectura o de criterio real por caso → modo automático guiado como referencia."
cierre: "Ficha técnica (capa 2) con el modelo de lectura de tres términos, la tabla de los 5 casos, el contrato de fidelidad completo (SÍ/NO modela, incluyendo la decisión explícita de no inventar la cifra de error del trinquete) y las normas de referencia (ASME B89.1.13, ISO 3611, ASME B89.1.10M, ISO 463)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "ASME B89.1.13-2013 (R2022) 'Micrometers' — norma ancla de exactitud y diseño de micrómetros."
  - "ISO 3611:2023 — micrómetros para medición externa, equivalente internacional."
  - "ASME B89.1.10M-2001 (R2016/R2021) 'Dial Indicators (for Linear Measurements)' — norma ancla del comparador de carátula."
  - "ISO 463:2006 — diseño y características metrológicas de comparadores de carátula y digitales, equivalente internacional."
  - "ASME Y14.5-2018 / ISO 1101 — contexto conceptual de runout y planitud como controles geométricos normados (GD&T), citadas de forma limitada, no como sistema completo implementado."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial/submodulo/ocupacion_SINCO): la columna 'Norma ancla' de la fila d10-12 en la lista maestra está vacía ('—'); las normas ASME/ISO citadas en esta ficha son investigación propia, no confirmadas contra la lista maestra — verificar contra el documento oficial antes de publicar la trazabilidad."
  - "⚑ La clave SINCO 2641/7541 se reutiliza de mecanica-40/familia D10, pero la metrología dimensional de precisión es, en rigor, un oficio de control de calidad/metrología mecánica — confirmar si existe una clave SINCO más específica antes de publicar la trazabilidad."
  - "⚑ La magnitud del error por saltarse el trinquete NO se modela con una cifra porque no se encontró una fuente verificable y citable que la respalde — decisión de diseño deliberada (ver simulador_NO_modela); si el experto conoce una norma o dato de fabricante confiable, se puede añadir en una revisión futura."
  - "⚑ Los valores de tolerancia de planitud H=0.02 mm / K=0.05 mm son ilustrativos (elegidos para mostrar contraste de veredicto), NO tomados literalmente de una tabla de ISO 2768-2 ni de ninguna otra norma — confirmar si deben reemplazarse por valores reales de tabla antes de escalar el patrón a otras prácticas de tolerancia geométrica."
  - "⚑ Las prácticas d10-11 a d10-14 no aparecen nombradas en ninguna fila T1–T4 de la tabla de tandas de la lista maestra — la decisión de construirlas como sub-tanda discreta se documenta en el encabezado de esta ficha (Rol adicional) y en la ficha de mecanica-40, para confirmación del responsable curricular."
  - "✅ Verificación de implementación (Playwright): COMPLETADA, 0 bugs encontrados — ver nota 3 más abajo para el detalle exacto de lo verificado."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (segunda práctica del sub-clúster de metrología general):**
   d10-12 sube un escalón de resolución respecto a d10-11 (0.05/0.02 mm → 0.01 mm) y añade
   un segundo instrumento con un propósito distinto: el comparador de carátula no mide una
   dimensión absoluta, mide una diferencia relativa (runout, planitud). Igual que
   `mecanica-40`, usa el molde combinado E+P señalado en la lista maestra. Las prácticas
   d10-11 a d10-14 no están nombradas en ninguna fila T1–T4 de la tabla de tandas de
   `docs/LISTA-MAESTRA-200-PRACTICAS.md` (T2 solo cubrió d10-01…d10-10); construirlas como
   sub-tanda discreta para cerrar D10 por completo (14/14) antes de continuar con D5 es la
   misma decisión de secuenciación documentada en la ficha de `mecanica-40` — se reitera
   aquí con transparencia para que el responsable curricular la confirme o la ajuste.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/micrometro-comparador.html](../../../public/labs/micrometro-comparador.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con la fórmula de
   lectura de tres términos, la corrección de error de cero (con la declaración explícita
   de que en la realidad se corrige mecánicamente), la decisión de no inventar la cifra de
   error del trinquete, la distinción émbolo/palanca del comparador, y las fórmulas de TIR
   y planitud — documentado en la sección 2 de la ficha técnica in-app y en el encabezado
   de fidelidad del propio archivo fuente (`micrometro-comparador.body.js`).
3. **Verificación de implementación:** ✅ **Completada**, con resultado limpio (0 bugs
   encontrados). Primero una verificación numérica manual (fuera de la app) de
   `decomposeMic()`, `caseReadingMic()`, `runoutStats()` y `planitudStats()` leyendo el
   código fuente directamente contra los valores esperados de los 5 casos — sin
   discrepancias. Después una verificación funcional automatizada con Playwright contra el
   HTML construido y servido localmente, impulsando la interfaz real (clics de botones, no
   llamadas directas a funciones): Eje A (cierre de husillo, lectura descompuesta 11 mm +
   media + división 48 = 11.98 mm), Eje B (lectura cruda 19.99 mm → corregida 19.97 mm con
   error de cero +0.02 mm), caso conceptual del trinquete (opciones de criterio de uso, sin
   cifra), Runout (recorrido guiado de las 6 lecturas, TIR = 0.05 mm, veredicto RECHAZA
   contra tolerancia 0.02 mm — confirmado en pantalla), Planitud (recorrido guiado de los 5
   puntos, planitud = 0.045 mm, veredicto RECHAZA contra clase H=0.02 mm y ACEPTA contra
   clase K=0.05 mm — ambos veredictos confirmados en pantalla), marcado de respuesta
   correcta/incorrecta del quiz (probado deliberadamente con una respuesta incorrecta para
   confirmar la retroalimentación), y el modo "Medición automática (guiada)". Resultado:
   **0 errores de página, 0 errores de consola, todos los valores numéricos coinciden
   exactamente con la verificación manual**; capturas de pantalla de Eje A y de Planitud
   confirman visualmente que ambos instrumentos 3D renderizan correctamente en la misma
   escena sin artefactos. A diferencia de `mecanica-40` (que sí encontró y corrigió un bug
   real en su primera corrida), esta práctica pasó limpia en el primer intento.
4. **Petición concreta al experto:** (a) confirmar las normas ASME B89.1.13-2013 (R2022),
   ISO 3611:2023, ASME B89.1.10M-2001 (R2016/R2021) e ISO 463:2006 como anclas correctas,
   dado que la columna 'Norma ancla' de la lista maestra para d10-12 está vacía; (b)
   confirmar si existe una clave SINCO más específica para metrología dimensional/control
   de calidad; (c) confirmar si la decisión de NO simular una cifra de error para el
   trinquete (por falta de fuente verificable) es la correcta, o si existe un dato de
   fabricante/norma que se pueda incorporar; (d) confirmar o sugerir valores reales de
   tabla para las clases de tolerancia de planitud H/K, actualmente ilustrativos; (e)
   confirmar la clave exacta del submódulo curricular contra el plan vigente.
