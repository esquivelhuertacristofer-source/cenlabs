fichaTecnica({
  title: 'Ficha técnica — Inversión de giro con contactores y enclavamiento',
  intro: 'Este simulador enseña por qué un arrancador reversible necesita enclavamiento mecánico Y eléctrico (no basta con uno solo), cómo la inversión de sentido de giro se logra intercambiando dos fases del motor, y cómo se elige la clase de disparo (10/20/30) de un relevador térmico según IEC 60947-4-1. No es un ensayo con un arrancador físico ni un cronómetro real de disparo térmico: es un ejercicio de lógica de control, de secuencia de fases y de lectura de una fórmula normativa, apoyado en una escena 3D de ensamble.',
  s1: {
    presentes: 'Un arrancador reversible armable pieza por pieza (terminales de línea, contactor KM1-Adelante, contactor KM2-Reversa, enclavamiento mecánico, enclavamiento eléctrico con contactos NC cruzados, relevador térmico, terminales al motor y botonera de 3 hilos) con secuencia de ensamble guiada; un tablero de circuito que dibuja el estado de fuerza y control en vivo —incluida una demostración deliberada de falla al desactivar el enclavamiento—; un tablero térmico con la curva de tiempo de disparo por clase; y un modo Reto que pide elegir la clase de relevador térmico correcta para un escenario de arranque dado.',
    omitidos: [
      '**El esquemático eléctrico normalizado completo** (bobinas, fusibles, contactos auxiliares con numeración IEC, protecciones de sobrecorriente instantánea): el tablero de circuito es un diagrama simplificado didáctico, no un plano de control industrial listo para cablear.',
      '**El tiempo mínimo real de disparo del relevador térmico**: IEC 60947-4-1 solo fija el tiempo MÁXIMO de disparo a 7.2×In por clase (10A/10/20/30); el tiempo mínimo depende de la curva propia de cada fabricante y no se modela aquí.',
      '**El dimensionamiento de calibre de conductor, corriente de plena carga del motor o ajuste de disparo (Ir) del relevador**: el simulador trabaja con el múltiplo m=I/Ir de forma adimensional, no con amperajes de placa reales.',
      '**El tiempo de rebote de contactos, arco eléctrico de apertura o desgaste mecánico del contactor**: los contactores se modelan como interruptores ideales (abierto/cerrado) sin dinámica de conmutación.',
    ],
  },
  s2: {
    title: 'Valores de referencia usados',
    warn: 'IEC 60947-4-1 (Low-voltage switchgear and controlgear — Contactors and motor-starters) es la norma ancla real de esta práctica según la fila d5-15 de la lista maestra. La norma fija con confianza alta el tiempo MÁXIMO de disparo a 7.2×In para cada clase de relevador térmico (10A: 2–10 s · 10: ≤10 s · 20: ≤20 s · 30: ≤30 s) — estos máximos son los valores usados por la fórmula t = t_máx(clase)·(7.2/m)² que implementa el simulador. El tiempo MÍNIMO de disparo de cada clase no está fijado por la norma de forma única (depende de la curva del fabricante) y por eso el simulador NO lo presenta como un valor exacto, solo como una zona no modelada. Las convenciones de cableado del enclavamiento eléctrico (contacto NC cruzado en la bobina opuesta) y la inversión de fases (intercambio de dos de las tres líneas) son prácticas estándar de la industria eléctrica, no una cláusula numerada específica.',
    rows: [
      ['Fuente', 'Valor', 'Nota'],
      ['IEC 60947-4-1 — Clase 10A', 'Máximo 2–10 s a 7.2×In', 'Relevador de disparo rápido; usado en arranques muy breves.'],
      ['IEC 60947-4-1 — Clase 10', 'Máximo 10 s a 7.2×In', 'La clase más común en arranques industriales estándar.'],
      ['IEC 60947-4-1 — Clase 20', 'Máximo 20 s a 7.2×In', 'Para arranques más largos (mayor inercia de carga).'],
      ['IEC 60947-4-1 — Clase 30', 'Máximo 30 s a 7.2×In', 'Arranques prolongados; menor protección relativa ante rotor bloqueado.'],
      ['Inversión de fases (convención de la práctica)', 'KM1: L1→U,L2→V,L3→W · KM2: L1→W,L2→V,L3→U', 'Se intercambian dos líneas (aquí L1↔L3) para invertir el campo giratorio del motor trifásico.'],
    ],
  },
  s3: [
    'Panel de montaje armable con 8 piezas: línea, KM1, KM2, enclavamiento mecánico, enclavamiento eléctrico, relevador térmico, terminales al motor y botonera.',
    'Tablero de circuito con diagrama de fuerza y control en vivo, incluida una demostración controlada de la falla fase-fase que ocurre al desactivar el enclavamiento.',
    'Tablero térmico con gráfica de barras del tiempo de disparo por clase (10/20/30) según la fórmula de IEC 60947-4-1 a 7.2×In.',
    'Modo Reto: 9 escenarios curados de múltiplo de arranque (m) y tiempo real de arranque (ts) para elegir la clase de relevador mínima correcta.',
  ],
  s4: {
    intro: 'Diferencias entre este simulador didáctico y el trabajo real de campo:',
    items: [
      'En campo, el enclavamiento mecánico y eléctrico se verifican físicamente antes de energizar el arrancador —aquí el modo Circuito permite desactivar el enclavamiento eléctrico a propósito, únicamente para que el estudiante vea y entienda la falla que ambos mecanismos existen para prevenir; nunca se hace así en un tablero real.',
      'En campo, el ajuste de corriente (Ir) del relevador térmico se calibra con un dial contra la corriente de placa real del motor —aquí se trabaja con el múltiplo adimensional m=I/Ir para aislar el concepto de clase de disparo sin depender de un amperaje específico.',
      'En campo, un electricista mide continuidad y aislamiento con instrumentos antes de energizar por primera vez —el simulador no incluye esa fase de verificación previa, se centra en la lógica de control ya energizado.',
      'La selección real de clase de relevador también considera el tipo de arranque (directo, estrella-triángulo, con arrancador suave) y la curva específica del fabricante —el simulador usa la fórmula normativa del máximo como criterio único, simplificado con fines didácticos.',
    ],
  },
  s5: {
    modela: 'El simulador modela con precisión verificable: (1) por qué un arrancador reversible necesita DOS enclavamientos independientes (mecánico y eléctrico) y qué falla concreta previene cada uno; (2) la secuencia de fases invertida correcta entre los sentidos Adelante y Reversa (intercambio de dos líneas); (3) la fórmula normativa t=t_máx(clase)·(7.2/m)² de IEC 60947-4-1 para el tiempo máximo de disparo de un relevador térmico de clase 10/20/30; (4) la relación correcta entre el tiempo de arranque real de un motor y la clase de relevador mínima que no dispara en falso durante ese arranque mientras sigue protegiendo ante una sobrecarga sostenida.',
    noModela: 'El simulador NO modela: el esquemático eléctrico normalizado completo con numeración IEC de contactos; el tiempo mínimo real de disparo de cada clase (depende del fabricante); el dimensionamiento de calibre de conductor, corriente de plena carga o ajuste Ir en amperios reales; el rebote de contactos, arco eléctrico o desgaste mecánico del contactor; ni el comportamiento térmico del motor bajo carga variable.',
  },
  s6: [
    '✅ IEC 60947-4-1 — Low-voltage switchgear and controlgear: Part 4-1, Contactors and motor-starters. Norma ancla asignada explícitamente a esta práctica en la fila d5-15 de la lista maestra. Confianza alta en los tiempos MÁXIMOS de disparo por clase (10A/10/20/30) a 7.2×In, que son los valores que implementa la fórmula del simulador.',
    '⚑ Tiempo mínimo de disparo por clase: no está fijado de forma única por la norma (depende de la curva del fabricante) — el simulador declara explícitamente esta zona como no modelada, tanto en el HUD como en el tablero térmico.',
    '⚑ Convenciones de cableado del enclavamiento eléctrico e inversión de fases: prácticas estándar de la industria eléctrica ampliamente documentadas en literatura de control de motores; no se cita aquí una cláusula numerada específica más allá de IEC 60947-4-1 como marco general del arrancador.',
  ],
  foot: 'Fuente: IEC 60947-4-1 (Contactors and motor-starters). Elaborado para CEN Labs — Dominio D5, Transformadores y máquinas eléctricas.',
});
