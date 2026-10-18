/* Ficha técnica · Inversor trifásico (DC→AC) — contenido específico del lab */
fichaTecnica({
  title: 'Inversor trifásico (DC → AC)',
  intro: 'Este laboratorio representa el <b>inversor de tracción</b> de un coche eléctrico, cortado por la mitad sobre su motor: seis IGBT sintetizan corriente alterna a partir del <b>bus de continua de 350 V</b>. Lo que se mueve y se enciende sale de un modelo eléctrico calculado y verificado; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> módulo de potencia con seis IGBT y seis diodos de rueda libre sobre sustratos cerámicos (uno por rama) con sus hilos de unión, base con aletas de pasador bañadas por el refrigerante, placa fría, condensador de película del bus, barra laminada + / −, placa de control con excitadores de puerta aislados, barras de fase, sensor de corriente de efecto Hall, conector y cable de alta tensión, y el motor (estátor de 24 ranuras con su devanado trifásico, rotor de jaula de 28 barras, camisa de agua y bornes).',
    omitidos: [
      '<b>Circuito de precarga</b> del bus (resistencia + relé) y la resistencia de descarga.',
      '<b>Protección de desaturación</b>, snubbers e inductancias parásitas: no hay sobretensiones de conmutación.',
      '<b>Filtro EMI</b> y blindajes.',
      '<b>Sensor NTC</b> del módulo (la temperatura se calcula, no se mide), su tapa y el gel de silicona.',
      '<b>Resolver</b> del motor y el control vectorial de par: el índice m y la frecuencia son consignas abiertas.'
    ]
  },
  s2: {
    title: 'Especificaciones típicas y seguridad',
    warn: '⚠ El <b>bus DC guarda carga peligrosa</b> tras apagar: descargar y verificar 0 V antes de tocar. Valores representativos.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Tensión de bus DC', 'este lab · tracción en general', '350 V · 300–800 V'],
      ['Dispositivos', 'módulo de 650 V / 600 A', 'IGBT (Si) o MOSFET (SiC)'],
      ['Frecuencia de conmutación', 'PWM (SiC más alta)', '2–20 kHz'],
      ['Tiempo muerto', 'por rama', '0 a 4 µs'],
      ['Tope lineal de m', 'SPWM · SVPWM', '1 · 2/√3 ≈ 1,155'],
      ['Carga por fase', 'motor a deslizamiento fijo (3 %)', '0,40 Ω · 0,8 mH'],
      ['Térmica de un nodo', 'refrigerante a 65 °C · corte a 150 °C', 'R<sub>th</sub> 0,028 K/W · τ 3 s']
    ]
  },
  s3: [
    'Multímetro <b>Cat III/IV</b> y osciloscopio con <b>puntas diferenciales aisladas</b>.',
    'Sonda de corriente; fuente y carga de prueba.',
    'Cámara térmica y <b>descargador de bus</b> con verificación de 0 V.',
    'Guantes dieléctricos y EPP eléctrico.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una puesta en marcha real añade:',
    items: [
      '<b>Descargar el bus DC</b> y verificar 0 V antes de cualquier intervención.',
      'Revisar resistencias de compuerta y el aislamiento de excitadores; par en terminales de potencia.',
      'Interfaz térmica correcta en la placa fría y <b>precarga</b> antes del contactor principal.',
      'Verificar el <b>tiempo muerto</b> y arrancar con modulación reducida.'
    ]
  },
  s5: {
    modela: 'la <b>conmutación real</b> de las tres ramas: PWM de muestreo regular con pulsos centrados, en SPWM y en SVPWM (secuencia cero mín-máx); los <b>ocho vectores</b> V₀–V₇ con sus tiempos T₁, T₂ y T₀ en cada sector; el <b>tiempo muerto</b>, en el que la rama la fija el diodo según el signo de la corriente; la corriente <b>exacta</b> en régimen periódico de una carga R–L por fase; el <b>espectro exacto</b> de v<sub>ab</sub> y su THD (Parseval); las pérdidas de conducción y de conmutación escaladas de hoja de datos, y una térmica de un nodo con corte a 150 °C y rearme a 120 °C. Las tres fallas de la Fase 3 cambian el modelo: rama C sin conducción, fases a 48° en lugar de 120° y refrigeración degradada que dispara el corte térmico.',
    noModela: 'la mecánica del motor (gira a deslizamiento fijo: es su impedancia R–L), la relación V/f, el control vectorial de par, las inductancias parásitas y las sobretensiones de conmutación, la forma de la recuperación inversa del diodo (sólo su energía), la EMI ni la térmica distribuida: es un solo nodo y corre en tiempo real mientras lo eléctrico va a cámara lenta. Los puntos de corriente no van a escala de velocidad y el trazado del sustrato y de las barras es representativo.'
  },
  s6: [
    '<b>IEC 61800</b>: accionamientos eléctricos de potencia ajustable.',
    '<b>IEC 60146</b>: convertidores de semiconductores. <b>IEC 62477</b>: seguridad de convertidores.',
    '<b>IEEE 519</b>: armónicos. <b>NFPA 70E</b>: seguridad en trabajos eléctricos.',
    'Holmes y Lipo, <i>Pulse Width Modulation for Power Converters</i>; Mohan, Undeland y Robbins, <i>Power Electronics</i>.',
    'Infineon AN2008-03 (pérdidas del IGBT) y hojas de datos de módulos (Infineon / Semikron / Wolfspeed).'
  ]
});
