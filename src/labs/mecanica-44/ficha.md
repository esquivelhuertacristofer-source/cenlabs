# Ficha de práctica — Relación de Transformación y Prueba de Polaridad (`mecanica-44`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** primera práctica del dominio D5 (Transformadores) — d5-01 de 16. Abre
> el dominio inmediatamente después de cerrar D2 (electrónica analógica/potencia, 18/18) y
> D10 (instrumentación/metrología, 14/14). Es una práctica de **molde E+P** (ensamble/servicio
> 3D + panel de instrumentos virtual): el objeto físico central (el transformador bajo prueba
> con sus 4 terminales) es inspeccionable como en las prácticas de metrología previas, y los
> dos voltímetros analógicos son el panel de instrumentos que se lee para tomar la decisión de
> ingeniería. Su pareja de dominio, d5-02 (circuito equivalente por ensayos de vacío y
> cortocircuito), reutiliza el mismo transformador de 500 VA / 220-24 V como unidad de ejemplo.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-44
sector: mecanica-electronica
practica_maestra: "d5-01 — Determina la relación y polaridad de un transformador (molde E+P) — tomado literalmente de la fila d5-01 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II; EM-I — tomado literalmente de la columna 'Asignatura(s)' de la fila d5-01 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEC 60076 — tomado literalmente de la columna 'Norma ancla' de la fila d5-01; la lista maestra cita solo la familia de norma sin cláusula, por lo que la cláusula específica (10, Tabla 1, ítem 2 para tolerancia de relación; 11.3 para el método de medición) es investigación propia de esta sesión, no una cita textual de la tabla."
modulo: "Transformadores (D5)"
submodulo: "Pruebas de aceptación de transformadores monofásicos: relación de transformación y polaridad"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de la familia D2/D10 (mismo perfil ocupacional general de electricidad/electrónica); confirmar si existe una clave SINCO más específica de pruebas de transformadores/subestaciones antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de aplicar tensión reducida al devanado de alta
  tensión de un transformador monofásico y medir la tensión inducida en el devanado de baja
  para calcular la relación de transformación a=N1/N2=V1/V2; comparar la relación medida
  contra la relación de placa con el criterio de tolerancia de ±0.5% (IEC 60076-1, Cláusula
  10, Tabla 1, ítem 2) y decidir si el devanado está sano o tiene una falla interna; ejecutar
  el procedimiento normativo de 4 terminales de la prueba de polaridad (puente H1-X1, tensión
  reducida en H1-H2, lectura en H2-X2) y clasificar la polaridad como aditiva o sustractiva a
  partir de la fórmula V=Vap·(1∓N_BT/N_AT); y contrastar el resultado medido contra la regla
  de clasificación de fábrica de ANSI/IEEE C57.12.00 (Cláusula 5.7.1: kVA≤200 y AT≤8660V ⇒
  aditiva; en cualquier otro caso, sustractiva).
actividad_clave: >
  Resuelve 4 casos sobre una misma escena 3D persistente (banco de tensión reducida con
  variac, transformador de 4 terminales y dos voltímetros analógicos): dos casos de relación
  de transformación sobre la misma unidad de control 500 VA (220/24 V) — uno sano y uno con
  una falla simulada que excede la tolerancia — y dos casos de polaridad sobre unidades
  distintas que caen en cada lado de la regla de clasificación de fábrica de ANSI/IEEE
  C57.12.00 (una de 150 VA/240-24 V con polaridad aditiva, una de 300 kVA/13200-240 V con
  polaridad sustractiva). Cada caso se resuelve con una pregunta de opción múltiple con
  distractores derivados de errores conceptuales reales.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los cuatro terminales del transformador bajo prueba (H1, H2 en el frente, alta tensión, bujes rojos; X1, X2 atrás, baja tensión, bujes azules), la placa de datos y el puente de polaridad (visible solo en los casos de polaridad, conectando H1-X1)."
  - "Caso 1 · Relación (sana): con el transformador de control de 500 VA (220/24 V, a nominal=9.1667), aplica 110 V al lado de alta y lee 11.98 V en el lado de baja; calcula a_medida≈9.18197 y la desviación≈0.167%, dentro de la tolerancia de ±0.5% ⇒ devanado sano."
  - "Caso 2 · Relación (con falla): misma unidad y misma tensión aplicada (110 V), pero la lectura de baja es 11.50 V; calcula a_medida≈9.56522 y la desviación≈4.348%, muy por encima de ±0.5% ⇒ falla de devanado (probable cortocircuito entre espiras)."
  - "Caso 3 · Polaridad aditiva: con un transformador de control de 150 VA (240/24 V, a nominal=10), instala el puente H1-X1, aplica 24 V entre H1-H2 y lee 26.4 V exactos entre H2-X2 (V=24·(1+1/10)); la lectura es mayor que la aplicada ⇒ polaridad aditiva, consistente con la regla de fábrica (150 kVA... realmente VA, y 240 V de AT ⇒ ambos criterios de ANSI/IEEE C57.12.00 Cl.5.7.1 se cumplen)."
  - "Caso 4 · Polaridad sustractiva: con un transformador de distribución de 300 kVA (13200/240 V, a nominal=55), instala el puente H1-X1, aplica 55 V entre H1-H2 y lee 54.0 V exactos entre H2-X2 (V=55·(1−1/55)); la lectura es menor que la aplicada ⇒ polaridad sustractiva, consistente con la regla de fábrica (kVA>200 ⇒ sustractiva sin importar la tensión de AT)."
  - "En cada uno de los 4 casos, responde la pregunta de opción múltiple eligiendo entre la conclusión correcta y distractores derivados de errores conceptuales reales (invertir el criterio de tolerancia, confundir aditiva con sustractiva, aplicar la fórmula de polaridad con el signo equivocado, asumir que la polaridad se puede leer de la disposición física de las terminales sin medir)."
  - "Usa 'Medición automática (guiada)' para ver la secuencia completa de cada caso narrada paso a paso (instalar/verificar puente, energizar, leer, calcular) como referencia antes o después de resolverlo por cuenta propia."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60076-1 'Power transformers — Part 1: General' — norma ancla explícita de la fila d5-01 en la lista maestra; Cláusula 10 (Tabla 1, ítem 2: tolerancia de ±0.5% en relación de transformación) y Cláusula 11.3 (método de medición de la relación de tensión)."
  - "ANSI/IEEE C57.12.00 'General Requirements for Liquid-Immersed Distribution, Power, and Regulating Transformers' — Cláusula 5.7.1 (clasificación de polaridad de fábrica por kVA y tensión de AT: ≤200 kVA y ≤8660 V ⇒ aditiva; el resto, sustractiva). No citada en la columna 'Norma ancla' de la lista maestra, pero es la norma que define el procedimiento y la regla de clasificación de polaridad — sin ella, 'polaridad' quedaría sin método verificable."
  - "CFE K0000-04 — Especificación de transformadores de distribución y potencia (práctica mexicana, convención de terminales H1/H2-X1/X2 usada en este lab)."
  - "NMX-J-116-ANCE / NMX-J-169-ANCE — normas mexicanas de transformadores de distribución y potencia; ANCE las declara NO equivalentes directas a IEC ni a ANSI/IEEE, dato citado explícitamente en la ficha in-app para no sobre-afirmar equivalencia normativa."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "El cálculo real de la relación de transformación medida y su desviación porcentual contra la placa (aMeasured, devPct), calculado en tiempo real por la función ratioStats() a partir de constantes de caso (tensión aplicada, lectura de baja), nunca transcrito a mano — verificado por cálculo manual antes de escribir el código: caso sano a≈9.18197 (dev≈0.167%, PASA), caso falla a≈9.56522 (dev≈4.348%, FALLA)."
  - "El criterio de tolerancia de ±0.5% de IEC 60076-1 Cláusula 10, Tabla 1, ítem 2, aplicado como umbral de PASA/FALLA sobre la desviación calculada."
  - "El procedimiento normativo de 4 terminales de la prueba de polaridad (puente H1-X1, tensión reducida en H1-H2, lectura en H2-X2) con su fórmula V=Vap·(1∓N_BT/N_AT), calculada en tiempo real por polarityVoltage()/polarityStats() — verificado manualmente: caso aditivo V=26.4 V exactos, caso sustractivo V=54.0 V exactos."
  - "La regla de clasificación de fábrica de ANSI/IEEE C57.12.00 Cláusula 5.7.1 (kVA≤200 y AT≤8660V ⇒ aditiva; el resto, sustractiva), verificada con dos unidades de ejemplo que caen en cada lado de la regla (150 VA/240 V ⇒ aditiva; 300 kVA/13200 V ⇒ sustractiva)."
  - "Dos voltímetros analógicos (tensión aplicada, tensión medida) con aguja y lectura digital que responden al valor calculado, con escala de despliegue ajustada por caso (campo cosmético scaleAp/scaleMeas, no una afirmación de física)."
  - "Generador de opciones de quiz derivado de errores conceptuales reales (criterio de tolerancia invertido, aditiva/sustractiva confundidas, signo de la fórmula de polaridad invertido, asumir que la polaridad se lee de la geometría física sin medir), con retroalimentación explicativa específica por distractor, referenciando los valores numéricos ya calculados del caso activo."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "El criterio alterno de tolerancia de IEC 60076-1 basado en ±1/10 de la impedancia de cortocircuito real — requiere %Z, calculado en la práctica hermana de esta misma serie (d5-02, circuito equivalente por ensayos de vacío y cortocircuito)."
  - "La disposición física real de las terminales H1/X1 en la carcasa del transformador — deliberadamente: la polaridad se determina aquí solo por la comparación de tensiones, exactamente como exige el procedimiento normativo de 4 terminales, sin asumir ninguna convención de geometría de bujes no verificada entre fabricantes."
  - "El núcleo y los devanados internos del transformador — el tanque se representa cerrado, como en una unidad real de servicio; el arrollamiento de cobre y el núcleo laminado no son geometría independiente modelada."
  - "Los elementos de seguridad de un banco real (guantes dieléctricos, tapete aislante, procedimiento de bloqueo/etiquetado LOTO, verificación de ausencia de tensión antes de manipular el puente) — el lab asume un entorno de práctica ya asegurado."
  - "La clase de exactitud del instrumento — los voltímetros analógicos se dibujan con una aguja que responde exactamente al valor calculado, sin el error de lectura, histéresis o clase de exactitud (p. ej. ±1.5%) de un instrumento real."
  - "Un porcentaje normativo fijo de 'tensión reducida' de prueba — la elección de cada Vap por caso es pedagógica (visibilidad de escala, seguridad didáctica), no una cifra impuesta por una norma."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 4 casos con sus valores numéricos (relación medida y desviación %, o tensión medida y polaridad detectada) y el veredicto correcto (PASA/FALLA o aditiva/sustractiva) para cada uno."
evidencia_desempeno: "Guía de observación de la ejecución correcta del procedimiento de 4 terminales (instalación del puente solo en los casos de polaridad, lectura de ambos voltímetros, cálculo correcto) y de la justificación de cada respuesta del quiz con el criterio normativo correspondiente (tolerancia ±0.5% o regla de clasificación de fábrica)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la relación de transformación y la polaridad son dos preguntas de ingeniería distintas e independientes, qué tolerancia aplica a cada una, y por qué la polaridad se determina siempre por comparación de tensiones y nunca por inspección visual de las terminales (briefing.ts)."
desarrollo: "Práctica en el simulador: 2 casos de relación de transformación (sano y con falla) sobre la misma unidad de control, y 2 casos de polaridad (aditiva y sustractiva) sobre unidades que caen en cada lado de la regla de fábrica de ANSI/IEEE C57.12.00 → quiz de opción múltiple con distractores de error conceptual real por caso → modo automático guiado como referencia."
cierre: "Ficha técnica (capa 2) con la tabla de las 4 unidades de ejemplo, el contrato de fidelidad completo (SÍ/NO modela, incluyendo la aclaración explícita sobre no modelar la geometría física H1/X1) y las normas de referencia (IEC 60076-1, ANSI/IEEE C57.12.00, CFE K0000-04, NMX-J-116/169-ANCE con su no-equivalencia declarada)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "IEC 60076-1 — norma ancla del criterio de tolerancia de relación de transformación, confirmada explícitamente por la columna 'Norma ancla' de la fila d5-01 en la lista maestra."
  - "ANSI/IEEE C57.12.00, Cláusula 5.7.1 — procedimiento y regla de clasificación de polaridad; no citada en la lista maestra pero indispensable para el método de la segunda mitad de la práctica."
  - "CFE K0000-04 — convención de terminales H1/H2-X1/X2 de práctica mexicana."
  - "NMX-J-116-ANCE / NMX-J-169-ANCE — normas mexicanas, declaradas NO equivalentes directas a IEC/ANSI por ANCE."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de la familia D2/D10 — confirmar si existe una clave SINCO más específica de pruebas de transformadores/subestaciones antes de publicar la trazabilidad."
  - "⚑ Las 4 unidades de ejemplo (control 500 VA, control 150 VA, distribución 300 kVA) y sus lecturas asociadas son constantes ilustrativas elegidas a mano para que cada caso caiga con margen claro a un lado del criterio de decisión (tolerancia o regla de clasificación) — no provienen de una hoja de datos de fabricante específico; confirmar si conviene anclarlas a un caso de placa real antes de escalar el patrón a otras prácticas de D5."
  - "⚑ No se citaron años de edición específicos de IEC 60076-1 ni de ANSI/IEEE C57.12.00 en el HUD ni en la ficha in-app, porque la edición vigente exacta no se confirmó con alta confianza en la investigación de esta sesión — se citan solo cláusula/sección; confirmar la edición vigente antes de publicar la trazabilidad con año."
  - "⚑ Se decidió deliberadamente NO citar IEC 60076-1 Cláusula 8.2(k) (símbolo de conexión en placa) porque esa cláusula es más aplicable a transformadores polifásicos (símbolos tipo Dyn11) que a las unidades monofásicas modeladas aquí — decisión de precisión documentada para que el revisor confirme si es correcta."
  - "✅ Verificación de implementación: completa — recomputación manual de ratioStats()/polarityStats() (acuerdo exacto con el código fuente), Jest completo tras `npm run gen:labs` (799/799 pruebas, 12/12 snapshots), y verificación funcional con Playwright contra el HTML construido y servido localmente (los 4 casos, el ciclo de quiz, y el modo 'Medición automática (guiada)', 0 errores de consola/página). Ver sección de notas abajo para el detalle numérico."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primera práctica de D5):** d5-01 abre el dominio de
   Transformadores con una práctica de molde E+P que reutiliza el patrón de instrumento
   físico inspeccionable de d10-11/d10-12 (vernier, micrómetro), pero con un transformador de
   4 terminales como objeto central en vez de un calibrador. La decisión de diseño más
   importante de esta práctica es **no modelar la geometría física H1/X1** — la polaridad se
   determina exclusivamente por la comparación de tensiones del procedimiento normativo,
   evitando afirmar una convención de disposición de bujes que no es universal entre
   fabricantes y que la prueba real nunca necesita para ser válida.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/relacion-polaridad-transformador.html](../../../public/labs/relacion-polaridad-transformador.html))
   muestra el panel "🔒 Contrato de fidelidad" con la fórmula de relación de transformación,
   la fórmula de polaridad, y la declaración explícita de que la disposición física de H1/X1
   no se modela — documentado en la sección 2 de la ficha técnica in-app
   ([_ficha-relacion-polaridad-transformador.js](../../../public/labs/_ficha-relacion-polaridad-transformador.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`relacion-polaridad-transformador.body.js`).
3. **Verificación de implementación:** ✅ **Verificado.** Recomputación numérica manual de
   `ratioStats()`/`polarityStats()` (script Node independiente, reimplementado desde el
   entendimiento documentado de las fórmulas, no copiado del código fuente) contra los
   valores esperados: caso sano a=9.181969949916526 (dev=0.16690848384993134%, PASA), caso
   falla a=9.565217391304348 (dev=4.347788142306288%, FALLA), caso aditivo V=26.4 V exactos,
   caso sustractivo V=54.0 V exactos — acuerdo exacto con las funciones reales del código
   fuente (`relacion-polaridad-transformador.body.js`). Corrida completa de Jest tras
   `npm run gen:labs`: 799/799 pruebas y 12/12 snapshots dorados pasan (snapshots
   actualizados a mano en los puntos de inserción exactos, nunca con `jest -u`). Verificación
   funcional con Playwright contra el HTML construido y servido localmente
   (`python -m http.server` + navegación real con clics de botones, no evaluación directa de
   funciones JS): los 4 casos energizados y leídos coinciden exactamente con los valores
   esperados (Vap/V medida/a/desviación/veredicto idénticos a los calculados a mano), el
   ciclo de quiz responde y actualiza el reporte correctamente, el modo "Medición automática
   (guiada)" corre sin error, y no se capturó ningún error de consola ni de página
   (`pageerror`) en toda la sesión de prueba.
4. **Petición concreta al experto:** (a) confirmar que la cláusula 5.7.1 de ANSI/IEEE
   C57.12.00 sigue siendo la referencia vigente para la regla de clasificación de polaridad
   de fábrica, y su edición actual; (b) confirmar la edición vigente de IEC 60076-1 aplicable
   (esta ficha cita solo cláusulas, sin año, por falta de confirmación de alta confianza);
   (c) confirmar si existe una clave SINCO más específica para pruebas de transformadores que
   la reutilizada de la familia D2/D10; (d) confirmar si los valores ilustrativos de las 4
   unidades de ejemplo deben anclarse a un caso de placa real antes de escalar el patrón a
   otras prácticas de D5 (en particular d5-02, que reutiliza la unidad de 500 VA de esta
   práctica); (e) confirmar que la decisión de excluir la Cláusula 8.2(k) de IEC 60076-1 por
   ser más propia de unidades polifásicas es correcta para el alcance monofásico de esta
   práctica.
