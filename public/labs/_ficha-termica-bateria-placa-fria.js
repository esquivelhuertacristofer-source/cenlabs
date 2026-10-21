/* Ficha técnica · Gestión térmica de una batería de VE: placa fría y carga rápida — contenido específico del lab */
fichaTecnica({
  title: 'Gestión térmica de una batería de VE: placa fría y carga rápida',
  intro: 'Este laboratorio representa <b>un módulo de 12 celdas</b> de una batería de coche eléctrico en tres filas escalonadas, cada fila sobre su tramo de <b>placa fría</b> líquida: el tubo serpenteante con agua y glicol, la bomba, el enfriador (chiller) y el cargador rápido. La carga de 10 a 80 % calienta cada celda (I²R más calor entrópico); el líquido se lleva el calor y el sistema de gestión de la batería (BMS) recorta la corriente si las celdas salen de su ventana de temperatura. Todo lo que se mueve o se colorea sale de un modelo con balance de energía que cierra al redondeo; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> las 12 celdas con su color por temperatura, las almohadillas térmicas que brillan con el calor que pasa a la placa, el tubo del líquido (color y partículas según su temperatura en cada punto), la bomba con su rodete, el enfriador con su ventilador, el cargador con la corriente que entra por las barras de cobre y el calor que sube de cada celda. Los extremos del módulo llevan además el calor de la barra de cobre. Las gráficas del dock salen del mismo estado y del mismo reloj que la escena.',
    omitidos: [
      '<b>El interior de la celda</b> (electrodos, separador, núcleo y superficie a distinta temperatura): cada celda tiene una sola temperatura.',
      '<b>El resto del paquete</b>: aquí hay un módulo y un circuito de refrigeración propio; la batería real tiene decenas de módulos, colectores y válvulas.',
      '<b>El aire de la cabina, la bomba de calor del coche y su climatización</b>, que es otro laboratorio.',
      '<b>La aceleración térmica (thermal runaway)</b>: ocurre mucho más allá de 60 °C y sólo se menciona; no se modela ni se simula.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Una batería de tracción de <b>400 V</b> es peligrosa: puede matar por descarga y por incendio. Sólo personal cualificado la desconecta o repara, con el procedimiento y el equipo aislado del fabricante. Los valores de este laboratorio son didácticos, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Celda prismática', 'capacidad · masa · calor específico', '80 A·h · 1,2 kg · 950 J/(kg·K) → 1 140 J/K'],
      ['Resistencia interna', 'a 25 °C · sensibilidad a la temperatura', '1,2 mΩ · Arrhenius, B = 3 000 K'],
      ['Barra de cobre', 'sólo en las celdas 1 y 12', '0,25 mΩ'],
      ['Calor entrópico', 'dU/dT (constante, didáctico)', '−0,10 mV/K'],
      ['Placa fría', 'canal · longitud · diámetro hidráulico', '12 × 4 mm · 1,6 m · 6 mm'],
      ['Celda → placa', 'resistencia térmica (almohadilla + conducción)', '0,30 K/W'],
      ['Líquido', 'agua-glicol 50/50 a 25 °C', 'ρ = 1 075 kg/m³ · cp = 3 300 J/(kg·K) · μ = 3,8 mPa·s'],
      ['Bomba', 'rendimiento · pérdidas singulares', '30 % · K = 4'],
      ['Carga rápida', 'de 10 a 80 % · corriente máxima', '3C = 240 A hasta el 50 %; después baja a 0,25 de ese valor'],
      ['Límites de temperatura', 'zona buena · recorte por calor · recorte por frío', '15 a 35 °C · desde 40 °C (cero a 50) · bajo 15 °C (cero a 0)'],
      ['Reto', 'celda más caliente · diferencia entre celdas · celda más fría', '≤ 40 °C · ≤ 3,5 °C · ≥ 15 °C, y tiempo ≤ 104 % del ideal']
    ]
  },
  s3: [
    'Pinza amperimétrica de CC y multímetro de categoría adecuada para medir la corriente de carga y la tensión del módulo.',
    'Termopares o sondas NTC pegados a las celdas (o los de serie del BMS) para registrar la temperatura de cada una durante la carga.',
    'Caudalímetro y sondas de temperatura en la entrada y la salida de la placa fría para calcular el calor que se lleva el líquido (ṁ·cp·ΔT).',
    'Cámara termográfica para ver la distribución de temperatura del módulo, y manómetros para la caída de presión de la placa.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. Un diagnóstico real de la gestión térmica de una batería añade:',
    items: [
      'Leer los códigos del BMS y comparar las temperaturas de todas las celdas, no sólo el máximo: una celda aislada más caliente apunta a un mal contacto.',
      'Comprobar el nivel, la mezcla (glicol), el aire atrapado y el caudal del circuito antes de culpar al enfriador.',
      'Medir la diferencia de temperatura entre la entrada y la salida de la placa y compararla con el calor esperado.',
      'Revisar las almohadillas térmicas, las barras de cobre y los conectores con la batería desconectada y con el procedimiento del fabricante.'
    ]
  },
  s5: {
    modela: 'una <b>celda por temperatura</b> con masa térmica concentrada (C·dT/dt = q − Q + conducción entre vecinas); el calor q = I²R(T, SOC) + I·T·dU/dT con R de Arrhenius; la <b>resistencia térmica en serie</b> celda → placa → líquido; el líquido por el <b>método ε-NTU</b> tramo a tramo con propiedades que cambian con la temperatura; el número de Nusselt y el factor de fricción <b>laminar, de transición y turbulento</b> (Gnielinski y Petukhov), la caída de presión y la potencia de la bomba; el recorte de corriente por temperatura (frío y calor) y el perfil de carga; y el enfriador con un rendimiento del 35 % del de Carnot (o un calentador PTC si el líquido debe calentar). El balance de calor de toda la carga cierra con un residuo del orden de 10⁻¹⁴, y la solución estacionaria y la respuesta de una celda coinciden con sus formas cerradas. El reto pide cargar a tiempo, sin pasar de 40 °C ni 3,5 °C de diferencia entre celdas ni bajar de 15 °C, y compara el gasto de enfriar (bomba más enfriador) con el mínimo hallado por barrido y refinamiento, con una tolerancia de 20 %.',
    noModela: 'el <b>interior de la celda</b> (gradiente núcleo-superficie), la <b>conducción en la propia placa</b> (cada tramo del canal enfría su celda), el <b>envejecimiento</b> y la dispersión de capacidad entre celdas, el <b>plating de litio</b> como proceso (sólo se recorta la corriente por debajo de 15 °C), el <b>intercambio con el ambiente</b> y la aceleración térmica (thermal runaway), que sólo se menciona. Las propiedades del líquido son aproximaciones de tabla, los coeficientes del enfriador y los límites del BMS son <b>correlaciones didácticas</b>, y los números son de un módulo, no de un paquete. No es CFD, FEM ni una certificación.'
  },
  s6: [
    'Bergman, Lavine, Incropera y DeWitt, <i>Fundamentals of Heat and Mass Transfer</i>: flujo en ductos, método ε-NTU.',
    'Gnielinski, <i>VDI Heat Atlas</i> (G1), correlación de Nusselt en flujo turbulento y transición.',
    'Bernardi, Pawlikowski y Newman (1985), generación de calor en celdas de litio: calor irreversible y entrópico.',
    'Waldmann et al., <i>Journal of Power Sources</i> 262 (2014), plating de litio a baja temperatura.',
    'Plett, <i>Battery Management Systems</i>, modelo de celda de resistencia en serie.'
  ]
});
