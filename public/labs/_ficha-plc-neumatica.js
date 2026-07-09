/* Ficha técnica · Automatización PLC + neumática — contenido específico del lab */
fichaTecnica({
  title: 'Automatización PLC + neumática',
  intro: 'Este laboratorio representa una <b>célula automatizada</b>: un PLC lee sensores y acciona <b>electroválvulas</b> que mueven <b>cilindros neumáticos</b> según una lógica de escalera. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> CPU del PLC, módulos de E/S, electroválvulas (solenoides), cilindros neumáticos, unidad FRL y sensores (finales de carrera / inductivos).',
    omitidos: [
      '<b>Fuente de 24 VDC</b>, protecciones y fusibles del tablero.',
      '<b>Paro de emergencia y relé de seguridad</b> (categoría según ISO 13849).',
      '<b>Silenciadores y estranguladores</b> de escape que regulan la velocidad del cilindro.',
      '<b>Racores, mangueras y borneras</b>: toda la conexión física real.',
      '<b>Compresor, tanque, secador y presostato</b> del suministro de aire.',
      '<b>HMI y red industrial</b> (Profinet / Modbus / EtherNet-IP).'
    ]
  },
  s2: {
    title: 'Especificaciones típicas',
    warn: 'Valores <b>representativos</b> de una célula didáctica. El diseño real depende de la máquina y de la norma de seguridad aplicable.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor típico'],
      ['Presión de trabajo', 'neumática industrial', '4–8 bar (típ. 6 bar)'],
      ['Tensión de E/S', 'lógica industrial', '24 VDC'],
      ['Fuerza del cilindro', 'F = P · A (émbolo)', 'según Ø y presión'],
      ['Sensores', 'salida PNP / NPN', '24 VDC'],
      ['Válvula', 'distribuidora 5/2 o 3/2', 'solenoide 24 VDC']
    ]
  },
  s3: [
    'PLC + software de programación (lenguajes <b>IEC 61131-3</b>: escalera, FBD, ST).',
    'Fuente de 24 VDC, multímetro y herramienta de crimpado.',
    'Manómetro y unidad <b>FRL</b> (filtro-regulador-lubricador) para acondicionar el aire.',
    'Paro de emergencia y componentes de seguridad; kit de racores y mangueras.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una puesta en marcha real añade:',
    items: [
      'Cableado según diagrama y evaluación de la <b>categoría de seguridad</b> (ISO 13849).',
      'Ajustar la presión en la FRL y poner <b>silenciadores</b> en los escapes.',
      'Programar, simular y hacer la <b>puesta en marcha</b> (commissioning).',
      'Aplicar <b>bloqueo/etiquetado (LOTO)</b> antes de intervenir y verificar fugas.'
    ]
  },
  s5: {
    modela: 'la lógica de control (entradas → escalera → salidas), la secuencia de actuación y la fuerza del cilindro <b>F = P·A</b>.',
    noModela: 'la neumática real (caudal, tiempos de conmutación, fugas), la seguridad funcional ni la dinámica del compresor.'
  },
  s6: [
    '<b>IEC 61131-3</b>: lenguajes de programación de PLC.',
    '<b>ISO 4414</b>: reglas de seguridad para sistemas neumáticos.',
    '<b>ISO 13849 / IEC 62061 / IEC 61508</b>: seguridad de maquinaria (SIL / PL).',
    '<b>NOM-004-STPS</b> (México): sistemas de protección en maquinaria.',
    'Manuales y catálogos de fabricante (Festo / SMC / Siemens / Allen-Bradley).'
  ]
});
