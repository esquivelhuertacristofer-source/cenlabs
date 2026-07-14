fichaTecnica({
  title: 'Ficha técnica — Convertidor reductor (buck): D, rizo de IL y CCM/DCM',
  intro: 'Este laboratorio modela un convertidor reductor (buck) tipo LM2596 en modo de conducción continua (CCM): el ciclo de trabajo D=Vout/Vin, el rizo de corriente del inductor ΔIL=Vout(1−D)/(L·fsw), la corriente crítica Icrit=ΔIL/2 que marca la frontera con el modo de conducción discontinua (DCM), y la composición del rizo de voltaje de salida ΔVout entre el término capacitivo y el término resistivo (ESR).',
  s1: {
    presentes: [
      'Regulador de conmutación LM2596 (versión ajustable), topología reductora (buck)',
      'Diodo Schottky de rueda libre 1N5825',
      'Inductor de almacenamiento L (22–220 µH, núcleo de tambor)',
      'Capacitor de entrada Cin y de salida Cout (electrolíticos, con ESR)',
      'Carga resistiva ajustable (Iout)',
    ],
    omitidos: [
      'Lazo de realimentación y compensación (control de modo de voltaje/corriente)',
      'Pérdidas de conmutación y de conducción del MOSFET/diodo (eficiencia η)',
      'Rectificación síncrona',
      'Modelo detallado de saturación del inductor y tolerancias reales de componentes',
      'Modo de conducción discontinua completo (relación M(D,K) — se aborda en el siguiente laboratorio)',
    ],
  },
  s2: {
    title: 'Parámetros del regulador (LM2596, versión ajustable)',
    warn: 'Los valores de ESR en la tabla de capacitores son cifras típicas genéricas para fines didácticos, no datos literales de un fabricante específico — consulta siempre la hoja de datos del componente real.',
    rows: [
      ['Vin (fijo en este laboratorio)', '12 V'],
      ['Rango de Vin del LM2596', '4.5 V – 40 V'],
      ['Frecuencia de conmutación fsw', '150 kHz (fija, típica del LM2596)'],
      ['Corriente de salida máxima', '3 A'],
      ['Diodo de rueda libre', '1N5825 (Schottky)'],
      ['Inductor L (ajustable en este laboratorio)', '22 µH – 220 µH'],
      ['Capacitor de salida Cout (ajustable)', '100 µF – 1000 µF, con ESR típica 0.05–0.30 Ω'],
    ],
  },
  s3: [
    'Fuente de alimentación de 12 V CC',
    'Módulo convertidor buck basado en LM2596 (o equivalente)',
    'Multímetro (medición de Vout, Iout)',
    'Osciloscopio (medición de rizo de IL y del nodo de conmutación)',
    'Carga electrónica o resistencia de potencia variable',
  ],
  s4: {
    intro: 'Procedimiento físico de referencia que este simulador modela de forma simplificada:',
    items: [
      'Fijar Vin=12 V y seleccionar Vout mediante el divisor de realimentación del LM2596.',
      'Seleccionar L y Cout según el punto de operación deseado (Iout, rizo máximo aceptable).',
      'Medir con osciloscopio la forma de onda triangular de IL (o del nodo de conmutación) para verificar el modo de conducción (CCM vs. DCM).',
      'Medir el rizo de voltaje de salida ΔVout y comparar contra el valor calculado (componente capacitivo + componente resistivo por ESR).',
      'Repetir para distintos valores de Iout y verificar la corriente crítica Icrit en la que el convertidor cruza de CCM a DCM.',
    ],
  },
  s5: {
    modela: 'El simulador calcula D=Vout/Vin (balance volt-segundo en CCM), ΔIL=Vout(1−D)/(L·fsw), Icrit=ΔIL/2, ILavg=Iout, ILpico=ILavg+ΔIL/2, ILvalle=ILavg−ΔIL/2, la clasificación CCM/DCM comparando Iout contra Icrit, ΔVout≈ΔIL/(8·C·fsw)+ESR·ΔIL, y la corriente promedio de entrada Iin_avg=D·Iout. Usa el punto de referencia del LM2596 (Vin=12 V, Vout=5 V, Iout=3 A, fsw=150 kHz, L=68 µH, Cout=220 µF/25 V, Cin=470 µF/50 V, diodo 1N5825) como caso verificado contra la hoja de datos.',
    noModela: 'NO modela la relación de conversión real en DCM (M(D,K), que depende de la carga — queda para un laboratorio posterior), las pérdidas por conmutación y conducción ni la eficiencia η, la rectificación síncrona, la dinámica de lazo cerrado y su compensación, ni la tolerancia real de componentes o la saturación del núcleo del inductor.',
  },
  s6: [
    { name: 'Texas Instruments, SLVA477B — "Basic Calculation of a Buck Converter\'s Power Stage"', note: 'Ecuaciones de D, ΔIL, selección de L y C.' },
    { name: 'Texas Instruments, SLVA057 — "Understanding Buck Power Stages in Switchmode Power Supplies"', note: 'Análisis de las formas de onda de corriente del inductor en CCM/DCM.' },
    { name: 'Texas Instruments, SLVA630A — "Output Ripple Voltage of Buck Switching Regulators"', note: 'Composición del rizo de salida en componente capacitivo y componente por ESR.' },
    { name: 'Texas Instruments, LM2596 datasheet (SNVS124)', note: 'Parámetros del regulador y punto de referencia de diseño.' },
    { name: 'Erickson, R. & Maksimovic, D. — "Fundamentals of Power Electronics", cap. 2 y 5', note: 'Fundamento teórico del análisis volt-segundo y balance de carga en convertidores conmutados.' },
    { name: 'Nota curricular ⚑', note: 'La relación entre esta práctica y el programa oficial del sector mecánica-electrónica se documenta con trazabilidad en ficha.md; se recomienda validación por un experto en electrónica de potencia.' },
    { name: 'Notas para el revisor experto', note: 'Se actualizará tras verificación técnica final del laboratorio.' },
  ],
});
