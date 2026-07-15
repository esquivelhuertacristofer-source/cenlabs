/* Ficha técnica · Termopar, RTD e Infrarrojo — contenido específico del lab */
fichaTecnica({
  title: 'Termopar, RTD e infrarrojo — tres formas de medir la misma temperatura',
  intro: 'Este laboratorio compara <b>tres instrumentos</b> sobre el mismo bloque caliente: un <b>termopar</b> Tipo K (voltaje por efecto Seebeck, IEC 60584), una <b>RTD Pt100</b> (resistencia que crece con la temperatura, IEC 60751) y una <b>pistola infrarroja</b> (radiación emitida, dependiente de la emisividad configurada). Ninguno "falla" por descompostura: cada error que se observa es el instrumento haciendo exactamente lo que su principio físico permite, mal configurado — sin compensación de junta fría, en conexión a 2 hilos, o con la emisividad de fábrica sobre una superficie que no la cumple.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> termopar Tipo K con lector y LED indicador de compensación de junta fría (CJC); RTD Pt100 con lector y haz de cables conmutable entre 2 y 4 hilos (conexión Kelvin); pistola infrarroja con puntero láser (solo de puntería) y emisividad configurable; un mismo bloque calentado como blanco de los tres instrumentos; quiz de diagnóstico de causa por escenario.',
    omitidos: [
      '<b>Tabla polinómica completa de IEC 60584-1</b> para el termopar Tipo K: aquí se usa un coeficiente de Seebeck promedio constante (0.041 mV/°C), válido como aproximación didáctica en 0–300 °C, no para uso metrológico ni fuera de ese rango.',
      '<b>Ecuación cuadrática de Callendar-Van Dusen</b> para la RTD (obligatoria por debajo de 0 °C y para exactitud fina): aquí se usa la aproximación lineal R=R₀·(1+α·T) con el coeficiente medio α=0.003850 °C⁻¹ de IEC 60751.',
      '<b>Autocalentamiento (self-heating)</b> de la RTD por la corriente de excitación, ni la tolerancia de clase (A/B/AA) de una Pt100 individual fuera de especificación.',
      '<b>Radiación de fondo reflejada</b> por la superficie medida con la pistola IR, la transmisión atmosférica en la trayectoria óptica, el tamaño de punto (spot size) y la distancia focal del instrumento, ni el ruido del detector.',
      '<b>Color real de radiación térmica visible</b>: el brillo del bloque caliente en la escena 3D es una convención didáctica (más cálido = más intenso), no la incandescencia real de un metal a estas temperaturas (150–260 °C, muy por debajo de ≈525 °C).',
      '<b>Modelos comerciales específicos</b> de termopar, RTD o pistola IR: las constantes de coeficiente de Seebeck, resistencia de cable y emisividad son ilustrativas, no la hoja de datos certificada de un fabricante particular.'
    ]
  },
  s2: {
    title: 'Especificaciones usadas por el modelo',
    warn: 'Valores <b>representativos</b> de un termopar Tipo K, una RTD Pt100 y una pistola infrarroja de gama industrial/taller — no de una marca/modelo específico. Para trabajo real, usa la hoja de datos de <b>tu</b> instrumento.',
    rows: [
      ['Instrumento', 'Parámetro de referencia', 'Valor usado en el modelo'],
      ['Termopar Tipo K', 'Coeficiente de Seebeck promedio (0–300 °C)', '≈ 0.041 mV/°C (IEC 60584-1, aproximación lineal)'],
      ['Termopar Tipo K', 'Error sin compensación de junta fría (CJC)', 'igual a la temperatura ambiente del lector (aquí 22 °C)'],
      ['RTD Pt100', 'Resistencia nominal a 0 °C / coeficiente medio', 'R₀ = 100 Ω · α = 0.003850 °C⁻¹ (IEC 60751)'],
      ['RTD Pt100', 'Resistencia de cable por hilo (ilustrativa)', '0.35 Ω/hilo · suma 2× en conexión a 2 hilos, se cancela a 4 hilos'],
      ['Pistola infrarroja', 'Emisividad de fábrica (típica en instrumentos de consumo/taller)', 'ε ≈ 0.95'],
      ['Pistola infrarroja', 'Emisividad real de una superficie metálica pulida/oxidada (ejemplo)', 'ε ≈ 0.20 (rango real depende de la superficie: 0.02–0.9)']
    ]
  },
  s3: [
    'Termopar Tipo K con lector que soporte activar/desactivar la compensación de junta fría (CJC) para fines didácticos.',
    'RTD Pt100 con posibilidad de conexión a 2, 3 o 4 hilos, y lector compatible con conexión Kelvin (4 hilos).',
    'Pistola infrarroja con emisividad configurable por el usuario, no fija de fábrica.',
    'Referencia de temperatura conocida (termopar o RTD patrón, o bloque calibrado) para verificar y corregir la emisividad configurada antes de confiar en una lectura IR crítica.'
  ],
  s4: {
    intro: 'Elegir el instrumento correcto — y configurarlo correctamente — es parte de la competencia, no un detalle. Un procedimiento real añade:',
    items: [
      'Verificar que la compensación de junta fría (CJC) esté activa antes de confiar en una lectura de termopar: sin ella, el lector siempre indica de menos, en una magnitud igual a su propia temperatura ambiente — un error fácil de confundir con descalibración.',
      'Preferir conexión a 4 hilos (Kelvin) para una RTD cuando la exactitud importa, sobre todo con cables largos: a 2 hilos, la resistencia de los cables de extensión se suma directamente a la lectura y crece con la distancia.',
      'Configurar la emisividad de la pistola infrarroja según la superficie real antes de medir — no confiar en el valor de fábrica: superficies metálicas pulidas o brillantes (baja emisividad) pueden hacer que el instrumento subestime la temperatura en más de 100 °C, un riesgo real en termografía de seguridad eléctrica.',
      'Ante una lectura inesperada, diagnosticar primero la configuración del instrumento (CJC, número de hilos, emisividad) antes de sospechar de una falla o descalibración: en la mayoría de los casos de campo, el instrumento funciona correctamente pero está mal configurado para el punto de medición.',
      'Registrar el instrumento, su configuración (CJC on/off, hilos, emisividad) y la lectura junto con la temperatura — no solo el número final.'
    ]
  },
  s5: {
    modela: 'el efecto Seebeck lineal del termopar Tipo K y el error real de omitir la compensación de junta fría (CJC); la ecuación lineal de una RTD Pt100 (R=R₀·(1+α·T)) y el error real de conexión a 2 hilos frente a 4 hilos (Kelvin) por resistencia de cable; y la relación graybody simplificada entre radiación emitida, emisividad configurada y temperatura aparente de una pistola infrarroja, incluyendo el riesgo real y documentado de subestimar drásticamente la temperatura de superficies metálicas brillantes si no se corrige la emisividad.',
    noModela: 'la tabla polinómica completa de IEC 60584-1 para el termopar (aquí, coeficiente de Seebeck promedio constante), la ecuación cuadrática de Callendar-Van Dusen ni el autocalentamiento de la RTD, la radiación de fondo reflejada ni la transmisión atmosférica de la pistola IR, ni la calibración trazable certificada de ninguno de los tres instrumentos — el certificado lo emite un laboratorio acreditado. El color del bloque caliente en la escena 3D es una convención visual didáctica, no radiación térmica físicamente exacta.'
  },
  s6: [
    '<b>IEC 60584-1:2013</b>: tablas de referencia de fuerza electromotriz y tolerancias de termopares (incluye Tipo K).',
    '<b>IEC 60584-3</b>: código de color e identificación de cables de extensión y compensación de termopares.',
    '<b>IEC 60751:2022</b>: termómetros industriales de resistencia de platino (RTD) — R₀=100 Ω, α=0.003850 °C⁻¹, ecuación de Callendar-Van Dusen.',
    'NIST ITS-90 Thermocouple Database: tablas de referencia de fuerza electromotriz por tipo de termopar.',
    'Nota técnica Omega Engineering sobre configuraciones de conexión de RTD a 2, 3 y 4 hilos.',
    'Fluke — "Emissivity: what is it and why is it important?": rangos típicos de emisividad de superficies metálicas y valores de emisividad de fábrica comunes.'
  ]
});
