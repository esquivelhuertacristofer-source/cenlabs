/* Ficha técnica · Sistema de frenos ABS — contenido específico del lab */
fichaTecnica({
  title: 'Sistema de frenos ABS (antibloqueo)',
  intro: 'Este laboratorio representa un <b>sistema de frenos con ABS</b>: sensores miden la velocidad de cada rueda y una unidad hidráulica <b>modula la presión</b> para evitar el bloqueo. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> sensores de velocidad de rueda, anillos dentados (tone rings), unidad hidráulica / modulador (HCU), ECU del ABS, cilindro maestro y frenos de rueda.',
    omitidos: [
      '<b>Válvulas de admisión y escape</b> internas del HCU (una pareja por canal) y su control por solenoide.',
      '<b>Bomba de retorno + acumuladores</b>: reponen presión durante la regulación.',
      '<b>Sensor de presión, relés e integración con ESP/TCS</b> (control de estabilidad y tracción).',
      '<b>Interruptor de pedal, arnés y testigo</b> de advertencia del tablero.',
      '<b>Entrehierro y estado del anillo dentado</b>: crítico para una señal de velocidad limpia.'
    ]
  },
  s2: {
    title: 'Fijaciones y pares de apriete',
    warn: '⚠ Valores <b>representativos</b> de turismo. Varían por vehículo: usa siempre el manual de taller (FSM). No mezcles tipos de líquido DOT.',
    rows: [
      ['Unión', 'Fijación típica', 'Par (repr.)'],
      ['Sensor de velocidad ↔ mangueta', 'perno M6–M8', '7–12 N·m'],
      ['HCU / modulador ↔ soporte', 'pernos M6–M8', '8–12 N·m'],
      ['Líneas de freno ↔ HCU', 'tuercas de tubería (flare)', '12–18 N·m'],
      ['Mordaza ↔ mangueta', 'pernos M12', '85–130 N·m'],
      ['Tuercas / birlos de rueda', '4–5 × M12–M14', '100–140 N·m']
    ]
  },
  s3: [
    'Escáner con función ABS: leer sensores en vivo y <b>activar bomba/válvulas</b> (muchos ABS exigen purga asistida por escáner).',
    'Kit de purga y líquido DOT nuevo del tipo especificado.',
    'Osciloscopio para ver la señal del sensor de rueda; calibre de galgas para el entrehierro.',
    'Llave dinamométrica, limpiador de frenos, gato con torres.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un servicio real añade:',
    items: [
      'Verificar el entrehierro y el estado del anillo dentado (suciedad → falsas lecturas).',
      'Purgar el circuito con la <b>secuencia del escáner</b> para incluir el modulador.',
      'Leer códigos, borrar y hacer una <b>prueba dinámica</b> de la regulación.',
      'Apretar todo a par y respetar el patrón de estrella en las ruedas.'
    ]
  },
  s5: {
    modela: 'la lógica antibloqueo (detección de deslizamiento y modulación cíclica de presión) y la señal de velocidad de rueda.',
    noModela: 'la hidráulica real del HCU, la distribución de presión en el circuito, la integración ESP/TCS ni el desgaste.'
  },
  s6: [
    '<b>FMVSS 135</b> (frenos de vehículo ligero) y <b>FMVSS 126</b> (control de estabilidad, ESC).',
    '<b>ECE R13-H</b> (ONU): desempeño de frenado de turismos.',
    '<b>ISO 26262</b>: seguridad funcional de sistemas electrónicos del vehículo.',
    '<b>Bosch Automotive Handbook</b>: teoría de ABS/ESP y diagramas.',
    'Manual de taller del fabricante (FSM) para la secuencia de purga y pares exactos.'
  ]
});
