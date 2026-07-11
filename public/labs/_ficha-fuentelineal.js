/* Ficha técnica · Fuente de Alimentación Lineal Regulada — contenido específico del lab */
fichaTecnica({
  title: 'Fuente de alimentación lineal regulada (transformador + puente + filtro + 7805)',
  intro: 'Este laboratorio modela la cadena completa de una <b>fuente de alimentación lineal</b>: transformador reductor ideal, <b>puente rectificador</b> de silicio, <b>capacitor de filtro</b> y <b>regulador lineal de 3 terminales tipo 7805</b>. El puente reutiliza el mismo <b>modelo de Shockley de dos uniones en serie</b> (parámetros Is y n) ya validado en la práctica de rectificación de este banco, y el capacitor de filtro se integra por <b>Runge-Kutta de 4º orden (RK4) exacto</b> contra una carga de corriente cuasi-constante — no por la fórmula aproximada de rizo de un solo término. El regulador se modela con su caída de <b>dropout</b> dependiente de la corriente y con <b>limitación de corriente (foldback)</b> ilustrativa. El montaje 3D es <b>procedural y didáctico</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> variación realista de la tensión de línea (114–140 V, nominal 127 V/60 Hz en México) escalada al secundario del transformador (Vs_rms = Vsec·Vlínea/127); rectificación de puente completo con el modelo exacto de Shockley de dos uniones (Is = 8.4×10⁻¹⁰ A, n = 1.85 por unión — mismos parámetros del banco de rectificación); integración numérica RK4 exacta del capacitor de filtro contra la corriente total demandada (Iout + Iq del regulador), sin aproximación de rizo lineal; caída de dropout del regulador Vdo = Vdo0 + Vdo_k·Iout, con la condición real de <b>pérdida de regulación</b> cuando el valle del voltaje filtrado cae por debajo de Vout + Vdo (el rizo entonces "se filtra" hacia la salida, efecto que el modelo reproduce muestra a muestra, no solo como bandera booleana); limitación de corriente con recorte progresivo (foldback) ilustrativo por encima de un umbral típico; disipación de potencia del regulador calculada de <b>dos formas</b> — exacta (promedio del producto instantáneo (Vfiltro−Vout)·Iout+Vfiltro·Iq muestra a muestra) y por la fórmula de libro de texto (con Vfiltro promedio) — para que el estudiante compare ambas; temperatura de unión en <b>estado estable</b> Tj = Ta + Pd·θtotal contrastada contra Tj,max ≈ 125 °C, con selector de disipador (θ de protoboard sin disipador hasta disipador grande) y de temperatura ambiente.',
    omitidos: [
      '<b>Tiempo de recuperación inversa (trr) de los diodos</b>: las hojas de datos consultadas de la familia 1N400x y de los puentes DB10x no ofrecen una cifra de trr suficientemente confiable y consistente entre fabricantes para modelarla con honestidad numérica; se omite por completo — este simulador no reproduce el pico de conmutación asociado a trr.',
      '<b>Saturación de núcleo y armónicos del transformador</b>: se modela como transformador ideal con relación de vueltas fija; un transformador real satura a alta corriente y genera distorsión armónica en la corriente de línea que este modelo no captura.',
      '<b>Dinámica térmica transitoria</b>: Tj se calcula en <b>estado estable</b> (Ta + Pd·θtotal); no se modela la constante de tiempo térmica real del encapsulado ni el comportamiento ante pulsos de carga breves.',
      '<b>Tolerancias de componentes</b>: el transformador, los diodos, el capacitor y el regulador se tratan con parámetros nominales fijos — en la práctica real, Vsec, Vout y θJA varían pieza a pieza dentro del rango de tolerancia del fabricante.',
      '<b>Apagado térmico real y modos de falla no ideales</b>: el foldback de corriente y el límite Tj,max son ilustrativos del comportamiento típico de hoja de datos; no se modela el apagado térmico exacto, la histéresis de reactivación, ni fallas como cortocircuito del regulador.',
      '<b>Ruido de conmutación / EMI</b>: no aplica a esta topología lineal (sin conmutación), pero tampoco se modela el ruido de rectificación de alta frecuencia ni el acoplamiento capacitivo del transformador.',
      '<b>Corriente pico exacta de recarga de los diodos</b>: el simulador muestra su <b>tendencia cualitativa</b> (crece con capacitores más grandes) pero no reporta una cifra numérica de pico de corriente — un fenómeno real y relevante para el dimensionamiento de diodos, pero sensible a resistencia serie e impedancia de fuente no modeladas aquí con precisión suficiente.'
    ]
  },
  s2: {
    title: 'Dispositivos y parámetros del modelo',
    warn: 'Los parámetros aquí mostrados son <b>valores de hoja de datos, no medidos de una pieza física</b> ⚑. La corriente de quiescente Iq del regulador se modela con dos valores — típico (predicción y exploración) y máximo (modo Reto, peor caso) — porque la hoja de datos reporta un rango, no un único número. El θJA del disipador es un <b>rango representativo por categoría</b>, no una cifra de una pieza o layout específicos: el valor real depende del área de cobre, el flujo de aire y el montaje mecánico.',
    rows: [
      ['Elemento', 'Parámetros de hoja de datos (@ 25 °C salvo indicado)', 'Comportamiento típico'],
      ['Puente rectificador (tipo DB107)', 'VRRM = 1000 V · IF(AV) = 1.0 A · VF ≈ 1.0 V por elemento (≈2 V el puente completo) · IFSM ≈ 30–50 A (pico, pulso de 8.3 ms, cifra no precisa entre fabricantes)', 'Modelado con el mismo par de uniones Shockley (Is, n) que el banco de rectificación — dos uniones conducen en cada semiciclo'],
      ['Regulador LM7805 (TO-220)', 'Vin recomendado 7–25 V (abs. max 35 V) · Vout = 5 V ±4 % @25 °C (grado C, hoja completa especifica ±5 % en todo el rango) · dropout ≈ 2.0 V @1 A/25 °C · Iq = 5–8 mA (típico–máximo) · Iout ≤ 1.0 A · θJC ≈ 4–5 °C/W · θJA ≈ 50–65 °C/W (chip solo, sin disipador) · Tj,max = 125 °C continuo · apagado térmico ≈ 150–165 °C', 'Fuente: Texas Instruments, hoja de datos LM78XX (lit. SNOSBR7)'],
      ['Disipador — Sin disipador (protoboard)', 'θ ≈ 80 °C/W (rango representativo; sin cobre de disipación adicional)', 'Peor caso térmico — usado por defecto en el modo Reto'],
      ['Disipador — PCB, buen cobre', 'θ ≈ 58 °C/W (rango representativo)', 'Mejora moderada sin hardware adicional'],
      ['Disipador — pequeño', 'θ ≈ 30 °C/W (rango representativo de catálogo)', 'Aleta pequeña atornillada o pegada al TO-220'],
      ['Disipador — grande', 'θ ≈ 12 °C/W (rango representativo de catálogo)', 'Necesario solo a corrientes cercanas al máximo del regulador'],
      ['Diodo 1N4007 (referencia de familia)', 'VRRM = 1000 V · IF(AV) = 1.0 A @75 °C · VF,max = 1.1 V @1 A/25 °C · IFSM = 30 A (pulso único de 8.3 ms, norma JEDEC)', 'Parte de referencia de la familia 1N4001-4007; no usada directamente en el puente de este lab pero comparte fabricante y método de caracterización']
    ]
  },
  s3: [
    'Transformador reductor de línea a 6–18 V CA (varios devanados o transformador multi-tap), para reproducir el secundario que este lab varía por selector.',
    'Puente rectificador integrado tipo DB107 (o 4 diodos discretos 1N4001-4007), capacitores electrolíticos de filtro (100 µF – 4700 µF, observando la polaridad) y regulador de 3 terminales LM7805 con su hoja de datos a la mano.',
    'Disipador de calor atornillable para TO-220 (varios tamaños, para contrastar contra los 4 escalones de θ modelados) y pasta térmica.',
    'Multímetro en modo CD (voltaje) y modo miliamperímetro, más un osciloscopio para observar directamente el rizo antes y después del regulador — ver la práctica del multímetro y la de rectificación de este banco.',
    'Carga electrónica o resistores de potencia variables, para reproducir el barrido de Iout de forma segura y controlada.'
  ],
  s4: {
    intro: 'Simular la fuente lineal es el <b>inicio</b>; construir y medir el circuito físico cierra el aprendizaje. Un procedimiento real añade:',
    items: [
      'Verificar la polaridad del capacitor electrolítico de filtro antes de energizar — invertirla en un capacitor con polaridad puede provocar su falla violenta.',
      'Medir el voltaje del secundario del transformador en vacío antes de conectar el puente, para confirmar que corresponde al valor nominal esperado antes de continuar el montaje.',
      'Atornillar el regulador a su disipador con pasta térmica ANTES de energizar cualquier corriente significativa — operar un 7805 sin disipador a corrientes cercanas a 1 A puede activar su apagado térmico en segundos.',
      'Medir Vfiltro con osciloscopio (acoplamiento CD) para observar el rizo real antes del regulador, y Vout con acoplamiento CA para medir el rizo residual a la salida — confirmar que crece cuando el margen de regulación se agota, tal como predice este modelo.',
      'Verificar experimentalmente el efecto de bajar Vlínea (con un variac, si se dispone) o de subir Iout: ambos reducen el margen de regulación disponible — el mismo peor caso que el modo Reto de diseño exige anticipar por cálculo.',
      'Nunca exceder el Iout máximo del regulador (1.0 A típico en el 7805) sin verificar antes su hoja de datos y su curva de derrateo térmico con el disipador realmente disponible.'
    ]
  },
  s5: {
    modela: 'la cadena completa Vlínea → transformador ideal → puente rectificador (modelo de Shockley de dos uniones, reutilizando los parámetros del banco de rectificación) → capacitor de filtro (integración RK4 exacta) → regulador lineal (dropout dependiente de corriente, condición real de pérdida de regulación, limitación de corriente ilustrativa); la disipación de potencia exacta y por fórmula de libro de texto; y la temperatura de unión en estado estable contra Tj,max, con selector de disipador y de temperatura ambiente.',
    noModela: 'el tiempo de recuperación inversa (trr) de los diodos (cifra no confiable en las hojas de datos consultadas), la saturación de núcleo y los armónicos del transformador, la dinámica térmica transitoria (solo estado estable), las tolerancias de componentes, el apagado térmico exacto y otros modos de falla no ideales, el ruido/EMI de conmutación, ni el valor numérico preciso de la corriente pico de recarga de los diodos (solo su tendencia cualitativa).'
  },
  s6: [
    '<b>Texas Instruments</b>, hoja de datos <i>LM78XX Series Voltage Regulators</i> (lit. SNOSBR7): Vout, dropout, Iq, θJC, θJA, Tj,max y apagado térmico del regulador LM7805 modelado aquí.',
    '<b>ON Semiconductor</b>, hoja de datos <i>1N4001–1N4007</i> (Rev. 13): VRRM, IF(AV), VF e IFSM de la familia de diodos de referencia.',
    '<b>Diodes Incorporated</b>, hoja de datos <i>1N4001–1N4007</i> (DS28002): valores de contraste para los mismos parámetros de la familia de diodos.',
    '<b>Diodes Incorporated</b>, hoja de datos <i>DB101–DB107</i> (DS21211): VRRM, IF(AV), VF e IFSM del puente rectificador integrado modelado aquí.',
    '<b>Boylestad y Nashelsky</b>, <i>Electronic Devices and Circuit Theory</i> (Pearson): análisis de la fuente lineal completa — rectificación, filtro y regulación.',
    '<b>Sedra y Smith</b>, <i>Microelectronic Circuits</i> (Oxford): modelo de diodo y análisis de rizo del capacitor de filtro.',
    '<b>Nota sobre trr</b> ⚑: la familia 1N400x y los puentes DB10x no reportan un tiempo de recuperación inversa consistente y confiable entre fabricantes para esta cifra; por eso este lab lo omite por completo del motor de cálculo en vez de mostrar un número no verificado.',
    '<b>Nota sobre θJA e IFSM del puente</b> ⚑: el θJA del regulador con disipador se modela como rango representativo por categoría (no de una pieza o layout específicos), y el IFSM de los puentes tipo DB107 se reporta en la hoja de datos como aproximado (30–50 A pico) sin una cifra única y precisa — ambas cifras se presentan aquí con esa honestidad explícita.'
  ]
});
