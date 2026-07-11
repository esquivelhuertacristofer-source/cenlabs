# Ficha de práctica — LED, Schottky y TVS: selección de dispositivo y protección (`mecanica-18`)

> Documento de **revisión experta**. NO lo importa el codegen (`gen-lab-registry.mjs`
> ignora todo archivo que no sea `index.ts` / `catalogo.ts` / `components.ts`), así que
> vive junto al lab sin afectar el build. Los campos 🔒 son donde vive la veracidad de
> ingeniería y **exigen validación de un especialista del sector** antes de escalar el patrón.
>
> **Rol adicional:** quinta práctica de la **Tanda 1 (D2 — Electrónica analógica y de
> potencia)**, dominio con hueco total 🔴 en la matriz de cobertura
> (`docs/LISTA-MAESTRA-200-PRACTICAS.md`). Reutiliza el motor de diodo (Shockley) de
> `mecanica-14` (d2-01) y el modelo zener por tramos de `mecanica-16` (d2-03), y los pone
> a competir con dos dispositivos nuevos (LED, Schottky) y uno de protección nuevo (TVS)
> dentro de una sola práctica de comparación.

```yaml
# Ficha de práctica CEN Labs — alineada a MCCEMS
id: mecanica-18
sector: mecanica-electronica
practica_maestra: "d2-05 — LED, Schottky y TVS: selección de dispositivo de conducción (R=(Vs−Vf)/If) y de protección contra transitorios (zener vs. TVS), resueltas ambas topologías por bisección numérica exacta (molde S+P)"
# --- Anclaje curricular oficial (trazabilidad) ---
programa_oficial: "MEC-I.2 (Mecatrónica, Módulo I, Submódulo 2)"   # ⚑ código interno del mapeo (LISTA-MAESTRA); no verificado contra un catálogo externo — confirmar con el responsable curricular
modulo: "Electrónica analógica y de potencia (D2)"
submodulo: "Polarización de LED y diodos especiales (Schottky, TVS)"          # ⚑ confirmar clave exacta del plan vigente
ocupacion_SINCO: "2641/7541 — Técnicos e instaladores/reparadores de equipos eléctricos y electrónicos"  # ⚑ verificar clave SINCO 2011
# --- Diseño de la práctica (formato oficial) ---
resultado_de_aprendizaje: >
  Al finalizar, el estudiante será capaz de calcular el resistor limitador de corriente
  de un LED (R=(Vs−Vf)/If); explicar por qué la caída directa (Vf) de un LED, un Schottky
  y un rectificador de silicio es distinta y qué decisión de diseño motiva cada elección;
  distinguir la topología de conducción (serie) de la de protección (shunt) en un circuito
  con diodos; comparar el comportamiento de clampeo de un zener contra un TVS ante un
  transitorio de sobrevoltaje; y seleccionar un dispositivo de protección y un resistor
  serie que mantengan un nodo protegido por debajo de un voltaje máximo declarado.
actividad_clave: >
  Recorre dos topologías (conducción serie y protección shunt) sobre un esquema
  interactivo con osciloscopio: en el modo Explora, toca el esquema para revelar los
  valores y alterna entre LED/Schottky/Silicio (conducción) o Zener/TVS (protección),
  variando el resistor serie Rs y la fuente Vs, observando el punto de operación Q sobre
  la curva I-V de cada dispositivo; en Predicción calcula voltaje, corriente o el resistor
  limitador requerido antes de ver el medidor; en Barrido superpone las curvas I-V de toda
  una familia de dispositivo para comparación visual directa; y en el Reto diseña una
  protección (dispositivo + Rs) que mantenga un nodo por debajo de un voltaje máximo dado.
desarrollo:            # 🔒 los pasos técnicos — revisión experta
  - "Reconoce las dos topologías del lazo: conducción (serie, Vs–Rs–dispositivo, el dispositivo permite y limita el paso de corriente) y protección (shunt, Vs–Rs–dispositivo con la carga protegida idealizada como alta impedancia aguas abajo, el dispositivo permanece apagado en operación normal y solo conduce para recortar un transitorio), con esquema IEC 60617."
  - "Modo Explora: toca el esquema o los componentes del banco para revelar los valores (mecánica de descubrimiento, no se muestran de entrada); alterna entre Conducción (LED rojo, Schottky 1N5819, silicio 1N4007) y Protección (Zener 1N4733A, TVS SMAJ5.0A), cambia el resistor serie Rs (47 Ω–2.2 kΩ) y la fuente Vs, y observa el punto de operación Q sobre la curva I-V del dispositivo elegido."
  - "Verifica que los tres dispositivos de conducción comparten la misma ecuación de Shockley I=Is·[exp(V/(n·VT))−1] con pares (Is, n) distintos por dispositivo (LED: Is=1e-14 A, n=2.6; Schottky 1N5819: Is=9.3e-8 A, n=1.373; silicio 1N4007: Is=8.4e-10 A, n=1.85, mismo par ya validado en mecanica-15/d2-02), y que el lazo se resuelve por bisección exacta sobre (Vs−V)/Rs−I(V)=0, no por aproximación lineal."
  - "Verifica que el zener reutiliza el modelo lineal por tramos (corte/codo/avalancha) ya validado en mecanica-16/d2-03, y que el TVS usa un modelo lineal por 2 tramos (Iclamp=0 bajo VBR; Iclamp=(V−VBR)/Rdyn sobre VBR) anclado a VBR(mín)=6.4 V y a la pendiente Rdyn derivada de VC(máx)=9.2 V @ IPP=43.5 A de hoja de datos — ambos resueltos por bisección exacta en el lazo shunt."
  - "Modo Predicción: dado un circuito de conducción (Vs, Rs, dispositivo) o de protección (Vs, Rs, dispositivo de clampeo), predice el voltaje/corriente resultante o el resistor limitador requerido — antes de que el medidor se revele (tolerancias definidas por campo)."
  - "Modo Barrido: recorre Vs con todo lo demás fijo y superpone las curvas I-V de los tres dispositivos de conducción, o del zener contra el TVS en protección, para comparar visualmente pendientes y codos de ruptura."
  - "Modo Reto: dado un voltaje máximo tolerado por un componente aguas abajo, elige el dispositivo de protección (zener o TVS) y el resistor serie Rs que mantengan el nodo protegido por debajo de ese límite con el mayor margen posible."
normatividad:          # 🔒 verificar clave y vigencia
  - "IEC 60617 — símbolos gráficos para esquemas eléctricos (representación normalizada del circuito)."
  - "IEC 61000-4-5 — Electromagnetic compatibility, Testing and measurement techniques, Surge immunity test: referencia de contexto sobre las formas de onda estándar de transitorios (1.2/50 µs, 8/20 µs) usadas para especificar TVS; citada como marco de referencia, no como norma verificada línea por línea en esta investigación."
  - "⚑ No se identificó una NOM mexicana que aplique directamente a la selección de componentes LED/Schottky/TVS a nivel de dispositivo. Confirmar con el equipo curricular si el programa MCCEMS exige citar una NOM específica para esta práctica."
simulador_modela:      # 🔒
  - "Ecuación de Shockley I=Is·[exp(V/(n·VT))−1] con tres pares (Is, n) específicos: LED rojo (Is=1e-14 A, n=2.6), Schottky 1N5819 (Is=9.3e-8 A, n=1.373, corregido a VF=0.55–0.60 V @ 1 A tras verificación — ver bandera de corrección abajo), silicio 1N4007 (Is=8.4e-10 A, n=1.85, mismo par de mecanica-15/d2-02), en un lazo serie de conducción resuelto por bisección exacta sobre (Vs−V)/Rs−I(V)=0."
  - "Resistor limitador de corriente del LED calculado exactamente como R=(Vs−Vf)/If en el punto de operación resuelto por el motor, no con un Vf de un solo decimal fijo."
  - "Modelo zener lineal por tramos (corte, codo, avalancha) idéntico al de mecanica-16/d2-03, anclado a VZ=5.1 V, IZT=49 mA, ZZT=7 Ω, IZK=1 mA, ZZK=500 Ω, IZM=178 mA, PD=1 W (1N4733A)."
  - "Modelo TVS lineal por 2 tramos anclado a VBR(mín)=6.4 V y VC(máx)=9.2 V @ IPP=43.48 A (forma de onda estándar 10/1000 µs, SMAJ5.0A), con VRWM=5 V como voltaje de standoff bajo el cual la fuga se idealiza en 0."
  - "Verificación de márgenes de seguridad con indicador visual de estado: sobrecorriente en conducción (If máximo del dispositivo), ventana IZK–IZM del zener, e IPP del TVS."
  - "Modo Barrido con superposición de curvas I-V de toda una familia de dispositivo (conducción: LED/Schottky/Si; protección: Zener/TVS) para comparación visual directa de pendientes y codos."
  - "Mecánica de descubrimiento por contacto: en modo Explora, los valores de voltaje/corriente/potencia permanecen ocultos ('¿?') tanto en la telemetría lateral como en la pantalla del medidor del banco 3D hasta que el estudiante toca el circuito en el esquema — ambas superficies respetan el mismo candado de revelado."
simulador_NO_modela:   # 🔒 evita la sobre-afirmación
  - "Dependencia de temperatura (Eg, XTI): a diferencia de mecanica-14/d2-01, aquí se asume temperatura de unión constante (300.15 K) en todo momento — el enfoque pedagógico de esta práctica es la selección de dispositivo por familia, no el coeficiente de temperatura (ya cubierto en la práctica del diodo básico)."
  - "Salida óptica del LED en unidades fotométricas reales (lúmenes, candelas/mcd, distribución espectral): el brillo en el banco 3D es una señal cualitativa (más If → más brillo aparente), nunca una cifra de lm calibrada."
  - "Curva completa de derateo de potencia pico de pulso (PPPM vs. ancho de pulso) del TVS: se conoce solo el punto de la forma de onda estándar 10/1000 µs; no se extrapola a otras duraciones."
  - "Corriente de fuga bajo el umbral de conducción de ningún dispositivo (zener bajo el codo, TVS bajo VRWM): ambas se idealizan en 0 exacto; un dispositivo real conduce una fuga pequeña pero no nula incluso en reposo."
  - "Impedancia de carga aguas abajo del nodo protegido: se idealiza como impedancia infinita (no consume corriente) — razonable para proteger una entrada digital de bajo consumo, no válida si la carga real demanda corriente significativa."
  - "Inductancia parásita de línea/PCB: el modelo resuelve un circuito puramente resistivo en estado estable; no incluye la caída adicional L·di/dt que en la práctica real es una causa común de que una protección 'bien diseñada en papel' falle ante un transitorio rápido."
  - "Tiempo de recuperación inversa (trr) de los diodos de conducción y tiempo de respuesta del zener/TVS: el modelo resuelve directamente el punto de operación en estado estable, no la dinámica de conmutación."
  - "Acoplamiento térmico dinámico / autocalentamiento, ni el comportamiento físico de falla ante sobre-rating repetitivo (solo se indica 'fuera de rango')."
# --- Evaluación (instrumentos oficiales) ---
evidencia_producto: "Hoja de diseño del reto: dado un voltaje máximo tolerado por un componente aguas abajo, dispositivo de protección elegido (zener o TVS), resistor serie Rs elegido, y justificación de por qué esa combinación mantiene el nodo protegido por debajo del límite, aceptada por el simulador."
evidencia_desempeno: "Guía de observación del modo Predicción (voltaje/corriente/resistor limitador en conducción y protección) y del modo Barrido (comparación de curvas I-V entre familias de dispositivo)."
instrumento: rubrica
# --- Secuencia (momentos) → encaja en briefing/tutor/quiz ---
apertura: "Briefing: por qué la misma ecuación de diodo produce comportamientos tan distintos entre LED, Schottky y silicio, y por qué la topología shunt de protección (zener/TVS) resuelve un problema distinto al de la topología serie de conducción (briefing.ts)."
desarrollo: "Práctica en el simulador: explora → predice → barrido → reto de diseño de protección con predicción obligatoria."
cierre: "Ficha técnica (capa 2) con los parámetros de LED/Schottky/Si/Zener/TVS, el motor de bisección exacta de ambas topologías y el procedimiento de medición física con fuente variable, resistores de precisión y multímetro."
# --- Veracidad ---
fuentes:               # 🔒 sin fuente = marcar 'verificar'
  - "Vishay General Semiconductor / STMicroelectronics, datasheet '1N5817, 1N5818, 1N5819 Low Drop Power Schottky Rectifiers' — VF, VRRM, IF(AV) de la familia Schottky de referencia."
  - "MACOM, 'Axial Lead Schottky Diode 1N5819' Rev V1 — valor de contraste VF=550 mV máx @ 1 A del 1N5819."
  - "Diodes Incorporated, datasheet familia 1N4728A–1N4764A (incluye 1N4733A) ds18007 — VZ, ZZT, IZK, ZZK, IZM, PD del zener de referencia (mismo dispositivo de mecanica-16/d2-03)."
  - "Littelfuse / Vishay General Semiconductor / Bourns, datasheets 'TVS Diodes SMAJ Series' — VBR(mín), VC(máx)@IPP, VRWM, PPPM del TVS SMAJ5.0A."
  - "Datasheets genéricos de LED rojo 5mm: SparkFun COM-09590, Adafruit #299 — rango típico de Vf (usado como rango, no como cifra de fabricante único)."
  - "Sedra, A.S. y Smith, K.C., Microelectronic Circuits (Oxford) — modelo de Shockley, factor de idealidad, diseño de resistor limitador para LED."
  - "Boylestad, R.L. y Nashelsky, L., Electronic Devices and Circuit Theory (Pearson) — comparación de caída directa entre familias de diodo y ecuaciones de diseño de resistor serie."
  - "Malvino, A.P. y Bates, D.J., Electronic Principles (McGraw-Hill) — diodos Schottky de baja caída directa y su aplicación en rectificación de alta eficiencia."
  - "IEC 60617 — Graphical symbols for diagrams (base de datos de símbolos normalizados)."
  - "IEC 61000-4-5 — formas de onda estándar de transitorios, referencia de contexto para la especificación de TVS."
banderas_incertidumbre:
  - "⚑ Anclaje curricular (MEC-I.2 / submódulo / SINCO): claves tomadas del mapeo interno (LISTA-MAESTRA); no se confirmaron contra ningún catálogo o estándar externo durante la investigación. Verificar contra el plan de estudios vigente antes de publicar la trazabilidad."
  - "⚑ CORREGIDO antes de codificar el motor: la investigación inicial atribuyó VF(máx)@1A=0.45V al 1N5819 (40V), mezclando el dato de la parte hermana 1N5817 (20V) de la misma familia. El patrón real de la familia Vishay/ST 1N5817/1N5818/1N5819 es que a mayor VRRM, mayor VF (0.45V/0.55V/0.60V respectivamente) — el 1N5819 usado en esta práctica usa VF=0.55–0.60V@1A (Is=9.3e-8 A, n=1.373), consistente con MACOM '550 mV máx'. El valor de 0.45V se documenta explícitamente en la ficha técnica (s2, s6) como perteneciente al 1N5817, no al 1N5819, para que el estudiante no lo confunda si lo encuentra en una fuente secundaria."
  - "⚑ El Vf de LED rojo 5mm (rango 1.8–2.2 V @ 20 mA, con Is=1e-14 A y n=2.6 dando Vf≈1.9V@20mA en el modelo) es un promedio de datasheets genéricos de revendedor (SparkFun/Adafruit), no de un part number de fabricante único — aceptable para modelar un 'LED rojo hobbista típico', pero de menor rigor que Schottky/TVS/Zener, que sí están anclados a datasheet de fabricante primario. Si se busca fijar un part number concreto, considerar un Kingbright específico como referencia primaria."
  - "⚑ El factor de idealidad n=2.6 usado para el LED (reutilizado del valor ya validado en mecanica-14/d2-01) está ligeramente por encima del rango n≈1.8–2.5 típico de LEDs rojos AlGaInP/GaAsP; el rango n=2–8 de la literatura general aplica sobre todo a LEDs azules/blancos de GaN. Se documenta como aproximación aceptada (el Vf resultante ≈1.9V@20mA sigue siendo físicamente razonable), no como corrección bloqueante."
  - "⚑ La curva de derateo de potencia de pulso del TVS vs. ancho de pulso NO fue digitalizada; el modelo usa solo el punto de la forma de onda estándar 10/1000 µs (VC(máx)@IPP=43.48A) y no debe extrapolarse a otras duraciones de pulso."
  - "⚑ La corriente de prueba IT usada para especificar VBR del SMAJ5.0A (típicamente 1 mA para TVS de bajo voltaje, no 10 mA) no se ancla explícitamente en el modelo del simulador; queda como nota de trazabilidad para el procedimiento físico (s4 de la ficha técnica)."
  - "⚑ CORREGIDO antes de commitear (ver Notas para el revisor): la verificación con Playwright de este simulador encontró un defecto de fidelidad en la implementación (no en la investigación de parámetros) — el modo Reto forzaba la categoría a 'Protección' solo la primera vez que se entraba a ese modo, dejando la categoría incorrecta (y el panel de dispositivo equivocado, oculto) en entradas subsiguientes o en la carga inicial de la página. Se corrigió y se re-verificó antes de integrar el lab; se documenta como caso de estudio de un patrón de bug general (efecto secundario de una función acoplado a una condición de invocación única) a vigilar en las prácticas d2-06…d2-10."
```

## Notas para el revisor experto

1. **Objetivo de esta ficha (quinta práctica de Tanda 1 / D2):** d2-05 reutiliza el motor
   de Shockley ya validado en `mecanica-14` (d2-01, diodo) y el modelo zener por tramos de
   `mecanica-16` (d2-03, regulación shunt), y los pone a competir dentro de una sola
   práctica de comparación entre familias — dos dispositivos de conducción nuevos (LED,
   Schottky) y un dispositivo de protección nuevo (TVS) frente al zener ya conocido. Si
   este patrón de "comparación entre familias con motor reutilizado" es adecuado y
   sostenible, se replica donde aplique en el resto de D2; si sobra o falta, se ajusta
   antes de continuar la tanda.
2. **Dónde vive el contrato en la app:** el simulador
   ([public/labs/protecciondiodo.html](../../../public/labs/protecciondiodo.html))
   muestra el panel "🔒 Contrato de fidelidad" (Sí modela / NO modela) con los parámetros
   de hoja de datos de los cinco dispositivos, de modo que el alumno y el evaluador ven
   las fronteras del modelo dentro de la práctica.
3. **Un defecto de implementación encontrado y corregido durante la verificación (ver
   bandera ⚑ final):** la verificación automatizada (Playwright) de este lab confirmó que
   el motor de cálculo no lanza errores en ninguno de los cuatro modos, pero la revisión
   adversarial del resultado — tanto del JSON de depuración como de las capturas visuales
   de cada modo, y de una reproducción manual del flujo real de uso (explorar Conducción
   y luego entrar a Reto) — encontró un defecto real que una prueba puramente mecánica
   ("¿corre sin errores?") no detecta: la función `newReto()` tenía como efecto secundario
   forzar la categoría a 'Protección' (`cat='prot'`), pero el único punto que la invocaba
   (`setMode('reto')`) solo la llamaba condicionalmente, la primera vez que se entraba a
   Reto (`if(k==='reto'&&!RETO)newReto();`). Esto causaba dos síntomas: (a) la carga
   inicial de la página mostraba incorrectamente 'Protección' en vez del valor por
   defecto declarado del módulo (`cat='cond'`), porque la inicialización llamaba a
   `newReto()` antes de fijar el modo Explora; y (b) reentrar a Reto después de usar
   Conducción dejaba la categoría de Conducción activa, ocultando por completo el panel
   de selección de dispositivo de protección (Zener/TVS). Se corrigió separando el efecto
   secundario de la generación del reto: `setMode()` ahora fuerza `cat='prot'`
   incondicionalmente en cada entrada a Reto, y `newReto()` solo genera el reto en sí. Se
   documenta aquí como recordatorio de que la verificación de un lab debe incluir
   reproducción manual de flujos de uso realistas (no solo la ruta feliz de un script
   automatizado), y como patrón general a vigilar en d2-06…d2-10: una función invocada
   condicionalmente no debe cargar efectos secundarios que otras rutas de código
   necesitan incondicionalmente.
4. **Petición concreta al experto:** (a) confirmar o corregir las claves curriculares ⚑;
   (b) confirmar si el rango de Vf del LED rojo genérico (1.8–2.2 V @ 20 mA) es
   representativo del material didáctico disponible en el plantel, o si conviene fijar un
   part number concreto; (c) confirmar que la corrección aplicada al VF del 1N5819
   (0.55–0.60 V, no 0.45 V) es correcta contra el datasheet Vishay/ST específico que se
   use en el plantel; (d) confirmar si la comparación zener-vs-TVS (regulación continua
   vs. transitorio rápido) es la distinción pedagógica más relevante para un técnico de
   este sector, o si conviene enfatizar otro contraste (p. ej. capacitancia parásita del
   TVS en líneas de datos de alta velocidad, fuera del alcance actual del modelo).
