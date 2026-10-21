/* Ficha técnica · Frenado regenerativo mezclado en un vehículo eléctrico — contenido específico del lab */
fichaTecnica({
  title: 'Frenado regenerativo mezclado (brake blending) en un VE',
  intro: 'Este laboratorio muestra un <b>coche eléctrico en transparencia</b> (1 850 kg, batalla 2,80 m, centro de masa a 0,52 m del suelo) que frena hasta una línea de parada: la batería plana en el suelo (su nivel verde es la carga), el motor en media sección sobre un eje con su inversor y su cable de alta tensión, y los cuatro discos. El pedal pide una deceleración; el coche la <b>reparte entre el motor</b>, que al frenar funciona como generador y devuelve energía a la batería, <b>y los frenos de disco</b>, que la convierten en calor. Se estudian los cuatro techos del motor (par, potencia, batería y baja velocidad), el reparto de carga entre ejes y la adherencia del eje motriz. Las fuerzas, la corriente, la carga de la batería y la energía de cada frenada salen de ecuaciones calculadas y verificadas; es un modelo para razonar, no un banco de ensayos ni una homologación.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la <b>fuerza de frenado pedida</b> F = m·g·z − (C<sub>rr</sub>·m·g + ½·ρ·C<sub>d</sub>·A·v²); los <b>cuatro techos del motor en generación</b>: par F<sub>par</sub> = T<sub>máx</sub>·i/(r·η<sub>g</sub>) = 8,7 kN, potencia F<sub>pot</sub> = P<sub>máx</sub>/(η<sub>g</sub>·v) con 90 kW, potencia que la batería admite F<sub>bat</sub> = (V<sub>oc</sub> + R·I<sub>lím</sub>)·I<sub>lím</sub>/(η·v) con la corriente máxima de carga que baja a 0 entre el 80 y el 100 % de carga, y la <b>caída a baja velocidad</b> (el motor suelta entre la velocidad de relevo y 3 km/h); la <b>transferencia de carga</b> N<sub>f</sub> = m·g·(b + z·h)/L y la <b>adherencia</b> de cada eje (un eje no da más que μ·N; si se le pide más «se agarrota»); el <b>reparto ideal</b> F<sub>f</sub>/F = (b + z·h)/L contra el reparto real; el <b>retardo hidráulico</b> de los discos (constante de tiempo de 0,10 s), que es lo que hunde el pedal si el motor suelta rápido; la <b>batería</b> de 96 celdas con V<sub>oc</sub>(carga), la corriente que sale de R·I² + V<sub>oc</sub>·I = P<sub>dc</sub> y la carga que sube con ∫I dt; y el <b>balance de energía</b> de toda la frenada con su eficiencia de ida y vuelta. En el dibujo: el nivel de la batería, los puntos verdes que siguen al cable según la potencia que entra, el calor naranja de los discos según su potencia de fricción, las barras de fuerza por eje con la marca de agarre (μ·N) y la línea de parada.',
    omitidos: [
      '<b>ABS y control de estabilidad</b>: no se modelan. Un eje que llega a μ·N se «agarrota» y da μ·N; el coche frena menos pero no se simula el desliz ni la pérdida de dirección.',
      '<b>Rendimiento real del motor</b>: el motor, el inversor y la reducción tienen rendimientos constantes (0,93 · 0,97 · 0,975). Un motor real cambia con el par y las vueltas, y sus mapas de eficiencia no son planos.',
      '<b>Batería real</b>: V<sub>oc</sub> lineal con la carga, resistencia fija y sin temperatura, histéresis ni envejecimiento. No hay descarga: el laboratorio sólo estudia la frenada; la eficiencia de ida y vuelta usa un rendimiento de descarga a la misma potencia.',
      '<b>Servofreno y fading del disco</b>: el pedal fija la deceleración pedida y los discos responden con un retardo de primer orden; no se modelan el calentamiento del disco, el fade, la elasticidad de las mangueras ni la ebullición del líquido (el brillo del disco muestra la <i>potencia</i> de fricción, no una temperatura medida; el laboratorio de frenos de disco trata el calor).',
      '<b>Dinámica fuera de la frenada recta</b>: suelo plano y recto, sin viento ni pendiente, sin suspensión. El cabeceo se dibuja multiplicado por 4 y la rueda gira dibujada a 1/12 de su velocidad real.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un turismo eléctrico mediano. Un coche real tiene otras masas, otros motores y otros paquetes de batería.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa · batalla · centro de masa', 'transferencia de carga', '1 850 kg · 2,80 m · a = 1,44 m, h = 0,52 m'],
      ['Motor y reducción', 'techos en generación', 'T<sub>máx</sub> = 320 N·m · P<sub>máx</sub> = 90 kW · i = 9,0 · rueda de 0,34 m'],
      ['Rendimientos', 'tren motriz (constantes)', 'η<sub>g</sub> = 0,975 · η<sub>m</sub> = 0,93 · η<sub>i</sub> = 0,97 → η = 0,880'],
      ['Batería', '96 celdas en serie', 'V<sub>oc</sub> de 321,6 V (0 %) a 393,6 V (100 %) · R = 60 mΩ · 210 A·h'],
      ['Carga máxima', 'corriente de carga', '240 A hasta el 80 % y baja lineal a 0 A en el 100 %'],
      ['Frenado SÓLO con el motor', 'suelo seco, μ = 0,90', 'trasero: patina a 0,397 g · delantero: a 0,525 g'],
      ['Frenada de ejemplo', '60 km/h, 0,35 g, motor al 60 %, batería al 55 %', 'para en 44 m; de 257 kJ vuelven 128 kJ a la batería (50 %), 98 kJ se pierden en discos, 20 kJ en motor y batería y 10 kJ en rodadura y aire; ida y vuelta 75 %'],
      ['Mismo caso con la batería al 97 %', 'corriente máxima de 36 A', 'sólo vuelven 60 kJ (23 %)']
    ]
  },
  s3: [
    'Un coche eléctrico tiene un <b>sistema de alta tensión</b> (cientos de voltios) con cables naranja: sólo personal formado lo desconecta, con el procedimiento y los equipos de protección del fabricante.',
    'Después de una frenada fuerte, los discos y las pinzas pueden pasar de 300 °C: no se tocan hasta que se enfríen. Con el coche parado siempre se aplica el freno de estacionamiento y se calza.',
    'Un pedal que se hunde, un freno que tira hacia un lado o una luz de avería del sistema de frenos o de la batería son motivo de parar y revisar, no de seguir conduciendo.',
    'La regeneración <b>no sustituye</b> a los frenos de disco: con la batería llena, fría o con un fallo, el coche frena sólo con los discos y el recorrido de frenada es otro.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre cómo se mezclan los dos frenos; el ensayo real sigue otros pasos:',
    items: [
      '<b>Ensayo de frenada en banco de rodillos o en pista</b>: medir deceleración, presión en cada eje, corriente de la batería y par del motor; aquí sólo se simula una frenada.',
      '<b>Calibración del reparto y del relevo</b>: el fabricante ajusta con el coche real cuánto pide al motor, cuándo suelta y cómo sube la presión hidráulica; los valores del laboratorio son didácticos.',
      '<b>Medida de la eficiencia de ida y vuelta</b>: con un analizador de potencia en los bornes de la batería y en las ruedas; el laboratorio la calcula con rendimientos constantes.',
      '<b>Homologación de frenos</b> (UN R13-H, FMVSS 135) y del sistema de frenado regenerativo (categorías A y B de la R13-H): pruebas que este laboratorio no cubre.'
    ]
  },
  s5: {
    modela: 'la <b>fuerza de frenado pedida</b> con rodadura y aire, los <b>cuatro techos del motor</b> (par, potencia, batería, baja velocidad), la <b>mezcla</b> con los discos y su retardo, la <b>carga por eje</b> con transferencia longitudinal y la <b>adherencia</b> de cada eje en sus cuatro casos de límite, la <b>corriente, la carga y las pérdidas de la batería</b>, y el <b>balance de energía</b> de toda la frenada. La verificación (148 comprobaciones) comprueba: el frenado sólo con el motor contra la forma cerrada z = μ·a/(L + μ·h) y un barrido numérico de 1 500 casos (error de 1e-9 g), la segunda ley y el límite de adherencia en 6 000 equilibrios, la corriente de carga contra la ecuación de bornes (1e-12), el cierre de la energía en 400 frenadas al azar (≈1e-15: E₀ = calor + energía del motor + rodadura, y energía del motor = pérdidas del tren + I²R + energía guardada), la energía guardada contra ∫V<sub>oc</sub> dQ (menos de 6e-4), la distancia de parada contra su forma cerrada, que el motor nunca pasa de sus techos ni la corriente de su máximo, las tendencias (más motor, más energía; relevo más tardío, menos energía y menos hundimiento del pedal), y que cada reto tiene una ventana de solución interior comprobada con una cuadrícula independiente (acertar al azar: menos del 2 % de los puntos).',
    noModela: 'el ABS, el control de estabilidad, el calentamiento y el fade del disco, el servofreno y la elasticidad del circuito, el mapa real de rendimiento del motor y del inversor, la temperatura y el envejecimiento de la batería, la descarga, la suspensión, la pendiente y la curva. <b>No es CFD, ni elementos finitos, ni una homologación</b>: las cifras pertenecen a ESTE coche con ESTAS leyes simplificadas; la ventana del reto no es una ley, es lo que sale del modelo para el escenario sorteado.'
  },
  s6: [
    'Gillespie, <i>Fundamentals of Vehicle Dynamics</i>, sobre frenado, transferencia de carga y reparto ideal.',
    'Limpert, <i>Brake Design and Safety</i>, sobre el reparto de frenado y la adherencia.',
    'Ehsani, Gao y Emadi, <i>Modern Electric, Hybrid Electric and Fuel Cell Vehicles</i>, sobre el frenado regenerativo y los límites del motor y la batería.',
    'Larminie y Lowry, <i>Electric Vehicle Technology Explained</i>, sobre baterías, rendimientos del tren motriz y eficiencia de ida y vuelta.',
    '<b>UN R13-H</b>: homologación de frenos de turismos, con las condiciones del frenado regenerativo. <b>FMVSS 135</b>: frenos de vehículos ligeros (EE. UU.).'
  ]
});
