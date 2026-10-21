/* Ficha técnica · Subviraje, sobreviraje y control de estabilidad (ESC) — contenido específico del lab */
fichaTecnica({
  title: 'Subviraje, sobreviraje y control de estabilidad (ESC)',
  intro: 'Este laboratorio representa un <b>sedán compacto</b> entrando en una curva a la izquierda en una pista de pruebas, con dos coches que hacen la misma maniobra a la vez: uno <b>sin ESC</b> y otro <b>con ESC</b>. Lo que se mueve, se enciende y se dibuja sale de un modelo de bicicleta con neumáticos de fórmula mágica, calculado y verificado; es un modelo didáctico, no un simulador de homologación.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> masa e inercia de guiñada, posición del centro de masa, rigidez de deriva de cada eje, <b>curva de fuerza lateral saturada por la adherencia</b> (μ·F<sub>z</sub>), elipse de fricción cuando una rueda frena o traccionan, dirección con retraso y límites, conductor que sigue la pista, tracción trasera que mantiene la velocidad y un <b>ESC proporcional</b> que frena una sola rueda según compare la guiñada real con la deseada. En el dibujo: carrocería, cuatro ruedas con disco y pinza, círculo de fricción y flecha de fuerza por neumático, trayectorias, calzada con pianos, guardarraíl y paneles de curva.',
    omitidos: [
      '<b>Transferencia de carga</b> lateral y longitudinal: cada eje conserva su carga estática; el balanceo y el cabeceo del dibujo son ilustrativos y no entran en la física.',
      '<b>Suspensión, geometría de dirección, cámber y convergencia</b>, ni la deformación elástica del neumático (longitud de relajación).',
      '<b>Sensores reales del ESC</b> (ángulo de volante, velocidad de rueda, acelerómetro, giróscopo), su filtrado, sus retardos y el modulador hidráulico del ABS.',
      '<b>Reducción activa de par del motor</b> por mando propio: aquí el ESC sólo corta el acelerador mientras actúa.',
      '<b>Peralte, pendiente y viento.</b> La pista es plana y sin irregularidades.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un sedán típico. Sobre hielo o nieve, cualquier cifra de la vida real depende del neumático, de la temperatura y del estado de la capa.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa · inercia de guiñada', 'este lab', '1 500 kg · 2 500 kg·m²'],
      ['Distancias al centro de masa · batalla · vía', 'a · b · L · t', '1,10 · 1,50 · 2,60 · 1,55 m'],
      ['Rigidez de deriva del eje delantero', 'a μ = 0,9 (los dos neumáticos)', '90 kN/rad  (C<sub>α</sub> ∝ μ)'],
      ['Gradiente de subviraje K', 'subvirador · neutro · sobrevirador', '+2,0 · 0 · −1,5 °/g (a μ = 0,9)'],
      ['Adherencia μ', 'seco · mojado · nieve · hielo', '0,90 · 0,55 · 0,25 · 0,12'],
      ['Neumático (fórmula mágica)', 'C · E', '1,35 · −0,5'],
      ['Gradiente típico de un turismo', 'referencia de libro', '≈ 1 a 4 °/g'],
      ['Pista', 'recta · cuarto de circunferencia · recta', '60 m · R = 70 m · 30 m, calzada de 7,2 m']
    ]
  },
  s3: [
    'En un ensayo real: <b>pista cerrada</b> con zona de escape, casco y arnés, y un conductor de pruebas con licencia.',
    'Instrumentación: giróscopo y acelerómetros de plataforma inercial, sensor óptico de ángulo de deriva y de velocidad (tipo correvit).',
    'Superficies de baja adherencia (placas de agua, basalto pulido, hielo) <b>sólo en instalaciones de pruebas</b>.',
    'Nunca se prueba el apagado del ESC en vía pública.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre la adherencia; el ensayo real sigue otros pasos:',
    items: [
      '<b>Ensayo de giro estacionario (ISO 4138)</b>: radio constante y velocidad creciente para medir el gradiente de subviraje K en °/g.',
      '<b>Doble cambio de carril (ISO 3888)</b> y <b>sinusoide con detención (FMVSS 126)</b>: maniobras con las que se valida el ESC.',
      'Registrar volante, velocidad de guiñada, aceleración lateral y ángulo de deriva del vehículo en cada ensayo.',
      'Repetir con el ESC apagado (sólo en pista) para cuantificar su aporte.'
    ]
  },
  s5: {
    modela: 'un <b>modelo de bicicleta de 3 grados de libertad</b> (velocidad longitudinal, lateral y guiñada) integrado con Runge–Kutta de 4.º orden; <b>neumáticos de fórmula mágica</b> por eje, con rigidez de deriva ∝ μ y fuerza máxima μ·F<sub>z</sub>; <b>elipse de fricción</b> para las ruedas que frenan o traccionan; el <b>gradiente de subviraje</b> K = (m/L)(b/C<sub>f</sub> − a/C<sub>r</sub>), la ganancia de guiñada r/δ = V/(L + K·V²) y la <b>velocidad crítica</b> √(−L/K) de un sobrevirador; un conductor de persecución pura con retraso; y un <b>ESC</b> que compara la guiñada real con la deseada r<sub>des</sub> = V·δ/(L + K·V²) acotada por μ·g/V, y frena la rueda delantera exterior (sobreviraje) o la trasera interior (subviraje) con un momento ΔM = F·t/2, más un frenado común suave. La verificación comprueba el estacionario contra la fórmula, V<sub>crit</sub> por el determinante del sistema lineal, la energía cinética contra la potencia de los neumáticos, el momento de cada rueda y el orden del integrador.',
    noModela: 'la transferencia de carga, la suspensión, el calentamiento y el desgaste del neumático, la histéresis de la fuerza lateral, los sensores y actuadores reales del ESC, la intervención del ABS en la rueda frenada, el peralte ni el viento. <b>No es una simulación certificada ni un producto comercial</b>: las cifras de límite de velocidad (por ejemplo, hasta qué velocidad pasa el coche sin ESC y con ESC) pertenecen a ESTE escenario, con ESTE conductor y ESTE controlador, y no son leyes. Con ESC, la velocidad de entrada que se sobrevive puede superar √(μ·g·R) porque el ESC frena el coche dentro de la curva; a una velocidad estacionaria en el arco, √(μ·g·R) sigue siendo el techo. El balanceo de la carrocería y el desplazamiento de los coches son ilustrativos.'
  },
  s6: [
    '<b>ISO 4138</b>: giro estacionario de vehículos de pasajeros. <b>ISO 3888-2</b>: doble cambio de carril.',
    '<b>FMVSS 126 / Reglamento ONU nº 140</b>: control electrónico de estabilidad (ESC) en turismos.',
    '<b>SAE J670</b>: terminología de dinámica del vehículo.',
    'Pacejka, <i>Tire and Vehicle Dynamics</i>; Milliken y Milliken, <i>Race Car Vehicle Dynamics</i>; Gillespie, <i>Fundamentals of Vehicle Dynamics</i>.',
    'van Zanten, <i>Evolution of Automotive Chassis Control</i> (Bosch), sobre el principio del ESC.'
  ]
});
