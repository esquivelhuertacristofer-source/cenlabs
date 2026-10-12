/* Ficha técnica · Batería de tracción y BMS — contenido específico del lab */
fichaTecnica({
  title: 'Batería de tracción y BMS (alta tensión)',
  intro: 'Este laboratorio representa un <b>paquete de batería de alta tensión</b> y su <b>sistema de gestión (BMS)</b>, que vigila las celdas, las balancea y protege el pack. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> 4 módulos de celdas cilíndricas (12 por módulo, 48 dibujadas; el cálculo usa las 96 en serie del paquete de referencia), una placa BMS con sus circuitos de medida y resistencias de balanceo, un contactor de potencia con su conector de mando, un fusible de alta tensión y la bandeja del paquete. Numéricamente: tensión de celda y de pack, capacidad en Ah (energía / tensión) y SOC.',
    omitidos: [
      '<b>Desconector de servicio (MSD)</b> y el <b>fusible principal / pirotécnico</b> de seguridad.',
      '<b>Circuito de precarga</b> (resistencia + relé) que protege los contactores.',
      '<b>Enclavamiento HVIL</b> y el <b>monitor de aislamiento</b> a chasis.',
      '<b>Barras colectoras (busbars)</b>, sellado IP y el sistema de venteo de gases.',
      '<b>Gestión térmica real</b> (placas/refrigerante), el <b>sensor de corriente</b> y la comunicación CAN con el VCU: no están dibujados ni calculados.',
      '<b>Protecciones activas</b>: el contactor y el fusible se ven pero no se abren ante una falla; no hay límites de sobre/subtensión, sobrecorriente ni temperatura en el cálculo.',
      '<b>Curva real de tensión contra SOC</b> y la estimación de SOC/SOH del BMS: aquí la tensión de celda se interpola linealmente de 3.0 V a 3.65 V con el SOC, y el SOC avanza a ritmo fijo durante la simulación de carga.',
      '<b>Balanceo real</b>: se resaltan dos celdas fijas parpadeando; el modelo no calcula qué celda está más cargada ni cuánta corriente se drena.'
    ]
  },
  s2: {
    title: 'Parámetros típicos (Li-ion) y seguridad',
    warn: '⚠ <b>ALTA TENSIÓN — puede ser LETAL.</b> Solo personal certificado, equipo Cat III/IV, guantes dieléctricos verificados y procedimiento de desenergización del fabricante. Valores representativos según química.',
    rows: [
      ['Parámetro', 'Química / condición', 'Valor típico'],
      ['Tensión de celda', 'NMC / NCA', '2.5–4.2 V'],
      ['Tensión de celda', 'LFP', '2.5–3.65 V'],
      ['Tensión de pack', 'automóvil (según serie)', '≈100–450 V (o 800 V)'],
      ['Corriente', 'carga / descarga', 'decenas–cientos de A'],
      ['Temperatura', 'ventana de operación', '≈0–45 °C carga']
    ]
  },
  s3: [
    'Multímetro <b>Cat III/IV</b> y guantes dieléctricos (clase 0) verificados.',
    '<b>Desconector de servicio (MSD)</b> para desenergizar; comprobador de aislamiento (megóhmetro).',
    'Escáner con datos del BMS (SoC/SoH, tensión y temperatura por celda).',
    'Extintor apropiado / manta ignífuga y protocolo ante fuga térmica.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un servicio real exige, ante todo, seguridad:',
    items: [
      'Seguir la <b>desenergización OEM</b>: retirar el MSD, esperar la descarga de capacitores y <b>verificar 0 V</b>.',
      'Nunca perforar ni deformar una celda; precauciones contra <b>fuga térmica</b>.',
      'Apretar los <b>terminales de alta tensión</b> y las busbars a par.',
      'Prueba de <b>aislamiento</b> antes de reenergizar.'
    ]
  },
  s5: {
    modela: 'la tensión de pack como suma de las celdas en serie (3.65 V × 96 ≈ 350 V), la capacidad en Ah a partir de la energía, y un SOC que sube a ritmo fijo mientras se simula la carga; el balanceo se ilustra, no se calcula.',
    noModela: 'la electroquímica real de la celda, la curva real tensión–SOC, la estimación de SOC/SOH, las protecciones y la apertura de contactores, la propagación de una fuga térmica, el refrigerante ni el envejecimiento.'
  },
  s6: [
    '<b>ISO 6469</b>: seguridad eléctrica de vehículos eléctricos.',
    '<b>ISO 26262</b>: seguridad funcional. <b>UN 38.3</b>: transporte de baterías de litio.',
    '<b>SAE J2464 / J2929</b> e <b>IEC 62660</b>: seguridad y ensayo de celdas/packs.',
    '<b>NFPA 70E</b> / normativa de trabajo eléctrico y EPP.',
    'Manual OEM de alto voltaje para el procedimiento de desenergización específico.'
  ]
});
