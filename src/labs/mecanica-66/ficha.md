# Ficha de práctica — Diagnóstico de Fallas en CD: Localización por Bisección de Mediciones (`mecanica-66`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** primera práctica del sector centrada en **diagnóstico de fallas**
> (no en análisis de un circuito sano). Introduce un circuito serie de 8 resistores con
> un modelo de falla unificado (abierto / corto / deriva) y formaliza la técnica de
> **localización por bisección (half-splitting)**, restringida honestamente al único
> tipo de falla que produce una firma de voltaje limpia en un solo nodo.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-66
sector: mecanica-electronica
practica_maestra: "d1-08 — Diagnostica fallas en circuitos CD: abiertos, cortos y derivas (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.2 (Electrónica/Tecnología, resultado I.2)"   # ⚑ confirmar clave exacta del plan vigente (LISTA-MAESTRA-200-PRACTICAS.md, fila d1-08)
modulo: "Circuitos eléctricos CD y CA (D1)"
submodulo: "Diagnóstico y localización de fallas en circuitos serie de CD"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de explicar cómo un circuito abierto, un corto
  circuito y una deriva de valor producen firmas de voltaje distintas en una cadena de
  resistores en serie energizada, aplicar la técnica de localización por bisección
  (half-splitting) —medir el punto medio del tramo sospechoso primero, no un extremo—
  para encontrar un circuito abierto oculto con un número de mediciones cercano al
  óptimo teórico, y diagnosticar una falla sellada de tipo y posición desconocidos
  (abierto, corto o deriva) razonando sobre mediciones de voltaje libres, sin la
  garantía formal de bisección que solo aplica al circuito abierto.
actividad_clave: >
  Explora una cadena visible de 8 resistores en serie (valores E12 nominales, fuente de
  24 V) provocando tú mismo cualquiera de las tres fallas —circuito abierto, corto o
  deriva de valor— en cualquier resistor, y compara sus tres firmas de voltaje distintas
  en una gráfica de perfil de nodo a nodo; en el modo Diagnóstico, el sistema esconde un
  circuito abierto en un resistor aleatorio y el estudiante lo localiza por bisección,
  midiendo primero el nodo medio del tramo que aún podría contener la falla y descartando
  la mitad correspondiente en cada paso, con el sistema llevando la cuenta de cuántas
  mediciones usó contra el óptimo teórico (3, para 8 resistores); y en el reto, una falla
  sellada de tipo Y posición desconocidos —cualquiera de las tres— se diagnostica con
  mediciones de voltaje libres (sin presupuesto fijo ni pista de tipo), reportando tanto
  el tipo de falla como el resistor afectado, evaluados de forma independiente.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Modo Explora: sobre una cadena serie visible de 8 resistores (R1..R8 = 220, 330, 470, 150, 680, 100, 390, 560 Ω, fuente ideal V=24 V), selecciona libremente un tipo de falla (ninguna/abierto/corto/deriva) y el resistor afectado, y observa el perfil de voltaje resultante en los 9 nodos (P0..P8) tanto en el esquema del pizarrón como en una gráfica de línea dedicada; cualquier nodo o resistor es clicable en todo momento y siempre revela su valor exacto."
  - "Modelo de falla unificado: normalmente cada resistor usa su valor nominal; un circuito abierto se modela como una resistencia efectiva de 1×10⁹ Ω (corriente ≈0 en toda la cadena), un corto como 0 Ω, y una deriva como el valor nominal multiplicado por un factor aleatorio (alto: 3×–6×, o bajo: 0.15×–0.35×, cada uno con 50 % de probabilidad al generar la falla) — en los tres casos la corriente se recalcula con la Ley de Ohm sobre la resistencia total de la cadena, preservando la Ley de voltajes de Kirchhoff (el perfil de voltaje siempre cae monótonamente de 24 V a 0 V, verificado algebraicamente: la caída total de voltaje sobre la cadena es siempre exactamente igual al voltaje de fuente, sin excepción, por construcción del modelo)."
  - "Firma de circuito abierto: al fallar un resistor por circuito abierto, la corriente de TODA la cadena serie cae a prácticamente cero y ese resistor absorbe prácticamente todo el voltaje de la fuente en un solo salto — todos los nodos antes de la falla miden el voltaje de fuente (24 V) y todos los nodos después miden cero. Esta firma de 'escalón limpio en un solo nodo' es la que permite bisección honesta; un corto o una deriva desplazan el perfil COMPLETO de la cadena (la corriente uniforme cambia en TODOS los tramos), una firma más sutil que no admite localización por un solo nodo interno sin comparar contra los valores nominales esperados."
  - "Modo Diagnóstico: el sistema sella un circuito abierto en un resistor aleatorio (1 a 8, sin repetir el mismo de la ronda anterior) y oculta el esquema (los nodos solo muestran ALTO/BAJO/? según lo medido, nunca el voltaje exacto ni la ubicación de la falla). El estudiante mide nodos internos (P1 a P7 — P0 y P8 son triviales por definición y no cuentan como medición) y el sistema reduce un intervalo [lo,hi] con cada medición (ALTO empuja el límite inferior, BAJO empuja el límite superior) hasta converger en el resistor fallado; se registra si cada medición cayó exactamente en el punto medio del intervalo vigente (bisección óptima) como una métrica de eficiencia, sin bloquear mediciones subóptimas."
  - "Modo Reto: el sistema sella una falla de tipo Y posición ambos aleatorios (abierto, corto o deriva; resistor 1 a 8; sin repetir la combinación exacta de la ronda anterior). El estudiante mide voltajes de nodo libremente (lectura numérica real, no simplificada a ALTO/BAJO, sin presupuesto de mediciones bloqueante) y reporta su diagnóstico seleccionando tipo de falla y resistor afectado; el sistema califica ambos campos de forma independiente, sin revelar los valores correctos si la respuesta es incorrecta."
  - "En los tres modos, hacer clic sobre un resistor siempre revela su valor NOMINAL de diseño (información legítima que un técnico real conocería de la hoja de datos o el plano), pero nunca revela si ese resistor es el fallado ni su valor efectivo real — la única forma de detectar la falla es por medición de voltaje, igual que en un diagnóstico de campo real."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (fuente, resistor y tierra, mismo estándar usado en el esquema del pizarrón de mecanica-13/61/62/63/64/65)."
  - "IEC 60063 — series de valores normalizados E12 para los 8 resistores nominales de la cadena."
  - "ETR-I.2 — diagnóstico y localización de fallas en circuitos de CD como resultado de aprendizaje del módulo de circuitos eléctricos, con énfasis en la técnica de bisección (half-splitting) como método de troubleshooting estándar de la industria."
simulador_modela:      # 🔒
  - "Modelo de falla unificado sobre una cadena serie de 8 resistores: circuito abierto (R_efectiva≈1×10⁹ Ω), corto (R_efectiva=0 Ω) y deriva de valor (R_efectiva=R_nominal×factor aleatorio, alto 3×–6× o bajo 0.15×–0.35×), con recálculo exacto de corriente y perfil de voltaje de nodo vía Ley de Ohm y Ley de voltajes de Kirchhoff, verificado algebraicamente: la suma de caídas de voltaje siempre iguala exactamente el voltaje de fuente, por construcción."
  - "Firma de voltaje de circuito abierto (escalón limpio de V_fuente a 0 V en el nodo fallado) verificada numéricamente como la única firma de un solo nodo que admite localización por bisección con garantías formales — restricción deliberada del modo Diagnóstico, no una limitación técnica del simulador."
  - "Algoritmo de bisección genérico sobre un intervalo [lo,hi] de 8 resistores, con conteo de mediciones usadas contra el óptimo teórico ⌈log₂8⌉=3, y una métrica no bloqueante de si cada medición cayó en el punto medio exacto del intervalo vigente."
  - "Exploración libre y comparación visual de las tres firmas de falla (abierto/corto/deriva) sobre el mismo circuito base, mediante una gráfica de perfil de voltaje de los 9 nodos."
  - "Diagnóstico de una falla de tipo Y posición ambos desconocidos en el modo Reto, con calificación independiente de cada campo del diagnóstico reportado por el estudiante."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Localización por bisección formal (con garantía de convergencia en ⌈log₂N⌉ mediciones) para fallas de corto o deriva — el modo Diagnóstico se restringe deliberadamente a circuito abierto porque es la única falla con una firma de un solo nodo; corto y deriva desplazan el perfil completo de la cadena y requieren comparar contra valores nominales esperados, no localización binaria. Esta restricción se declara explícitamente en el simulador, no se oculta."
  - "Efectos de carga del instrumento de medición (el multímetro simulado se modela como ideal, con resistencia de entrada infinita) sobre el circuito medido."
  - "Fallas múltiples simultáneas — el modelo permite exactamente una falla activa a la vez, nunca dos o más resistores fallados al mismo tiempo."
  - "Efectos térmicos, de arco eléctrico o de degradación progresiva de un corto o una deriva real — el modelo trata ambas fallas como un cambio instantáneo e ideal en el valor de resistencia efectiva, no un proceso físico en el tiempo."
  - "Tolerancias reales de fabricación de los resistores (el simulador usa valores E12 nominales exactos, salvo el resistor fallado, cuyo valor efectivo se altera intencionalmente según el modelo de falla)."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte del reto: el tipo de falla (abierto/corto/deriva) y el resistor reportados por el estudiante tras medir libremente, calificados de forma independiente por el sistema."
evidencia_desempeno: "Guía de observación del uso de la estrategia de bisección en el modo Diagnóstico (medir el punto medio del intervalo vigente, no un extremo, en cada paso) y del razonamiento aplicado en el modo Reto para distinguir entre las tres firmas de falla."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué localizar una falla en una cadena de componentes en serie por bisección (medir el punto medio, no un extremo) es mucho más rápido que medir uno por uno, y por qué solo el circuito abierto ofrece una firma de voltaje limpia en un solo nodo (briefing.ts)."
desarrollo: "Práctica en el simulador: explora (provoca las tres fallas libremente y compara sus firmas en la gráfica de perfil) → diagnóstico (localiza un circuito abierto oculto por bisección, con conteo de mediciones contra el óptimo) → reto (falla sellada de tipo y posición desconocidos, mide libremente y reporta ambos)."
cierre: "Ficha técnica (capa 2) con el modelo de falla completo, la justificación de por qué la bisección se restringe a circuito abierto, y el procedimiento real de diagnóstico de fallas por voltaje con el circuito energizado."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "EC&M (Electrical Construction & Maintenance) — 'The Beauty of Half-Splitting': artículo de referencia de la industria sobre la técnica de bisección para localizar fallas en cadenas de componentes en serie."
  - "AllAboutCircuits — sección de troubleshooting de circuitos serie: firmas de voltaje de circuito abierto y corto circuito en una cadena de resistores."
  - "CliffsNotes / learnabout-electronics.org — análisis de fallas en divisores de voltaje y circuitos serie mediante mediciones de voltaje a tierra."
  - "Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): fundamentos de la Ley de voltajes de Kirchhoff y circuitos serie, base teórica del modelo de falla."
  - "IEC 60617 — Graphical symbols for diagrams (símbolos normalizados, mismo estándar que mecanica-13/61/62/63/64/65)."
  - "IEC 60063 — Preferred number series for resistors (serie E12) para los 8 valores nominales de la cadena."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.2 / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ La restricción del modo Diagnóstico a solo circuito abierto (dejando corto y deriva únicamente para Explora y Reto) es una decisión deliberada de honestidad de ingeniería —no toda falla admite bisección formal de un solo nodo—; confirmar que esta restricción no debilita el objetivo pedagógico de la práctica o si el revisor prefiere un tratamiento distinto."
  - "⚑ El modelo de multímetro ideal (sin efecto de carga sobre el circuito medido) es una simplificación estándar de este nivel; confirmar que es adecuada para el semestre destino, igual que se preguntó en fichas anteriores de esta familia."
  - "⚑ Los rangos de deriva (alto 3×–6×, bajo 0.15×–0.35× del valor nominal) son un margen pedagógico elegido para producir una firma claramente distinguible pero no idéntica a un corto o un abierto; confirmar que estos rangos son representativos de fallas de deriva reales (envejecimiento térmico, daño parcial) o si el revisor prefiere otros límites."
  - "⚑ El modo Diagnóstico no impone un presupuesto máximo de mediciones ni bloquea mediciones subóptimas — solo las cuenta y compara contra el óptimo de 3; confirmar que este nivel de libertad (medir de más sin penalización dura) es pedagógicamente adecuado."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (primera práctica del sector centrada en diagnóstico, no en análisis):**
   d1-08 es la primera práctica de esta familia (`mecanica-60` en adelante) que invierte
   el problema típico: en vez de calcular el comportamiento de un circuito sano, el
   estudiante debe inferir dónde está una falla oculta a partir de mediciones. La
   novedad estructural es el modelo de falla unificado (abierto/corto/deriva) sobre la
   misma cadena de 8 resistores, y la formalización de la técnica de bisección
   (half-splitting) — restringida honestamente al único tipo de falla (circuito
   abierto) que produce una firma de voltaje de un solo nodo, en vez de aplicarla de
   forma imprecisa a las tres fallas por igual.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/diagnostico-fallas-cd.html](../../../public/labs/diagnostico-fallas-cd.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) igual que el
   resto de la familia, y rotula explícitamente que la garantía de bisección formal NO
   se extiende a corto y deriva, para cumplir la regla de honestidad del proyecto
   (`ESTANDAR-MOLDE-LAB-3D.md`: rangos, no cifras inventadas).
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares
   ⚑; (b) validar que restringir la bisección formal a circuito abierto —dejando
   corto/deriva como exploración libre y como parte del reto sin ayuda estructurada— es
   la decisión pedagógica correcta, o si el nivel destino esperaría una técnica de
   localización también para esas dos fallas; (c) confirmar que los rangos de deriva
   (3×–6× alto, 0.15×–0.35× bajo) son representativos de fallas reales de degradación
   de resistores en campo.
