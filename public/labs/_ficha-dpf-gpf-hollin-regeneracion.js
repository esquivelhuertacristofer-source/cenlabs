/* Ficha técnica · Filtro de partículas (DPF/GPF): hollín, contrapresión y regeneración — contenido específico del lab */
fichaTecnica({
  title: 'Filtro de partículas (DPF/GPF): hollín, contrapresión y regeneración',
  intro: 'Este laboratorio muestra la <b>línea de escape de un diésel con su filtro de partículas</b> (DPF; el GPF de los motores de gasolina funciona igual): el motor que suelta hollín, el catalizador de oxidación (DOC) que calienta y prepara el gas, y el filtro de pared de cordierita dividido en ocho celdas axiales, dibujado en sección. El hollín se acumula como una <b>torta</b> en las paredes de los canales, sube la contrapresión y, al quemarlo (<b>regeneración</b>), se libera calor. Todo lo que se mueve y se colorea sale de un modelo con balance de carbono y de energía cerrado; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el motor de 120 kW con su mapa de hollín, caudal y temperatura de gas; el filtro de 6,52 L (cordierita, 200 cpsi, pared de 12 mil) con 4418 canales de entrada y 6,02 m² de área filtrante; la <b>caída de presión</b> como suma de canales (Poiseuille, estrechados por la torta), entrada y salida, pared (Darcy con obstrucción en profundidad) y torta (Darcy); la <b>ceniza</b> que no se quema y quita área útil; la oxidación del hollín con O<sub>2</sub> y con NO<sub>2</sub> por cinética de primer orden de Arrhenius; la <b>regeneración activa</b> con post-inyección de diésel (la temperatura objetivo y el combustible extra) y la <b>pasiva</b> de carretera; la inercia térmica de cada celda y el calor del propio hollín (32,76 kJ por gramo); y la prueba de peor caso: una parada en ralentí en plena quema.',
    omitidos: [
      '<b>La distribución real del hollín dentro del canal</b>: el modelo usa una torta media por celda para el cálculo de ΔP y la dibuja en 22 franjas.',
      '<b>El flujo tridimensional, la mala distribución del gas y los gradientes radiales</b> del filtro: es un modelo axial unidimensional.',
      '<b>La combustión de hidrocarburos adsorbidos (SOF) y el cracking térmico de la torta</b>, y la fusión o grieta gradual de la cordierita: la grieta del diagnóstico es un solo factor de fuga.',
      '<b>La ceniza que se quema o se sinteriza</b>: se trata como masa inerte que sólo reduce el área filtrante.',
      '<b>El GPF de gasolina con sus propias cargas y la regeneración por corte de inyección</b>: se explica la idea, pero los números son del diésel.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Una regeneración descontrolada puede <b>fundir o agrietar el sustrato</b> (la cordierita se reblandece hacia 1 200 °C y se funde cerca de 1 400 °C) y el escape está a cientos de grados: nunca se manipula caliente. Los valores son didácticos, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Filtro', 'volumen · celdas axiales · área filtrante', '6,52 L · 8 · 6,02 m²'],
      ['Panal', 'cordierita 200 cpsi · pared · canales de entrada', '12 mil · 4 418 canales de a = 1,491 mm'],
      ['Motor diésel', 'potencia · rendimiento · poder calorífico', '120 kW · 0,40 · 35,9 MJ/kg'],
      ['Contrapresión a plena carga', 'filtro limpio · con 4 g/L · con 8 g/L', '6,61 kPa · 11,10 kPa · 14,55 kPa'],
      ['Con ceniza', '8 g/L de hollín y 4 g/L de ceniza (≈ 100 000 km)', '16,71 kPa'],
      ['Calor del hollín', 'por gramo oxidado · salto adiabático en una celda de 313 J/K', '32,76 kJ/g · 105 K'],
      ['Cinética con O<sub>2</sub>', 'energía de activación · k a 600 °C y 10 % de O<sub>2</sub>', '150 kJ/mol · 1,5·10⁻³ s⁻¹'],
      ['Cinética con NO<sub>2</sub>', 'energía de activación · fracción de NO<sub>2</sub> máxima', '55 kJ/mol · ≈ 0,55 hacia 330 °C'],
      ['Regeneración pasiva', 'en carretera: equilibrio hollín formado = quemado', '≈ 2,98 g/L'],
      ['Quema activa de ejemplo', '4 g/L a 640 °C con carga 0,25', '10,5 min · 0,54 L de diésel extra'],
      ['Peor caso', 'parada en ralentí en plena quema desde 6 g/L a 660 °C', '≈ 1 089 °C en el sustrato'],
      ['Ventana del reto', 'umbral de carga · temperatura de quema', '≈ 2,5 a 5 g/L · ≈ 630 a 680 °C']
    ]
  },
  s3: [
    'Escáner del vehículo para leer la presión diferencial del filtro, la temperatura antes y después, el nivel de hollín calculado y el kilometraje desde la última regeneración.',
    'Manómetro o sensor de presión diferencial con sus dos mangueras: una manguera suelta o tapada falsea la lectura.',
    'Endoscopio por el orificio del sensor de temperatura para mirar la cara del filtro, y báscula para pesar el filtro (limpio contra cargado).',
    'Banco de limpieza o de soplado y horno de calcinado de ceniza, sólo en taller con el filtro desmontado y frío.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. El diagnóstico real de un filtro de partículas añade:',
    items: [
      'Leer los códigos de presión diferencial alta o baja y el historial de regeneraciones interrumpidas por viajes cortos.',
      'Comprobar la presión diferencial con el motor a un régimen fijo y compararla con la de un filtro limpio: un valor bajo indica un filtro roto o vaciado, uno alto indica hollín o ceniza.',
      'Verificar las tomas de presión y las mangueras antes de condenar el filtro, y la dilución de aceite por combustible en el cárter tras regeneraciones fallidas.',
      'Revisar la causa que llenó el filtro (inyector, turbo, EGR, aceite con demasiadas cenizas) antes de limpiar o cambiar la pieza.'
    ]
  },
  s5: {
    modela: 'una <b>cadena de ocho celdas en serie</b> con el hollín de cada celda como estado: dm/dt = −k(T)·m por celda con k = k<sub>O2</sub> + k<sub>NO2</sub> en forma de Arrhenius, balance de energía implícito aguas abajo (C·dT/dt = G·(T<sub>i−1</sub> − T<sub>i</sub>) + Q − (UA/N)·(T − T<sub>amb</sub>)) y caída de presión por suma de canales, entrada/salida, pared y torta. El balance de carbono cierra del orden de 10⁻¹² y el de energía por debajo de 10⁻¹⁰ en las pruebas de la verificación, y el modelo reproduce que al ralentí el pico térmico supera al de plena carga, que un umbral bajo cuesta más combustible y uno alto sube la contrapresión.',
    noModela: 'la <b>distribución real</b> del hollín en el canal, el <b>flujo tridimensional</b>, la fusión o la grieta gradual del sustrato (el límite de 900 °C del reto es <b>didáctico</b>, muy por debajo de la fusión real), la ceniza que se sinteriza, ni el GPF de gasolina. El ΔP usa un <b>hollín medio</b> por celda y el esquema dibuja sólo 22 canales. Los perfiles de 6 h (ciudad, mixto con 100 000 km de ceniza y carretera) son <b>sintéticos</b>: no son WHTC ni WLTC, y el modelo <b>no es CFD ni sirve para homologar</b> un filtro. Las constantes cinéticas y los criterios del reto son <b>correlaciones didácticas</b>, no datos de un fabricante.'
  },
  s6: [
    'Konstandopoulos, A. G. y Johnson, J. H., <i>Wall-Flow Diesel Particulate Filters: Their Pressure Drop and Collection Efficiency</i>, SAE 890405.',
    'Johnson, T. V., <i>Review of Diesel Emissions and Control</i>, SAE International Journal of Engines (revisiones anuales).',
    'Guzzella y Onder, <i>Introduction to Modeling and Control of Internal Combustion Engine Systems</i>, capítulo de postratamiento.',
    'Reglamento (UE) n.º 582/2011, Euro VI para vehículos pesados: límite de número de partículas y requisitos del filtro.'
  ]
});
