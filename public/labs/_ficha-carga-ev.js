/* Ficha técnica · Carga de vehículo eléctrico (EVSE) — contenido específico del lab */
fichaTecnica({
  title: 'Carga de vehículo eléctrico (EVSE)',
  intro: 'Este laboratorio representa la <b>carga de un vehículo eléctrico</b>: la estación (EVSE), el conector, el <b>diálogo del piloto de control</b> y las protecciones que entregan energía al vehículo. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> conector/acoplador (Type 1/2, CCS), estación EVSE, contactor, circuito de piloto de control, protección diferencial (RCD) y medidor.',
    omitidos: [
      '<b>Cargador de a bordo (OBC)</b> del vehículo, que realmente convierte AC→DC en la carga AC.',
      '<b>Gestión térmica del cable</b> y el <b>bloqueo del conector</b> en carga rápida DC.',
      '<b>Protección contra sobrecorriente</b> y la <b>puesta a tierra (PE)</b> dedicada de la instalación.',
      '<b>Comunicación digital</b> (PLC / ISO 15118, plug & charge) y la medición de aislamiento en DC.',
      '<b>Balanceo dinámico de carga</b> entre varios puntos.'
    ]
  },
  s2: {
    title: 'Modos y niveles de carga',
    warn: 'Valores <b>representativos</b> según norma y región. Consulta la ficha del equipo y el proyecto de la instalación eléctrica.',
    rows: [
      ['Modo', 'Suministro', 'Potencia típica'],
      ['AC Nivel 1 (doméstico)', 'monofásico', '≈1.4–1.9 kW'],
      ['AC Nivel 2', 'mono/trifásico', '≈3.7–22 kW'],
      ['DC rápida (CCS / CHAdeMO)', 'corriente continua', '50–350+ kW'],
      ['Piloto de control (CP)', 'PWM 1 kHz', 'ciclo ∝ corriente disponible'],
      ['Proximidad (PP)', 'resistencia', 'codifica la capacidad del cable']
    ]
  },
  s3: [
    'Multímetro <b>Cat III</b> y pinza amperimétrica.',
    'Comprobador de EVSE / <b>simulador de vehículo</b> (adaptador de prueba).',
    'Verificador de instalación: RCD tipo A/B, continuidad de <b>PE</b> y aislamiento.',
    'EPP eléctrico apropiado.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una instalación real exige:',
    items: [
      'Circuito <b>dedicado</b> con puesta a tierra y RCD del tipo correcto (A o B).',
      'Cálculo de carga y verificación del <b>diálogo CP/PP</b>.',
      'Apretar terminales a par y hacer pruebas de <b>aislamiento y continuidad de tierra</b>.',
      'Puesta en marcha según IEC 61851; nunca forzar el conector.'
    ]
  },
  s5: {
    modela: 'la <b>negociación del piloto de control</b> (PWM ↔ corriente), la secuencia de estados de conexión y el flujo de potencia.',
    noModela: 'la electrónica de potencia del OBC, la comunicación digital (ISO 15118), la física del contacto/térmica ni la protección real.'
  },
  s6: [
    '<b>SAE J1772</b>: acoplador y señalización de carga AC.',
    '<b>IEC 61851</b>: sistema de carga conductiva. <b>IEC 62196</b>: conectores (Type 2 / Combo).',
    '<b>ISO 15118</b>: comunicación vehículo-red (plug & charge). CHAdeMO.',
    '<b>NOM-001-SEDE</b> (México) / NEC 625: instalación eléctrica para carga de VE.',
    'Manual del fabricante del EVSE y del vehículo.'
  ]
});
