fichaTecnica({
  title: 'Diagnóstico de Fallas en CD',
  intro: 'En una cadena de resistores en serie, un circuito abierto detiene la corriente de TODA la cadena y absorbe prácticamente todo el voltaje de la fuente en un solo salto — una firma de "escalón limpio en un solo nodo" que permite localizar la falla midiendo primero el punto medio del tramo sospechoso (bisección o half-splitting), en vez de resistor por resistor. Un corto o una deriva de valor, en cambio, desplazan el perfil de voltaje COMPLETO de la cadena de forma más sutil, sin una firma de un solo nodo. Este banco practica la localización por bisección —restringida honestamente al circuito abierto— y además deja explorar y diagnosticar libremente las tres firmas de falla con el circuito energizado.',
  s1: {
    presentes: [
      'Modelo de falla unificado sobre una cadena serie de 8 resistores: circuito abierto (R_efectiva≈1×10⁹ Ω), corto (R_efectiva=0 Ω) y deriva de valor (R_efectiva=R_nominal×factor aleatorio, alto 3×–6× o bajo 0.15×–0.35×), con recálculo exacto de corriente y voltaje de nodo vía Ley de Ohm y Ley de voltajes de Kirchhoff',
      'Verificación algebraica de que la suma de caídas de voltaje siempre iguala exactamente el voltaje de fuente, sin excepción, por construcción del modelo — no solo en el caso sano',
      'Firma de circuito abierto (escalón limpio de V_fuente a 0 V en un solo nodo) aislada como la única firma que admite localización por bisección con garantía formal de convergencia',
      'Algoritmo de bisección genérico sobre un intervalo [lo,hi] sobre 8 resistores, con conteo de mediciones usadas contra el óptimo teórico ⌈log₂8⌉=3, y una métrica no bloqueante de si cada medición cayó en el punto medio exacto del intervalo vigente',
      'Comparación visual libre de las tres firmas de falla (abierto/corto/deriva) sobre el mismo circuito base, mediante una gráfica de perfil de voltaje de los 9 nodos',
      'Reto de falla sellada con tipo Y posición ambos desconocidos, calificado de forma independiente por campo (tipo de falla, resistor afectado), sin presupuesto de mediciones bloqueante',
    ],
    omitidos: [
      'Localización por bisección formal para fallas de corto o deriva — el modo Diagnóstico se restringe deliberadamente a circuito abierto, la única falla con firma de un solo nodo; corto y deriva desplazan el perfil completo y requieren comparar contra valores nominales esperados, restricción declarada explícitamente en el simulador',
      'Efectos de carga del instrumento de medición sobre el circuito medido — el multímetro simulado se modela como ideal, con resistencia de entrada infinita',
      'Fallas múltiples simultáneas — el modelo permite exactamente una falla activa a la vez',
      'Efectos térmicos, de arco eléctrico o de degradación progresiva de un corto o una deriva real — ambas fallas se modelan como un cambio instantáneo e ideal de resistencia efectiva, no como un proceso físico en el tiempo',
      'Tolerancias reales de fabricación de los resistores — el simulador usa valores E12 nominales exactos, salvo el resistor fallado, cuyo valor efectivo se altera intencionalmente según el modelo de falla activo',
    ],
  },
  s2: {
    title: 'Elementos del circuito',
    warn: 'Valores nominales usados por el modelo — en un banco real cada componente tendría su propia tolerancia de fabricación.',
    rows: [
      ['V', 'Fuente ideal de CD', '24 V', 'Se modela sin resistencia interna; el voltaje de fuente cae monótonamente de 24 V a 0 V a lo largo de la cadena, sin excepción'],
      ['R1–R8', 'Cadena de 8 resistores en serie (E12)', '220, 330, 470, 150, 680, 100, 390, 560 Ω', 'Siempre clicables: revelan su valor NOMINAL de diseño, nunca si son el resistor fallado ni su valor efectivo real'],
      ['Multímetro', 'Instrumento simulado', 'Resistencia de entrada infinita (ideal)', 'Mide voltaje de nodo a tierra; no carga el circuito medido'],
    ],
  },
  s3: [
    'Cadena visible de 8 resistores de precisión en serie (banco de resistores E12)',
    'Fuente de CD fija de 24 V',
    'Multímetro simulado de resistencia de entrada infinita',
    'Esquema de pizarrón con 9 nodos medibles (P0–P8) y gráfica de perfil de voltaje',
  ],
  s4: {
    intro: 'Procedimiento para explorar, diagnosticar por bisección y resolver una falla sellada:',
    items: [
      'En el modo Explora, provoca tú mismo cualquiera de las tres fallas (abierto, corto o deriva) en cualquier resistor de la cadena, y compara sus firmas de voltaje distintas en la gráfica de perfil de nodo a nodo — cualquier nodo o resistor es clicable en todo momento y siempre revela su valor exacto.',
      'Observa que solo el circuito abierto produce un escalón limpio de 24 V a 0 V en un único nodo; un corto o una deriva desplazan el perfil COMPLETO de la cadena de forma más sutil.',
      'En el modo Diagnóstico, el sistema sella un circuito abierto en un resistor aleatorio y oculta el esquema (los nodos solo muestran ALTO/BAJO/? según lo medido). Mide primero el punto medio del intervalo [lo,hi] vigente —no un extremo— y deja que cada medición ALTO/BAJO reduzca el intervalo, hasta converger en el resistor fallado con un número de mediciones cercano al óptimo teórico (3, para 8 resistores).',
      'En el modo Reto, el sistema sella una falla de tipo Y posición ambos desconocidos (cualquiera de las tres). Mide voltajes de nodo libremente (lectura numérica real, sin presupuesto de mediciones) y reporta tu diagnóstico seleccionando tipo de falla y resistor afectado; ambos campos se califican de forma independiente.',
    ],
  },
  s5: {
    modela: 'Modelo de falla unificado sobre una cadena serie de 8 resistores (abierto, corto, deriva de valor) con recálculo exacto de corriente y perfil de voltaje de nodo vía Ley de Ohm y Ley de voltajes de Kirchhoff; aislamiento de la firma de circuito abierto como la única que admite localización por bisección formal; algoritmo de bisección con conteo de mediciones contra el óptimo teórico ⌈log₂N⌉; diagnóstico de una falla de tipo Y posición ambos desconocidos con calificación independiente por campo.',
    noModela: 'Localización por bisección formal para corto o deriva de valor, efectos de carga del multímetro sobre el circuito medido, fallas múltiples simultáneas, efectos térmicos o de arco eléctrico de una falla real progresiva, ni tolerancias de fabricación de los resistores sanos — es un modelo de parámetros concentrados ideal con exactamente una falla activa a la vez.',
  },
  s6: [
    'EC&M (Electrical Construction & Maintenance) — "The Beauty of Half-Splitting": artículo de referencia de la industria sobre la técnica de bisección para localizar fallas en cadenas de componentes en serie.',
    'AllAboutCircuits — sección de troubleshooting de circuitos serie: firmas de voltaje de circuito abierto y corto circuito en una cadena de resistores.',
    'CliffsNotes / learnabout-electronics.org — análisis de fallas en divisores de voltaje y circuitos serie mediante mediciones de voltaje a tierra.',
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): fundamentos de la Ley de voltajes de Kirchhoff y circuitos serie, base teórica del modelo de falla.',
    'IEC 60617 — Graphical symbols for diagrams (símbolos normalizados).',
    'IEC 60063 — Preferred number series for resistors (serie E12) para los 8 valores nominales de la cadena.',
  ],
});
