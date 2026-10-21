/* Ficha técnica · Tren híbrido de división de potencia (engranaje planetario) — contenido específico del lab */
fichaTecnica({
  title: 'Tren híbrido de división de potencia',
  intro: 'Este laboratorio representa el <b>transeje híbrido de división de potencia</b> de un coche tipo Toyota Prius, cortado por la mitad: un conjunto planetario (solar de 30 dientes, tres satélites de 24, corona de 78) reparte la potencia de un motor Atkinson de 1,5 L entre el camino mecánico y el eléctrico (MG1, MG2, batería). Lo que se mueve y se enciende sale de un modelo calculado y verificado; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el conjunto planetario con dentado de evolvente de 20° (solar, tres satélites con rodamiento de agujas, corona de dentado interior, portasatélites con sus pasadores), el eje del motor que atraviesa el solar, MG1 sobre el árbol del solar y MG2 sobre el tambor de la corona (estátor ranurado con devanado, rotor con imanes), el motor térmico de cuatro cilindros en línea (bloque, culata, pistones, bielas, cigüeñal, bujías, volante), la unidad de control de potencia con sus dos inversores y el condensador del bus, los cables de alta tensión y la batería de diez módulos.',
    omitidos: [
      '<b>Amortiguador de torsión</b> y embrague de rueda libre del motor; arranque del motor con MG1.',
      '<b>Convertidor elevador</b> de la PCU y su filtrado; la batería trabaja a su tensión directa.',
      '<b>Reducción final y diferencial</b> (sólo se modela su relación y su rendimiento).',
      '<b>Circuito de lubricación y refrigeración</b> del transeje y del motor; válvulas, distribución y admisión.',
      '<b>Sistema de gestión de la batería</b> (BMS), sus límites térmicos y el contactor de seguridad.'
    ]
  },
  s2: {
    title: 'Especificaciones representativas y seguridad',
    warn: '⚠ Un híbrido tiene un <b>circuito de alta tensión (≈ 200–650 V)</b> con cables naranjas: se desconecta el interruptor de servicio y se espera la descarga antes de tocar. Valores representativos, no del fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Dentado del planetario', 'solar · satélite · corona', '30 · 24 · 78 (ρ = 0,385)'],
      ['Reparto de par', 'motor en el portasatélites', '28 % solar · 72 % corona'],
      ['Motor térmico', 'Atkinson 1,5 L, 4 cilindros', '115 N·m a 4 000 rpm · 57 kW a 5 000'],
      ['Consumo mínimo (mapa del lab)', 'analítico, calibrado', '≈ 222 g/kWh (37,7 %)'],
      ['MG1 · MG2', 'límites del modelo', '10 000 rpm / 30 kW · 400 N·m / 50 kW'],
      ['Batería', 'Voc = 190 + 20·SOC V, R = 0,30 Ω', '6,5 Ah · ±21 kW'],
      ['Reducción final', 'corona → rueda', '3,905 · rueda de 0,317 m'],
      ['Velocidad EV máxima', 'MG1 a 10 000 rpm con motor parado', '≈ 118 km/h']
    ]
  },
  s3: [
    'Multímetro <b>Cat III/IV</b>, guantes dieléctricos de clase 0 y EPP eléctrico.',
    'Interruptor de servicio y verificador de ausencia de tensión.',
    'Escáner de diagnóstico con lectura de PID del sistema híbrido.',
    'Banco de pruebas con dinamómetro para la verificación de la división de potencia.'
  ],
  s4: {
    intro: 'El orden del laboratorio (Willis, punto de operación, diagnóstico) es una <b>descomposición pedagógica</b>. Un diagnóstico real añade:',
    items: [
      '<b>Desconectar el interruptor de servicio</b> y esperar la descarga del bus antes de cualquier intervención.',
      'Leer los códigos de falla y los datos en vivo de MG1, MG2, motor y batería con el escáner.',
      'Comprobar el aislamiento de los cables naranjas y de los devanados con un megóhmetro.',
      'Verificar el estado de la batería (capacidad y diferencia entre módulos) y de la refrigeración de la PCU.'
    ]
  },
  s5: {
    modela: 'la <b>cinemática de Willis</b> (Z<sub>s</sub>·ω<sub>s</sub> + Z<sub>r</sub>·ω<sub>r</sub> = (Z<sub>s</sub>+Z<sub>r</sub>)·ω<sub>c</sub>) y el <b>reparto de pares</b> T<sub>s</sub> : T<sub>c</sub> : T<sub>r</sub> = Z<sub>s</sub> : (Z<sub>s</sub>+Z<sub>r</sub>) : Z<sub>r</sub>; el balance de potencia con pérdidas en las máquinas (hierro, mecánicas y cobre), los inversores, los engranes, la reducción final, los auxiliares y la batería (V<sub>oc</sub>·I − R·I²); el <b>SOC neutro</b> y el <b>óptimo del vehículo</b> (régimen que, con la batería neutra, quema menos combustible, con los límites de MG1, MG2, motor y batería); un mapa de consumo <b>analítico</b> del motor Atkinson con su línea de operación óptima; y el engranaje real de los dientes de evolvente, que se comprueba sin interferencias en seis posiciones del mecanismo. Las tres fallas (MG1 sin par, MG1 bloqueado, MG2 sin par) cambian el modelo.',
    noModela: 'la <b>dinámica</b>: inercias, arranque del motor, transitorios de par ni de batería (cada punto es un equilibrio); el mapa de consumo del motor es un modelo analítico calibrado, <b>no un mapa medido</b>, y las cifras de máquinas, batería y pérdidas son representativas, no del fabricante; MG2 va directo a la corona; no hay BMS, temperatura ni envejecimiento. Los giros van a cámara lenta rotulada y el SOC corre en tiempo real. Las flechas del corte transversal son un esquema: en el aparato real el motor, MG1 y la batería no están en ese plano. No es CFD, FEM ni una certificación.'
  },
  s6: [
    '<b>SAE J1715 / J2907</b>: terminología y ensayo de motores eléctricos de vehículos híbridos.',
    '<b>ISO 6469</b>: seguridad eléctrica de vehículos de propulsión eléctrica. <b>ISO 26262</b>: seguridad funcional.',
    'Hermance y Sasaki, <i>Hybrid Electric Vehicles: Toyota Hybrid System</i>; Liu y Peng, <i>Modeling and Control of a Power-Split Hybrid Vehicle</i> (IEEE TCST, 2008).',
    'Guzzella y Sciarretta, <i>Vehicle Propulsion Systems</i>; Heywood, <i>Internal Combustion Engine Fundamentals</i>.'
  ]
});
