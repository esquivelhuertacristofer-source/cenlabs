# Ficha de práctica — MOSFET de canal N: regiones de operación y driver de compuerta (`mecanica-22`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** novena práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Primera práctica de D2 centrada en un
> transistor de efecto de campo (MOSFET) en vez de un dispositivo bipolar — a diferencia
> de mecanica-14/18 (diodo, motor de Shockley) y mecanica-19/20/21 (BJT, corriente de base
> controla corriente de colector), aquí la compuerta es capacitiva (VGS controla ID sin
> corriente DC de entrada) y el eje pedagógico se traslada hacia la ley cuadrática de canal
> largo, la dispersión de fábrica de Vth, y un primer acercamiento de primer orden al
> dimensionamiento del driver de compuerta a partir de Qg.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-22
sector: mecanica-electronica
practica_maestra: "d2-09 — Caracteriza el MOSFET y su driver de compuerta: regiones de operación (corte/saturación/óhmica) por ley cuadrática ID=k·(VGS−Vth)², y dimensionamiento de un driver a partir de la carga de compuerta Qg (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 (Mecatrónica, Módulo I, Submódulo 2)"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Dispositivos de conmutación de potencia: transistores de efecto de campo (MOSFET)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-19/20/21; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de identificar la región de operación (corte,
  saturación, óhmica/triodo) de un MOSFET de canal N en fuente común a partir de VGS, Vth y
  el punto de trabajo sobre la recta de carga; resolver la corriente de drenaje ID y el
  voltaje VDS de forma autoconsistente en cualquier región, incluyendo la transición
  continua hacia la zona óhmica; explicar por qué el umbral Vth de un MOSFET real varía
  entre unidades del mismo modelo (dispersión de fábrica) y cómo afecta al punto de
  operación un circuito que no lo considera; y dimensionar de forma aproximada un driver de
  compuerta a partir de la carga total de compuerta Qg del dispositivo, distinguiendo esa
  estimación de primer orden de los efectos de segundo orden (meseta de Miller, impedancia
  no ideal del driver) que no cubre.
actividad_clave: >
  Sobre un banco 3D con fuente, resistencia de drenaje y driver de compuerta, en el modo
  Explora ajusta VDD/RD/VGS y el umbral Vth con steppers, elige entre tres MOSFET (IRF540N,
  IRLZ44N, 2N7000) y cuatro niveles de corriente de driver, observando en tiempo real cómo
  cambian la región de operación, el punto (VDS, ID) sobre la recta de carga y el tiempo de
  encendido estimado; en Predicción, predice la región de operación o los valores
  aproximados de ID/VDS antes de que el simulador lo confirme, con un Vth sorteado dentro
  del rango real de fábrica del dispositivo elegido; en Barrido, recorre Vth dentro de ese
  mismo rango de fábrica y observa cuánto se desplaza el punto de operación solo por
  dispersión de manufactura; y en el Reto, ajusta VGS para que el dispositivo quede en
  región óhmica (triodo) de forma robusta en ambos extremos del rango de Vth de fábrica, no
  solo en el valor típico.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: MOSFET de canal N en fuente común, con RD como resistencia de drenaje, VDD como fuente de alimentación, y un bloque de driver de compuerta con cuatro niveles de corriente seleccionables."
  - "Modo Explora: ajusta VDD/RD/VGS y Vth con los steppers del panel, elige entre tres MOSFET (IRF540N, IRLZ44N, 2N7000) y observa la región de operación, el punto (VDS, ID) y el tiempo de encendido estimado actualizarse en tiempo real."
  - "Verifica que el motor resuelve las tres regiones en forma cerrada y autoconsistente: corte (VGS≤Vth ⇒ ID=0, VDS=VDD), saturación (ID=k·VOV² cuando el VDS resultante de la recta de carga es mayor o igual a VOV=VGS−Vth), y óhmica/triodo (cuando VDS<VOV, se resuelve la ecuación cuadrática k·RD·VDS²−(2·k·RD·VOV+1)·VDS+VDD=0 por discriminante, seleccionando la raíz físicamente válida en [0, VOV] en vez de usar una aproximación lineal) — confirmado por el autor contra un barrido numérico independiente de fuerza bruta (resolución 0.5 mV) con error menor a 0.01 en ambas variables."
  - "Verifica que k se deriva del gfs mínimo garantizado de hoja de datos vía k=gfs²/(4·ID_test) — una extensión propia del simulador, declarada como tal, no una cifra de catálogo directa — y que el umbral Vth se trata como un rango real de fábrica (no un valor único 'típico'), explorable con el slider en Explora y sorteado dentro de ese rango en Predicción/Barrido/Reto."
  - "Modo Predicción: predice la región de operación (tipo A) o los valores aproximados de ID/VDS (tipo B, tolerancia definida por campo) antes de que el simulador confirme la respuesta, con Vth sorteado dentro del rango real de fábrica del dispositivo elegido."
  - "Modo Barrido: recorre Vth linealmente en 17 pasos dentro del rango de fábrica del dispositivo, con VGS/VDD/RD fijos, y reporta cuánto se desplaza VDS solo por la dispersión de manufactura entre unidades del mismo modelo."
  - "Modo Reto: ajusta VGS para que el dispositivo quede en región óhmica (triodo) tanto en el extremo mínimo como en el extremo máximo del rango de Vth de fábrica simultáneamente — un diseño robusto a la dispersión real, no solo válido para un Vth típico — con advertencia adicional si ID excede el máximo de catálogo en cualquiera de los dos extremos."
  - "Verifica el dimensionamiento del driver de compuerta: selecciona entre cuatro niveles de corriente de driver (GPIO directo ~20 mA, buffer lógico ~50 mA, driver dedicado ~500 mA, driver de alta corriente ~2 A) y observa el tiempo de encendido estimado ton≈Qg/Idriver recalcularse; para el 2N7000 (sin Qg de hoja de datos disponible), el panel declara explícitamente que la estimación no está disponible en vez de inventar una cifra."
  - "Verifica las advertencias de telemetría en vivo de sobrecorriente (ID>ID máx de catálogo) y sobrepotencia (ID·VDS>Ptot de catálogo), entendiendo que son comparaciones contra límites estáticos de hoja de datos, no un modelo térmico dinámico — el simulador advierte pero no detiene ni reclama el cálculo cuando se exceden."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito: MOSFET de canal N, resistencia de drenaje, bloque de driver de compuerta)."
  - "⚑ No se identificó una NOM mexicana que aplique directamente al diseño de circuitos de conmutación con MOSFET a nivel de componente — mismo hueco normativo ya documentado en mecanica-19/d2-06, mecanica-20/d2-07 y mecanica-21/d2-08. La práctica hermana d2-10 (pérdidas de conmutación en PWM) podría tener mayor cercanía a normas de eficiencia energética; confirmar con el equipo curricular."
simulador_modela:      # 🔒
  - "Las tres regiones de operación del MOSFET de canal N en forma cerrada y autoconsistente: corte, saturación (ley cuadrática ID=k·VOV²) y óhmica/triodo (solución cuadrática exacta de la intersección con la recta de carga, no una aproximación lineal por RDS(on)) — verificado por el autor contra un barrido numérico de fuerza bruta independiente (0.5 mV de resolución), con error menor a 0.01 en VDS e ID."
  - "Tres dispositivos con parámetros de hoja de datos declarados (IRF540N, IRLZ44N, 2N7000), incluyendo el umbral Vth como rango real mínimo–máximo de fábrica (nunca un valor 'típico' inventado) y k derivado del gfs mínimo garantizado — extensión propia del simulador, declarada como tal en el propio panel."
  - "Dispersión real de fábrica de Vth explorable en tres modos distintos: slider libre en Explora, sorteo dentro del rango real en Predicción, barrido animado de 17 puntos en el rango completo en modo Barrido, y verificación en ambos extremos simultáneamente en modo Reto."
  - "Dimensionamiento de primer orden del driver de compuerta (ton≈Qg/Idriver) sobre cuatro niveles de corriente de driver seleccionables, con manejo explícito de la ausencia de Qg de hoja de datos para el 2N7000 (declara 'no disponible' en vez de inventar una cifra)."
  - "Advertencias de telemetría en vivo contra los límites estáticos de hoja de datos del dispositivo elegido: ID máximo y potencia total disipada (Ptot)."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "RDS(on) NO se usa en ningún cálculo del motor — se muestra en el panel únicamente como referencia de catálogo (marcado ⚑). La región óhmica se resuelve con la ley cuadrática completa (autoconsistente con la recta de carga), no con una aproximación lineal ID≈VDS/RDS(on). El uso real de RDS(on) para calcular pérdidas de conducción (Pcond=I²·RDS(on)) es precisamente el eje de la práctica hermana d2-10 (mecanica-23, pendiente), por lo que esta omisión es un límite de alcance intencional de d2-09, no un olvido — a confirmar con el experto."
  - "Dependencia de RDS(on) y Vth con la temperatura, ni autocalentamiento del dispositivo bajo operación sostenida — todos los parámetros se tratan como constantes a la temperatura de prueba de hoja de datos (usualmente TC=25°C)."
  - "Capacitancias no lineales completas (Ciss, Coss, Crss) en función de VDS — el simulador solo usa la carga total de compuerta Qg (a un VDS/VGS de prueba fijo de hoja de datos) para el dimensionamiento del driver, no las curvas de capacitancia variables."
  - "La meseta de Miller (Miller plateau) explícita en la curva de encendido — ton≈Qg/Idriver es una estimación de primer orden que ignora la fase de meseta donde VGS se mantiene aproximadamente constante mientras Crss se carga contra el cambio de VDS."
  - "Impedancia de salida no ideal del driver de compuerta ni la resistencia de compuerta externa/interna — los cuatro niveles de corriente de driver se tratan como fuentes de corriente ideales."
  - "Límites dinámicos de área segura de operación (SOA), curvas de derrateo térmico e energía de avalancha — las advertencias de sobrecorriente/sobrepotencia comparan solo contra cifras estáticas de catálogo (ID máx, Ptot), no contra un modelo térmico ni un pulso de energía."
  - "λ (modulación de longitud de canal / resistencia de salida finita en saturación) — en saturación, el modelo trata ID como perfectamente plano frente a VDS, sin la ligera pendiente ascendente de un MOSFET real."
  - "El diodo intrínseco de cuerpo (body diode) del MOSFET — no está presente en el circuito ni en el modelo."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valor de VGS elegido y confirmación del simulador de que el dispositivo queda en región óhmica (triodo) tanto en el extremo mínimo como en el extremo máximo del rango de Vth de fábrica del dispositivo elegido, sin exceder ID máximo de catálogo en ningún extremo."
evidencia_desempeno: "Guía de observación del modo Predicción (región de operación o ID/VDS predichos antes de la confirmación del simulador) y del modo Barrido (magnitud del desplazamiento de VDS observado al recorrer el rango completo de Vth de fábrica)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un MOSFET se controla por voltaje de compuerta (capacitivo, sin corriente DC de entrada) en vez de por corriente de base como el BJT, y por qué el umbral Vth de fábrica varía entre unidades del mismo modelo (briefing.ts)."
desarrollo: "Práctica en el simulador: explora las tres regiones de operación y el dimensionamiento del driver → predice la región o el punto de trabajo → barrido de Vth de fábrica → reto de diseño robusto a la dispersión de Vth en ambos extremos."
cierre: "Ficha técnica (capa 2) con los parámetros de hoja de datos de los tres MOSFET, el contrato de fidelidad completo (SÍ/NO modela) — incluyendo la ausencia intencional de RDS(on) en el cálculo — y el procedimiento de medición física con fuente DC regulable, generador de pulsos y osciloscopio."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "International Rectifier / Infineon, datasheet 'IRF540NPbF' PD-94812 (rev. 11/3/03, vigente) — Vth, gfs, Qg, RDS(on), ID máx, VDS máx y Ptot del IRF540N; contrastada explícitamente contra la revisión anterior PD-91341A (1998, gfs=11S) como un cambio de proceso de fabricación real documentado, no un error de transcripción."
  - "International Rectifier, datasheet 'IRLZ44N' PD-9.1346B (25/8/97) y reedición Infineon 2003 — Vth, gfs, Qg, RDS(on), ID máx, VDS máx y Ptot del IRLZ44N, cruzados entre dos documentos independientes del mismo fabricante."
  - "Fairchild Semiconductor, datasheet '2N7000.SAM' Rev. A1 (nov. 1995) y ON Semiconductor Rev. 5 — Vth, gfs, RDS(on), ID máx, VDS máx y Ptot del 2N7000; Qg no especificado en ninguna de las dos revisiones consultadas (dispositivo de señal, no de potencia)."
  - "Sedra, A.S. y Smith, K.C., Microelectronic Circuits (Oxford) — modelo cuadrático de canal largo para las regiones de saturación y triodo del MOSFET."
  - "Boylestad, R.L. y Nashelsky, L., Electronic Devices and Circuit Theory (Pearson) — análisis de recta de carga aplicado a MOSFET en fuente común."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.2 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); no confirmadas contra un catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ RDS(on) se muestra en el panel como cifra de catálogo pero no participa en ningún cálculo — la región óhmica se resuelve con la ley cuadrática completa, autoconsistente con la recta de carga. Esto es intencional (el uso real de RDS(on) para pérdidas de conducción es el eje de d2-10/mecanica-23, la práctica inmediatamente siguiente), pero se pide al experto confirmar que ese reparto de alcance entre d2-09 y d2-10 es pedagógicamente correcto y no deja una laguna percibida por el alumno en esta práctica."
  - "⚑ El IRF540N muestra una discrepancia de proceso de fabricación real entre dos revisiones de hoja de datos del mismo fabricante: PD-91341A (1998) reporta gfs=11S mínimo, mientras que PD-94812 (vigente desde 2003) reporta gfs≥21S — se usó la revisión vigente (PD-94812) por ser la más reciente, pero se pide al experto confirmar si el plantel tiene acceso a réplicas de terceros (p. ej. Fairchild) que pudieran mostrar cifras de Qg/Ptot distintas para el mismo número de parte, como ya ocurrió en la investigación de este dispositivo."
  - "⚑ El 2N7000 no especifica Qg en ninguna de las dos hojas de datos consultadas (Fairchild Rev. A1, ON Semiconductor Rev. 5) — es un MOSFET de señal pequeña, no de potencia, y los fabricantes consultados simplemente no lo caracterizan. El simulador declara la estimación de tiempo de encendido como 'no disponible' para este dispositivo en vez de aproximar un valor; se pide al experto confirmar si existe una hoja de datos alternativa del mismo dispositivo que sí reporte Qg."
  - "✔ Verificación con Playwright de este simulador: PASS limpio, 21/21 verificaciones, sin defectos encontrados. Renderizado WebGL, picking 3D, los cuatro modos (Explora/Predicción/Barrido/Reto), los steppers de VDD/RD/VGS/Vth, la selección de dispositivo y de nivel de driver funcionan correctamente. El motor de solución de la región óhmica (triodo) se verificó numéricamente contra un barrido de fuerza bruta independiente (resolución 0.5 mV): error menor a 0.01 en VDS e ID. Con los valores por defecto (IRF540N, VDD=12V, RD=10Ω, VGS=6V, Vth=3V), el simulador resuelve región triodo con ID≈1.197A y VDS≈0.029V. Ver nota 3 en 'Notas para el revisor experto' para el detalle completo del reporte."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (novena práctica de Tanda 1 / D2):** d2-09 introduce el
   transistor de efecto de campo (MOSFET) en la tanda — a diferencia de mecanica-14/18
   (diodo) y mecanica-19/20/21 (BJT, corriente de base controla corriente de colector),
   aquí la compuerta es capacitiva: VGS controla ID sin corriente DC de entrada, y el eje
   pedagógico se traslada de la polarización DC hacia la ley cuadrática de canal largo, la
   dispersión de fábrica de Vth, y un primer acercamiento (de primer orden) al
   dimensionamiento del driver de compuerta a partir de Qg. d2-10 (siguiente práctica de la
   tanda, pendiente) retomará el mismo dispositivo para pérdidas de conducción y
   conmutación en PWM — es ahí donde RDS(on) pasa de ser una cifra de referencia a un
   parámetro activo del cálculo.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/mosfet.html](../../../public/labs/mosfet.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros
   de hoja de datos de los tres MOSFET y las fórmulas exactas usadas — incluyendo la
   declaración explícita de que RDS(on) es solo de referencia — de modo que el alumno y el
   evaluador ven las fronteras del modelo dentro de la práctica misma.
3. **Verificación de implementación — importante para d2-10:** `mosfet.body.js` se
   escribió siguiendo la misma convención ya validada en mecanica-19/20/21 (llamada directa
   a `pickerFor` del framework, `el(id)`/`showToast(msg)` como helpers locales). Se lanzó
   un agente de verificación con Playwright (Chromium headless real, sirviendo
   `public/labs/` por HTTP local) que confirmó en tiempo de ejecución: **cero errores de
   consola/página** (21/21 verificaciones); canvas WebGL renderiza correctamente el banco
   3D; las cuatro transiciones de modo (Explora/Predicción/Barrido/Reto) cambian el panel
   correctamente; el cambio de dispositivo (IRF540N/IRLZ44N/2N7000) produce soluciones
   válidas en los tres; el manejo de corte (VGS<Vth ⇒ ID=0) se confirmó explícitamente; el
   modo Reto resuelve correctamente el caso robusto (VGS alto satisface triodo en ambos
   extremos de Vth) y rechaza correctamente el caso no robusto (VGS bajo); el modo Barrido
   produce los 17 puntos esperados; y — el punto más importante de esta verificación — el
   solucionador cerrado de la región óhmica (`solveMOSFET`) se contrastó contra un barrido
   numérico de fuerza bruta independiente (resolución 0.5 mV) escrito para esta
   verificación, confirmando coincidencia con error menor a 0.01 en VDS e ID. **Resultado:
   PASS limpio, 0 defectos encontrados, ninguna corrección necesaria.**
4. **Petición concreta al experto:** (a) confirmar o corregir la clave curricular ⚑
   (MEC-I.2 y el submódulo); (b) el más importante de esta ficha — confirmar que el reparto
   de alcance entre d2-09 (regiones de operación + Qg/driver, sin usar RDS(on) en el
   cálculo) y d2-10 (pérdidas de conducción/conmutación, donde RDS(on) sí se usa) es
   pedagógicamente correcto, o si esta práctica debería exponer RDS(on) de forma más
   explícita antes de llegar a d2-10; (c) confirmar si el plantel tiene acceso a una hoja
   de datos alternativa del 2N7000 que sí reporte Qg, dado que ninguna de las dos
   consultadas (Fairchild Rev. A1, ON Semiconductor Rev. 5) lo especifica; (d) confirmar si
   la ausencia de una NOM aplicable a esta práctica (igual que en mecanica-19/20/21) es
   aceptable, o si la práctica hermana d2-10 (con implicación de eficiencia energética en
   conmutación) sí debería anclarse a alguna norma.
