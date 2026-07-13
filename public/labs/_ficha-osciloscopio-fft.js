/* Ficha técnica · Sonda de osciloscopio (atenuación, compensación, cursores, FFT) — contenido específico del lab */
fichaTecnica({
  title: 'Sonda de osciloscopio — atenuación, compensación, cursores y FFT',
  intro: 'El osciloscopio de la práctica anterior asumía una conexión directa por BNC. En el banco real, casi siempre hay una <b>sonda</b> de por medio — y la sonda es la parte del sistema de medición donde más errores comete un técnico nuevo. Este laboratorio recorre <b>cuatro casos</b>: el factor de atenuación 1X/10X y qué pasa cuando no coincide con el ajuste del canal, la compensación de una sonda 10X con una onda cuadrada de calibración, la lectura con cursores manuales de voltaje y de tiempo, y una FFT real — calculada en vivo, no guionada — que muestra aliasing genuino cuando la señal supera la frecuencia de Nyquist.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el mismo osciloscopio digital de la práctica de base de tiempo/disparo (aquí con un solo canal activo), una sonda con selector deslizante 1X/10X, caja de compensación con trimmer ajustable, punta de prueba y pinza de tierra, terminal de compensación dedicado en el osciloscopio, botones retroiluminados de Cursores y FFT/Math que se encienden según el caso activo, generador de señales con terminal de salida, y el cableado que conecta la sonda al generador.',
    omitidos: [
      '<b>Ecuación diferencial real del divisor compensado de la sonda</b>: el modelo usa una curva exponencial paramétrica de asentamiento (sub/correcta/sobre-compensada) para ilustrar la forma de la onda, no una simulación del circuito RC real del compensador.',
      '<b>Ancho de banda y tiempo de subida propios de la sonda</b>: el modelo no atenúa la señal en alta frecuencia; una sonda real tiene su propio punto −3 dB, distinto del ancho de banda del osciloscopio.',
      '<b>Ventanas de FFT</b> (Hamming, Hanning, Blackman-Harris): se usa una ventana rectangular implícita — no se muestra el compromiso entre resolución de frecuencia y fuga espectral (spectral leakage) que motiva usar otras ventanas.',
      '<b>Frecuencia de muestreo y profundidad de memoria configurables</b>: F<sub>s</sub> y N quedan fijos por caso; un osciloscopio real permite ajustarlos y eso cambia tanto Δf como el límite de Nyquist.',
      '<b>Ruido de fondo, jitter e inductancia del cable de tierra</b>: la pinza de tierra se modela de forma simplificada, sin el anillo (ringing) de alta frecuencia que introduce un cable de tierra largo en mediciones reales.',
      'Modelos comerciales específicos de sonda ni sus curvas de derateo de voltaje contra frecuencia — cada fabricante publica las suyas.'
    ]
  },
  s2: {
    title: 'Parámetros usados por el modelo',
    warn: 'Valores <b>representativos e ilustrativos</b>, elegidos para que cada caso sea claro — no son la especificación de una sonda o un osciloscopio comercial concreto. Para trabajo real, usa la hoja de datos de <b>tu</b> sonda y de tu instrumento.',
    rows: [
      ['Parámetro', 'Valor usado en el lab', 'Nota'],
      ['Caso 1 · Sonda', '6.0 V reales @ 1 kHz', 'atenuado ÷10 o ÷1 según posición física del selector'],
      ['Caso 2 · Compensación', 'onda cuadrada 1 kHz, 3 V<sub>pp</sub>', 'señal de calibración típica de un osciloscopio real'],
      ['Caso 3 · Cursores', 'senoidal 400 Hz, 4 V<sub>pp</sub>', 'fija, para enfocarse en la técnica de medición'],
      ['Caso 4 · FFT', 'F<sub>s</sub> = 2000 Hz · N = 200 muestras', 'Δf = F<sub>s</sub>/N = 10 Hz · Nyquist = F<sub>s</sub>/2 = 1000 Hz'],
      ['Frecuencias de prueba FFT', '200 Hz · 900 Hz · 1400 Hz', 'la última (1400 Hz) supera Nyquist a propósito, para mostrar aliasing real']
    ]
  },
  s3: [
    'Sonda pasiva 10:1 compensable, con destornillador no metálico (ajuste de trimmer) — usar un destornillador metálico puede dañar el trimmer o falsear el ajuste.',
    'Cable BNC-BNC o BNC-caimán de bajo ruido para señales de referencia o de calibración.',
    'Generador de funciones o fuente de señal patrón de frecuencia conocida, para verificar la lectura antes de confiar en el instrumento.',
    'Manual del fabricante de la sonda: factor de atenuación, ancho de banda, rango de capacitancia de compensación.',
    'Osciloscopio con función de cursores manuales y FFT/Math, si el procedimiento de trabajo la requiere.'
  ],
  s4: {
    intro: 'Confiar en una lectura con sonda exige un orden: verificar atenuación, compensar, y solo entonces medir con cursores o interpretar un espectro.',
    items: [
      'Confirmar que la posición física del selector de la sonda (1X/10X) coincide con el ajuste del canal en el osciloscopio ANTES de tomar cualquier lectura de voltaje — muchos instrumentos no detectan el factor automáticamente.',
      'Compensar la sonda con la señal de calibración (onda cuadrada, típicamente ≈1 kHz) cada vez que se cambia de sonda o de canal: una sonda descompensada distorsiona la FORMA de la onda, no solo su amplitud, y ese error se traslada a cualquier medición de flanco o de tiempo.',
      'Al usar cursores, verificar que ambos midan el mismo tipo de evento — mismo flanco (subida con subida, no subida con bajada), mismo nivel de referencia — porque mezclar tipos produce una lectura sin sentido físico aunque el número en pantalla se vea razonable.',
      'Antes de interpretar una FFT, confirmar que la frecuencia de muestreo es al menos el doble de la frecuencia más alta presente en la señal (criterio de Nyquist-Shannon); de lo contrario, el pico mostrado puede ser aliasing — una frecuencia "fantasma" reflejada, no la señal real.',
      'Registrar la posición de la sonda, el ajuste del canal, y la F<sub>s</sub>/N usados en la FFT junto con cualquier lectura — el número solo, sin ese contexto, no es reproducible.'
    ]
  },
  s5: {
    modela: 'el factor de atenuación 1X/10X de una sonda pasiva y el error de lectura (×10 o ÷10) cuando el ajuste del canal no coincide con la posición física de la sonda; la compensación de una sonda 10X frente a una onda cuadrada de calibración en 3 estados (sub-compensada, correcta, sobre-compensada) mediante un modelo paramétrico ilustrativo de asentamiento exponencial; cursores manuales de voltaje y de tiempo con cálculo de ΔV/Δt, incluyendo el error común de mezclar cruces por cero de distinto tipo; una FFT real — DFT calculada en vivo sobre la señal capturada, no un resultado guionado — que exhibe resolución espectral (Δf = F<sub>s</sub>/N) y aliasing genuino cuando la frecuencia de la señal supera la de Nyquist.',
    noModela: 'la ecuación diferencial real del circuito RC del compensador de la sonda (aquí es un modelo paramétrico ilustrativo, no una simulación de circuito); el ancho de banda ni el tiempo de subida propios de la sonda; ruido de fondo, jitter ni resolución vertical del ADC; ventanas de FFT (Hamming, Hanning, Blackman-Harris) — se usa ventana rectangular implícita, sin mostrar su compromiso de fuga espectral; frecuencia de muestreo o profundidad de memoria configurables por el usuario (F<sub>s</sub> y N quedan fijos por caso); modelos comerciales específicos de sonda ni sus curvas de derateo de voltaje contra frecuencia.'
  },
  s6: [
    '<b>IEC 61010-031</b>: requisitos particulares de seguridad para sondas de medición manuales — norma ancla de esta práctica.',
    '<b>IEC 61010-1</b>: requisitos generales de seguridad y categorías de medición CAT II–IV (ya ancla en multímetro, pinza y osciloscopio de este dominio).',
    'Sin norma de exactitud de cumplimiento obligatorio para la atenuación o el ancho de banda de una sonda — consulta la hoja de datos de <b>tu</b> sonda específica.',
    'Criterio de muestreo de Nyquist-Shannon: fundamento matemático del aliasing usado en el Caso 4 (referencia teórica, no una norma de instrumentación).',
    'Hojas de datos de sondas pasivas 10:1 de gama de entrada (Tektronix P2220, Keysight N2862B, Rigol RP2200, Siglent PP215) para verificar terminología, rango de compensación y ancho de banda real.'
  ]
});
