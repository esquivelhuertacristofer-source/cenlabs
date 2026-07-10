/* Ficha técnica · Multímetro digital — contenido específico del lab */
fichaTecnica({
  title: 'Multímetro digital — exactitud, resolución y categorías',
  intro: 'Este laboratorio representa una <b>sesión de medición con un DMM de 6000 cuentas</b>: cuatro casos (fuente de CD, red de CA, resistor fuera de circuito y divisor de alta impedancia) donde la respuesta correcta no es un número, sino una <b>lectura ± incertidumbre</b> y una decisión de seguridad. La geometría es <b>procedural y didáctica</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> display de 6000 cuentas con OL y barra analógica, selector de función (V⎓, V~, Ω, mA), autorrango y rango manual, bornes VΩ/COM/mA/10 A, impedancia de entrada de 10 MΩ, fusible de 400 mA y el rótulo de categorías CAT.',
    omitidos: [
      '<b>Deriva térmica y envejecimiento</b>: la especificación real es válida a 23 ± 5 °C y durante 1 año desde la calibración; fuera de eso se agregan términos.',
      '<b>Respuesta true-RMS con ondas no senoidales</b>: la exactitud de V~ aquí aplica a senoides; con recortes de fase o PWM el error real crece con el factor de cresta.',
      '<b>Rechazo de ruido (NMRR/CMRR)</b> y el efecto de tensiones de modo común en la lectura.',
      '<b>Medición a 4 hilos (Kelvin)</b>: para resistencias pequeñas, la resistencia de puntas y contactos domina; este lab mide a 2 hilos.',
      '<b>Continuidad, diodo, capacitancia, frecuencia y temperatura</b>: funciones típicas de un DMM real que este caso de estudio no ejercita.',
      '<b>La corriente de 10 A</b> y su fusible HRC: el borne existe en la escena, pero los casos usan solo la entrada mA.'
    ]
  },
  s2: {
    title: 'Especificaciones usadas por el modelo',
    warn: 'Valores <b>representativos</b> de un multímetro industrial de 6000 cuentas — no de una marca/modelo específico. Para trabajo real, usa la hoja de datos de <b>tu</b> instrumento: el formato ±(% de lectura + dígitos) es el mismo.',
    rows: [
      ['Función', 'Exactitud', 'Rangos'],
      ['V⎓ (CD)', '±(0.5 % + 2 dígitos) · Z_in = 10 MΩ', '600 mV · 6 V · 60 V · 600 V'],
      ['V~ (CA, 50/60 Hz)', '±(1.0 % + 3 dígitos)', '6 V · 60 V · 600 V'],
      ['Ω (resistencia)', '±(0.9 % + 1 dígito)', '600 Ω → 6 MΩ (5 rangos)'],
      ['mA (CD)', '±(1.0 % + 3 dígitos) · fusible 400 mA', '60 mA · 600 mA'],
      ['Seguridad', 'CAT III 600 V · CAT II 1000 V', 'IEC 61010-1']
    ]
  },
  s3: [
    'Multímetro <b>true-RMS</b> con categoría CAT adecuada al punto de medición (y puntas con la MISMA categoría: el sistema vale lo que su eslabón más débil).',
    'Calibrador multifunción o referencia de voltaje para <b>verificación intermedia</b> entre calibraciones.',
    'Pinza amperimétrica para corrientes altas sin abrir el circuito.',
    'Certificado de calibración vigente con trazabilidad a patrones nacionales (CENAM en México).'
  ],
  s4: {
    intro: 'Leer el display es el <b>inicio</b>, no la medición. Un procedimiento real añade:',
    items: [
      'Inspeccionar puntas y verificar el DMM contra una fuente conocida <b>antes</b> de confiar en él (prueba de vida en mediciones de seguridad).',
      'Elegir el rango que use la mayor parte de las cuentas y <b>reportar U</b> con la lectura: 4.998 V ± 0.027 V, no "5 volts".',
      'Confirmar la categoría CAT del punto de medición y usar EPP cuando aplique (NOM-029-STPS en trabajos con líneas energizadas).',
      'Para resistencia: desenergizar, descargar capacitores y descartar caminos en paralelo antes de medir.'
    ]
  },
  s5: {
    modela: 'el presupuesto de exactitud ±(% de lectura + dígitos), la resolución por rango y el autorrango, el efecto de carga de Z_in = 10 MΩ, el fusible de la entrada mA y la lógica de categorías CAT II/III/IV.',
    noModela: 'la deriva térmica ni el envejecimiento, la respuesta true-RMS con formas de onda no senoidales, el rechazo de ruido (NMRR/CMRR), los transitorios reales de la red ni la calibración trazable — el certificado lo emite un laboratorio acreditado.'
  },
  s6: [
    '<b>IEC 61010-1 / UL 61010-1</b>: requisitos de seguridad y categorías de medición CAT II–IV.',
    '<b>JCGM 100:2008 (GUM)</b> / <b>NMX-CH-140-IMNC-2002</b>: guía para la expresión de la incertidumbre de medida.',
    '<b>NOM-029-STPS-2011</b> (México): mantenimiento de instalaciones eléctricas — seguridad del trabajador.',
    '<b>NMX-EC-17025-IMNC</b> (ISO/IEC 17025): requisitos de los laboratorios de calibración que emiten certificados trazables.',
    'Hojas de datos de DMM industriales (formato ±(% + dígitos)) para las especificaciones 1:1 de cada instrumento.'
  ]
});
