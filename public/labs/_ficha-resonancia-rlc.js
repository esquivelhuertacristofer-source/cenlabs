fichaTecnica({
  title: 'Resonancia RLC: Sintoniza, Mide Q y Caracteriza el Ancho de Banda',
  intro: 'En la práctica anterior (impedancias RLC) se midió Z=R+jX en una sola frecuencia a la vez. Aquí se recorre un rango continuo de frecuencias y se traza |Z(f)| completa: como XL=ωL crece con la frecuencia mientras XC=1/(ωC) decrece, existe una frecuencia exacta f₀=1/(2π√(LC)) donde ambas reactancias se cancelan — idéntica fórmula en serie y en paralelo, porque depende solo de L y C. En serie, esa cancelación deja |Z| en su mínimo (Z=R, corriente máxima); en paralelo, la misma cancelación —vista en la admitancia Y=1/R+j(ωC−1/ωL)— deja |Z| en su máximo (Z=1/Y=R). Alrededor de f₀, las frecuencias de media potencia f₁ y f₂, donde |Z| se aleja del extremo por un factor √2, definen el ancho de banda Δf=f₂−f₁ y el factor de calidad Q=f₀/Δf (equivalente a Q_serie=ω₀L/R y Q_paralelo=R/(ω₀L)).',
  s1: {
    presentes: [
      'Modelo exacto de resonancia en ambas topologías: f₀=1/(2π√(LC)) idéntica en serie y paralelo; |Z(f)| calculada sin aproximación en cada muestra del barrido a partir del mismo modelo de impedancia compleja de la práctica anterior (serie: suma directa R+j(XL−XC); paralelo: suma de admitancias, Z=1/Y)',
      'Curva de barrido analítica (sin ruido de muestreo) sobre una ventana de 0.25·f₀ a 3·f₀ con 601 puntos, trazada en tiempo real en el analizador simulado del pizarrón',
      'Tres cursores de medición: uno de pico/valle que el usuario ubica por inspección visual del extremo de la curva (sin búsqueda automática), y dos de media potencia (f₁, f₂) que se ajustan solos (snap) al cruce del nivel objetivo |Z(f₀)|·√2 (serie) o /√2 (paralelo), calculado en vivo desde la lectura ACTUAL del cursor de pico/valle — no desde el extremo verdadero',
      'Triángulo de impedancia R–X sincronizado con el cursor de pico/valle: se aplana visualmente (X≈0) exactamente en resonancia, dando una segunda vía de verificación cualitativa independiente de los cursores del analizador',
      'Filtro de elegibilidad Q∈[1.2,18] sobre las 128 combinaciones posibles de topología×R×L×C (104 elegibles) y filtro de generación de rondas del Reto basado en el peor error de recuperación del componente sellado bajo perturbación de ±1 muestra de índice en los tres cursores — verificado numéricamente antes de implementar: error máximo de f₀ 0.63%, error máximo de Q 20.14%, 312/312 = 100% de aceptación tras aplicar el filtro de degeneración (≤20% de error, umbral interno más estricto que la tolerancia final de calificación)',
      'Calificación en dos etapas independientes: el modo Medición evalúa la lectura de f₀ y Q por cursores (tolerancias ±5% y ±22% respectivamente, calibradas contra el error numérico real de medición); el modo Reto evalúa el componente recuperado tras despejarlo con las ecuaciones de inversión de la topología activa (tolerancia ±25%)',
    ],
    omitidos: [
      'Componentes reales con pérdidas parásitas — R, L y C se modelan como elementos ideales puros, sin resistencia de devanado en L ni resistencia serie equivalente o fugas en C',
      'Ruido de instrumentación o ancho de banda finito del analizador — la única fuente de error de medición es el paso discreto (muestreo) del cursor sobre una curva analítica, no ruido añadido a la señal',
      'Resonancias múltiples, circuitos de más de tres elementos o redes mixtas serie-paralelo — el banco cubre estrictamente los dos casos canónicos de dos ramas (serie pura, paralelo puro) con un elemento de cada tipo, igual que la práctica anterior',
      'Fenómenos de resonancia trifásica, mecánica o acústica — el alcance es estrictamente el circuito RLC monofásico de corriente alterna',
      'Fase θz en el dominio del tiempo — a diferencia de la práctica anterior (que medía desfase por cruces por cero en un osciloscopio), aquí la medición ocurre sobre la curva |Z(f)| en el dominio de la frecuencia, no sobre trazas temporales',
    ],
  },
  s2: {
    title: 'Elementos del banco',
    warn: 'Valores configurables o sellados por el modo activo — en un instrumento real, el generador de barrido y el detector de nivel tendrían su propia precisión de frecuencia y amplitud, no modelada aquí.',
    rows: [
      ['Generador de barrido (GEN1)', 'Fuente que recorre la frecuencia de 0.25·f₀ a 3·f₀', 'Barrido analítico, 601 puntos', 'Siempre visible; alimenta la curva |Z(f)| trazada en el analizador del pizarrón'],
      ['Detector de nivel (GEN2)', 'Pantalla digital de f₀ y Q', 'Calculados en vivo (Explora) o sellados (Medición, Reto)', 'Revela el valor solo cuando el modo activo lo permite, igual que el resto del banco de prácticas'],
      ['R, L, C', 'Componentes del circuito', 'L∈{10,22,47,100} mH · C∈{1,2.2,4.7,10} µF · R_serie∈{8,14,22,33} Ω · R_paralelo∈{220,470,1000,2200} Ω', 'Configurables en Explora; uno de los tres puede quedar sellado en el modo Reto, según el filtro de degeneración'],
      ['Topología', 'Serie o paralelo', 'Selector de dos posiciones', 'f₀ es idéntica en ambas, pero el extremo de |Z(f)| se invierte (mínimo en serie, máximo en paralelo) y la fórmula de Q cambia (ω₀L/R vs. R/(ω₀L))'],
      ['Analizador de barrido', 'Pizarrón con triángulo de impedancia y curva |Z(f)|', 'Autoescala de |Z|, rejilla de 10×8 divisiones', 'Tres cursores independientes: pico/valle (manual) y dos de media potencia (snap automático al nivel √2)'],
    ],
  },
  s3: [
    'Generador de barrido de frecuencia (GEN1) con pantalla digital de topología activa',
    'Detector de nivel (GEN2) con pantalla digital de f₀/Q, sellado según el modo',
    'Analizador de barrido simulado en el pizarrón: triángulo de impedancia R–X y curva |Z(f)| con tres cursores',
    'Cajón de referencia del instrumento físico sobre el banco (la medición ocurre en el pizarrón)',
    'Cableado de banco codificado por color (verde azulado = canal 1, ámbar = canal 2)',
  ],
  s4: {
    intro: 'Procedimiento para explorar, medir la resonancia y resolver un componente sellado:',
    items: [
      'En el modo Explora, elige la topología (serie o paralelo) y ajusta libremente R, L, C. Observa cómo se mueve f₀ sobre la curva |Z(f)| según L y C, y cómo cambia la FORMA de la curva (angosta o ancha) según Q — compara la misma combinación de L y C en serie contra paralelo para notar cómo se invierte el extremo (mínimo vs. máximo) sin que f₀ cambie.',
      'En el modo Medición, el circuito es conocido pero f₀ y Q están sellados. Ubica el cursor teal de pico/valle por inspección visual del extremo de la curva (o del punto donde el triángulo de impedancia se aplana, X≈0) — los dos cursores ámbar de media potencia se ajustan solos al nivel objetivo calculado desde tu lectura del pico/valle. Presiona "Medir resonancia" y compara el resultado contra las filas selladas del panel.',
      'En el modo Reto, un componente (R, L o C, según la ronda) queda sellado; los otros dos y la topología son conocidos. Mide f₀ y Q con el analizador y despeja el componente oculto invirtiendo las ecuaciones de resonancia de la topología activa. Ingresa tu resultado y presiona "Comprobar predicción" — el sistema califica con una tolerancia de ±25% sobre el valor real, calibrada numéricamente para absorber el error propio de una medición gráfica por cursores.',
    ],
  },
  s5: {
    modela: 'Resonancia RLC exacta en serie y paralelo (f₀=1/(2π√(LC)) idéntica en ambas; Q_serie=ω₀L/R, Q_paralelo=R/(ω₀L); Δf=f₀/Q; f₁,f₂ definidas por |Z(f₁,f₂)|=|Z(f₀)|·√2 en serie o /√2 en paralelo), con el mismo modelo de impedancia compleja exacto de la práctica anterior; curva |Z(f)| analítica sobre una ventana centrada en f₀, con snap de los cursores de media potencia al cruce de nivel objetivo calculado en vivo desde la lectura actual del cursor de pico/valle; filtro de elegibilidad Q∈[1.2,18] y filtro de generación de rondas del Reto basado en el peor error de recuperación bajo perturbación de ±1 muestra en los tres cursores, verificados numéricamente antes de implementar (128 combinaciones, 104 elegibles, error máx. f₀ 0.63%, error máx. Q 20.14%, 312/312 = 100% de aceptación tras el filtro).',
    noModela: 'Componentes reales con pérdidas parásitas (R, L, C ideales puros); ruido de instrumentación ni ancho de banda finito del analizador — la única fuente de error es el paso discreto del cursor; resonancias múltiples, circuitos de más de tres elementos ni redes mixtas serie-paralelo; fenómenos de resonancia trifásica o mecánica; fase θz en el dominio del tiempo (aquí se mide sobre |Z(f)|, no sobre cruces por cero de un osciloscopio, a diferencia de la práctica anterior). Las tolerancias (±5% en f₀, ±22% en Q, ±25% en el componente recuperado) son un margen pedagógico calibrado numéricamente, no una especificación de instrumento real.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): resonancia serie y paralelo, factor de calidad Q, ancho de banda y frecuencias de media potencia.',
    'Boylestad, R. — Introductory Circuit Analysis (Pearson): resonancia RLC, curvas de respuesta en frecuencia y selectividad de circuitos sintonizados.',
    'IEC 60027-1 — Letter symbols to be used in electrical technology: notación de impedancia, reactancia, frecuencia de resonancia y factor de calidad.',
    'IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering: convenciones de símbolos para resonancia y ancho de banda.',
  ],
});
