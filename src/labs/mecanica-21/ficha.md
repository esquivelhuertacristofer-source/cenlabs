# Ficha de práctica — Amplificador BJT en emisor común: ganancia de pequeña señal (`mecanica-21`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** octava práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Primera práctica de D2 centrada en **pequeña
> señal AC** superpuesta a un punto de operación — a diferencia de mecanica-14/18/19
> (DC en reposo) y mecanica-20 (transitorio RL de conmutación), aquí el eje pedagógico es
> el modelo hybrid-π y el compromiso ganancia-vs-predictibilidad entre RE bypaseada y sin
> bypasear.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-21
sector: mecanica-electronica
practica_maestra: "d2-08 — Mide ganancia e impedancias de un amplificador emisor común: modelo hybrid-π (Av=−gm·RC), recorte de señal por recta de carga AC (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-I.2 (Electrónica, Módulo I, Submódulo 2)"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Amplificadores de pequeña señal en configuración emisor común"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-19/mecanica-20; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de resolver el punto Q de un amplificador BJT en
  emisor común polarizado por divisor de voltaje; calcular los parámetros de pequeña señal
  del modelo hybrid-π (gm, rπ) a partir de ese punto Q; calcular y comparar la ganancia de
  voltaje Av con RE bypaseada frente a sin bypasear, explicando por qué una depende del
  transistor y la otra depende principalmente de resistencias externas; identificar en el
  osciloscopio el recorte de la señal de salida al exceder los límites de corte o
  saturación sobre la recta de carga AC; y diseñar un divisor de polarización que alcance
  un ICQ objetivo de forma robusta para todo el rango de β de hoja de datos del transistor,
  no solo para un valor "típico".
actividad_clave: >
  Sobre un banco 3D con fuente, medidor de punto Q y osciloscopio integrados, en el modo
  Explora ajusta VCC/R1/R2/RC/RE/RL con steppers, elige entre tres transistores (BC547B,
  2N3904, 2N2222A) y activa o desactiva el capacitor de bypass sobre RE, observando en
  tiempo real cómo cambian el punto Q (IB, IC, VCE) y la ganancia Av; en Predicción,
  predice si el BJT queda en corte, activa o saturación, o el valor aproximado de |Av|,
  antes de que el simulador lo confirme; en Medición, recorre la amplitud de la señal de
  entrada y observa en el osciloscopio cómo la salida se recorta contra los límites de la
  recta de carga AC; y en el Reto, ajusta el divisor de polarización para lograr un ICQ
  objetivo que se mantenga dentro de tolerancia para absolutamente todo el rango de β de
  hoja de datos del transistor elegido, verificado muestreando ese rango completo, no solo
  su punto medio.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquema y el banco 3D: divisor de voltaje R1/R2 para la polarización de base, RC como resistencia de colector, RE (con capacitor de bypass opcional) como resistencia de emisor, RL como carga de salida acoplada, y una fuente de señal AC pequeña superpuesta al punto Q."
  - "Modo Explora: ajusta VCC/R1/R2/RC/RE/RL con los steppers del panel, elige entre tres transistores (BC547B, 2N3904, 2N2222A) y activa/desactiva el bypass de RE; observa el punto Q y Av actualizarse en el medidor y en el osciloscopio del banco."
  - "Verifica que el punto Q se resuelve en forma cerrada idéntica al modelo de mecanica-19/d2-06: VBB=VCC·R2/(R1+R2), RBB=R1‖R2, IB=(VBB−VBE)/(RBB+(β+1)·RE), con manejo explícito de corte (IB≤0 ⇒ VCE=VCC) y de saturación (si VCE cae por debajo de VCEsat del dispositivo, se recalcula IC=ICsat=(VCC−VCEsat)/(RC+RE))."
  - "Verifica el modelo de pequeña señal hybrid-π: gm=ICQ/VT con VT=25mV fijo, rπ=β/gm, y las dos fórmulas de ganancia — con bypass, Av=−gm·(RC‖RL); sin bypass, Av=−β·(RC‖RL)/[rπ+(β+1)·RE] — confirmando numéricamente que la ganancia sin bypass es varias veces menor pero mucho menos sensible a la variación de β entre unidades."
  - "Modo Predicción: predice el estado del transistor (corte/activa/saturación) o el valor aproximado de |Av| (tolerancia 25%) antes de que el simulador confirme la respuesta correcta."
  - "Modo Medición: recorre la amplitud de la señal de entrada vin y observa en el osciloscopio el recorte de la salida cuando excede el límite hacia saturación (downSwing=VCEQ−VCEsat) o hacia corte (upSwing=ICQ·RCA_AC), verificando que el recorte ocurre exactamente donde predice la recta de carga AC, no antes ni después."
  - "Modo Reto: diseña el divisor de polarización para un ICQ objetivo, y verifica que el simulador confirma el diseño muestreando ~12 valores de β distribuidos en todo el rango de hoja de datos del transistor elegido (no solo el punto medio), exigiendo un error máximo menor al 20% en cualquier punto del rango."
  - "(Opcional, modo avanzado) Activa la resistencia de salida Early (ro) — disponible solo para el 2N2222A — y observa su efecto de segundo orden sobre RCeff y, por lo tanto, sobre Av; el simulador declara explícitamente que VA es una estimación de orden de magnitud, no una cifra de hoja de datos tabulada."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito: divisor de polarización, BJT, capacitor de bypass, carga acoplada)."
  - "⚑ No se identificó una NOM mexicana que aplique directamente al diseño de amplificadores de pequeña señal a nivel de circuito — mismo hueco normativo ya documentado en mecanica-19/d2-06 y mecanica-20/d2-07. Confirmar con el equipo curricular si el programa MCCEMS exige citar alguna norma específica para esta práctica."
simulador_modela:      # 🔒
  - "Polarización DC por divisor de voltaje idéntica al modelo de mecanica-19/d2-06: VBE=0.7V constante, β dentro del rango de hoja de datos (nunca un 'típico' inventado), punto Q resuelto en forma cerrada con manejo explícito de corte y saturación."
  - "Modelo de pequeña señal hybrid-π: gm=ICQ/VT, rπ=β/gm, con VT=25mV fijo (aproximación estándar a temperatura ambiente)."
  - "Ganancia de voltaje con RE bypaseada: Av=−gm·(RC‖RL); recta de carga DC vs. recta de carga AC con pendientes distintas, pivotando ambas sobre el mismo punto Q, con el recorte de la señal de salida por corte o saturación mostrado explícitamente en el osciloscopio del banco (no solo como advertencia de texto)."
  - "Tres transistores con parámetros de hoja de datos declarados: BC547B (hFE 200–450 como rango, nunca cifra 'típica' inventada; VCEsat corregido a 600mV máx para la condición de prueba real IC=100mA/IB=5mA, no el valor de 400mV usado erróneamente en una versión anterior), 2N3904 y 2N2222A."
  - "Modo Reto con verificación robusta: el diseño del alumno se evalúa muestreando ~12 valores de β distribuidos en todo el rango de hoja de datos del transistor (no solo el valor central), exigiendo que el error máximo del ICQ resultante se mantenga bajo el 20% en cualquier punto de ese rango."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Ganancia sin bypass, Av=−β·(RC‖RL)/[rπ+(1+β)·RE], es una extensión propia derivada por KVL incremental estándar — no viene explícita en la fuente consultada para este laboratorio; se declara como tal en el propio panel del simulador."
  - "ro (resistencia de salida Early) es opcional y solo aparece en 'modo avanzado', disponible únicamente para el 2N2222A: VA≈70–75V es una estimación de orden de magnitud tomada de modelos SPICE de terceros, NO un valor de hoja de datos tabulado. BC547B y 2N3904 no exponen esta opción por falta de una cifra de VA confiable en sus hojas de datos."
  - "2N2222A: VCEsat (0.3V) y VCEO/VCBO/VEBO/IC/PD provienen de síntesis por búsqueda web tras fallos de acceso directo a cuatro réplicas de hoja de datos distintas — tratar como referencia orientativa, no como cifra certificada del fabricante original."
  - "2N3904: hoja de datos original (ON Semiconductor) con acceso bloqueado (HTTP 403) al momento de la verificación — cifras tomadas de una réplica de distribuidor (STMicroelectronics, hoja preliminar feb-2003), no verificadas de forma independiente contra el fabricante original."
  - "Dependencia térmica de ningún parámetro: VBE=0.7V y VT=25mV se tratan como constantes fijas, sin variación con la corriente instantánea ni con la temperatura de operación."
  - "Efectos de frecuencia: sin capacitancias parásitas (Cπ, Cμ), sin respuesta en frecuencia, sin ancho de banda ni frecuencias de corte por los capacitores de acoplo/bypass — el análisis es puramente de baja frecuencia / punto medio de banda, como una aproximación de pequeña señal DC-equivalente."
  - "⚑ Impedancias de entrada/salida (Zin, Zout) NO se calculan ni se exponen como cifra explícita en el panel, aunque rπ sí se muestra en la telemetría — el título de la práctica maestra (d2-08) menciona explícitamente 'impedancias' en plural junto con la ganancia; este simulador cubre la ganancia con rigor pero deja la medición explícita de Zin=rπ‖RBB y Zout≈RC (o RC‖ro en modo avanzado) como una extensión pendiente, no como algo ya resuelto. Ver nota 4 en 'Notas para el revisor experto'."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: valores de R1/R2 elegidos y confirmación del simulador de que el ICQ objetivo se cumple dentro de tolerancia para todo el rango de β muestreado del transistor elegido."
evidencia_desempeno: "Guía de observación del modo Predicción (estado del transistor o |Av| predicho antes de la confirmación del simulador) y del modo Medición (identificación correcta del punto de recorte de la señal en el osciloscopio frente a la recta de carga AC calculada)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué un BJT polarizado en la región activa puede amplificar una señal AC pequeña, y el compromiso entre ganancia y predictibilidad entre RE bypaseada (más ganancia, más sensible al transistor) y sin bypasear (menos ganancia, más estable) (briefing.ts)."
desarrollo: "Práctica en el simulador: explora el divisor de polarización y el bypass de RE → predice el estado del BJT o la ganancia → mide el recorte de la señal contra la recta de carga AC → reto de diseño de un ICQ robusto a todo el rango de β."
cierre: "Ficha técnica (capa 2) con los parámetros de hoja de datos de los tres transistores, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con fuente DC regulable, generador de funciones y osciloscopio."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "ON Semiconductor, datasheet 'BC546/BC547/BC548' Rev. 6 — hFE (rango mín–máx, no 'típico'), VCEsat (600mV máx @ IC=100mA/IB=5mA, condición de prueba real), VCEO, ICmax, Ptot del BC547B."
  - "STMicroelectronics, hoja de datos preliminar '2N3904' (feb-2003, réplica de distribuidor) — hFE, VCEsat, VCEO, ICmax, Ptot del 2N3904; hoja original de ON Semiconductor con acceso bloqueado (HTTP 403) al momento de la verificación."
  - "Réplicas de hoja de datos para '2N2222A' — VCEsat, VCEO/VCBO/VEBO, ICmax, Ptot obtenidos por síntesis tras fallos de acceso directo a cuatro fuentes distintas; tratar como referencia orientativa."
  - "Boylestad & Nashelsky, 'Electronic Devices and Circuit Theory' — modelo hybrid-π de pequeña señal (gm=ICQ/VT, rπ=β/gm), fórmula de ganancia con RE bypaseada, y el concepto de recta de carga AC vs. DC."
  - "Modelos SPICE de terceros (no un fabricante específico) — estimación de orden de magnitud de la tensión Early (VA≈70–75V) usada únicamente en el modo avanzado (ro) del 2N2222A."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (ETR-I.2 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); no confirmadas contra un catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ La práctica maestra d2-08 se titula 'Mide ganancia e impedancias de un amplificador emisor común'; este simulador resuelve con rigor la ganancia (Av, con y sin bypass) pero NO calcula ni expone explícitamente Zin/Zout como cifra medible en el panel — solo rπ, que es un insumo de Zin, no Zin en sí. Se pide al experto confirmar si esto es una brecha de alcance que debe cerrarse (agregando Zin=rπ‖RBB y Zout al panel) antes de considerar la práctica completa frente al temario oficial."
  - "⚑ El 2N2222A se sintetizó por búsqueda web tras fallos de acceso a cuatro réplicas de hoja de datos distintas; sus cifras (VCEsat, VCEO/VCBO/VEBO, ICmax, Ptot, y en especial VA para el modo avanzado) deben tratarse como la fuente menos confiable de las tres del laboratorio."
  - "⚑ El 2N3904 se tomó de una réplica de distribuidor (STMicroelectronics, preliminar feb-2003) por bloqueo de acceso (HTTP 403) a la hoja original de ON Semiconductor; se pide al experto confirmar las cifras contra la hoja de datos oficial vigente si tiene acceso directo."
  - "✔ Verificación con Playwright de este simulador: PASS limpio, sin defectos encontrados. Renderizado WebGL, picking 3D, los cuatro modos (Explora/Predicción/Medición/Reto), los steppers de los siete parámetros, y el toggle de bypass funcionan correctamente. La física subyacente se confirmó numéricamente coherente con la teoría de degeneración de emisor: con los valores por defecto, Av cae de ≈−257.1 V/V (bypass activo) a ≈−4.6 V/V (bypass inactivo) al desactivar el capacitor de bypass — una caída de casi dos órdenes de magnitud consistente con la fórmula Av=−β·(RC‖RL)/[rπ+(β+1)·RE] dominada por el término (β+1)·RE. Ver nota 3 en 'Notas para el revisor experto' para el detalle completo del reporte."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (octava práctica de Tanda 1 / D2):** d2-08 introduce la
   primera práctica de **pequeña señal AC** de la tanda: a diferencia de mecanica-14/18/19
   (polarización DC en reposo) y mecanica-20 (transitorio RL de conmutación), aquí el eje
   pedagógico es el modelo hybrid-π superpuesto a un punto Q ya conocido, y el compromiso
   directo entre ganancia y predictibilidad que expone el capacitor de bypass sobre RE. Si
   este es el nivel adecuado de introducción al análisis de pequeña señal dentro de la
   secuencia curricular (antes de MOSFET en d2-09/d2-10 y antes de op-amps en d2-11), es
   una pregunta abierta para el experto.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/amplificadorbjt.html](../../../public/labs/amplificadorbjt.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros
   de hoja de datos de los tres transistores y las fórmulas exactas usadas, de modo que el
   alumno y el evaluador ven las fronteras del modelo dentro de la práctica misma.
3. **Verificación de implementación (continuación de la vigilancia iniciada en
   mecanica-19/d2-06) — importante para d2-09/d2-10:** `amplificadorbjt.body.js` se
   escribió desde el inicio llamando directamente a la función global `pickerFor(scene,
   camera, dom, onHit)` del framework (sin redefinirla localmente) y definiendo `el(id)` y
   `showToast(msg)` como helpers locales propios del body.js, siguiendo la misma
   convención ya validada en mecanica-20. Se lanzó un agente de verificación con
   Playwright (Chromium headless real, sirviendo `public/labs/` por HTTP local, no solo
   inspección estática de código) que confirmó en tiempo de ejecución: **cero errores de
   consola/página**; canvas WebGL renderiza correctamente el banco 3D (divisor de
   polarización, BJT, capacitor de bypass, fuente/medidor/osciloscopio como cajas con
   pantalla emisiva); las cuatro transiciones de modo (Explora/Predicción/Medición/Reto)
   cambian el panel correctamente; los siete steppers (VCC/R1/R2/RC/RE/RL/Vin) y el toggle
   de bypass responden y actualizan el punto Q y Av en tiempo real; con los valores por
   defecto y bypass activo, Av≈−257.1 V/V; al desactivar el bypass, Av≈−4.6 V/V —
   confirmando numéricamente el término dominante (β+1)·RE en el denominador de la
   ganancia sin bypass; el modo Predicción y el modo Medición (recorte de señal contra la
   recta de carga AC) funcionaron sin errores; clics reales sobre el canvas 3D no
   produjeron excepciones, confirmando el cableado de `pickerFor`. **Resultado: PASS
   limpio, 0 defectos encontrados, ninguna corrección necesaria.**
4. **Petición concreta al experto:** (a) confirmar o corregir la clave curricular ⚑
   (ETR-I.2 y el submódulo); (b) el más importante de esta ficha — decidir si la brecha de
   alcance frente al título oficial de d2-08 ("ganancia **e impedancias**") debe cerrarse
   agregando Zin=rπ‖RBB (y Zout) como cifra explícita en el panel/telemetría, o si el
   cálculo actual de rπ (ya visible) es suficiente para el nivel de esta práctica; (c)
   confirmar si el plantel tiene acceso a la hoja de datos oficial del 2N3904 (ON
   Semiconductor) para verificar las cifras tomadas de la réplica de STMicroelectronics; (d)
   confirmar si la ausencia de una NOM aplicable a esta práctica (igual que en
   mecanica-19/d2-06 y mecanica-20/d2-07) es aceptable, dado que se trata de una práctica
   de diseño analógico sin implicación directa de seguridad eléctrica normada.
