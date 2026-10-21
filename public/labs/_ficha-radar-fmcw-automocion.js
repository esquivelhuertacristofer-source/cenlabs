/* Ficha técnica · Radar FMCW de 77 GHz: distancia y velocidad con FFT — contenido específico del lab */
fichaTecnica({
  title: 'Radar FMCW de 77 GHz: distancia y velocidad con FFT',
  intro: 'Este laboratorio muestra un <b>módulo de radar de automoción abierto en corte</b> detrás de un paragolpes, y la cadena de señal completa que lo hace medir: un <b>chirp</b> (barrido lineal de frecuencia), el eco de cada objetivo, la mezcla que produce una frecuencia de batido, una <b>FFT de rango</b>, una <b>FFT de Doppler</b> y un detector <b>CA-CFAR</b>. Las cifras salen de un motor numérico propio, comprobado contra una DFT directa. Es un modelo didáctico, no un sensor homologado.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> chirp lineal de pendiente S = B/T<sub>c</sub> a 77 GHz; batido f<sub>b</sub> = 2·S·R/c; fase de chirp a chirp Δφ = 4π·v·T<sub>c</sub>/λ; muestreo complejo I/Q a 20 MS/s con filtro antialias; <b>resolución</b> ΔR = c/(2B) y Δv = λ/(2·N·T<sub>c</sub>); <b>alcance máximo</b> R<sub>máx</sub> = f<sub>s</sub>·c/(2S) y <b>velocidad máxima sin ambigüedad</b> v<sub>máx</sub> = λ/(4T<sub>c</sub>); ventanas rectangular y de Hann; FFT radix-2 propia; migración de celdas de rango durante el ciclo; acoplamiento rango–Doppler; <b>ecuación del radar</b> con la sección eficaz (RCS) de cada objetivo y ruido térmico; CA-CFAR bidimensional con P<sub>fa</sub> = 10<sup>−6</sup>; memoria de 131 072 muestras y ciclo máximo de 8 ms.',
    omitidos: [
      '<b>Medida de ángulo</b> (varias antenas RX con fase): el modelo mide distancia y velocidad radial, no azimut.',
      '<b>Reflexiones múltiples, suelo y clutter</b>: cada objetivo es un reflector puntual aislado; no hay lóbulos de suelo ni ecos de guardarraíles.',
      '<b>Interferencia entre radares</b> y modulación con varias antenas transmisoras (MIMO).',
      '<b>Fugas TX–RX, ruido de fase del oscilador y no linealidad del chirp</b>: el barrido se supone perfecto.',
      '<b>Seguimiento y fusión</b> (filtro de Kalman, asociación, clasificación): cada ciclo se interpreta solo.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un radar genérico. Los márgenes del reto pertenecen a ESTE modelo y a ESTOS escenarios; no son datos de un producto comercial.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Portadora · longitud de onda', 'banda de automoción', '77 GHz · λ = 3,89 mm'],
      ['Muestreo · memoria', 'ADC complejo I/Q · muestras por ciclo', '20 MS/s · 131 072'],
      ['Potencia TX · ganancia de antena', 'cada antena TX y RX', '10 dBm · 20 dB'],
      ['Figura de ruido · temperatura', 'receptor', '12 dB · 290 K'],
      ['P<sub>fa</sub> del CFAR · ciclo máximo', 'falsa alarma por celda · N·T<sub>c</sub>', '10<sup>−6</sup> · 8 ms'],
      ['Ejemplo B = 1 GHz, T<sub>c</sub> = 40 µs', 'ΔR · R<sub>máx</sub>', '0,15 m · 120 m'],
      ['Ejemplo T<sub>c</sub> = 40 µs, N = 128', 'v<sub>máx</sub> · Δv', '±24,3 m/s · 0,38 m/s'],
      ['Ventana de Hann', 'pérdida de señal · ensanche del lóbulo', '−1,8 dB · 1,5 × la rectangular']
    ]
  },
  s3: [
    'En un ensayo real: <b>cámara anecoica</b> o campo abierto con <b>reflectores de esquina</b> de RCS conocida, colocados a distancias medidas con cinta o láser.',
    'Instrumentación: analizador de señal vectorial o el propio puerto de datos del chip para ver el espectro de batido, y GNSS diferencial para la velocidad del blanco.',
    'Se repite la medida varias veces: el ruido, la posición exacta del reflector y la temperatura mueven los resultados algunos decibelios.',
    'Nunca se prueba el radar de 77 GHz apuntando a personas sin conocer la potencia radiada y los límites de exposición.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre el compromiso entre alcance, resolución y velocidad máxima; la homologación real sigue otros pasos:',
    items: [
      '<b>ETSI EN 302 264</b> y la regulación de la banda de 76–81 GHz: potencia radiada, ancho de banda ocupado y emisiones fuera de banda.',
      '<b>Euro NCAP</b> y <b>UN R152</b>: el radar sólo es un sensor; lo que se evalúa es el sistema completo de frenado de emergencia.',
      'Pruebas de <b>resolución</b> con dos reflectores a distancia y velocidad variables, y de <b>falsa alarma</b> con el entorno vacío.',
      'Registrar el margen de la detección sobre el umbral y la distancia a la que desaparece el objetivo más débil (un peatón, no un camión).'
    ]
  },
  s5: {
    modela: 'una <b>cadena FMCW completa</b>: chirp lineal, batido f<sub>b</sub> = 2SR/c, fase por chirp 4πv·T<sub>c</sub>/λ, muestreo I/Q con filtro antialias, ventana (rectangular o de Hann periódica), FFT de rango y de Doppler propias (radix-2, comprobadas contra una DFT), la <b>ecuación del radar</b> con RCS y ruido térmico, un <b>CA-CFAR 2-D</b> con α = n(P<sub>fa</sub><sup>−1/n</sup> − 1) y una interpolación parabólica del pico con corrección del acoplamiento rango–Doppler. El veredicto del reto usa una evaluación analítica de siete criterios (alcance, velocidad, resolución, detección, precisión, memoria y ciclo) que coincide con el procesamiento completo en más del 90 % de las combinaciones probadas.',
    noModela: 'el ángulo, el clutter, el suelo, las reflexiones múltiples, la interferencia, el ruido de fase ni la no linealidad del chirp. El umbral CFAR real queda alrededor de un 33 % por encima del nominal cuando se usa la ventana de Hann con relleno de ceros, porque las celdas vecinas se correlacionan; el SNR analítico no incluye la migración de celdas de rango. <b>No es una simulación certificada ni un producto comercial</b>: las ventanas de B, T<sub>c</sub> y N que resuelven el reto pertenecen a ESTOS escenarios y a ESTE ruido. Las ondas del 3D son un esquema en cámara lenta (el chirp real dura microsegundos) y la escala de la carretera está comprimida.'
  },
  s6: [
    '<b>ETSI EN 302 264</b>: equipos de radar de corto alcance en 77–81 GHz. <b>ITU-R M.2057</b>: radares de automoción.',
    'Richards, <i>Fundamentals of Radar Signal Processing</i> (FMCW, CFAR, ventanas).',
    'Skolnik, <i>Radar Handbook</i> (ecuación del radar, sección eficaz).',
    'Texas Instruments, <i>The fundamentals of millimeter wave radar sensors</i> (SWRA554) y <i>Programming chirp parameters in TI radar devices</i> (SWRA553).',
    'Harris, F. J. (1978), «On the use of windows for harmonic analysis with the DFT», <i>Proc. IEEE</i> 66(1).'
  ]
});
