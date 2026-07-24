fichaTecnica({
  title: 'Sistemas Trifásicos Y/Δ Balanceados y Secuencia de Fases',
  intro: 'Una fuente trifásica de tensión de línea VL alimenta una carga balanceada de tres impedancias iguales Z=|Z|∠φ. La práctica compara las dos formas de conectar esa carga —estrella (Y) y delta (Δ)— y muestra que, con la misma impedancia y la misma tensión de línea, la conexión Δ entrega exactamente el triple de potencia que la Y, porque cada impedancia queda sometida a VL en lugar de VL/√3. Además se estudia la secuencia de fases (ABC positiva vs ACB negativa): en régimen balanceado no altera ninguna magnitud (P, Q, corrientes), pero invierte el sentido de giro de un motor de inducción, y permutar dos líneas basta para invertirlo.',
  s1: {
    presentes: [
      'Relaciones exactas de un sistema trifásico balanceado en régimen permanente senoidal: en la fuente VL=√3·VF; en carga Y cada impedancia ve VF=VL/√3 con corriente de línea igual a la de fase (IL=IF); en carga Δ cada impedancia ve VF=VL con IL=√3·IF',
      'Potencia trifásica total P=√3·VL·IL·cosφ=3·VF·IF·cosφ; potencia reactiva Q=√3·VL·IL·senφ, aparente S=√3·VL·IL y factor de potencia FP=cosφ, con la relación S²=P²+Q²',
      'Resultado clave verificado numéricamente (node -e, ratio exacto=3): a igual |Z| y VL, la conexión Δ entrega exactamente 3 veces la potencia de la Y, porque la potencia por rama va como VF²/|Z| y (VF_Δ/VF_Y)²=(√3)²=3',
      'Corriente de neutro nula: en la carga balanceada las tres corrientes de fase, iguales en magnitud y a 120°, suman fasorialmente cero (IA+IB+IC=0), por lo que el neutro no transporta corriente',
      'Secuencia de fases ABC (positiva) vs ACB (negativa): invertir la secuencia —o equivalentemente permutar dos de las tres líneas— invierte el sentido de giro del campo rotatorio y del motor, sin alterar ninguna magnitud del sistema balanceado',
      'Reto verificado: cada escenario (VL,|Z|,φ) tiene exactamente 1 par (conexión,|Z|) que alcanza la potencia objetivo dentro de ±8% (min=max=1 solución sobre el catálogo completo), más un objetivo de giro independiente resuelto por la secuencia',
    ],
    omitidos: [
      'Desbalance de cargas o de fuente: las tres ramas se modelan siempre idénticas, por lo que la corriente de neutro es cero por construcción; el estudio de cargas desbalanceadas y componentes simétricas queda fuera',
      'Impedancia de los conductores de línea y del neutro, y las caídas de tensión asociadas: la fuente entrega VL ideal en los terminales de la carga',
      'Armónicos y cargas no lineales (variadores, rectificadores): el modelo es de régimen permanente senoidal puro a una sola frecuencia',
      'Transitorios de arranque del motor —par, deslizamiento, corriente de arranque reales—: el motor se representa solo como indicador del sentido de giro que fija la secuencia',
      'El sentido de giro concreto (ABC↻ horario / ACB↺ antihorario) es una convención del simulador; el sentido físico real depende del devanado y del criterio de conexión. Lo que sí es general y no depende de la convención es que invertir la secuencia invierte el giro',
      'Efectos térmicos, saturación magnética del núcleo del motor y pérdidas en el hierro',
    ],
  },
  s2: {
    title: 'Elementos del sistema trifásico',
    warn: 'En Explora todos los parámetros son ajustables; en Diseña y Reto la tensión VL y el ángulo φ vienen dados por el escenario, y el reto consiste en elegir conexión, |Z| y secuencia. No hay componente sellado que recuperar: el desafío es de análisis y conexión, no de lectura instrumental.',
    rows: [
      ['Fuente trifásica', 'Suministra tensión de línea VL con 3 fases a 120°', 'VL∈{220, 440} V (VF fuente=VL/√3)', 'Tensiones normalizadas de baja tensión; VF de fuente siempre VL/√3'],
      ['Carga balanceada', '3 impedancias iguales Z=|Z|∠φ conectables en Y o Δ', '|Z|∈{6,8,10,12,15,20} Ω', 'Las tres ramas son idénticas: el sistema permanece balanceado en todo momento'],
      ['Ángulo de la carga', 'Desfase φ entre tensión y corriente de cada rama', 'φ∈{0°, 30°} (FP=1.000 / 0.866)', 'φ=0° carga resistiva; φ=30° carga inductiva típica'],
      ['Conexión', 'Estrella (Y) o Delta (Δ)', 'Y: VF=VL/√3, IL=IF · Δ: VF=VL, IL=√3·IF', 'A igual |Z| y VL, Δ entrega el triple de potencia que Y'],
      ['Nodo neutro (N)', 'Une un extremo de las 3 impedancias en Y', 'In=0 en balanceado', 'Solo existe en estrella; en Δ no hay neutro'],
      ['Motor de inducción', 'Indica el sentido de giro según la secuencia', 'ABC↻ horario / ACB↺ antihorario', 'Permutar dos líneas invierte el giro sin cambiar magnitudes'],
    ],
  },
  s3: [
    'Selectores de tensión de línea VL y ángulo de carga φ (en Explora)',
    'Selector de |Z| (impedancia por rama) y de conexión Y/Δ',
    'Selector de secuencia de fases ABC/ACB',
    'Pizarrón con el diagrama fasorial: estrella de tensiones de fase, triángulo de tensiones de línea (VL=√3·VF) e indicador de secuencia',
    'Telemetría en vivo: VF sobre Z, IF, IL, P, Q, S, FP, corriente de neutro y sentido de giro',
    'Panel de reto con potencia objetivo y giro requerido ocultos hasta comprobar',
  ],
  s4: {
    intro: 'Procedimiento para explorar las conexiones, diseñar y resolver el reto:',
    items: [
      'En Explora, ajusta VL, |Z|, φ, la conexión (Y/Δ) y la secuencia. Observa en el pizarrón cómo el triángulo dorado que une las puntas de los tres fasores de fase tiene por lado la tensión de línea VL=√3·VF, y cómo al pasar de Y a Δ —con la misma Z y VL— la potencia se triplica. Cambia la secuencia a ACB y verifica que el motor invierte el giro sin que P, Q ni las corrientes cambien.',
      'En Diseña, con VL y φ dados, alcanza la potencia de línea objetivo eligiendo conexión y |Z|, y ajusta la secuencia al giro pedido. La telemetría te dice en vivo si la potencia está dentro de ±8% y si el giro coincide; este modo no califica.',
      'En Reto, se sortea un escenario con VL y φ fijos, una potencia objetivo y un sentido de giro requerido. Elige la conexión (Y/Δ) y la |Z| que dan la potencia objetivo dentro de ±8% —recuerda que Δ triplica la potencia de Y a igual Z— y la secuencia que produce el giro pedido; luego pulsa "Comprobar conexión". El sistema califica correcto solo si ambos objetivos se cumplen.',
    ],
  },
  s5: {
    modela: 'Sistema trifásico balanceado en régimen permanente senoidal: VL=√3·VF en la fuente; carga de tres impedancias iguales conectada en Y (VF=VL/√3, IL=IF) o en Δ (VF=VL, IL=√3·IF); potencia P=√3·VL·IL·cosφ con Δ entregando exactamente 3× la potencia de Y a igual |Z| y VL (verificado ratio=3 exacto); Q, S y FP=cosφ; corriente de neutro nula por balanceado; secuencia de fases ABC/ACB que invierte el sentido de giro del motor sin alterar magnitudes. El Reto está verificado numéricamente: cada escenario tiene exactamente una combinación (conexión,|Z|) que alcanza la potencia objetivo dentro de ±8%.',
    noModela: 'Desbalance de cargas o fuente y componentes simétricas (las tres ramas son idénticas, In=0 siempre); impedancia de conductores de línea/neutro y caídas de tensión; armónicos y cargas no lineales; transitorios de arranque del motor (par, deslizamiento, corriente de arranque); efectos térmicos y saturación magnética. El sentido de giro concreto ABC↻/ACB↺ es una convención del simulador —el sentido físico real depende del devanado—; lo que sí es general es que invertir la secuencia invierte el giro.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): sistemas polifásicos, conexiones Y y Δ, potencia trifásica y secuencia de fases.',
    'Boylestad, R. — Introductory Circuit Analysis (Pearson): sistemas trifásicos balanceados, relaciones de tensión y corriente en Y y Δ.',
    'Enríquez Harper, G. — El ABC de las máquinas eléctricas y de las instalaciones eléctricas industriales (Limusa): conexiones trifásicas, secuencia de fases e inversión de giro de motores.',
    'NOM-001-SEDE-2022 (Instalaciones eléctricas — utilización): sistemas trifásicos de baja tensión y conductores de neutro.',
    'IEC 60038 — tensiones normalizadas: valores de tensión de línea de baja tensión.',
    'Verificación numérica propia (sesión de construcción, node -e): ratio Δ/Y de potencia = 3 exacto; catálogo del Reto con exactamente 1 solución (conexión,|Z|) por escenario dentro de ±8%, 0 escenarios sin solución.',
  ],
});
