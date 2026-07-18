# Ficha de práctica — Amplificador operacional: inversor y no inversor (`mecanica-32`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** undécima práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, primera del sub-arco de circuitos integrados analógicos que sigue al cierre
> de dispositivos discretos en mecanica-14…23 (d2-01…d2-10: diodo → BJT → MOSFET). Abre el
> tramo final de D2 (d2-11…d2-18: op-amp, comparador Schmitt, 555, filtro Sallen-Key, buck,
> boost/flyback, amplificador de instrumentación, etapa clase AB) reutilizando el molde S+P,
> ahora aplicado a un dispositivo con ganancia interna casi ideal en vez de una curva
> característica no lineal de dos terminales.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-32
sector: mecanica-electronica
practica_maestra: "d2-11 — Diseña amplificadores inversor y no inversor con op-amp: Av=−Rf/Ri (inversor), Av=1+Rf/Ri (no inversor), limitados por el producto ganancia×ancho de banda GBW (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.2 (Electrónica/Tecnología, resultado I.2) — única trazabilidad que trae la fila de d2-11 en docs/LISTA-MAESTRA-200-PRACTICAS.md"   # ⚑ sin código Mecatrónica (MEC-x.x) asignado en la lista maestra para esta fila, a diferencia de d2-01/d2-06/d2-09/d2-10; confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Diseño con amplificadores operacionales (ganancia en lazo cerrado y ancho de banda)"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular la ganancia ideal en lazo cerrado de un
  amplificador inversor (Av=−Rf/Ri) y no inversor (Av=1+Rf/Ri); explicar y aplicar el
  producto ganancia×ancho de banda (GBW) para predecir la frecuencia de corte fc=GBW/NG, con
  NG=1+Rf/Ri la ganancia de ruido (NG=Av en el no inversor, NG=|Av|+1 en el inversor);
  distinguir el recorte de salida por headroom insuficiente frente a ±Vs de la distorsión
  por slew-rate, reconociendo sus firmas visuales distintas (recorte plano vs. onda
  triangular); seleccionar entre dos op-amps con parámetros de hoja de datos distintos
  (LM358 bipolar, TL072 JFET) según los requisitos simultáneos de ganancia y ancho de banda
  de un diseño dado; y reconocer que GBW y slew rate son cifras típicas de hoja de datos, no
  garantías mínimas, y que el headroom de salida se trata en este modelo como un valor fijo,
  no como función de la carga real.
actividad_clave: >
  Sobre un banco 3D con fuente AC, resistores Ri/Rf, op-amp y osciloscopio virtual, en el
  modo Explora ajusta Ri, Rf, la topología (inversor/no inversor) y el dispositivo
  (LM358/TL072) con steppers y observa Av, fc, la curva de Bode y la forma de onda de salida
  actualizarse en tiempo real; en Predicción, predice la ganancia o si la frecuencia actual
  cae dentro del ancho de banda; en Medición, ejecuta un barrido automático de frecuencia que
  desliza el punto de operación por la curva de Bode mientras el osciloscopio revela recorte
  o distorsión por slew; y en el Reto, diseña Ri/Rf y elige el op-amp correcto para cumplir
  simultáneamente una ganancia mínima y un ancho de banda mínimo, recibiendo el ancho de
  banda máximo alcanzable como retroalimentación cuando el objetivo es imposible con el
  dispositivo elegido.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: fuente AC vin, resistores Ri (entrada/realimentación) y Rf (realimentación), op-amp (LM358 o TL072) y salida Vout, con la topología inversora o no inversora alternable con un botón — molde S+P ya usado en mecanica-12/13/14 (d2-anteriores), ahora con un dispositivo activo de ganancia interna finita en vez de una red puramente pasiva."
  - "Modo Explora: ajusta Ri, Rf, la topología y el dispositivo con los steppers del panel, y observa Av (ideal y a la frecuencia actual), fc, Vout y la curva de Bode de magnitud actualizarse en tiempo real, con el punto de operación marcado sobre la curva."
  - "Verifica que la ganancia ideal se calcula por fórmula cerrada: Av=−Rf/Ri en la topología inversora, Av=1+Rf/Ri en la no inversora — el signo y la topología determinan cuál fórmula aplica, y ambas asumen implícitamente que la ganancia en lazo abierto del dispositivo es mucho mayor que |Av|."
  - "Verifica que la frecuencia de corte fc=GBW/NG se calcula dividiendo el GBW de hoja de datos del dispositivo elegido entre la ganancia de ruido NG=1+Rf/Ri (no entre |Av|: en la topología inversora Av=−Rf/Ri≠NG, así que usar |Av| en vez de NG subestimaría el peso de Rf/Ri y sobreestimaría fc), y que la respuesta en magnitud sobre la curva de Bode sigue el modelo de un solo polo dominante |Av(f)|=|Av|/√(1+(f/fc)²)."
  - "Confirma que el recorte de salida (clipping) se activa cuando la amplitud ideal de salida excede el techo o el piso reales de headroom frente a ±Vs — asimétrico para el LM358 (piso cercano a 0V, techo con ~1.5V de margen) y aproximadamente simétrico para el TL072 (~3V de margen a ambos lados) — y que ese headroom se trata como un valor fijo por dispositivo, no como función de la carga."
  - "Confirma que la distorsión por slew-rate es un fenómeno independiente del recorte por swing: se activa cuando la pendiente requerida 2π·f·Vout,pico excede el slew rate de hoja de datos del dispositivo, y se visualiza en el osciloscopio como una deformación triangular de la senoidal, no como un recorte plano."
  - "Modo Predicción: predice la ganancia (tipo A) o si la frecuencia actual cae dentro o fuera del ancho de banda disponible (tipo B) antes de que el simulador confirme la respuesta."
  - "Modo Medición: ejecuta un barrido automático de frecuencia que desliza el punto de operación a lo largo de la curva de Bode (curva estática y determinista) mientras el osciloscopio muestra en tiempo real el paso de régimen lineal a recorte o a distorsión por slew."
  - "Modo Reto: diseña Ri y Rf, y elige el op-amp correcto, para cumplir simultáneamente una ganancia mínima y un ancho de banda mínimo asignados; si el objetivo es imposible con el dispositivo actualmente elegido, el simulador indica explícitamente el ancho de banda máximo alcanzable a esa ganancia con ese dispositivo."
  - "Verifica el quiz rápido de 3 preguntas (por qué fc baja al subir la ganancia; qué causa la distorsión triangular; por qué el TL072 tolera mejor señales rápidas y grandes que el LM358) como cierre de la sesión."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (amplificador operacional, resistor, fuente AC, tierra) — el estándar de representación de este lab."
  - "⚑ No se identificó una norma que aplique directamente al diseño de circuitos con amplificador operacional a nivel de componente — mismo hueco normativo ya documentado en mecanica-19/d2-06 a mecanica-23/d2-10; el ancla técnica de esta práctica es el modelo analítico de libro de texto (Sedra y Smith), no una norma."
simulador_modela:      # 🔒
  - "Ganancia ideal en lazo cerrado para ambas topologías (Av=−Rf/Ri inversor, Av=1+Rf/Ri no inversor), tratando la ganancia en lazo abierto como suficientemente grande para despreciar el error de lazo cerrado — aproximación estándar de libro de texto."
  - "Modelo de polo dominante de un solo orden para el ancho de banda (fc=GBW/NG con NG=1+Rf/Ri, |Av(f)|=|Av|/√(1+(f/fc)²)), graficado como curva de Bode de magnitud con el punto de operación actual marcado sobre la curva."
  - "Selección entre dos op-amps con parámetros propios de hoja de datos (GBW, slew rate, offset de entrada Vos, corriente de polarización de entrada Ib, y headroom de salida) que cambian visiblemente el comportamiento del mismo diseño de Ri/Rf: LM358 (bipolar, GBW/SR bajos, swing asimétrico) y TL072 (JFET, GBW/SR altos, swing casi simétrico)."
  - "Recorte de salida por headroom real frente a ±Vs, modelado de forma asimétrica para el LM358 y aproximadamente simétrica para el TL072."
  - "Distorsión por slew-rate independiente del recorte por swing, visualizada como deformación triangular de la senoidal en el osciloscopio virtual cuando la pendiente requerida excede el slew rate del dispositivo."
  - "Modo Reto que, cuando el objetivo de ganancia+ancho de banda es imposible con el op-amp elegido, indica explícitamente el ancho de banda máximo alcanzable a esa ganancia con ese dispositivo."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "La impedancia de entrada numérica del no inversor: se declara solo cualitativamente ('muy alta, ideal; mayor en el TL072 por su entrada JFET'), sin una cifra en MΩ o TΩ para ninguno de los dos dispositivos."
  - "El headroom de salida como función real de la carga y la temperatura: se usa un valor fijo por dispositivo en todo el rango de ±Vs; el headroom del TL072 usado aquí es una extrapolación propia del único punto de hoja de datos disponible (±12V típico @ ±15V/2kΩ/25°C) a los tres niveles de ±Vs que ofrece el simulador."
  - "La corriente de salida máxima ni una resistencia de carga externa: este laboratorio no incluye una RL seleccionable."
  - "El desfase entrada-salida: la curva de Bode graficada es solo de magnitud; el modelo de polo dominante también predice un desfase creciente hacia −90° cerca de y por encima de fc, no calculado ni dibujado aquí."
  - "La distorsión armónica dentro del régimen lineal: mientras la señal no está recortada ni limitada por slew, se trata como réplica perfectamente lineal de la entrada escalada por Av(f)."
  - "La deriva térmica de Vos e Ib, ni la tolerancia de fabricación de Ri/Rf: los valores mostrados son cifras de hoja de datos a temperatura ambiente, fijas."
  - "Fallas por sobre-voltaje o polaridad inversa de la alimentación dual — un riesgo real de armado que este simulador no modela."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de Ri, Rf y op-amp elegidos, y confirmación del simulador de que el diseño cumple simultáneamente la ganancia mínima y el ancho de banda mínimo asignados (o, si el objetivo es imposible con el dispositivo elegido, el ancho de banda máximo alcanzable reportado por el simulador)."
evidencia_desempeno: "Guía de observación del modo Predicción (ganancia o pertenencia al ancho de banda predicha antes de la confirmación) y del modo Medición (identificación en vivo del paso de régimen lineal a recorte o a distorsión por slew durante el barrido)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la fórmula ideal Av=−Rf/Ri (o 1+Rf/Ri) tiene un precio oculto — el producto ganancia×ancho de banda constante — y por qué dos op-amps con la misma Ri/Rf se comportan distinto (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo Ri/Rf/topología/dispositivo cambian Av y fc → predice ganancia o ancho de banda → barrido de frecuencia con recorte/distorsión en vivo → reto de diseño con ganancia y ancho de banda simultáneos."
cierre: "Ficha técnica (capa 2) con LM358 y TL072, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con generador de funciones y osciloscopio de doble canal."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Sedra y Smith, Microelectronic Circuits (Oxford): modelo ideal de ganancia en lazo cerrado del amplificador operacional (inversor y no inversor), y el modelo de polo dominante de ganancia-ancho de banda constante — la referencia principal para la parte analítica de esta práctica."
  - "Boylestad y Nashelsky, Electronic Devices and Circuit Theory (Pearson): tratamiento introductorio de circuitos con amplificador operacional y sus parámetros no ideales (slew rate, offset de entrada)."
  - "Hoja de datos Texas Instruments LM358 (vía convergencia de fuentes secundarias — el PDF original no pudo leerse directamente en el entorno de investigación usado para esta práctica, poppler-utils ausente): GBW, slew rate, Vos, Ib y swing de salida típico."
  - "Hoja de datos Texas Instruments / STMicroelectronics TL072 (vía convergencia de fuentes secundarias, mismo motivo que arriba): GBW, slew rate, Vos y swing de salida (mínimo garantizado). ⚑ La cifra de Ib de esta fuente no fue cruzada de forma independiente contra una segunda fuente."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular: la lista maestra (docs/LISTA-MAESTRA-200-PRACTICAS.md) solo asigna 'ETR-I.2' como trazabilidad de d2-11, sin un código Mecatrónica (MEC-x.x) explícito como sí tienen d2-01/d2-06/d2-09/d2-10. Confirmar con el responsable curricular si corresponde asignar uno, o si ETR-I.2 es efectivamente la única trazabilidad prevista para esta práctica."
  - "⚑ Las hojas de datos originales de Texas Instruments (LM358, TL072) no pudieron leerse directamente en el entorno de investigación usado para esta práctica — el renderizado de PDF no estaba disponible. Todas las cifras de GBW/SR/Vos/Ib/swing provienen de convergencia de fuentes secundarias, no de lectura directa del documento del fabricante — ver Nota de rigor en la sección 2 de la ficha técnica in-app (public/labs/_ficha-opamp.js)."
  - "⚑ La corriente de polarización de entrada del TL072 (Ib=65 pA típ. / 200 pA máx.) proviene de una sola fuente consultada, sin cruzar de forma independiente contra una segunda fuente — tratar con más cautela que el resto de las cifras de este simulador."
  - "⚑ El headroom de salida del TL072 usado en el modelo (constante en los tres niveles de ±Vs del simulador) es una extrapolación propia del único punto de hoja de datos disponible (±12V típico @ ±15V/2kΩ/25°C, RL=2kΩ), no una cifra tabulada para cada nivel de ±Vs."
  - "✅ Verificación con Playwright de este simulador: EJECUTADA. 39/43 aserciones directas PASS; de las 4 restantes, 3 fueron 'fallos' de click-picking (out-inv, ri-inv, ri-noninv) resueltos como implementación correcta con coordenadas de prueba imprecisas — un escaneo fino de re-verificación ubicó las 3 zonas reales en coordenadas de pantalla correctas y funcionales — y 1 fue un falso positivo del propio script de prueba (formato esperado '13.00' vs. el formato correcto y real de la app '13.0 V/µs'). Cero errores de consola, cero errores de página, cero solicitudes fallidas, cero defectos reales encontrados en el lab. Detalle completo en la nota 3 de 'Notas para el revisor experto'."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (undécima práctica de Tanda 1 / D2, primera del sub-arco de
   circuitos integrados analógicos):** d2-11 abre la segunda mitad de la Tanda 1, pasando de
   dispositivos discretos (d2-01…d2-10: diodo → BJT → MOSFET) a circuitos integrados
   analógicos (amplificador operacional, comparador, temporizador 555, filtros activos,
   reguladores conmutados…). Es la primera práctica de la tanda donde el dispositivo central
   tiene ganancia interna casi ideal en vez de una curva característica no lineal de dos
   terminales — el eje pedagógico cambia de "caracterizar un dispositivo" a "diseñar con un
   bloque funcional dentro de sus límites reales de ancho de banda y velocidad."
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/opamp.html](../../../public/labs/opamp.html)) muestra el panel
   "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros de hoja de datos de
   LM358 y TL072, las fórmulas exactas de Av/fc, y la advertencia de que las hojas de datos
   originales no se pudieron leer directamente en el entorno de investigación usado para
   construir esta práctica — de modo que el alumno y el evaluador ven las fronteras del
   modelo dentro de la práctica misma.
3. **Verificación de implementación:** EJECUTADA (Playwright, Chromium headless, sirviendo
   `public/labs/` por HTTP local). Resultado: 39/43 aserciones directas PASS en la primera
   pasada, cubriendo sanidad física (asimetría de slew LM358 vs. TL072 contra un cálculo de
   referencia independiente), los 4 modos, predicción (tipo av y tipo bw), reto (objetivo
   imposible y trivial), barrido, cambio de dispositivo/topología, y clamps de los 5
   steppers. De las 4 aparentes fallas: 3 eran clicks de picking 3D (out-inv, ri-inv,
   ri-noninv) que fallaban con las coordenadas de prueba estimadas a ojo por el propio
   script sobre una captura de pantalla; un escaneo fino de re-verificación (paso de 6px
   sobre la región candidata) localizó las 3 zonas reales de click en coordenadas de
   pantalla correctas y funcionales (p. ej. ri-noninv en x[686-692] y[308], una franja
   angosta de solo 2 puntos de rejilla al paso usado), confirmando que `addHit`/`boardClick`
   en `opamp.body.js` funcionan correctamente para las 5 zonas HIT en ambas topologías — el
   defecto estaba en las coordenadas de la prueba, no en el lab. La cuarta falla fue un error
   de la propia aserción de prueba (esperaba `'13.00'` para el slew rate del TL072, cuando el
   formato correcto y real de `fmtSR` es `'13.0 V/µs'` — 1 decimal para SR≥10V/µs, 2
   decimales por debajo). Cero errores de consola o de página, cero solicitudes fallidas,
   cero defectos reales encontrados en el lab.
4. **Petición concreta al experto:** (a) confirmar si corresponde asignar un código
   Mecatrónica (MEC-x.x) explícito a d2-11 en la lista maestra, dado que la fila actual solo
   trae "ETR-I.2"; (b) confirmar si el nivel de esta práctica (modelo de polo dominante de un
   solo orden, sin desfase ni distorsión armónica) es el adecuado para el semestre destino, o
   si conviene reservar una práctica posterior de la tanda para un modelo más completo; (c)
   confirmar si LM358 y TL072 son representativos de lo que un técnico encuentra en campo
   para esta aplicación, o si convendría sustituir/añadir un tercer dispositivo (p. ej. un
   op-amp rail-to-rail moderno); (d) dado que las hojas de datos originales no pudieron
   verificarse de forma directa (ver `banderas_incertidumbre`), confirmar o corregir las
   cifras de GBW/SR/Vos/Ib/swing contra la documentación oficial del fabricante cuando esté
   disponible.
