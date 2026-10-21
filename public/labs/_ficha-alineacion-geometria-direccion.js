/* Ficha técnica · Geometría de dirección y alineación — contenido específico del lab */
fichaTecnica({
  title: 'Geometría de dirección y alineación',
  intro: 'Este laboratorio representa el <b>eje delantero de un sedán</b> con dirección de cremallera: neumáticos con dibujo real, rines, discos, mangueta, brazos de dirección, bieletas, cremallera con fuelles, puntales MacPherson con resorte, brazos inferiores y subchasis. Lo que gira, se arrastra o se desgasta sale de un modelo calculado y verificado; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> el cuadrilátero articulado de la dirección (brazo, barra y cremallera) resuelto en forma cerrada por intersección de circunferencias, la ley de Ackermann exacta, el eje de pivote inclinado (avance y ángulo del pivote) y el neumático de cepillo con su par autoalineante. El 3D exagera la caída (×4) y, sólo en la vista de una rueda, la convergencia (×12) para que se vean.',
    omitidos: [
      '<b>Cinemática de la suspensión</b>: el recorrido vertical no cambia la caída ni la convergencia; sólo se mueve la dirección.',
      '<b>Elasticidad de bujes y barras</b>: todo el cuadrilátero se supone rígido y sin holguras.',
      '<b>Neumático real</b>: el modelo de cepillo no incluye relajación, histéresis ni la variación de la rigidez con la presión.',
      '<b>Asistencia de dirección</b>: el esfuerzo se calcula en la cremallera, sin servo.',
      '<b>Carrocería real</b>: la carcasa translúcida sólo marca el volumen del vehículo.'
    ]
  },
  s2: {
    title: 'Especificaciones representativas y seguridad',
    warn: '⚠ Alinear un vehículo exige elevador o fosa con el vehículo <b>calzado</b> y la dirección bloqueada; un brazo o una rótula suelta pueden mover la rueda con el vehículo en el aire. Valores representativos, no del fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Batalla y vía', 'sedán', 'L = 2,70 m · t = 1,50 m'],
      ['Trapecio', 'brazo y barra de referencia', 'a = 140 mm · b = 399 mm'],
      ['Neumático', 'radio y rigidez de deriva', 'R = 0,317 m · C<sub>α</sub> = 55 000 N/rad'],
      ['Eje de pivote', 'avance y ángulo del pivote', 'ε = 5° · KPI = 8°'],
      ['Jeantaud sin afinar', 'a 30° interior', '70 % de Ackermann · error 1,66°'],
      ['Trapecio afinado', 'barra de 399 mm', 'error máximo ≈ 0,27°']
    ]
  },
  s3: [
    'Alineadora de cuatro cabezales o de cámaras, con lectura de caída, avance y convergencia.',
    'Platos giratorios para medir el avance y el ángulo del pivote al girar el volante.',
    'Bloqueador de volante y de pedal de freno, y llaves para la barra de acoplamiento.',
    'Elevador o fosa y herramientas de calado del vehículo.'
  ],
  s4: {
    intro: 'El orden del laboratorio (calcular, afinar el trapecio, diagnosticar el desgaste) es una <b>descomposición pedagógica</b>. Una alineación real añade:',
    items: [
      'Inspeccionar rótulas, bujes y terminales: la holgura falsea cualquier lectura de convergencia.',
      'Compensar el descentrado de los rines y centrar el volante antes de medir.',
      'Medir caída y avance con platos giratorios, y la convergencia con el vehículo asentado y a la altura de marcha.',
      'Ajustar primero el avance y la caída, y al final la convergencia, que es la que más desgasta.',
      'Probar en carretera: el volante debe regresar solo al centro y el vehículo no debe tirar a un lado.'
    ]
  },
  s5: {
    modela: 'la <b>ley de Ackermann</b> cot δ<sub>e</sub> − cot δ<sub>i</sub> = t/L; el <b>cuadrilátero</b> de la dirección por intersección de circunferencias; el <b>neumático de cepillo</b> con el par M = F·(t<sub>p</sub> + R<sub>w</sub>·tan ε); el cambio de caída al girar con el pivote inclinado (rotación de Rodrigues); el arrastre lateral en recta por convergencia y caída, con su óptimo interior; el esfuerzo en la cremallera por trabajos virtuales; y el deslizamiento cinemático que produce el error de Ackermann.',
    noModela: 'la <b>cinemática de la suspensión</b> con el recorrido, la elasticidad de bujes y terminales, la relajación y la histéresis del neumático, la asistencia de dirección, el balanceo y la transferencia de carga entre ejes. Los límites de error y de arrastre del reto son <b>didácticos</b>, no de un fabricante.'
  },
  s6: [
    'Gillespie, <i>Fundamentals of Vehicle Dynamics</i>.',
    'Milliken y Milliken, <i>Race Car Vehicle Dynamics</i>.',
    'Pacejka, <i>Tire and Vehicle Dynamics</i>.',
    'Reimpell, Stoll y Betzler, <i>The Automotive Chassis: Engineering Principles</i>.'
  ]
});
