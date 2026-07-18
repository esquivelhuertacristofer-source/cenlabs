fichaTecnica({
  title: 'Ficha técnica — Placas de datos y selección de motores',
  intro: 'Este simulador enseña a leer los campos normados de la placa de datos de un motor de inducción trifásico (NEMA MG-1) y a usarlos para dos cálculos de ingeniería (rango de corriente de arranque a rotor bloqueado, HP continuo permitido por el Factor de Servicio) más un criterio de selección con 4 requisitos verificables. No es un ensayo de laboratorio con instrumentos físicos: es un ejercicio de interpretación normativa y cálculo, apoyado en una escena 3D de contexto.',
  s1: {
    presentes: 'Un tablero grande con la placa de datos dibujada sobre canvas (9 casillas clicables, cada una con su explicación técnica al tocarla); un motor de banco modesto (carcasa cilíndrica, tapas/campana, cubierta y aspa de ventilador) con su punto de montaje de placa real marcado; y los controles de HP, voltaje, Factor de Servicio y letra de código que generan el motor candidato de cada reto.',
    omitidos: [
      '**La Tabla 1 completa de NOM-016-ENER-2025**: solo se muestran los 4 puntos ancla verificados contra la fuente primaria (DOF). Para cualquier HP intermedio, el simulador muestra "— (consulta la Tabla 1 completa)" en vez de interpolar o inventar un valor.',
      '**La curva de vida del aislamiento en función de la sobrecarga térmica**: el simulador explica cualitativamente que operar cerca del límite de FS reduce la vida útil, pero no modela una curva tiempo-vs-temperatura.',
      '**La derivación física de la letra de código a partir del diseño interno del motor** (número de barras del rotor, reactancia de dispersión, etc.): aquí la letra se trata como un dato de placa dado, no como una salida de un modelo electromagnético.',
    ],
  },
  s2: {
    title: 'Valores de referencia usados',
    warn: 'Los 4 puntos ancla de NOM-016-ENER-2025 se verificaron contra el texto publicado en el Diario Oficial de la Federación (código de documento 5765860, 19/08/2025, vigente a partir del 15/02/2026). Las 19 letras de código y sus rangos de kVA/HP corresponden a NEMA MG-1. Los valores de par/deslizamiento de los Diseños B/C/D son rangos típicos de catálogo, no cifras de una norma específica citada aquí — se presentan como orientación cualitativa, no como umbrales exactos de aceptación/rechazo.',
    rows: [
      ['Fuente', 'Valor', 'Nota'],
      ['NOM-016-ENER-2025, Tabla 1', '1 HP → 85.5% · 10 HP → 91.7% · 50 HP → 94.5% · 500 HP → 96.2%', 'Trifásico, 4 polos. Puntos ancla verificados; el resto de la tabla no se reproduce en este simulador.'],
      ['NEMA MG-1, letra F', 'kVA/HP 5.00–5.60', 'Letra típica usada como referencia en el modo Explora.'],
      ['NEMA MG-1, Diseño B', 'Par de arranque 150–170% del nominal, deslizamiento ≤5%', 'Uso general; valor de catálogo, no de una cláusula normativa específica citada aquí.'],
    ],
  },
  s3: [
    'Multímetro/tabla de placa (simulado): lectura directa de los 9 campos de la placa.',
    'Calculadora de corriente de arranque (I_LR) integrada al tablero.',
    'Calculadora de HP continuo permitido (HP × FS) integrada al tablero.',
  ],
  s4: {
    intro: 'Diferencias entre este simulador didáctico y el trabajo real de campo:',
    items: [
      'En campo, la letra de código y el Diseño NEMA se leen de la placa física (a veces desgastada o ilegible) y se corroboran con el catálogo del fabricante — aquí siempre están limpios y legibles en el tablero digital.',
      'En campo, seleccionar un motor implica también factores no modelados aquí: altitud, temperatura ambiente real, tipo de arrancador disponible, espacio físico y costo — el simulador se limita a los 4 criterios normativos centrales (HP, FS, corriente de arranque, Diseño NEMA).',
      'La eficiencia declarada en una placa real es un valor específico del fabricante certificado bajo NOM-016; aquí se muestra solo cuando coincide con uno de los 4 puntos ancla verificados, precisamente para no fabricar cifras no verificadas.',
    ],
  },
  s5: {
    modela: 'El simulador modela con precisión verificable: (1) el rango completo de las 19 letras de código NEMA MG-1 y su traducción a un rango de corriente de arranque en amperes para un HP y voltaje dados; (2) el cálculo de HP continuo permitido a partir del Factor de Servicio; (3) los 4 criterios de aptitud de un motor candidato frente a los requisitos de una aplicación (HP, FS, corriente de arranque máxima permitida por la protección, Diseño NEMA adecuado al tipo de carga); (4) la distinción normativa correcta entre NOM-016-ENER-2025 y las clases IE de IEC 60034-30-1.',
    noModela: 'El simulador NO modela: el comportamiento térmico ni la vida útil del aislamiento bajo sobrecarga sostenida; la selección económica del motor (costo, disponibilidad); el efecto de la altitud o la temperatura ambiente real sobre la potencia disponible; la lectura de una placa física desgastada o parcialmente ilegible; ni el cálculo de la Tabla 1 completa de NOM-016-ENER-2025 para valores de HP fuera de los 4 puntos ancla verificados.',
  },
  s6: [
    '⚑ NEMA MG-1 — Motors and Generators: tabla de letras de código de rotor bloqueado (kVA/HP), definición de Factor de Servicio y descripción de Diseños B/C/D. Confianza alta en los 19 rangos numéricos de letras de código; confianza media en la cita de cláusula exacta del Factor de Servicio (se presenta como concepto, no como número de subcláusula específico).',
    '⚑ NOM-016-ENER-2025 (DOF, código de documento 5765860, publicada 19/08/2025, vigente 15/02/2026) — Tabla 1: fuente primaria verificada directamente para los 4 puntos ancla usados. La norma declara explícitamente en su texto que no adoptó las etiquetas IE1–IE4 de ninguna norma internacional.',
    '⚑ IEC 60034-30-1 — clases de eficiencia IE1 a IE4: se usa únicamente como referencia contextual para explicar qué NO es la Tabla 1 de NOM-016; no se citan aquí umbrales numéricos específicos de IEC como datos verificados de este simulador.',
  ],
  foot: 'Fuentes: NEMA MG-1 (Motors and Generators) · NOM-016-ENER-2025 (DOF, 19/08/2025) · IEC 60034-30-1 (referencia contextual). Elaborado para CEN Labs — Dominio D5, Transformadores y máquinas eléctricas.',
});
