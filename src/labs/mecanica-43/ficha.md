# Ficha de práctica — Termopar, RTD e Infrarrojo: Medición de Temperatura (`mecanica-43`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** cuarta y última práctica del sub-clúster de metrología general que
> cierra el dominio D10 (Instrumentación, diagnóstico y metrología) — d10-11 a d10-14
> (calibrador vernier, micrómetro/comparador, incertidumbre GUM/trazabilidad, termopar/RTD/IR).
> Con esta práctica **D10 queda cerrado en 14/14**. A diferencia de d10-13 (molde S), esta
> fila vuelve al **molde P puro** (panel de instrumento), como d10-01/d10-02 — no hay
> ensamble/desmontaje de un instrumento único, sino tres instrumentos intercambiables que
> miden el mismo bloque caliente, cada uno con su propio principio físico y su propio modo
> de falla característico.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-43
sector: mecanica-electronica
practica_maestra: "d10-14 — Mide temperatura con termopar, RTD e infrarrojo (molde P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1 (Electrónica/Tecnología, resultado I.1) — tomado literalmente de la columna 'Trazabilidad' de la fila d10-14 en docs/LISTA-MAESTRA-200-PRACTICAS.md"
norma_ancla_lista_maestra: "IEC 60584; IEC 60751 — tomado literalmente de la columna 'Norma ancla' de la fila d10-14."
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Termometría industrial: termopares, RTD y termometría infrarroja"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ código reutilizado de la familia D10 (mecanica-12/24/40/41/42); confirmar si existe una clave SINCO más específica de instrumentación/control de procesos
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar el efecto Seebeck como principio de
  medición de un termopar y calcular el error sistemático que introduce la ausencia de
  compensación de junta fría (CJC); explicar por qué una RTD Pt100 cambia de resistencia con
  la temperatura (coeficiente medio α, IEC 60751) y calcular el error introducido por la
  resistencia de cable en una conexión a 2 hilos frente a la conexión a 4 hilos (Kelvin); y
  explicar por qué un termómetro infrarrojo requiere configurar la emisividad de la superficie
  medida, cuantificando el error de lectura que resulta de usar una emisividad de fábrica
  distinta de la real.
actividad_clave: >
  Resuelve 3 escenarios sobre el mismo bloque caliente con tres instrumentos distintos: mide
  con un termopar Tipo K sin y con compensación de junta fría (CJC); mide con una RTD Pt100 en
  conexión a 2 hilos y a 4 hilos (Kelvin); y mide con una pistola infrarroja con emisividad de
  fábrica y con la emisividad real configurada. En cada escenario identifica, mediante un quiz
  de diagnóstico de opción múltiple, la causa correcta del error observado.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los tres instrumentos disponibles alrededor del mismo bloque caliente: el termopar Tipo K con su lector y LED indicador de CJC (izquierda), la RTD Pt100 con su lector y haz de cables (derecha) y la pistola infrarroja con puntero láser (frente); solo el grupo del instrumento activo es visible en cada momento."
  - "Escenario Termopar: inicia la medición con CJC desactivada y observa que la temperatura indicada (238 °C) queda por debajo de la temperatura real del bloque (260 °C) exactamente en la magnitud de la temperatura ambiente (22 °C); activa CJC y confirma que la lectura sube a 260 °C, coincidiendo con la real."
  - "Escenario RTD: inicia la medición en conexión a 2 hilos y observa que la resistencia medida (133.425 Ω) y la temperatura indicada (≈86.8 °C) exceden el valor real (132.725 Ω / 85.0 °C) por la resistencia de los cables de extensión (0.35 Ω por hilo); cambia a 4 hilos (Kelvin) y confirma que la lectura cae exactamente a 85.0 °C."
  - "Escenario Infrarrojo: inicia la medición con la emisividad de fábrica (ε=0.95) sobre una superficie metálica de emisividad real baja (ε=0.20) y observa una subestimación drástica (≈13.5 °C indicados frente a 150 °C reales); corrige la emisividad configurada a 0.20 y confirma que la lectura sube exactamente a 150 °C."
  - "En cada uno de los 3 escenarios, responde la pregunta de diagnóstico de opción múltiple eligiendo entre la causa física correcta y distractores derivados de errores conceptuales reales (confundir un error de configuración con una falla del instrumento; atribuir a otro escenario la causa correcta)."
  - "Usa 'Demostración guiada' para recorrer los tres escenarios en secuencia, con narración del error observado, el diagnóstico correcto y la corrección aplicada en cada uno."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60584-1:2013 'Thermocouples — Part 1: EMF specifications and tolerances' — norma ancla explícita de la fila d10-14 en la lista maestra; especifica las tablas de referencia de fuerza electromotriz y tolerancias de los termopares tipo K (entre otros)."
  - "IEC 60584-3 'Thermocouples — Part 3: Extension and compensating cables — Tolerances and identification system' — código de color verde para cables de extensión Tipo K, usado en la escena 3D."
  - "IEC 60751:2022 'Industrial platinum resistance thermometers and platinum temperature sensors' — norma ancla explícita de la fila d10-14; define R₀=100 Ω a 0 °C y el coeficiente de temperatura medio α=0.003850 °C⁻¹ para una Pt100, y la ecuación de Callendar-Van Dusen de la que se deriva la aproximación lineal usada en este lab."
normatividad_apoyo:    # 🔒 referencias de apoyo no citadas por número de norma en la lista maestra
  - "NIST ITS-90 Thermocouple Database (srdata.nist.gov) — tablas de referencia de fuerza electromotriz por tipo de termopar, consultadas para verificar el orden de magnitud del coeficiente de Seebeck promedio usado (0.041 mV/°C ≈ 41 µV/°C, Tipo K, rango 0–300 °C)."
  - "Omega Engineering — nota técnica sobre configuraciones de conexión de RTD a 2, 3 y 4 hilos y el efecto de la resistencia de cable en cada una."
  - "Fluke — 'Emissivity: what is it and why is it important?' (artículo técnico) — rangos típicos de emisividad de superficies metálicas pulidas/oxidadas y valores de emisividad de fábrica comunes en termómetros infrarrojos de consumo/taller."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "El efecto Seebeck lineal del termopar Tipo K (V = S_K·(T−T_amb)) y el error real de omitir la compensación de junta fría — verificado por cálculo manual antes de escribir el código: V=9.758 mV, T_indicada sin CJC=238 °C, con CJC=260 °C (T real=260 °C, T_amb=22 °C)."
  - "La ecuación lineal de una RTD Pt100 (R=R₀·(1+α·T)) y el error real de conexión a 2 hilos frente a 4 hilos por resistencia de cable — verificado por cálculo manual: R_real=132.725 Ω, R_medida a 2 hilos=133.425 Ω, T_indicada a 2 hilos≈86.818 °C, a 4 hilos=85.0 °C exactos (R₀=100 Ω, α=0.003850 °C⁻¹, T real=85.0 °C, R_cable=0.35 Ω/hilo)."
  - "La relación graybody simplificada entre radiación emitida, emisividad y temperatura aparente (T_ap[K]=T_real[K]·(ε_real/ε_config)^¼) y el riesgo real y documentado de subestimar drásticamente la temperatura de superficies metálicas brillantes si no se corrige la emisividad — verificado por cálculo manual: con ε_config=0.95 (fábrica) sobre ε_real=0.20, T_ap≈13.5 °C frente a T_real=150 °C; con ε_config=0.20 (corregida), T_ap=150 °C exacto."
  - "Todas las lecturas se calculan por función de código a partir de constantes fijas declaradas (TC.tTrue, TC.sK, RTD.r0/alpha/tTrue/rLead, IR.tTrueC/epsActual/epsFactory), nunca transcritas a mano ni generadas con números aleatorios."
  - "Tres escenarios independientes con un instrumento visible a la vez, indicador visual de estado activo (LED de CJC, haz de cables de 2 vs. 4 hilos, punto láser) y diagnóstico de opción múltiple con retroalimentación explicativa específica por causa."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Termopar: la tabla de referencia no lineal completa Tipo K (curva polinómica de grado alto de IEC 60584-1); aquí se usa un coeficiente de Seebeck promedio constante (0.041 mV/°C), válido como aproximación didáctica en el rango de trabajo (0–300 °C), no para uso metrológico ni fuera de ese rango."
  - "RTD: la forma cuadrática completa de la ecuación de Callendar-Van Dusen (necesaria para exactitud fina y obligatoria por debajo de 0 °C); el autocalentamiento (self-heating) por la corriente de excitación de la RTD; ni la tolerancia de clase (A/B/AA) de una Pt100 individual fuera de espec."
  - "Infrarrojo: la radiación de fondo reflejada por la superficie (que un instrumento real también capta y que la fórmula completa de temperatura aparente debe restar), la transmisión atmosférica en la trayectoria óptica, el tamaño de punto (spot size) y distancia focal del instrumento, ni el ruido del detector."
  - "El color del bloque caliente en la escena 3D es una convención visual puramente didáctica (más cálido = más intenso) — NO representa el color real de radiación térmica visible a estas temperaturas (150–260 °C, muy por debajo del punto de incandescencia visible de un metal, ≈525 °C)."
  - "Modelos comerciales específicos de termopar, RTD o pistola IR — las constantes de coeficiente de Seebeck, resistencia de cable y emisividad son ilustrativas y representativas de rangos documentados, no la hoja de datos certificada de un fabricante particular."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 3 escenarios: lectura indicada antes y después de corregir la configuración del instrumento (CJC, hilos, emisividad), error calculado en cada caso, y causa correcta identificada en el diagnóstico de opción múltiple."
evidencia_desempeno: "Guía de observación de la secuencia correcta de diagnóstico (reconocer la firma del error antes de corregir la configuración) en los tres escenarios, y de la comprensión de que ningún error observado implica un instrumento descompuesto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué tres instrumentos que miden la misma magnitud (temperatura) funcionan sobre principios físicos completamente distintos, y por qué cada uno tiene su propio modo de falla característico y predecible (briefing.ts)."
desarrollo: "Práctica en el simulador: 3 escenarios (termopar+CJC, RTD 2/4 hilos, infrarrojo+emisividad) con lectura antes/después de corregir la configuración → quiz de diagnóstico de opción múltiple con retroalimentación explicativa por causa → demostración guiada como referencia."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad completo (SÍ/NO modela, incluyendo la aclaración sobre el color ilustrativo del bloque caliente) y las normas de referencia (IEC 60584-1, IEC 60584-3, IEC 60751)."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "IEC 60584-1:2013 — norma ancla del termopar, confirmada explícitamente por la columna 'Norma ancla' de la fila d10-14 en la lista maestra."
  - "IEC 60584-3 — código de color de cables de extensión de termopar."
  - "IEC 60751:2022 — norma ancla de la RTD Pt100, confirmada explícitamente por la columna 'Norma ancla' de la fila d10-14."
  - "NIST ITS-90 Thermocouple Database — verificación de orden de magnitud del coeficiente de Seebeck promedio de Tipo K."
  - "Omega Engineering — configuraciones de conexión de RTD a 2/3/4 hilos."
  - "Fluke — rangos de emisividad de superficies metálicas y valores de emisividad de fábrica típicos."
banderas_incertidumbre:
  - "⚑ La clave SINCO 2641/7541 se reutiliza de la familia D10 (mecanica-12/24/40/41/42); confirmar si existe una clave SINCO más específica de instrumentación/control de procesos antes de publicar la trazabilidad."
  - "⚑ Los valores de temperatura real, coeficiente de Seebeck, resistencia de cable y emisividad de cada escenario (TC.tTrue=260 °C, RTD.tTrue=85 °C, RTD.rLead=0.35 Ω, IR.tTrueC=150 °C, IR.epsActual=0.20) son constantes ilustrativas elegidas a mano para que cada fenómeno sea observable con claridad — no provienen de un instrumento o certificado real específico; confirmar si conviene anclarlos a casos de datasheet reales antes de escalar el patrón a otras prácticas de termometría."
  - "⚑ El coeficiente de Seebeck promedio del termopar (0.041 mV/°C) y el coeficiente medio α de la RTD (0.003850 °C⁻¹) son aproximaciones lineales explícitamente declaradas como no válidas para uso metrológico — confirmar que el nivel de esta práctica (taller/diagnóstico, no calibración) hace aceptable esa simplificación."
  - "⚑ Las prácticas d10-11 a d10-14 no aparecen nombradas en ninguna fila T1–T4 de la tabla de tandas de la lista maestra (T2 solo cubrió d10-01…d10-10) — la decisión de construirlas como sub-tanda discreta para cerrar D10 (14/14) antes de continuar con D5 se documentó primero en la ficha de mecanica-40 y se reitera aquí para consistencia; esta es la CUARTA y ÚLTIMA práctica de esa sub-tanda, y con ella D10 queda cerrado en 14/14."
  - "✅ Verificación de implementación (Playwright): verificado — script temporal contra el HTML construido y servido localmente, impulsando la interfaz real en los 3 escenarios (termopar sin/con CJC, RTD 2/4 hilos, infrarrojo con emisividad de fábrica/corregida), el quiz de diagnóstico (respuesta correcta y distractor) y la 'Demostración guiada' completa. Corrigió 2 bugs reales de implementación no detectados por Jest: (1) `document.getElementById('stage3d')` no existía en el DOM — el ID canónico del framework donante es `'stage'`, causando `TypeError` al crear la escena 3D y abortando el resto del script; (2) el helper `roundedBox(...)` del framework donante ya retorna un `THREE.Mesh` completo (no una geometría) — envolverlo otra vez en `new THREE.Mesh(roundedBox(...), mat)` (6 ocurrencias) rompía `updateMorphTargets` de three.js. Tras corregir ambos y reconstruir, todas las lecturas numéricas coinciden exactamente con el cálculo manual independiente citado arriba (238.0/260.0 °C termopar; 133.425/86.8 °C y 132.725/85.0 °C RTD; 13.5/150.0 °C infrarrojo), el diagnóstico correcto se resalta en los 3 escenarios, el distractor incorrecto se marca como tal, y la demostración guiada corre sin errores de consola ni de página (0/0)."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (cuarta y última práctica del sub-clúster de metrología
   general, cierre de D10):** d10-14 vuelve al molde P puro (como d10-01/d10-02), a
   diferencia de d10-13 (molde S). El objeto de aprendizaje son tres instrumentos de
   temperatura con principios físicos distintos (termopar, RTD, infrarrojo) que comparten
   el mismo bloque caliente como blanco de medición, cada uno con su propio modo de falla
   característico y predecible por configuración incorrecta, no por descompostura. Con esta
   práctica se cierra el dominio D10 (Instrumentación, diagnóstico y metrología) en 14/14.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/termopar-rtd-infrarrojo.html](../../../public/labs/termopar-rtd-infrarrojo.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con las fórmulas de
   los tres instrumentos y la declaración explícita sobre el color ilustrativo del bloque
   caliente — documentado en la sección 2 de la ficha técnica in-app
   ([_ficha-termopar-rtd-infrarrojo.js](../../../public/labs/_ficha-termopar-rtd-infrarrojo.js))
   y en el encabezado de fidelidad del propio archivo fuente
   (`termopar-rtd-infrarrojo.body.js`).
3. **Verificación de implementación:** ✅ **Completada.** Verificación numérica manual
   (fuera de la app, en Node.js puro) de `tcIndicated()`, `rtdIndicated()` e `irIndicatedC()`
   contra los valores documentados arriba — coincidencia exacta. Verificación funcional con
   Playwright contra el HTML construido y servido localmente, impulsando la interfaz real
   (clics de botones) en los 3 escenarios, el quiz de diagnóstico y la "Demostración guiada",
   encontró y permitió corregir 2 bugs reales de implementación que Jest no detecta (no
   renderiza el DOM/WebGL): un ID de elemento de montaje incorrecto (`'stage3d'` en vez de
   `'stage'`) que abortaba toda la escena 3D, y un doble-envoltorio de `THREE.Mesh` sobre el
   valor ya-Mesh que retorna el helper `roundedBox(...)` (6 ocurrencias) que rompía three.js
   internamente. Tras corregir y reconstruir, los 3 escenarios, el quiz y la demostración
   guiada funcionan sin errores de consola ni de página.
4. **Petición concreta al experto:** (a) confirmar que ETR-I.1, tal como aparece en la
   columna 'Trazabilidad' de la lista maestra, es suficiente como única referencia
   curricular, o si conviene añadir una clave adicional (como en d10-01, que además cita
   AUT-Y eléctrico); (b) confirmar si existe una clave SINCO más específica de
   instrumentación/control de procesos que la reutilizada de la familia D10; (c) confirmar
   que las aproximaciones lineales (Seebeck promedio, α medio de RTD) son aceptables para
   el nivel de taller/diagnóstico de esta práctica, o si debe añadirse una nota más
   prominente sobre sus límites de validez; (d) confirmar si los valores ilustrativos de
   cada escenario deben anclarse a datasheets reales antes de escalar el patrón a otras
   prácticas de termometría.
