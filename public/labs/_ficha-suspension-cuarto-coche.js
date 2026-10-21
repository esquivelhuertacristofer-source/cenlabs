/* Ficha técnica · Suspensión: cuarto de coche, confort y agarre — contenido específico del lab */
fichaTecnica({
  title: 'Suspensión: cuarto de coche, confort y agarre',
  intro: 'Este laboratorio representa <b>una rueda y el cuarto de carrocería que le toca</b> de un turismo medio, rodando por un camino aleatorio de la clase ISO 8608 que elijas. El resorte, el amortiguador (con su pistón, sus válvulas y el aceite) y el neumático se dibujan en corte. Lo que se mueve y se mide sale de un modelo de <b>dos grados de libertad</b>, calculado en el tiempo y, para los valores de confort y agarre, <b>por integral exacta en frecuencia</b>. Es un modelo didáctico, no un simulador de homologación.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> masa suspendida y no suspendida, rigidez del resorte, <b>coeficiente de amortiguamiento c</b> (pasivo o <b>semiactivo skyhook</b>), rigidez vertical del neumático y un <b>camino aleatorio con la densidad espectral de la ISO 8608</b> (clases B, C y D). Se calculan las frecuencias propias y el amortiguamiento por los polos del sistema, la transmisibilidad, el RMS de la <b>aceleración de la carrocería ponderada con W<sub>k</sub> de la ISO 2631-1</b> (confort), el RMS de la <b>variación de carga del neumático</b> relativa al peso estático (agarre) y el RMS del recorrido de la suspensión. En el dibujo: carrocería en corte, pasa-ruedas, resorte helicoidal, amortiguador monotubo con pistón, válvulas, cámara de gas y gotas de aceite, rueda con freno, dos acelerómetros, huella y flecha de carga del neumático, y el camino.',
    omitidos: [
      '<b>Balanceo, cabeceo y los otros tres ruedas:</b> sólo se modela la vertical de UNA esquina; no hay barra estabilizadora ni acoplamiento entre ejes.',
      '<b>Geometría de la suspensión:</b> la relación de movimiento entre rueda y amortiguador es 1 (en un coche real suele ser 0,6–0,9), y no hay holguras, bujes de goma ni topes de fin de carrera.',
      '<b>Neumático real:</b> es un resorte lineal que toca el camino en un punto; no envuelve bultos, no tiene amortiguamiento propio ni se despega «de verdad» (si la carga total sale negativa, el modelo lo avisa pero sigue linealmente).',
      '<b>No linealidades del amortiguador:</b> el c es lineal (en uno real, la fuerza es distinta en compresión y extensión, y depende de la velocidad); el semiactivo es un skyhook ideal con actuador instantáneo, sin retardo ni límites de ancho de banda.',
      '<b>Asiento, cuerpo humano y exposición temporal:</b> el confort es el RMS ponderado de la aceleración vertical de la carrocería, no la de un asiento con persona.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un turismo medio por esquina. Las cifras de un coche real dependen de su suspensión, de sus neumáticos y de la carga.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa suspendida m<sub>s</sub>', 'vacío · normal · lleno (por rueda)', '270 · 320 · 400 kg'],
      ['Masa no suspendida m<sub>u</sub>', 'rueda, freno y mangueta', '40 kg'],
      ['Rigidez del resorte k<sub>s</sub>', 'coeficiente lineal', '22 kN/m'],
      ['Rigidez vertical del neumático k<sub>t</sub>', 'sin amortiguamiento', '200 kN/m'],
      ['Amortiguador pasivo c', 'rango del mando', '200 a 6 000 N·s/m (nominal 1 500)'],
      ['Semiactivo (skyhook)', 'c<sub>mín</sub> · c<sub>máx</sub> · C<sub>sky</sub>', '900 · 3 500 · 2 400 N·s/m'],
      ['Frecuencias propias sin amortiguar', 'carrocería · rueda', '≈ 1,25 Hz · 11,9 Hz (rango de libro 1–1,5 y 10–14 Hz)'],
      ['Camino ISO 8608', 'G<sub>d</sub>(n₀ = 0,1 c/m) de las clases B · C · D', '64 · 256 · 1 024 ·10⁻⁶ m³'],
      ['Ponderación de confort', 'W<sub>k</sub> de la ISO 2631-1', 'filtro de 4 etapas; pico ≈ 1,05 hacia 6 Hz'],
      ['Escala del dibujo', 'sólo los desplazamientos', '×1 a ×8 (rotulada en la barra inferior)']
    ]
  },
  s3: [
    'En un banco real: <b>rodillos o cuatro actuadores hidráulicos</b> bajo las ruedas (shaker de cuatro postes) con anclaje del vehículo y protección contra el vuelco.',
    'Medidas: acelerómetros triaxiales en el asiento y en el eje de la rueda, y células de carga bajo la rueda; <b>no estés dentro del coche en pruebas de resonancia</b>.',
    'En pista, la prueba de baches se hace sólo en instalaciones preparadas y con el casco y el arnés puestos.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre el compromiso entre confort y agarre; el ensayo real sigue otros pasos:',
    items: [
      '<b>Perfil de camino medido con perfilómetro láser</b> y clasificado según ISO 8608 (el modelo usa la densidad espectral de la clase).',
      '<b>Evaluación del confort según ISO 2631-1</b>: se mide la aceleración en el asiento en los tres ejes, se pondera por W<sub>k</sub>, W<sub>d</sub>, y se calcula el RMS o el VDV.',
      '<b>Ensayo en banco de cuatro postes</b>: barrido sinusoidal de 0,5 a 30 Hz, transmisibilidad medida y comparada con la del modelo.',
      '<b>Agarre</b>: carga dinámica del neumático con balanzas o células de carga bajo la rueda, expresada como fracción de la carga estática.'
    ]
  },
  s5: {
    modela: 'un <b>cuarto de coche de 2 grados de libertad</b>: m<sub>s</sub>·z̈<sub>s</sub> = −k<sub>s</sub>(z<sub>s</sub>−z<sub>u</sub>) − c(ż<sub>s</sub>−ż<sub>u</sub>) y m<sub>u</sub>·z̈<sub>u</sub> = k<sub>s</sub>(z<sub>s</sub>−z<sub>u</sub>) + c(ż<sub>s</sub>−ż<sub>u</sub>) − k<sub>t</sub>(z<sub>u</sub>−z<sub>r</sub>). Sus frecuencias propias salen de ms·mu·λ² − [ms(ks+kt)+mu·ks]·λ + ks·kt = 0 (λ = ω²) y, con amortiguamiento, de los polos del cuártico. El camino es ISO 8608, G<sub>d</sub>(n) = G<sub>d</sub>(n₀)(n₀/n)², cuya velocidad vertical a velocidad V es ruido blanco S<sub>w</sub> = 4π²·G<sub>d</sub>(n₀)·n₀²·V; el RMS de cada salida es √∫|H(f)|²/(2πf)²·S<sub>w</sub> df, con cola analítica en la carga del neumático. La verificación compara esa integral con la <b>ecuación de Lyapunov</b> (solución algebraica independiente), con una simulación RK4 de 600 s sobre un camino de líneas espectrales (0,5 %) y con las formas cerradas de los límites c → 0 y c → ∞; comprueba la ponderación W<sub>k</sub> contra la tabla de la norma, la conservación de energía (deriva ∝ h⁵) y la disipación c·ż². El <b>semiactivo skyhook</b> (c = clamp(C<sub>sky</sub>·ż<sub>s</sub>/(ż<sub>s</sub>−ż<sub>u</sub>), c<sub>mín</sub>, c<sub>máx</sub>) si ż<sub>s</sub>(ż<sub>s</sub>−ż<sub>u</sub>) &gt; 0) es no lineal, así que sus RMS se miden con una simulación de 30 s y se marcan con «≈».',
    noModela: 'el balanceo y el cabeceo, la geometría real de la suspensión, los topes y los bujes, la no linealidad del amortiguador real, el retardo del actuador semiactivo, el enveltura del neumático y el despegue real de la rueda. <b>No es una simulación certificada</b>: las cifras de confort y agarre pertenecen a ESTE cuarto de coche, con ESTA ponderación y ESTE camino sintético (suma de 96 ondas de fase fija), y no son leyes. El compromiso confort–agarre depende de los parámetros: con otras masas o rigideces el c óptimo cambia. El semiactivo mejora ~5 % el confort a igual agarre en el escenario base; el valor depende del camino y de la velocidad. Los desplazamientos del dibujo están multiplicados por el factor de amplitud rotulado, y el recorrido de la suspensión dibujado se limita suavemente para que nada se atraviese.'
  },
  s6: [
    '<b>ISO 8608:2016</b>: vibraciones mecánicas, perfiles de la superficie de la carretera, notificación de datos de medida (clases A a H).',
    '<b>ISO 2631-1:1997</b>: evaluación de la exposición humana a la vibración de cuerpo entero; ponderación W<sub>k</sub> para la vertical y escala de confort del Anexo C.',
    'Gillespie, <i>Fundamentals of Vehicle Dynamics</i> (SAE): el modelo de cuarto de coche y su respuesta en frecuencia.',
    'Karnopp, Crosby y Harwood, <i>Vibration Control Using Semi-Active Force Generators</i> (ASME, 1974): el amortiguador skyhook.',
    'Wong, <i>Theory of Ground Vehicles</i>; Genta y Morello, <i>The Automotive Chassis</i>.'
  ]
});
