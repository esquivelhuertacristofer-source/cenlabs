/* Ficha técnica · Motor de combustión interna — contenido específico del lab */
fichaTecnica({
  title: 'Motor de combustión interna (4 tiempos)',
  intro: 'Este laboratorio representa un <b>motor alternativo de 4 tiempos</b>: bloque, cigüeñal, pistones, culata y distribución que convierten la combustión en rotación. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> bloque, cigüeñal, pistones/anillos, bielas, culata, árbol de levas, válvulas, cojinetes (metales) y juntas.',
    omitidos: [
      '<b>Distribución</b> (cadena o banda + tensor y guías) y su <b>sincronización (timing)</b>.',
      '<b>Sistema de lubricación</b>: bomba de aceite, galerías, cárter y filtro.',
      '<b>Refrigeración</b>: bomba de agua, camisas y termostato.',
      '<b>Volante / damper</b>, retenes, sellos y cojinete de empuje (juego axial).',
      '<b>Empaque de culata multicapa (MLS)</b> y los sensores (CKP/CMP).'
    ]
  },
  s2: {
    title: 'Pares de apriete típicos',
    warn: '⚠ Muchos son <b>tornillos de estiramiento (TTY, un solo uso)</b> y llevan <b>par + ángulo</b> en una secuencia. Usa SIEMPRE el manual del motor específico (FSM) y su orden de apriete.',
    rows: [
      ['Unión', 'Fijación', 'Par (repr.)'],
      ['Pernos de culata (TTY)', 'par + ángulo, en secuencia', 'p.ej. 30–60 N·m + 90–180°'],
      ['Tapas de bancada (main)', 'par + ángulo', '20–50 N·m + ángulo'],
      ['Tapas de biela', 'par + ángulo', '20–45 N·m + ángulo'],
      ['Bujía', 'según rosca/asiento', '20–30 N·m'],
      ['Polea/damper del cigüeñal', 'perno grande (varía mucho)', '100–350 N·m + ángulo']
    ]
  },
  s3: [
    'Llave dinamométrica <b>y goniómetro</b> (para el apriete angular).',
    'Micrómetros, comparador y <b>plastigage</b> para holguras de cojinete.',
    'Calibrador de galgas (juego de válvulas, ring gap), compresor de anillos.',
    'Compresímetro / prueba de fugas y herramientas de <b>sincronización</b> de la distribución.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un armado real añade:',
    items: [
      'Medir <b>holguras</b> (cojinetes con plastigage, juego axial, luz entre puntas de anillo).',
      'Lubricar en el ensamble (aceite de armado) y usar <b>tornillos TTY nuevos</b>.',
      'Apretar a <b>par + ángulo</b> en la secuencia correcta y sincronizar (degree) la distribución.',
      'Ajustar juego de válvulas, cebar el sistema de aceite y hacer el <b>asentado (break-in)</b>.'
    ]
  },
  s5: {
    modela: 'el <b>ciclo de 4 tiempos</b> (admisión-compresión-expansión-escape), el orden de encendido y la relación de RPM.',
    noModela: 'la termodinámica de la combustión, la dinámica de gases, la lubricación, las holguras reales ni el balance/vibración.'
  },
  s6: [
    '<b>ISO 898</b>: clases de resistencia de tornillos (por qué un TTY es de un solo uso).',
    '<b>Bosch Automotive Handbook</b>: teoría del motor y diagramas.',
    'Especificaciones de <b>par + ángulo</b> del fabricante (OEM).',
    'Manual de taller (FSM) / Haynes / Chilton para secuencias y valores exactos.',
    'Ciclo Otto/Diesel: base termodinámica del motor de 4 tiempos.'
  ]
});
