/* Ficha técnica · ADAS: radar, cámara y frenado autónomo de emergencia (AEB) — contenido específico del lab */
fichaTecnica({
  title: 'ADAS: radar, cámara y frenado autónomo de emergencia (AEB)',
  intro: 'Este laboratorio representa un <b>turismo con radar y cámara frontales</b> que se acerca a un paso de peatones mientras un peatón camina hacia la calzada. Lo que se mueve, se enciende y se dibuja sale de un modelo calculado y verificado: un radar con ruido, un <b>filtro alfa-beta</b> que estima distancia y velocidad de cierre, el <b>tiempo hasta la colisión</b> (TTC) y un freno con latencia y rampa. Es un modelo didáctico, no un sistema homologado.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> cinemática longitudinal exacta por tramos, adherencia μ de la calzada, <b>latencia del freno</b> (0,12 s) y <b>rampa de presión</b> (60 m/s³), radar a 20 Hz con ruido gaussiano de 0,25 m y cono de ±25° hasta 80 m, cámara de ±35° hasta 50 m que confirma al peatón tras tres fotogramas, <b>filtro alfa-beta de Benedict–Bordner</b>, TTC y deceleración requerida, tres etapas (aviso, freno parcial a 4 m/s², freno total a μg) con un umbral de TTC, predicción de si el peatón estará en el carril cuando el coche llegue, y velocidad de impacto exacta si no se evita el choque. En el dibujo: coche con sensores, maniquí con ciclo de marcha, haces del radar y de la cámara, objetivo fijado, banda de la distancia de parada y marcas de distancia.',
    omitidos: [
      '<b>Fusión real de sensores</b> (filtro de Kalman, asociación de datos, varios objetivos, clasificación por red neuronal): aquí hay un objetivo y una confirmación por conteo de fotogramas.',
      '<b>Ruido y fallos de la cámara</b> (deslumbramiento, lluvia, oscuridad) y <b>reflexiones múltiples</b> del radar. La posición lateral del peatón se supone medida sin ruido.',
      '<b>Dirección y esquiva</b>: sólo se frena en línea recta. No hay asistente de dirección de emergencia.',
      '<b>Modulador hidráulico del ABS</b>, reparto de frenada, transferencia de carga, calentamiento de frenos y desgaste del neumático: la deceleración máxima es μg.',
      '<b>Lesiones y deformación</b>: el choque no se simula; sólo se calcula la velocidad de impacto. La caída del peatón es ilustrativa.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos. Los umbrales de TTC y las distancias de los escenarios del reto pertenecen a ESTE modelo y a ESTE controlador; no son leyes ni valores de un producto comercial.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Periodo del radar · ruido en distancia', 'sensor de 77 GHz didáctico', '50 ms (20 Hz) · σ = 0,25 m'],
      ['Cono del radar · alcance', 'semiángulo · distancia máxima', '±25° · 80 m'],
      ['Campo de la cámara · alcance', 'semiángulo · distancia máxima', '±35° · 50 m'],
      ['Latencia del freno · rampa', 'orden → presión · subida de la deceleración', '0,12 s · 60 m/s³'],
      ['Freno parcial · freno total', 'etapas 2 y 3 del AEB', '4,0 m/s² · μg'],
      ['Etapas con el umbral T<sub>u</sub>', 'aviso · parcial · total', 'TTC ≤ 1,5·T<sub>u</sub> · T<sub>u</sub> · 0,65·T<sub>u</sub>'],
      ['Adherencia μ de frenado', 'seco · mojado · nieve · hielo', '0,80 · 0,55 · 0,25 · 0,12'],
      ['Peatón del reto', 'velocidad lateral · distancia inicial al carril', '1 m/s (3,6 km/h) · 3,2 m'],
      ['Semianchura del corredor', 'mitad del coche + radio del peatón', '1,2 m']
    ]
  },
  s3: [
    'En un ensayo real: <b>pista cerrada</b> con un <b>maniquí articulado</b> (Euro NCAP «Pedestrian Target») sobre un carro que lo mueve, y un conductor robot o de pruebas que no interviene.',
    'Instrumentación: GNSS diferencial (RTK) en coche y objetivo, medida de velocidad y distancia con precisión de centímetros y un registrador sincronizado del bus CAN del vehículo.',
    'Repetir el ensayo varias veces por cada velocidad: el resultado depende de la posición lateral del maniquí, de la luz y de la temperatura.',
    'Nunca se prueba con personas ni en vía pública.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre el compromiso entre frenar a tiempo y no frenar en falso; el ensayo real sigue otros pasos:',
    items: [
      '<b>Euro NCAP AEB VRU</b> (peatón adulto y niño que cruzan, y que caminan por el borde): se mide la velocidad a la que el coche evita el choque o la reduce en un porcentaje.',
      '<b>UN R152</b> (sistemas de frenado de emergencia avanzados para turismos): el sistema debe evitar la colisión o reducir su velocidad con coches parados y en movimiento.',
      '<b>Pruebas de falso positivo</b>: pasar bajo señales elevadas, junto a vallas y con peatones que se detienen, y comprobar que el AEB no actúa.',
      'Registrar la distancia y el TTC en el instante del aviso y del primer frenado, y la deceleración alcanzada.'
    ]
  },
  s5: {
    modela: 'un <b>modelo longitudinal</b> con integración exacta por tramos (deceleración con rampa lineal y después constante), latencia de 0,12 s y adherencia μ; un <b>radar</b> a 20 Hz con ruido gaussiano; un <b>filtro alfa-beta de Benedict–Bordner</b> (β = α²/(2−α)) que sigue una rampa sin error y deja un retardo (1−α)·a·T²/β con aceleración constante, con una reducción de varianza del ruido según Brookner; el <b>TTC</b> = d/v, la deceleración requerida v²/(2d), la <b>distancia de parada</b> v·(τ + T<sub>r</sub>/2) + v²/(2μg) − μg·T<sub>r</sub>²/24 y la <b>velocidad de impacto</b> √(v² − 2a·(d − v·τ)); y un AEB de tres etapas con umbral de TTC. La verificación comprueba el filtro (polos, rampa, aceleración, varianza), la distancia de parada y la velocidad de impacto contra las soluciones cerradas, la energía y los escenarios del reto con varias semillas de ruido.',
    noModela: 'la fusión real radar-cámara, varios objetivos, la clasificación, el ruido de la cámara y de la posición lateral, la esquiva, el ABS, la transferencia de carga ni las lesiones. <b>No es una simulación certificada ni un producto comercial</b>: la ventana de umbrales que resuelve el reto pertenece a ESTOS escenarios, ESTE ruido y ESTE controlador, y no es una ley. El freno parcial y total, y los factores 1,5 y 0,65 de las etapas, son decisiones de diseño didácticas. La caída del peatón y el cabeceo del coche son ilustrativos.'
  },
  s6: [
    '<b>Euro NCAP</b>: protocolos AEB Car-to-Car y AEB VRU (usuarios vulnerables de la vía).',
    '<b>UN R152</b>: sistemas de frenado de emergencia avanzados (AEBS) para vehículos M1 y N1. <b>FMVSS 127</b> (EE. UU.): frenado automático de emergencia.',
    '<b>ISO 22839</b>: sistemas de mitigación de colisión frontal. <b>ISO 15623</b>: aviso de colisión frontal.',
    'Bar-Shalom, Li y Kirubarajan, <i>Estimation with Applications to Tracking and Navigation</i>; Brookner, <i>Tracking and Kalman Filtering Made Easy</i> (filtro alfa-beta).',
    'Gillespie, <i>Fundamentals of Vehicle Dynamics</i> (distancia de frenado y adherencia).'
  ]
});
