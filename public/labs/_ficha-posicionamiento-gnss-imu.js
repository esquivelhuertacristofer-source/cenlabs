/* Ficha técnica · Posicionamiento del coche: GNSS más sensor inercial (IMU) en un túnel — contenido específico del lab */
fichaTecnica({
  title: 'Posicionamiento del coche: GNSS más sensor inercial (IMU) en un túnel',
  intro: 'Este laboratorio muestra cómo un coche sabe dónde está cuando el GPS (GNSS) se pierde en un túnel. Un <b>receptor GNSS</b> da la posición con ruido de metros; un <b>sensor inercial</b> (giroscopio y acelerómetro) y las <b>ruedas</b> permiten seguir la cuenta a ciegas (<i>dead reckoning</i>), pero el sesgo del giroscopio hace que el error crezca con el cuadrado del tiempo. Un <b>filtro de Kalman</b> mezcla todo, aprende los sesgos mientras hay cielo y reporta cuánto duda (el círculo). Todo lo que se mueve sale del modelo; donde el dibujo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> una ruta plana exacta (recta de 300 m, arco a la izquierda de 100 m de radio, recta de 170 m, arco a la derecha y recta de 330 m; 1 378,3 m) recorrida con un perfil de velocidad suave (90 km/h en cielo abierto, 66 km/h al acercarse al túnel); la cinemática verdadera; el <b>GNSS</b> con 12 satélites a cielo abierto, dilución de precisión HDOP(n) = 3,2/√(n − 2) y error σ = 2,0 m·HDOP, <b>correlacionado en el tiempo</b> (AR(1), τ = 0,5 s; 2 s en el cañón urbano), con 2,5 s de re-adquisición al salir del túnel y rebotes (multitrayecto) en el cañón; el <b>giroscopio</b> con sesgo, error de escala, ruido blanco (<i>angle random walk</i>) y una deriva lenta del sesgo; el <b>acelerómetro</b> con sesgo y ruido (<i>velocity random walk</i>); las <b>ruedas</b> con un error de escala y ruido de 0,08 m/s; un <b>filtro de Kalman en estado de error</b> con 7 estados (este, norte, rapidez, rumbo, sesgo del giroscopio, sesgo del acelerómetro y escala de las ruedas), transición exacta de segundo orden, propagación por la regla del punto medio y actualizaciones escalares en <b>forma de Joseph</b>; el mando de <b>confianza</b> (g = 3<sup>u</sup>, multiplica la R del GNSS por g² y divide la Q del IMU entre g²); la elipse de incertidumbre a partir de la covarianza; y las métricas del reto: error pico en la zona, error de lado, recuperación (error &lt; 3 m durante 1 s), cobertura del círculo y el índice <b>NEES</b>. Paso fijo de 50 ms; 40 s de pre-rodaje para que el filtro llegue asentado.',
    omitidos: [
      '<b>La altura, el cabeceo y el alabeo</b>: todo ocurre en un plano. Un IMU real mide en 3D y debe separar la gravedad; aquí el acelerómetro mide sólo la aceleración a lo largo del camino.',
      '<b>El magnetómetro, el pareo de mapa (<i>map matching</i>) y la visión</b>: los sistemas reales corrigen el rumbo con el campo magnético, ajustan la posición a la carretera y usan marcas de la vía. Aquí no existen, y por eso el error crece dentro del túnel.',
      '<b>Los satélites reales</b>: los 12 satélites son un abanico sintético con posiciones fijas; no hay efemérides, varias constelaciones ni errores de reloj o ionosfera. El error del GNSS es gaussiano y correlacionado de forma didáctica, no el de un receptor concreto.',
      '<b>La dinámica del vehículo</b>: no hay deslizamiento de las ruedas ni suspensión; la odometría sólo tiene un error de escala y ruido blanco.',
      '<b>El mapa no está a escala</b>: la carretera se dibuja 2,5 veces más ancha y el coche 7,5 veces más grande para que se vean; las distancias del mapa (trazas, círculo, error) sí están a escala real.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Un ajuste que funciona en un túnel puede fallar en otro: en el cañón urbano el GNSS rebota y se repite entre lecturas, y un filtro que se fía de él «presume» de una precisión que no tiene. Los valores de aquí son <b>didácticos</b>, órdenes de magnitud de la categoría, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['GNSS', 'error equivalente a un satélite · HDOP · lecturas', 'σ = 2,0 m·HDOP · HDOP(11) = 1,07 (σ = 2,1 m) · 1, 2, 5 o 10 Hz (mando del alumno)'],
      ['Clases de IMU', 'sesgo del giroscopio · ruido angular · sesgo del acelerómetro · precio', 'Básico 0,30 °/s · 3,0 °/√h · 50 mg · 1 | De consumo 0,08 °/s · 0,7 °/√h · 20 mg · 2 | Industrial 0,015 °/s · 0,15 °/√h · 5 mg · 3 | Táctico 0,003 °/s · 0,03 °/√h · 1 mg · 4 (órdenes de magnitud, a verificar)'],
      ['Ruedas', 'ruido · error de escala', '0,08 m/s · de 0,3 a 0,5 % según el escenario (el filtro lo aprende)'],
      ['Ruta', 'longitud · radio de las curvas', '1 378,3 m · 100 m'],
      ['Escenarios', 'zona sin señal', 'Túnel de 520 m con curvas · túnel largo de 750 m · túnel recto de 170 m · cañón urbano de 520 m (edificios: GNSS con rebotes, 5 satélites de 11 y τ = 2 s)'],
      ['Presupuesto del reto', 'clase máxima', 'hasta Industrial (precio 3); el Táctico queda fuera'],
      ['El reto', 'cuatro condiciones a la vez', 'error pico y de lado bajo el límite del escenario · recuperación (error &lt; 3 m) a tiempo · NEES entre 1 y 4 (el filtro ni presume ni se achica)']
    ]
  },
  s3: [
    'Un registro (log) de un coche real con receptor GNSS de doble frecuencia, IMU y odómetro, con una referencia de mayor precisión (RTK o cinemática en pista), para medir el error real dentro de un túnel y comparar con la deriva ½·v·b·t² calculada.',
    'La hoja de datos del IMU y una prueba de varianza de Allan para medir de verdad el sesgo y el ruido de cada clase, en lugar de usar órdenes de magnitud de la categoría.',
    'Pasadas repetidas por el mismo túnel con distintas calibraciones para verificar que el círculo de incertidumbre cubre el error real (la prueba de consistencia NEES) y no sólo que el error sea pequeño.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. La puesta a punto real de un sistema de posicionamiento para conducción asistida añade:',
    items: [
      'Estimar las <b>matrices de ruido</b> (Q y R) a partir de datos reales y comprobar la consistencia del filtro (NEES, innovaciones) en lugar de ajustar «a ojo»; el mando de confianza de aquí es una versión de una sola perilla.',
      'Fusionar más sensores (magnetómetro, visión, mapa de alta definición, correcciones RTK/PPP) y <b>detectar y rechazar lecturas malas</b> del GNSS (multitrayecto, engaños), sobre todo en cañones urbanos.',
      'Calibrar el IMU (temperatura, alineación de ejes, sensibilidad a la gravedad) y estimar su alineación respecto al coche; el sesgo real cambia con la temperatura y entre arranques.',
      'Declarar la <b>integridad</b>: no basta con dar una posición, el sistema debe dar un límite de protección fiable y avisar al conductor o degradar la función cuando la incertidumbre es demasiado grande (normas de seguridad funcional y de integridad de la posición: a verificar).'
    ]
  },
  s5: {
    modela: 'la <b>propagación del error a ciegas</b> y la <b>fusión</b>: el filtro sin lecturas coincide con una integración independiente de las mismas medidas del IMU (diferencia menor que 10⁻⁹ m), el error lateral de la deriva por un sesgo constante vale ½·v·b·t² (con 20 m/s, 0,05 °/s y 30 s son 7,85 m; al duplicar t se cuadruplica y al duplicar el sesgo se duplica), y la covarianza sin lecturas coincide con su evolución cerrada. La transición de segundo orden es exacta (F es nilpotente), la forma de Joseph conserva la simetría y las actualizaciones secuenciales dan lo mismo que la actualización por lotes. Los sensores tienen la estadística declarada (media, desviación y correlación del GNSS; sesgo, escala y ruido del IMU y de las ruedas) y el filtro es <b>consistente</b>: en un Monte Carlo de 24 semillas, con el modelo igual al mundo, el NEES medio de posición se acerca a 2. Con el escenario de 520 m y 2 Hz el IMU básico se aparta hasta 25,8 m (10,3 m de lado) dentro del túnel, el de consumo 5,9 m (NEES 5,8), el industrial 1,0 m y el táctico 1,2 m; el círculo de duda crece dentro del túnel y al reaparecer el GNSS el filtro da un salto de corrección (23 m en el básico). En el cañón con el industrial a 10 Hz el NEES llega a 241 con un círculo de 0,8 m frente a un error de 8,6 m (presumido); a 1 Hz y u = 1,5 vale 1,4. El reto exige cuatro condiciones a la vez, nada se cumple con el ajuste inicial en ningún escenario, el Básico nunca cumple y la ventana de confianza es <b>interior</b> (p. ej. túnel de 520 m, industrial a 1 Hz: u de −0,5 a 1,5; cañón a 1 Hz: u de 1,25 a 1,5). Se verifica con 274 comprobaciones.',
    noModela: 'la <b>altura y la orientación 3D</b>, el magnetómetro, el pareo de mapa, los satélites y la ionosfera reales, el deslizamiento de las ruedas y las fallas de los sensores. La <b>ruta y los cuatro escenarios son sintéticos</b>; el error del GNSS es gaussiano y correlacionado de forma didáctica; las clases de IMU son órdenes de magnitud, no la hoja de un fabricante. El <b>dibujo</b> no está a escala en lo que se refiere al ancho de la carretera (×2,5) y al tamaño del coche (×7,5), el túnel translúcido y los edificios son ilustrativos, y los rayos de los satélites sólo indican cuáles se ven. No es el sistema de un fabricante ni una homologación.'
  },
  s6: [
    'Groves, P. D., <i>Principles of GNSS, Inertial, and Multisensor Integrated Navigation Systems</i>, Artech House, 2.ª ed., 2013 (navegación inercial, deriva de los sesgos y fusión con Kalman; a verificar el capítulo).',
    'Titterton, D. H. y Weston, J. L., <i>Strapdown Inertial Navigation Technology</i>, IET, 2.ª ed., 2004 (errores del giroscopio y el acelerómetro, clases de IMU; a verificar los datos de la cita).',
    'Bar-Shalom, Y., Li, X. R. y Kirubarajan, T., <i>Estimation with Applications to Tracking and Navigation</i>, Wiley, 2001 (filtro de Kalman y prueba de consistencia NEES; a verificar el capítulo).'
  ]
});
