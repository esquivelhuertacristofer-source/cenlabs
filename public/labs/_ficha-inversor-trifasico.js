/* Ficha técnica · Inversor trifásico (DC→AC) — contenido específico del lab */
fichaTecnica({
  title: 'Inversor trifásico (DC → AC)',
  intro: 'Este laboratorio representa un <b>inversor trifásico</b>: sintetiza corriente alterna a partir de un <b>bus de continua</b> conmutando semiconductores por PWM para accionar un motor. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> módulos de potencia (IGBT / MOSFET SiC), drivers de compuerta, capacitores del bus DC, sensores de corriente, disipador y controlador (DSP/µC).',
    omitidos: [
      '<b>Circuito de precarga</b> del bus (resistencia + relé) que protege los capacitores.',
      '<b>Protección de sobrecorriente y desaturación</b> (desat) de los interruptores, y los snubbers.',
      '<b>Filtro EMI</b> y las barras laminadas (busbars) de baja inductancia.',
      '<b>Sensor de temperatura</b> del módulo y el aislamiento/bootstrap de los drivers.',
      '<b>Resistencia/chopper de frenado</b> y el encoder/resolver del motor.'
    ]
  },
  s2: {
    title: 'Especificaciones típicas y seguridad',
    warn: '⚠ El <b>bus DC guarda carga peligrosa</b> tras apagar: descargar y verificar 0 V antes de tocar. Valores representativos.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor típico'],
      ['Tensión de bus DC', 'tracción / industrial', '300–800 V'],
      ['Dispositivos', 'conmutación', 'IGBT (Si) o MOSFET (SiC)'],
      ['Frecuencia de conmutación', 'PWM (SiC más alta)', '2–20 kHz'],
      ['Tiempo muerto (dead-time)', 'por rama', 'µs (evita cortocircuito de rama)'],
      ['Modulación', '3 fases a 120°', 'senoidal / SVPWM']
    ]
  },
  s3: [
    'Multímetro <b>Cat III/IV</b> y osciloscopio con <b>puntas diferenciales aisladas</b>.',
    'Sonda de corriente; fuente y carga de prueba.',
    'Cámara térmica y <b>descargador de bus</b> con verificación de 0 V.',
    'Guantes dieléctricos y EPP eléctrico.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una puesta en marcha real añade:',
    items: [
      '<b>Descargar el bus DC</b> y verificar 0 V antes de cualquier intervención.',
      'Revisar resistencias de compuerta y el aislamiento de drivers; par en terminales de potencia.',
      'Interfaz térmica correcta en el disipador y <b>precarga</b> antes del contactor principal.',
      'Verificar el <b>tiempo muerto</b> y arrancar con modulación reducida.'
    ]
  },
  s5: {
    modela: 'la <b>síntesis trifásica por PWM</b> (conmutación de 3 ramas a 120°) y la relación tensión/frecuencia (V/f) de la onda resultante.',
    noModela: 'la física del semiconductor (pérdidas de conmutación y conducción), la EMI, la térmica real ni el control vectorial de par completo.'
  },
  s6: [
    '<b>IEC 61800</b>: accionamientos eléctricos de potencia ajustable.',
    '<b>IEC 60146</b>: convertidores de semiconductores. <b>IEC 62477</b>: seguridad de convertidores.',
    '<b>UL 1741</b>: inversores para conexión a red. <b>IEEE 519</b>: armónicos.',
    '<b>NFPA 70E</b>: seguridad en trabajos eléctricos.',
    'Hoja de datos del módulo de potencia (Infineon / Semikron / Wolfspeed).'
  ]
});
