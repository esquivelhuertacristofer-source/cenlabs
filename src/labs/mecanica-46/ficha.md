# Ficha de práctica — Grupo Vectorial: Bancos Trifásicos y Desfase Angular (`mecanica-46`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** tercera práctica del dominio D5 (Transformadores) — d5-03 de 16.
> Es una práctica de **molde S** (esquemático + simulación numérica, sin panel de
> instrumentos): el elemento central es el pizarrón interactivo (diagrama de devanados +
> diagrama de reloj de fases) combinado con un banco 3D de tres unidades monofásicas cuyo
> amarre físico se reconstruye en vivo según la topología elegida. A diferencia de d5-01/
> d5-02 (que ensayan UNA unidad de control de 500 VA), esta práctica arma un BANCO de tres
> unidades idénticas — el objeto de estudio pasa de "cómo se comporta un transformador" a
> "cómo se combinan tres transformadores para formar un sistema trifásico".

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-46
sector: mecanica-electronica
practica_maestra: "d5-03 — Conecta bancos trifásicos y grupos vectoriales (molde S) — tomado literalmente de la fila d5-03 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-V — tomado literalmente de la columna 'Asignatura(s)' de la fila d5-03 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEC 60076-1 — tomado literalmente de la columna 'Norma ancla' de la fila d5-03; a diferencia de d5-02 (que solo citaba 'IEC 60076' sin la parte), aquí la lista maestra ya especifica la Parte 1. La cláusula específica (3.10.6, con su Nota 2 sobre la convención de reloj, y 7.1.5) es investigación propia de esta sesión sobre el texto primario, no una cita textual de la tabla."
modulo: "Transformadores (D5)"
submodulo: "Bancos trifásicos: conexión Y/D y grupo vectorial (desfase angular por convención de reloj)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de d5-01/d5-02/D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de conexión de bancos/subestaciones antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de armar, con tres transformadores monofásicos
  idénticos, un banco trifásico en cualquiera de sus 8 combinaciones posibles (topología
  Y o D del primario × topología Y o D del secundario × polaridad de referencia normal o
  invertida del primario); calcular en cada caso el ángulo de referencia que aporta cada
  topología (θ_ref=0° en estrella, 30° en delta) y el giro de 180° que introduce invertir
  la polaridad; obtener el desfase angular resultante y su hora de reloj según la
  convención de IEC 60076-1 (Cláusula 3.10.6, Nota 2: el fasor de alta tensión se fija a
  las 12, el de baja tensión se lee en la hora a la que atrasa); y nombrar correctamente
  el grupo vectorial resultante (p. ej. Dyn11, Yyn0, Yd1), reconociendo su importancia
  como dato de placa junto con la relación de transformación (Cláusula 7.1.5) y como
  condición necesaria para poner dos bancos en paralelo.
actividad_clave: >
  Explora un banco trifásico de tres unidades monofásicas idénticas, cada una con sus
  cuatro terminales propios (H1, H2 de alta tensión; X1, X2 de baja tensión), a través de
  cuatro modos sobre la misma escena 3D persistente: Explora (reconocimiento del banco),
  Conexión Y/D (cambia la topología de cada lado y observa el re-amarre físico de los
  puentes), Fasor (invierte la polaridad de referencia y sigue el diagrama de reloj que
  calcula el grupo vectorial resultante en tiempo real para cualquiera de las 8
  combinaciones) y Reto (con una combinación dada y oculta, predice el desfase en grados
  y la hora del reloj antes de revelar el grupo vectorial, con tolerancia de ±0.5° en el
  desfase y coincidencia exacta en la hora redondeada). Cada modo incluye una pregunta de
  opción múltiple con distractores derivados de errores conceptuales reales.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica las tres unidades monofásicas del banco (letras A, B, C) y sus cuatro terminales cada una (H1, H2 de alta tensión, bujes rojos; X1, X2 de baja tensión, bujes azules), más los postes de línea de alta y baja tensión y los postes de neutro (visibles solo cuando el lado correspondiente está en estrella)."
  - "Modo Conexión Y/D: alterna la topología del primario y del secundario entre estrella y delta, y observa cómo cambian los puentes/jumpers del banco — en estrella, los tres finales de devanado (H2 o X2) se unen a un neutro común y los inicios (H1 o X1) salen como las 3 líneas; en delta, el final de un devanado se une al inicio del siguiente formando un anillo cerrado, sin neutro accesible."
  - "Modo Fasor: invierte la polaridad de referencia del primario (H1↔H2) y observa que el fasor de alta tensión gira 180° en el diagrama de reloj — el fasor de alta tensión siempre se dibuja fijo a las 12; el de baja tensión se mueve según θ1=θ_ref(primario)+180°·(polaridad invertida), ángulo_salida=θ1−θ_ref(secundario), desfase=((−ángulo_salida) mod 360), hora=redondeo(desfase/30°) mod 12."
  - "Verifica las 8 combinaciones posibles del banco: Y-Y normal→Yyn0 (0°), Y-Y invertida→Yyn6 (180°), Y-D normal→Yd1 (30°), Y-D invertida→Yd7 (210°), D-Y normal→Dyn11 (330°, equivalente a −30°), D-Y invertida→Dyn5 (150°), D-D normal→Dd0 (0°), D-D invertida→Dd6 (180°) — recomputadas y confirmadas con `node -e` contra el código fuente de `grupo-vectorial-transformador.body.js` antes de cerrar esta ficha."
  - "Modo Reto: con una combinación elegida al azar por el simulador (topología y polaridad ocultas hasta resolver), calcula θ1, el ángulo de salida, el desfase en grados y la hora del reloj, y verifica tu predicción con tolerancia de ±0.5° en el desfase y coincidencia exacta en la hora redondeada."
  - "En cada uno de los 4 modos, responde la pregunta de opción múltiple eligiendo entre la conclusión correcta y distractores derivados de errores conceptuales reales (confundir Dyn11 con Dyn1, olvidar el factor de 8 combinaciones y contar solo 4, confundir qué topología aporta el neutro accesible, o suponer que el grupo vectorial no importa para operar en paralelo)."
  - "Usa 'Recorrido guiado (automático)' para ver la secuencia completa de los 4 modos narrada paso a paso, incluyendo un cambio de polaridad y una nueva conexión de reto, como referencia antes o después de resolverlo por cuenta propia."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60076-1:2011 Ed.3.0 'Power transformers — Part 1: General' — norma ancla explícita de la fila d5-03 en la lista maestra; Cláusula 3.10.6 (definición de desfase angular) y su Nota 2 (convención de reloj: el fasor de AT se fija a las 12, el de BT se lee en la hora a la que atrasa, 1 hora=30°) — confirmado contra el texto primario que Dyn11 significa que BT atrasa a AT 330° (equivalente a adelantar 30°), NO 'BT atrasa 30°' (ese es el grupo distinto Dyn1); Cláusula 7.1.5 (el grupo vectorial como dato que debe declararse junto con la relación de transformación)."
  - "ANSI/IEEE C57.12.00 — norma de referencia estadounidense para transformadores de distribución y potencia; a diferencia de IEC, la práctica ANSI/IEEE típicamente expresa el desfase solo en grados, sin la convención de reloj de 12 posiciones usada por IEC — citada aquí como contraste normativo, no como fuente de una cláusula específica verificada en esta sesión."
  - "CFE K0000-04 — Especificación de transformadores de distribución y potencia (práctica mexicana, convención de terminales H1/H2-X1/X2 usada en este lab, misma convención que d5-01/d5-02)."
  - "⚑ No se verificó en esta sesión una cláusula IEC específica que exija la designación de líneas del banco con mayúsculas (A,B,C en AT) y minúsculas (a,b,c en BT) usada en el pizarrón del simulador — es práctica de libro de texto ampliamente extendida, pendiente de confirmación contra el texto normativo primario."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Las 8 combinaciones posibles de este banco (Y/D en cada lado × polaridad normal/invertida de AT) y su grupo vectorial exacto, calculado en tiempo real por computeGroup() — verificado por recomputación exacta con `node -e` de las mismas fórmulas contra el código fuente de grupo-vectorial-transformador.body.js: Y-Y-normal→Yyn0 (lag=0°, hora=0); Y-Y-invertida→Yyn6 (lag=180°, hora=6); Y-D-normal→Yd1 (lag=30°, hora=1); Y-D-invertida→Yd7 (lag=210°, hora=7); D-Y-normal→Dyn11 (lag=330°, hora=11); D-Y-invertida→Dyn5 (lag=150°, hora=5); D-D-normal→Dd0 (lag=0°, hora=0); D-D-invertida→Dd6 (lag=180°, hora=6) — las 8 etiquetas son distintas entre sí, confirmado con un Set de tamaño 8 sobre las 8 salidas."
  - "El ángulo de referencia que aporta cada topología (θ_ref=0° en estrella, por coincidencia de fase entre tensión de línea y de fase; θ_ref=30° en delta, por el corrimiento entre ambas) y el giro de 180° que produce invertir la polaridad de referencia de AT — calculado con θ1=θ_ref(primario)+180°·(polaridad invertida), ángulo_salida=θ1−θ_ref(secundario), desfase=((−ángulo_salida) mod 360)°, hora=redondeo(desfase/30°) mod 12."
  - "La familia de paralelismo resultante (grupos de hora par —0°/180°, propios de combinaciones Y-Y o D-D— vs. hora impar —±30°, propios de combinaciones Y-D o D-Y—), que es la condición necesaria (no suficiente) de compatibilidad angular entre bancos que se desean poner en paralelo."
  - "El re-amarre físico del banco 3D (puentes/jumpers entre las tres unidades) cuando cambia la topología Y/D de cualquiera de los dos lados — la geometría de estrella (finales unidos a un neutro común) y de delta (anillo cerrado entre finales e inicios consecutivos) se reconstruye en vivo con `rebuildWiring3D()`."
  - "Un pizarrón interactivo (canvas 2D sobre panel 3D) con el diagrama de ambos devanados (marcando el terminal de referencia con un punto) y el diagrama de reloj de fases (manecilla de AT fija a las 12, manecilla de BT en la hora calculada), con cada zona identificable al tocarla."
  - "Un modo Reto que oculta el resultado (desfase y grupo) de una combinación elegida al azar por el simulador (aleatoriedad de UI, no de física — la topología y polaridad quedan fijas una vez elegidas) y exige la predicción manual del estudiante, verificada con tolerancia de ±0.5° en el desfase y coincidencia exacta en la hora redondeada."
  - "Generador de opciones de quiz derivado de errores conceptuales reales por modo (confundir Dyn11 con Dyn1, contar solo 4 combinaciones en vez de 8, confundir qué topología aporta neutro accesible, subestimar la importancia del grupo vectorial para operar en paralelo), con retroalimentación explicativa específica por distractor."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El recableado físico del banco al invertir la polaridad de AT — se trata deliberadamente como un cambio de referencia (qué extremo del devanado se llama H1), no como una operación de campo: el mismo devanado sigue conectado igual, así que el amarre 3D del banco (jumpers) solo se reconstruye cuando cambia la topología Y/D de un lado, nunca por el toggle de polaridad, que únicamente mueve la marca de polaridad y recalcula el fasor. Esta simplificación se declara explícitamente en el contrato de fidelidad del propio simulador (panel HUD)."
  - "La prueba de polaridad de campo (kick test / golpe inductivo) que en un banco real determina cuál terminal es H1 en cada unidad antes de integrarla — aquí la polaridad de cada unidad se toma como un dato ya conocido y correcto, seleccionable directamente por el estudiante."
  - "La verificación de secuencia de fases (ABC vs. ACB) del sistema de alimentación antes de energizar el banco — el modelo asume una secuencia de fases fija y correcta, no la varía ni la pone a prueba."
  - "La prueba de compatibilidad de paralelo entre DOS bancos distintos (comparar grupo vectorial, relación de transformación y secuencia de fases de un banco contra otro antes de cerrar un interruptor de paralelo) — este lab calcula el grupo vectorial de UN banco, no compara dos bancos entre sí ni modela el procedimiento de sincronización."
  - "Impedancias, corrientes de excitación ni el detalle interno de cada unidad monofásica (circuito equivalente, pérdidas) — ver la práctica hermana d5-02, que sí los modela para una unidad individual."
  - "Instrumentación de medición de fase en campo (fasímetro, osciloscopio de dos canales) — el grupo vectorial se calcula y se muestra directamente en el simulador, sin modelar el procedimiento de medición física para determinarlo (p. ej. el método de las tres lámparas)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de las 8 combinaciones posibles del banco con su grupo vectorial, desfase en grados y hora de reloj correspondientes, más la predicción resuelta del modo Reto."
evidencia_desempeno: "Guía de observación de la identificación correcta de la topología Y/D en cada lado, del efecto de la polaridad de AT sobre el fasor de referencia, del cálculo correcto de θ1/ángulo de salida/desfase/hora en el modo Reto, y de la justificación de cada respuesta del quiz con el criterio o fórmula correspondiente."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el grupo vectorial de un banco trifásico es tan importante como su relación de transformación, y qué significa realmente un rótulo como Dyn11 (briefing.ts)."
desarrollo: "Práctica en el simulador: Explora (reconocimiento del banco) → Conexión Y/D (topología de cada lado y re-amarre físico) → Fasor (polaridad de referencia y diagrama de reloj para las 8 combinaciones) → Reto (predicción de desfase y hora con combinación oculta) → quiz de opción múltiple con distractores de error conceptual real por modo → recorrido guiado automático como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de las 8 combinaciones posibles y su grupo vectorial, el contrato de fidelidad completo (SÍ/NO modela, incluyendo la aclaración explícita de que la polaridad no recablea físicamente el banco) y las normas de referencia (IEC 60076-1, ANSI/IEEE C57.12.00, CFE K0000-04)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "IEC 60076-1:2011 Ed.3.0 — norma ancla de la Cláusula 3.10.6 (desfase angular, convención de reloj) y 7.1.5 (grupo vectorial como dato de placa), confirmada explícitamente por la columna 'Norma ancla' de la fila d5-03 en la lista maestra, y verificada contra el texto primario del estándar (misma fuente pdftotext ya usada para corregir la cita de d5-02)."
  - "ANSI/IEEE C57.12.00 — norma de contraste sobre la convención de expresión del desfase (solo en grados, sin reloj de 12 posiciones); no se verificó una cláusula específica de esta norma en esta sesión."
  - "CFE K0000-04 — convención de terminales H1/H2-X1/X2 de práctica mexicana, misma convención que d5-01/d5-02."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de d5-01/d5-02/D2/D10 — confirmar si existe una clave SINCO más específica de conexión de bancos trifásicos/subestaciones antes de publicar la trazabilidad."
  - "⚑ La designación de líneas del banco con mayúsculas (A,B,C en AT) y minúsculas (a,b,c en BT), usada en el pizarrón del simulador, es práctica de libro de texto ampliamente extendida — no se verificó una cláusula IEC específica que la exija en esta sesión; confirmar con el experto antes de presentarla como convención normativa (en el lab se presenta como convención de dibujo, no como cita de norma)."
  - "⚑ Las afirmaciones —mencionadas solo en la ficha in-app (§6 de _ficha-grupo-vectorial-transformador.js), NUNCA en el texto del simulador— de que la conexión delta 'ofrece mejor camino a corrientes armónicas de tercer orden/circulantes' o que 'Dyn11 es el grupo por defecto en la práctica europea de distribución' son argumentos de ingeniería ampliamente citados en la literatura de transformadores, pero no se verificaron contra una cláusula normativa específica ni contra una cifra comparativa (p. ej. un factor '10×' de corriente circulante) con fuente primaria en esta sesión — quedan marcadas como contexto cualitativo, no como dato de placa verificado."
  - "⚑ Decisión de diseño pedagógico: el simulador no recablea físicamente el banco 3D al invertir la polaridad de AT (solo mueve la marca de polaridad y recalcula el fasor) — se considera una simplificación honesta porque invertir la polaridad es, en la realidad, un cambio de qué terminal se llama 'H1', no una operación de campo distinta; confirmar con el experto si esta simplificación podría inducir la idea errónea de que la polaridad 'no afecta nada físico' en un banco real, y si conviene reforzar la aclaración en el texto del simulador."
  - "✅ Verificación de implementación: completa a nivel de física — recomputación con `node -e` de `computeGroup()` (reimplementación exacta de las fórmulas del código fuente) para las 8 combinaciones, con acuerdo total contra los valores documentados arriba y confirmación de que las 8 etiquetas resultantes son todas distintas entre sí. Pendiente en el momento de escribir esta ficha: corrida completa de Jest tras `npm run gen:labs` y verificación funcional con Playwright contra el HTML construido y servido localmente — ver sección de notas abajo para el estado exacto en el momento del commit."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (tercera práctica de D5):** d5-03 desplaza el foco de D5 de
   "cómo se comporta UN transformador" (d5-01, d5-02) a "cómo se combinan TRES
   transformadores para formar un sistema trifásico". La decisión de diseño más
   importante es que las 8 combinaciones posibles (2 topologías × 2 topologías × 2
   polaridades) se calculan siempre en vivo con `computeGroup()` — nunca se muestra una
   tabla de grupos vectoriales memorizada o codificada a mano en el simulador — y que la
   polaridad se modela explícitamente como un cambio de referencia, no como un
   recableado físico, con esa simplificación declarada tanto en el HUD del simulador
   como en el contrato de fidelidad de esta ficha.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/grupo-vectorial-transformador.html](../../../public/labs/grupo-vectorial-transformador.html))
   muestra el panel "🔒 Contrato de fidelidad" con la fórmula del desfase angular y la
   declaración explícita de que la polaridad no recablea el banco 3D — documentado en la
   sección 5 de la ficha técnica in-app
   ([_ficha-grupo-vectorial-transformador.js](../../../public/labs/_ficha-grupo-vectorial-transformador.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`grupo-vectorial-transformador.body.js`).
3. **Verificación de implementación:** ✅ Física verificada por recomputación ejecutada
   con `node -e` (no a mano) de `computeGroup()` para las 8 combinaciones posibles,
   reimplementando las fórmulas del código fuente y confirmando acuerdo exacto y las 8
   etiquetas distintas entre sí. Pendiente al momento de escribir esta ficha: corrida
   completa de Jest tras `npm run gen:labs` (snapshots dorados actualizados a mano en los
   puntos de inserción exactos, nunca con `jest -u`) y verificación funcional con
   Playwright contra el HTML construido y servido localmente (los 4 modos, el modo Reto,
   y el recorrido guiado automático, 0 errores de consola/página esperados) — completar
   antes del commit final y actualizar esta nota con el resultado exacto.
4. **Petición concreta al experto:** (a) confirmar si existe una cláusula IEC específica
   para la convención de mayúsculas/minúsculas en la designación de líneas del banco
   (A,B,C en AT vs. a,b,c en BT); (b) confirmar o refutar las afirmaciones cualitativas
   sobre camino armónico de la delta y sobre Dyn11 como grupo por defecto europeo, y si
   conviene citar una fuente primaria específica para ellas en vez de dejarlas como
   contexto general; (c) confirmar si la simplificación de no recablear físicamente el
   banco 3D al invertir la polaridad es pedagógicamente aceptable o si conviene reforzar
   la aclaración en el texto visible del simulador (no solo en la ficha técnica); (d)
   confirmar si el programa oficial (ELE-V) espera también cubrir la prueba de
   compatibilidad de paralelo entre dos bancos distintos, que este lab explícitamente NO
   modela; (e) confirmar si existe una clave SINCO más específica que la reutilizada de
   la familia D2/D10/d5-01/d5-02.
