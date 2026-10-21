/* Ficha técnica · Postratamiento SCR con AdBlue: NOx, dosificación y amoníaco residual — contenido específico del lab */
fichaTecnica({
  title: 'Postratamiento SCR con AdBlue: NOx, dosificación y amoníaco residual',
  intro: 'Este laboratorio muestra la <b>línea de escape de un diésel en media sección</b>: el motor que suelta NOx, el depósito de AdBlue (urea al 32,5 %) con su bomba e inyector, el mezclador, el catalizador de reducción catalítica selectiva (<b>SCR</b>) dividido en ocho celdas y los sensores de salida. La urea se descompone en amoníaco (NH<sub>3</sub>), el catalizador lo <b>almacena</b> en sus paredes y lo hace reaccionar con el NOx. Todo lo que se mueve y se colorea sale de un modelo con balance de nitrógeno exacto; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el motor de 120 kW con su mapa de NOx crudo, caudal y temperatura de gas; la dosificación como fracción del NH<sub>3</sub> estequiométrico (100 % = una molécula de NH<sub>3</sub> por cada una de NOx); la descomposición parcial de la urea con la temperatura y los <b>cristales</b> que deja por debajo de ~180 °C; el catalizador de 14 L en ocho celdas con la cobertura θ de NH<sub>3</sub> de cada una (el azul de la escena), la adsorción de Langmuir con K(T), la reacción estándar 1:1 y la <b>oxidación</b> del NH<sub>3</sub> a alta temperatura; la inercia térmica del lecho; el amoníaco que se escapa y el diésel que cuesta calentar el escape. Las partículas rojas, verdes y celestes obedecen a las fracciones que calcula el modelo en cada celda.',
    omitidos: [
      '<b>El NO<sub>2</sub> y la «reacción rápida»</b> (NO + NO<sub>2</sub> + 2 NH<sub>3</sub>): el NOx se trata como una sola especie que reacciona 1:1.',
      '<b>El catalizador de oxidación, el filtro de partículas y el catalizador anti-deslizamiento</b> que van antes y después en un escape real.',
      '<b>La mezcla fluida, la película de líquido en la pared y la termólisis/hidrólisis por etapas</b> (HNCO, biuret): la urea sólo se reparte en «amoníaco» y «cristales» con una curva sigmoide de la temperatura.',
      '<b>Congelación del AdBlue (−11 °C), calefactor del depósito, calidad de la urea y sensores cruzados</b>: el sensor de NOx real también lee NH<sub>3</sub>.',
      '<b>El envejecimiento gradual</b> del catalizador: el caso «viejo» del diagnóstico es una sola constante de reacción reducida.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ El <b>AdBlue</b> no es combustible, pero cristaliza y corroe contactos eléctricos; el <b>amoníaco</b> es irritante y tóxico por encima de unas decenas de ppm, y los cristales de urea pueden taponar el escape. Los valores son didácticos, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['AdBlue (ISO 22241)', 'urea en masa · densidad · NH<sub>3</sub> por litro', '32,5 % · 1,090 kg/L · 11,80 mol/L'],
      ['Estequiometría', 'reacción estándar sobre cobre-zeolita', '4 NH<sub>3</sub> + 4 NO + O<sub>2</sub> → 4 N<sub>2</sub> + 6 H<sub>2</sub>O (1 : 1)'],
      ['Motor diésel', 'potencia · rendimiento · NOx crudo', '120 kW · 0,40 · 3,0 + 4,5·L g/kWh'],
      ['Gas de escape', 'temperatura · caudal (L = carga)', '120 + 360·L<sup>0,8</sup> °C · 0,025 + 0,135·L kg/s'],
      ['Catalizador', 'volumen · celdas · capacidad de NH<sub>3</sub>', '14 L · 8 · 12 mol/m³ (reducida a propósito)'],
      ['Adsorción', 'K a 350 °C · calor de adsorción', '500 m³/mol · 36 kJ/mol'],
      ['Reacción SCR', 'energía de activación aparente · límite de transporte', '62 kJ/mol · k<sub>m</sub> = 140 s⁻¹'],
      ['Ventana de actividad', 'conversión ≥ 90 % a media carga', '≈ 200 a 400 °C'],
      ['Urea → NH<sub>3</sub>', 'fracción descompuesta a 150 · 165 · 200 °C', '0,18 · 0,50 · 0,97'],
      ['Gasto de AdBlue', 'a dosis 100 % y media carga', '0,58 L/h = 3,9 % del diésel'],
      ['Ciclo «Arranque en frío»', 'NOx crudo → salida con 100 % · con 115 %, 190 °C, +20 °C', '4,91 → 0,90 g/kWh · 4,91 → 0,63 g/kWh'],
      ['Ciclo «Subida de puerto»', 'NOx crudo → salida con 100 % · con 97 % y 200 °C', '5,75 → 0,41 g/kWh (con 34 mg de cristales) · 5,75 → 0,52 g/kWh']
    ]
  },
  s3: [
    'Escáner del vehículo para leer la temperatura del catalizador, el sensor de NOx, el sensor de amoníaco y el caudal del inyector de AdBlue.',
    'Refractómetro de urea para comprobar que el AdBlue del depósito está al 32,5 % y no diluido ni contaminado.',
    'Endoscopio para mirar el mezclador y buscar cristales de urea en la pared bajo el inyector.',
    'Pistola de calor y multímetro para probar el calefactor del depósito y el conector del inyector.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. El diagnóstico real de un SCR añade:',
    items: [
      'Leer los códigos de calidad de la urea, de eficiencia del SCR y de inyector, y comparar el caudal pedido con el entregado en una prueba de bombeo.',
      'Comprobar la temperatura de entrada y salida del catalizador: una diferencia anormal delata un catalizador sin actividad.',
      'Revisar cristales en el mezclador y en el codo: son señal de inyecciones en frío o de un inyector que gotea.',
      'Medir el NOx y el NH<sub>3</sub> a la salida en un recorrido repetible, con el catalizador ya caliente, antes de condenar la pieza.'
    ]
  },
  s5: {
    modela: 'una <b>cadena de ocho celdas en serie</b> con el gas en régimen y la cobertura de NH<sub>3</sub> como estado: NOx<sub>sal</sub> = NOx<sub>ent</sub>/(1 + k·θ·V/q) por celda, adsorción y desorción de Langmuir con balance detallado (k<sub>a</sub> = K·k<sub>d</sub>·Ω), oxidación del NH<sub>3</sub> almacenado y la inercia térmica del lecho (τ = 45 s). El balance de nitrógeno <b>cierra del orden de 10⁻¹⁵</b> en ciclos completos (NOx y NH<sub>3</sub>), la forma cerrada (1 + kτ/N)<sup>−N</sup> se reproduce con θ = 1, y el estado estacionario por bisección coincide con integrar el tiempo. El reto exige NOx ≤ 0,65 g/kWh, amoníaco medio ≤ 10 ppm, cristales ≤ 20 mg y diésel extra ≤ 2,5 % a la vez; sólo cumplen el 1 % y el 2,6 % de las combinaciones de los dos escenarios. Se verifica con 149 comprobaciones.',
    noModela: 'el <b>NO<sub>2</sub></b> ni la reacción rápida, el <b>catalizador anti-deslizamiento</b>, la mezcla fluida y la película de urea, la <b>congelación</b> del AdBlue, el envejecimiento gradual ni la regeneración del filtro de partículas. La <b>capacidad de almacenamiento se redujo</b> unas diez veces para que se llene en minutos, y los ciclos de 5 min son <b>sintéticos</b>: no son WHTC ni WLTC y el límite del reto (0,65 g/kWh) es didáctico (el Euro VI pide 0,46 g/kWh en el WHTC). La curva de descomposición de la urea y las constantes cinéticas son <b>correlaciones didácticas</b>. El penacho de salida se exagera para poder leerse. No es CFD, FEM ni una certificación de emisiones.'
  },
  s6: [
    'ISO 22241, calidad y características del AdBlue (solución de urea al 32,5 %).',
    'Johnson, T. V., <i>Review of Diesel Emissions and Control</i>, SAE International Journal of Engines (revisiones anuales).',
    'Guzzella y Onder, <i>Introduction to Modeling and Control of Internal Combustion Engine Systems</i>, capítulo de postratamiento.',
    'Reglamento (UE) n.º 582/2011, Euro VI para vehículos pesados: límites de NOx (0,46 g/kWh) y de NH<sub>3</sub> (10 ppm de media en el WHTC).'
  ]
});
