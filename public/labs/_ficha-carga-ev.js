/* Ficha técnica · Estación de carga rápida en CD para vehículo eléctrico — contenido específico del lab */
fichaTecnica({
  title: 'Estación de carga rápida en CD (CCS)',
  intro: 'Este laboratorio representa una <b>estación de carga rápida en corriente directa</b> con conector <b>CCS Combo</b>: el gabinete, el módulo de potencia (rectificador AC-DC y convertidor DC-DC), la protección con puesta a tierra, la pantalla con su baliza y el cable con su conector, más el puerto del vehículo. <b>No es una EVSE de corriente alterna</b>: aquí no hay cargador a bordo ni piloto de control CP/PP modelado. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> gabinete, módulo de potencia extraíble con ventilación, caja de protección y varilla de puesta a tierra, pantalla con lector de tarjeta y baliza de estado, cable de carga y conector CCS Combo, puerto de carga del vehículo.',
    omitidos: [
      '<b>Cargador de a bordo (OBC)</b>: en carga rápida en CD no interviene, porque la estación entrega CD directamente a la batería a través del BMS.',
      '<b>Refrigeración líquida del cable</b>: el cable se supone enfriado de forma suficiente salvo en la avería «límite térmico», que sólo se modela como recorte de potencia, no como física del calor.',
      '<b>Comunicación digital</b> (PLC / ISO 15118 / DIN 70121, piloto CP y proximidad PP): el «autenticar» es un solo paso que abstrae todo el handshake.',
      '<b>Medición real del aislamiento en CD</b>, contactores, paro de emergencia, medidor de facturación y balanceo dinámico de potencia entre puntos.',
      '<b>Un BMS detallado</b>: la batería es un SOC con una curva de potencia (plana hasta el 55 % y luego decreciente), no un modelo de celdas.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y modos de carga',
    warn: 'Los valores de la estación de la Fase 3 (50 kW, 350 V, 40 kWh) son del <b>modelo</b>; los retos de cálculo usan otras estaciones y baterías, sorteadas. Los demás son <b>representativos</b> según norma y región: consulta la ficha del equipo.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Estación de la Fase 3', 'potencia máx. / bus del vehículo', '50 kW / 350 V (≈143 A)'],
      ['Batería de la Fase 3', 'capacidad del pack', '40 kWh'],
      ['Curva de carga del modelo', 'potencia constante hasta el 55 % de SOC', 'después baja hasta ≈18 % de P máx. a SOC 100 %'],
      ['Conector CCS Combo', 'corriente continua máxima típica (sin refrigeración líquida)', 'hasta ≈200 A'],
      ['AC Nivel 2', 'otros modos (no modelados)', '≈3,7–22 kW'],
      ['DC rápida', 'rango comercial', '50–350+ kW']
    ]
  },
  s3: [
    'Multímetro <b>Cat III/IV</b> y pinza amperimétrica para CD.',
    'Comprobador de estaciones de carga / <b>simulador de vehículo</b> (adaptador de prueba).',
    'Medidor de aislamiento (megóhmetro) y verificador de continuidad de <b>PE</b>.',
    'EPP eléctrico apropiado y procedimiento de bloqueo/etiquetado (LOTO).'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una instalación real exige:',
    items: [
      'Acometida y circuito <b>dedicado</b>, con puesta a tierra y protección diferencial o monitor de aislamiento adecuados a la CD.',
      'Cálculo de la carga y verificación de la <b>comunicación</b> entre estación y vehículo antes de habilitar potencia.',
      'Apretar terminales a par y hacer pruebas de <b>aislamiento y continuidad de tierra</b>.',
      'Puesta en marcha según IEC 61851; nunca forzar el conector.'
    ]
  },
  s5: {
    modela: 'la relación <b>I = P/V</b>, el tiempo de carga a potencia constante, la curva de potencia frente al SOC y cinco averías con su síntoma observable en la telemetría: mal contacto, falla de autenticación, límite térmico, falla de aislamiento y batería fría.',
    noModela: 'la electrónica interna del módulo de potencia, el protocolo digital real, la física del calor y del contacto, el BMS de celdas ni la protección eléctrica real.'
  },
  s6: [
    '<b>IEC 61851-23</b>: estaciones de carga conductiva en CD. <b>IEC 62196-3</b>: conectores (Combo).',
    '<b>ISO 15118 / DIN 70121</b>: comunicación vehículo–estación.',
    '<b>NOM-001-SEDE</b> (México) / NEC 625: instalación eléctrica para carga de VE.',
    'Manual del fabricante de la estación y del vehículo.'
  ]
});
