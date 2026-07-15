# Ficha de práctica — Incertidumbre de Medición (GUM) y Trazabilidad Metrológica (`mecanica-42`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** tercera práctica del sub-clúster de metrología general que cierra el
> dominio D10 (Instrumentación, diagnóstico y metrología) — d10-11 a d10-14 (calibrador
> vernier, micrómetro/comparador, incertidumbre GUM/trazabilidad, termopar/RTD/IR). Es la
> **primera práctica del molde S** (Simulación de sistema/proceso) construida en el
> catálogo — a diferencia de las prácticas E/P/H previas, no hay un instrumento físico que
> "operar" en el sentido tradicional: el objeto de aprendizaje es un procedimiento de
> cálculo normativo (el presupuesto de incertidumbre GUM) y un concepto documental (la
> cadena de trazabilidad), por lo que la escena 3D representa una estación de medición y
> una cadena de nodos en vez de un instrumento desmontable.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-42
sector: mecanica-electronica
practica_maestra: "d10-13 — Calcula la incertidumbre y verifica la trazabilidad de una medición (molde S)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "UAX metrología — tomado literalmente de la columna 'Trazabilidad' de la fila d10-13 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "JCGM 100 (GUM); trazabilidad CENAM — tomado literalmente de la columna 'Norma ancla' de la fila d10-13; a diferencia de d10-11/d10-12, esta fila SÍ trae norma ancla explícita en la lista maestra, no es investigación propia sin respaldo de la tabla."
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Fundamentos de incertidumbre de medición y trazabilidad metrológica"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de mecanica-40/41 (misma familia D10); el cálculo de incertidumbre GUM es, en rigor, una competencia transversal de metrología/control de calidad más que de instalación/reparación eléctrica — confirmar si existe una clave SINCO más específica antes de publicar la trazabilidad
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la incertidumbre Tipo A de una serie de
  mediciones repetidas (u_A = s/√n, a partir de la desviación estándar muestral); calcular
  incertidumbres Tipo B a partir de la resolución de un instrumento (u = resolución/√12) y de
  un certificado de calibración (u = U_cert/k_cert); combinar las tres por suma cuadrática
  (u_c = √Σuᵢ²), reconociendo por qué NO se suman linealmente; expandir el resultado con un
  factor de cobertura (U = k·u_c, k=2 ≈ 95% aproximado); y explicar la cadena de trazabilidad
  metrológica de México (CENAM → laboratorio acreditado EMA → instrumento de taller),
  distinguiendo el contenido obligatorio de un certificado de calibración (ISO/IEC 17025 §7.8)
  del contenido opcional que frecuentemente se asume erróneamente como obligatorio.
actividad_clave: >
  Resuelve 7 casos en dos módulos sobre una misma escena 3D persistente: en el módulo GUM,
  cinco casos secuenciales sobre el mismo bloque patrón (Tipo A a partir de 5 lecturas
  repetidas del comparador, Tipo B de resolución, Tipo B de certificado, combinación
  cuadrática, expansión final) donde cada caso reutiliza el resultado del anterior como
  bloque de construcción; en el módulo de trazabilidad, un caso sobre la cadena de 3 eslabones
  (CENAM, laboratorio acreditado EMA, instrumento de taller) y un caso sobre un certificado de
  calibración ilustrativo que omite deliberadamente la próxima fecha de calibración, para que
  el estudiante identifique qué es realmente obligatorio según la norma.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica las dos zonas de la escena 3D: la estación de medición (comparador de carátula, bloque patrón, placas de resolución y certificado) a la izquierda, y la cadena de trazabilidad (3 nodos con tablero de certificado) a la derecha; la cámara se desplaza entre ambas según el módulo activo."
  - "Caso Tipo A: recorre las 5 lecturas repetidas del comparador sobre el mismo bloque patrón (10.0003, 10.0005, 10.0001, 10.0004, 10.0002 mm) con 'Siguiente lectura', y confirma que u_A = s/√n se calcula a partir de la media (10.0003 mm) y la desviación estándar muestral (s≈0.000158 mm) de esas 5 lecturas, dando u_A≈0.00007 mm (0.07 µm)."
  - "Caso Tipo B (resolución): identifica la resolución del comparador (0.001 mm) en su placa y calcula u_res = resolución/√12 ≈ 0.00029 mm (0.29 µm), aplicando la distribución rectangular estándar del GUM Anexo F.2.2.1 para una fuente sin más información que su resolución nominal."
  - "Caso Tipo B (certificado): lee la incertidumbre expandida U y el factor de cobertura k del certificado del bloque patrón (U=0.0001 mm, k=2) en su placa y calcula u_cert = U/k = 0.00005 mm (0.05 µm)."
  - "Caso Combinar: combina las tres incertidumbres por suma cuadrática u_c=√(u_A²+u_res²+u_cert²)≈0.00030 mm (0.30 µm), confirmando explícitamente —vía distractor en el quiz— que sumarlas linealmente (≈0.00041 mm) sobrestima el resultado real."
  - "Caso Expandida: aplica el factor de cobertura k=2 al resultado combinado para obtener U=k·u_c≈0.00060 mm (0.60 µm), y reconoce que k=2 da 'aproximadamente 95%' de confianza, no exactamente 95%, salvo que se calculen los grados de libertad efectivos (no implementado en este lab)."
  - "Caso Cadena: recorre los 3 nodos de la cadena de trazabilidad (CENAM → laboratorio acreditado EMA → instrumento de taller), inspeccionando cada uno para leer su rol, y responde qué elemento es indispensable en cada eslabón (una incertidumbre declarada), no solo un sello o firma."
  - "Caso Certificado: inspecciona el tablero de certificado de calibración ilustrativo (que lista laboratorio, instrumento, condiciones e incertidumbre expandida, pero deliberadamente NO incluye una fila de 'próxima fecha de calibración') y responde correctamente que ese dato NO es obligatorio por defecto según ISO/IEC 17025:2017 §7.8.4.3, salvo que el cliente lo solicite o una reglamentación lo exija."
  - "En cada uno de los 7 casos, responde la pregunta de opción múltiple eligiendo entre el resultado/criterio correcto y distractores derivados de errores conceptuales reales (suma lineal en vez de cuadrática, confundir Tipo A con Tipo B, usar k=1 o k=3 en vez de k=2, asumir que la fecha de próxima calibración es siempre obligatoria, confundir trazabilidad con calibración simple)."
  - "Usa 'Medición automática (guiada)' para ver los 5 pasos del presupuesto de incertidumbre narrados en secuencia (módulo GUM) o la inspección guiada de la cadena/certificado (módulo trazabilidad), como referencia antes o después de resolver cada caso por cuenta propia."
normatividad:          # 🔒 verificar clave y vigencia
  - "JCGM 100:2008 'Evaluation of measurement data — Guide to the expression of uncertainty in measurement' (GUM) — norma ancla explícita de la fila d10-13 en la lista maestra; cláusulas 4.2 (Tipo A), 4.3/Anexo F.2.2.1 (Tipo B por resolución), 5.1 (combinación cuadrática), 6.3.3 (factor de cobertura k y expansión)."
  - "JCGM 200:2012 'International vocabulary of metrology' (VIM) — definición 2.41 de trazabilidad metrológica y conceptos asociados (2.13 calibración, 2.15/2.16 patrón de referencia/trabajo, 2.26 cadena de trazabilidad)."
  - "ISO/IEC 17025:2017 'General requirements for the competence of testing and calibration laboratories' §7.8 — contenido del certificado de calibración, en particular §7.8.4.3 (próxima fecha de calibración no obligatoria por defecto), base del Caso Certificado."
  - "NMX-EC-17025-IMNC-2018 — adopción mexicana idéntica a ISO/IEC 17025:2017."
  - "NMX-CH-140-IMNC-2002 — adaptación mexicana del GUM."
  - "Ley de Infraestructura de la Calidad (vigente desde 2020-07-01) y marco CENAM/EMA — CENAM como instituto nacional de metrología de México, EMA como entidad acreditadora, citados como el eslabón de trazabilidad de la fila d10-13 ('trazabilidad CENAM')."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "El cálculo real de incertidumbre Tipo A por estadística de las 5 lecturas repetidas (u_A = s/√n) — verificado por cálculo manual antes de escribir el código: media=10.0003 mm, s≈0.000158 mm, u_A≈0.00007 mm."
  - "Las incertidumbres Tipo B de resolución (u = resolución/√12 ≈ 0.00029 mm) y de certificado (u = U/k = 0.00005 mm), cada una calculada por función de código a partir de constantes fijas (RES_MM, CERT_U_MM, CERT_K), nunca transcritas a mano."
  - "La combinación cuadrática u_c=√Σuᵢ² (≈0.00030 mm) y la expansión U=k·u_c (≈0.00060 mm, k=2), con retroalimentación explícita del quiz señalando que la suma lineal sobrestima el resultado."
  - "La cadena de trazabilidad de 3 eslabones (CENAM, laboratorio acreditado EMA, instrumento de taller) como concepto y flujo documental, con nodos inspeccionables en la escena 3D."
  - "Un certificado de calibración ilustrativo que OMITE deliberadamente la próxima fecha de calibración, con una nota explícita citando ISO/IEC 17025:2017 §7.8.4.3, para enseñar por contraste qué es y qué no es obligatorio."
  - "Generador de opciones de quiz derivado de errores conceptuales reales del GUM (suma lineal vs. cuadrática, confusión Tipo A/Tipo B, factor de cobertura incorrecto, asunción de obligatoriedad de la fecha de próxima calibración), con retroalimentación explicativa específica por distractor."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Los grados de libertad efectivos (Welch-Satterthwaite, JCGM 100:2008 Anexo G) que darían un nivel de confianza exacto — el lab usa k=2 como aproximación estándar a '~95%', declarado explícitamente como aproximado, no exacto."
  - "La deriva térmica o de largo plazo del bloque patrón o del comparador."
  - "La incertidumbre numérica propagada de cada eslabón individual de la cadena de trazabilidad — la cadena se presenta como concepto/flujo documental, no como un presupuesto de incertidumbre encadenado con cifras por eslabón."
  - "Otras fuentes de incertidumbre Tipo B (alineación del instrumento, fuerza de contacto variable, redondeo de visualización) — el presupuesto se limita a resolución y certificado para mantenerlo trazable y verificable paso a paso."
  - "La magnitud real de la deflexión de la aguja del comparador: se anima exagerada para que sea visible en pantalla — las desviaciones reales de este caso son de fracciones de micrómetro, imperceptibles a simple vista en una carátula real; declarado explícitamente en el HUD del lab."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 5 pasos del presupuesto de incertidumbre (u_A, u_res, u_cert, u_c, U) con sus valores numéricos; identificación correcta del elemento indispensable de cada eslabón de la cadena de trazabilidad; e identificación correcta de qué contenido de un certificado de calibración es obligatorio y cuál no según ISO/IEC 17025."
evidencia_desempeno: "Guía de observación de la construcción secuencial del presupuesto de incertidumbre (que el estudiante entienda por qué cada término se calcula distinto y por qué se combinan en cuadratura, no linealmente) y de la lectura correcta de la cadena de trazabilidad y del certificado de calibración."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué ninguna medición es un valor exacto sino un rango, qué distingue una incertidumbre Tipo A de una Tipo B, por qué se combinan en cuadratura y no sumando, qué significa 'aproximadamente 95%' con k=2, y por qué la trazabilidad sin incertidumbre declarada no sirve de nada (briefing.ts)."
desarrollo: "Práctica en el simulador: módulo GUM con 5 casos secuenciales que construyen un presupuesto de incertidumbre completo (Tipo A → Tipo B resolución → Tipo B certificado → combinación → expansión) sobre el mismo bloque patrón; módulo de trazabilidad con la cadena CENAM→EMA→taller y un certificado que distingue lo obligatorio de lo opcional → quiz de opción múltiple con distractores de error conceptual real por caso → modo automático guiado como referencia."
cierre: "Ficha técnica (capa 2) con el presupuesto de incertidumbre completo tabulado, el contrato de fidelidad completo (SÍ/NO modela, incluyendo la aclaración sobre grados de libertad efectivos y la deflexión exagerada de la aguja) y las normas de referencia (JCGM 100, JCGM 200, ISO/IEC 17025, NMX-EC-17025-IMNC-2018, NMX-CH-140-IMNC-2002)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "JCGM 100:2008 (GUM) — norma ancla del presupuesto de incertidumbre, confirmada explícitamente por la columna 'Norma ancla' de la fila d10-13 en la lista maestra."
  - "JCGM 200:2012 (VIM) — vocabulario internacional de metrología, definición de trazabilidad."
  - "ISO/IEC 17025:2017 §7.8 — contenido del certificado de calibración."
  - "NMX-EC-17025-IMNC-2018 y NMX-CH-140-IMNC-2002 — adopciones/adaptaciones mexicanas de las normas anteriores."
  - "Ley de Infraestructura de la Calidad y marco CENAM/EMA — trazabilidad nacional mexicana, confirmada por la columna 'Trazabilidad' de la fila d10-13 ('trazabilidad CENAM')."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de mecanica-40/41/familia D10, pero el cálculo de incertidumbre GUM es, en rigor, una competencia transversal de metrología/control de calidad, no específica de instalación/reparación eléctrica — confirmar si existe una clave SINCO más específica antes de publicar la trazabilidad."
  - "⚑ Los valores de las 5 lecturas, la resolución del comparador y los datos del certificado del bloque patrón (U=0.0001 mm, k=2) son constantes ilustrativas elegidas a mano para que el presupuesto sea claro y verificable paso a paso — no provienen de un instrumento o certificado real específico; confirmar si conviene anclarlos a un caso de certificado real antes de escalar el patrón a otras prácticas de incertidumbre."
  - "⚑ El factor de cobertura k=2 se declara como aproximación a '~95%'; el lab NO calcula grados de libertad efectivos (Welch-Satterthwaite) que darían el nivel de confianza exacto — decisión de diseño deliberada por complejidad, documentada en simulador_NO_modela; confirmar si una futura revisión debe añadir ese cálculo."
  - "⚑ Las prácticas d10-11 a d10-14 no aparecen nombradas en ninguna fila T1–T4 de la tabla de tandas de la lista maestra (T2 solo cubrió d10-01…d10-10) — la decisión de construirlas como sub-tanda discreta para cerrar D10 (14/14) antes de continuar con D5 se documentó primero en la ficha de mecanica-40 y se reitera aquí para consistencia; a diferencia de esa práctica, la norma ancla de ESTA fila (d10-13) SÍ está poblada en la lista maestra, por lo que este punto es solo sobre la secuenciación de tandas, no sobre el respaldo normativo del contenido."
  - "✅ Verificación de implementación (Playwright): verificado — 7/7 casos (5 GUM + 2 trazabilidad), ambos módulos, ciclo de `btnNew` y modo automático guiado (gum/tipoA y traz/cadena) recorridos vía interfaz real contra el HTML construido y servido localmente; todos los valores de telemetría/reporte coinciden exactamente con los estadísticos GUM esperados (u_A=0.00007 mm, u_res=0.00029 mm, u_cert=0.00005 mm, u_c=0.00030 mm, U=0.00060 mm, resultado final (10.0003 ± 0.0006) mm k=2); cero errores de consola o de página capturados."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primera práctica de molde S del catálogo):** d10-13 introduce
   un tipo de práctica nuevo — no hay un instrumento físico central que "operar" en el
   sentido de d10-11/d10-12 (vernier, micrómetro/comparador). El objeto de aprendizaje es
   un procedimiento normativo de cálculo (el presupuesto de incertidumbre GUM, construido
   paso a paso sobre el mismo bloque patrón) y un concepto documental (la cadena de
   trazabilidad y el contenido obligatorio de un certificado). La escena 3D representa esto
   con dos zonas espaciales fijas — estación de medición y cadena de trazabilidad — entre
   las que la cámara se desplaza según el módulo activo, en vez de instrumentos
   intercambiables como en las prácticas anteriores. A diferencia de mecanica-40/41, la
   fila d10-13 de la lista maestra **sí trae una columna 'Norma ancla' poblada** (`JCGM 100
   (GUM); trazabilidad CENAM`), lo que da a esta práctica un respaldo curricular más directo
   que las dos anteriores del mismo sub-clúster.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/incertidumbre-trazabilidad.html](../../../public/labs/incertidumbre-trazabilidad.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con las fórmulas de
   incertidumbre Tipo A/Tipo B, combinación cuadrática y expansión, la declaración explícita
   sobre la deflexión exagerada de la aguja del comparador y sobre los grados de libertad
   efectivos no calculados — documentado en la sección 2 de la ficha técnica in-app
   ([_ficha-incertidumbre-trazabilidad.js](../../../public/labs/_ficha-incertidumbre-trazabilidad.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`incertidumbre-trazabilidad.body.js`).
3. **Verificación de implementación:** ✅ **Completada.** Verificación numérica manual de
   `gumStats()` (Tipo A, Tipo B resolución, Tipo B certificado, combinación, expansión)
   contra los valores esperados documentados arriba, seguida de una verificación funcional
   con Playwright contra el HTML construido y servido localmente, impulsando la interfaz
   real (clics de botones): los 5 casos del módulo GUM en secuencia, los 2 casos del módulo
   de trazabilidad, el ciclo de `btnNew`, y el modo "Medición automática (guiada)" en ambos
   módulos (gum/tipoA y traz/cadena). Los 7/7 casos produjeron telemetría y texto de reporte
   idénticos a los valores esperados (u_A=0.00007 mm, u_res=0.00029 mm, u_cert=0.00005 mm,
   u_c=0.00030 mm, U=0.00060 mm, resultado final "(10.0003 ± 0.0006) mm, k=2 (~95%)"), y no
   se capturó ningún error de consola ni de página durante la sesión.
4. **Petición concreta al experto:** (a) confirmar que JCGM 100 (GUM) y la trazabilidad a
   CENAM, tal como aparecen en la columna 'Norma ancla' de la lista maestra, son suficientes
   como única referencia normativa, o si conviene añadir una norma mexicana específica de
   acreditación (además de NMX-EC-17025-IMNC-2018 y NMX-CH-140-IMNC-2002, ya citadas); (b)
   confirmar si existe una clave SINCO más específica para metrología/control de calidad que
   la reutilizada de la familia D10; (c) confirmar si los valores ilustrativos del
   presupuesto de incertidumbre (lecturas, resolución, certificado) deben anclarse a un caso
   de certificado real antes de escalar el patrón a otras prácticas de incertidumbre; (d)
   confirmar si la omisión deliberada de los grados de libertad efectivos
   (Welch-Satterthwaite) es aceptable para el nivel de esta práctica o si debe añadirse en
   una revisión futura; (e) confirmar la clave exacta del submódulo curricular contra el
   plan vigente.
