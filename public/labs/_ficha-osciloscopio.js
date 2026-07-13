/* Ficha técnica · Osciloscopio digital — contenido específico del lab */
fichaTecnica({
  title: 'Osciloscopio digital — ver la señal, no solo medirla',
  intro: 'El multímetro da un número; el <b>osciloscopio</b> deja ver la forma de la señal contra el tiempo. Este laboratorio recorre <b>cuatro casos</b> con un osciloscopio de 2 canales: leer correctamente base de tiempo y volts/div (Vpp, V_rms, f), elegir acoplamiento (AC/DC/GND), configurar el disparo (Auto/Normal/Single) y medir el desfase entre dos canales por cruces por cero. Ninguno es un dato que el instrumento "adivine" — los cuatro dependen de que el operador configure el equipo antes de confiar en la lectura.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> osciloscopio digital de 2 canales con pantalla de 10 × 8 divisiones renderizada en tiempo real, 2 entradas BNC (CH1 amarillo, CH2 cian), perillas de base de tiempo, volts/div de CH1 y nivel de disparo (funcionales) y volts/div de CH2 (decorativa), LED indicador de disparo, generador de funciones con 2 terminales de salida, y el cableado que conecta ambos.',
    omitidos: [
      '<b>Sondas atenuadas 10:1 con compensación ajustable</b>: aquí la señal llega por cable BNC directo; la sonda 10:1 y su ajuste de compensación son el objeto de estudio de la práctica siguiente (sonda atenuada).',
      '<b>Ancho de banda y tiempo de subida del instrumento</b>: el modelo responde igual de plano a cualquier frecuencia usada en el lab; un osciloscopio real atenúa (roll-off) cerca de su ancho de banda nominal.',
      '<b>Muestreo digital y aliasing</b>: la traza se calcula como función matemática continua, no como muestras discretas de un ADC — no se reproduce el aliasing por sub-muestreo de un caso real.',
      '<b>Resolución vertical del ADC</b>: la traza es continua; un osciloscopio real cuantiza la señal en escalones (típicamente 8 bits en equipos de gama de entrada).',
      '<b>Ruido de fondo y jitter de disparo</b>: la traza y el instante de disparo aquí son deterministas; un instrumento real añade ruido propio y variación en el punto exacto donde dispara.',
      '<b>Flanco de disparo y modos avanzados</b>: el modelo dispara siempre por flanco ascendente; no incluye flanco descendente, disparo por ancho de pulso ni disparo de video.',
      'Análisis FFT/espectral, cursores de medición manual, memoria de formas de onda y funciones de persistencia o promediado de múltiples capturas.'
    ]
  },
  s2: {
    title: 'Parámetros usados por el modelo',
    warn: 'Valores <b>representativos</b> de un osciloscopio digital de 2 canales de gama de entrada — no de una marca/modelo específico. Para trabajo real, usa la hoja de datos de <b>tu</b> instrumento: ancho de banda, tasa de muestreo y presupuesto de exactitud varían por fabricante.',
    rows: [
      ['Parámetro', 'Valor usado en el lab', 'Nota'],
      ['Cuadrícula de pantalla', '10 × 8 divisiones', 'estándar de facto en osciloscopios digitales'],
      ['Base de tiempo (time/div)', '50 µs · 500 µs · 5 ms según caso', 'ilustra sub-barrido, lectura correcta y sobre-barrido'],
      ['Sensibilidad vertical CH1 (volts/div)', '0.2 V · 1 V · 5 V según caso', 'recorta (clipping) la traza si es demasiado chica'],
      ['Corte del filtro de acoplamiento AC', '5–10 Hz (rango típico)', 'varía por fabricante/modelo, no es cifra única'],
      ['Señal de prueba', '200 Hz – 500 Hz, senoidal', 'generador de funciones simulado']
    ]
  },
  s3: [
    'Puntas de osciloscopio atenuadas 10:1 (o 1:1 según el caso), con la compensación verificada antes de medir.',
    'Cable BNC-BNC o BNC-caimán de bajo ruido para señales de referencia o calibración.',
    'Generador de funciones o señal patrón de frecuencia conocida para verificar la lectura antes de confiar en el instrumento.',
    'Manual del fabricante del osciloscopio, con su ancho de banda, tasa de muestreo y presupuesto de exactitud reales.'
  ],
  s4: {
    intro: 'Ver una traza en pantalla no es lo mismo que leerla correctamente. Un procedimiento real añade:',
    items: [
      'Ajustar time/div y volts/div ANTES de confiar en cualquier lectura: la pantalla debe mostrar de 2 a 5 ciclos completos, sin recortarse arriba/abajo ni comprimirse en una línea.',
      'Elegir el acoplamiento según qué se quiere ver: DC para el nivel completo (incluida la componente de CD), AC para aislar el rizo o variación sobre una CD grande, GND solo como referencia de 0 V — nunca para medir.',
      'Configurar el disparo según la señal: Auto para confirmar presencia de señal o verla aunque no dispare, Normal para estabilidad en señales periódicas, Single para capturar un evento único o transitorio antes de que se pierda.',
      'Verificar la compensación de las puntas antes de comparar fase entre canales: una punta mal compensada distorsiona el frente de la señal e introduce un desfase que se confunde con desfase real de la fuente.',
      'Registrar V/div, t/div, acoplamiento y ancho de banda del instrumento junto con cualquier lectura — el número solo, sin ese contexto, no es reproducible.'
    ]
  },
  s5: {
    modela: 'la relación Vpp = 2 × V_pico y V_rms = V_pico × 0.707 de una onda senoidal, la lectura de f = 1/T por conteo directo de divisiones en pantalla, el recorte (clipping) cuando volts/div es demasiado pequeño para la amplitud de la señal, el acoplamiento DC (señal completa), AC (filtro paso-alto que retira la CD, corte típico 5–10 Hz) y GND (referencia de 0 V, sin señal), los 3 modos de disparo — Auto, Normal y Single — con su máquina de estados de armado/captura y qué ocurre cuando el nivel de disparo cae fuera del rango de la señal, y la medición de desfase entre 2 canales por el método de cruces por cero (Δφ° = 360° × Δt/T).',
    noModela: 'el ancho de banda real del instrumento ni su punto −3 dB en alta frecuencia, el muestreo digital ni el aliasing por sub-muestreo, la resolución de cuantización vertical del ADC, el ruido de fondo ni el jitter de disparo, la curva de atenuación exacta del filtro de acoplamiento AC (aquí se simplifica como remoción limpia de la CD), las sondas atenuadas 10:1 con su ajuste de compensación (se estudian en la práctica siguiente), la selección de flanco de disparo ni los modos avanzados (ancho de pulso, video), el análisis FFT/espectral, ni modelos comerciales específicos.'
  },
  s6: [
    '<b>IEC 61010-2-030</b> Ed. 3.0:2023-09-20: requisitos particulares de seguridad para circuitos de prueba y medición — aplica a osciloscopios y multímetros usados para medir circuitos activos.',
    '<b>IEC 61010-1</b>: requisitos generales de seguridad y categorías de medición CAT II–IV (ya ancla en las prácticas de multímetro y pinza de este dominio).',
    '<b>IEEE 1057</b>: marco voluntario de referencia para especificar y comparar digitalizadores de forma de onda — no es una norma de exactitud de cumplimiento obligatorio.',
    '<b>IEC 61010-031</b>: requisitos particulares de seguridad para sondas de medición manuales — se reserva para la práctica siguiente, donde la sonda atenuada 10:1 es el objeto de estudio explícito.',
    'Hojas de datos de osciloscopios digitales de gama de entrada (Tektronix TBS1000C, Keysight, Rigol, Siglent) para verificar terminología, controles (V/div, t/div, acoplamiento, disparo) y estructura general 1:1.'
  ]
});
