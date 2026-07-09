/* Ficha técnica · Inyección electrónica — contenido específico del lab */
fichaTecnica({
  title: 'Inyección electrónica de combustible (EFI / MPFI)',
  intro: 'Este laboratorio representa un <b>sistema de inyección electrónica</b>: la ECU pulsa los inyectores a partir de varios sensores para controlar la <b>mezcla aire-combustible</b>. La geometría es <b>procedural y didáctica</b>; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> inyectores, riel de combustible, bomba, regulador de presión, sensores (MAF/MAP, TPS, CKP, sonda lambda) y ECU.',
    omitidos: [
      '<b>Filtro y líneas</b> de combustible (con o sin retorno) y el amortiguador de pulsos.',
      '<b>Sensores de temperatura</b> (refrigerante ECT, aire IAT) y el cuerpo de aceleración electrónico / IAC.',
      '<b>Sistema EVAP</b> (canister, purga) contra vapores de combustible.',
      '<b>Arnés, relé de bomba y fusibles</b> del circuito.',
      '<b>Inyección directa (GDI)</b>: bomba mecánica de alta presión e inyectores de alta presión.'
    ]
  },
  s2: {
    title: 'Especificaciones típicas',
    warn: '⚠ Valores <b>representativos</b>. La presión, la resistencia del inyector y el ancho de pulso varían por sistema: consulta el manual de servicio (FSM).',
    rows: [
      ['Parámetro', 'Condición', 'Valor típico'],
      ['Presión de riel (MPFI)', 'inyección a puerto', '3–4 bar (≈43–58 psi)'],
      ['Presión de riel (GDI)', 'inyección directa', '50–200+ bar'],
      ['Resistencia de inyector', 'alta impedancia', '12–17 Ω'],
      ['Ancho de pulso', 'ralentí (varía con carga)', '≈2–4 ms'],
      ['Objetivo de mezcla', 'gasolina, lazo cerrado', 'λ ≈ 1 (≈14.7:1)']
    ]
  },
  s3: [
    'Manómetro de presión de combustible (lectura en marcha y prueba de caída/leak-down).',
    'Escáner con <b>datos en vivo</b>: ajustes de combustible (fuel trim STFT/LTFT) y balance de cilindros.',
    'Multímetro / osciloscopio: patrón del inyector y de la sonda lambda.',
    'Probador y limpieza ultrasónica de inyectores; máquina de humo para fugas de vacío.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Un diagnóstico real añade:',
    items: [
      '<b>Aliviar la presión</b> del sistema antes de abrir (seguridad — combustible a presión).',
      'Medir la presión en marcha y su caída; buscar fugas de vacío.',
      'Leer los <b>ajustes de combustible</b> y ver las señales de inyector y lambda con osciloscopio.',
      'Prueba de <b>balance de inyectores</b> y sustitución de O-rings/sellos al reinstalar.'
    ]
  },
  s5: {
    modela: 'la relación de la ECU: sensores → ancho de pulso → mezcla, con <b>realimentación de la sonda lambda</b> (lazo cerrado) y el timing de inyección.',
    noModela: 'la hidráulica real del riel, la atomización del combustible, la química de la combustión ni la dinámica de la bomba.'
  },
  s6: [
    '<b>SAE J1979</b> / <b>ISO 15031</b>: datos de diagnóstico y ajustes de combustible.',
    '<b>Bosch Gasoline Engine Management</b>: teoría de EFI, lambda y diagramas.',
    '<b>NOM-042-SEMARNAT</b> (México): límites de emisiones que la mezcla debe cumplir.',
    'Teoría estequiométrica y control lambda (mezcla ideal aire-combustible).',
    'Manual de taller del fabricante (FSM) para presiones y especificaciones exactas.'
  ]
});
