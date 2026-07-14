fichaTecnica({
  title: 'Ficha técnica — Amplificador de instrumentación INA128 + puente de galgas: sensibilidad y CMRR',
  intro: 'Este laboratorio modela una galga extensométrica montada en un puente de Wheatstone (¼, ½ o completo) y acondicionada con un amplificador de instrumentación INA128: las fórmulas exactas de salida del puente para cada configuración (¼ puente no lineal, ½ y completo exactamente lineales), la ganancia del INA128 fijada por una resistencia externa G=1+50kΩ/R_G, y el error de salida inducido por el rechazo de modo común (CMRR) del amplificador frente al voltaje de modo común del puente.',
  s1: {
    presentes: [
      'Viga instrumentada con galga(s) extensométrica(s) de constantano (GF≈2.0)',
      'Puente de Wheatstone con 1, 2 o 4 galgas activas (¼, ½ o puente completo)',
      'Resistencia de ganancia externa R_G',
      'Amplificador de instrumentación INA128 (Texas Instruments)',
      'Fuente de excitación del puente Vex ajustable',
    ],
    omitidos: [
      'Compensación de resistencia de cables (conexión a 3 hilos) para galgas remotas',
      'Autocalentamiento de la galga como límite térmico real del voltaje de excitación',
      'Offset de voltaje, deriva térmica y error de ganancia propios del INA128',
      'Ruido térmico (Johnson-Nyquist) del puente y ruido de entrada del amplificador',
      'Recorte real de la salida por el rango de alimentación (rail-to-rail o no) del INA128',
      'Tolerancia real de fabricación de galgas y resistores de compleción del puente',
    ],
  },
  s2: {
    title: 'Parámetros del puente y del amplificador (INA128)',
    warn: 'GF=2.0 y R_galga=350 Ω son valores representativos de una galga de constantano típica, no una especificación de un modelo comercial específico — consulta siempre la hoja de datos del fabricante de la galga real.',
    rows: [
      ['Factor de galga GF (fijo, representativo)', '2.0 (constantano típico: 2.0–2.1)'],
      ['Resistencia nominal de galga R_galga', '350 Ω'],
      ['Voltaje de excitación del puente Vex (ajustable)', '2.5 V – 10 V'],
      ['Deformación simulada ε (ajustable)', '−2000 µε – +2000 µε'],
      ['Ganancia del INA128, G=1+50kΩ/R_G (ajustable)', '1 – 1000 V/V (rango del dispositivo: 1–10,000)'],
      ['CMRR del INA128 a G=100 (mín./típ.)', '120 dB / 125 dB'],
      ['CMRR del INA128 a G=1000 (mín./típ.)', '120 dB / 130 dB'],
    ],
  },
  s3: [
    'Fuente de excitación de puente ajustable (2.5 V – 10 V)',
    'Viga o módulo con galga(s) extensométrica(s) montada(s) en configuración ¼, ½ o puente completo',
    'Resistencia de ganancia R_G de precisión',
    'Amplificador de instrumentación INA128 (o equivalente, p. ej. AD620)',
    'Multímetro de precisión (medición de Vout en reposo y bajo carga)',
  ],
  s4: {
    intro: 'Procedimiento físico de referencia que este simulador modela de forma simplificada:',
    items: [
      'Montar la(s) galga(s) en el puente de Wheatstone según la configuración deseada (¼, ½ o completo) y conectar la fuente de excitación Vex.',
      'Conectar las salidas diferenciales del puente a las entradas del INA128, y seleccionar R_G para la ganancia G deseada.',
      'Medir con un multímetro de precisión el voltaje de salida en reposo (deformación nula) y compararlo contra el offset esperado.',
      'Aplicar una deformación conocida (carga calibrada sobre la viga) y medir el voltaje de salida real, comparándolo contra la predicción de las fórmulas de ¼/½/puente completo.',
      'Repetir con distinta ganancia G y observar cómo el error de la medición (ruido, deriva, filtrado de modo común) cambia con la ganancia elegida.',
    ],
  },
  s5: {
    modela: 'El simulador calcula la salida exacta del puente para ¼ puente (Vout/Vex=(GF·ε/4)/(1+GF·ε/2), con su término no lineal), ½ puente (Vout/Vex=GF·ε/2, exactamente lineal) y puente completo (Vout/Vex=GF·ε, exactamente lineal); la ganancia del INA128 G=1+50kΩ/R_G; el voltaje de modo común del puente Vcm≈Vex/2; el CMRR mínimo/típico del INA128 interpolado log-linealmente entre los 4 puntos ancla de la hoja de datos (G=1: 80/86 dB, G=10: 100/106 dB, G=100: 120/125 dB, G=1000: 120/130 dB); y el error de salida inducido por CMRR, error≈G·Vcm/CMRR_lineal, expresado tanto en valor absoluto como relativo a la señal. Usa el punto de referencia (Vex=5 V, ε=+1000 µε, ¼ puente, G=100 → Vbridge≈2.4975 mV, VoutIdeal≈249.75 mV, error≈0.1%) como caso verificado contra la nota de aplicación AN078 de National Instruments y la hoja de datos SBOS051 del INA128.',
    noModela: 'NO modela la compensación de resistencia de cables (conexión a 3 hilos), el autocalentamiento de la galga como límite real de Vex, el offset de voltaje/deriva térmica/error de ganancia propios del INA128, el ruido térmico del puente ni el ruido de entrada del amplificador, el recorte real de salida por el rango de alimentación del INA128 (solo una advertencia visual por encima de ±12 V), ni la tolerancia real de fabricación de galgas y resistores de compleción del puente.',
  },
  s6: [
    { name: 'National Instruments, AN078 — "Measuring Strain with Strain Gages"', note: 'Fórmulas exactas de ¼, ½ y puente completo, incluyendo el término no lineal del cuarto de puente.' },
    { name: 'Vishay Precision Group — "Strain Gage Data Book"', note: 'Valor típico del factor de galga GF≈2.0–2.1 para galgas de constantano.' },
    { name: 'Omega Engineering, nota técnica E-94 — "The Strain Gage"', note: 'Verificación cruzada del factor de galga típico.' },
    { name: 'Texas Instruments, hoja de datos INA128/INA129 (SBOS051)', note: 'Fórmula de ganancia G=1+50kΩ/R_G y tabla de CMRR mínimo/típico por ganancia.' },
    { name: 'Texas Instruments, sboa247/tidub00 — "Bridge Measurement Circuit"', note: 'Voltaje de modo común del puente Vcm≈Vex/2 y cálculo de error de salida inducido por CMRR.' },
    { name: 'Nota curricular ⚑', note: 'La relación entre esta práctica y el programa oficial del sector mecánica-electrónica se documenta con trazabilidad en ficha.md; se recomienda validación por un experto en electrónica de instrumentación.' },
    { name: 'Notas para el revisor experto', note: 'Se actualizará tras verificación técnica final del laboratorio.' },
  ],
});
