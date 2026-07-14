# Ficha de práctica — Calibrador Vernier: lectura, error de cero y repetibilidad (`mecanica-40`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** primera práctica del sub-clúster de metrología general que cierra el
> dominio D10 (Instrumentación, diagnóstico y metrología) — d10-11 a d10-14 (calibrador
> vernier, micrómetro/comparador, incertidumbre GUM/trazabilidad, termopar/RTD/IR). **Estas
> cuatro prácticas NO aparecen nombradas en ninguna fila T1–T4 de la tabla de tandas de
> `docs/LISTA-MAESTRA-200-PRACTICAS.md`** (T2 solo cubrió d10-01…d10-10): construirlas como
> sub-tanda discreta para cerrar D10 por completo (14/14) antes de continuar con D5 fue una
> decisión de secuenciación tomada en una ventana de trabajo previa, no una instrucción
> explícita de la tabla de tandas — se documenta aquí con transparencia para que el
> responsable curricular la confirme o la ajuste (ver nota 1 más abajo).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-40
sector: mecanica-electronica
practica_maestra: "d10-11 — Mide con calibrador Vernier y estima su incertidumbre (molde E+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "UAX metrología; EM-III — tomado literalmente de la columna 'Trazabilidad' de la fila d10-11 en docs/LISTA-MAESTRA-200-PRACTICAS.md"   # ⚑ la columna 'Norma ancla' de esa misma fila está vacía ('—'); las normas ASME/ISO/GUM citadas abajo provienen de investigación propia, no de la lista maestra — confirmar con el responsable curricular
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Instrumentos de medición dimensional directa — calibrador vernier y verificación de lectura"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de la familia D10 (mecanica-12/24/25/26/27), pensada originalmente para instrumentación ELÉCTRICA; la metrología dimensional (calibrador vernier) es un oficio distinto (control de calidad / metrología mecánica) — confirmar si existe una clave SINCO más específica antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de leer un calibrador vernier localizando la ÚNICA
  línea del nonio que coincide exactamente con una línea de la escala principal, para dos
  resoluciones distintas (LC=0.05 mm con N=20 divisiones, LC=0.02 mm con N=50 divisiones,
  ambas derivadas de LC=1mm/N); corregir la lectura cruda por el error de cero propio del
  instrumento (Lectura corregida = Lectura cruda − Error de cero, respetando el signo, sea
  éste positivo o negativo); reconocer que las mordazas externas, las mordazas internas y la
  varilla de profundidad son tres formas de usar la MISMA mecánica de nonio, no tres
  instrumentos distintos; y comparar, sin descartar ninguna, la dispersión de repetibilidad
  del operador (media, rango, desviación estándar muestral s) de cinco mediciones del mismo
  objeto contra la incertidumbre de resolución del instrumento (±LC/2), entendiendo que
  ambas son fuentes de incertidumbre de orden comparable.
actividad_clave: >
  Resuelve 4 casos con un calibrador vernier de resolución intercambiable (0.05 mm / 0.02 mm):
  un diámetro externo (caña de perno), un diámetro interior (barreno de buje), una profundidad
  de ranura (chavetero) y una repetibilidad de 5 mediciones sobre el mismo buje; en cada caso
  lee el nonio con la lupa, corrige por el error de cero conocido del instrumento (positivo,
  negativo o nulo según el caso) y reporta la lectura corregida; en el caso de repetibilidad,
  calcula media, rango y s, y compáralos contra ±LC/2.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica las partes del calibrador sobre el banco 3D: la escala principal (regla graduada en mm), el cursor del nonio con mordazas externas e internas fijas y móviles, el pulgar de arrastre, el tornillo de fijación, la varilla de profundidad que asoma por la cola de la regla, y la lupa fija que amplía la coincidencia de escalas."
  - "Selecciona la resolución (0.05 mm/N=20 divisiones ó 0.02 mm/N=50 divisiones) y observa en la lupa cómo cambia el espaciado de las líneas del nonio y cuál de ellas coincide exactamente con una línea de la escala principal — esa línea, no ninguna otra, determina la fracción de milímetro de la lectura."
  - "Caso 1 · Mordazas externas (caña de un perno M12, valor real 11.93 mm, sin error de cero): cierra las mordazas, lee la lupa, y confirma que a LC=0.05 mm la lectura cruda cuantizada es 11.950 mm y a LC=0.02 mm es 11.940 mm — dos resoluciones distintas del MISMO objeto dan lecturas ligeramente distintas porque cada una redondea al múltiplo de LC más cercano."
  - "Caso 2 · Mordazas internas (diámetro interior de un buje, valor real 24.17 mm, error de cero +0.04 mm sin cuantizar): identifica en la telemetría el error de cero conocido del instrumento a la resolución seleccionada, y calcula la lectura corregida = lectura cruda − error de cero, verificando que el resultado (≈24.15–24.18 mm según resolución) es MENOR que la lectura cruda porque el error de cero es positivo."
  - "Caso 3 · Varilla de profundidad (ranura de chavetero, valor real 8.36 mm, error de cero −0.03 mm sin cuantizar): repite la corrección con un error de cero NEGATIVO, y confirma que restar un número negativo aumenta la lectura corregida por encima de la cruda — el sentido de la corrección se invierte respecto al Caso 2."
  - "Caso 4 · Repetibilidad (mismo buje, Ø nominal 30.00 mm, 5 mediciones con dispersión fija del operador): usa 'Siguiente lectura' para recorrer las 5 tomas y lee en el informe la media, el rango R y la desviación estándar muestral s; compáralas contra la incertidumbre de resolución ±LC/2 mostrada en el mismo informe, sin asumir de antemano cuál de las dos domina."
  - "En cada caso, responde la pregunta de opción múltiple eligiendo entre la lectura corregida (correcta), la lectura cruda sin corregir, un error de una línea del nonio de más o de menos, y un error de un milímetro de la escala principal de más o de menos — cada distractor corresponde a un error de lectura real y frecuente, no a un valor arbitrario."
  - "Usa 'Medición automática (guiada)' para ver el procedimiento completo narrado paso a paso (cierre de mordazas → lectura cruda → error de cero conocido → lectura corregida) en cualquiera de los 4 casos, como referencia antes o después de resolverlo por cuenta propia."
normatividad:          # 🔒 verificar clave y vigencia
  - "ASME B89.1.14-2018 (R2023) 'Calipers' — norma ancla de exactitud y diseño de calibradores vernier, de carátula y digitales; investigación propia, NO proviene de la columna 'Norma ancla' de la lista maestra (que está vacía para esta fila) — confirmar con el responsable curricular."
  - "ISO 13385-1:2019 — especificación de diseño y verificación metrológica de calibradores (paraleliza/sucede a DIN 862:2015-03)."
  - "JCGM 100:2008 (GUM) — este lab calcula s (incertidumbre Tipo A, repetibilidad) y ±LC/2 (incertidumbre Tipo B, resolución) por separado, pero DEFIERE la combinación formal u_c=√(u_A²+u_B²) a la práctica de incertidumbre GUM (d10-13), que es donde corresponde según la lista maestra."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La relación N divisiones del nonio ↔ (N−1) mm de la escala principal ⇒ LC=1mm/N, para dos resoluciones (0.05 mm/N=20 y 0.02 mm/N=50) — verificada por derivación algebraica directa y confirmada numéricamente: quantize()/decompose() en el código fuente reproducen exactamente estos valores para los 4 casos, en ambas resoluciones."
  - "Corrección por error de cero con signo (positivo en el Caso 2, negativo en el Caso 3, nulo en el Caso 1): Lectura corregida = Lectura cruda − Error de cero — verificada numéricamente con los cuatro casos fijos del simulador (ver nota 3 más abajo para los valores exactos confirmados vía Playwright)."
  - "Mordazas externas, mordazas internas y varilla de profundidad como UNA misma mecánica de nonio: los tres casos comparten el mismo `slider`/`decompose()`, solo cambia qué pieza de trabajo se intercambia en la escena — no son tres modelos matemáticos distintos."
  - "Repetibilidad con 5 lecturas FIJAS (dispersión elegida a mano: −0.03, +0.02, 0.00, +0.05, −0.04 mm; CERO Math.random() en la física, mismo patrón que multimetro.body.js), de las que se calculan media, rango y desviación estándar muestral s real (fórmula s=√(Σ(xᵢ−x̄)²/(n−1))), comparadas explícitamente contra la incertidumbre de resolución ±LC/2 del instrumento en el mismo informe, sin indicar cuál domina."
  - "Lupa con render 2D real de la escala principal y el nonio, resaltando visualmente (color e índice numérico 'i / N') la única línea del nonio que coincide con la escala principal — no es un valor numérico entregado directamente, el estudiante debe leerlo de la representación gráfica."
  - "Generador de opciones de quiz derivado de la física real del caso (lectura corregida correcta; cruda sin corregir; ±1 línea de nonio; ±1 mm de escala principal), con retroalimentación explicativa específica por cada distractor — no son opciones genéricas."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El desgaste de las mordazas ni la fuerza de sujeción variable del operador sobre la pieza."
  - "El error de coseno/paralaje al leer el nonio (el ángulo de visión real que hace que dos observadores lean líneas distintas) — el modelo asume una lectura geométricamente perfecta de la línea que realmente coincide; el paralaje se ENSEÑA como concepto en la teoría (`catalogo.ts`) pero no se simula como fuente de error variable."
  - "El offset de espesor de punta que algunos calibradores reales requieren sumar a la lectura de mordazas internas (para compensar el grosor de las propias puntas del nonio)."
  - "La combinación formal de incertidumbre GUM u_c=√(u_A²+u_B²) — el simulador muestra s (Tipo A) y ±LC/2 (Tipo B) por separado, en el mismo informe, pero NO los combina; esa combinación es el objeto de la práctica de incertidumbre GUM (d10-13)."
  - "Dilatación térmica del instrumento o de la pieza medida, ni deriva/desgaste de calibración del calibrador con el tiempo."
  - "Los valores 'verdaderos' de cada pieza y sus errores de cero son constantes fijas elegidas a mano para que la lección sea clara (igual que multimetro.body.js) — no están anclados a un lote de piezas o instrumento certificado real."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 4 casos: lectura cruda, error de cero (con signo) y lectura corregida para externa/interna/profundidad; y en repetibilidad, las 5 lecturas con media, rango y s comparados contra ±LC/2."
evidencia_desempeno: "Guía de observación de la lectura en la lupa (identificación correcta de la línea del nonio coincidente, a ambas resoluciones) y de la corrección del error de cero con el signo correcto en cada caso, especialmente el Caso 3 (error de cero negativo)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué leer un calibrador vernier exige encontrar UNA línea entre muchas, por qué el error de cero de un instrumento real nunca es exactamente 0.000 mm, y por qué medir 5 veces el mismo objeto revela una dispersión del operador que no significa que el instrumento esté descompuesto (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos (externa/interna/profundidad/repetibilidad) con lectura en lupa, corrección de error de cero con signo, y comparación de repetibilidad (media/rango/s) contra ±LC/2 → quiz de opción múltiple con distractores de error de lectura real por caso → modo automático guiado como referencia."
cierre: "Ficha técnica (capa 2) con el modelo N-divisiones/LC=1mm/N, la tabla de los 4 casos, el contrato de fidelidad completo (SÍ/NO modela) y las normas de referencia (ASME B89.1.14, ISO 13385-1, JCGM 100)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "ASME B89.1.14-2018 (R2023) 'Calipers' — norma ancla de exactitud y diseño de calibradores vernier/de carátula/digitales."
  - "ISO 13385-1:2019 — especificación de diseño y verificación metrológica de calibradores (paraleliza/sucede a DIN 862:2015-03)."
  - "JCGM 100:2008 (GUM) / NMX-CH-140-IMNC-2002 — expresión de la incertidumbre de medida; fuente de la distinción Tipo A (repetibilidad, s) vs Tipo B (resolución, ±LC/2) usada en el Caso 4, y de la combinación formal deferida a d10-13."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial/submodulo/ocupacion_SINCO): la columna 'Norma ancla' de la fila d10-11 en la lista maestra está vacía ('—'); las normas ASME/ISO/GUM citadas en esta ficha son investigación propia, no confirmadas contra la lista maestra — verificar contra el documento oficial antes de publicar la trazabilidad."
  - "⚑ La clave SINCO 2641/7541 (técnicos de equipos eléctricos y electrónicos) se reutiliza de la familia D10 ya construida, pero la metrología dimensional con calibrador vernier es, en rigor, un oficio de control de calidad/metrología mecánica — confirmar si existe una clave SINCO más específica (p. ej. inspectores/verificadores de productos) antes de publicar la trazabilidad."
  - "⚑ Las prácticas d10-11 a d10-14 (calibrador vernier, micrómetro/comparador, incertidumbre GUM, termopar/RTD/IR) no aparecen nombradas en ninguna fila T1–T4 de la tabla de tandas de la lista maestra — la decisión de construirlas como sub-tanda discreta para cerrar D10 por completo antes de D5 se documenta en el encabezado de esta ficha (Rol adicional) para confirmación del responsable curricular."
  - "✅ Verificación de implementación (Playwright) completada: ver nota 3 más abajo, sección 'Notas para el revisor experto', para el detalle de qué se comprobó."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primera práctica del sub-clúster de metrología general):**
   d10-11 abre el cierre del dominio D10 con el instrumento de medición dimensional más
   común de cualquier taller. A diferencia de d10-01 (multímetro, molde P puro), esta
   práctica usa el molde combinado E+P señalado en la lista maestra: un escenario 3D con
   4 casos de trabajo intercambiables (E, "escenario") más un panel de instrumento con
   telemetría y lupa (P, "panel"). Las prácticas d10-11 a d10-14 no están nombradas en
   ninguna fila T1–T4 de la tabla de tandas de `docs/LISTA-MAESTRA-200-PRACTICAS.md` (T2
   solo cubrió d10-01…d10-10); construirlas ahora como sub-tanda discreta, para cerrar D10
   por completo (14/14) antes de continuar con D5 (transformadores, según la fila T4), fue
   una decisión de secuenciación de una ventana de trabajo previa — se documenta aquí con
   transparencia, siguiendo el mismo patrón que mecanica-39/d2-18 usó para su propia
   reconciliación de tandas, para que el responsable curricular la confirme o la ajuste.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/calibrador-vernier.html](../../../public/labs/calibrador-vernier.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con la relación
   N-divisiones/LC=1mm/N, la corrección de error de cero, la unificación de mordazas
   externas/internas/varilla de profundidad en una misma mecánica, y la nota explícita de
   que la combinación GUM formal se difiere a la práctica de incertidumbre, documentado en
   la sección 2 de la ficha técnica in-app y en el encabezado de fidelidad del propio
   archivo fuente (`calibrador-vernier.body.js`).
3. **Verificación de implementación:** ✅ Completada, **20/20 comprobaciones en verde**
   (segunda corrida, tras corregir un bug real encontrado en la primera — ver abajo). Se
   verificó primero, numéricamente, la función `quantize()`/`caseReading()`/`repetStats()`
   mediante un script Node independiente (fuera de la app), confirmando los valores
   exactos de lectura cruda, error de cero y lectura corregida de los 4 casos en ambas
   resoluciones (0.05 mm y 0.02 mm) — en particular que el Caso 2 (error de cero +0.04 mm
   sin cuantizar) da una lectura corregida MENOR que la cruda, y que el Caso 3 (error de
   cero −0.03 mm sin cuantizar) da una lectura corregida MAYOR que la cruda, confirmando
   que el signo de la corrección se aplica correctamente en ambos sentidos. Después se
   ejecutó una verificación automatizada con Playwright contra el HTML construido y
   servido localmente (`calibrador-vernier.html`, puerto 8541), impulsando la interfaz
   real (clics de botones, no una API de depuración `window.__labDebug`, que este lab no
   expone) y leyendo la telemetría/el informe renderizados: estado inicial, lectura
   cruda/error de cero/corrección en los 4 casos a ambas resoluciones, cambio de
   resolución en caliente, el ciclo de 5 lecturas de repetibilidad (`btnRep`), el
   mecanismo de quiz, el modo automático guiado completo (cierre de mordazas → 3 pasos
   narrados → marca de la opción correcta), y ausencia de errores de consola/página.
   **La primera corrida (18/20) encontró un bug real de implementación**, no solo un error
   del script de prueba: en `setRes()`, la línea
   `['005','002'].forEach(k=>el('r_'+k).classList.toggle('on', ('0.'+k)===key))` comparaba
   `'0.'+k` (con `k='005'` → `'0.005'`) contra `key` (`'0.05'`) — nunca coincidían, así que
   **ningún botón de resolución mostraba jamás el estado "activo"**, ni siquiera al cargar
   la página (porque `setRes('0.05')` se invoca en el arranque). Se corrigió a
   `('0.'+k.slice(1))===key`, se reconstruyó el HTML con `build-lab.mjs`, y se añadieron
   dos comprobaciones nuevas al script (estado inicial correcto de ambos botones, y
   verificación tras un clic en caliente) antes de volver a correrlo. El script de
   verificación era temporal (`scripts/_verify-calibrador-vernier.mjs`) y se borró tras
   confirmar el resultado, siguiendo el patrón ya usado en mecanica-36/37/38/39.
4. **Petición concreta al experto:** (a) confirmar las normas ASME B89.1.14-2018 (R2023),
   ISO 13385-1:2019 y JCGM 100:2008 como anclas correctas, dado que la columna 'Norma
   ancla' de la lista maestra para d10-11 está vacía; (b) confirmar si existe una clave
   SINCO más específica para metrología dimensional/control de calidad, distinta de la
   familia eléctrica/electrónica reutilizada de d10-01…d10-08; (c) confirmar la clave
   exacta del submódulo curricular contra el plan vigente; (d) confirmar si la
   secuenciación de d10-11…d10-14 como sub-tanda discreta antes de D5 (descrita en la nota
   1) es la decisión correcta.
