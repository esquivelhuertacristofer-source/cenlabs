/* Ficha técnica · Diferencial y reparto de par en curva — contenido específico del lab */
fichaTecnica({
  title: 'Diferencial y reparto de par en curva',
  intro: 'Este laboratorio representa el <b>eje trasero de un turismo de tracción trasera</b> en una curva a la izquierda, con el <b>diferencial en corte</b> (corona de 39 dientes, piñón de 10, caja con dos satélites y dos planetarios, todos engranes cónicos con los dientes que dicen los números) y las dos ruedas sobre un <b>suelo dividido</b> (hielo en un lado). Se comparan tres diferenciales: <b>abierto</b>, <b>autoblocante</b> (relación de par TBR) y de <b>vectorización electrónica</b> (embrague de capacidad ΔT<sub>max</sub>). Las velocidades, los pares, las fuerzas, el momento de guiñada y el calor salen de ecuaciones calculadas y verificadas; es un modelo para razonar, no un banco de ensayos ni una homologación.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la <b>cinemática del diferencial</b> (ω<sub>L</sub> + ω<sub>R</sub> = 2·ω<sub>caja</sub>; velocidades de rueda en curva V·(1 ∓ t/2R)/r<sub>w</sub>; giro de los satélites a (ω<sub>R</sub> − ω<sub>L</sub>)/2), la <b>estática</b> (par de la caja = T<sub>L</sub> + T<sub>R</sub>), los tres repartos de par, el <b>círculo de fricción</b> de cada neumático con la fuerza lateral repartida en proporción a lo que cada rueda puede dar, la <b>transferencia de carga</b> lateral (F<sub>y</sub>·h/t) y longitudinal (m·a<sub>x</sub>·h/L) con iteración hasta que la aceleración y la carga son coherentes, el <b>patinamiento</b> de cada rueda por una curva fuerza–deslizamiento, el <b>momento de guiñada</b> ΔM = (T<sub>R</sub> − T<sub>L</sub>)·t/(2·r<sub>w</sub>) y el <b>balance de potencia</b> con el calor del diferencial. En el dibujo: corte del diferencial con caras hachuradas, dientes reales de cada engrane, árbol de transmisión con bandas, semiejes que brillan con el par que llevan, círculos de fricción y flechas de fuerza por rueda, flecha curva de guiñada, huellas y polvo de hielo de la rueda que patina, y el suelo que gira con la velocidad angular V/R.',
    omitidos: [
      '<b>Dinámica del coche</b>: V y R los fija el alumno (régimen casi estacionario). La aceleración que resulta sólo mueve la carga entre ejes; no se integra la velocidad, la guiñada ni la trayectoria, y el momento de guiñada que se muestra es el de la tracción, sin el que producen los neumáticos delanteros.',
      '<b>Neumático real</b>: círculo de fricción μ·N sin curva de deriva, sin temperatura ni desgaste; el patinamiento sale de una curva F(s) con pico en 12 % y la parte de después del pico es un recurso visual, no una medida.',
      '<b>Diferencial autoblocante real</b>: el TBR es constante (rozamiento de Coulomb, tipo Torsen). Un diferencial real tiene precarga, rampas, discos que se desgastan, y su bloqueo cambia con el par y con la temperatura; un mecánico de discos (Salisbury) no es un TBR constante.',
      '<b>Vectorización</b>: embrague ideal, sin retardo ni límite térmico, con una ley de ayuda a la guiñada proporcional a la aceleración lateral (saturada a 0,6 g). Los sistemas reales dependen de la estrategia del fabricante y del control de estabilidad.',
      '<b>Suspensión y chasis</b>: son decorativos; no se mueven, no hay balanceo, cabeceo ni geometría de ejes. Las pérdidas por rozamiento de los engranes y de los rodamientos no se modelan. El diferencial del dibujo está ampliado ×1,3 respecto a un coche real.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un turismo de tracción trasera. Un coche real tiene otra distribución de pesos, otra altura de centro de masa y otros neumáticos.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa · batalla · reparto de peso', 'este lab', '1 450 kg · 2,60 m · 50 : 50 (aF = 1,30 m)'],
      ['Altura del centro de masa · vía · radio de rueda', 'transferencias de carga y cinemática', '0,52 m · 1,55 m · 0,31 m'],
      ['Grupo cónico · piñón / corona', 'dientes reales dibujados', '10 / 39 → 3,9 : 1'],
      ['Planetarios y satélites', 'relación 1 : 1', '16 dientes cada uno, cono de 45°'],
      ['Par máximo en la caja', 'motor × caja de cambios × grupo', '2 200 N·m (7,1 kN en la rueda)'],
      ['Adherencia del lado alto', 'asfalto', 'μ = 0,90'],
      ['Adherencia del lado bajo', 'hielo a nieve compactada, en el deslizador', 'μ de 0,05 a 0,90 (el hielo liso ronda 0,1)'],
      ['TBR del autoblocante', 'rango del deslizador', '1 : 1 a 6 : 1 (un Torsen de turismo anda en 2,5 a 5)'],
      ['Capacidad del embrague de vectorización', 'rango del deslizador', '0 a 1 500 N·m'],
      ['Neumático', 'pico de la curva fuerza–patinamiento', 's = 0,12 (12 %)'],
      ['Resistencia a la marcha', 'rodadura + aire', 'C<sub>rr</sub> = 0,012 · C<sub>d</sub>A = 0,60 m²'],
      ['Referencia de libro', 'abierto con una rueda sobre hielo', 'F<sub>x</sub> = 2·μ<sub>bajo</sub>·N (no depende del motor)']
    ]
  },
  s3: [
    'Un eje trasero real se trabaja <b>con el coche en caballetes</b> y calzado; nunca debajo de un gato solo, y con las ruedas giradas a mano o con el motor parado.',
    'El aceite de grupo (GL-5, hipoide) es corrosivo para la piel y está caliente justo después de rodar; un diferencial autoblocante con una rueda levantada transmite par a la otra: <b>no se prueba con el motor en marcha y una rueda en el aire</b>.',
    'Un diferencial abierto con una rueda en el aire puede lanzar la otra rueda: sin ruedas bien sujetas, no se acelera.',
    'En pista, el ajuste de un autoblocante o de un sistema de vectorización se prueba primero a baja velocidad y con el control de estabilidad (ESC) activado según el manual.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre el reparto de par; el ensayo real sigue otros pasos:',
    items: [
      '<b>Medida del TBR en banco</b>: bloquear un semieje, girar el otro y medir la relación de pares; es una prueba de taller, no una simulación.',
      '<b>Prueba de tracción con suelo dividido</b>: aceleración de arranque sobre una pista con un lado mojado o helado, con y sin autoblocante, midiendo la aceleración y la desviación lateral.',
      '<b>Círculo estacionario (ISO 4138)</b>: radio constante y velocidad creciente, registrando ángulo de volante, guiñada y deriva; ahí se ve el subviraje que mete un autoblocante al acelerar.',
      '<b>Calibración de la vectorización</b>: el fabricante ajusta ganancias y límites con el control de estabilidad, algo que este laboratorio no cubre.'
    ]
  },
  s5: {
    modela: 'la <b>cinemática del diferencial</b> por la fórmula de Willis con la caja como brazo (ω<sub>L</sub> + ω<sub>R</sub> = 2·ω<sub>caja</sub>) y las velocidades de rueda en una curva de radio R; el <b>reparto de par</b> abierto (T<sub>L</sub> = T<sub>R</sub>, manda la rueda que menos agarra), autoblocante (T<sub>lenta</sub>/T<sub>rápida</sub> ≤ TBR con un rozamiento de Coulomb que se agarra con la diferencia de velocidad y, si una rueda patina, pasa a ser la rápida y la otra recibe hasta TBR veces su par) y vectorizado (ayuda de guiñada hacia la rueda exterior y prioridad a la tracción cuando una rueda llega a su límite); el <b>círculo de fricción</b> de cada neumático con las cargas verticales corregidas por la aceleración y por la curva; el <b>momento de guiñada</b> y su aceleración ΔM/I<sub>z</sub>; y el <b>balance de potencia</b> T<sub>caja</sub>·ω<sub>caja</sub> = T<sub>L</sub>ω<sub>L</sub> + T<sub>R</sub>ω<sub>R</sub> + P<sub>dif</sub>, con el calor que disipa un diferencial pasivo. La verificación (más de 50 pruebas) comprueba cada fórmula con casos de libro: la cinemática a 1e-14, el equilibrio de pares, F<sub>x</sub> = 2·μ·N del abierto, (1 + TBR)·μ·N del autoblocante, la monotonía de la tracción y de la guiñada frente al ajuste, la convergencia de la carga, la conservación de la energía en 2 500 casos al azar y que cada reto generado tiene una ventana de solución interior y no se resuelve subiendo hasta el tope.',
    noModela: 'la dinámica completa del coche (trayectoria, balanceo, cabeceo, suspensión), el neumático con deriva y temperatura, el desgaste de los discos y la precarga de un autoblocante real, el retardo y los límites térmicos de un embrague de vectorización, el control de estabilidad, y el efecto de los neumáticos delanteros en la guiñada. <b>No es un banco de ensayos ni una homologación</b>: las cifras de tracción, de guiñada y de calor pertenecen a ESTE coche con ESTAS leyes simplificadas; la ventana del reto no es una ley, es lo que sale del modelo para el escenario sorteado.'
  },
  s6: [
    'Gillespie, <i>Fundamentals of Vehicle Dynamics</i>, sobre la cinemática del diferencial y las transferencias de carga.',
    'Milliken y Milliken, <i>Race Car Vehicle Dynamics</i>, sobre el círculo de fricción y el efecto de los diferenciales en el subviraje.',
    'Wong, <i>Theory of Ground Vehicles</i>, sobre la tracción en suelos de poca adherencia.',
    'Heisler, <i>Vehicle and Engine Technology</i>, sobre los tipos de diferencial.',
    '<b>ISO 8855</b>: vocabulario de dinámica del vehículo. <b>ISO 4138</b>: comportamiento en curva estacionaria, métodos de ensayo.'
  ]
});
