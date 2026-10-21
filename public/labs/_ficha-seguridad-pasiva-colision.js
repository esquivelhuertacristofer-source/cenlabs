/* Ficha técnica · Seguridad pasiva: zona de deformación, cinturón y airbag — contenido específico del lab */
fichaTecnica({
  title: 'Seguridad pasiva: zona de deformación, cinturón y airbag',
  intro: 'Este laboratorio representa un <b>choque frontal contra barrera rígida</b>, en corte longitudinal y a cámara lenta. Todo lo que se aplasta, avanza, se tensa o se infla sale de un <b>modelo de parámetros concentrados de un solo eje</b>, calculado y verificado; donde el 3D simplifica, aquí se documenta. <b>No es un análisis de elementos finitos ni cumple una homologación.</b>',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el vehículo (1 400 kg) con su zona de deformación —largueros que se pliegan, travesaño, espuma y piel del paragolpes, radiador— y el motor como tope rígido; el habitáculo con su jaula (montantes A, B y C, techo, larguero y mamparo); el asiento; el volante y el módulo del airbag; el <b>cinturón de tres puntos con pretensor pirotécnico y limitador de fuerza</b>; la bolsa del conductor con su inflador, sus ventilas y su sensor de disparo; y un <b>maniquí</b> de tres tamaños (mujer p5, hombre p50 y hombre p95).',
    omitidos: [
      '<b>Airbags laterales, de rodilla y de cortina</b>, y el airbag del acompañante.',
      '<b>Columna de dirección colapsable</b>: el volante es rígido y el cubo es duro (contacto con el volante = fallo).',
      '<b>Rotación del coche, deslizamiento lateral e intrusión del habitáculo</b>: el choque es recto y la jaula no se deforma.',
      '<b>Piernas, pelvis, asiento y cuello</b>: sólo se calcula la parte alta del cuerpo como un solo cuerpo.',
      '<b>Inflador de dos etapas y airbag adaptativo</b>: la bolsa es la misma para los tres ocupantes, por eso el p5 sale peor parado.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo (representativos, no de un modelo comercial)',
    warn: '⚠ Un ensayo real <b>no se sustituye</b> con este modelo. Los valores son representativos, elegidos para que el orden de magnitud sea el de un coche compacto.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa del vehículo', 'M', '1 400 kg'],
      ['Estructura frontal', 'meseta F<sub>c</sub> = E / (η·L − x<sub>r</sub>/2)', 'η = 0,90 · x<sub>r</sub> = 60 mm'],
      ['Fondo de carrera', 'el motor contra el mamparo', 'k<sub>b</sub> = F<sub>c</sub> / 25 mm'],
      ['Recuperación elástica', 'rebote de la estructura', 'k<sub>u</sub> = F<sub>c</sub> / 10 mm'],
      ['Masa efectiva del ocupante', 'cabeza, cuello, tórax, brazos y abdomen', '19 · 32 · 44 kg (p5 · p50 · p95)'],
      ['Cinturón', 'rigidez · amortiguamiento · holgura', '90 kN/m · 1 200 N·s/m · 40 mm'],
      ['Pretensor', 'dispara a los 8 ms y recoge', '45 mm en 6 ms'],
      ['Airbag', 'volumen máximo · área de contacto', '55 L · 0,12 m²'],
      ['Inflador', 'masa de gas · duración · temperatura', '40 g · 30 ms · 900 K'],
      ['Ventilas', 'área · coeficiente de descarga', '45 cm² · 0,7 (con alivio por encima de 55 kPa)'],
      ['Sensor', 'retardo del algoritmo tras el ΔV umbral', '2 ms'],
      ['Criterio del tórax', 'A<sub>3ms</sub> (acumulado)', 'FMVSS 208: 60 g']
    ]
  },
  s3: [
    '<b>Acelerómetros triaxiales</b> en el pecho, la cabeza y la pelvis del maniquí, y celda de carga en el cinturón.',
    'Barrera deformable o rígida con <b>celdas de carga</b> en la placa; cámaras de alta velocidad.',
    'Maniquí <b>Hybrid III</b> (p5, p50, p95) con su calibración vigente.',
    'Sistema de adquisición con filtro CFC 180 para el pecho (el modelo no filtra).'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un ensayo de homologación real añade:',
    items: [
      '<b>Preparar y calibrar</b> el maniquí y registrar la posición del asiento, el volante y el cinturón.',
      'Verificar el <b>pretensor y el limitador</b> instalados y el <b>inflador</b> con su número de lote.',
      'Alinear el coche con la barrera y verificar la velocidad de impacto con tolerancia de ±1 km/h.',
      'Leer los <b>criterios de lesión</b> (cabeza HIC, cuello, tórax, fémur) tras el ensayo, no sólo el pecho.',
      'Desactivar o retirar con las precauciones del fabricante los <b>generadores pirotécnicos</b> sin disparar.'
    ]
  },
  s5: {
    modela: 'la <b>cinemática y la energía</b> de un choque frontal recto: la barrera pide una fuerza F(x) con rampa, meseta y fondo de carrera, y la estructura se afina para disipar la energía cinética en η·L; la <b>deceleración del vehículo</b> y su ΔV (con el rebote elástico); el <b>ocupante</b> de un grado de libertad con el cinturón (resorte–amortiguador con holgura, pretensor y limitador que paga la cinta que excede), el cubo del volante y la <b>bolsa de gas ideal</b> (masa y energía del gas, inflador, ventilas con flujo compresible y alivio, calor cedido a la tela); el <b>sensor</b> que dispara al alcanzar un ΔV umbral; y el criterio de 3 ms del tórax. La conservación de energía y de cantidad de movimiento del conjunto se comprueba a 1e-11 y el gas conserva masa a 1e-9.',
    noModela: 'un modelo de elementos finitos, la deformación real de la chapa y del habitáculo, la geometría de los largueros (los pliegues son una visualización), el contacto cabeza–bolsa, el cuello ni el criterio HIC, las costillas (el cinturón sólo se limita en fuerza), la pelvis ni las piernas, la dispersión de un ensayo real ni una homologación. Los datos del inflador, las ventilas, el sensor y la barrera son representativos. La postura del maniquí, el tamaño de la bolsa y el calor de la chapa son esquemas: el único cuerpo que se calcula es el tórax, y el color de la estructura sólo representa la fracción de energía ya absorbida.'
  },
  s6: [
    '<b>FMVSS 208</b> (NHTSA): ocupantes en choque frontal. <b>Euro NCAP</b>: protocolo de impacto frontal (64 km/h, barrera deformable).',
    '<b>UN R94</b> (ECE): protección de los ocupantes en choque frontal. <b>ISO 3560</b> y <b>SAE J211</b>: instrumentación de impactos.',
    'Huang, <i>Vehicle Crash Mechanics</i> (CRC Press) y Kramer, <i>Passive Safety of Vehicles</i> (Vieweg+Teubner).',
    'Wierzbicki y Abramowicz, <i>On the crushing mechanics of thin-walled structures</i> (J. Applied Mechanics, 1983).',
    'Wang y Nefske, <i>A new CAL3D airbag inflation model</i> (SAE 880654), para el modelo termodinámico de la bolsa.'
  ]
});
