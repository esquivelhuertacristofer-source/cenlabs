/* Ficha técnica · Control de crucero adaptativo (ACC): mantener la distancia con el coche de adelante — contenido específico del lab */
fichaTecnica({
  title: 'Control de crucero adaptativo (ACC): mantener la distancia con el coche de adelante',
  intro: 'Este laboratorio muestra, a escala real, cómo un coche acelera y frena solo para seguir a otro. Un <b>radar</b> mide la distancia y la velocidad relativa con el coche de adelante y un <b>controlador PD</b> pide aceleración para mantener la distancia deseada d* = d<sub>0</sub> + h·v (política de <b>tiempo de brecha constante</b>), con topes de confort y un actuador (motor y frenos) con retardo. El líder frena y arranca con un perfil exacto; detrás del coche propio se simulan otros dos coches idénticos para ver la <b>estabilidad de cadena</b> (<i>string stability</i>). Todo lo que se mueve sale del modelo; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la cinemática longitudinal de cuatro coches en fila (líder y tres seguidores) con el estado [posición, velocidad, aceleración real]; la distancia entre parachoques d = x<sub>líder</sub> − x − 4,4 m; la política de tiempo de brecha d* = 5 m + h·v; el error de distancia e = d − d* y la velocidad relativa Δv; la ley PD a = P·e + D·Δv, combinada con un <b>control de crucero</b> a = K<sub>c</sub>·(v<sub>fijada</sub> − v) (se toma el menor de los dos, K<sub>c</sub> = 0,4 s<sup>−1</sup>) y saturada a los topes de confort de −3,5 y +2,0 m/s²; el <b>actuador</b> como retardo puro θ (0,15 s; 0,20 s en el camión) más un retardo de primer orden τ (0,30 s; 0,35 s en el camión); el <b>radar</b> a 20 Hz con ruido gaussiano de semilla fija (10 cm en la distancia y 0,12 m/s en la velocidad relativa); el perfil exacto del líder como rampas suaves S(u) = 3u² − 2u³ con aceleración máxima declarada; la velocidad que nunca baja de cero (el coche se detiene, no retrocede); y las métricas del reto: distancia mínima, frenada máxima, tiempo en el tope, tirones (jerk RMS), error máximo de distancia, distancia final y la <b>ganancia pico de la cadena</b> |Γ(jω)|. Integración RK4 con paso fijo de 10 ms.',
    omitidos: [
      '<b>La dinámica real del tren motriz y de los frenos</b>: el actuador es un retardo de primer orden con retardo puro, igual para acelerar y frenar. No hay cambios de marcha, histéresis del freno ni corte de inyección; las cifras de retardo son didácticas.',
      '<b>La pendiente, el viento y la resistencia al avance</b>: el coche es una masa puntual sobre un camino recto y plano; la aceleración pedida es la que se obtiene. En un coche real una cuesta o el viento obligan a otra orden para la misma aceleración.',
      '<b>La percepción</b>: el radar siempre ve al coche de adelante, sin pérdidas del objetivo, sin otros coches que se cuelan (cut-in) y sin curvas. El ruido es gaussiano y blanco (el de un radar real tiene colas pesadas y fallos).',
      '<b>El frenado de emergencia</b>: si el de adelante frena más fuerte que el tope de confort, el sistema real avisa al conductor y deja actuar al frenado autónomo de emergencia (otro laboratorio de la plataforma). Aquí sólo se muestra que la orden llega al tope.',
      '<b>La conducción en grupo conectada</b> (CACC): los coches de la cadena sólo se ven con su radar; no comparten su aceleración por radio, que es lo que permitiría tiempos de brecha más cortos.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Un ajuste que funciona para un coche solo puede <b>amplificar la frenada en una fila de coches</b>: la cadena es estable sólo si |Γ(jω)| ≤ 1 para toda frecuencia, y eso depende de h, P, D y del retardo del actuador. Los valores de aquí son didácticos, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Coche', 'largo · de la nariz al CG · del CG a la cola', '4,4 m · 2,05 m · 2,35 m'],
      ['Política de distancia', 'd* = d<sub>0</sub> + h·v', 'd<sub>0</sub> = 5 m · h de 0,6 a 2,4 s (mando del alumno)'],
      ['Control', 'ganancias del alumno (escala logarítmica)', 'P de 0,01 a 0,8 (m/s²) por m · D de 0,2 a 2,0 (m/s²) por (m/s)'],
      ['Topes de confort', 'orden de aceleración', '−3,5 y +2,0 m/s²'],
      ['Actuador', 'retardo puro θ · constante de tiempo τ', '0,15 s · 0,30 s (camión: 0,20 s · 0,35 s)'],
      ['Radar', 'periodo · ruido (distancia · velocidad relativa)', '50 ms · 10 cm · 0,12 m/s'],
      ['Control de crucero', 'K<sub>c</sub> · velocidad fijada', '0,4 s<sup>−1</sup> · 120, 60 y 110 km/h según el escenario'],
      ['Escenarios', 'velocidad inicial · maniobra del líder', 'autopista 100 km/h, frena a 3,3 m/s² hasta 30 km/h (t = 5 s) y acelera a 1,2 m/s² hasta 70 km/h · atasco 50 km/h, se detiene a 3,0 m/s² y arranca a 1,2 m/s² hasta 30 km/h · camión 90 km/h con el freno más lento'],
      ['El reto', 'cinco condiciones a la vez (autopista)', 'distancia mínima ≥ 6 m · sin saturar (≤ 0,3 s) y tirones ≤ 0,8 m/s³ · error de distancia ≤ 1,8 m · ganancia de cadena ≤ 1 · distancia final ≤ 46 m']
    ]
  },
  s3: [
    'Un registro (log) de un coche real con radar y GPS de precisión: distancia medida, velocidad relativa y aceleración real, para identificar el retardo y la constante de tiempo del actuador en aceleración y en frenada (que no son iguales).',
    'Pruebas en pista con un blanco de espuma que frena a distintas intensidades, para medir la distancia mínima y el instante en que el sistema entrega el control al conductor.',
    'Una fila real de varios coches con el mismo sistema, para comprobar la estabilidad de cadena y la ganancia pico medida contra la calculada.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. La puesta a punto real de un crucero adaptativo añade:',
    items: [
      'Programar las ganancias y el tiempo de brecha <b>según la velocidad</b> y el modo de conducción (confort, normal, deportivo): el tiempo de brecha que el conductor elige (típicamente de 1 a 2,5 s) cambia h.',
      'Limitar, además de la aceleración, el <b>tirón</b> (jerk) y tratar aparte la zona a baja velocidad (parada y arranque, <i>stop &amp; go</i>), donde el retardo del freno de estacionamiento y la histéresis importan.',
      'Validar el sistema según la norma de crucero adaptativo (ISO 15622, y ISO 22179 para todo el intervalo de velocidades: a verificar), con maniobras de frenado del blanco y de cut-in, y definir el aviso al conductor cuando se llega al tope de frenada.',
      'Medir el retardo real del actuador en cada condición (temperatura, carga, pendiente) antes de fijar P y D: el mismo ajuste que es estable con 0,45 s de retardo total puede no serlo con 0,60 s.'
    ]
  },
  s5: {
    modela: 'el <b>lazo longitudinal de seguimiento</b> con retardo: coincide con la solución exacta del control de crucero (sobreamortiguado, error de 2·10⁻³ m/s con la orden retenida 10 ms y de 10⁻⁸ contra el mapa exacto de un paso), reproduce la <b>respuesta en frecuencia de la cadena</b> Γ(jω) = A(P + D·s)/(s² + A(P + (D + P·h)·s)), con A = e<sup>−θs</sup>/(τs + 1), dentro de 6·10⁻⁴ al compararla con la transformada de Fourier de la simulación (el retardo equivalente de la orden retenida es θ + Δt/2), cumple Γ(0) = 1 y la condición cerrada sin retardo puro (con B = P²h² + 2PDh − 2P y C = 1 − 2τ(D + Ph), la cadena es estable ⇔ B ≥ 0 y [C ≥ 0 o C² ≤ 4Bτ²]); con P = 0,3 y D = 0,8 el tiempo de brecha mínimo de la cadena sin retardo es 1,05 s, y con el retardo del actuador h = 0,6 s amplifica la frenada (ganancia pico ×1,15) mientras h = 1,3 s no. El perfil del líder tiene forma cerrada (aceleración máxima exacta y posición igual a la integral de la velocidad). La distancia ideal a 100 km/h con h = 1,3 s es 41,1 m y a 50 km/h, 23,1 m. El reto exige cinco condiciones a la vez y sólo las cumple el 5,3 % (autopista), el 4,3 % (atasco) y el 5,0 % (camión) de las combinaciones de h, P y D de la rejilla de los mandos; la ventana es <b>interior en h y en D</b> (autopista, con P = 0,3 y D = 0,8: h de 1,07 a 1,46 s; con h = 1,3 s y P = 0,3: D de 0,67 a 0,90), mientras que P es la ganancia más tolerante (sin un mínimo útil: la velocidad relativa hace casi todo el trabajo). Se verifica con 142 comprobaciones.',
    noModela: 'el <b>tren motriz y los frenos reales</b>, la pendiente y el viento, la percepción real del radar (pérdida del objetivo, cut-in), el frenado autónomo de emergencia y el intercambio de aceleraciones entre coches (CACC). Los <b>escenarios son sintéticos</b> y el ruido es gaussiano y blanco. El <b>dibujo</b> es a escala real, pero el cabeceo del coche es ilustrativo, las luces de freno se encienden con una aceleración menor que −0,35 m/s² y el abanico azul es una forma de mostrar el haz del radar, no su diagrama de radiación. No es el sistema de un fabricante ni una homologación.'
  },
  s6: [
    'Rajamani, R., <i>Vehicle Dynamics and Control</i>, Springer, 2.ª ed., 2012 (control longitudinal, política de tiempo de brecha constante y estabilidad de cadena; a verificar el capítulo).',
    'Swaroop, D. y Hedrick, J. K., «String stability of interconnected systems», <i>IEEE Transactions on Automatic Control</i>, 1996 (definición de estabilidad de cadena; a verificar los datos de la cita).',
    'ISO 15622, <i>Intelligent transport systems — Adaptive cruise control systems — Performance requirements and test procedures</i> (a verificar la edición y los valores de los topes de aceleración).'
  ]
});
