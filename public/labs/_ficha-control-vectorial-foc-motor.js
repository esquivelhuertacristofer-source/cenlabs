/* Ficha técnica · Control vectorial (FOC) del motor de tracción: de tres corrientes a dos números — contenido específico del lab */
fichaTecnica({
  title: 'Control vectorial (FOC) del motor de tracción: de tres corrientes a dos números',
  intro: 'Este laboratorio muestra, en un <b>esquema didáctico</b>, cómo se controla un motor síncrono de imanes de un coche eléctrico. Las tres corrientes de fase (que giran) se convierten con las <b>transformadas de Clarke y Park</b> en dos números fijos vistos desde el rotor: <b>id</b> (sobre el imán, mueve el campo) e <b>iq</b> (adelantada 90°, da el par). El par es <b>T = 3/2·p·(ψm·iq + (Ld − Lq)·id·iq)</b>. Un <b>regulador PI de corriente</b> por eje, con desacople y con la tensión limitada por el círculo del inversor (Vdc/√3), lleva id e iq a la consigna que elige la estrategia: <b>id = 0</b>, <b>MTPA</b> (mínima corriente por newton metro) o <b>debilitamiento de campo</b> (id más negativa cuando los imanes ya gastan la tensión). Todo lo que se mueve o se enciende sale del modelo; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> las transformadas de Clarke y Park de amplitud invariante (y sus inversas) con la invarianza de la potencia (3/2); el motor en ejes dq con R, Ld, Lq y el flujo de los imanes (ecuaciones de tensión completas, con los términos de rotación ωe·Lq·iq y ωe·(Ld·id + ψm)); el par por coenergía, con su parte de imanes y su parte de reluctancia; el PI de corriente discreto a 10 kHz (kp = α·L y ki = α·R·zr) con un periodo de retardo de cómputo, desacople opcional y anti-windup por integración condicionada; el círculo de tensión del inversor (Vdc/√3); las tres estrategias de consigna (id = 0, MTPA por fórmula cerrada y debilitamiento de campo sobre la curva de par constante con una reserva de tensión elegida) y el límite de corriente (se recorta iq y se conserva id); el escalón de par a los 2 ms y sus métricas (error de par, sobreimpulso, asentamiento, tiempo con la tensión al tope y calor en el cobre). En el 3D: el rotor gira a n/60 vueltas por segundo, los 48 conductores del estator se encienden con la corriente real de su fase (con su signo) y el visor eléctrico dibuja la flecha de la corriente, sus tres sombras sobre los ejes de fase y sus componentes id e iq.',
    omitidos: [
      '<b>La saturación magnética y el acople cruzado de las inductancias</b>: Ld y Lq son constantes. En un motor de tracción real varían mucho con la corriente, y por eso el MTPA real se mide en banco o se tabula.',
      '<b>Los armónicos</b>: las ranuras, los imanes y la modulación del inversor (PWM) producen rizado de par y de corriente que aquí no existe. El inversor es un círculo de tensión ideal, sin tiempos muertos ni caídas en los transistores.',
      '<b>Las pérdidas en el hierro y las mecánicas, la temperatura y la desmagnetización</b>: el flujo de los imanes es constante, no baja con el calor ni con una id muy negativa.',
      '<b>La dinámica mecánica</b>: la velocidad se mantiene fija durante los 24 ms del escalón (en un coche, la inercia es mucho mayor que lo que ocurre en un lazo de corriente).',
      '<b>El ruido del sensor de corriente, la estimación de la posición del rotor y el desfase del ángulo durante el periodo de muestreo</b>: se supone una medida exacta y un ángulo conocido.',
      '<b>Estrategias reales de debilitamiento</b> (por tabla, por realimentación de la tensión, con anticipación): aquí se calcula la id factible de menor magnitud sobre la curva de par constante.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Los parámetros son de <b>orden de magnitud</b> de un motor de tracción de unos 80–100 kW y <b>no son los de un fabricante</b>. Un control mal ajustado puede parecer sano en una gráfica y estar saturado: mira siempre la tensión usada. Este laboratorio es didáctico: no sustituye ni valida un controlador real.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Motor', 'pares de polos · resistencia de fase · flujo de imanes', 'p = 4 · R = 12 mΩ · ψm = 0,085 Wb (pico por fase)'],
      ['Inductancias', 'eje d · eje q (rotor con imanes interiores en V)', 'Ld = 0,20 mH · Lq = 0,55 mH (Lq &gt; Ld: hay par de reluctancia)'],
      ['Inversor y límites', 'bus de continua · círculo de tensión · corriente máxima de pico', 'Vdc = 350 V · Vmax = Vdc/√3 = 202,1 V · Imax = 350 A (corriente característica ψm/Ld = 425 A)'],
      ['Lazo de corriente', 'periodo · retardo · escalón', '10 kHz · 1 periodo · de 25 % al 100 % del par pedido a los 2 ms (ventana de 24 ms)'],
      ['Mandos del alumno', 'ancho de banda · parte integral · estrategia · reserva de tensión · desacople', '30 a 1 500 Hz · ×¼ a ×8 · id = 0, MTPA o debilitar campo · 60 a 100 % · con o sin'],
      ['Situaciones del reto', 'velocidad · par pedido', 'Cuesta en la ciudad: 2 600 rpm y 190 N·m · Adelantar en carretera: 4 000 rpm y 150 N·m · Autopista a tope: 4 400 rpm y 110 N·m'],
      ['El reto', 'cinco condiciones a la vez', 'error de par ≤ 3 % · sobreimpulso ≤ 8 % · asentamiento ≤ 4,5 ms (±5 %) · tensión al tope ≤ 0,8 ms · cobre ≤ 1,2× el mínimo factible']
    ]
  },
  s3: [
    'Un banco de pruebas con freno dinamométrico para medir el par y el flujo (mapas de Ld(id, iq), Lq(id, iq) y ψ(id, iq)) y calibrar el MTPA real.',
    'Un inversor con su tarjeta de control, sensores de corriente de efecto Hall y un resolver o encóder para el ángulo del rotor.',
    'Un osciloscopio con registro de id, iq, vd, vq y la tensión de bus, para ver el escalón de par y el momento en que el inversor se satura.',
    'Herramientas de ajuste automático del PI (identificación de R y L en reposo) y de sintonía del debilitamiento de campo.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. La puesta a punto real de un control vectorial añade:',
    items: [
      'Medir R, Ld y Lq en reposo (inyección de señal) y el flujo de los imanes con el motor arrastrado, antes de fijar ganancias.',
      'Calibrar el desfase del encóder o del resolver (el ángulo de Park exacto): un error de ángulo mezcla id con iq y baja el par.',
      'Levantar los mapas de par frente a (id, iq) a varias velocidades y temperaturas y construir las tablas de MTPA y de debilitamiento.',
      'Comprobar el comportamiento en el límite de tensión (anti-windup, transición MTPA ↔ debilitamiento) y con el bus de continua bajo, que es cuando antes se acaba la tensión.',
      'Validar la protección: desmagnetización por id excesiva, sobrecorriente y sobretemperatura de los imanes.'
    ]
  },
  s5: {
    modela: 'el motor síncrono de imanes interiores en <b>ejes dq</b> con tensiones completas, el par T = 3/2·p·(ψm·iq + (Ld − Lq)·id·iq), el <b>PI discreto</b> a 10 kHz con desacople y un periodo de retardo, el círculo de tensión con anti-windup, el <b>MTPA por fórmula cerrada</b> (id = ψm/(4(Lq − Ld)) − √(ψm²/(16(Lq − Ld)²) + Is²/2)) y el debilitamiento de campo como la id de menor magnitud que cabe en la reserva de tensión sobre la curva de par constante. Se comprueba que las transformadas de Clarke y Park son de amplitud invariante, ida y vuelta exactas y con la potencia conservada con el factor 3/2; que el par por coenergía coincide con la fórmula; que el MTPA coincide con un barrido fino de ángulo; que el balance de energía (entrada = cobre + variación de energía magnética + trabajo mecánico) cierra; que la elipse de tensión y la velocidad base cumplen |v| = Vmax; que el lazo de un eje sin acople reproduce la recursión discreta exacta; y que la tensión nunca pasa del círculo. El reto exige cinco condiciones a la vez y sólo las cumple el 20,5 % (ciudad), el 2,4 % (carretera) y el 1,7 % (autopista) de las combinaciones de la rejilla de 41 × 6 × 10; «sólo iq» no lo cumple nunca, y en carretera y autopista tampoco la mínima corriente: sólo debilitar el campo, con una ventana interior (en carretera, con la reserva al 90 % y la parte integral en ×1, de unos 100 a 168 Hz; con la rapidez en 130 Hz, una reserva de 85 a 96 %). Se verifica con 312 comprobaciones.',
    noModela: 'la saturación magnética y el acople cruzado de las inductancias, los armónicos y el PWM, las pérdidas en el hierro, la temperatura y la desmagnetización, la dinámica mecánica, el ruido de los sensores y el error de ángulo, y las estrategias reales de debilitamiento por tablas o por realimentación de la tensión. Los parámetros son <b>didácticos</b>, no de un fabricante. El <b>visor</b> es el dibujo eléctrico equivalente de un solo par de polos: una vuelta suya son 90° del rotor real, que tiene cuatro pares. Las ranuras, el entrehierro y la carcasa no están a escala. La cámara lenta (×1/300) es de presentación: el tiempo físico del lazo es de 24 ms. No es un controlador de producción ni una homologación.'
  },
  s6: [
    'Park, R. H., «Two-Reaction Theory of Synchronous Machines», <i>AIEE Transactions</i>, 1929 (transformación a ejes dq; a verificar la referencia exacta).',
    'Krause, P., Wasynczuk, O., Sudhoff, S. y Pekarek, S., <i>Analysis of Electric Machinery and Drive Systems</i>, Wiley-IEEE Press (transformadas y modelo dq; a verificar la edición).',
    'Morimoto, S. et al., trabajos sobre el control de motores síncronos de imanes interiores con debilitamiento de campo y MTPA, <i>IEEE Transactions on Industry Applications</i> (a verificar los títulos y años).',
    'Texas Instruments, notas de aplicación sobre FOC de motores síncronos de imanes permanentes (a verificar el número).'
  ]
});
