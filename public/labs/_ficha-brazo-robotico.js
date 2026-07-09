/* Ficha técnica · Brazo robótico articulado — contenido específico del lab */
fichaTecnica({
  title: 'Brazo robótico articulado',
  intro: 'Este laboratorio representa un <b>robot articulado</b> (manipulador serial): base, articulaciones con actuadores, eslabones y un efector final que se comanda para alcanzar posiciones. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> base, articulaciones/servos, eslabones (links), efector final (gripper), encoders y controlador.',
    omitidos: [
      '<b>Reductores</b> de precisión (harmonic drive / cicloidales) y los <b>frenos de eje</b>.',
      '<b>Cableado y mangueras internas</b> que recorren cada articulación.',
      '<b>Sensores de par/fuerza</b> y finales de carrera para el <b>homing</b>.',
      '<b>Vallado / cortina de luz y paro de emergencia</b> del sistema de seguridad.',
      '<b>Calibración (mastering)</b> de cada eje y la definición del TCP.'
    ]
  },
  s2: {
    title: 'Fijaciones y parámetros',
    warn: '⚠ Valores <b>representativos</b>. El par de apriete, la carga y el alcance dependen del modelo: consulta el manual del fabricante.',
    rows: [
      ['Elemento', 'Detalle', 'Valor típico'],
      ['Base ↔ bancada', 'pernos M8–M16 (patrón)', 'decenas–cientos N·m'],
      ['Efector ↔ brida (ISO 9409-1)', 'tornillos M5–M6', '5–10 N·m'],
      ['Grados de libertad', 'industrial típico', '6 DOF'],
      ['Carga (payload)', 'incluye la herramienta', 'kg según robot'],
      ['Repetibilidad', 'industrial típico', '±0.02–0.1 mm']
    ]
  },
  s3: [
    'Llave dinamométrica y kit de <b>calibración / mastering</b> de ejes.',
    'Consola de programación (teach pendant) y software de control.',
    'Nivel/alineador para el montaje de la base.',
    'Vallado de seguridad, paro de emergencia y candado LOTO.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una puesta en marcha real añade:',
    items: [
      'Montaje mecánico nivelado y anclaje de la base a par.',
      '<b>Mastering / calibración</b> de cada eje y definición del <b>TCP</b> y la carga.',
      'Evaluación de riesgos y <b>zonas de seguridad</b> (ISO 10218 / ISO/TS 15066 en cobots).',
      'Homing y prueba en vacío a <b>velocidad reducida</b> antes de operar.'
    ]
  },
  s5: {
    modela: 'la <b>cinemática</b> (posición de las articulaciones → pose del efector), la secuencia de movimiento y los grados de libertad.',
    noModela: 'la dinámica real (inercias y pares de motor), los reductores y holguras, las singularidades ni el control en tiempo real.'
  },
  s6: [
    '<b>ISO 10218-1/-2</b>: seguridad de robots industriales.',
    '<b>ISO/TS 15066</b>: robots colaborativos (cobots).',
    '<b>ISO 9409-1</b>: bridas mecánicas de acople del efector.',
    '<b>ISO 9283</b>: criterios de desempeño y repetibilidad. <b>ANSI/RIA R15.06</b>.',
    'Manual del fabricante (ABB / KUKA / FANUC / Universal Robots).'
  ]
});
