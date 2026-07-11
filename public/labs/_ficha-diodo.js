/* Ficha técnica · Curva I–V del diodo — contenido específico del lab */
fichaTecnica({
  title: 'Curva I–V del diodo — trazador y ajuste exponencial',
  intro: 'Este laboratorio representa una <b>sesión de caracterización de dispositivos</b>: un circuito fuente–resistor–diodo resuelto en vivo con la ecuación de <b>Shockley (1949)</b> y la <b>ley de temperatura de SPICE</b> para Is(T), con el punto de operación Q calculado <b>exactamente por bisección</b> sobre la recta de carga. El esquema usa símbolos <b>IEC 60617</b>. El trazador impone corrientes fijas y mide Vd — como un analizador de parámetros real — y el modo Ajuste extrae n e Is de dos mediciones, que es como se caracteriza un diodo de verdad. El montaje 3D es <b>procedural y didáctico</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> ecuación de Shockley I = Is·(e^(V/(n·VT)) − 1) con parámetros tipo SPICE (Is, n, Eg, XTI) de tres dispositivos; ley de temperatura de SPICE2 para Is(T) — el coeficiente térmico ≈ −2 mV/K del silicio <b>emerge</b> de la física, no está programado; punto Q exacto (bisección sobre Id = (Vs − Vd)/R); vista semilog donde la exponencial se vuelve recta de pendiente n·VT·ln 10; extracción de n e Is por el método de 2 puntos con la regla I ≥ 30·Is.',
    omitidos: [
      '<b>Resistencia serie Rs</b>: a corrientes altas la Vf real es mayor que la del modelo puro (en un 1N4148 real, decenas de mV extra a 100 mA). Los modelos SPICE completos la incluyen; aquí se omite para que la exponencial se vea limpia.',
      '<b>Alta inyección</b>: por encima de cierta corriente la pendiente semilog se dobla hacia n ≈ 2; el modelo mantiene un solo n en todo el rango.',
      '<b>Ruptura inversa y fuga real</b>: no hay región Zener/avalancha ni la corriente inversa real (que es mayor que Is y depende de T); la zona V < 0 no es objeto de esta práctica.',
      '<b>Capacidades y conmutación</b>: sin capacidad de juntura ni tiempo de recuperación inversa (t_rr) — eso es materia de la práctica de rectificación y conmutación.',
      '<b>Autocalentamiento</b>: T es un parámetro que fija el usuario; en un diodo real P = Vd·Id sube la temperatura de la juntura y desplaza la curva mientras mides.',
      '<b>Dispersión entre unidades</b>: Is puede variar órdenes de magnitud entre diodos del mismo lote; los parámetros usados son valores "tipo" de modelos publicados, no los de una pieza medida.'
    ]
  },
  s2: {
    title: 'Dispositivos y parámetros del modelo',
    warn: 'Los parámetros son <b>valores tipo de modelos SPICE publicados</b> ⚑ — contrastar con la hoja de datos de la pieza física real antes de usar en diseño. Los valores mostrados son la <b>solución exacta del modelo</b>, no lecturas de instrumento.',
    rows: [
      ['Dispositivo', 'Parámetros (modelo)', 'Comportamiento típico'],
      ['Si (tipo 1N4148)', 'Is = 2.52 nA · n = 1.752 · Eg = 1.11 eV', 'Vf ≈ 0.69 V @ 10 mA · If máx 200 mA'],
      ['Schottky (tipo 1N5819)', 'Is = 31.7 µA · n = 1.373 · Eg = 0.69 eV', 'Vf ≈ 0.20 V @ 10 mA · If máx 1 A'],
      ['LED rojo (didáctico)', 'Is = 10 fA · n = 2.6 · Eg = 1.9 eV', 'Vf ≈ 1.86 V @ 10 mA · If máx 20 mA'],
      ['Voltaje térmico', 'VT = kT/q ≈ 25.87 mV @ 27 °C', 'Escala de la exponencial; sube con T'],
      ['Motor', 'Shockley + Is(T) de SPICE2 · bisección (80 iter.)', 'Nagel (1975); Q exacto en la recta de carga']
    ]
  },
  s3: [
    'Diodos físicos <b>1N4148</b> (Si), <b>1N5819</b> (Schottky) y un LED rojo, con sus hojas de datos para contrastar Vf e If máx.',
    'Fuente de CD variable y resistores limitadores (100 Ω – 4.7 kΩ) para reproducir la recta de carga punto por punto.',
    'Multímetro digital (medir Vd) y miliamperímetro o método indirecto ΔV/R (medir Id) — ver la práctica del multímetro.',
    'Trazador de curvas u osciloscopio en modo X–Y con generador, o un simulador SPICE (LTspice, ngspice) que usa <b>exactamente esta ecuación</b> con los parámetros del .model.'
  ],
  s4: {
    intro: 'Trazar la curva en el simulador es el <b>inicio</b>; la caracterización de verdad se cierra con la pieza física. Un procedimiento real añade:',
    items: [
      'Levantar la curva punto por punto con fuente y resistor: fijar varias Id (décadas: 10 µA, 100 µA, 1 mA, 10 mA), medir Vd en cada una y graficar en semilog.',
      'Extraer n e Is de dos puntos de la medición (misma fórmula del modo Ajuste) y comparar contra el .model de SPICE y la hoja de datos.',
      'Medir rápido a corrientes altas o con disipador: el autocalentamiento desplaza Vf mientras se mide (el coeficiente ≈ −2 mV/K juega en contra).',
      'Respetar If máx de la hoja de datos y dimensionar R = (Vs − Vf)/If antes de conectar — especialmente con LEDs (20 mA típicos).'
    ]
  },
  s5: {
    modela: 'la ecuación de Shockley con parámetros tipo SPICE de tres dispositivos (Si, Schottky, LED); la dependencia en temperatura de Is según la ley de SPICE2, de la que emerge el coeficiente térmico del silicio; el punto de operación exacto contra la recta de carga (bisección); el trazado por corriente impuesta y la extracción de n e Is por el método de 2 puntos.',
    noModela: 'la resistencia serie Rs ni la alta inyección (a corrientes altas la Vf real es mayor), la ruptura inversa y la fuga real, las capacidades de juntura y la recuperación inversa (materia de la práctica de rectificación), el autocalentamiento ni la dispersión entre unidades — los parámetros son valores tipo, no los de una pieza medida.'
  },
  s6: [
    '<b>W. Shockley (1949)</b>, «The Theory of p-n Junctions in Semiconductors and p-n Junction Transistors», Bell System Technical Journal: la ecuación del diodo de este lab.',
    '<b>L. Nagel (1975)</b>, «SPICE2: A Computer Program to Simulate Semiconductor Circuits», UC Berkeley ERL-M520: el modelo de diodo (Is, n, Eg, XTI y la ley de temperatura) implementado aquí.',
    '<b>Sedra y Smith</b>, <i>Microelectronic Circuits</i> (Oxford): recta de carga, iteración con el modelo de caída constante y método de extracción de parámetros.',
    '<b>IEC 60617</b>: símbolos gráficos para esquemas eléctricos (diodo, LED, fuente, resistor) — el estándar de representación de este lab.',
    '<b>Hojas de datos 1N4148 y 1N5819</b> (Vishay/onsemi): límites reales (If máx, Vf @ If, t_rr) para contrastar los parámetros tipo del modelo ⚑.'
  ]
});
