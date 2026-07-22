# Ficha de práctica — Fasores de Señales Senoidales: Representación y Medición de Desfase (`mecanica-67`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** **primera práctica del hueco D1-CA** (corriente alterna) — hasta
> `mecanica-66` todo el dominio D1 era de circuitos de CD. Introduce una señal senoidal
> de doble canal, el diagrama fasorial polar y la técnica de medición de desfase por
> cruces por cero con un osciloscopio de dos trazos. Es prerrequisito declarado de D5
> (máquinas eléctricas de CA, ya construido en `mecanica-49` a `mecanica-59`) y de la
> siguiente práctica del propio D1 (`d1-10`, impedancias RLC).

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-67
sector: mecanica-electronica
practica_maestra: "d1-09 🔴 — Representa señales senoidales como fasores y mide desfases (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ELE-II; UAX"   # ⚑ confirmar clave exacta del plan vigente (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-09) — "UAX" sin glosa conocida, verificar con el experto
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Corriente alterna: representación fasorial y medición de desfase"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011, heredada de mecanica-60..66
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de representar una señal senoidal v(t)=Vm·sen(ωt+φ)
  como un fasor (vector de magnitud Vm y ángulo φ) en un diagrama polar, explicar por qué
  el desfase solo tiene sentido entre señales de la misma frecuencia, y medir el desfase
  entre dos señales de CA con un osciloscopio de dos canales usando la técnica estándar de
  cruces por cero —identificando y evitando el error sistemático de 180° que resulta de
  comparar un cruce ascendente de un canal contra uno descendente del otro.
actividad_clave: >
  Explora libremente la amplitud, la frecuencia y el desfase de una señal de CA (canal 2)
  respecto a una referencia fija (canal 1, 10 V, 0°), observando en un osciloscopio de dos
  trazos y un diagrama fasorial polar sincronizados en tiempo real cómo cambia la relación
  entre ambas señales; en el modo Medición, el sistema sella el desfase del canal 2 (con
  amplitud y frecuencia conocidas) y el estudiante lo mide con dos cursores —uno por
  canal— que se ajustan automáticamente al cruce por cero más cercano de su señal; y en el
  reto, tanto la amplitud como el desfase del canal 2 se sellan, y el estudiante reporta
  ambos valores —la amplitud leída visualmente en la rejilla, el desfase medido con los
  cursores— calificados de forma independiente.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: el canal 1 es la referencia fija (Vm1=10 V, φ1=0°); el canal 2 tiene amplitud seleccionable de una lista de candidatos (4, 8, 12, 16, 20 V), desfase ajustable de forma continua con un deslizador (−180° a 180°) y frecuencia seleccionable de una lista de candidatos (60, 120, 250, 500 Hz), compartida por ambos canales. El osciloscopio de dos trazos y el diagrama fasorial polar se actualizan en tiempo real con cada cambio."
  - "Modelo de la señal: v(t) = Vm·sen(2π·f·t + φ), evaluado exactamente para ambos canales (sin ruido, sin aproximación de pequeña señal, sin limitación de ancho de banda), sobre una ventana de tiempo calculada automáticamente en función de f para mostrar aproximadamente 3.3 periodos completos — suficientes cruces por cero visibles sin saturar la rejilla del osciloscopio."
  - "Diagrama fasorial polar: cada señal se dibuja como un vector desde el origen, con longitud proporcional a Vm/Vm_max (rejilla circular graduada) y ángulo medido en sentido antihorario desde el eje horizontal positivo, usando la convención SENO: v(t)=Vm·sen(ωt+φ) ↔ fasor V=Vm∠φ (ver bandera de incertidumbre sobre esta convención más abajo)."
  - "Medición de desfase por cruces por cero: cada canal tiene su propio cursor deslizable sobre el eje de tiempo del osciloscopio; al soltar el cursor, el sistema lo ajusta (snap) automáticamente al cruce por cero MÁS CERCANO de esa señal específica —sea ascendente o descendente, tipo que queda registrado internamente—. El botón 'Medir φ' calcula el desfase a partir de la diferencia de tiempo entre los dos cruces seleccionados, normalizada al periodo de la señal: φ_medido = −Δt·360°/T, con Δt normalizado al intervalo (−T/2, T/2]."
  - "Verificación algebraica del método: se demostró numéricamente (182 combinaciones de ángulo de desfase × posición inicial de cursor) que el desfase recuperado por esta fórmula es EXACTO sin importar en qué par de cruces del MISMO tipo (ambos ascendentes o ambos descendentes) caiga cada cursor — la técnica es robusta a la posición exacta donde el estudiante suelta el cursor dentro de la ventana visible, siempre que ambos cursores usen el mismo tipo de cruce como referencia."
  - "Firma del error de referencia inconsistente: se verificó numéricamente que si el estudiante ancla un cursor en un cruce ascendente y el otro en uno descendente, el desfase calculado difiere del valor real en exactamente 180° (mod 360°), de forma sistemática y predecible — no es una falla ni una imprecisión aleatoria, sino la consecuencia matemática directa de comparar contra referencias temporales distintas. El simulador señala este caso explícitamente en su retroalimentación."
  - "Modo Medición: f y Vm2 conocidos y visibles en el panel; Vm1=10 V fijo como referencia; φ2 sellado en un múltiplo de 15° dentro de [−165°, 180°] (24 valores posibles, sin repetir el de la ronda anterior). El botón 'Medir φ' calcula el desfase a partir de la posición vigente de ambos cursores y lo compara contra el valor sellado con tolerancia ±5°."
  - "Modo Reto: f conocido y visible; Vm1=10 V fijo. Vm2 Y φ2 se sellan ambos (Vm2 de la misma lista de candidatos que Explora, φ2 de la misma lista de múltiplos de 15° que Medición, sin repetir la combinación exacta de la ronda anterior). El estudiante reporta Vm2 leyendo visualmente las divisiones de la rejilla volts/división del canal 2 (tolerancia ±8%) y φ2 con el mismo mecanismo de cursores de cruce por cero (tolerancia ±5°); ambos campos se califican de forma independiente, sin presupuesto de mediciones bloqueante."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60027-1 — Letter symbols to be used in electrical technology: notación de fasores y magnitudes de corriente alterna."
  - "IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering: convenciones de símbolos para fasores y ángulos de fase."
  - "ELE-II; UAX — anclaje curricular tomado del mapeo interno (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-09); confirmar clave y vigencia exacta con el plan de estudios."
simulador_modela:      # 🔒
  - "Modelo exacto de señal senoidal de doble canal v(t)=Vm·sen(2π·f·t+φ), evaluado sin aproximación ni ruido, con canal 1 fijo como referencia (Vm=10 V, φ=0°) y canal 2 con amplitud, frecuencia y fase configurables o sellables según el modo activo."
  - "Diagrama fasorial polar sincronizado en tiempo real con el osciloscopio de dos trazos, con escala de magnitud común (Vm/Vm_max) y convención de fase seno explícita (v(t)=Vm·sen(ωt+φ) ↔ V=Vm∠φ)."
  - "Mecanismo de medición de desfase por cursores de cruce por cero independientes por canal, con ajuste automático (snap) al cruce más cercano —ascendente o descendente— y cálculo exacto de Δt→φ vía normalización módulo periodo, verificado numéricamente en 182 combinaciones de ángulo y posición de cursor."
  - "Detección y retroalimentación explícita del error de referencia inconsistente (cursores anclados en tipos de cruce distintos en cada canal), que produce un error sistemático de 180° confirmado numéricamente."
  - "Calificación independiente de amplitud (lectura visual en rejilla, tolerancia ±8%) y desfase (medición por cursores, tolerancia ±5°) en el modo Reto."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Ruido de instrumentación, ancho de banda finito del osciloscopio o distorsión armónica de la señal — ambos canales son señales senoidales puras, exactas, sin ruido ni limitación de muestreo real."
  - "Impedancia de entrada del osciloscopio ni efecto de carga sobre un circuito medido — los dos canales se modelan como fuentes de voltaje ideales, no como mediciones tomadas sobre un circuito con impedancia propia."
  - "Relación de fase producida por un circuito real con reactancia (RC, RL o RLC) — el desfase del canal 2 es un parámetro configurado o sellado directamente por el simulador, no derivado de una impedancia Z=R+j(ωL−1/ωC); esa relación es el tema declarado de la siguiente práctica del backlog (d1-10)."
  - "Componentes de CD superpuestos, transitorios de arranque ni contenido armónico — ambas señales son puramente senoidales en estado estacionario desde t=0."
  - "Sistemas trifásicos ni secuencia de fases — el banco es estrictamente de dos canales/dos señales; la sincronización de un generador a la red con las tres fases ya se practica, a otro nivel, en `mecanica-54` (d5-11)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: los valores de amplitud (Vm2) y desfase (φ2) reportados por el estudiante tras medir libremente, calificados de forma independiente por el sistema."
evidencia_desempeno: "Guía de observación del uso correcto del mecanismo de medición por cursores (mismo tipo de cruce en ambos canales) en el modo Medición, y de la lectura visual de amplitud en la rejilla volts/división en el modo Reto."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un fasor 'congela' una señal senoidal en un vector, por qué el desfase solo tiene sentido entre señales de la misma frecuencia, y por qué la técnica estándar de medición usa cruces por cero —del mismo tipo en ambos canales— en vez de comparar picos (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (ajusta amplitud, frecuencia y desfase del canal 2 libremente y observa el osciloscopio y el diagrama fasorial en tiempo real) → medición (mide un desfase sellado con los cursores de cruce por cero, con f y Vm2 conocidos) → reto (amplitud Y desfase ambos sellados, mide y reporta los dos, calificados por separado)."
cierre: "Ficha técnica (capa 2) con el modelo de señal completo, la deducción de la fórmula de medición por cruces por cero, y la explicación del error sistemático de 180° por referencia inconsistente."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): representación fasorial de señales senoidales, fundamento teórico central de esta práctica."
  - "Boylestad, R. — Introductory Circuit Analysis (Pearson): fasores y medición de desfase con osciloscopio de dos canales."
  - "IEC 60027-1 — Letter symbols to be used in electrical technology."
  - "IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering."
  - "Manuales de aplicación de osciloscopios (p. ej. Tektronix, 'XYZs of Oscilloscopes') — la medición de desfase por cruces por cero como método estándar de instrumentación, más robusto que comparar picos en una señal con ruido."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ELE-II; UAX / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad. La clave 'UAX' en particular no tiene glosa conocida en los documentos internos disponibles."
  - "⚑ Convención de fase: el simulador usa la convención SENO (v(t)=Vm·sen(ωt+φ) ↔ fasor V=Vm∠φ), consistente con la fórmula exacta de la fila d1-09 de LISTA-MAESTRA-200-PRACTICAS.md. Muchos textos de ingeniería eléctrica —incluyendo Hayt/Kemmerly/Durbin, citado arriba— prefieren la convención COSENO como referencia fasorial estándar de la industria. Confirmar con el experto si el semestre destino requiere explícitamente la convención coseno, lo cual exigiría cambiar la fórmula (y toda la ficha), no solo agregar una nota."
  - "⚑ El mecanismo de 'snap al cruce más cercano, de cualquier tipo' con detección de error de 180° por tipos de cruce inconsistentes es una decisión pedagógica deliberada —enseña una falla real de medición en vez de impedirla—, en lugar de restringir el snap siempre a cruces ascendentes (lo que eliminaría la posibilidad del error, junto con su valor pedagógico). Confirmar que este nivel de exigencia es adecuado o si el revisor prefiere la variante más simple."
  - "⚑ Los candidatos de amplitud (4, 8, 12, 16, 20 V) y frecuencia (60, 120, 250, 500 Hz), y la ventana de visualización de ~3.3 periodos, son valores pedagógicos elegidos para mostrar suficientes cruces por cero sin saturar la rejilla del osciloscopio; confirmar que son representativos de instrumentación real de laboratorio de este nivel."
  - "⚑ Primera práctica del hueco D1-CA: no modela ningún circuito con reactancia (RLC); el desfase se configura o sella directamente como parámetro del simulador, no se deriva de una impedancia. Esa relación (Z=R+j(ωL−1/ωC)) es el tema declarado de d1-10, la siguiente práctica del backlog. Confirmar que esta secuenciación (fasores y medición primero, impedancia después) es pedagógicamente correcta."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primera práctica del hueco D1-CA):**
   `d1-09` es la primera práctica de todo el dominio D1 que trabaja con corriente
   alterna — hasta `mecanica-66` cada circuito era de CD. La novedad estructural es
   doble: (a) un osciloscopio de DOS canales en vez de uno (el molde previo de
   `mecanica-64`/d1-06 solo mostraba un trazo), y (b) un diagrama fasorial polar nuevo,
   sincronizado en tiempo real con el osciloscopio, que no existía en ningún lab
   anterior del sector. El mecanismo de medición (cursores que hacen snap al cruce por
   cero más cercano, con detección del error de 180° por referencia inconsistente) fue
   verificado numéricamente de forma exhaustiva antes de codificar: se probaron 182
   combinaciones de ángulo de desfase y posición de cursor para confirmar que el método
   es exacto cuando ambos cursores usan el mismo tipo de cruce, y que produce un error
   sistemático de exactamente 180° —nunca un valor arbitrario— cuando no lo son.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/fasores-desfase.html](../../../public/labs/fasores-desfase.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el
   resto de la familia, y declara explícitamente que el desfase es un parámetro
   configurado del simulador, no el resultado de un circuito con reactancia real —
   siguiendo la regla de honestidad del proyecto (`ESTANDAR-MOLDE-LAB-3D.md`: rangos, no
   cifras inventadas).
3. **Petición concreta al experto:** (a) la más importante — confirmar si la convención
   de fase debe ser SENO (como está implementado, y como indica la fórmula exacta de la
   fila d1-09 del documento maestro) o COSENO (más común en varios textos de referencia
   citados arriba), ya que un cambio de convención alteraría la fórmula del simulador,
   no solo el texto de la ficha; (b) confirmar o corregir las claves curriculares ⚑,
   en particular el significado de "UAX"; (c) validar que el mecanismo de snap-a-
   cualquier-tipo-de-cruce (en vez de solo ascendente) es la decisión pedagógica
   correcta para enseñar el error de referencia de 180°, o si el nivel destino
   esperaría una versión más simple sin esa trampa deliberada.
