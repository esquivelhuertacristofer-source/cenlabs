/* Ficha técnica · Robot de 6 ejes: alcance, cinemática inversa y singularidades — contenido específico del lab */
fichaTecnica({
  title: 'Robot de 6 ejes: alcance, cinemática inversa y singularidades',
  intro: 'Este laboratorio muestra cómo un <b>robot de seis ejes</b> de soldadura reparte su movimiento para llevar la punta de la pinza a donde se le pide. Dado un punto y una orientación, la <b>cinemática inversa</b> calcula los seis ángulos: <b>J1</b> gira la base hacia el punto, <b>J2 y J3</b> forman un brazo de dos eslabones que se resuelve con la <b>ley de los cosenos</b> (con el codo arriba o abajo) y <b>J4, J5 y J6</b> orientan la herramienta. Con el <b>jacobiano</b> J se obtiene qué tan bien se mueve la punta en cada postura (el índice de manipulabilidad |det J|) y qué velocidad articular q̇ = J⁻¹·v exige un avance dado. Cerca de dos posturas, la <b>muñeca recta</b> (J5 ≈ 0, J4 y J6 se alinean) y el <b>brazo estirado</b> (J2 y J3 en línea), el jacobiano <b>casi pierde rango</b> y las velocidades articulares se disparan. Todo lo que se mueve o se colorea sale del modelo; donde el dibujo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la <b>cinemática directa</b> del robot del modelo 3D con los pivotes y los ejes reales de sus seis articulaciones, a escala 3 (≈ 2,8 m de alto); los eslabones del brazo L<sub>2</sub> = 1,224 m (hombro–codo) y L<sub>3</sub> = 1,813 m (codo–muñeca, con un desvío lateral de 0,48 m), de modo que el centro de la muñeca alcanza como máximo <b>L<sub>2</sub> + L<sub>3</sub> = 3,037 m</b> y como mínimo <b>|L<sub>3</sub> − L<sub>2</sub>| = 0,589 m</b> del hombro (la zona muerta bajo el hombro y detrás de la base); la <b>ley de los cosenos</b> d² = L<sub>2</sub>² + L<sub>3</sub>² + 2·L<sub>2</sub>·L<sub>3</sub>·cos φ y sus dos soluciones, <b>codo arriba y codo abajo</b>; la <b>descomposición exacta de la muñeca</b> (R = R<sub>A4</sub>(q4)·R<sub>z</sub>(q5)·R<sub>x</sub>(q6), con el eje de J4 inclinado 10,97° respecto del antebrazo) y unas iteraciones de Newton amortiguado que absorben los pequeños desvíos de los pivotes reales; el <b>jacobiano geométrico</b> 6×6 (verificado contra derivadas numéricas) y de él el <b>índice de manipulabilidad</b> de Yoshikawa |det J| (normalizado con una referencia de 6, el 100 %) y las <b>velocidades articulares</b> q̇ = J⁻¹·[v; 0] con la herramienta sin girar; los <b>límites de carrera</b> didácticos (J1 ±170°, J2 −105° a +45°, J3 −40° a +125°, J4 ±200°, J5 ±120° medida como desviación de la muñeca, J6 ±360°) y los <b>límites de velocidad</b> didácticos (75, 70, 75, 110, 110 y 150 °/s); un <b>corte vertical del volumen de trabajo</b> calculado celda por celda con la propia cinemática inversa; y la <b>pasada recta</b> evaluada punto a punto con cuatro criterios (alcance y límites, manipulabilidad ≥ 20 %, velocidad articular dentro del límite y ritmo mínimo de la línea). Un solo reloj: el avance se calcula en tiempo real y se muestra en cámara lenta ×1/4.',
    omitidos: [
      '<b>La dinámica</b>: sólo hay cinemática. No hay masas, inercias, pares, gravedad ni flexión de los eslabones; los límites de velocidad son <b>didácticos</b> (un robot de soldadura de este tamaño con la pinza cargada), no los de un fabricante, y no se calculan aceleraciones ni sacudidas.',
      '<b>Las singularidades exactas</b>: los pivotes del modelo real tienen pequeños desvíos, de modo que det J <b>no llega a cero</b>; hay dos <b>casi-singularidades</b>. Con la muñeca recta |det J| cae a cerca de una octava parte de su valor con la muñeca a 40° y las velocidades de J4 y J6 se multiplican por diez (de ≈ 13 a ≈ 128 °/s con 0,5 m/s de avance); con el brazo estirado el mínimo está en φ ≈ 3° y J2 y J3 llegan a cientos de °/s. Es la forma <b>real</b> de la singularidad en este modelo, no el «infinito» del libro de texto.',
      '<b>Toda la cinemática inversa</b>: sólo se resuelve la rama de codo arriba y la de codo abajo para una orientación dada, y falla en ≈ 10 % de las poses aleatorias con el codo muy cerrado (J3 > 50°) y una orientación arbitraria. Los escenarios del reto están verificados uno por uno y no caen en esa zona. No se enumeran las 8 soluciones de un robot general ni se elige entre ellas por el consumo.',
      '<b>El volumen de trabajo completo</b>: el mapa es <b>un solo plano</b> vertical, con la herramienta a una inclinación fija; el volumen real es un sólido de revolución recortado por los límites de J1 y por el entorno. La altura de la base se suma como una elevación del pedestal; no hay colisiones con la pieza, la valla ni el propio robot.',
      '<b>La pieza y el proceso</b>: la puerta, la costura y la pinza son referencias de tamaño; no hay soldadura (calor, fuerza ni pepita; eso lo trata otro laboratorio), ni medición de la pieza, ni calibración del punto de la herramienta, ni errores de repetibilidad o de exactitud (ISO 9283, a verificar).',
      '<b>El dibujo</b>: el modelo 3D es el del robot real, pero la pinza se simplifica, los colores del mapa son de aviso y la pasada se muestra con puntos de apoyo, no con la trayectoria del controlador. El avance en cámara lenta es ×1/4.'
    ]
  },
  s2: {
    title: 'Cifras del motor (SI; la interfaz muestra grados)',
    warn: 'Las cifras salen del motor de cálculo del propio laboratorio; los límites de carrera y de velocidad son didácticos y las ventanas del reto dependen de la altura de la base elegida.',
    rows: [
      ['Eslabones del brazo', 'L₂ · L₃ · desvío lateral', '1,224 m · 1,813 m · 0,48 m (del modelo, escala 3)'],
      ['Alcance del centro de la muñeca', 'máximo · mínimo', 'L₂ + L₃ = 3,037 m · |L₃ − L₂| = 0,589 m (desde el hombro)'],
      ['Alcance de la punta', 'a la altura del hombro', '≈ 3,9 m (la herramienta añade ≈ 0,9 m al del centro de la muñeca)'],
      ['Ley de los cosenos', 'ángulo del codo φ', 'cos φ = (d² − L₂² − L₃²) / (2·L₂·L₃) · φ = 0 con el brazo estirado'],
      ['Eje de J4', 'inclinación del antebrazo', '10,97° · J5 se limita con θ₅ = q₅ + 10,97° (0 = muñeca recta)'],
      ['Carreras', 'J1 · J2 · J3 · J4 · J5 · J6', '±170° · −105° a +45° · −40° a +125° · ±200° · ±120° · ±360°'],
      ['Velocidades', 'J1 · J2 · J3 · J4 · J5 · J6', '75 · 70 · 75 · 110 · 110 · 150 °/s (didácticas)'],
      ['Manipulabilidad', 'w = |det J|', 'referencia 6 = 100 % · máximo muestreado ≈ 4,9 · umbral del reto 20 %'],
      ['Velocidad articular', 'q̇ = J⁻¹·[v; 0]', 'la herramienta no gira · 128 °/s en J4 y J6 con θ₅ = 0 y 0,5 m/s · 880 °/s en J2/J3 con φ = 3° y 0,3 m/s'],
      ['El reto', 'tres piezas · tres mandos', 'distancia de la pieza, altura de la base y velocidad del TCP · alcance y límites, manipulabilidad, velocidad articular y ritmo de la línea'],
      ['Ejemplo (puerta, base 0,3 m)', 'ventanas', 'distancia 2,00 a 3,50 m · velocidad 1,2 a 2,5 m/s (ventanas interiores: nada se cumple en el ajuste inicial)']
    ]
  },
  s3: [
    'Una <b>medición de repetibilidad y exactitud</b> del robot real (ISO 9283, a verificar) y la <b>calibración cinemática</b> con un láser de seguimiento, para sustituir los pivotes del modelo por los identificados.',
    'La <b>hoja de datos del fabricante</b> con las carreras, las velocidades máximas y el diagrama de alcance oficial de este robot, en lugar de los límites didácticos.',
    'Un <b>programa de ciclo real</b> (tiempo por pieza, aceleraciones, zonas de aproximación) para comprobar la velocidad articular con el control del fabricante.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición didáctica</b>; la programación de un robot en producción incluye además:',
    items: [
      'Los <b>perfiles de velocidad</b> con aceleraciones y sacudidas acotadas, la interpolación en el espacio articular o en el cartesiano, y el <b>suavizado de esquinas</b> (zonas de aproximación).',
      'La <b>evitación de singularidades y de colisiones</b>: mínimos cuadrados amortiguados, redundancia del eje externo o del posicionador, y la simulación de la celda completa con la valla, la pieza y el utillaje.',
      'La <b>dinámica</b>: carga útil, momentos de inercia, par de cada motor y límites térmicos, que reducen las velocidades máximas respecto de la hoja de datos.',
      'La <b>elección del emplazamiento</b> (posición de la base y de la pieza) con el volumen de trabajo en 3D, el criterio de manipulabilidad a lo largo de toda la trayectoria y la verificación del tiempo de ciclo.'
    ]
  },
  s5: {
    modela: 'la <b>cinemática directa e inversa</b> del robot del modelo 3D con sus pivotes y ejes reales (la FK reproduce la punta del modelo en la pose cero), con el brazo de dos eslabones resuelto por la <b>ley de los cosenos</b> y sus dos ramas; la muñeca por descomposición exacta; el <b>jacobiano</b> 6×6 verificado contra derivadas numéricas; el <b>índice de manipulabilidad</b> |det J| y las <b>velocidades articulares</b> q̇ = J⁻¹·[v; 0] (verificadas contra la derivada temporal de la cinemática inversa); el corte del volumen de trabajo celda por celda con la cinemática inversa; y una pasada recta que se aprueba o no con cuatro criterios, con ventanas <b>interiores</b> verificadas para cada pieza.',
    noModela: 'un <b>robot de producción</b>: sin dinámica (masas, pares, aceleraciones), sin colisiones, sin controlador ni errores de repetibilidad, con límites de carrera y de velocidad <b>didácticos</b> y no los del fabricante, y con la <b>singularidad como casi-singularidad</b> (det J nunca llega a cero en este modelo, porque los pivotes reales tienen desvíos). La cinemática inversa no resuelve ≈ 10 % de las poses aleatorias con el codo muy cerrado y orientación arbitraria. <b>El mapa de alcance</b> es un único plano vertical con la herramienta a una inclinación fija, y <b>el dibujo</b> simplifica la pinza y la pieza; el avance se muestra en cámara lenta ×1/4. No es una validación de celda ni una programación de robot.'
  },
  s6: [
    'Siciliano, B., Sciavicco, L., Villani, L. y Oriolo, G., <i>Robotics: Modelling, Planning and Control</i>, Springer (cinemática directa e inversa, jacobiano y singularidades; a verificar la edición y los capítulos).',
    'Craig, J. J., <i>Introduction to Robotics: Mechanics and Control</i>, Pearson (brazo de dos eslabones y ley de los cosenos, muñeca y configuraciones; a verificar la edición).',
    'Yoshikawa, T., «Manipulability of Robotic Mechanisms», <i>The International Journal of Robotics Research</i>, 4(2), 1985 (índice de manipulabilidad √det(J·Jᵀ); a verificar la paginación).',
    'ISO 9787, <i>Robots and robotic devices — Coordinate systems and motion nomenclatures</i>, e ISO 9283, <i>Manipulating industrial robots — Performance criteria and related test methods</i> (nomenclatura de ejes y repetibilidad; a verificar el número y la edición).'
  ]
});
