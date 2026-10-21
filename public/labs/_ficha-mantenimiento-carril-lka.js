/* Ficha técnica · Mantenimiento de carril (LKA): el volante que se corrige solo — contenido específico del lab */
fichaTecnica({
  title: 'Mantenimiento de carril (LKA): el volante que se corrige solo',
  intro: 'Este laboratorio muestra, a escala real y desde atrás, cómo un coche mantiene su carril cuando una cámara ve las rayas y un <b>controlador</b> gira el volante por él. El coche es un <b>modelo lateral de bicicleta linealizado</b> respecto al centro del carril (desvío lateral, error de rumbo, velocidad lateral, velocidad de guiñada y ángulo de las ruedas); la curva de la carretera lo empuja como una perturbación y el controlador, un <b>PD</b> sobre lo que mide la cámara (con retardo y ruido) más una anticipación parcial de la curva, ordena el ángulo del volante a un actuador con retardo y topes. Todo lo que se mueve sale del modelo; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la dinámica lateral lineal del coche (m = 1 500 kg, I<sub>z</sub> = 2 500 kg·m², a = 1,2 m, b = 1,5 m, rigidez de deriva de 95 y 110 kN/rad por eje), con su gradiente de subviraje K = (m/L)(b/C<sub>f</sub> − a/C<sub>r</sub>) y su velocidad característica √(L/K); la vía (recta, clotoide de entrada, arco, clotoide de salida y recta) con la curvatura κ como perturbación en ψ̇ = r − v·κ; la <b>cámara</b> a ~33 imágenes por segundo con <b>retardo</b> (100 ms; 180 ms con lluvia) y ruido gaussiano de semilla fija (3 cm en el desvío, 0,3° en el rumbo); el controlador PD, u = −(P·e + D·v·ψ) más el 80 % del ángulo que la curva pide en régimen, calculado con la curvatura que la propia cámara estima (2 % de error); el <b>actuador</b> con retardo de primer orden (80 ms), tope de ±2° en las ruedas (±32° de volante) y velocidad máxima de giro; el <b>aviso de salida de carril</b> por TLC (distancia a la raya ÷ velocidad lateral, aviso por debajo de 1 s); y las métricas del reto: desvío máximo, vaivén en el tramo final, temblor del volante y TLC mínimo. Integración RK4 con paso fijo de 10 ms.',
    omitidos: [
      '<b>La no linealidad de los neumáticos</b>: la fuerza lateral se supone proporcional al ángulo de deriva (zona lineal). Con agua, hielo o más de ~0,4 g la saturación del neumático cambiaría todo; para eso está el laboratorio de dinámica lateral y ESC.',
      '<b>La velocidad variable</b>: el coche va a velocidad constante y el modelo se linealiza a esa velocidad; los efectos de acelerar o frenar en la curva no se tratan.',
      '<b>La visión por computadora</b>: la cámara ya entrega un desvío y un rumbo con su ruido y su retardo. No hay rayas gastadas, sombras ni cruces de vía.',
      '<b>El conductor</b>: no hay manos en el volante ni par de resistencia; el actuador obedece a la orden con su retardo y sus topes. Tampoco se modela la dirección asistida real (fricción, juego, relación variable).',
      '<b>Las pendientes, el viento lateral y el peralte</b>: la única perturbación es la curvatura de la vía.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Un controlador mal ajustado <b>no avisa</b> de que lo está: con la misma cámara, el mismo P y el mismo D puede ir perfecto a 60 km/h y zigzaguear a 130 km/h. Los valores de aquí son didácticos, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Vehículo', 'm · I<sub>z</sub> · a · b · L', '1 500 kg · 2 500 kg·m² · 1,2 m · 1,5 m · 2,7 m'],
      ['Neumáticos', 'rigidez de deriva por eje (delantero · trasero)', '95 000 · 110 000 N/rad (lineales)'],
      ['Subviraje', 'K · velocidad característica √(L/K)', '2,71·10⁻³ rad por m/s² · 113,6 km/h'],
      ['Carril', 'ancho · ancho del coche · margen a la raya', '3,50 m · 1,80 m · 0,85 m'],
      ['Cámara', 'imágenes · retardo · ruido (desvío · rumbo)', '33 Hz · 100 ms (180 ms con lluvia) · 3 cm · 0,3°'],
      ['Actuador', 'constante de tiempo · tope · velocidad máxima', '80 ms · ±2° en las ruedas (±32° de volante) · 0,15 rad/s'],
      ['Mandos del alumno', 'P · D · velocidad', '1 a 50 ° de volante por m · 1 a 50 ° por m/s · 40 a 140 km/h'],
      ['Anticipación de la curva', 'fracción del ángulo en régimen que la cámara adelanta', '80 % (en «Probar» se puede quitar)'],
      ['Escenarios', 'velocidad · radio de la curva · retardo', 'autopista 100 km/h, 420 m, 100 ms · carretera 80 km/h, 200 m, 100 ms · lluvia 90 km/h, 320 m, 180 ms'],
      ['El reto', 'cuatro condiciones a la vez', 'desvío ≤ 0,80 m · vaivén final ≤ 0,12 m · temblor del volante ≤ 35 °/s · TLC ≥ 1,0 s']
    ]
  },
  s3: [
    'Un registro (log) de un coche real con el desvío medido por un sistema de posición de precisión (RTK) y las rayas pintadas, para comparar lo que ve la cámara con la verdad.',
    'Pruebas en pista con el sistema entre 60 y 130 km/h, con distintos radios, y la medición del retardo real de la cámara y del actuador.',
    'La identificación de los parámetros del vehículo (masa, inercia, rigidez de los neumáticos) con maniobras de volante.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. La puesta a punto real de un sistema de mantenimiento de carril añade:',
    items: [
      'Programar las ganancias <b>según la velocidad</b> (<i>gain scheduling</i>): lo que funciona a 60 km/h no sirve a 130 km/h, como se ve en el recorrido.',
      'Medir el retardo y el ruido de la cámara en cada condición (lluvia, sol de frente, rayas gastadas) antes de fijar P y D.',
      'Limitar el empuje lateral que el sistema puede pedir (la norma ISO 11270 fija el orden de magnitud, del orden de 3 m/s²) y la rapidez del volante, y avisar al conductor cuando se llega al tope.',
      'Validar el aviso de salida de carril (ISO 17361) con maniobras reales, con el TLC como criterio, y la gestión de las manos fuera del volante.'
    ]
  },
  s5: {
    modela: 'el <b>modelo lateral de bicicleta lineal</b> con cinco estados (desvío, rumbo, velocidad lateral, guiñada y ángulo de las ruedas) integrado con RK4: coincide con la exponencial de matriz del lazo lineal con un error de 3·10⁻⁹ m en 15 s y converge con orden 4. En régimen, el ángulo que pide una curva es δ = (L + K·v²)·κ y la ganancia de guiñada r/δ = v/(L + K·v²), con su máximo en la velocidad característica (113,6 km/h); el subsistema lateral tiene la traza y el determinante de libro; el desvío estacionario de un PD sin integrador vale [−(1 − ff)·δ<sub>curva</sub> + K<sub>d</sub>·v<sub>y</sub>]/K<sub>p</sub>. A más velocidad el mismo giro de volante mueve el coche más rápido (a<sub>y</sub>/δ = v²/(L + K·v²)) y la curva empuja con v²: con P = 9 y D = 6 el desvío máximo pasa de 0,40 m a 60 km/h a 0,84 m a 130 km/h y el TLC mínimo de 3,3 s a 0,2 s. El retardo de la cámara resta estabilidad: con P = 14 y D = 5 el sistema es estable con 50 ms y zigzaguea con 180 ms. El reto exige cuatro condiciones a la vez y sólo las cumple el 10,9 % (autopista), el 10,0 % (carretera) y el 7,8 % (lluvia) de las combinaciones de la rejilla de 51 × 51; la ventana es interior en los dos mandos (autopista: P de 7 a 29 y D de 6 a 20 °/m). Se verifica con 155 comprobaciones.',
    noModela: 'la <b>saturación de los neumáticos</b>, la velocidad variable, la visión por computadora, el conductor, el peralte y la dirección asistida real. Los <b>escenarios son sintéticos</b> y el ruido es gaussiano y blanco (el de una cámara real tiene colas pesadas y correlación en el tiempo). El <b>dibujo</b> es a escala real, pero las ruedas delanteras se giran ×8 para que se noten, el balanceo del coche es ilustrativo y la huella dorada es la trayectoria del centro de gravedad. No es el sistema de un fabricante ni una homologación.'
  },
  s6: [
    'Rajamani, R., <i>Vehicle Dynamics and Control</i>, Springer, 2.ª ed., 2012 (cap. 2: modelo lateral de bicicleta y modelo de error respecto al carril).',
    'Pacejka, H. B., <i>Tire and Vehicle Dynamics</i>, Butterworth-Heinemann, 3.ª ed., 2012 (rigidez de deriva y gradiente de subviraje).',
    'ISO 11270, <i>Intelligent transport systems — Lane keeping assistance systems (LKAS)</i>.',
    'ISO 17361, <i>Intelligent transport systems — Lane departure warning systems</i> (aviso por tiempo hasta cruzar la raya).'
  ]
});
