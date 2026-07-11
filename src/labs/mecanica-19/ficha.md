# Ficha de práctica — Polarización de BJT: punto de operación Q (`mecanica-19`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** sexta práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Primera práctica de D2 centrada en el
> transistor bipolar (BJT) en vez del diodo; introduce el modelo de VBE constante como
> contraste explícito con el motor de Shockley usado en `mecanica-14`/`mecanica-18`.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-19
sector: mecanica-electronica
practica_maestra: "d2-06 — Polarización de BJT: punto de operación Q en polarización fija vs. divisor de voltaje, con modelo de VBE constante y fórmula unificada de Thevenin (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 (Mecatrónica, Módulo I, Submódulo 2)"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Polarización de transistores bipolares (BJT)"          # ⚑ confirmar clave exacta del plan vigente (banderada también como ETR-I.2 en la investigación; ninguna de las dos claves fue verificada contra un catálogo externo)
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la corriente de base y el punto de
  operación Q de un transistor NPN en polarización fija y en polarización por divisor de
  voltaje, usando el modelo de VBE constante; explicar por qué la polarización fija es
  sensible a la dispersión de fábrica de β y la polarización por divisor rígido no;
  aplicar el criterio de "divisor rígido" (RBB≤0.1·β·RE) para evaluar si un diseño
  concreto estabiliza el punto Q; identificar la región de operación (corte, activa,
  saturación) de un punto Q dado; y diseñar un divisor de voltaje que mantenga el punto Q
  en la región activa en todo el rango real de β de un dispositivo comercial.
actividad_clave: >
  Recorre dos topologías de polarización (fija y divisor de voltaje) sobre un esquema
  interactivo con recta de carga: en el modo Explora, toca el esquema o el banco 3D para
  revelar los valores y alterna entre Fija y Divisor sobre el mismo transistor, variando
  VCC/RC/RE y RB (o R1/R2), observando el punto de operación Q sobre la recta de carga; en
  Predicción, con un β de fábrica sorteado dentro del rango real del dispositivo, predice
  la región de operación o los valores de IC/VCE del punto Q; en Barrido, recorre β dentro
  del rango real de fábrica y observa el desplazamiento del punto Q en cada topología; y
  en el Reto, diseña R1, R2 y RE de un divisor de voltaje para que el punto Q permanezca
  en activa para todo el rango de β de fábrica del dispositivo elegido.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce las dos topologías de polarización: fija (una resistencia RB desde VCC hacia la base, sin realimentación) y divisor de voltaje (R1/R2 formando un divisor Thevenin hacia la base, más resistencia de emisor RE que introduce realimentación negativa), con esquema IEC 60617."
  - "Modo Explora: toca el esquema o los componentes del banco para revelar los valores (mecánica de descubrimiento, no se muestran de entrada); alterna entre Fija y Divisor sobre el mismo transistor (BC547B o 2N3904), cambia VCC (6–18 V), RC, RE, RB o R1/R2, y observa el punto de operación Q sobre la recta de carga."
  - "Verifica que ambas topologías se resuelven con la misma fórmula unificada de Thevenin IB=(VBB−VBE(on))/(RBB+(β+1)·RE), donde la polarización fija es el caso particular VBB=VCC, RBB=RB (por eso ya incluye el término (β+1)·RE de RE cuando existe, sin necesidad de una fórmula separada), y la polarización por divisor usa VBB=VCC·R2/(R1+R2), RBB=R1‖R2 — con VBE(on)=0.7 V constante en ambos casos, a diferencia del motor de Shockley exponencial de mecanica-14/mecanica-18."
  - "Verifica que el motor evalúa la región de operación completa: corte (IB≤0), activa (IC=β·IB, con verificación de que VCE resultante sea mayor que VCEsat) y saturación (VCE fijado en el VCEsat de hoja de datos del dispositivo, IC limitado por la malla externa) — no solo el caso ideal en activa."
  - "Verifica el criterio de 'divisor rígido' (RBB≤0.1·β·RE, basado en Thevenin) contra el rango completo hFE mínimo–máximo del dispositivo elegido, no solo contra su β típico — un divisor rígido para el β típico puede no serlo para el extremo bajo del rango de fábrica."
  - "Modo Predicción: con un β sorteado dentro del rango real de fábrica del dispositivo, predice la región de operación o los valores de IC/VCE del punto Q — antes de que el simulador lo confirme (tolerancias definidas por campo)."
  - "Modo Barrido: recorre β desde el mínimo hasta el máximo de fábrica del dispositivo, con todo lo demás fijo, y compara el desplazamiento del punto Q en polarización fija contra polarización por divisor rígido."
  - "Modo Reto: diseña R1, R2 y RE de un divisor de voltaje para que el punto Q permanezca en la región activa en todo el rango de β de fábrica del dispositivo elegido — el simulador verifica el punto Q calculado en ambos extremos del rango hFE, no solo en el valor típico."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito)."
  - "⚑ No se identificó una NOM mexicana que aplique directamente a la polarización de transistores bipolares a nivel de diseño de circuito, a diferencia de otras prácticas de esta tanda (p. ej. mecanica-14/d2-01, que sí tiene un anclaje normativo aplicable al diodo). Confirmar con el equipo curricular si el programa MCCEMS exige citar alguna norma específica para esta práctica, o si la ausencia de una NOM aplicable es aceptable dado que se trata de una práctica de diseño analógico, no de seguridad eléctrica."
simulador_modela:      # 🔒
  - "Modelo de VBE constante (VBE(on)=0.7 V) para la unión base-emisor, usado en ambas topologías — simplificación estándar de análisis de polarización en DC de primer orden, distinta del motor de Shockley exponencial reutilizado de mecanica-14/mecanica-18."
  - "Fórmula unificada de Thevenin IB=(VBB−VBE(on))/(RBB+(β+1)·RE), evaluada para polarización fija (VBB=VCC, RBB=RB) y por divisor de voltaje (VBB=VCC·R2/(R1+R2), RBB=R1‖R2) — el término (β+1)·RE ya está presente en ambos casos, incluyendo fija+RE, sin necesidad de una rama de código separada."
  - "Resolución completa por regiones de operación (corte, activa, saturación) usando el VCEsat real de hoja de datos del dispositivo elegido — no solo el caso ideal en activa."
  - "Criterio de 'divisor rígido' basado en Thevenin (RBB≤0.1·β·RE), aplicado de forma consistente en la interfaz y en la verificación del modo Reto, evaluado contra el rango completo hFE mínimo–máximo de fábrica del dispositivo, no solo su β típico."
  - "Dispersión real de fábrica de β mediante el rango hFE mínimo–típico–máximo de cada dispositivo (BC547B: 200–450; 2N3904: 100–300), explorable en los modos Predicción, Barrido y Reto."
  - "Recta de carga con extremos ideales (IC(sat,ideal)=VCC/(RC+RE), VCE=VCC) como referencia geométrica del eje, calculada por separado del punto Q real (que sí usa el VCEsat de hoja de datos)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Efecto Early (se asume VA infinita, sin pendiente en las curvas de salida en activa) — un BJT real tiene una resistencia de salida finita en activa, no modelada aquí."
  - "Dependencia de VBE con la temperatura: VBE(on)=0.7 V se usa como constante en toda la práctica; un BJT real tiene un coeficiente de temperatura de VBE de aproximadamente −1.8 a −2.2 mV/°C, precisamente lo que causa fuga térmica en un diseño de polarización fija mal dimensionado — no simulado a propósito, porque el enfoque pedagógico es el análisis DC en frío."
  - "Ecuación exponencial de Shockley para la unión base-emisor: a diferencia de mecanica-14/mecanica-18, aquí VBE se simplifica intencionalmente a una constante — el error introducido (VBE real varía entre ≈0.55 V y ≈0.77 V según la corriente) es aceptado como parte del método estándar de análisis de polarización de primer orden."
  - "Autocalentamiento dinámico ni la fuga térmica regenerativa (IC↑→temperatura↑→VBE↓→IB↑→IC↑) que puede ocurrir en un diseño de polarización fija mal dimensionado durante operación extendida."
  - "Corrientes de fuga ICBO/ICEO: se idealizan en 0 exacto; un BJT real conduce una fuga pequeña pero no nula incluso con IB=0."
  - "Tolerancia de fabricación de los resistores del circuito (R1, R2, RB, RC, RE se tratan como valores exactos) — relevante quando un diseño de divisor 'rígido' queda cerca del límite del criterio."
  - "Comportamiento en pequeña señal / AC del transistor: esta práctica es exclusivamente de polarización DC (selección del punto Q de reposo), no de ganancia, impedancias o respuesta en frecuencia."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de R1, R2 y RE elegidos para un divisor de voltaje, y confirmación del simulador de que el punto Q calculado permanece en la región activa tanto para β mínimo como para β máximo de fábrica del dispositivo elegido."
evidencia_desempeno: "Guía de observación del modo Predicción (región de operación e IC/VCE del punto Q con β sorteado) y del modo Barrido (desplazamiento del punto Q en fija vs. divisor rígido al recorrer β)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la dispersión de fábrica de β hace que un circuito de polarización fija sea frágil, y cómo un divisor de voltaje rígido resuelve ese problema con realimentación negativa (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → predice → barrido de β → reto de diseño de divisor rígido con verificación en ambos extremos del rango hFE."
cierre: "Ficha técnica (capa 2) con los parámetros hFE/VCEsat/VBE(on)/Ptot de BC547B y 2N3904, la fórmula unificada de Thevenin, el criterio de divisor rígido, y el procedimiento de medición física con fuente variable, resistores de precisión y multímetro con función de prueba de hFE."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "ON Semiconductor, datasheet 'BC546/BC547/BC548/BC549/BC550' Rev. 6 — hFE por grado (A/B/C), VCEsat, VBE(on) y Ptot del BC547B usado en este lab."
  - "STMicroelectronics, datasheet '2N3904' (Preliminary Data, Feb-2003) — hFE, VCEsat, VBEsat y Ptot del 2N3904 usado en este lab; valores medidos bajo pulso (300 µs, ciclo de trabajo ≤2%)."
  - "Boylestad, R.L. y Nashelsky, L., Electronic Devices and Circuit Theory (Pearson) — análisis de polarización fija y por divisor de voltaje, modelo de VBE constante, criterio de divisor rígido."
  - "Sedra, A.S. y Smith, K.C., Microelectronic Circuits (Oxford) — análisis DC de polarización de BJT por regiones (corte, activa, saturación)."
  - "Malvino, A.P. y Bates, D.J., Electronic Principles (McGraw-Hill) — estabilización del punto Q frente a la dispersión de β mediante divisor de voltaje con resistencia de emisor."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.2 / ETR-I.2 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); ninguna de las dos variantes de clave candidatas (MEC-I.2 o ETR-I.2) se confirmó contra un catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ El multiplicador exacto del criterio de 'divisor rígido' (este lab usa 0.1×, es decir RBB≤0.1·β·RE) varía entre autores de 5× a 20× según la fuente consultada; se usó el valor de Boylestad (10× en la forma equivalente β·RE≥10·RBB) por ser el más citado en la literatura de circuitos electrónicos de nivel técnico, pero la edición y página exactas de esa cita no fueron confirmadas durante la investigación — verificar contra la edición específica que use el plantel."
  - "⚑ La elección del transistor mostrado por defecto (BC547B vs. 2N3904) no fue confirmada contra el kit físico real de componentes disponible en el laboratorio del curso — ambos son NPN de propósito general ampliamente disponibles, pero el valor por defecto del simulador es una elección editorial, no una verificación de inventario."
  - "⚑ El criterio de divisor rígido tiene dos formulaciones no estrictamente equivalentes en la literatura: la basada en Thevenin (RBB≤0.1·β·RE, la que implementa este simulador) y una heurística alternativa (β·RE≥10·R2) que algunos textos presentan como atajo. La verificación adversarial de la investigación de esta práctica confirmó que ambas formulaciones NO son estrictamente equivalentes entre sí en todos los casos (difieren en cómo tratan R1 dentro del paralelo Thevenin); la ficha técnica del lab documenta la de Thevenin como el criterio oficial y la otra solo como heurística alternativa, no como equivalente."
  - "⚑ CORREGIDO antes de commitear (ver Notas para el revisor): la verificación con Playwright de este simulador encontró que el body.js inicial tenía tres defectos críticos de implementación (no de investigación de parámetros) que impedían que el lab cargara: una declaración duplicada de `pickerFor` (colisión entre un helper local mal nombrado y la función global del framework, causando un SyntaxError de módulo ES que bloqueaba todo el script) y la ausencia de los helpers locales `el()` y `showToast()`, que — a diferencia de lo asumido inicialmente — NO son globales del framework y deben definirse en cada body.js. Se corrigieron los tres y se re-verificó con Playwright (10/10 checks) antes de integrar el lab; se documenta como caso de estudio de un patrón de bug de límite framework/body.js a vigilar en las prácticas d2-07…d2-10."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (sexta práctica de Tanda 1 / D2):** d2-06 introduce el
   transistor bipolar (BJT) en la tanda, con un motor de cálculo deliberadamente distinto
   al de las prácticas de diodo (mecanica-14/mecanica-18) — VBE constante en vez de la
   ecuación exponencial de Shockley — porque ese es precisamente el método estándar de
   análisis de polarización DC de primer orden que se enseña para transistores. Si el
   contraste entre "motor exponencial para diodos" y "motor de VBE constante para BJT en
   DC" es pedagógicamente claro para el estudiante, o si conviene reforzarlo más
   explícitamente en el briefing o la ficha técnica, es una pregunta abierta para el
   experto.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/polarizacionbjt.html](../../../public/labs/polarizacionbjt.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros
   de hoja de datos de BC547B y 2N3904, de modo que el alumno y el evaluador ven las
   fronteras del modelo dentro de la práctica.
3. **Un defecto de implementación encontrado y corregido durante la verificación (ver
   bandera ⚑ final) — importante para d2-07…d2-10:** la primera versión de
   `polarizacionbjt.body.js` no cargaba en absoluto: definía localmente una función
   `pickerFor(obj)` que colisionaba con la función global `pickerFor(scene,camera,dom,onHit)`
   que el framework expone para el raycasting de clic/hover — una declaración `function`
   duplicada a nivel de módulo ES es un `SyntaxError` que bloquea la carga completa del
   script, no un error silencioso. Además, el body.js asumía incorrectamente que `el(id)`
   (atajo de `document.getElementById`) y `showToast(msg)` (el mecanismo de notificación
   emergente ligado al elemento `toast` del shell de la página) eran utilidades globales
   del framework — no lo son: cada body.js debe definirlas localmente, siguiendo el patrón
   exacto ya usado en `protecciondiodo.body.js` (mecanica-18). Se corrigieron los tres
   defectos (renombrar el helper local colisionante a `resolveActor`, añadir `el`/`showToast`
   locales, y añadir la llamada real a `pickerFor(...)` del framework junto con un manejador
   `pointermove` de hover) y se re-verificó con Playwright (10/10 checks, incluyendo clics
   reales de mouse sobre el banco 3D y el esquema, no solo la API de depuración) antes de
   integrar el lab. Se documenta aquí como recordatorio explícito del límite
   framework/body.js para las prácticas d2-07…d2-10: `pickerFor` es global y debe
   **llamarse**, nunca redefinirse con un nombre que colisione; `el` y `showToast` **no**
   son globales y deben definirse localmente en cada body.js nuevo.
4. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑
   (MEC-I.2 vs. ETR-I.2); (b) confirmar la edición y página exactas de Boylestad para el
   multiplicador 10× del criterio de divisor rígido, o indicar si el plantel usa un
   multiplicador distinto; (c) confirmar si BC547B o 2N3904 corresponde al kit físico real
   disponible en el laboratorio del curso, o si conviene fijar un tercer dispositivo; (d)
   confirmar si la ausencia de una NOM aplicable a esta práctica (a diferencia de
   mecanica-14/d2-01) es aceptable, dado que se trata de una práctica de diseño analógico
   sin implicación directa de seguridad eléctrica.
