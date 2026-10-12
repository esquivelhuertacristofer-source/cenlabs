/* Ficha técnica · Sistema de frenos ABS — contenido específico del lab */
fichaTecnica({
  title: 'Sistema de frenos ABS (antibloqueo)',
  intro: 'Este laboratorio representa un <b>sistema de frenos con ABS</b>: sensores miden la velocidad de cada rueda y una unidad hidráulica <b>modula la presión</b> para evitar el bloqueo. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> una rueda con su neumático, el disco, la mordaza, el sensor de velocidad con su rueda fónica (48 dientes), la unidad hidráulica (HCU) con sus ocho electroválvulas y el motor de la bomba de retorno <i>dibujados</i> (la animación los ilumina, pero no calcula presiones por canal) y la ECU del ABS. Se muestra una sola rueda; el ABS de 4 canales no se modela.',
    omitidos: [
      '<b>Cilindro maestro y servofreno</b>, y las líneas de freno completas.',
      '<b>Comportamiento hidráulico</b> de las válvulas y de la bomba de retorno + acumuladores (el modelo las dibuja, pero la presión no se simula).',
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
    modela: 'una lógica antibloqueo simplificada de umbral: el vehículo desacelera a 3,5 m/s² constantes desde 20 m/s y, si el deslizamiento (v_vehículo − v_rueda)/v_vehículo supera 20 %, la rueda se libera (acelera hacia la velocidad del vehículo); por debajo la rueda se frena. El deslizamiento oscila así cerca del 20 %. Es la lógica cualitativa de “mantener, liberar, aplicar”, no un controlador real.',
    noModela: 'la curva μ–deslizamiento (la desaceleración del vehículo es constante e independiente del agarre), la hidráulica real del HCU, la distribución de presión, el tiempo de respuesta de las válvulas, la integración ESP/TCS ni el desgaste.'
  },
  s6: [
    '<b>FMVSS 135</b> (frenos de vehículo ligero) y <b>FMVSS 126</b> (control de estabilidad, ESC).',
    '<b>ECE R13-H</b> (ONU): desempeño de frenado de turismos.',
    '<b>ISO 26262</b>: seguridad funcional de sistemas electrónicos del vehículo.',
    '<b>Bosch Automotive Handbook</b>: teoría de ABS/ESP y diagramas.',
    'Manual de taller del fabricante (FSM) para la secuencia de purga y pares exactos.'
  ]
});
