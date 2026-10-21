/* Ficha técnica · Frenos de disco: reparto de frenado y fade térmico — contenido específico del lab */
fichaTecnica({
  title: 'Frenos de disco: reparto de frenado y fade térmico',
  intro: 'Este laboratorio muestra la <b>rueda delantera de un turismo cortada</b>: el disco ventilado (aletas a la vista), la pinza flotante en media sección, las pastillas, el pistón con su líquido y la mangueta. El coche (1 500 kg, batalla 2,70 m, centro de masa a 0,55 m) frena <b>cinco veces seguidas desde 160 km/h</b>. Se estudian dos cosas: cómo se reparte la fuerza entre eje delantero y trasero según la transferencia de carga, y cómo el calor de cada frenada sube la temperatura del disco hasta que la pastilla pierde fricción (<b>fade</b>). Las fuerzas, las temperaturas y las distancias salen de ecuaciones calculadas y verificadas; es un modelo para razonar, no un banco de ensayos ni una homologación.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la <b>transferencia de carga</b> (N<sub>f</sub> = m·g·(b + z·h)/L), el <b>reparto ideal</b> F<sub>f</sub>/F = (b + z·h)/L contra la <b>línea fija</b> β del circuito, el punto de bloqueo de cada eje (z<sub>f</sub> = μ·b/(β·L − μ·h), z<sub>r</sub> = μ·a/((1 − β)·L + μ·h)) y el β* = (b + μ·h)/L que bloquea los dos a la vez; la <b>energía</b> ½·m·v² convertida en calor y repartida entre disco y pastilla por la efusividad √(k·ρ·c) de cada material; el <b>disco como masa concentrada</b> que se enfría por convección h(v) = 12 + 7,5·v<sup>0,8</sup> y por radiación (ε = 0,6); la <b>solución exacta</b> con h constante, que sirve de patrón para comprobar la integración numérica; la <b>fricción de la pastilla μ(T)</b> con una pérdida progresiva alrededor de 480 °C; y la <b>distancia</b> de cada una de las cinco frenadas. En el dibujo: corte de la pinza con caras hachuradas, disco que pasa del gris al rojo y al naranja con su temperatura, chispas de polvo de pastilla, y en la vista «Coche» las flechas de peso, carga por eje, frenado e inercia con el cabeceo exagerado.',
    omitidos: [
      '<b>Antibloqueo (ABS)</b>: no se modela; aquí el eje que llega a su límite de adherencia se bloquea. Para el control de deslizamiento está el laboratorio del ABS.',
      '<b>Gradiente térmico dentro del disco</b>: el disco es una masa a una sola temperatura. El gradiente radial y las aletas se dibujan sólo como ilustración; no es un cálculo de elementos finitos ni de fluidos.',
      '<b>Fricción μ(T) real</b>: la curva de pérdida es didáctica (logística centrada en 480 °C). Una pastilla real depende de su formulación, de la presión, del desgaste y del vapor de resina que se genera.',
      '<b>Dinámica fuera de la frenada recta</b>: sin curva ni pendiente (salvo las resistencias de rodadura y aire), sin suspensión real. El cabeceo del dibujo está multiplicado por 4 y la rueda gira dibujada a 1/12 de su velocidad.',
      '<b>Hidráulica y fading del líquido</b>: el pedal fija la deceleración pedida; no se modelan el servofreno, la elasticidad de las mangueras ni la ebullición del líquido.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un turismo mediano. Un coche real tiene otras alturas, otros discos y otras pastillas.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa · batalla · centro de masa', 'transferencia de carga', '1 500 kg · 2,70 m · a = 1,20 m, h = 0,55 m'],
      ['Radio de rueda', 'conversión fuerza a par', '0,325 m'],
      ['Disco delantero', 'fundición ventilada, ρ = 7 200, c = 460', 'Ø 260 a 360 mm (por defecto 300 mm)'],
      ['Pastilla', 'fricción en frío', 'μ<sub>0</sub> = 0,42; pérdida del 10 % a unos 419 °C y del 20 % a unos 492 °C'],
      ['Partición de calor al disco', 'efusividades', 'γ = 0,869'],
      ['Convección · radiación', 'enfriamiento', 'h(v) = 12 + 7,5·v<sup>0,8</sup> · ε = 0,6'],
      ['Reparto de referencia', 'adherencia μ = 0,90', 'β* = 0,739 (74 : 26); bloqueo simultáneo a z = 0,90 g'],
      ['Serie de cinco frenadas', '160 km/h, 0,90 g de pedal, cada 16 s', 'disco delantero a 580 °C y fade del 31 %; la última frena en 119 m contra 109 m la primera']
    ]
  },
  s3: [
    'Un freno real se revisa <b>con el coche en caballetes</b> y calzado; nunca debajo de un gato solo.',
    'Después de frenar fuerte, el disco y la pinza pueden pasar de 500 °C: <b>no se tocan</b> hasta que se enfríen. El líquido de frenos absorbe agua y hierve más fácil con el tiempo.',
    'El polvo de pastilla no se sopla ni se respira: se aspira o se limpia en húmedo. Pastillas y discos se cambian por eje, en pareja.',
    'Una pastilla que huele a quemado o un pedal que se hunde es una señal para parar y revisar, no para seguir bajando la montaña.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre el reparto y el calor; el ensayo real sigue otros pasos:',
    items: [
      '<b>Ensayo de fade en dinamómetro</b>: frenadas repetidas desde una velocidad fija midiendo temperatura, par y recorrido de pedal; aquí sólo se simula una serie de ejemplo.',
      '<b>Medida de reparto en pista</b>: decelerar con sensores de presión en cada eje para obtener la curva real contra la ideal; el circuito real tiene válvulas limitadoras y compensadoras.',
      '<b>Medida de temperatura</b>: termopares o pinturas térmicas en el disco; la masa concentrada no sustituye esa medida.',
      '<b>Homologación de frenos</b> (UN R13-H, FMVSS 135): pruebas de eficacia en frío, en caliente y de recuperación, que este laboratorio no cubre.'
    ]
  },
  s5: {
    modela: 'la <b>carga por eje</b> con transferencia longitudinal, el <b>reparto fijo</b> β contra el ideal (b + z·h)/L, el <b>equilibrio</b> del coche con la fuerza de frenado, la rodadura y el aire en los cuatro casos de bloqueo (ninguno, trasero, delantero, ambos), la <b>energía</b> ½·m·v² repartida a cada disco, el <b>calentamiento y enfriamiento</b> de una masa concentrada por convección h(v) y radiación con un método de Heun, la <b>fricción μ(T)</b> de la pastilla y la <b>distancia</b> de cada frenada de una serie. La verificación (más de 50 pruebas) comprueba: el reparto ideal contra la fórmula y contra un barrido numérico de 3 000 casos, el calentamiento contra la solución exacta con h constante (error de 1e-5 K), la conservación de la energía a 1e-15 en frío y a 1e-9 con pérdidas, las tendencias (más disco, menos temperatura) y que cada reto generado tiene una ventana de solución interior.',
    noModela: 'el ABS, el gradiente de temperatura dentro del disco y de la pastilla, el desgaste y la formulación real de la fricción, el vapor de resina, la ebullición del líquido, el servofreno, la elasticidad de las mangueras y la pinza, la suspensión, la pendiente y la curva. <b>No es CFD, ni elementos finitos, ni una homologación</b>: las cifras pertenecen a ESTE coche con ESTAS leyes simplificadas; la ventana del reto no es una ley, es lo que sale del modelo para el escenario sorteado.'
  },
  s6: [
    'Limpert, <i>Brake Design and Safety</i>, sobre reparto de frenado, transferencia de carga y temperatura del disco.',
    'Gillespie, <i>Fundamentals of Vehicle Dynamics</i>, sobre el frenado y la distribución de fuerzas.',
    'Milliken y Milliken, <i>Race Car Vehicle Dynamics</i>, sobre equilibrio de frenos y fade.',
    'Incropera y DeWitt, <i>Fundamentos de transferencia de calor</i>, sobre masa concentrada, convección y radiación.',
    '<b>UN R13-H</b>: homologación de frenos de turismos. <b>FMVSS 135</b>: frenos de vehículos ligeros (EE. UU.).'
  ]
});
