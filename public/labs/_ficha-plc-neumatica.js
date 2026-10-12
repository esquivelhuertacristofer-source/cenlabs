/* Ficha técnica · Control secuencial con PLC y neumática — contenido específico del lab */
fichaTecnica({
  title: 'Control secuencial con PLC y neumática',
  intro: 'Este laboratorio representa una <b>secuencia A+ B+ A− B−</b> sobre dos <b>cilindros neumáticos de doble efecto</b>, cada uno con su <b>válvula 5/2 de un solenoide</b> y dos <b>sensores magnéticos de final de carrera</b>, gobernados por un PLC en riel DIN. La secuencia avanza <b>por confirmación de sensor</b>, no por reloj. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> PLC con sus borneras de entrada y salida y su riel DIN, dos cilindros de doble efecto seccionados (camisa, tapas, tirantes, casquillo guía, émbolo con imán y vástago), dos válvulas 5/2 monoestables (cuerpo, bobina, mando manual, silenciadores de escape), cuatro sensores de final de carrera (A0, A1, B0, B1) y los racores de las tapas.',
    omitidos: [
      '<b>Mangueras y cableado</b>: el 3D dibuja los racores y las borneras, pero no los tubos ni los cables que los unen.',
      '<b>Unidad FRL, compresor, tanque y presostato</b>: se supone aire disponible y regulado; la presión, el caudal y la fuerza del cilindro (F = P·A) no se calculan.',
      '<b>Estranguladores como pieza</b>: su efecto se reduce a un parámetro, el tiempo de carrera de cada cilindro; el 3D no los dibuja.',
      '<b>Amortiguación de fin de carrera</b>: el tornillo regulable se dibuja, pero el émbolo se mueve a velocidad constante hasta el tope.',
      '<b>Programa de escalera y editor</b>: la lógica es una máquina de estados fija (orden, conmutación, movimiento, confirmación) escrita en el código del laboratorio; el alumno no programa el PLC.',
      '<b>Fuente de 24 VDC, protecciones, paro de emergencia y relé de seguridad</b>; HMI y redes industriales (Profinet / Modbus / EtherNet-IP).'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y valores típicos',
    warn: 'Los tiempos de conmutación y de confirmación son <b>valores del modelo</b>, elegidos para que se aprecien en pantalla; un sistema real depende del tamaño de la válvula, la longitud de tubería y el tiempo de escaneo del PLC.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Tiempo de carrera de cada cilindro', 'lo fija el estrangulador (ajustable)', '0,4 – 2,0 s'],
      ['Conmutación de la válvula por paso', 'modelo (típico real: decenas de ms)', '0,08 s'],
      ['Confirmación del sensor por paso', 'modelo (ciclo de escaneo del PLC)', '0,07 s'],
      ['Espera máxima sin confirmación', 'tras ella el PLC da alarma', '2,0 s'],
      ['Presión de trabajo', 'contexto de neumática industrial (no se simula)', '4–8 bar (típ. 6 bar)'],
      ['Tensión de E/S y de bobinas', 'lógica industrial', '24 VDC']
    ]
  },
  s3: [
    'PLC con software de programación (lenguajes <b>IEC 61131-3</b>: escalera, FBD, ST).',
    'Fuente de 24 VDC, multímetro y herramienta de crimpado.',
    'Manómetro y unidad <b>FRL</b> (filtro-regulador-lubricador) para acondicionar el aire.',
    'Paro de emergencia y componentes de seguridad; kit de racores y mangueras.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una puesta en marcha real añade:',
    items: [
      'Cableado según diagrama y evaluación de la <b>categoría de seguridad</b> (ISO 13849).',
      'Ajustar la presión en la FRL, abrir los estranguladores poco a poco y <b>poner silenciadores</b> en los escapes.',
      'Programar, simular y hacer la <b>puesta en marcha</b> (commissioning), comprobando cada sensor con el LED del propio sensor.',
      'Aplicar <b>bloqueo/etiquetado (LOTO)</b> antes de intervenir y verificar fugas.'
    ]
  },
  s5: {
    modela: 'una secuencia de dos cilindros con avance por confirmación de final de carrera, el estado de las salidas a las válvulas (YA, YB), el tiempo de ciclo como suma de recorridos más esperas por paso, y la alarma por falta de confirmación (sensor B1 averiable).',
    noModela: 'la fuerza y la presión del cilindro, el caudal y los tiempos reales de conmutación, las fugas, la programación en escalera, la seguridad funcional ni la dinámica del compresor.'
  },
  s6: [
    '<b>IEC 61131-3</b>: lenguajes de programación de PLC.',
    '<b>ISO 4414</b>: reglas de seguridad para sistemas neumáticos.',
    '<b>ISO 13849 / IEC 62061 / IEC 61508</b>: seguridad de maquinaria (SIL / PL).',
    '<b>NOM-004-STPS</b> (México): sistemas de protección en maquinaria.',
    'Manuales y catálogos de fabricante (Festo / SMC / Siemens / Allen-Bradley).'
  ]
});
