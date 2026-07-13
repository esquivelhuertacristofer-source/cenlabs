# Ficha de práctica — Generador de funciones: carga, forma de onda, barrido en frecuencia y offset de CD (`mecanica-27`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** quinta implementación del **molde P (panel de instrumento)** en D10
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`, d10-05), replicando el patrón validado en d10-01
> (`mecanica-12`, 4 casos), d10-02 (`mecanica-24`, 3 casos), d10-03 (`mecanica-25`, 4 casos)
> y d10-04 (`mecanica-26`, 4 casos) — esta vez centrado en el **generador de funciones**: el
> instrumento que crea la señal en vez de recibirla, con 4 casos guiados (carga/impedancia,
> forma de onda/espectro, barrido/Bode, offset de CD). d10-06 (escáner OBD-II) ya existe como
> `mecanica-11` fuera de esta tanda; a partir de d10-07 el molde cambia a P+S (panel +
> sistema) para retomar el diagnóstico automotriz.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-27
sector: mecanica-electronica
practica_maestra: "d10-05 — Caracteriza sistemas con el generador de funciones (molde P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I (Electrónica/Tecnología, resultado I)"   # ⚑ heredado del mapeo interno (LISTA-MAESTRA); la tabla no trae sufijo decimal como d10-01/02/03 (ETR-I.1) o d10-04 (ETR-I.2) — confirmar si reutiliza uno de esos dos o es un tercer resultado
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Generación de señales y caracterización de sistemas: carga, forma de onda, barrido en frecuencia y offset de CD"   # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado del mismo anclaje que d10-04; verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de verificar que el ajuste de carga (Load: 50 Ω /
  Hi-Z) de un generador de funciones coincide con la impedancia realmente conectada antes de
  confiar en la amplitud indicada en su panel; distinguir el contenido espectral de una onda
  senoidal pura frente a una onda cuadrada mediante un análisis FFT; caracterizar la respuesta
  en frecuencia de un circuito mediante un barrido y ubicar su punto de −3 dB; y calcular el
  offset de CD máximo admisible sobre una señal alterna antes de que el circuito la recorte
  (clipping).
actividad_clave: >
  Resuelve 4 casos guiados (ajuste de carga 50 Ω/Hi-Z del generador con recuperación de la
  amplitud real cuando el ajuste no coincide con la carga conectada, comparación espectral de
  onda senoidal contra onda cuadrada mediante FFT en vivo, barrido en frecuencia de un filtro
  RC con localización del punto de −3 dB, y offset de CD creciente sobre una señal AC hasta
  producir recorte genuino) sobre un generador de funciones con osciloscopio de verificación.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los controles: perillas de amplitud/frecuencia/offset del generador, botones retroiluminados para elegir forma de onda senoidal o cuadrada, selector deslizante de carga (Load: 50 Ω / Hi-Z), salida BNC, terminador de 50 Ω opcional para la entrada del osciloscopio, y el módulo accesorio de filtro RC de un polo."
  - "Caso 1 (carga, 2.0 Vpp programados @ 1 kHz): recorre las 4 combinaciones de ajuste Load del generador (50 Ω / Hi-Z) contra la carga realmente conectada (50 Ω / Hi-Z). Coincidencia 50Ω/50Ω y coincidencia Hi-Z/Hi-Z miden 2.00 Vpp (correcto); Load=50Ω con carga real Hi-Z mide 4.00 Vpp (el doble, factor ×2 verificado en hoja de fabricante); Load=Hi-Z con carga real 50Ω mide 1.00 Vpp (la mitad) — en ambos casos de discordancia, el instrumento no emite ninguna alarma propia: el error es silencioso."
  - "Caso 2 (forma de onda, 100 Hz, F_s = 2000 Hz, N = 200 muestras, Δf = 10 Hz, Nyquist = 1000 Hz): compara el espectro de una onda senoidal (un solo pico en 100 Hz) contra una onda cuadrada (5 picos bajo Nyquist, en 100/300/500/700/900 Hz — armónicos impares con amplitud decreciente) y explica por qué solo la cuadrada se clasifica como 'rica en armónicos'."
  - "Caso 3 (barrido/Bode, filtro RC de un polo: R = 1.6 kΩ, C = 100 nF, f_c ≈ 995 Hz): registra la ganancia en 100 Hz (≈0 dB, banda de paso, lejos del corte), 1 kHz (≈−3.0 dB, sobre el punto de corte) y 6 kHz (fuertemente negativa, < −14 dB) y, entre las opciones 100/400/1000/6000 Hz, identifica cuál está más cerca del punto de −3 dB (≈70.7 % de la ganancia máxima)."
  - "Caso 4 (offset de CD, amplitud AC fija 1.0 V pico @ 1 kHz, rango del circuito ±2.5 V): programa offsets crecientes (0, +1.0, +1.8, +2.2 V) y calcula el pico máximo esperado (V_offset + V_amplitud) antes de leerlo en pantalla; identifica que 0 V y +1.0 V quedan dentro de rango (2.00 V < 2.5 V) mientras que +1.8 V (2.80 V) y +2.2 V (3.20 V) exceden el rail y producen recorte (clipping) real."
  - "Abre la ficha técnica (capa 2) y contrasta qué modela el simulador (impedancia de salida y factor ×2 de carga, DFT real con armónicos genuinos, barrido con cálculo real de ganancia y punto de −3 dB, apilamiento de offset con recorte genuino) contra lo que NO modela (topología interna del generador, distorsión armónica propia, planitud de amplitud contra frecuencia, tiempo de flanco finito, tolerancias reales de R/C)."
  - "Reporta cada caso con su lectura (coincidencia o no del ajuste de carga y factor aplicado en el Caso 1, forma de onda y número de picos espectrales del Caso 2, ganancia en dB y frecuencia más cercana al punto de −3 dB del Caso 3, y offset de CD máximo admisible antes del recorte del Caso 4)."
normatividad:          # 🔒 verificado por contraste de fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §10)
  - "IEC 61010-1 — requisitos generales de seguridad para equipo eléctrico de medición, control y laboratorio; sin norma particular IEC 61010-2-0XX específica para generadores de funciones/formas de onda, a diferencia de multímetros, pinzas, osciloscopios y sondas de este mismo dominio, que sí tienen Parte 2 dedicada. Confirmado por ausencia en 2 hojas de datos primarias leídas íntegramente: Rigol DG1000Z (DSB09103-1110-202511, 9 pp.) y Keysight 33500B/33600A Trueform (5992-2572EN, ed. 2024-10-17, 24 pp.); ninguna cita una norma de exactitud, solo IEC 61010-1 de seguridad general. Es la norma ancla de esta práctica. Consistente con el alcance de IEC 61010-2-030 ('for the purposes of testing or measurement'), que excluye a un instrumento que inyecta señales en vez de medirlas (docs/VERIFICACION-LISTA-MAESTRA.md §8)."
  - "Impedancia de salida nominal de 50 Ω y el factor ×2 de amplitud entre carga de 50 Ω y circuito abierto: dato textual de hoja de fabricante, no de una norma — Keysight 33500B/33600A pág. 17: '1 mVpp to 10 Vpp into 50 Ω... / 2 mVpp to 20 Vpp into open circuit'. Rigol DG1000Z confirma la misma impedancia nominal de 50 Ω."
  - "Exactitud de amplitud vs. exactitud de frecuencia: asimetría confirmada dentro de la misma hoja de datos Rigol (amplitud marcada 'Typical', no garantizada; frecuencia sin esa marca, garantizada implícitamente) frente a Keysight (ambas marcadas '(spec)', desempeño garantizado y calibrado) — 'sin norma de exactitud' significa que no existe una cifra armonizada externamente entre fabricantes, no que el fabricante nunca la garantice."
  - "Criterio de −3 dB (≈70.7 % de la ganancia máxima) como definición convencional del ancho de banda o frecuencia de corte de un filtro — mismo criterio ya usado en la práctica de osciloscopio de este dominio (d10-02, `docs/VERIFICACION-LISTA-MAESTRA.md` §8); fundamento de teoría de circuitos, no una norma de instrumentación."
  - "Serie de Fourier de una onda cuadrada (armónicos impares, amplitud ∝ 1/n) y criterio de muestreo de Nyquist-Shannon: mismo fundamento matemático ya aplicado en la práctica de FFT de este dominio (d10-04, `mecanica-26`)."
  - "Corroboración adicional de menor solidez, señalada por transparencia y no ocultada: Tektronix AFG31000 (documento de conformidad dedicado, hallazgo de sesión previa) y Siglent SDG1000X (resumen de búsqueda, sin verificación contra documento primario en esta sesión) — ambos consistentes con el hallazgo de 'sin Parte 2 aplicable', pero con menor nivel de evidencia que Rigol/Keysight."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "La impedancia de salida nominal de 50 Ω de un generador de funciones y el error de amplitud (factor ×2, dato de hoja de fabricante) cuando el ajuste de carga del generador no coincide con la impedancia realmente conectada."
  - "El contenido espectral genuino, mediante una DFT calculada en vivo y no un resultado guionado, de una onda cuadrada (fundamental + armónicos impares) frente a una onda senoidal pura (un solo tono)."
  - "El barrido en frecuencia de un filtro RC pasabajas de un polo con cálculo real de ganancia (V_out/V_in) y de ganancia en decibeles, y la ubicación del punto de −3 dB a partir de f_c = 1/(2πRC)."
  - "El apilamiento de un offset de CD sobre una señal alterna, con recorte (clipping) real cuando la suma V_offset + V_amplitud excede el rango disponible del circuito."
  - "Ficha técnica (capa 2) con el contrato de fidelidad (modela / NO modela) y componentes reales presentes/omitidos."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Modelos comerciales específicos de generador de funciones ni todas sus formas de onda disponibles (triangular, rampa, pulso, arbitraria)."
  - "Ruido de fase, jitter o distorsión armónica propia (THD) del generador — la senoidal del modelo es matemáticamente pura."
  - "La planitud de amplitud contra frecuencia (flatness) de la fuente — se asume ideal; solo la carga (Caso 1) y el filtro RC externo (Caso 3) modifican la señal."
  - "La respuesta transitoria del filtro RC — solo su respuesta en régimen permanente (barrido en frecuencia)."
  - "Tolerancias reales de componentes (R, C) que desplazarían la f_c calculada respecto del valor nominal."
  - "El tiempo de subida/bajada finito de la onda cuadrada real, ni protecciones de sobrevoltaje o límites de corriente de salida del instrumento."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 4 casos: coincidencia o no del ajuste de carga con la amplitud medida y factor aplicado en el Caso 1, forma de onda y número de picos espectrales identificados en el Caso 2, ganancia en dB y frecuencia más cercana al punto de −3 dB en el Caso 3, y offset de CD máximo admisible antes del recorte en el Caso 4."
evidencia_desempeno: "Guía de observación de la secuencia de verificación ANTES de medir (ajuste de carga del generador contra la impedancia realmente conectada, cálculo del pico máximo esperado antes de programar un offset de CD) y del razonamiento correcto al ubicar el punto de −3 dB a partir de datos de barrido, no por adivinanza."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué ningún técnico confía en la amplitud indicada en el panel de un generador de funciones sin antes verificar la carga, la forma de onda y el rango disponible del circuito (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos guiados (carga, forma de onda, barrido/Bode, offset de CD) sobre un generador de funciones con osciloscopio de verificación."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad y los parámetros representativos usados en el lab."
# --- Veracidad ---
fuentes:               # 🔒 verificadas mediante fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §10)
  - "Rigol Technologies — hoja de datos DG1000Z Series Function/Arbitrary Waveform Generator (DSB09103-1110-202511), 9 pp., fuente primaria directa, texto completo leído."
  - "Keysight Technologies — hoja de datos 33500B/33600A Trueform Series Waveform Generators (5992-2572EN, ed. 2024-10-17), 24 pp., fuente primaria directa, texto completo leído; cita textual pág. 17 del factor ×2 de carga."
  - "Tektronix — AFG31000 Series (documento de conformidad dedicado; hallazgo de sesión previa, no releído en esta sesión)."
  - "Siglent — SDG1000X Series (resumen de búsqueda, sin verificación contra documento primario en esta sesión — evidencia más débil, señalada explícitamente en vez de homogeneizarla con el resto)."
  - "IEC Webstore — alcance de IEC 61010-2-030 ('for the purposes of testing or measurement'), usado para confirmar por qué un generador de funciones (que inyecta, no mide) queda fuera de esa Parte 2 (docs/VERIFICACION-LISTA-MAESTRA.md §8)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (programa_oficial): LISTA-MAESTRA-200-PRACTICAS.md mapea d10-05 a 'ETR-I' genérico, sin el sufijo decimal que sí tienen d10-01/02/03 (ETR-I.1) y d10-04 (ETR-I.2) — no está claro si esto significa que d10-05 reutiliza ETR-I.1, reutiliza ETR-I.2, o corresponde a un tercer resultado sin registrar; confirmar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Los valores numéricos de cada caso (2.0 Vpp @ 1 kHz del Caso 1; onda senoidal/cuadrada de 100 Hz del Caso 2; filtro RC 1.6 kΩ/100 nF del Caso 3; amplitud AC 1.0 V pico @ 1 kHz y rail ±2.5 V del Caso 4) son valores de enseñanza elegidos para que cada fenómeno sea observable con claridad, no la hoja de datos de un generador comercial específico — así lo declara también la ficha técnica del simulador (capa 2)."
  - "⚑ El factor ×2 del Caso 1 sí es un dato textual de hoja de fabricante (Keysight 33500B/33600A, pág. 17), pero corresponde a un modelo concreto — otros fabricantes o modelos podrían especificar un comportamiento distinto de carga; se cita como ejemplo verificado, no como constante universal de todo generador de funciones."
  - "⚑ Siglent SDG1000X permanece como evidencia de sesión previa sin re-verificación contra documento primario en esta sesión — nivel de evidencia más débil que Rigol/Keysight, señalado explícitamente."
  - "⚑ IEC 61010-1 queda confirmada como única norma ancla de d10-05 (sin Parte 2 aplicable) con las 2 fuentes primarias citadas arriba (mismo nivel de evidencia que en d10-02/03/04) — confirmar que ningún organismo de normalización haya publicado una Parte 2 para generadores de funciones después de la fecha de esta verificación."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (quinta y última implementación planificada de molde P puro en
   D10 antes de retomar el diagnóstico automotriz):** d10-05 replica el molde P validado en
   d10-01 (`mecanica-12`, 4 casos), d10-02 (`mecanica-24`, 3 casos), d10-03 (`mecanica-25`,
   4 casos) y d10-04 (`mecanica-26`, 4 casos), esta vez centrado en el **generador de
   funciones**: carga/impedancia, forma de onda/espectro, barrido/Bode y offset de CD, con
   4 casos guiados. d10-06 (escáner OBD-II) ya existe como `mecanica-11` fuera de esta tanda;
   a partir de d10-07 el molde cambia a P+S (panel + sistema) para los labs de diagnóstico
   automotriz que siguen (misfire, readiness, bus CAN, ECU).
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/generador-funciones.html](../../../public/labs/generador-funciones.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que
   `mecanica-12`, `mecanica-24`, `mecanica-25` y `mecanica-26`.
3. **Petición concreta al experto:** (a) confirmar o corregir la clave curricular ETR-I
   genérica — en particular, si corresponde a ETR-I.1, ETR-I.2, o a un tercer resultado no
   registrado; (b) validar que los valores numéricos de enseñanza de los 4 casos sean
   razonables como valores didácticos; (c) confirmar que el factor ×2 citado de Keysight
   33500B/33600A se usa correctamente como ejemplo de fabricante y no como especificación
   universal de todo generador de funciones.
4. **Diferencia respecto a d10-04:** mientras d10-04 (sonda) trataba la recepción fiel de una
   señal ya dada, d10-05 (generador) trata la creación de la señal misma — completa el par
   fuente/receptor de este bloque de instrumentación del dominio D10.
