# Ficha de práctica — Fuente de alimentación lineal regulada (`mecanica-17`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** cuarta práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Integra en una sola cadena los tres bloques ya
> validados por separado en `mecanica-14` (d2-01, diodo/Shockley), `mecanica-15` (d2-02,
> rectificador de puente) y `mecanica-16` (d2-03, zener/regulación shunt), y añade el
> regulador lineal de 3 terminales como cuarto bloque nuevo.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-17
sector: mecanica-electronica
practica_maestra: "d2-04 — Fuente de alimentación lineal regulada: transformador reductor + puente rectificador + capacitor de filtro (integración RK4 exacta) + regulador lineal de 3 terminales, margen de regulación (headroom), disipación de potencia (exacta vs. fórmula de libro de texto) y temperatura de unión contra disipador seleccionable (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 (Mecatrónica, Módulo I, Submódulo 2) · ETR-I.2 (Electrónica/Tecnología, resultado I.2)"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Fuentes de alimentación lineales reguladas"          # ⚑ confirmar clave exacta del plan vigente
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de describir la cadena completa de una fuente
  lineal (transformador reductor, puente rectificador, capacitor de filtro, regulador de
  3 terminales); explicar el concepto de margen de regulación (headroom) entre el valle
  del voltaje filtrado y Vout+Vdropout, y reconocer cuándo y por qué se pierde; calcular
  la disipación de potencia del regulador de dos formas (exacta y por fórmula simplificada
  de libro de texto) y explicar por qué pueden divergir en condiciones de dropout profundo;
  calcular la temperatura de unión en estado estable y contrastarla contra el límite del
  fabricante; y seleccionar un disipador (o rediseñar el transformador/capacitor) para
  mantener al regulador dentro de su ventana térmica y de regulación segura en un peor
  caso declarado de línea, temperatura ambiente y carga.
actividad_clave: >
  Recorre la cadena transformador → puente → filtro → regulador sobre un esquema
  interactivo con osciloscopio de doble trazo (voltaje filtrado y voltaje regulado): en
  el modo Explora, toca el esquema para revelar los valores y cambia el tap del
  transformador (6–18 V), el capacitor de filtro (100 µF–4700 µF), el disipador, la línea
  (114–140 V) y la corriente de salida, observando el margen de regulación en vivo; en
  Predicción calcula Vs_rms, el voltaje de filtro con su rizo y la disipación de potencia
  antes de ver el medidor; en Barrido mide cómo se degrada el margen de regulación al
  variar la corriente de salida o el capacitor de filtro; y en el Reto evalúa un escenario
  de peor caso térmico (línea, ambiente, transformador y disipador dados) y determina si
  la temperatura de unión se mantiene dentro del límite del fabricante.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce los cuatro bloques de la cadena: transformador reductor ideal (Vs_rms = Vsec·Vlínea/127, escalando con la línea real de 114–140 V), puente rectificador de silicio, capacitor de filtro y regulador lineal de 3 terminales tipo 7805, con esquema IEC 60617."
  - "Modo Explora: toca el esquema, el osciloscopio o los componentes del banco para revelar los valores (mecánica de descubrimiento, no se muestran de entrada); cambia entre 5 taps de transformador (6–18 V), 6 valores de capacitor de filtro (100 µF–4700 µF), 4 escalones de disipador, la línea (114–140 V) y la corriente de salida, y observa el trazo dual del osciloscopio (voltaje filtrado con su rizo vs. voltaje regulado)."
  - "Verifica que el puente reutiliza el mismo modelo de Shockley de dos uniones en serie (Is=8.4e-10 A, n=1.85 por unión) ya validado en la práctica de rectificación (mecanica-15/d2-02), y que el capacitor de filtro se integra por Runge-Kutta de 4º orden (RK4) exacto contra la corriente total demandada (Iout+Iq del regulador) — no por la fórmula aproximada de rizo de un solo término."
  - "Identifica el concepto de margen de regulación (headroom): el regulador exige que el valle del voltaje filtrado supere Vout+Vdropout (con Vdropout dependiente de la corriente de salida); cuando ese margen se agota, el rizo del capacitor se filtra hacia la salida muestra a muestra — condición reproducida por el motor de cálculo, no solo señalada como bandera booleana."
  - "Modo Predicción: dado un circuito completo (tap de transformador, línea, capacitor, corriente de salida), predice Vs_rms, el voltaje de filtro promedio con su rizo y la disipación de potencia del regulador — antes de que el medidor se revele (tolerancias definidas por campo)."
  - "Modo Barrido: recorre la corriente de salida o el capacitor de filtro con todo lo demás fijo, y observa cómo se degrada el margen de regulación a medida que crece la demanda o se achica el capacitor."
  - "Modo Reto: con un escenario de peor caso dado (línea, temperatura ambiente, tap de transformador y disipador), calcula la disipación de potencia y la temperatura de unión en estado estable, y determina si se mantiene por debajo de Tj,max del fabricante — y si no, qué palanca (disipador, transformador, capacitor) la resolvería."
  - "Compara explícitamente las dos formas de calcular la disipación de potencia del regulador — exacta (integración RK4, promedio muestra a muestra) y por la fórmula simplificada de libro de texto con Vfiltro promedio — y responde por qué la fórmula simple puede dar un resultado sin sentido físico (negativo) cuando el regulador pasa buena parte del ciclo en dropout profundo."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito)."
  - "⚑ No se confirmó un número de norma IEC específico y verificado que aplique formalmente a esta topología de fuente lineal completa como práctica educativa (IEC 60747 cubre dispositivos semiconductores discretos de forma general). Usar solo como referencia de contexto hasta que un experto lo confirme."
simulador_modela:      # 🔒
  - "Variación realista de la tensión de línea (114–140 V, nominal 127 V/60 Hz en México) escalada al secundario del transformador ideal (Vs_rms = Vsec·Vlínea/127), con 5 taps de transformador (6, 9, 12, 15, 18 V)."
  - "Rectificación de puente completo con el modelo exacto de Shockley de dos uniones en serie (Is=8.4e-10 A, n=1.85 por unión) — mismos parámetros del banco de rectificación (mecanica-15/d2-02)."
  - "Integración numérica RK4 exacta del capacitor de filtro (6 valores, 100 µF–4700 µF) contra la corriente total demandada (Iout+Iq del regulador), sin aproximación de rizo lineal de un solo término."
  - "Caída de dropout del regulador dependiente de la corriente (Vdo=Vdo0+Vdo_k·Iout), con la condición real de pérdida de regulación cuando el valle del voltaje filtrado cae por debajo de Vout+Vdo, reproducida muestra a muestra (no solo como bandera booleana) — el rizo se 'filtra' hacia la salida."
  - "Limitación de corriente con recorte progresivo (foldback) ilustrativo por encima de un umbral típico de hoja de datos."
  - "Disipación de potencia del regulador calculada de dos formas — exacta (promedio del producto instantáneo (Vfiltro−Vout)·Iout+Vfiltro·Iq muestra a muestra, vía RK4) y por la fórmula de libro de texto (con Vfiltro promedio) — mostradas ambas explícitamente en el modo Explora para que el estudiante las compare, incluyendo el caso en que la fórmula simple da un resultado negativo sin sentido físico bajo dropout profundo."
  - "Temperatura de unión en estado estable Tj=Ta+Pd·θtotal contrastada contra Tj,max≈125°C, con selector de disipador (4 escalones: sin disipador/protoboard ≈80°C/W, PCB con buen cobre ≈58°C/W, disipador pequeño ≈30°C/W, disipador grande ≈12°C/W, todos rangos representativos de categoría) y de temperatura ambiente."
  - "Mecánica de descubrimiento por contacto: en modo Explora, el voltaje de filtro y el voltaje regulado permanecen ocultos ('¿?') tanto en la telemetría lateral como en la pantalla del medidor del banco 3D hasta que el estudiante toca el capacitor y el regulador en el esquema — ambas superficies (HUD y pantalla 3D) respetan el mismo candado de revelado."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Tiempo de recuperación inversa (trr) de los diodos: las hojas de datos consultadas de la familia 1N400x y de los puentes DB10x no ofrecen una cifra de trr suficientemente confiable y consistente entre fabricantes; se omite por completo del motor de cálculo."
  - "Saturación de núcleo y armónicos del transformador: se modela como transformador ideal con relación de vueltas fija; un transformador real satura a alta corriente y genera distorsión armónica en la corriente de línea."
  - "Dinámica térmica transitoria: Tj se calcula en estado estable (Ta+Pd·θtotal); no se modela la constante de tiempo térmica real del encapsulado ni el comportamiento ante pulsos de carga breves."
  - "Tolerancias de componentes: transformador, diodos, capacitor y regulador se tratan con parámetros nominales fijos — en la práctica real, Vsec, Vout y θJA varían pieza a pieza dentro del rango de tolerancia del fabricante."
  - "Apagado térmico real y modos de falla no ideales: el foldback de corriente y el límite Tj,max son ilustrativos del comportamiento típico de hoja de datos; no se modela el apagado térmico exacto, su histéresis de reactivación, ni fallas como cortocircuito del regulador."
  - "Ruido de conmutación/EMI: no aplica a esta topología lineal (sin conmutación), pero tampoco se modela el ruido de rectificación de alta frecuencia ni el acoplamiento capacitivo del transformador."
  - "Corriente pico exacta de recarga de los diodos: el simulador muestra su tendencia cualitativa (crece con capacitores más grandes) pero no reporta una cifra numérica de pico — sensible a resistencia serie e impedancia de fuente no modeladas aquí con precisión suficiente."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: escenario de peor caso dado (línea, Ta, transformador, disipador), cálculo de Pd (ambas formas) y Tj, y decisión justificada de si el diseño se mantiene dentro de Tj,max o qué palanca (disipador/transformador/capacitor) lo resolvería, aceptada por el simulador."
evidencia_desempeno: "Guía de observación del modo Predicción (Vs_rms, voltaje de filtro con rizo, Pd) y del modo Barrido (degradación del margen de regulación al variar Iout o el capacitor de filtro)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué una fuente lineal es una cadena de cuatro bloques donde cada uno le entrega al siguiente un problema distinto, y qué es el margen de regulación que el regulador de 3 terminales necesita para funcionar (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → predice → barrido → reto de diseño térmico con predicción obligatoria."
cierre: "Ficha técnica (capa 2) con los parámetros del puente, el regulador LM7805, los cuatro escalones de disipador, el motor RK4/Shockley y el procedimiento de medición física con transformador variable, osciloscopio y disipador atornillable."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Texas Instruments, hoja de datos LM78XX Series Voltage Regulators (lit. SNOSBR7) — Vout, dropout, Iq, θJC, θJA, Tj,max y apagado térmico del regulador LM7805 modelado aquí."
  - "ON Semiconductor, hoja de datos 1N4001–1N4007 (Rev. 13) — VRRM, IF(AV), VF e IFSM de la familia de diodos de referencia."
  - "Diodes Incorporated, hoja de datos 1N4001–1N4007 (DS28002) — valores de contraste para los mismos parámetros de la familia de diodos."
  - "Diodes Incorporated, hoja de datos DB101–DB107 (DS21211) — VRRM, IF(AV), VF e IFSM del puente rectificador integrado modelado aquí."
  - "Boylestad, R.L. y Nashelsky, L., Electronic Devices and Circuit Theory (Pearson) — análisis de la fuente lineal completa: rectificación, filtro y regulación; edición/página local no verificada en esta sesión."
  - "Sedra, A.S. y Smith, K.C., Microelectronic Circuits (Oxford) — modelo de diodo y análisis de rizo del capacitor de filtro; edición/página local no verificada."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.2 / ETR-I.2 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); no se confirmaron contra ningún catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ Tiempo de recuperación inversa (trr): las hojas de datos consultadas de la familia 1N400x y de los puentes DB10x no reportan una cifra consistente y confiable entre fabricantes; se omitió por completo del motor de cálculo en vez de mostrar un número no verificado — decisión de honestidad, no de simplificación arbitraria."
  - "⚑ θJA del regulador con disipador (4 escalones: ≈80/58/30/12 °C/W) y IFSM del puente (≈30–50 A pico): ambas cifras son rangos representativos por categoría, no valores medidos de una pieza o layout específicos. Un experto con acceso a datasheets de disipadores y puentes concretos debe confirmar si estos rangos son razonables para el material didáctico usado en el plantel antes de escalar el patrón."
  - "⚑ Iq del regulador (5–8 mA típico–máximo) se modela con dos valores porque la hoja de datos reporta un rango, no un único número; no se investigó si existe una cifra más precisa por lote/fabricante específico."
  - "⚑ No se investigó ni verificó si existe una NOM mexicana aplicable específicamente al diseño o la práctica educativa de fuentes lineales reguladas; no se forzó una cita NOM no verificada."
  - "⚑ CORREGIDO antes de commitear (ver Notas para el revisor): la verificación con Playwright de este simulador encontró dos defectos de fidelidad/pedagogía en la implementación (no en la investigación de parámetros) — la comparación Pd exacta vs. fórmula de libro de texto se calculaba pero no se mostraba en pantalla, y la pantalla del medidor del banco 3D no respetaba el candado de revelado del modo Explora. Ambos se corrigieron y se re-verificaron antes de integrar el lab; se documentan como caso de estudio de por qué la verificación debe revisar también el resultado visual/funcional, no solo la ausencia de errores de consola."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (cuarta práctica de Tanda 1 / D2):** d2-04 integra en una sola
   cadena los tres bloques ya validados por separado en `mecanica-14` (d2-01, diodo),
   `mecanica-15` (d2-02, puente rectificador) y `mecanica-16` (d2-03, zener/regulación
   shunt), y añade el regulador lineal de 3 terminales como cuarto bloque nuevo — si este
   patrón de "integrar bloques previos + un bloque nuevo" es adecuado y sostenible, se
   replica en el resto de D2 (BJT, MOSFET); si sobra o falta, se ajusta antes de continuar
   la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/fuentelineal.html](../../../public/labs/fuentelineal.html)) muestra el
   panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros de hoja de
   datos del puente, el regulador LM7805 y los cuatro escalones de disipador, de modo que
   el alumno y el evaluador ven las fronteras del modelo dentro de la práctica.
3. **Dos defectos de implementación encontrados y corregidos durante la verificación
   (ver bandera ⚑ final):** la verificación automatizada (Playwright) de este lab confirmó
   que el motor de cálculo no lanza errores en ninguno de los cuatro modos, pero la
   revisión adversarial del resultado — tanto del JSON de depuración como de las capturas
   visuales de cada modo — encontró dos defectos reales que una prueba puramente mecánica
   ("¿corre sin errores?") no detecta: (a) la disipación de potencia por fórmula de libro
   de texto se calculaba internamente pero nunca se mostraba en pantalla, pese a que la
   ficha técnica promete explícitamente que el estudiante puede "comparar ambas"; y (b) la
   pantalla del medidor en el banco 3D revelaba el voltaje regulado antes de que el
   estudiante tocara el capacitor y el regulador en el esquema, mientras que la telemetría
   lateral sí respetaba ese candado — dos superficies del mismo dato con reglas de
   revelado distintas. Ambos se corrigieron para que el reporte muestre la comparación
   completa y para que la pantalla del medidor use exactamente la misma condición de
   revelado que la telemetría lateral. Se documenta aquí como recordatorio de que la
   verificación de un lab debe incluir revisión visual y de fidelidad pedagógica, no solo
   ausencia de errores de consola.
4. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) confirmar si los cuatro escalones de θ de disipador (≈80/58/30/12 °C/W) son
   representativos del material didáctico disponible en el plantel; (c) confirmar si el
   rango de Iq (5–8 mA) y el IFSM del puente (≈30–50 A pico) son razonables para el tipo
   de puente/regulador que un técnico encuentra en campo; (d) confirmar que la cadena
   transformador+puente+filtro+7805 es representativa de lo que un técnico de este sector
   repara o construye con más frecuencia frente a topologías alternativas (p. ej. reguladores
   ajustables tipo LM317).
