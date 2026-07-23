fichaTecnica({
  title: 'Potencia en CA: Mide P, Q, S y el Factor de Potencia de Cargas Reales',
  intro: 'En las prácticas anteriores se midió impedancia Z=R+jX, se barrió en frecuencia para encontrar resonancia y se leyó desfase con un osciloscopio de dos canales. Aquí se combinan dos cargas reales (resistiva, inductiva o capacitiva) en paralelo sobre el mismo bus de voltaje de 10 V y se descompone su consumo en el triángulo de potencias: potencia activa P=S·cos θ (watts, trabajo útil), potencia reactiva Q=S·sin θ (VAR, oscila entre la fuente y los campos de la carga) y potencia aparente S=V·I (VA, la que dimensiona cables y transformadores), con factor de potencia FP=cos θ=P/S. Con dos cargas en paralelo, P_total=P1+P2 y Q_total=Q1+Q2 se suman de forma exactamente directa, pero S_total NO es S1+S2 — debe recalcularse como S_total=√(P_total²+Q_total²), porque las corrientes de las dos cargas no están en fase entre sí.',
  s1: {
    presentes: [
      'Modelo exacto de potencia por carga: Z=R+jX (R∈{10,22,47,100}Ω, |X|∈{10,22,47,100}Ω según tipo resistiva/inductiva/capacitiva), I=V/|Z|, θ=atan2(X,R), S=V·I, P=S·cos θ, Q=S·sin θ, FP=P/S — sin aproximación, calculado en vivo para cada carga y para la combinación total',
      'Suma exacta de P y Q entre dos cargas en paralelo (P_total=P1+P2, Q_total=Q1+Q2), verificada numéricamente contra dos métodos independientes de cálculo: discrepancia máxima de 3.553×10⁻¹⁵ sobre 1280 combinaciones — y recálculo correcto de S_total=√(P_total²+Q_total²) como magnitud del vector suma, NO como suma de las magnitudes individuales S1+S2 (desigualdad del triángulo, verificado con casos donde S1+S2 difiere de S_total por varios VA)',
      'Triángulo de potencias en el pizarrón: cada carga se dibuja como un vector (P,Q) de magnitud S y ángulo θ, reutilizando la misma máquina de renderizado polar que las prácticas de fasores e impedancias — el vector Total es la suma vectorial visible en Explora, y su magnitud/fase se sellan según el modo',
      'Osciloscopio de dos canales reutilizado sin cambios de la práctica de impedancias: canal 1 mide el voltaje del bus (referencia de fase fija, 10∠0°), canal 2 mide la corriente TOTAL entregada a ambas cargas vía un resistor shunt de 1 Ω; medición de θ_total por diferencia de tiempo entre cruces por cero del mismo tipo (ascendente o descendente) en ambos canales',
      'Filtro de elegibilidad para las rondas de Medición y Reto: se excluye la combinación (resistiva, resistiva), que produce Q_total=0 y un triángulo degenerado sin utilidad pedagógica; el modo Reto además rota entre cuatro cantidades pedidas (P, Q, S o FP total) y descarta —antes de sellar I_total— cualquier combinación donde una perturbación típica de instrumento (±5° en fase, ±8% en amplitud) produzca más de 20% de error relativo en la cantidad pedida. Verificado numéricamente antes de implementar: aceptación global 79.8% (P 83.1%, Q 40.9% —la más restrictiva, por la baja sensibilidad de sin θ cerca de θ_total≈0°—, S 100.0%, FP 95.2%)',
      'Calificación en dos etapas independientes: el modo Medición evalúa la lectura de θ_total por cursores (tolerancia ±5°, calibrada contra el error real de la técnica de cruces por cero ya verificada en la práctica de impedancias); el modo Reto evalúa la cantidad total calculada a partir de I_total y θ_total medidos (tolerancia ±25% relativo para P/Q/S, ±0.10 absoluto para FP)',
    ],
    omitidos: [
      'Componentes reales con pérdidas parásitas — cada carga se modela como una impedancia R+jX ideal pura, sin resistencia de devanado, fugas ni efectos de temperatura',
      'Ruido de instrumentación o carga que el shunt y el osciloscopio introducirían sobre el circuito real — la única fuente de error de medición es el paso discreto (muestreo) de los cursores sobre trazas analíticas',
      'Corrección activa de factor de potencia (bancos de capacitores, filtros armónicos) — el banco mide y diagnostica P, Q, S y FP, pero no simula la corrección posterior',
      'Cargas no lineales, armónicos o desbalance trifásico — el alcance es estrictamente dos cargas lineales monofásicas en paralelo sobre un único bus senoidal a 60 Hz',
      'Facturación eléctrica real o penalizaciones tarifarias exactas — la mención a CFE en el brief es contexto de aplicación, no un modelo tarifario simulado',
    ],
  },
  s2: {
    title: 'Elementos del banco',
    warn: 'Valores configurables o sellados por el modo activo — en un instrumento real, el sensor de corriente y el osciloscopio tendrían su propia precisión de amplitud y fase, no modelada aquí.',
    rows: [
      ['Bus de voltaje (GEN1)', 'Fuente de referencia de fase', '10 V ∠ 0°, fija', 'Siempre visible; todas las mediciones de θ_total se hacen respecto a esta señal'],
      ['Sensor de corriente total (GEN2)', 'Resistor shunt de 1 Ω en serie con la fuente', 'Magnitud y/o fase de I_total, según el modo', 'Explora: ambas visibles. Medición: magnitud visible, fase sellada. Reto: ambas selladas'],
      ['Carga 1 y Carga 2', 'Impedancias R+jX en paralelo sobre el bus', 'Tipo resistiva/inductiva/capacitiva · R∈{10,22,47,100}Ω · |X|∈{10,22,47,100}Ω', 'Configurables en Explora; conocidas en Medición y Reto (solo la medición de I_total/θ_total cambia de sellado)'],
      ['Triángulo de potencias', 'Mitad izquierda del pizarrón', 'Vectores (P,Q) de Carga 1, Carga 2 y Total, escala automática', 'El vector Total (magnitud S y ángulo θ) se sella o revela según el modo activo'],
      ['Osciloscopio de 2 canales', 'Mitad derecha del pizarrón', 'CH1 = voltaje del bus · CH2 = corriente total, rejilla de 10×8 divisiones', 'Dos cursores independientes con snap automático al cruce por cero más cercano, idéntico a la práctica de impedancias'],
    ],
  },
  s3: [
    'Bus de voltaje (GEN1) con pantalla digital de magnitud y fase de referencia',
    'Sensor de corriente total (GEN2) con pantalla digital, sellada según el modo',
    'Pizarrón dividido en dos mitades: triángulo de potencias (izquierda) y osciloscopio de dos canales (derecha)',
    'Cajón de referencia del instrumento físico sobre el banco (la medición ocurre en el pizarrón)',
    'Cableado de banco codificado por color (verde azulado = canal 1, ámbar = canal 2)',
  ],
  s4: {
    intro: 'Procedimiento para explorar, medir la potencia total y resolver la cantidad pedida:',
    items: [
      'En el modo Explora, elige libremente el tipo y los valores de las dos cargas. Observa cómo el vector (P,Q) de cada carga se dibuja en el triángulo de potencias y cómo el vector Total es la suma vectorial de ambos — compara una combinación inductiva+capacitiva contra una combinación puramente resistiva para notar cuándo S_total sí coincide con S1+S2 y cuándo no.',
      'En el modo Medición, ambas cargas son conocidas pero θ_total está sellado. Alinea los dos cursores del osciloscopio al MISMO tipo de cruce por cero (ambos ascendentes o ambos descendentes) en los dos canales y presiona "Medir θ_total" — mezclar tipos de cruce distintos introduce un error sistemático de exactamente 180°.',
      'En el modo Reto, ambas cargas son conocidas pero la corriente total (magnitud y fase) está sellada. Mide θ_total con los cursores, lee la magnitud de I_total en la traza del canal 2 y calcula la cantidad pedida (P, Q, S o FP total, indicada en el panel) a partir de V, I_total y θ_total. Ingresa tu resultado y presiona "Comprobar predicción" — el sistema califica con ±25% relativo (P/Q/S) o ±0.10 absoluto (FP), tolerancias calibradas numéricamente para absorber el error propio de una medición gráfica por cursores.',
    ],
  },
  s5: {
    modela: 'Potencia en CA de dos cargas reales R+jX en paralelo sobre un bus común: P=S·cos θ, Q=S·sin θ, S=V·I, FP=P/S por carga; suma exacta P_total=P1+P2 y Q_total=Q1+Q2 (verificada numéricamente, discrepancia máxima 3.553×10⁻¹⁵ sobre 1280 combinaciones); recálculo correcto de S_total=√(P_total²+Q_total²) como magnitud del vector suma, explícitamente NO igual a S1+S2; medición de θ_total por cruces por cero en osciloscopio de dos canales, técnica idéntica a la práctica de impedancias; filtro de elegibilidad (excluye resistiva+resistiva) y filtro de generación de rondas del Reto basado en el peor error de recuperación de P/Q/S/FP bajo perturbación de ±5° en fase y ±8% en amplitud, verificados numéricamente antes de implementar (aceptación global 79.8%: P 83.1%, Q 40.9%, S 100.0%, FP 95.2%).',
    noModela: 'Componentes reales con pérdidas parásitas (cargas R+jX ideales puras); ruido de instrumentación ni carga que el shunt o el osciloscopio introducirían sobre el circuito real; corrección activa de factor de potencia; cargas no lineales, armónicos o desbalance trifásico; facturación eléctrica real o penalizaciones tarifarias exactas (la mención a CFE es contexto de aplicación, no un modelo simulado). Las tolerancias (±5° en θ_total; ±25% relativo para P/Q/S, ±0.10 absoluto para FP) son un margen pedagógico calibrado numéricamente, no una especificación de instrumento real.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): potencia instantánea y compleja, triángulo de potencias, factor de potencia en cargas combinadas.',
    'Boylestad, R. — Introductory Circuit Analysis (Pearson): potencia en CA, potencia aparente/activa/reactiva, corrección de factor de potencia.',
    'IEC 60050-131 — International Electrotechnical Vocabulary, Part 131: Circuit theory: definiciones y símbolos de potencia activa, reactiva y aparente.',
    'Verificación numérica propia (sesión de construcción, node -e sobre script standalone, 8 secciones): aditividad de P y Q, no-aditividad de S, filtro de elegibilidad y de degeneración de rondas.',
  ],
});
