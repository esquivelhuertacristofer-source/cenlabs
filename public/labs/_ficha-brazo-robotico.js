/* Ficha técnica · Brazo robótico de 4 ejes — contenido específico del lab */
fichaTecnica({
  title: 'Brazo robótico de 4 ejes',
  intro: 'Un <b>manipulador serial de cuatro ejes rotativos</b> de banco (RRRR), con su celda de pick &amp; place. La <b>cinemática es exacta</b> —tabla de Denavit–Hartenberg, inversa analítica, envolvente y trayectorias PTP/LIN se calculan, no se animan—; la mecánica es <b>didáctica</b>: donde el 3D simplifica, aquí se dice.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> pedestal fundido con el motor del eje 1 y su piñón de 12 dientes contra la corona de 64 de la torreta (i = 64/12 ≈ 5,33); módulos de articulación en los ejes 2, 3 y 4 (servomotor con encoder, reductor en carcasa torneada y LED de estado); brazo y antebrazo fundidos con aligeramientos y horquillas; brida de herramienta ISO 9409-1 (4 × M5) y pinza paralela de dos dedos; mazo de cables con un bucle de holgura en cada articulación; mesa de ranuras en T, nido, palé, pieza de 30 mm y bandeja de ensamble de espuma. Cotas: d1 = 140 mm, L1 = 190 mm, L2 = 130 mm, herramienta 75 mm.',
    omitidos: [
      'El <b>interior de los reductores</b> (onda de deformación o cicloidal): se dibuja la carcasa; no hay holgura ni rigidez torsional.',
      'Los <b>frenos de eje</b>: al cortar la potencia, el robot no cae.',
      'El <b>controlador y su armario</b>: el programa se lee en la consola del dock.',
      'El <b>vallado y la cortina de luz</b>; la seta de emergencia está, pero no actúa.',
      'El <b>peso propio</b> de los eslabones en la estática (igual que en los retos).'
    ]
  },
  s2: {
    title: 'Parámetros del modelo',
    warn: '⚠ Robot <b>didáctico</b> (CEN R4-320): cotas, topes y velocidades coherentes entre sí, no los de un fabricante concreto.',
    rows: [
      ['Elemento', 'Detalle', 'Valor'],
      ['Tabla DH (θ, d, a, α)', 'convenio clásico', '(q1, 140, 0, 90°) · (q2, 0, 190, 0) · (q3, 0, 130, 0) · (q4, 0, 75, 0)'],
      ['Topes articulares', 'ejes 1 a 4', '±135° · −25…115° · −145…45° · ±120°'],
      ['Velocidad máxima', 'ejes 1 a 4', '225 · 150 · 180 · 240 °/s'],
      ['Velocidad LIN', 'la del pick &amp; place', '100 mm/s'],
      ['Transmisión del eje 1', 'corona / piñón, módulo 2', '64 / 12 dientes, a 76 mm'],
      ['Brida de herramienta', 'ISO 9409-1', '4 × M5 sobre Ø 31,5 mm'],
      ['Pinza', 'sujeción por rozamiento', 'μ = 0,45; 15 N por dedo (en la falla, 0,85 N)'],
      ['Pieza', 'cubo de aluminio', '30 mm · 73 g']
    ]
  },
  s3: [
    'Llaves Allen para la tornillería DIN 912 de los módulos y de la brida.',
    'Consola de programación y software del controlador (PTP, LIN, PINZA, ESPERA).',
    'Comparador o seguidor láser para verificar el TCP.',
    'Seta de emergencia y candado LOTO antes de entrar en la celda.'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una puesta en marcha real añade:',
    items: [
      'Anclaje y nivelación del pedestal, a par.',
      '<b>Referencia y mastering</b> de cada eje contra su sensor; aquí la búsqueda de referencia sólo lleva cada eje a su reposo, uno detrás de otro.',
      'Definición del <b>TCP</b> y de la carga de la herramienta.',
      'Evaluación de riesgos y zonas de seguridad (ISO 10218-2).'
    ]
  },
  s5: {
    modela: 'la <b>cinemática directa</b> con matrices homogéneas DH (⁰T₄ = A₁·A₂·A₃·A₄); la <b>inversa analítica</b> desacoplada (q1 = atan2(y, x), ley del coseno para el codo, codo arriba o abajo, topes articulares); la manipulabilidad |det J| = L1·L2·|sin q3|·|r<sub>w</sub>| y sus dos singularidades; la <b>envolvente exacta</b> del centro de la muñeca (seis tramos de borde, recortada por la mesa y barrida ±135°); la interpolación <b>PTP</b> sincronizada con ley de quinto grado y la <b>LIN</b> con la inversa resuelta en cada instante, estirada si un eje pasaría de su máximo e imposible si la recta sale del alcance; la estática del hombro con carga puntual (τ = m·g·r); la sujeción por rozamiento (m·|a − g| ≤ 2·μ·F) y la caída balística de la pieza; y tres fallas físicas: encoder del eje 1 corrido 9°, pinza sin fuerza y servo del hombro limitado al 80 % del par que pide la pieza.',
    noModela: 'la <b>dinámica</b> (inercias, pares de aceleración, peso propio de los eslabones), la curva par-velocidad de los motores, las holguras y la elasticidad de los reductores, el lazo de control real (el seguimiento es perfecto salvo en la falla de sobrecarga, que cede con un primer orden de 0,22 s y tiembla a 7,3 Hz por convención visual), las colisiones entre piezas y el giro de la pinza sobre su propio eje (un brazo de 4 ejes no lo tiene: la pieza se orienta con la base). La carga nominal de 0,5 kg es un dato didáctico.'
  },
  s6: [
    '<b>ISO 10218-1/-2</b>: seguridad de robots industriales.',
    '<b>ISO 9409-1</b>: bridas mecánicas de acople del efector.',
    '<b>ISO 9283</b>: criterios de desempeño (exactitud, repetibilidad, trayectorias). <b>ISO 9787</b>: sistemas de coordenadas.',
    'J. Denavit y R. S. Hartenberg (1955), «A kinematic notation for lower-pair mechanisms based on matrices», <i>J. Appl. Mech.</i> 22.',
    'J. J. Craig, <i>Introduction to Robotics</i>; B. Siciliano et al., <i>Robotics: Modelling, Planning and Control</i>.'
  ]
});
