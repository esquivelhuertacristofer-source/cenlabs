/* Ficha técnica · Dirección asistida eléctrica (EPS) — contenido específico del lab */
fichaTecnica({
  title: 'Dirección asistida eléctrica (EPS)',
  intro: 'Este laboratorio representa una <b>dirección asistida eléctrica</b>: un <b>sensor de par</b> mide el esfuerzo del conductor y una ECU comanda un <b>motor eléctrico</b> que aporta asistencia a través de un reductor. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> volante, columna con su sensor de par y junta cardán, motor de asistencia con su reductor de tornillo sin fin, cremallera con piñón, fuelles y barras de acoplamiento, y la ECU. Numéricamente: una ganancia de asistencia que depende de la velocidad y un par del conductor fijo.',
    omitidos: [
      '<b>Sensor de ángulo del volante (SAS)</b> y su calibración de punto medio.',
      '<b>Marca de fase</b> de la junta cardán (montaje en una sola posición).',
      '<b>Lazo real sensor → ECU → motor</b>: el par del conductor es una constante (3.0 N·m) y no se mide ni se filtra; no hay corriente de motor, dinámica de la cremallera ni retorno al centro.',
      '<b>Integración con ESP y ADAS</b> (mantenimiento de carril, aparcamiento asistido) por CAN.',
      '<b>Protección térmica</b> del motor y, en algunos diseños, un embrague de seguridad.',
      '<b>Tipo de motor</b> (con escobillas, BLDC o PMSM): no se modela ni se dibuja la electrónica de potencia.'
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
    modela: 'la <b>ganancia de asistencia</b> en función de la velocidad (6.0 − v/25, con un mínimo de 1.5) aplicada a un par de conductor fijo de 3.0 N·m: par en cremallera = par del conductor × ganancia.',
    noModela: 'el lazo de control real sensor → ECU → motor, la dinámica de la cremallera, la limitación térmica del motor ni la integración ADAS; el mapa de asistencia real es una tabla de la ECU (par × velocidad) y aquí solo se representa su dependencia de la velocidad.'
  },
  s6: [
    '<b>ISO 26262</b>: seguridad funcional (la dirección es un sistema crítico).',
    '<b>ECE R79</b> (ONU): equipos de dirección.',
    '<b>FMVSS 203/204</b>: columna de dirección y su desplazamiento en impacto.',
    '<b>Bosch Automotive Handbook</b>: teoría de EPS y diagramas.',
    'Manual de taller del fabricante (FSM) para la secuencia de calibración y pares.'
  ]
});
