/* Ficha técnica · Leyes de Kirchhoff — contenido específico del lab */
fichaTecnica({
  title: 'Leyes de Kirchhoff — análisis numérico de redes multimalla',
  intro: 'Este laboratorio representa una <b>sesión de análisis de circuitos</b>: una red de 3 mallas (2 fuentes, 5 resistores) declarada como datos y resuelta en vivo por <b>análisis nodal modificado (MNA)</b>. El esquema usa símbolos <b>IEC 60617</b> y las leyes que se verifican con números reales son las de <b>Kirchhoff (1845)</b>: ΣI = 0 en cada nodo y ΣV = 0 en cada lazo. El montaje 3D es <b>procedural y didáctico</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> esquema normalizado con nodos, mallas y direcciones de corriente en vivo; motor MNA (matriz de conductancias + eliminación gaussiana con pivoteo parcial); verificación numérica de LCK por nodo y LVK por malla; reto con red aleatoria (valores E12) y predicción antes de revelar; código de colores real de cada resistor.',
    omitidos: [
      '<b>Tolerancias reales de los componentes</b>: la banda oro declara ±5 %, pero el motor usa el valor nominal exacto. En una red física, cada resistor cae en algún punto de su banda de tolerancia y los voltajes de nodo se desvían de los calculados.',
      '<b>Resistencia interna de las fuentes</b>: V1 y V2 son ideales (impedancia cero). Una fuente real cae bajo carga; se modela añadiendo una R en serie — el mismo motor la resuelve.',
      '<b>Resistencia de conductores y contactos</b>: los cables del esquema son equipotenciales perfectos; en un protoboard real, contactos oxidados o flojos añaden décimas de ohm por punto.',
      '<b>Efectos térmicos</b>: el coeficiente de temperatura (típ. ±100 ppm/°C en resistores de película) y el autocalentamiento por I²R quedan fuera del modelo.',
      '<b>Elementos parásitos y transitorios</b>: no hay L ni C, ni de componentes ni de cableado — la red está en CD estacionaria; el análisis con dinámica (RC, RL, RLC) es materia de otras prácticas.',
      '<b>La medición física</b>: aquí los voltajes son exactos del modelo; medirlos con un DMM real añade carga del instrumento e incertidumbre ±(% + dígitos) — eso lo ejercita la práctica del multímetro.'
    ]
  },
  s2: {
    title: 'Red canónica y motor de cálculo',
    warn: 'La red inicial es <b>didáctica</b> (valores E12 comerciales); el botón «Nueva red» genera variantes aleatorias con el mismo motor. Los voltajes y corrientes mostrados son la <b>solución exacta del modelo ideal</b>, no lecturas de instrumento.',
    rows: [
      ['Elemento', 'Valor (red canónica)', 'Papel en la red'],
      ['V1 · V2', '12 V · 5 V (ideales)', 'Fijan los nodos P y Q; alimentan las mallas 1 y 3'],
      ['R1 · R3 · R5', '1 kΩ · 3.3 kΩ · 1.5 kΩ', 'Ramas serie del riel superior (P–A, A–B, Q–B)'],
      ['R2 · R4', '2.2 kΩ · 4.7 kΩ', 'Ramas a referencia: descargan los nodos A y B'],
      ['Incógnitas', 'V_A y V_B (sistema 2×2)', 'ref = 0 por definición; P y Q los fijan las fuentes'],
      ['Motor', 'MNA + Gauss con pivoteo', 'Ho–Ruehli–Brennan (1975); corrientes = ΔV/R por rama']
    ]
  },
  s3: [
    'Protoboard o tarjeta de prácticas con resistores de la <b>serie E12</b> (±5 %) para montar físicamente la misma red.',
    'Fuente de alimentación doble (o dos fuentes) con limitación de corriente, para reproducir V1 y V2.',
    'Multímetro digital para verificar los voltajes de nodo predichos (ver la práctica del multímetro para su incertidumbre).',
    'Simulador SPICE (LTspice, ngspice — gratuitos) para contrastar: internamente usan el <b>mismo MNA</b> de este lab.'
  ],
  s4: {
    intro: 'Resolver la red en papel es el <b>inicio</b>; el circuito de verdad se cierra midiendo. Un procedimiento real añade:',
    items: [
      'Medir cada resistor <b>antes</b> de montarlo (fuera de circuito) y anotar su valor real: el análisis se rehace con los valores medidos, no con los nominales.',
      'Verificar con el DMM los voltajes de nodo contra la predicción y explicar cada desviación (tolerancias, carga del instrumento, contactos).',
      'Para medir una corriente de rama con amperímetro: <b>desenergizar, abrir la rama</b> e insertar el instrumento en serie — o medir ΔV sobre el resistor y dividir entre R (método indirecto, sin abrir).',
      'Documentar la red con su esquema normalizado (IEC 60617) y la tabla de valores nominales vs. medidos: esa es la evidencia de la práctica.'
    ]
  },
  s5: {
    modela: 'la red resistiva lineal en CD con fuentes ideales, resuelta por análisis nodal modificado (MNA); la verificación numérica de LCK en cada nodo y LVK en cada malla; las direcciones reales de corriente según el signo de la solución; y el código de colores E12 de cada resistor.',
    noModela: 'las tolerancias reales (±5 %) ni la deriva térmica de los componentes, la resistencia interna de las fuentes, la resistencia de conductores y contactos, los elementos parásitos (L, C) ni los transitorios — es el circuito ideal de parámetros concentrados; la medición física con su incertidumbre es materia de la práctica del multímetro.'
  },
  s6: [
    '<b>G. Kirchhoff (1845)</b>, Annalen der Physik: enunciado original de las leyes de corrientes (LCK) y voltajes (LVK).',
    '<b>IEC 60617</b>: símbolos gráficos para esquemas eléctricos (resistor rectangular, fuentes, tierra) — el estándar de representación de este lab.',
    '<b>Ho, Ruehli y Brennan (1975)</b>, «The Modified Nodal Approach to Network Analysis», IEEE Trans. CAS: el algoritmo MNA que usan este lab y los simuladores SPICE.',
    '<b>Hayt, Kemmerly y Durbin</b>, <i>Análisis de circuitos en ingeniería</i> (McGraw-Hill): análisis nodal y de mallas, capítulos introductorios.',
    '<b>IEC 60063</b>: series de valores normalizados E6/E12/E24 para resistores — la serie E12 (±5 %) usada por el generador de redes.'
  ]
});
