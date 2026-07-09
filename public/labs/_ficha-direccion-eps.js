/* Ficha técnica · Dirección asistida eléctrica (EPS) — contenido específico del lab */
fichaTecnica({
  title: 'Dirección asistida eléctrica (EPS)',
  intro: 'Este laboratorio representa una <b>dirección asistida eléctrica</b>: un <b>sensor de par</b> mide el esfuerzo del conductor y una ECU comanda un <b>motor eléctrico</b> que aporta asistencia a través de un reductor. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> sensor de par, motor eléctrico (BLDC/PMSM), ECU de la dirección, engranaje reductor, columna/cremallera y sensor de ángulo.',
    omitidos: [
      '<b>Sensor de ángulo del volante (SAS)</b> y su calibración de punto medio.',
      '<b>Junta universal / cardán</b> de la columna con su <b>marca de fase</b> (montaje en una sola posición).',
      '<b>Sellos y guardapolvos</b> de la cremallera y los extremos de dirección.',
      '<b>Integración con ESP y ADAS</b> (mantenimiento de carril, aparcamiento asistido) por CAN.',
      '<b>Protección térmica</b> del motor y, en algunos diseños, un embrague de seguridad.'
    ]
  },
  s2: {
    title: 'Fijaciones y pares de apriete',
    warn: '⚠ Valores <b>representativos</b>. Tras cualquier trabajo suele requerirse <b>calibración con escáner</b>. Usa siempre el manual de taller (FSM).',
    rows: [
      ['Unión', 'Fijación típica', 'Par (repr.)'],
      ['Módulo EPS ↔ columna/cremallera', 'pernos M8–M10', '20–35 N·m'],
      ['Junta universal ↔ piñón', 'perno de pinza M8 (con marca de fase)', '20–30 N·m'],
      ['Cremallera ↔ bastidor', 'pernos M10–M12', '60–100 N·m'],
      ['Rótulas / terminales de dirección', 'tuerca M12–M14', '40–70 N·m'],
      ['Tuercas de rueda', '4–5 × M12–M14', '100–140 N·m']
    ]
  },
  s3: [
    'Escáner con <b>calibración del sensor de par y del ángulo</b> (punto medio) — obligatorio tras el servicio.',
    'Alineadora de ruedas (la geometría cambia al tocar la dirección).',
    'Extractor de rótulas, llave dinamométrica.',
    'En vehículos con ADAS: equipo de <b>recalibración de cámara/radar</b>.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un servicio real añade:',
    items: [
      'Centrar la cremallera y respetar la marca de fase de la junta.',
      'Calibrar el <b>sensor de par</b> y el <b>ángulo de dirección</b> con escáner.',
      'Hacer la <b>alineación</b> y, si aplica, recalibrar los sistemas ADAS.',
      'Apretar todo a par y probar la asistencia a ambos lados.'
    ]
  },
  s5: {
    modela: 'el <b>mapa de asistencia</b> (par de ayuda en función del par del conductor y la velocidad) y el lazo sensor → ECU → motor.',
    noModela: 'la dinámica real de la cremallera, la autofijación térmica del motor ni la integración ADAS real.'
  },
  s6: [
    '<b>ISO 26262</b>: seguridad funcional (la dirección es un sistema crítico).',
    '<b>ECE R79</b> (ONU): equipos de dirección.',
    '<b>FMVSS 203/204</b>: columna de dirección y su desplazamiento en impacto.',
    '<b>Bosch Automotive Handbook</b>: teoría de EPS y diagramas.',
    'Manual de taller del fabricante (FSM) para la secuencia de calibración y pares.'
  ]
});
