# Ficha de práctica — Osciloscopio digital: base de tiempo, acoplamiento y disparo (`mecanica-25`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** tercera implementación del **molde P (panel de instrumento)** en D10
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`, d10-03), replicando el patrón validado en d10-01
> (`mecanica-12`, 4 casos) y d10-02 (`mecanica-24`, 3 casos) — esta vez con 4 casos guiados
> (base de tiempo, acoplamiento, disparo, fase) sobre un instrumento de 2 canales. Si la
> profundidad y el contrato de fidelidad son sostenibles, el patrón continúa en d10-04…d10-05
> (FFT/cursores/sondas atenuadas, generador de funciones); si sobra o falta, se ajusta antes
> de seguir la tanda.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-25
sector: mecanica-electronica
practica_maestra: "d10-03 — Configura el osciloscopio: base de tiempo, acoplamiento y trigger (molde P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.1 (Electrónica/Tecnología, resultado I.1) · AUT-Y eléctrico"   # ⚑ heredado del mismo anclaje que d10-01/d10-02; confirmar claves exactas del plan vigente
modulo: "Instrumentación, diagnóstico y metrología (D10)"
submodulo: "Medición de señales en el tiempo: osciloscopio digital"          # ⚑ confirmar clave exacta
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de configurar la base de tiempo y volts/división de
  un osciloscopio digital para leer correctamente periodo, frecuencia, Vpp y V_rms de una
  señal periódica; elegir el modo de acoplamiento (AC/DC/GND) según qué componente de la
  señal necesita observar; explicar el comportamiento de los 3 modos de disparo (Auto, Normal,
  Single) frente a un nivel de disparo dentro y fuera del rango de la señal; y medir el
  desfase entre dos canales por el método de cruces por cero.
actividad_clave: >
  Resuelve 4 casos guiados (base de tiempo con lectura de T/f/Vpp/V_rms, acoplamiento con
  aislamiento de offset de CD, disparo con nivel dentro y fuera de rango en los 3 modos, y
  fase entre 2 canales por cruces por cero) sobre un osciloscopio digital de 2 canales,
  cuantificando en cada uno el parámetro correspondiente.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Identifica los controles básicos del osciloscopio: base de tiempo (horizontal, time/div), volts/división (vertical, por canal) y nivel/modo de disparo — y las 2 entradas BNC (CH1 referencia, CH2 comparación)."
  - "Caso 1 (base de tiempo, señal de 500 Hz): prueba 3 valores de time/div (rápido/correcto/lento) hasta que la traza muestre 2–5 ciclos completos sin recortarse ni comprimirse; lee T = divisiones×time/div, calcula f = 1/T, y con volts/div correcto lee Vpp = 2×V_pico y V_rms = V_pico×0.707."
  - "Caso 2 (acoplamiento, señal con offset de CD): usa GND para fijar la referencia de 0 V en pantalla; cambia a DC y mide cuánto se desplaza la traza respecto a esa marca (el offset de CD); cambia a AC y observa cómo el filtro paso-alto (corte típico 5–10 Hz) retira esa componente y centra la traza en 0 V."
  - "Caso 3 (disparo, nivel +3.0 V sobre señal de ±2.0 V): en modo Normal con el nivel fuera de rango, observa 'SIN DISPARO' (pantalla sin sincronizar); baja el nivel dentro del rango de la señal y observa 'DISPARADO (estable)'; cambia a Auto con el nivel fuera de rango y observa 'BARRIDO FORZADO' (traza visible pero no sincronizada); cambia a Single, arma una captura y verifica que la pantalla se congela y NO se actualiza hasta rearmar."
  - "Caso 4 (fase entre 2 canales): con CH1 como referencia y CH2 la misma señal retrasada por un circuito bajo prueba, mide Δt entre cruces por cero equivalentes de ambos canales y calcula Δφ° = 360°×(Δt/T)."
  - "Abre la ficha técnica (capa 2) y contrasta qué modela el simulador (Vpp/V_rms, f=1/T, acoplamiento, máquina de estados del disparo, fase por cruces por cero) contra lo que NO modela (ancho de banda real, muestreo/aliasing, resolución del ADC, ruido y jitter de disparo, sondas atenuadas 10:1, FFT)."
  - "Reporta cada caso con su lectura (T, f, Vpp, V_rms, offset de CD, estado de disparo o Δφ° según corresponda) y el fenómeno identificado."
normatividad:          # 🔒 verificado por contraste de fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §8)
  - "IEC 61010-2-030 Ed. 3.0:2023-09-20 — Particular requirements for equipment having testing or measuring circuits which are connected for test or measurement purposes to devices or circuits outside the measurement equipment itself (requisitos particulares de seguridad de osciloscopios y equipos de medición similares). Confirmada en fuente primaria directa (datasheet Tektronix TBS1000C, sección Regulatory: UL/EN/CAN-CSA 61010-2-030) y corroborada en Keysight Infiniium XR8, Rigol DS7000/DS8000 y Siglent SDS1000X-E/X-U. Junto con IEC 61010-1 (ya ancla d10-01), es la norma ancla de seguridad de este instrumento."
  - "Sin norma IEC/IEEE de exactitud de cumplimiento obligatorio para osciloscopios (hallazgo negativo confirmado por contraste): IEEE 1057-2017 ('IEEE Standard for Digitizing Waveform Recorders') existe como marco voluntario de especificación y método de prueba, pero no aparece citado en las secciones de certificación/cumplimiento de los datasheets revisados. Ancho de banda, exactitud vertical y horizontal siguen siendo de hoja de datos del fabricante."
  - "IEC 61010-031 Ed. 3.0:2022 (seguridad de puntas/sondas de medición manuales) gobierna las sondas del osciloscopio, no el instrumento mismo — se reserva para d10-04, donde la sonda atenuada 10:1 es el objeto de estudio explícito, en vez de citarse aquí donde el objeto es el instrumento con conexión de sonda genérica."
# --- Fidelidad del simulador (contrato anti-sobreafirmación) ---
simulador_modela:      # 🔒
  - "Relación Vpp = 2×V_pico y V_rms = V_pico×0.707 (=V_pico/√2) de una onda senoidal, y la lectura de f=1/T por conteo directo de divisiones en pantalla."
  - "Recorte (clipping) de la traza cuando volts/div es demasiado pequeño para la amplitud de la señal."
  - "Acoplamiento DC (señal completa), AC (filtro paso-alto que retira la CD, corte típico 5–10 Hz) y GND (referencia de 0 V, sin señal)."
  - "Los 3 modos de disparo — Auto, Normal y Single — con su máquina de estados de armado/captura y qué ocurre cuando el nivel de disparo cae fuera del rango de la señal (SIN DISPARO en Normal, BARRIDO FORZADO en Auto, retención hasta rearmar en Single)."
  - "Medición de desfase entre 2 canales por el método de cruces por cero: Δφ° = 360°×(Δt/T)."
  - "Ficha técnica (capa 2) con el contrato de fidelidad (modela / NO modela) y componentes reales presentes/omitidos."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Ancho de banda real del instrumento ni su punto −3 dB en alta frecuencia — el modelo responde igual de plano a cualquier frecuencia usada en el lab."
  - "Muestreo digital ni aliasing por sub-muestreo — la traza se calcula como función matemática continua, no como muestras discretas de un ADC."
  - "Resolución vertical del ADC — la traza es continua; un osciloscopio real cuantiza la señal en escalones (típicamente 8 bits en equipos de gama de entrada)."
  - "Ruido de fondo ni jitter de disparo — la traza y el instante de disparo son deterministas."
  - "Curva de atenuación exacta del filtro de acoplamiento AC — aquí se simplifica como remoción limpia de la CD por encima del corte."
  - "Sondas atenuadas 10:1 con su ajuste de compensación (se estudian en d10-04) ni la selección de flanco de disparo o modos avanzados (ancho de pulso, video)."
  - "Análisis FFT/espectral, cursores de medición manual, memoria de formas de onda, funciones de persistencia/promediado, ni modelos comerciales específicos."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Reporte de los 4 casos: T/f/Vpp/V_rms del Caso 1, offset de CD identificado en el Caso 2, estado de disparo en cada modo del Caso 3, y Δφ° calculado en el Caso 4."
evidencia_desempeno: "Guía de observación de la secuencia de ajuste de base de tiempo/volts-div ANTES de leer, y de la elección correcta de modo de disparo según si la señal es periódica estable, intermitente o un evento único."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué el osciloscopio deja VER la señal donde el multímetro solo da un número (briefing.ts)."
desarrollo: "Práctica en el simulador: 4 casos guiados (base de tiempo, acoplamiento, disparo, fase) sobre un osciloscopio de 2 canales."
cierre: "Ficha técnica (capa 2) con el contrato de fidelidad y los parámetros representativos usados en el lab."
# --- Veracidad ---
fuentes:               # 🔒 verificadas mediante fuentes primarias (docs/VERIFICACION-LISTA-MAESTRA.md §8)
  - "Tektronix — datasheet TBS1000C, sección Regulatory (fuente primaria directa de la norma ancla de seguridad)."
  - "Keysight — datasheet Infiniium XR8 (corroboración de IEC 61010-2-030)."
  - "Rigol — certificación EN 61010-2-030:2010 de las series DS7000/DS8000."
  - "Siglent — manual de usuario SDS1000X-E/X-U."
  - "IEC Webstore — IEC 61010-2-030 Ed. 3.0:2023-09-20; IEC 61010-031 Ed. 3.0:2022."
  - "IEEE SA — IEEE 1057-2017 ('IEEE Standard for Digitizing Waveform Recorders'), marco voluntario."
  - "Keysight Blogs, Tektronix, Picotech — notas técnicas de acoplamiento AC / respuesta en baja frecuencia."
  - "Unicrom, ISA Uniovi, UCO — fuentes técnicas en español para disparo (trigger), Vpp/V_rms y medida de fase por cruces por cero."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.1 / AUT-Y / submodulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA), heredadas del mismo anclaje que d10-01/d10-02; verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Los valores numéricos de cada caso (señal de 500 Hz, offset de CD ≈2.5 V, nivel de disparo +3.0 V sobre señal de ±2.0 V, Δt=0.5 ms/T=4 ms → Δφ=45°) son valores de enseñanza elegidos para que el fenómeno sea observable con claridad, no la hoja de datos de un osciloscopio o señal comercial específica."
  - "⚑ El corte del filtro de acoplamiento AC se documenta como rango (5–10 Hz) porque varía por fabricante/modelo (Tektronix TDS1000B/2000B usan 10 Hz, Rigol 1000Z usa 5 Hz) — no existe una cifra única de norma; confirmar que la ficha técnica del simulador siga comunicando esto como rango, nunca como valor fijo."
  - "⚑ IEC 61010-031 (sondas) se reserva íntegramente para d10-04 — esta ficha NO la trata como norma ancla de d10-03 porque el objeto de estudio aquí es el instrumento, no la sonda; confirmar que d10-04 la retome con su propia verificación de fuente primaria."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (tercera implementación del molde P en D10):** d10-03 replica
   el molde P validado en d10-01 (`mecanica-12`, 4 casos) y d10-02 (`mecanica-24`, 3 casos),
   esta vez sobre un instrumento de 2 canales con 4 casos (base de tiempo, acoplamiento,
   disparo, fase). Si la profundidad y el contrato de fidelidad son sostenibles, se replica
   en d10-04…d10-05 (FFT/cursores/sondas atenuadas, generador de funciones); si sobra o
   falta, se ajusta antes de continuar la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/osciloscopio.html](../../../public/labs/osciloscopio.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela), igual que `mecanica-12` y `mecanica-24`.
3. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) validar que los valores numéricos de enseñanza (offset de CD, nivel de disparo,
   Δt/T del Caso 4) sean razonables como valores didácticos; (c) confirmar que reservar
   IEC 61010-031 (sondas) para d10-04 en vez de citarla aquí es el enrutamiento normativo
   correcto, dado que ningún datasheet de instrumento revisado la cita como propia.
