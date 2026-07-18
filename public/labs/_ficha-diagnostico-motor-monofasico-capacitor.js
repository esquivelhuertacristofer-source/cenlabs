fichaTecnica({
  title: 'Ficha técnica — Motor monofásico: fase partida y capacitor, diagnóstico',
  intro: 'Este simulador enseña por qué un motor de inducción monofásico necesita un devanado auxiliar para arrancar, compara las cuatro arquitecturas monofásicas más comunes por su par de arranque relativo, y entrena la lectura de resistencias entre los terminales Común (C), Start (S) y Run (R) para reconocer seis escenarios de diagnóstico. No es un ensayo de laboratorio con un óhmetro físico sobre un motor real: es un ejercicio de comparación de arquitecturas y de interpretación de patrones de resistencia, apoyado en una escena 3D de ensamble.',
  s1: {
    presentes: 'Un motor de banco armable pieza por pieza (devanado principal, devanado auxiliar, rotor de jaula de ardilla, tapas trasera y delantera, interruptor centrífugo, ventilador con cubierta, capacitor de arranque y carcasa) con secuencia de ensamble guiada y demo automática; un tablero con gráfica de barras comparando el par de arranque de las 4 arquitecturas monofásicas; y un tablero de diagnóstico con triángulo de terminales C-S-R que muestra las tres lecturas de resistencia de cada escenario de falla, incluido un modo Reto de identificación a ciegas.',
    omitidos: [
      '**El diagrama fasorial real de las corrientes de los dos devanados**: el simulador cita el rango de desfase eléctrico típico (25°–30° en fase partida simple, 80°–90° con capacitor) como dato de referencia, pero no dibuja ni calcula los fasores de corriente ni el campo giratorio resultante.',
      '**El valor real en microfaradios (µF) del capacitor y su cálculo de diseño**: el capacitor se trata como un componente con un estado binario relevante para el diagnóstico (nominal / en corto / abierto), no como un valor de capacitancia calculado a partir de la corriente y el desfase deseado.',
      '**La velocidad de disparo real del interruptor centrífugo (≈75% de la velocidad síncrona)**: se explica el principio de operación, pero el simulador no modela una curva velocidad-vs-tiempo ni un sensor de velocidad que dispare el interruptor de forma dinámica.',
      '**El comportamiento del motor bajo carga variable o rotor bloqueado prolongado**: el simulador compara arquitecturas por su par de arranque nominal y diagnostica fallas en reposo (motor desenergizado con óhmetro), no el comportamiento térmico o mecánico durante el arranque real.',
    ],
  },
  s2: {
    title: 'Valores de referencia usados',
    warn: 'La fila d5-10 de la lista maestra de prácticas no asigna una norma ancla a esta práctica (columna "Norma ancla" vacía). Los rangos de par de arranque por arquitectura y los grados de desfase eléctrico son valores típicos de texto de referencia en máquinas eléctricas (Fitzgerald/Kingsley/Umans, Chapman) y de catálogo, citados aquí como orientación cualitativa de ingeniería — no como umbrales normativos de una cláusula NOM o IEC específica. NEMA MG-1 se usa solo como referencia contextual general sobre motores monofásicos, sin cita de cláusula numerada. Las resistencias base de los seis escenarios de diagnóstico son valores de diseño didáctico construidos para que R(C-R) + R(C-S) = R(S-R) se cumpla siempre que ambas lecturas sean finitas —la relación serie esperada al medir dos devanados desde un terminal común— y no corresponden a la placa de un motor comercial real.',
    rows: [
      ['Fuente', 'Valor', 'Nota'],
      ['Fase partida (RSIR)', 'Par de arranque 100%–175% del nominal', 'Sin capacitor; devanado auxiliar de mayor resistencia. Menor par de arranque de las 4 arquitecturas.'],
      ['Capacitor de arranque (CSIR)', 'Par de arranque 350%–450% del nominal', 'Un capacitor solo durante el arranque, desconectado por el interruptor centrífugo.'],
      ['Capacitor permanente (PSC)', 'Par de arranque 50%–100% del nominal', 'Un capacitor de menor valor que permanece conectado en marcha; sin interruptor centrífugo.'],
      ['Capacitor de arranque y marcha (CSCR)', 'Par de arranque 350%–450% del nominal', 'Dos capacitores: uno de arranque (desconectado) y uno de marcha (permanente).'],
      ['Escenario "motor sano" (diagnóstico)', 'R(C-R)=2.0 Ω · R(C-S)=3.6 Ω · R(S-R)=5.6 Ω', 'Valores didácticos de diseño; cumplen R(C-R)+R(C-S)=R(S-R) exactamente. No son la placa de un motor real.'],
    ],
  },
  s3: [
    'Óhmetro (simulado): lectura directa de resistencia entre pares de terminales C-S-R en el tablero de diagnóstico.',
    'Gráfica comparativa de par de arranque por arquitectura, integrada al tablero de tipos.',
    'Consola de diagnóstico de fallas con seis escenarios seleccionables y modo de reto sin etiqueta visible.',
  ],
  s4: {
    intro: 'Diferencias entre este simulador didáctico y el trabajo real de campo:',
    items: [
      'En campo, el técnico primero identifica visualmente la arquitectura del motor (número de capacitores, presencia de interruptor centrífugo) y solo después mide con el óhmetro — aquí el modo Tipos y el modo Diagnóstico son ejercicios independientes por claridad pedagógica.',
      'En campo, un devanado con falla de aislamiento a tierra se detecta con un megóhmetro (prueba de alto voltaje) además del óhmetro común — el simulador simplifica esa prueba a una lectura binaria de continuidad R-tierra.',
      'En campo, las lecturas de resistencia varían con la temperatura del devanado y la calibración del instrumento — el simulador usa valores fijos y exactos para que la relación R(C-R)+R(C-S)=R(S-R) sea siempre verificable como criterio de coherencia de la medición.',
      'La selección real de arquitectura de motor en campo también considera costo, disponibilidad y espacio físico — el simulador se limita al criterio central de par de arranque relativo frente al tipo de carga.',
    ],
  },
  s5: {
    modela: 'El simulador modela con precisión verificable: (1) por qué un devanado único produce un campo pulsante y no un par de arranque neto; (2) la comparación cualitativa correcta del par de arranque relativo entre las 4 arquitecturas monofásicas (PSC < RSIR < CSIR ≈ CSCR); (3) la relación serie R(C-R)+R(C-S)=R(S-R) que un técnico usa como primer criterio de coherencia al medir un motor monofásico desenergizado; (4) seis patrones de resistencia distintos y mutuamente distinguibles para reconocer devanado auxiliar abierto, devanado principal abierto, capacitor en corto, capacitor abierto y falla de aislamiento a tierra.',
    noModela: 'El simulador NO modela: el diagrama fasorial de corrientes ni el cálculo del campo giratorio resultante; el valor real en microfaradios del capacitor ni su fórmula de diseño; la velocidad de disparo dinámica del interruptor centrífugo; el comportamiento térmico del motor bajo sobrecarga o rotor bloqueado prolongado; la variación de la lectura de resistencia con la temperatura del devanado; ni la selección de motor por costo, disponibilidad o espacio físico.',
  },
  s6: [
    '⚑ Fitzgerald/Kingsley/Umans — Electric Machinery, y Chapman — Máquinas Eléctricas: fuente de referencia estándar en la teoría del campo pulsante, el devanado auxiliar y las arquitecturas de motor monofásico (fase partida, capacitor de arranque, capacitor permanente, capacitor de arranque y marcha). Confianza alta en los conceptos cualitativos citados; los rangos numéricos de par de arranque se presentan como típicos de catálogo, no como cifras de una edición o página específica.',
    '⚑ NEMA MG-1 — Motors and Generators: referencia contextual general sobre construcción y clasificación de motores monofásicos de inducción. No se cita aquí ninguna cláusula numerada específica para los valores de par de arranque de este simulador.',
    '⚑ Lista maestra de prácticas CEN Labs, fila d5-10 (ELE-II.1): no asigna norma ancla a esta práctica — de ahí que esta ficha use fuentes de texto de referencia en vez de una norma citada con número de cláusula.',
  ],
  foot: 'Fuentes: Fitzgerald/Kingsley/Umans (Electric Machinery) · Chapman (Máquinas Eléctricas) · NEMA MG-1 (referencia contextual). Elaborado para CEN Labs — Dominio D5, Transformadores y máquinas eléctricas.',
});
