# Ficha de práctica — Sonda de osciloscopio: atenuación, compensación, cursores y FFT (`mecanica-26`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** cuarta implementación del **molde P (panel de instrumento)** en D10
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`, d10-04), replicando el patrón validado en d10-01
> (`mecanica-12`, 4 casos), d10-02 (`mecanica-24`, 3 casos) y d10-03 (`mecanica-25`, 4 casos)
> — esta vez centrado en la **sonda de medición** en vez del instrumento: atenuación 1X/10X,
> compensación, cursores manuales y FFT/aliasing, con 4 casos guiados. Si la profundidad y
> el contrato de fidelidad son sostenibles, el patrón continúa en d10-05 (generador de
> funciones); si sobra o falta, se ajusta antes de seguir la tanda.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-26
sector: mecanica-electronica
practica_maestra: "d10-04 — Aplica FFT, cursores y sondas atenuadas 10:1 (molde P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.2 (Electrónica/Tecnología, resultado I.2)"   # ⚑ heredado del mapeo interno (LISTA-MAESTRA); a diferencia de d10-01/d10-02/d10-03 (ETR-I.1), este lab mapea a ETR-I.2 — confirmar clave exacta del plan vigente
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Análisis espectral y sondas de medición: atenuación, compensación, cursores y FFT"   # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ heredado del mismo anclaje que d10-03; verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de verificar que la posición física del selector
  1X/10X de una sonda coincide con el ajuste de canal del osciloscopio antes de confiar en
  una lectura de voltaje; compensar una sonda 10X frente a una señal de calibración
  reconociendo sub-compensación, compensación correcta y sobre-compensación por la forma de
  la traza; medir ΔV y Δt con cursores manuales evitando el error de mezclar cruces por cero
  de distinto tipo; e interpretar un espectro FFT real aplicando el criterio de Nyquist para
  distinguir una frecuencia genuina de un alias.
actividad_clave: >
  Resuelve 4 casos guiados (atenuación de sonda con recuperación del voltaje real cuando el
  selector y el canal no coinciden, compensación de una sonda 10X contra una onda cuadrada de
  calibración, medición con cursores manuales de voltaje y de tiempo, y FFT en vivo —DFT
  calculada sobre la señal capturada, no guionada— con aliasing genuino cuando la señal
  supera la frecuencia de Nyquist) sobre un osciloscopio digital con sonda atenuada 10:1.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los controles: selector deslizante 1X/10X en el cuerpo de la sonda, terminal de compensación dedicado en el osciloscopio, trimmer ajustable en la caja de compensación de la sonda, y los botones retroiluminados de Cursores y FFT/Math."
  - "Caso 1 (sonda, 6.0 V reales @ 1 kHz): ajusta la posición física del selector 1X/10X de la sonda y el ajuste de canal del osciloscopio hasta que coincidan; cuando NO coinciden, recupera el voltaje real aplicando el factor correcto (V_real = V_BNC × factor) y confirma que el instrumento no emite ninguna alarma propia — el error es silencioso."
  - "Caso 2 (compensación, onda cuadrada 1 kHz / 3 Vpp): ajusta el trimmer de una sonda 10X frente a la señal de calibración hasta lograr flancos rectos; identifica sub-compensada (esquinas redondeadas/lentas) y sobre-compensada (pico de sobrepaso seguido de asentamiento) por la FORMA de la traza, no por un número. Como referencia cuantificada de fabricante (no constante universal): el modo 10X de una sonda Tektronix P2220 reduce la carga capacitiva de 80–110 pF (1X) a 13–17 pF (10X) y extiende el ancho de banda utilizable de 6 MHz a 200 MHz; una sonda conmutable Keysight N2889A pasa de 60 pF/10 MHz (1:1) a 11 pF/150–500 MHz (10:1) — la compensación es lo que hace posible esa ganancia de ancho de banda sin distorsionar la forma de onda."
  - "Caso 3 (cursores, senoidal 400 Hz / 4 Vpp): mide ΔV con cursores de voltaje (colocados en pico y valle) y Δt con cursores de tiempo (abarcando un periodo completo, mismo tipo de cruce en ambos extremos); reproduce el error clásico de mezclar un cruce de subida con uno de bajada y observa cómo el Δt resultante mide medio periodo, no el periodo completo — un número que se ve razonable pero está mal por definición del evento medido."
  - "Caso 4 (FFT, F_s = 2000 Hz, N = 200 muestras, Δf = 10 Hz, Nyquist = 1000 Hz): calcula el espectro en vivo de 3 señales (200 Hz, 900 Hz, 1400 Hz); para las dos primeras el pico detectado coincide con la frecuencia real; para 1400 Hz —que supera Nyquist— el pico aparece reflejado en f_alias = |f_real − F_s| = 600 Hz, con advertencia visual de aliasing en pantalla."
  - "Abre la ficha técnica (capa 2) y contrasta qué modela el simulador (atenuación 1X/10X, compensación por 3 estados paramétricos, cursores ΔV/Δt, DFT real con aliasing genuino) contra lo que NO modela (ecuación diferencial real del RC compensador, ancho de banda propio de la sonda, ventanas de FFT, F_s/N configurables, ruido/jitter del cable de tierra)."
  - "Reporta cada caso con su lectura (voltaje real recuperado y coincidencia sonda/canal del Caso 1, estado de compensación identificado del Caso 2, ΔV/Δt e interpretación del Caso 3, pico detectado y presencia o ausencia de aliasing del Caso 4)."
normatividad:          # 🔒 verificado por contraste de fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §9)
  - "IEC 61010-031 Ed. 3.0:2022 — 'Safety requirements for hand-held and hand-manipulated probe assemblies for electrical test and measurement' (requisitos particulares de seguridad de sondas de medición manuales). Confirmada con 2 fuentes primarias de producto: manual Tektronix P2220 (tabla de certificaciones, fila Safety = 'IEC/EN 61010-031; 2002', el mismo documento también usa la forma legada 'EN61010-2-031:1994' en su encabezado, reflejo de la renumeración histórica de la norma) y guía Keysight N2862B/N2889A ('Conformance to CAN/CSA-C22.2 No. 61010-031:17/A1:20, ANSI/UL 61010-031 Ed. 2 + AMD 1:2020, IEC 61010-031: 2015/AMD1:2018'). IEC webstore confirma edición vigente 3.0:2022. Junto con IEC 61010-1 (ya ancla en multímetro, pinza y osciloscopio de este dominio), es la norma ancla de seguridad de esta práctica."
  - "Sin norma de exactitud de cumplimiento obligatorio para atenuación (±2–3 % típico de fabricante), ancho de banda o rango de capacitancia de compensación de una sonda — hallazgo negativo confirmado en paralelo al de §7/§8; estos valores son de hoja de datos del fabricante, no de una norma IEC/IEEE."
  - "Criterio de muestreo de Nyquist-Shannon (fundamento matemático del aliasing usado en el Caso 4): frecuencia de Nyquist = mitad de la tasa de muestreo; contenido por encima de ese límite se pliega hacia el espectro visible. Confirmado sin discrepancias contra múltiples fuentes técnicas independientes — es una referencia teórica, no una norma de instrumentación."
  - "Convenciones de cursor (voltaje/tiempo/seguimiento): universales entre fabricantes, confirmadas sin discrepancias contra 4 fuentes técnicas independientes (Teledyne LeCroy, Rohde & Schwarz/DesignSpark, EDN, guía de laboratorio universitaria) — no están gobernadas por ninguna norma; es una técnica de medición manual que complementa, no sustituye, las medidas automáticas del instrumento."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Atenuación de sonda 1X/10X y el error de lectura (×10 o ÷10) cuando el ajuste de canal no coincide con la posición física de la sonda."
  - "Compensación de una sonda 10X frente a una onda cuadrada de calibración en 3 estados (sub-compensada, correcta, sobre-compensada) mediante un modelo paramétrico ilustrativo de asentamiento exponencial."
  - "Cursores manuales de voltaje y de tiempo con cálculo de ΔV/Δt, incluyendo el error común de mezclar cruces por cero de distinto tipo."
  - "Una FFT real — DFT calculada en vivo sobre la señal capturada, no un resultado guionado — que exhibe resolución espectral (Δf = F_s/N) y aliasing genuino cuando la frecuencia de la señal supera la de Nyquist."
  - "Ficha técnica (capa 2) con el contrato de fidelidad (modela / NO modela) y componentes reales presentes/omitidos."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La ecuación diferencial real del circuito RC del compensador de la sonda — aquí es un modelo paramétrico ilustrativo, no una simulación de circuito."
  - "El ancho de banda ni el tiempo de subida propios de la sonda — el modelo no atenúa la señal en alta frecuencia; una sonda real tiene su propio punto −3 dB."
  - "Ruido de fondo, jitter ni resolución vertical del ADC."
  - "Ventanas de FFT (Hamming, Hanning, Blackman-Harris) — se usa ventana rectangular implícita, sin mostrar el compromiso entre resolución de frecuencia y fuga espectral (spectral leakage)."
  - "Frecuencia de muestreo ni profundidad de memoria configurables por el usuario — F_s y N quedan fijos por caso."
  - "Modelos comerciales específicos de sonda ni sus curvas de derateo de voltaje contra frecuencia."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 4 casos: voltaje real recuperado y coincidencia sonda/canal del Caso 1, estado de compensación identificado en el Caso 2, ΔV/Δt e interpretación del Caso 3, y pico detectado con presencia o ausencia de aliasing del Caso 4."
evidencia_desempeno: "Guía de observación de la secuencia de verificación ANTES de medir (posición física de la sonda contra el ajuste de canal, compensación con la señal de calibración) y de la elección correcta de tipo de cursor/evento según la magnitud que se quiere medir."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué ningún técnico serio confía en un número del osciloscopio sin antes verificar la sonda, la compensación y el criterio de muestreo (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos guiados (sonda, compensación, cursores, FFT) sobre un osciloscopio digital con sonda atenuada 10:1."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad y los parámetros representativos usados en el lab."
# --- Veracidad ---
fuentes:               # 🔒 verificadas mediante fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §9)
  - "Tektronix — manual de sonda P2220 (071-1464-00): tabla de certificaciones pág. 8, procedimiento y figura de compensación pág. 11, especificaciones eléctricas pág. 12 (fuente primaria directa, texto completo)."
  - "Keysight — guía de usuario N2862B/N2863B/N2889A/N2890A (N2889-97002, 5.ª edición, jul-2023), tabla de características pág. 8 (fuente primaria directa, texto completo)."
  - "IEC Webstore — IEC 61010-031 Ed. 3.0:2022 (edición vigente, sustituye Ed. 2.0:2015+AMD1:2018, que sustituyó 2002+AMD1:2008)."
  - "Rohde & Schwarz — nota técnica de compensación de sonda (filtro paso-bajo de la capacitancia de entrada del osciloscopio y el trimmer compensador)."
  - "Teledyne LeCroy; Rohde & Schwarz/DesignSpark; EDN; guía de laboratorio universitaria — convenciones de cursor (voltaje/tiempo/seguimiento), confirmadas sin discrepancias entre 4 fuentes independientes."
  - "Criterio de muestreo de Nyquist-Shannon — referencia teórica del aliasing, confirmada contra múltiples fuentes técnicas independientes."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.2 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); a diferencia de d10-01/d10-02/d10-03 (ETR-I.1), d10-04 mapea a ETR-I.2 — verificar contra el plan de estudios vigente antes de publicar la trazabilidad, incluyendo por qué cambia el resultado de aprendizaje respecto a los labs anteriores del mismo módulo."
  - "⚑ Los valores numéricos de cada caso (6.0 V reales @ 1 kHz del Caso 1; onda cuadrada 1 kHz/3 Vpp del Caso 2; senoidal 400 Hz/4 Vpp del Caso 3; F_s=2000 Hz, N=200, frecuencias de prueba 200/900/1400 Hz del Caso 4) son valores de enseñanza elegidos para que cada fenómeno sea observable con claridad, no la hoja de datos de un osciloscopio o sonda comercial específica."
  - "⚑ Las cifras de capacitancia/ancho de banda citadas en el Caso 2 (Tektronix P2220: 13–17 pF/200 MHz en 10X vs. 80–110 pF/6 MHz en 1X; Keysight N2889A: 11 pF/150–500 MHz vs. 60 pF/10 MHz) son de 2 sondas comerciales concretas, citadas como rango de fabricante — NO como constante universal de toda sonda 10:1."
  - "⚑ El hallazgo de que las convenciones de cursor no están gobernadas por una norma se confirmó contra 4 fuentes técnicas independientes, no contra un organismo de normalización — si un experto conoce una norma aplicable no detectada en esta investigación, debe señalarse."
  - "⚑ IEC 61010-031 queda confirmada como norma ancla de d10-04 con las 2 fuentes primarias de producto citadas arriba (mismo nivel de evidencia que IEC 61010-2-030 en d10-03) — confirmar que ningún otro dominio de este proyecto necesite citarla de forma distinta."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (cuarta implementación del molde P en D10):** d10-04 replica
   el molde P validado en d10-01 (`mecanica-12`, 4 casos), d10-02 (`mecanica-24`, 3 casos)
   y d10-03 (`mecanica-25`, 4 casos), esta vez centrado en la **sonda de medición** en vez
   del instrumento: atenuación 1X/10X, compensación, cursores manuales y FFT/aliasing, con
   4 casos guiados. Si la profundidad y el contrato de fidelidad son sostenibles, el patrón
   continúa en d10-05 (generador de funciones); si sobra o falta, se ajusta antes de
   continuar la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/osciloscopio-fft.html](../../../public/labs/osciloscopio-fft.html)) muestra
   el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que `mecanica-12`,
   `mecanica-24` y `mecanica-25`.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑,
   en particular por qué d10-04 mapea a ETR-I.2 y no a ETR-I.1 como los 3 labs anteriores
   del mismo módulo; (b) validar que los valores numéricos de enseñanza de los 4 casos sean
   razonables como valores didácticos; (c) confirmar que las cifras de capacitancia/ancho de
   banda citadas del Tektronix P2220 y Keysight N2889A se usan correctamente como ejemplo de
   fabricante y no como especificación universal de toda sonda 10:1.
