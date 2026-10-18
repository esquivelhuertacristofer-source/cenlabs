/* Ficha técnica · Motor de tracción PMSM — contenido específico del lab */
fichaTecnica({
  title: 'Motor de tracción síncrono de imanes (IPM)',
  intro: 'Este laboratorio representa el <b>motor de tracción</b> de un coche eléctrico, cortado por la mitad: estátor de 48 ranuras con devanado trifásico, rotor de <b>imanes interiores en V</b> (8 polos), eje, rodamiento y camisa de agua. El campo giratorio, el par y las curvas salen de un <b>modelo dq calculado y verificado</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> carcasa con aletas y camisa de refrigeración por agua, estátor laminado de 48 ranuras con su devanado trifásico (cuñas y cabezas de bobina), rotor laminado con 16 imanes en V (dos por polo, N/S alternados) y sus cavidades de aire, eje escalonado, rodamiento trasero a medio corte, tapa, pies y caja de bornes.',
    omitidos: [
      '<b>Aislamiento de ranura y barniz de impregnación</b> de los devanados.',
      '<b>Sensores</b> de temperatura (NTC/PT100) y de posición (resolver): el control conoce el ángulo del rotor por definición.',
      '<b>Sellos, retenes, engrase</b> del rodamiento y el rodamiento delantero; el acople al reductor.',
      '<b>Puentes magnéticos y detalles de las láminas</b> (espesor, apilado, barrenos de armado).',
      '<b>Conexionado interno</b> de las bobinas: el devanado se dibuja por fase, no hilo a hilo.'
    ]
  },
  s2: {
    title: 'Especificaciones de este motor',
    warn: 'Valores <b>representativos</b> de un motor de tracción de 8 polos. Un motor real se rige por su <b>hoja de datos</b>; con imanes, el rotor genera tensión <b>aunque el motor esté apagado</b>.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Polos · ranuras', 'rotor IPM en V', '8 (p = 4) · 48'],
      ['Imán de flujo', 'ψ<sub>m</sub>', '0,0978 Wb'],
      ['Inductancias', 'L<sub>d</sub> · L<sub>q</sub> (saliencia)', '0,30 mH · 0,75 mH'],
      ['Resistencia de fase', 'R<sub>s</sub>', '10 mΩ'],
      ['Bus y límite de tensión', 'V<sub>dc</sub> · V<sub>dc</sub>/√3', '350 V · 202 V de fase'],
      ['Corriente máxima', 'pico por fase', '450 A'],
      ['Par y potencia', 'hasta el codo de la envolvente', '320 N·m · 110 kW a 3283 rpm'],
      ['Velocidad máxima', '700 Hz eléctricos', '10 500 rpm']
    ]
  },
  s3: [
    '<b>Megóhmetro</b> (aislamiento de devanados a masa) y miliohmímetro (resistencia y balance de fases).',
    'Osciloscopio con <b>puntas diferenciales aisladas</b> y sonda de corriente; analizador de potencia.',
    'Gaussímetro o sensor Hall para verificar la <b>polaridad de los imanes</b>.',
    'Extractor de rodamientos, calentador de inducción y llave dinamométrica; cámara térmica.',
    'Guantes dieléctricos y EPP eléctrico; <b>no manipular rotores de imanes</b> cerca de marcapasos ni herramienta de acero.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un armado y puesta en marcha real añade:',
    items: [
      'Montar el rotor con <b>útil guía</b>: los imanes atraen el acero con mucha fuerza.',
      'Prueba de <b>aislamiento</b>, resistencia y balance de fases antes de energizar.',
      '<b>Alinear el resolver</b> con el eje d del rotor (desfase eléctrico de calibración).',
      'Verificar la <b>secuencia de fases</b>, el circuito de refrigeración y arrancar sin carga.'
    ]
  },
  s5: {
    modela: 'el <b>modelo dq</b> de amplitud invariante, con las transformadas de Clarke y Park; el par <b>T = 1,5·p·[ψ<sub>m</sub>·i<sub>q</sub> + (L<sub>d</sub> − L<sub>q</sub>)·i<sub>d</sub>·i<sub>q</sub>]</b> con sus componentes de imán y de reluctancia; el <b>MTPA</b> en forma cerrada; el <b>círculo de corriente</b> y la <b>elipse de tensión</b> exacta con R<sub>s</sub>; el <b>debilitamiento de campo</b> y la región de potencia constante; las pérdidas en cobre, en hierro (con flujo saturado) y mecánicas, y de ahí P y η. El campo giratorio es la FMM real de las tres corrientes de fase; el rotor lleva su ángulo de carga δ. Las fallas cambian el modelo: fase abierta (exacta en dq, con rizado de par) y un imán invertido (hueco de par en ese polo).',
    noModela: 'la <b>saturación</b> de L<sub>d</sub> y L<sub>q</sub> con la corriente, el <b>cogging</b> y los armónicos de ranura, la desmagnetización por temperatura, la térmica del bobinado, el inversor y su PWM (la tensión es la media) ni el control con retardos. El hueco de par del imán invertido es cualitativo. La velocidad del barrido va en cámara lenta y los símbolos de corriente no están a escala.'
  },
  s6: [
    '<b>IEC 60034</b>: máquinas eléctricas rotativas (incl. IEC 60034-30, clases de eficiencia IE).',
    '<b>IEC 60034-2-3</b> y <b>ISO 21782</b>: ensayo de motores y componentes de tracción eléctrica.',
    '<b>ISO 6469</b>: seguridad eléctrica de vehículos eléctricos.',
    'Pyrhönen, Jokinen y Hrabovcová, <i>Design of Rotating Electrical Machines</i>; Krause, <i>Analysis of Electric Machinery</i>.',
    'Morimoto et al., control MTPA y debilitamiento de campo de motores IPM (IEEE Trans. Ind. Appl.).'
  ]
});
