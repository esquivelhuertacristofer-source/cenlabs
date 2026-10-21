/* Ficha técnica · Autonomía de un VE: ecuación de carga de ruta — contenido específico del lab */
fichaTecnica({
  title: 'Autonomía de un VE: ecuación de carga de ruta',
  intro: 'Este laboratorio representa un <b>crossover eléctrico en media sección</b> que recorre una <b>ruta sintética de 240 km con un puerto de montaña</b>. La fuerza en la rueda sale de la ecuación de carga en tramos de 100 m, la batería paga esa fuerza por la velocidad más las pérdidas del tren y los auxiliares, y la regeneración está limitada. Todas las cifras salen de ecuaciones calculadas y verificadas; es un modelo para razonar, <b>no un ciclo normalizado ni un ensayo de homologación</b>.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> fuerza en la rueda F = m·g·C<sub>rr</sub>·cosθ + ½ρ(z)·C<sub>d</sub>·A·v² + m·g·sinθ + m·a en cada tramo de 100 m, con <b>densidad del aire ISA decreciente con la altura</b>; perfil de velocidades con rampas de aceleración y frenado constantes (v² lineal en la distancia, de modo que el trabajo de la inercia es ΔE<sub>c</sub> exacto y el de la pendiente m·g·Δz exacto); potencia en la batería con <b>pérdidas del tren</b> (fijas, ∝ v, ∝ |F| y ∝ F²), auxiliares y rendimiento de la batería; <b>regeneración limitada</b> por fuerza y potencia máximas y desvanecida a baja velocidad, con el resto disipado por el freno de fricción; SOC por integración de la energía; autonomía a velocidad constante y su <b>velocidad de consumo mínimo</b>; desglose de la energía del viaje. En el dibujo: crossover cortado por la mitad con batería de 96 módulos que se encienden según el SOC, inversor, motor y semiejes del kit de piezas; cable de alta tensión y esferas de energía; flechas de fuerza; bloque de carretera con corte geológico y crestas con paralaje.',
    omitidos: [
      '<b>Ciclo normalizado</b>: la ruta es sintética (cuatro tramos: llano, subida de 60 km, bajada de 40 km y llano). No es el WLTP, el EPA ni una ruta real; no hay curvas, tráfico, semáforos ni cambios de velocidad más allá de los de tramo.',
      '<b>Batería real</b>: rendimiento constante de 0,97; sin tensión que cae con el SOC, sin resistencia interna variable, sin temperatura, sin envejecimiento y sin límite de potencia de carga o de descarga.',
      '<b>Mapa de motor e inversor</b>: las pérdidas son una forma simple de cuatro términos, no el mapa de rendimiento par–velocidad de una máquina concreta. El rendimiento total que sale (≈ 0,86 a 100 km/h) es plausible, no medido.',
      '<b>Clima y viento</b>: los auxiliares son una potencia constante elegida por el alumno; no hay calentamiento de la batería ni de la cabina, ni viento, ni lluvia, ni cambios de densidad por temperatura.',
      '<b>Dibujo</b>: la pendiente está <b>exagerada ×4</b>; el tiempo del viaje se comprime ×C en la pantalla; el paisaje corre a ¼ de la velocidad real; el corte del terreno y las crestas son esquemáticos.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un crossover eléctrico de tamaño medio. Los de un coche real dependen de su batería, su carrocería, sus neumáticos y su software de gestión.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa · área frontal · C<sub>d</sub>', 'sin carga', '1 750 kg · 2,30 m² · 0,27'],
      ['Rodadura', 'C<sub>rr</sub> (constante)', '0,010'],
      ['Batería', 'energía útil · rendimiento', '45 kWh · 0,97'],
      ['Pérdidas del tren', 'P<sub>0</sub> · k<sub>fe</sub> · k<sub>i</sub> · k<sub>cu</sub>', '250 W · 18 W·s/m · 0,9 W/N · 7·10⁻⁴ W/N²'],
      ['Auxiliares', 'por defecto', '0,8 kW (el alumno elige 0,3 a 3,0 kW)'],
      ['Regeneración', 'F<sub>máx</sub> · P<sub>máx</sub> · desvanece bajo', '4 200 N · 65 kW · 2,5 m/s'],
      ['Aceleración', 'aceleración · frenado entre tramos', '0,7 · 0,9 m/s²'],
      ['Ruta', 'longitud · cota máxima · pendiente máxima', '240 km · 2 350 m · 6,8 %'],
      ['Aire', 'ISA: ρ<sub>0</sub> · ρ a 2 350 m', '1,225 kg/m³ · 0,972 kg/m³'],
      ['Consumo en llano (nivel del mar, 0,8 kW de auxiliares)', 'a 90 · 100 · 120 km/h', '140 · 155 · 191 Wh/km'],
      ['Velocidad de mínimo consumo', 'con 0,8 kW de auxiliares', '41,5 km/h (101 Wh/km)'],
      ['Referencia de libro', 'consumo de VE de tamaño medio a 100 km/h', '≈ 150 a 200 Wh/km']
    ]
  },
  s3: [
    'Con vehículos de alta tensión: <b>solo personal formado</b> y con el procedimiento de desenergizado (bloqueo, espera y comprobación de ausencia de tensión) antes de abrir cualquier cable naranja.',
    'La batería de un VE puede incendiarse si se daña: no se perfora ni se carga con equipos no autorizados.',
    'En ruta de montaña, la regeneración no sustituye al freno de servicio: en bajadas largas se usa también el freno y la marcha adecuada.',
    'Planear una ruta con margen de carga: llegar al 10 % es el límite del modelo, no una recomendación de uso.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre la energía de una ruta; los ensayos reales siguen otros pasos:',
    items: [
      '<b>Ensayo de consumo en banco de rodillos (WLTP, Reglamento UE 2017/1151)</b>: ciclo normalizado con cargas de rodillo obtenidas por coast-down y medida de energía de red.',
      '<b>Coast-down en pista (SAE J1263 / J2263)</b>: se deja rodar el coche en punto muerto y se ajusta F = a + b·v + c·v² para obtener C<sub>rr</sub> y C<sub>d</sub>·A reales.',
      '<b>Medida de consumo a velocidad constante</b> a varias velocidades para trazar la curva Wh/km frente a v y localizar el mínimo.',
      '<b>Ruta con registrador (OBD / CAN)</b>: potencia de batería, SOC, velocidad y altitud por tramos, para comparar con la predicción.'
    ]
  },
  s5: {
    modela: 'la <b>ecuación de carga</b> en tramos de 100 m con la densidad del aire ISA; el <b>perfil de velocidades</b> con rampas constantes; la <b>potencia en la batería</b> con pérdidas del tren de cuatro términos, auxiliares y rendimiento de batería; la <b>regeneración limitada</b> (fuerza, potencia y desvanecimiento a baja velocidad) con el sobrante al freno de fricción; el <b>SOC</b> por integración; la <b>autonomía a velocidad constante</b>, su <b>velocidad de consumo mínimo</b> (con forma cerrada ∛((P<sub>0</sub>+P<sub>aux</sub>)/(2·½ρC<sub>d</sub>A)) cuando se desprecian las pérdidas de corriente) y el <b>desglose de la energía</b>. La verificación (374 comprobaciones) comprueba cada término de la ecuación, el consumo contra la fórmula cerrada, la energía de 100 km a velocidad constante a 1 parte en 10⁹, la autonomía simulada contra la cerrada, el trabajo de aire, rodadura y pendiente en una subida de 5 % contra la integral analítica, la <b>conservación de energía</b> en la ruta de montaña (ΔE<sub>c</sub>, m·g·Δz, balance en bornes y balance químico) para ocho combinaciones de plan y escenario, los límites de la regeneración, el tiempo como suma de ds/v, la atmósfera contra la tabla ISA y el conjunto factible del reto por barrido (ni el plan más lento ni el más rápido lo cumplen).',
    noModela: 'un <b>ciclo de conducción real</b> (curvas, tráfico, paradas), la <b>batería</b> con tensión, resistencia interna y temperatura, el <b>mapa de rendimiento</b> del motor y el inversor, el <b>clima</b> (calefacción de la cabina y de la batería, que en un VE real pesa mucho en invierno), el <b>viento</b>, la <b>carga rápida en ruta</b> y el envejecimiento. <b>No es un ensayo ni una certificación</b>: la autonomía, el consumo y la velocidad de mínimo consumo pertenecen a ESTE coche con ESTAS pérdidas y no son leyes. El óptimo de 41,5 km/h depende de los auxiliares (a 2,2 kW sube a 53,6 km/h) y de las pérdidas fijas elegidas.'
  },
  s6: [
    '<b>Reglamento (UE) 2017/1151 (WLTP)</b>: procedimiento de ensayo de consumo y autonomía. <b>SAE J2263</b>: desaceleración libre en carretera.',
    'Ehsani, Gao, Longo y Ebrahimi, <i>Modern Electric, Hybrid Electric and Fuel Cell Vehicles</i> (ecuación de carga y rendimiento del tren).',
    'Guzzella y Sciarretta, <i>Vehicle Propulsion Systems</i> (energía por kilómetro y regeneración).',
    'Atmósfera estándar internacional (ISA, ISO 2533) para la densidad del aire con la altura.'
  ]
});
