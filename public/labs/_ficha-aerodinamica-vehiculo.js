/* Ficha técnica · Aerodinámica: arrastre, sustentación y consumo — contenido específico del lab */
fichaTecnica({
  title: 'Aerodinámica: arrastre, sustentación y consumo',
  intro: 'Este laboratorio representa un <b>coche deportivo de calle</b> en un <b>túnel de viento con cinta rodante</b>. La balanza mide el arrastre y la carga aerodinámica; el humo, que cambia de color con la velocidad local del aire, es una <b>visualización didáctica, no CFD</b>. Las fuerzas, la potencia, la velocidad máxima, el consumo y el agarre en curva salen de coeficientes y ecuaciones calculadas y verificadas; es un modelo para razonar, no un ensayo de homologación.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> fuerzas por coeficientes (F<sub>d</sub> = ½ρC<sub>d</sub>Av², F<sub>z</sub> = ½ρC<sub>z</sub>Av²), <b>alerón trasero</b> como ala finita (pendiente a = a<sub>0</sub>/(1 + a<sub>0</sub>/(π·AR·e)), carga a 0° por la curvatura, <b>pérdida</b> a partir de 14° y arrastre de perfil), <b>arrastre inducido</b> C<sub>d,i</sub> = k·C<sub>z</sub>², <b>efecto suelo</b> que crece al bajar el coche y se <b>estrangula</b> por debajo de 50 mm, sustentación propia de la carrocería, equilibrio de potencia para la velocidad máxima, rodadura que sube con la carga (C<sub>rr</sub>·(m·g + F<sub>z</sub>)), consumo a velocidad constante y agarre estático por eje con sensibilidad de carga. En el dibujo: coche con alerón regulable, divisor y difusor, cinta rodante que avanza con el viento, rastrillo de 62 boquillas de humo, tirante con celda de carga y flechas de fuerza.',
    omitidos: [
      '<b>CFD y túnel real</b>: el humo sigue un campo construido con piezas (deslizamiento sobre el cuerpo, vórtice de herradura del alerón, aceleración de Bernoulli bajo el suelo, estela con el déficit de cantidad de movimiento del arrastre). No resuelve Navier–Stokes, no hay capa límite, desprendimientos ni turbulencia calculados.',
      '<b>Coeficientes medidos</b>: C<sub>d</sub>, C<sub>z</sub> y la ley del suelo son correlaciones didácticas razonables para un coche deportivo, no datos de un modelo concreto ni de un túnel.',
      '<b>Cabeceo, balanceo, suspensión y viento cruzado</b>: la altura al suelo la fija el alumno y es la misma en todo el coche; no hay deriva ni guiñada aerodinámica.',
      '<b>Mapa de motor</b>: potencia máxima constante y rendimiento térmico fijo (0,30); sin cambios de marcha, sin refrigeración (el arrastre de los radiadores va dentro de C<sub>d0</sub>).',
      '<b>Neumático real</b>: el agarre usa μ<sub>0</sub> y una ley de sensibilidad de carga F<sub>y</sub> ∝ F<sub>z</sub><sup>1−n</sup> con n = 0,15; sin curva de deriva, temperatura ni desgaste.'
    ]
  },
  s2: {
    title: 'Parámetros del modelo y cifras de referencia',
    warn: 'Valores didácticos de un deportivo de calle. Las cifras de un coche real dependen de su forma, de sus ruedas, del flujo de refrigeración y de la altura de marcha.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Masa · área frontal · batalla', 'este lab', '1 450 kg · 2,05 m² · 2,60 m'],
      ['Densidad del aire', 'ISA, nivel del mar, 15 °C', '1,225 kg/m³'],
      ['C<sub>d</sub> de la carrocería a 80 mm', 'sin alerón ni suelo activo', '0,30 (+0,25 por metro de altura)'],
      ['Alerón', 'envergadura · cuerda · AR · e', '1,50 m · 0,40 m · 3,75 · 0,85 (S = 0,60 m²)'],
      ['Pendiente de ala finita', 'a = a<sub>0</sub>/(1 + a<sub>0</sub>/(π·AR·e))', '3,86 /rad (0,067 /°); carga a 0° por curvatura: 3°'],
      ['Pérdida del alerón', 'C<sub>L</sub> cae un 30 % en 6° y el perfil se arrastra', 'a partir de 14°'],
      ['Suelo', 'C<sub>z,f</sub> = 0,35·(80 mm/h)<sup>0,8</sup>', 'estrangulado por debajo de 50 mm (conserva 60 % a 40 mm)'],
      ['Rodadura · rendimientos', 'C<sub>rr</sub> · η<sub>transmisión</sub> · η<sub>térmico</sub>', '0,011 · 0,90 · 0,30 (PCI gasolina 32 MJ/L)'],
      ['Potencia máxima', 'al cigüeñal', '200 kW'],
      ['Agarre', 'μ<sub>0</sub> · sensibilidad de carga n · curva del dock', '1,10 · 0,15 · R = 250 m'],
      ['Puntos de aplicación (x desde el centro de masa)', 'alerón · suelo · carrocería (sustentación)', '−2,25 · +0,90 · +0,30 m'],
      ['Referencia de libro', 'C<sub>d</sub> de turismos actuales', '≈ 0,25 a 0,35']
    ]
  },
  s3: [
    'En un túnel real: <b>trabajo con personal del túnel</b>, ventilador y sección de pruebas cerrados durante el ensayo, y protección auditiva.',
    'Instrumentación: balanza de seis componentes bajo el coche, sensores de presión en la superficie y rastrillo de Pitot en la estela.',
    'Nunca se acerca nadie a la cinta rodante en marcha ni a un alerón con el túnel encendido.',
    'En pista, un cambio de altura o de ángulo se prueba primero a baja velocidad y con el equipo de seguridad del circuito.'
  ],
  s4: {
    intro: 'Esta práctica enseña a <b>razonar</b> sobre las fuerzas del aire; el ensayo real sigue otros pasos:',
    items: [
      '<b>Ensayo de túnel con cinta rodante (SAE J2084 y J1252)</b>: medir F<sub>d</sub> y F<sub>z</sub> a varias velocidades y comprobar que los coeficientes C<sub>d</sub> y C<sub>z</sub> no cambian con la velocidad.',
      '<b>Barrido de ángulo de alerón y de altura al suelo</b>: dibujar la polar C<sub>z</sub>–C<sub>d</sub> y localizar la pérdida y el estrangulamiento.',
      '<b>Ensayo de desaceleración (coast-down, SAE J2263)</b> en pista para obtener C<sub>d</sub>·A y C<sub>rr</sub>.',
      '<b>Medida de consumo a velocidad constante (WLTP)</b>, que incluye el cambio de marchas y el mapa del motor que aquí se omiten.'
    ]
  },
  s5: {
    modela: 'las <b>fuerzas del aire por coeficientes</b>, con el C<sub>z</sub> como suma del alerón (ala finita con pérdida), del suelo (ley de potencia con estrangulamiento) y de la sustentación de la carrocería, y el C<sub>d</sub> como suma de la carrocería, el perfil, el <b>inducido (k·C<sub>z</sub>²)</b> y el del suelo; la <b>velocidad máxima</b> por equilibrio de potencia (raíz cúbica sin rodadura, Cardano con ella, bisección con la carga); el <b>consumo</b> a velocidad constante; las <b>cargas por eje</b> con el reparto de cada fuerza por estática y la transferencia por el arrastre a la altura de su centro de presión; el <b>agarre en curva</b> con sensibilidad de carga, y la velocidad máxima en una curva de 250 m; y un campo de flujo didáctico con vórtice de herradura (Biot–Savart, Γ = ½·c·C<sub>L</sub>·U), aceleración de Bernoulli bajo el suelo y estela con déficit de cantidad de movimiento igual al arrastre. La verificación (66 pruebas) comprueba cada fórmula, la ley de escala v², la v<sub>max</sub> contra Cardano y contra el equilibrio de potencia, el consumo, el equilibrio de momentos de cabeceo, el vórtice contra Γ/(2πd) y la integral de la estela contra C<sub>d</sub>·A/2.',
    noModela: 'la turbulencia, la capa límite y los desprendimientos del flujo (el humo es una animación coherente con las ecuaciones, no una solución de Navier–Stokes), la interacción del alerón con la estela del techo, el efecto del viento cruzado y de la guiñada, el cabeceo y el balanceo del coche, la refrigeración, el mapa de motor y los cambios de marcha. <b>No es CFD ni una certificación</b>: las cifras de carga, de consumo y de velocidad máxima pertenecen a ESTE coche con ESTAS correlaciones y no son leyes. La pérdida a 14° y el estrangulamiento a 50 mm son valores didácticos; cada alerón y cada fondo plano reales tienen los suyos.'
  },
  s6: [
    '<b>SAE J1252</b>: procedimientos de túnel de viento para vehículos. <b>SAE J2084</b>: túneles de viento con cinta rodante. <b>SAE J2263</b>: desaceleración libre en carretera.',
    '<b>Reglamento (UE) 2017/1151 (WLTP)</b>: procedimiento de ensayo de consumo y emisiones.',
    'Hucho, <i>Aerodynamics of Road Vehicles</i>; Katz, <i>Race Car Aerodynamics</i>; Anderson, <i>Fundamentals of Aerodynamics</i>.',
    'Milliken y Milliken, <i>Race Car Vehicle Dynamics</i>, sobre la sensibilidad de carga del neumático.'
  ]
});
