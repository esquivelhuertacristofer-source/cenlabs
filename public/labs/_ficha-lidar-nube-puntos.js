/* Ficha técnica · LiDAR automotriz: tiempo de vuelo, nube de puntos y detección de obstáculos — contenido específico del lab */
fichaTecnica({
  title: 'LiDAR automotriz: tiempo de vuelo, nube de puntos y detección de obstáculos',
  intro: 'Este laboratorio muestra un <b>sensor LiDAR en el techo de un coche, abierto en corte</b> (láser, espejo giratorio y receptor), y todo lo que decide si ve a un peatón: el <b>tiempo de vuelo</b> del destello, la <b>ecuación del lidar</b> (cuánta luz vuelve), la <b>densidad de la nube de puntos</b> según los mandos, el efecto de la <b>lluvia y la niebla</b>, los <b>falsos ecos</b>, la <b>segmentación del suelo</b> y el <b>agrupamiento</b> en objetos. Las cifras salen de un motor numérico propio que traza los rayos contra la escena y está comprobado con formas cerradas y simulaciones de Monte Carlo. Es un modelo didáctico, no un sensor homologado.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> distancia por tiempo de vuelo d = c·t/2 (1 ns = 15 cm); ecuación del lidar para blanco extenso lambertiano P<sub>r</sub> = P·ρ·cosθ/π · A<sub>r</sub>·η/R² · e<sup>−2αR</sup>; umbral de detección fijado por una probabilidad de falsa alarma de 10<sup>−6</sup> por pulso y ruido gaussiano en el receptor; <b>probabilidad de detección</b> P<sub>d</sub> = Q(k − A·√(P<sub>r</sub>/P<sub>mín</sub>)) y <b>alcance al 90 %</b> despejado de la ecuación; error de distancia σ<sub>R</sub> = (c·t<sub>subida</sub>/2)/SNR; geometría del barrido (láseres apilados, separación angular, barridos por segundo) y puntos por segundo; <b>seguridad ocular</b> como tope de potencia; <b>retrodispersión</b> de lluvia y niebla que genera falsos ecos cerca del sensor; trazado de rayos contra suelo, fachadas, coches, camión y peatón; <b>segmentación del suelo</b> y <b>agrupamiento</b> por imagen de distancias; y un reto evaluado con seis criterios (eco, puntos en el peatón, presupuesto, ojo, reacción y fantasmas).',
    omitidos: [
      '<b>Reflexiones múltiples y superficies especulares</b> (cristales, charcos, retrorreflectores): todo blanco es lambertiano.',
      '<b>Luz solar y otros LiDAR</b> como fuente de ruido o interferencia: el ruido es el del receptor.',
      '<b>Distorsión por movimiento del coche</b> durante el barrido y correcciones de pose: el coche se supone parado en cada barrido.',
      '<b>Ecos múltiples por pulso</b> (hojas, rejillas, bordes parciales del haz): se usa el primer eco.',
      '<b>Seguimiento y clasificación</b> (filtros de Kalman, redes neuronales): cada barrido se interpreta solo.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un LiDAR genérico de 905 nm. Los márgenes del reto pertenecen a ESTE modelo y a ESTOS escenarios; no son datos de un producto comercial.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Apertura del receptor · eficiencia óptica', 'A<sub>r</sub> · η', '4·10<sup>−4</sup> m² · 0,30'],
      ['Potencia mínima detectable · falsa alarma', 'P<sub>mín</sub> · P<sub>fa</sub> por pulso', '20 nW · 10<sup>−6</sup>'],
      ['Duración del pulso · tiempo de subida', 'τ · t<sub>subida</sub>', '4 ns · 2 ns'],
      ['Altura del sensor · campo horizontal · vertical', 'montaje en el techo', '1,80 m · 120° · −25° a +7°'],
      ['Divergencia del haz · tope de potencia', 'θ<sub>div</sub> · seguridad ocular didáctica', '1,5 mrad · 100 W'],
      ['Reflectividad', 'ropa oscura · ropa clara · pared · coche', '10 % · 60 % · 40 % · 50 %'],
      ['Atenuación α', 'despejado · lluvia · niebla', '2·10<sup>−4</sup> · 1,7·10<sup>−3</sup> · 1,3·10<sup>−2</sup> m<sup>−1</sup>'],
      ['Alcance al 90 %, ropa oscura, 60 W', 'despejado · lluvia · niebla', '93 m · 83 m · 50 m'],
      ['Densidad, 32 láseres · 0,20° · 10 barridos/s', 'puntos por segundo · hueco a 60 m (horiz. · vert.)', '192 000 · 21 cm · 1,08 m'],
      ['Densidad, 128 láseres · 0,10° · 10 barridos/s', 'puntos por segundo · hueco a 60 m (horiz. · vert.)', '1 536 000 · 10 cm · 26 cm']
    ]
  },
  s3: [
    'En un ensayo real: <b>blancos de reflectividad calibrada</b> (paneles difusos de 10 %, 50 % y 90 %) colocados a distancias medidas con cinta o telémetro, en pista cubierta y de noche.',
    'Para la niebla y la lluvia: <b>cámaras climáticas</b> con visibilidad medida (meteorológica) y gotas controladas; los valores de α se obtienen de esa visibilidad.',
    'Un maniquí de peatón normalizado (por ejemplo el de los ensayos AEB) y el registro de cuántos puntos caen sobre él a cada distancia.',
    'Nunca se mira directo a un emisor sin conocer su clase láser: se usa la medida de la potencia radiada y las gafas adecuadas.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre el compromiso entre alcance, densidad y seguridad; la homologación real sigue otros pasos:',
    items: [
      '<b>IEC 60825-1</b>: clasificación de seguridad de láseres. El tope de 100 W de este lab es didáctico, no el límite de la norma, que depende de la longitud de onda, la duración del pulso y la tasa de repetición.',
      '<b>Euro NCAP</b> y <b>UN R152</b> (frenado de emergencia): el LiDAR es un sensor; lo que se evalúa es el sistema completo.',
      'Pruebas de <b>alcance</b> con blancos de reflectividad conocida y de <b>falsos retornos</b> en niebla y lluvia controladas.',
      'Registrar el margen de la detección sobre el umbral y la distancia a la que desaparece el objetivo más débil (un peatón de ropa oscura, no un coche).'
    ]
  },
  s5: {
    modela: 'una <b>cadena de LiDAR de tiempo de vuelo</b>: d = c·t/2, la ecuación del lidar con blanco lambertiano que llena el haz, el umbral por falsa alarma 10<sup>−6</sup> (k = 4,753), la probabilidad de detección P<sub>d</sub> = Q(k − A·√(P<sub>r</sub>/P<sub>mín</sub>)) comprobada por Monte Carlo, el error de distancia σ<sub>R</sub> comprobado contra un muro, la retrodispersión de lluvia y niebla (fracción de pulsos con falso eco comprobada por simulación), un trazado de rayos propio (suelo, cajas, cilindros y esferas), la segmentación del suelo (más del 99,5 % bien clasificado) y el agrupamiento por imagen de distancias. El veredicto del reto usa una <b>evaluación analítica</b> con el número esperado de puntos en el peatón, y coincide con el procesado completo en 60 de 60 casos probados.',
    noModela: 'el sol, otros LiDAR, los cristales ni los charcos, ni el movimiento del coche durante un barrido, ni los ecos múltiples. El peatón es un cilindro con reflectividad constante, las marcas viales no cambian la reflectividad del suelo, y los coeficientes de atenuación α y la retrodispersión son <b>didácticos</b>. El tope de 100 W no es el límite de IEC 60825-1. <b>No es una simulación certificada ni un producto comercial</b>: los mandos que resuelven el reto pertenecen a ESTOS escenarios y a ESTE ruido. Las escalas del 3D son un esquema: el pulso de luz va en cámara lenta (la luz recorre 55 m/s en pantalla) y la cámara lenta se rotula.'
  },
  s6: [
    '<b>IEC 60825-1</b>: seguridad de productos láser. <b>ISO 26262</b> y <b>SOTIF (ISO 21448)</b>: seguridad funcional de sensores de conducción automatizada.',
    'Richmond y Cain, <i>Direct-Detection LADAR Systems</i> (SPIE Press, 2010): ecuación del lidar y detección.',
    'Winner et al. (ed.), <i>Handbook of Driver Assistance Systems</i> (Springer, 2016): sensores LiDAR de automoción.',
    'Velodyne / Ouster / Hesai, hojas de datos de sensores de 16 a 128 canales (órdenes de magnitud de campo, resolución y puntos por segundo).',
    'Fischler y Bolles (1981), «Random sample consensus», <i>Commun. ACM</i> 24(6): ajuste robusto de planos como el suelo.'
  ]
});
