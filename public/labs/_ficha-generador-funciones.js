/* Ficha técnica · Generador de funciones (carga, forma de onda, barrido/Bode, offset de CD) — contenido específico del lab */
fichaTecnica({
  title: 'Generador de funciones — carga, forma de onda, barrido en frecuencia y offset de CD',
  intro: 'La práctica anterior presentaba al osciloscopio como protagonista, recibiendo una señal ya dada. Aquí el protagonista es la <b>fuente</b>: el generador de funciones. Este laboratorio recorre <b>cuatro casos</b>: el error de amplitud que aparece cuando el ajuste de carga del generador (50 Ω / Hi-Z) no coincide con la impedancia realmente conectada; el contenido espectral distinto de una onda senoidal pura frente a una onda cuadrada; el barrido en frecuencia de un filtro RC de un polo para ubicar su punto de −3 dB; y el recorte (clipping) que ocurre cuando un offset de CD se suma a la amplitud AC y excede el rango disponible del circuito.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el mismo osciloscopio digital de las prácticas anteriores de este dominio (aquí en un rol secundario, de solo lectura, un canal), un generador de funciones con perillas de amplitud/frecuencia/offset, botones retroiluminados para elegir forma de onda senoidal o cuadrada, un selector deslizante de carga (Load: 50 Ω / Hi-Z), salida BNC, un terminador de 50 Ω opcional para la entrada del osciloscopio, un módulo accesorio de filtro RC de un polo (paso bajo) con indicador luminoso, y el cableado que conecta generador, filtro y osciloscopio.',
    omitidos: [
      '<b>Topología interna real del generador</b> (síntesis digital directa/DDS, DAC, etapa de amplificación de salida): el modelo trata al generador como una fuente de voltaje ideal con una impedancia de salida fija, no como un circuito a nivel de transistor.',
      '<b>Distorsión armónica propia del generador (THD)</b>: la senoidal de este modelo es matemáticamente pura — un generador real siempre agrega una distorsión armónica residual, especificada en su hoja de datos.',
      '<b>Tiempo de subida/bajada de la onda cuadrada</b>: el modelo dibuja flancos instantáneos; un generador real tiene un tiempo de flanco finito (rango de nanosegundos) que se vuelve relevante a frecuencias altas.',
      '<b>Planitud de amplitud contra frecuencia (flatness)</b>: este modelo asume que la fuente entrega la misma amplitud programada a cualquier frecuencia — solo la carga (Caso 1) y el filtro RC externo (Caso 3) modifican la señal. Un generador real tiene su propia curva de planitud, con caída hacia el extremo superior de su ancho de banda.',
      'Ruido de fase y jitter del reloj interno del generador.',
      '<b>Tolerancia real de los componentes del filtro RC</b>: resistencias y capacitores comerciales tienen tolerancia (±5 %, ±10 %, etc.) que desplaza la f<sub>c</sub> real respecto del valor nominal calculado — aquí f<sub>c</sub> se calcula exacta a partir de R y C ideales.'
    ]
  },
  s2: {
    title: 'Parámetros usados por el modelo',
    warn: 'Valores <b>representativos e ilustrativos</b>, elegidos para que cada caso sea claro — no son la especificación de un generador comercial concreto. El factor ×2 del Caso 1 sí es un dato real de hoja de fabricante (p. ej. Keysight 33500B/33600A: "1 mVpp a 10 Vpp en 50 Ω / 2 mVpp a 20 Vpp en circuito abierto"). Para trabajo real, usa la hoja de datos de <b>tu</b> generador y de tu instrumento.',
    rows: [
      ['Parámetro', 'Valor usado en el lab', 'Nota'],
      ['Caso 1 · Carga', '2.0 V<sub>pp</sub> programados @ 1 kHz', 'factor ×2 si Load=50 Ω del generador y la carga real es Hi-Z (circuito abierto)'],
      ['Caso 2 · Forma de onda', 'senoidal o cuadrada, 100 Hz', 'F<sub>s</sub> = 2000 Hz · N = 200 muestras · Δf = 10 Hz · Nyquist = 1000 Hz'],
      ['Caso 3 · Barrido/Bode', 'filtro RC: R = 1.6 kΩ, C = 100 nF', 'f<sub>c</sub> = 1/(2πRC) ≈ 995 Hz · barrido en 100/400/1000/2500/6000 Hz'],
      ['Caso 4 · Offset de CD', 'amplitud AC fija 1.0 V pico @ 1 kHz', 'rango del circuito (rail): ±2.5 V · offsets de prueba: 0 / +1.0 / +1.8 / +2.2 V']
    ]
  },
  s3: [
    'Generador de funciones con impedancia de salida conocida (normalmente 50 Ω nominal) y ajuste de carga (Load) configurable.',
    'Terminador BNC de 50 Ω, para igualar la carga cuando el instrumento receptor tiene entrada de alta impedancia.',
    'Cable BNC-BNC de bajo ruido, de la longitud mínima necesaria — un cable largo sin terminar puede introducir reflexiones a alta frecuencia.',
    'Osciloscopio con entrada calibrada, para verificar la amplitud realmente entregada antes de confiar en la lectura del panel del generador.',
    'Manual del fabricante del generador: impedancia de salida, exactitud de amplitud, exactitud de frecuencia y planitud (flatness) contra frecuencia.'
  ],
  s4: {
    intro: 'Confiar en la señal de un generador exige verificar, en orden, la carga, la forma de onda, la respuesta del circuito bajo prueba, y el rango disponible antes de sumar cualquier offset.',
    items: [
      'Verificar que el ajuste de carga (Load) del generador coincide con la impedancia realmente conectada ANTES de confiar en la amplitud mostrada en su panel — un generador calibrado para 50 Ω que alimenta una entrada de alta impedancia entrega el doble de la tensión programada.',
      'Reconocer que toda forma de onda periódica no senoidal (cuadrada, triangular, diente de sierra) contiene armónicos además de la fundamental — al analizarla con una FFT, esos armónicos solo son visibles si la frecuencia de muestreo es suficiente; de lo contrario se pierden o generan aliasing.',
      'Al caracterizar un filtro o circuito con un barrido en frecuencia, tomar V<sub>in</sub> de una fuente confiable (idealmente medida en el punto de entrada real, no solo leída del panel del generador) y registrar V<sub>out</sub> en cada paso, en vez de asumir que la ganancia es uniforme en todo el rango.',
      'Calcular el pico máximo esperado (V<sub>offset</sub> + V<sub>amplitud</sub>) ANTES de programar un offset de CD, y compararlo contra el rango disponible del circuito o instrumento — programar a ciegas puede producir un recorte (clipping) que se ve en pantalla pero se interpreta erróneamente como una falla del circuito bajo prueba.',
      'Registrar el ajuste de carga, la forma de onda, la frecuencia y el offset usados junto con cualquier lectura — el número solo, sin ese contexto, no es reproducible.'
    ]
  },
  s5: {
    modela: 'la impedancia de salida nominal de 50 Ω de un generador de funciones y el error de amplitud (factor ×2, dato de hoja de fabricante) cuando el ajuste de carga del generador no coincide con la impedancia realmente conectada; el contenido espectral genuino — mediante una DFT calculada en vivo, no un resultado guionado — de una onda cuadrada (fundamental + armónicos impares) frente a una onda senoidal pura (un solo tono); el barrido en frecuencia de un filtro RC pasabajas de un polo con cálculo real de ganancia (V<sub>out</sub>/V<sub>in</sub>) y de ganancia en decibeles, y la ubicación del punto de −3 dB (≈70.7 %) a partir de f<sub>c</sub> = 1/(2πRC); el apilamiento de un offset de CD sobre una señal alterna, con recorte (clipping) real cuando la suma V<sub>offset</sub> + V<sub>amplitud</sub> excede el rango disponible del circuito.',
    noModela: 'modelos comerciales específicos de generador de funciones ni todas sus formas de onda disponibles (triangular, rampa, pulso, arbitraria); ruido de fase, jitter o distorsión armónica propia (THD) del generador; la planitud de amplitud contra frecuencia de la fuente (se asume ideal; solo la carga y el filtro externo modifican la señal); la respuesta transitoria del filtro RC — solo su respuesta en régimen permanente (barrido en frecuencia); tolerancias reales de componentes (R, C) que desplazarían la f<sub>c</sub> calculada; protecciones de sobrevoltaje o límites de corriente de salida reales del instrumento.'
  },
  s6: [
    '<b>IEC 61010-1</b>: requisitos generales de seguridad para equipo eléctrico de medición, control y laboratorio — norma ancla de esta práctica (ya presente en multímetro, pinza, osciloscopio y sonda de este dominio).',
    'Sin norma particular IEC 61010-2-0XX específica para generadores de funciones/formas de onda — a diferencia de multímetros (IEC 61010-2-033) u osciloscopios, no existe una Parte 2 dedicada; la exactitud de amplitud y de frecuencia queda a criterio de la hoja de datos de cada fabricante.',
    'Hojas de datos de generadores de funciones/formas de onda de gama de entrada e intermedia (Keysight 33500B/33600A, Rigol DG1000Z/DG800) para verificar la impedancia de salida nominal (50 Ω) y el factor exacto entre carga de 50 Ω y circuito abierto.',
    'Criterio de −3 dB (≈70.7 % de la ganancia máxima) como definición convencional del ancho de banda o frecuencia de corte de un filtro — fundamento de teoría de circuitos, no una norma de instrumentación.',
    'Serie de Fourier de una onda cuadrada (armónicos impares, amplitud ∝ 1/n) — fundamento matemático del Caso 2; criterio de muestreo de Nyquist-Shannon ya aplicado en la práctica de FFT de este dominio.'
  ]
});
