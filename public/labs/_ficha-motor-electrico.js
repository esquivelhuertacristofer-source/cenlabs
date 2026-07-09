/* Ficha técnica · Motor eléctrico — contenido específico del lab */
fichaTecnica({
  title: 'Motor eléctrico (BLDC/PMSM o inducción)',
  intro: 'Este laboratorio representa un <b>motor eléctrico</b>: los devanados del estator crean un <b>campo magnético rotante</b> que arrastra al rotor. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> estator, rotor, devanados/bobinas, rodamientos, imanes (o barras de rotor), encoder y carcasa.',
    omitidos: [
      '<b>Aislamiento de ranura y barniz de impregnación</b> de los devanados.',
      '<b>Sensores de temperatura</b> (PTC / PT100) y de posición (resolver / efecto Hall).',
      '<b>Caja de bornes</b> y la conexión estrella/triángulo (Y/Δ).',
      '<b>Sellos, ventilador de refrigeración</b> y el grado de protección IP.',
      '<b>Chavetero/acople</b> al eje y, en motores de inversor, el <b>cojinete aislado</b> (corrientes de eje).'
    ]
  },
  s2: {
    title: 'Especificaciones típicas',
    warn: 'Valores <b>representativos</b>. La potencia, tensión y número de polos dependen del motor: consulta la <b>placa de datos (nameplate)</b> y el manual.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor típico'],
      ['Tensión', 'según diseño', '230/400 V (industrial) o HV en tracción'],
      ['Conexión', 'según tensión de red', 'estrella / triángulo (Y/Δ)'],
      ['Polos', 'define la velocidad', 'n = 120·f / nº de polos'],
      ['Tipo', 'según aplicación', 'inducción · PMSM/BLDC · síncrono'],
      ['Clase de eficiencia', 'norma IEC', 'IE2 / IE3 / IE4 / IE5']
    ]
  },
  s3: [
    '<b>Megóhmetro</b> (aislamiento de devanados a masa) y multímetro / miliohmímetro (resistencia y balance de fases).',
    'Analizador de motor / prueba de surge para el aislamiento entre espiras.',
    'Extractor de rodamientos y <b>calentador de inducción</b> para el montaje.',
    'Alineador láser, llave dinamométrica y cámara térmica.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un armado/puesta en marcha real añade:',
    items: [
      'Prueba de <b>aislamiento</b> y de resistencia/balance de los devanados.',
      'Conexión <b>estrella o triángulo</b> correcta según la placa de datos.',
      'Ajuste de rodamientos (montaje en caliente) y <b>alineación del eje</b>.',
      'Verificar la <b>secuencia de fases</b>, marcha en vacío y vibración/temperatura.'
    ]
  },
  s5: {
    modela: 'el <b>campo magnético rotante</b> (secuencia de fases del estator → giro del rotor), la relación velocidad-polos-frecuencia y el par proporcional a la corriente.',
    noModela: 'el electromagnetismo detallado (flujo, saturación, back-EMF), las pérdidas (cobre/hierro), la térmica ni la dinámica del control.'
  },
  s6: [
    '<b>IEC 60034</b>: máquinas eléctricas rotativas (incl. IEC 60034-30 clases de eficiencia IE).',
    '<b>NEMA MG-1</b>: motores y generadores.',
    '<b>IEC 60072</b>: dimensiones y potencias normalizadas.',
    '<b>NOM-016-ENER</b> (México): eficiencia energética de motores.',
    'Datos de placa (nameplate) y manual del fabricante.'
  ]
});
