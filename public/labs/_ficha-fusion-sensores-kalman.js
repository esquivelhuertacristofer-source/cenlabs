/* Ficha técnica · Fusión de sensores con filtro de Kalman: seguir a un coche con radar y cámara — contenido específico del lab */
fichaTecnica({
  title: 'Fusión de sensores con filtro de Kalman: seguir a un coche con radar y cámara',
  intro: 'Este laboratorio muestra, desde arriba y en un <b>esquema didáctico</b>, cómo un coche sabe dónde está el vehículo de adelante cuando sus dos sensores se equivocan: el <b>radar</b> (muy bueno en distancia y en velocidad, flojo en el lado) y la <b>cámara</b> (muy buena en el lado, floja en la distancia). Un <b>filtro de Kalman</b> lineal, con un filtro de dos estados por eje (posición y velocidad), hace un <b>promedio ponderado</b> entre lo que esperaba por el movimiento y lo que midió cada sensor, y lleva la cuenta de su propia duda (la covarianza P, la elipse verde). Todo lo que se mueve sale del modelo; donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la trayectoria exacta del coche de adelante (frenada trapezoidal con rampas de tirón integrada con polinomios, y un balanceo lateral senoidal) y la de nuestro coche; las medidas del radar (distancia, velocidad por efecto Doppler y ángulo) y de la cámara (distancia por el tamaño aparente y ángulo) con ruido gaussiano de <b>semilla fija</b>; el error lateral como distancia × error angular; el filtro de Kalman (predicción con F y Q de aceleración blanca discreta, corrección con actualizaciones escalares secuenciales y covarianza en forma de Joseph); los huecos de lectura (el rocío de un camión), en los que sólo hay predicción y P crece; y las métricas con la verdad: error RMS, retraso con que el filtro se entera de la frenada, temblor de la velocidad estimada, NEES (consistencia con la verdad) y la innovación normalizada (consistencia sin la verdad).',
    omitidos: [
      '<b>La asociación de datos y las falsas alarmas</b>: el filtro sabe qué lectura es de qué coche y no hay ecos fantasma ni objetos que se cruzan.',
      '<b>Los modelos con aceleración, los filtros no lineales (EKF, UKF) y los de múltiples modelos (IMM)</b>: aquí el modelo es de velocidad constante y las medidas se tratan como lineales en coordenadas cartesianas (error lateral = distancia × error angular, aproximación de ángulos pequeños).',
      '<b>Los ejes acoplados</b>: distancia y lado llevan filtros separados; en un seguidor real se estiman juntos, con la orientación y el giro del vehículo.',
      '<b>La física del radar FMCW y del LiDAR</b>, tratada en otros laboratorios, y la visión por computadora: aquí la cámara ya entrega una distancia y un ángulo con su error.',
      '<b>La sincronización y los retardos de los sensores</b>: se suponen medidas sin retraso y en el mismo reloj.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Un filtro mal ajustado <b>no avisa</b> de que está mal: puede mostrar una elipse diminuta (muy seguro) y estar equivocado por metros. En un coche real, estos números alimentan el frenado de emergencia; los valores de aquí son didácticos, no de un fabricante.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Paso del filtro', 'escenario de 24 s', '0,05 s (20 Hz) · 481 instantes'],
      ['Radar', 'frecuencia · error en distancia · en velocidad · en ángulo', '10 Hz · 0,80 m · 0,60 m/s · 2,5°'],
      ['Cámara', 'frecuencia · error en distancia · en ángulo', '5 Hz · 8 % de la distancia · 0,40°'],
      ['Error lateral', 'distancia × error angular', 'radar: 1,3 m a 30 m · cámara: 0,21 m a 30 m'],
      ['Estado y modelo', 'por eje: posición y velocidad', 'F = [[1, T],[0, 1]] · Q = σ<sub>a</sub>²·[[T⁴/4, T³/2],[T³/2, T²]]'],
      ['Mandos del alumno', 'Q (σ<sub>a</sub>) · confianza en cada sensor', '0,05 a 10 m/s² · ×¼ a ×4 del error de catálogo'],
      ['Escenarios', 'frenado del de adelante · rampa · error real de los sensores', 'autopista 5,0 m/s² · lluvia 5,5 m/s² (cámara ×2,4) · rocío (hueco de 1,8 s)'],
      ['El reto', 'cinco condiciones a la vez', 'distancia, lado, retraso ≤ 0,4 s, velocidad ≤ 0,25 m/s y NEES entre 1 y 4']
    ]
  },
  s3: [
    'Un registro (log) de un coche real con la referencia de un GPS de precisión (RTK) para comparar la estimación con la verdad.',
    'Un banco de pruebas con un blanco de radar y un maniquí con tamaño conocido para medir el error de cada sensor por separado.',
    'Herramientas de análisis de la innovación y de la consistencia (NEES y NIS) sobre los registros.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. La puesta a punto real de un seguidor añade:',
    items: [
      'Medir el ruido de cada sensor <b>en reposo</b> y en cada condición (lluvia, sol de frente, túnel) antes de fijar R.',
      'Ajustar Q con maniobras reales del coche de adelante, comprobando que la innovación normalizada vale 1 en promedio y que el NEES vale el número de estados.',
      'Probar los huecos de lectura: qué pasa con la duda y con el error cuando un sensor se pierde 0,5, 1 o 2 segundos.',
      'Validar contra una referencia independiente antes de entregar la estimación al frenado automático.'
    ]
  },
  s5: {
    modela: 'dos <b>filtros de Kalman lineales de dos estados</b> (distancia y lado), con las medidas del radar y de la cámara fusionadas por actualizaciones escalares secuenciales, que son <b>idénticas</b> a la actualización por lotes mientras los errores sean independientes; la covarianza en forma de Joseph se mantiene simétrica y definida positiva. Sin lecturas, la covarianza crece con la fórmula cerrada var(x) = P₀ + n²T²·P₀<sub>vv</sub> + σ<sub>a</sub>²T⁴·n(4n²−1)/12. Con las ganancias estacionarias y la aceleración constante el error de seguimiento coincide con a·T²·(1−α)/β. El NEES medio de un filtro bien ajustado, sobre muchas realizaciones sorteadas con el mismo modelo, vale 2 y la innovación normalizada vale 1. El reto exige cinco condiciones a la vez y sólo las cumple el 1,28 % (autopista), el 1,45 % (lluvia) y el 0,44 % (rocío) de las combinaciones de Q y de confianza de la rejilla de 41 × 17 × 17; la ventana de Q está en el interior del rango (con el radar al ×1,5 del catálogo: 2,3 a 3,5 m/s² en autopista). Se verifica con 299 comprobaciones.',
    noModela: 'la <b>asociación de datos</b>, las falsas alarmas, los filtros no lineales (EKF, UKF), los modelos de varias maniobras (IMM), los ejes acoplados, la orientación del vehículo, los retardos de los sensores y la visión por computadora. Los <b>escenarios son sintéticos</b>, el ruido es gaussiano y blanco (los sensores reales tienen colas pesadas y correlación en el tiempo), y los factores kR y kC (cuánto se equivoca de verdad cada sensor frente al de catálogo) los fija el escenario y el alumno los descubre al validar. El <b>dibujo no está a escala</b>: la distancia y el lado usan escalas distintas, los coches se alargan para leerse y la elipse nunca se dibuja menor que un mínimo visible. No es el seguidor de un fabricante ni una homologación.'
  },
  s6: [
    'Bar-Shalom, Y., Li, X. R. y Kirubarajan, T., <i>Estimation with Applications to Tracking and Navigation</i>, Wiley, 2001 (filtro de Kalman, consistencia NEES/NIS, modelos de movimiento).',
    'Kalman, R. E., «A New Approach to Linear Filtering and Prediction Problems», <i>Journal of Basic Engineering</i>, 1960.',
    'Kalata, P. R., «The Tracking Index: A Generalized Parameter for α-β and α-β-γ Target Trackers», <i>IEEE Trans. AES</i>, 1984.',
    'ISO 15622, <i>Intelligent transport systems — Adaptive cruise control systems</i>.'
  ]
});
