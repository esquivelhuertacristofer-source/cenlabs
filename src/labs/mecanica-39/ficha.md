# Ficha de práctica — Etapa de salida Clase AB: disipación, polarización VBE y disipador (`mecanica-39`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** decimoctava y última práctica de la **Tanda 1 (D2 — Electrónica
> analógica y de potencia)**, y cierre del sub-arco de acondicionamiento de señal de
> precisión abierto por mecanica-38/d2-17 (puente de galgas + INA128). Con esta práctica,
> **D2 queda completo (18/18)**. Según el agrupamiento por tandas de
> `docs/LISTA-MAESTRA-200-PRACTICAS.md` (fila "T4 | d2-11…d2-18 + d5-01/02 (op-amps,
> fuentes, transformador) | Cierra D2; abre D5"), la continuación natural documentada
> tras cerrar D2 es D5 (transformadores, d5-01/d5-02), no D3 directamente.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-39
sector: mecanica-electronica
practica_maestra: "d2-18 — Dimensiona la etapa de salida clase AB y su disipador: distorsión de cruce; Tj=Ta+P·ΣRθ (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "ETR-II.1 (Electrónica/Tecnología, resultado II.1) — confirmado por lectura directa de la fila de d2-18 en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila 18, columna de trazabilidad)"   # ⚑ sin código Mecatrónica (MEC-x.x) asignado en la lista maestra para esta fila, igual que d2-14; confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Etapas de salida de potencia — Clase AB, polarización y gestión térmica"   # ⚑ confirmar clave exacta del plan vigente; no verificada contra un catálogo externo
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011 (misma familia ocupacional usada en mecanica-14…23/32…38; confirmar si aplica igual aquí)
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de reconocer la topología push-pull complementaria
  de una etapa de salida Clase AB (par NPN/PNP en seguidor de emisor); explicar por qué la
  ausencia de polarización (Clase B pura) produce distorsión de cruce, y cómo una red
  multiplicador VBE (V_CE=VBE·(1+R1/R2)) la elimina fijando una corriente de reposo; calcular
  la potencia entregada a la carga (P_load=Vo_pk²/(2·RL)), la potencia tomada de la fuente
  (P_supply=(2/π)·Vcc·Vo_pk/RL) y la disipación resultante en los transistores
  (P_diss=P_supply−P_load); identificar que la disipación máxima NO ocurre al volumen máximo
  sino en Vo_pk=2Vcc/π≈0.637·Vcc (obtenido derivando P_diss respecto a Vo_pk e igualando a
  cero); y aplicar la cadena térmica Tj=Ta+P·(RθJC+RθCS+RθSA) —o Tj=Ta+P·RθJA sin
  disipador— para verificar que la unión de silicio se mantiene bajo Tj_max con un margen de
  diseño seguro, incluso en el peor caso de amplitud.
actividad_clave: >
  Sobre un banco 3D con un par complementario TIP31C/TIP32C, una red multiplicador VBE (TO-92
  + R1/R2), un disipador intercambiable y una resistencia de carga, en el modo Explora ajusta
  Vcc, RL, la fracción de amplitud de salida Vo_pk/Vcc, el nivel de polarización y el
  disipador con steppers, y observa la curva de transferencia (con su zona muerta de
  distorsión de cruce cuando la polarización es insuficiente), la curva de disipación
  Pdiss(Vo_pk) con el punto de máximo marcado en 2/π, y la temperatura de unión Tj clasificada
  por color contra Tj_max; en Predicción, predice la disipación, Tj o si hay distorsión de
  cruce antes de revelar el valor real; en Medición, ejecuta un barrido automático de amplitud
  que traza punto por punto cómo sube y baja la disipación; y en el Reto, para un Vcc y RL
  objetivo, elige la polarización y el disipador que eliminen la distorsión de cruce y
  mantengan la unión por debajo del margen de diseño seguro (Tj≤130 °C) incluso en el peor
  caso de amplitud (2/π), no solo en la amplitud actualmente seleccionada.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce la topología sobre el esquemático y el banco 3D: los rieles simétricos ±Vcc, el nodo de entrada, la red multiplicador VBE (transistor TO-92 + R1/R2) entre las bases, el transistor NPN (semiciclo positivo) y PNP (semiciclo negativo) en TO-220 sobre el disipador, el nodo de salida y la carga RL."
  - "Modo Explora: ajusta Vcc, RL, la fracción de Vo_pk/Vcc, el nivel de polarización y el disipador con los steppers del panel, y observa cómo la disipación por transistor, la temperatura de unión Tj (clasificada Seguro/Precaución/Peligro por color) y la curva de transferencia (con o sin zona muerta de distorsión de cruce) se actualizan en tiempo real."
  - "Verifica con el botón de referencia (Vcc=24 V, RL=8 Ω, Vo_pk/Vcc=20%, polarización nominal AB, disipador mediano) que la etapa opera con margen térmico amplio (Tj≈72 °C, bien bajo Tj_max=150 °C)."
  - "Con el botón de peor caso (mismo Vcc/RL/polarización/disipador, cambiando SOLO Vo_pk/Vcc a 63.7%=2/π), confirma que la temperatura de unión sube a Tj≈113.7 °C — un salto significativo producido por cambiar únicamente la amplitud, no el disipador ni la polarización, ilustrando que el punto de mayor estrés térmico no es el volumen máximo (Vo_pk/Vcc=90%, que de hecho disipa MENOS que el punto 2/π)."
  - "Reduce la polarización a 'Bases unidas' (Clase B pura, sin red multiplicador VBE) y observa en la curva de transferencia cómo aparece una zona muerta plana cerca del cruce por cero; regresa a la polarización nominal AB y verifica que la zona muerta desaparece."
  - "Modo Predicción: predice la disipación por transistor, la temperatura de unión Tj, o si la configuración actual produce distorsión de cruce, con los valores actuales de Vcc/RL/amplitud/polarización/disipador, antes de que el simulador confirme el valor real."
  - "Modo Medición: ejecuta un barrido automático de la fracción Vo_pk/Vcc (de 10% a 90%) y observa cómo se traza punto por punto, en la gráfica de disipación, la subida hasta el máximo en 2/π≈63.7% y el descenso posterior — confirmando que el máximo NO está en el extremo del barrido."
  - "Modo Reto: para un Vcc y RL objetivo generados al azar, elige la polarización (evitando distorsión de cruce) y el disipador (manteniendo Tj≤130 °C en el peor caso de amplitud, 2/π, no en la amplitud actualmente seleccionada) y verifica que el simulador reporta la razón específica de incumplimiento (Vcc/RL incorrectos, distorsión de cruce presente, o margen térmico insuficiente en el peor caso) cuando el diseño no cumple."
normatividad:          # 🔒 verificar clave y vigencia
  - "JEDEC JESD51 (familia) — estándares de caracterización térmica de dispositivos semiconductores bajo convección natural; norma ancla citada en docs/LISTA-MAESTRA-200-PRACTICAS.md (fila 18, columna de norma)."
  - "JEDEC JESD51-14 — método específico de 'doble interfaz transitoria' (transient dual interface) para medir RθJC de forma más precisa que una estimación basada solo en RθJA en estado estacionario; se cita como referencia de cómo se mide en la práctica el RθJC que este laboratorio usa como constante de la hoja de datos — el simulador NO implementa el método de medición transitoria, solo el resultado en estado estacionario."
simulador_modela:      # 🔒
  - "Potencia entregada a la carga P_load=Vo_pk²/(2·RL) y potencia tomada de la fuente P_supply=(2/π)·Vcc·Vo_pk/RL (derivada de la corriente promedio de media onda rectificada por riel, dos rieles) — verificadas por derivación algebraica directa contra Sedra & Smith, 'Microelectronic Circuits', capítulo de etapas de salida y amplificadores de potencia."
  - "Disipación total en ambos transistores P_diss=P_supply−P_load, y el punto de disipación máxima Vo_pk=2Vcc/π≈0.637·Vcc con P_diss_max=2Vcc²/(π²RL) — obtenido derivando P_diss respecto a Vo_pk e igualando a cero; verificado dos veces de forma independiente: (a) algebraicamente y (b) numéricamente mediante un barrido discreto de fracciones de amplitud que confirma que 2/π produce la disipación máxima entre todos los valores del stepper de amplitud."
  - "Fórmula del multiplicador VBE, V_CE=VBE·(1+R1/R2) — verificada contra Boylestad & Nashelsky, 'Electronic Devices and Circuit Theory', mediante un análisis simplificado de divisor de corriente (corriente por R2≈VBE/R2, asumiendo corriente de base despreciable)."
  - "Cadena térmica en estado estacionario Tj=Ta+Pdiss_por_transistor·(RθJC+RθCS+RθSA) con disipador, o Tj=Ta+Pdiss·RθJA sin disipador — verificada contra ON Semiconductor, nota de aplicación 'Thermal Resistance — Theory and Practice'."
  - "Modelo de zona muerta de distorsión de cruce: cuando el bias total (VBE_total de la red multiplicador VBE) es menor a ≈1.2 V (≈2×VBE de conducción), la curva de transferencia muestra un segmento plano de ancho proporcional al déficit de polarización — representación estándar de libro de texto de la distorsión de cruce, no una simulación Ebers-Moll completa."
  - "Cinco presets de polarización con relación exacta vbeTotal=n×0.65 V (n=0..4, desde 'bases unidas' hasta 'excesivo') y cinco presets de disipador con distinta RθSA (desde 'sin disipador' hasta 'grande + ventilador forzado'), permitiendo explorar el efecto combinado de polarización y disipador sobre Tj."
  - "Botón de referencia y botón de 'peor caso' (que cambia únicamente la fracción de amplitud al punto 2/π, aislando esa variable) — verificados numéricamente con un script Node independiente que reproduce solveClaseAB(): Vcc=24 V/RL=8 Ω/polarización nominal AB/disipador mediano da Tj≈72.04 °C en la referencia (Vo_pk/Vcc=20%) y Tj≈113.65 °C en el peor caso (Vo_pk/Vcc=63.7%), y el barrido discreto de las 10 fracciones de amplitud del stepper confirma que 63.7% (2/π) es el máximo exacto entre todas ellas."
  - "Modo Reto que verifica el margen térmico en el peor caso de amplitud (2/π) independientemente de la amplitud que el usuario tenga seleccionada en ese momento, reforzando la lección de que el diseño debe basarse en el peor caso, no en el punto de operación actual."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Física exponencial completa de Ebers-Moll para derivar la corriente de reposo ICQ real a partir de la curva I-V del transistor: este simulador usa valores ilustrativos redondos por preset de polarización (no medidos ni derivados de la ecuación del diodo), documentado explícitamente en el encabezado de fidelidad del propio archivo fuente."
  - "Curvas de área de operación segura (SOA) del transistor: este simulador solo compara la temperatura de unión Tj contra Tj_max, sin considerar la trayectoria de carga completa ni los límites de corriente/voltaje simultáneos que definen la SOA real de un transistor de potencia."
  - "Respuesta térmica transitoria: el modelo usa únicamente la cadena térmica en estado estacionario Tj=Ta+P·ΣRθ, sin capacitancia térmica ni constantes de tiempo — no representa picos térmicos de corta duración ni el comportamiento dinámico de calentamiento/enfriamiento."
  - "Etapa driver o preamplificadora previa a la etapa de salida, y cualquier forma de realimentación negativa global del amplificador completo: este laboratorio aísla la etapa de salida como bloque independiente."
  - "Protección activa de corriente (limitación de corriente de cortocircuito, foldback) presente en la mayoría de amplificadores de potencia reales."
  - "Disipación de calor por trazas de PCB, convección natural del propio transistor sin disipador más allá de RθJA, o radiación — el modelo usa únicamente el RθSA nominal publicado del preset de disipador elegido."
  - "Los valores exactos de RθJC, RθJA y Tj_max del TIP31C/TIP32C usados en este simulador son cifras representativas recordadas de la familia de hojas de datos ON Semiconductor, no verificadas línea por línea contra el PDF original en esta pasada — ver bandera de incertidumbre."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: nivel de polarización y disipador elegidos, y confirmación del simulador de que el diseño elimina la distorsión de cruce y mantiene Tj≤130 °C en el peor caso de amplitud (2/π), o la retroalimentación específica reportada (cuál condición falla) cuando el diseño no cumple."
evidencia_desempeno: "Guía de observación del modo Predicción (disipación, Tj o presencia de distorsión de cruce, predichos antes de la confirmación) y del modo Medición (identificación en vivo, durante el barrido automático, de que la disipación máxima ocurre en un punto intermedio de amplitud y no en el extremo)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué una etapa Clase AB necesita polarización para evitar la distorsión de cruce, y por qué diseñar el disipador pensando solo en el volumen máximo es un error común — el peor caso térmico real ocurre en un punto intermedio de amplitud (briefing.ts)."
desarrollo: "Práctica en el simulador: explora cómo Vcc/RL/amplitud/polarización/disipador cambian la disipación, Tj y la distorsión de cruce → predice disipación, Tj o distorsión → barrido automático de amplitud trazando el punto de disipación máxima en vivo → reto de diseño térmicamente seguro contra el peor caso, no contra la amplitud actual."
cierre: "Ficha técnica (capa 2) con el par TIP31C/TIP32C, la red multiplicador VBE, el contrato de fidelidad completo (SÍ/NO modela) y el procedimiento de medición física con un termopar sobre una etapa Clase AB real."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Adel S. Sedra y Kenneth C. Smith, 'Microelectronic Circuits' — fuente principal de P_load, P_supply, P_diss y la derivación del punto de disipación máxima Vo_pk=2Vcc/π."
  - "Robert L. Boylestad y Louis Nashelsky, 'Electronic Devices and Circuit Theory' — fuente de la fórmula del multiplicador VBE, V_CE=VBE·(1+R1/R2)."
  - "ON Semiconductor, hoja de datos TIP31C/TIP32C — fuente de RθJC, RθJA (sin disipador) y Tj_max de referencia; cifras recordadas de la familia de hojas de datos, pendientes de verificación línea por línea contra el PDF original (ver bandera de incertidumbre)."
  - "ON Semiconductor, nota de aplicación 'Thermal Resistance — Theory and Practice' — fuente de la cadena térmica Tj=Ta+P·ΣRθ y criterios de selección de disipador."
  - "JEDEC JESD51 (familia) y JESD51-14 — normas de caracterización térmica citadas como norma ancla de la práctica (ver sección normatividad)."
banderas_incertidumbre:
  - "⚑ Los valores exactos de RθJC=3.125 °C/W, RθJA=62.5 °C/W y Tj_max=150 °C del TIP31C/TIP32C son cifras representativas recordadas de la hoja de datos del fabricante, NO verificadas línea por línea contra el PDF original en esta pasada de construcción — confirmar con el responsable curricular o contra la hoja de datos vigente antes de citar estas cifras como definitivas."
  - "⚑ Los valores de ICQ (corriente de reposo) por preset de polarización son cifras ilustrativas redondas elegidas para que la disipación de reposo sea visible pero no dominante, NO derivadas de la ecuación de Ebers-Moll ni de una hoja de datos específica — documentado también en el encabezado de fidelidad del archivo fuente del simulador."
  - "⚑ El margen de diseño Tj_seguro=130 °C (20 °C bajo Tj_max) usado en el modo Reto es una elección pedagógica de margen de seguridad, no una especificación de fabricante — confirmar con el responsable curricular si el margen debería ser distinto (p. ej. un porcentaje de Tj_max en vez de un valor absoluto)."
  - "⚑ Submódulo curricular ('Etapas de salida de potencia — Clase AB, polarización y gestión térmica') no verificado contra un catálogo externo del plan vigente — mismo tipo de reserva ya documentada en mecanica-32/d2-11 a mecanica-38/d2-17."
  - "✅ Verificación de implementación (Playwright) completada: 15/15 comprobaciones en verde contra el HTML construido, servido localmente — ver nota 3 más abajo, sección 'Notas para el revisor experto', para el detalle de qué se comprobó."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (decimoctava y última práctica de Tanda 1 / D2):** d2-18 cierra
   la Tanda 1 completa (D2 — Electrónica analógica y de potencia, 18/18 prácticas) con la
   etapa de salida de potencia que da servicio a cualquier amplificador de audio real. A
   diferencia de d2-15/d2-16 (fuentes conmutadas buck/boost, donde el reto es la regulación
   de voltaje) o d2-17 (acondicionamiento de señal de sensor de bajo nivel), aquí el reto
   central es térmico: dimensionar un disipador que mantenga la unión de silicio bajo su
   límite, entendiendo que el peor caso de disipación NO coincide con el volumen máximo
   percibido. Según el agrupamiento por tandas documentado en
   `docs/LISTA-MAESTRA-200-PRACTICAS.md` (fila T4), la continuación natural tras cerrar D2
   es D5 (d5-01 relación/polaridad de transformador, d5-02 circuito equivalente por ensayos
   de vacío y cortocircuito), no D3 directamente — esta reconciliación queda documentada
   aquí para que el responsable curricular la confirme o la ajuste.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/etapa-clase-ab.html](../../../public/labs/etapa-clase-ab.html)) muestra el
   panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con las fórmulas de disipación,
   el punto de máximo en 2/π, la cadena térmica, el modelo de zona muerta de distorsión de
   cruce, y la nota de rigor sobre los valores ilustrativos de ICQ, documentado en la
   sección 2 de la ficha técnica in-app.
3. **Verificación de implementación:** ✅ Completada. Se verificó primero, numéricamente,
   la física del solver `solveClaseAB()` mediante un script Node independiente (fuera de
   la app), confirmando: (a) el punto de referencia (Vcc=24 V, RL=8 Ω, Vo_pk/Vcc=20%,
   polarización nominal AB, disipador mediano) da Tj≈72.04 °C; (b) el botón de peor caso,
   cambiando únicamente Vo_pk/Vcc a 63.7%=2/π, da Tj≈113.65 °C; (c) un barrido discreto
   sobre las 10 fracciones de amplitud del stepper confirma que 63.7% produce la
   disipación máxima entre todas ellas (incluyendo 90%, que disipa menos: ≈6.06 W contra
   ≈7.31 W en el punto 2/π); (d) el punto de referencia pasa el umbral de diseño seguro
   del modo Reto (TjWorst≈113.65 °C < 130 °C). Después se ejecutó una verificación
   automatizada con Playwright contra el HTML construido y servido localmente
   (`etapa-clase-ab.html`, puerto 8541), usando la API de depuración
   `window.__labDebug` expuesta por el propio simulador para leer el estado real en
   ejecución (no solo re-derivar la física por fuera). Resultado: **15/15
   comprobaciones en verde, 0 errores de consola, 0 errores de página no capturados**:
   - `btnRef` deja el estado en los índices esperados (Vcc=24 V/RL=8 Ω/Vo_pk=20%/nominal
     AB/disipador mediano) y `curSolve().Tj` da 72.044 °C, clasificado "safe".
   - `btnWorst` deja intactos todos los demás índices y cambia solo `iVoPk` al slot
     0.637; `curSolve().Tj` da 113.650 °C, coincidiendo (±0.2 °C) con `TjWorst`
     (calculado siempre en el 2/π exacto, independiente de la selección del usuario).
   - Los cuatro botones de modo (`btn-mode-explora/predice/medicion/reto`) muestran y
     ocultan `predWrap`/`sweepWrap`/`retoWrap` correctamente.
   - Modo Predicción: `genPredice()` sorteó el tipo de pregunta (distorsión de cruce en
     una corrida, disipación en otra); respondiendo con el valor real leído del propio
     estado, `checkPredice()` confirmó "✅ Correcto" en ambos casos.
   - Modo Reto: `newReto()` genera un objetivo nuevo con Vcc/RL al azar; `checkReto()`
     produjo retroalimentación específica coherente ("Ajusta Vcc a ±X V…") cuando el
     Vcc/RL del reto no coincidía con el punto de peor caso ya cargado — confirma que la
     lógica de verificación del reto sí distingue cada condición de incumplimiento.
   - Modo Medición: `sweepRun()` completó el barrido de las 10 fracciones de amplitud
     (`_sweepTrace.length===10`), y el punto de disipación máxima del barrido cayó
     exactamente en frac=0.637 — confirmando en la implementación real (no solo en el
     cálculo aislado) el hallazgo central de la práctica: el peor caso térmico no es el
     volumen máximo.
   El script de verificación era temporal (`scripts/_verify-etapa-clase-ab.mjs`) y se
   borró tras confirmar el resultado, siguiendo el patrón ya usado en mecanica-36/37/38.
4. **Petición concreta al experto:** (a) confirmar los valores exactos de RθJC, RθJA y
   Tj_max del TIP31C/TIP32C contra la hoja de datos vigente del fabricante; (b) confirmar
   si el margen de diseño Tj_seguro=130 °C (20 °C bajo Tj_max) es un criterio razonable o si
   debería expresarse como un porcentaje de Tj_max; (c) confirmar si los valores ilustrativos
   de ICQ por preset de polarización son pedagógicamente representativos o si convendría
   anclarlos a una hoja de datos específica; (d) confirmar la clave exacta del submódulo
   curricular contra el plan vigente; (e) confirmar si la reconciliación de tandas descrita
   en la nota 1 (D5 como continuación natural de D2, según la fila T4 de la lista maestra)
   es la decisión correcta antes de iniciar la construcción de d5-01/d5-02.
