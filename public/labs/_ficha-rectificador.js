/* Ficha técnica · Rectificadores: media onda, center-tap y puente — contenido específico del lab */
fichaTecnica({
  title: 'Rectificadores: media onda, center-tap y puente — de CA a CD',
  intro: 'Este laboratorio compara las <b>tres topologías clásicas de rectificación</b> a partir del mismo modelo de diodo de Shockley usado en la práctica de la curva I–V, ahora a escala de corriente de rectificador (cientos de mA a ~1 A). El voltaje de salida con filtro capacitivo se resuelve integrando la <b>ecuación diferencial exacta</b> del capacitor (C·dVc/dt = I_diodo(t) − Vc/R_L) por <b>Runge-Kutta 4</b> — no con la fórmula lineal aproximada de rizo, que aquí solo se muestra como referencia de diseño rápido. El esquema usa símbolos <b>IEC 60617</b>. El montaje 3D es <b>procedural y didáctico</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> ecuación de Shockley por unión (parámetros tipo SPICE anclados al Vf de hoja de datos a la corriente nominal); transitorio <b>exacto</b> del capacitor de filtro por integración numérica (Runge-Kutta 4), con arranque cercano al régimen permanente y criterio de convergencia entre periodos sucesivos; PIV calculado por la fórmula específica de cada topología (2Vm − Vf con filtro en media onda y center-tap; Vm − Vf en puente) y, cuando el modelo agrupado lo permite observar por unión (media onda y center-tap), <b>medido directamente</b> de la forma de onda simulada; duplicación real de la frecuencia de rizo en center-tap y puente, emergente de la física y no forzada por código; verificación de margen de seguridad (PIV con 1.4× de margen sobre VRRM, corriente promedio y de pico por diodo contra IF(AV)/IFSM del dispositivo).',
    omitidos: [
      '<b>Recuperación inversa (t_rr)</b>: el diodo del modelo conmuta instantáneamente entre conducción y bloqueo; un diodo real tarda nanosegundos a microsegundos en dejar de conducir tras invertir la polaridad, lo que genera pérdidas y picos de conmutación no representados aquí.',
      '<b>Transformador ideal</b>: la fuente de CA se trata como fuente de voltaje ideal, sin resistencia ni inductancia de fugas del devanado, sin saturación de núcleo y sin caída de voltaje bajo carga — un transformador real reduce su Vrms de salida al aumentar la corriente.',
      '<b>Derrateo térmico</b>: IF(AV) e IFSM se comparan contra los valores de hoja de datos a la temperatura de referencia del fabricante; un rectificador real pierde capacidad de corriente al subir la temperatura ambiente o de la unión.',
      '<b>ESR y envejecimiento del capacitor</b>: el capacitor del modelo es ideal (sin resistencia serie equivalente ni pérdida de capacitancia con el tiempo/temperatura), que en la práctica real limita la corriente de pico de carga y genera calentamiento propio.',
      '<b>Ruptura por avalancha inversa</b>: si el voltaje inverso supera el VRRM del dispositivo, el modelo solo lo señala como alerta de diseño — no simula la física de la ruptura ni el posible daño del diodo.',
      '<b>Distorsión de línea real y EMI</b>: la fuente de CA es una senoidal pura; una línea real tiene armónicos, y la conmutación abrupta de los diodos en el pico de carga genera interferencia electromagnética no modelada aquí.',
      '<b>Corriente de pico de carga por fórmula cerrada</b>: existen varias fórmulas aproximadas publicadas para estimar el pico de corriente de carga del capacitor, con resultados que no siempre coinciden entre sí; se omiten deliberadamente y en su lugar el pico se obtiene directamente de la integración numérica de la EDO.',
      '<b>Variación de Vf con la temperatura</b>: T se fija en 300.15 K (27 °C) — la dependencia térmica de la curva del diodo ya se cubre a fondo en la práctica de la curva I–V; aquí el foco pedagógico es la topología de rectificación, no la física térmica de la unión.'
    ]
  },
  s2: {
    title: 'Dispositivos, topologías y parámetros del modelo',
    warn: 'Los parámetros de diodo son <b>valores tipo, anclados al Vf publicado a la corriente nominal</b> ⚑ — contrastar con la hoja de datos de la pieza física real antes de usar en diseño. Los valores de PIV/Vdc/rizo mostrados son la <b>solución exacta del modelo</b> (integración numérica), no lecturas de instrumento.',
    rows: [
      ['Elemento', 'Parámetros / rating (modelo)', 'Comportamiento típico'],
      ['Si (tipo 1N4007)', 'Is ≈ 0.84 nA · n ≈ 1.85 · VRRM = 1000 V · IF(AV) = 1.0 A @ 75 °C', 'Vf ≈ 1.0 V @ 1 A · IFSM = 30 A (8.3 ms)'],
      ['Schottky (tipo 1N5819)', 'Is ≈ 1.0 nA · n ≈ 1.05 · VRRM = 40 V · IF(AV) = 1.0 A', 'Vf ≈ 0.56 V @ 1 A (banda de hoja de datos 0.45–0.60 V ⚑)'],
      ['Puente DB107 (rating de paquete)', '4 uniones de Si integradas · VRRM = 1000 V · IF(AV) = 1.0 A @ 40 °C ⚑ · IFSM = 50 A', 'Física interna modelada con el diodo de Si; el rating de seguridad mostrado es el del paquete'],
      ['Media onda', '1 diodo · PIV ≈ 2Vm − Vf (con filtro) · frecuencia de rizo = 1× línea', 'Menor costo, mayor rizo y mayor PIV requerido'],
      ['Center-tap', '2 diodos · PIV ≈ 2Vm − Vf · frecuencia de rizo = 2× línea', 'Requiere transformador con derivación central'],
      ['Puente', '4 diodos · PIV ≈ Vm − Vf · frecuencia de rizo = 2× línea', 'PIV requerido la mitad que center-tap; transformador de un solo devanado']
    ]
  },
  s3: [
    'Diodos rectificadores físicos <b>1N4007</b> (Si, uso general), <b>1N5819</b> (Schottky) y un puente rectificador integrado <b>DB107</b>, con sus hojas de datos para contrastar VRRM, IF(AV) e IFSM.',
    'Transformador reductor con devanado secundario simple y, para la topología center-tap, un secundario con derivación central.',
    'Capacitores electrolíticos de filtro (10 µF – 2200 µF) y resistores de carga (47 Ω – 2.2 kΩ) para reproducir el circuito RC de salida.',
    'Osciloscopio (medir Vin y Vout, frecuencia de rizo y Vr(pp) directamente en pantalla) y multímetro en modo CD (medir Vdc) — ver la práctica del multímetro.'
  ],
  s4: {
    intro: 'Simular la topología es el <b>inicio</b>; construir y medir el rectificador físico cierra el aprendizaje. Un procedimiento real añade:',
    items: [
      'Armar el circuito con el transformador ya desenergizado, verificar la polaridad de los diodos con el modo diodo del multímetro antes de energizar.',
      'Medir Vrms del secundario en vacío y bajo carga — un transformador real cae de voltaje al aumentar la corriente (regulación de carga), algo que este modelo no representa.',
      'Medir Vr(pp) y la frecuencia de rizo directamente en el osciloscopio, y compararlas contra el valor calculado por el modelo y por la fórmula aproximada de rizo.',
      'Respetar el IFSM del diodo al energizar: la corriente de pico de carga inicial del capacitor descargado puede superar varias veces la corriente promedio — por eso muchas fuentes reales incluyen un limitador de corriente de arranque (inrush), no modelado aquí.',
      'Dejar margen entre el PIV calculado y el VRRM del diodo (regla práctica: al menos 1.4×) para absorber transitorios de línea no representados en este modelo.'
    ]
  },
  s5: {
    modela: 'la ecuación de Shockley por unión con parámetros tipo anclados al Vf de hoja de datos a la corriente nominal; las tres topologías de rectificación (media onda, center-tap, puente) con su geometría de conducción correcta; el transitorio exacto del capacitor de filtro por integración numérica (Runge-Kutta 4) con criterio de convergencia; el PIV específico de cada topología, calculado por fórmula y, donde el modelo lo permite, medido directamente de la forma de onda; la duplicación real de la frecuencia de rizo en las topologías de onda completa; y la verificación de márgenes de seguridad de corriente y voltaje contra los ratings del dispositivo.',
    noModela: 'la recuperación inversa del diodo (t_rr), el transformador real (fugas, saturación de núcleo, regulación de carga), el derrateo térmico de los ratings, la resistencia serie equivalente y el envejecimiento del capacitor, la ruptura por avalancha inversa, la distorsión de línea real y la EMI, ni la corriente de pico de carga por fórmula cerrada (se usa la integración numérica en su lugar) — la variación de Vf con la temperatura tampoco se modela aquí porque ya se cubre a fondo en la práctica de la curva I–V del diodo.'
  },
  s6: [
    '<b>W. Shockley (1949)</b>, «The Theory of p-n Junctions in Semiconductors and p-n Junction Transistors», Bell System Technical Journal: la ecuación del diodo usada por cada unión de este lab.',
    '<b>L. Nagel (1975)</b>, «SPICE2: A Computer Program to Simulate Semiconductor Circuits», UC Berkeley ERL-M520: convención de parámetros tipo SPICE (Is, n) de la que parte el modelo de diodo.',
    '<b>Boylestad y Nashelsky</b>, <i>Electronic Devices and Circuit Theory</i> (Pearson): fórmulas de PIV, Vdc y rizo por topología de rectificación.',
    '<b>Sedra y Smith</b>, <i>Microelectronic Circuits</i> (Oxford): análisis del rectificador con filtro capacitivo y la aproximación lineal de rizo usada aquí solo como referencia de diseño.',
    '<b>IEC 60617</b>: símbolos gráficos para esquemas eléctricos (diodo, fuente CA, capacitor, resistor) — el estándar de representación de este lab.',
    '<b>Hoja de datos Vishay 1N4001–1N4007</b>: VRRM, IF(AV) e IFSM del diodo de silicio de uso general modelado aquí.',
    '<b>Hoja de datos STMicroelectronics 1N5817–1N5819</b>: familia Schottky — el Vf usado (≈0.56 V @ 1 A) se ancla a la banda superior del rango publicado (0.45–0.60 V), evitando confundirlo con el valor típico del 1N5817 de menor corriente nominal.',
    '<b>Hoja de datos Diodes Inc. DB101–DB107</b> ⚑: rating de IF(AV) del puente integrado — se señala que otros fabricantes listan hasta 1.5 A bajo el mismo número de parte DB107; contrastar siempre con la hoja de datos de la pieza física antes de usar en diseño.'
  ]
});
