fichaTecnica({
  title: 'Impedancias RLC: Circuitos Serie y Paralelo en Corriente Alterna',
  intro: 'Un circuito con resistencia (R), inductancia (L) y capacitancia (C) presenta una impedancia compleja Z=R+jX que combina oposición resistiva y reactiva. En serie, los tres elementos comparten la misma corriente y sus impedancias se suman directamente: Z=R+j(ωL−1/ωC). En paralelo comparten el mismo voltaje y se suman sus admitancias (inversos de la impedancia): Y=1/R+j(ωC−1/ωL), con Z=1/Y. La magnitud |Z| limita la corriente (I=V/|Z|) y el ángulo θz es el desfase que el circuito introduce entre voltaje y corriente — dividir fasores resta ángulos, así que la corriente queda exactamente en φᵢ=−θz respecto al voltaje de referencia.',
  s1: {
    presentes: [
      'Modelo exacto de impedancia compleja en ambas topologías: serie por suma directa de R, jXL y −jXC; paralelo por suma de admitancias (Y=1/R+j(ωC−1/ωL), Z=1/Y), con reactancias XL=ωL y XC=1/(ωC) calculadas sin aproximación para cualquier combinación de R, L, C y frecuencia',
      'Corriente resultante I=V/|Z| con fase exacta φᵢ=−θz, consecuencia directa de la aritmética de división de fasores (no un valor configurado por separado)',
      'Sensado de corriente por resistor shunt de precisión (1 Ω) en serie con la rama: su voltaje es numéricamente igual a la corriente (v_shunt=Rs·i) y se observa en el canal 2 del osciloscopio, la misma técnica de instrumentación de una pinza de corriente real',
      'Reutilización exacta del mecanismo de medición de desfase por cruces por cero (cursores con snap automático, cálculo Δt→ángulo, detección del error sistemático de 180° por mezcla de tipo de cruce) ya verificado en la práctica anterior (fasores y medición de desfase), ahora aplicado a un par voltaje/corriente derivado de una impedancia real en vez de una fase configurada directamente',
      'Filtro de degeneración en el modo Reto: antes de sellar un componente (R, L o C) se descarta —numéricamente, por fuerza bruta— cualquier combinación de topología, componentes y frecuencia donde un error típico de instrumento (±5° en θz, ±8% en |Z|) produzca más de 20% de error en el valor recuperado; verificado en 1,536 combinaciones (exactitud perfecta de las fórmulas de inversión con perturbación nula, 46.3% de aceptación global del filtro)',
      'Calificación en dos etapas independientes: el modo Medición evalúa solo la lectura de θz por cursores (tolerancia ±5°); el modo Reto evalúa el componente recuperado tras despejarlo de |Z| y θz (tolerancia ±25%, proporcional al valor real)',
    ],
    omitidos: [
      'Resonancia, factor de calidad Q ni ancho de banda — el comportamiento de Z(ω) se explora punto por punto en frecuencias discretas (60/120/250/500 Hz), no como barrido continuo; ese análisis es el tema declarado de la siguiente práctica del backlog (d1-11, resonancia RLC)',
      'Carga que el resistor shunt o el osciloscopio introducen sobre el circuito real — ambos instrumentos se modelan como ideales, sin impedancia de entrada propia ni efecto sobre la corriente que miden',
      'Pérdidas parásitas en bobinas (resistencia de devanado) ni en capacitores (resistencia serie equivalente, fugas) — L y C se modelan como elementos reactivos puros, sin componente resistiva parásita',
      'Ruido de instrumentación, ancho de banda finito del osciloscopio o transitorios de arranque — todas las señales son senoidales puras en estado estacionario desde t=0, igual que en la práctica anterior',
      'Circuitos RLC de más de tres elementos, redes mixtas serie-paralelo o análisis con transformada de Laplace — el banco cubre estrictamente los dos casos canónicos de dos ramas (serie pura, paralelo puro) con un elemento de cada tipo',
    ],
  },
  s2: {
    title: 'Elementos del banco',
    warn: 'Valores configurables o sellados por el modo activo — en un banco real, cada componente tendría su propia tolerancia de fabricación (p. ej. ±5% en resistores, ±10-20% en bobinas y capacitores comerciales).',
    rows: [
      ['Fuente (CH1)', 'Generador de voltaje de referencia', 'V=10 V, φ=0°, fijo', 'Siempre visible; es la referencia angular contra la que se mide la corriente en todos los modos'],
      ['Sensor de corriente (CH2)', 'Resistor shunt de precisión en serie con la rama', 'Rs=1 Ω', 'Su voltaje es numéricamente igual a la corriente de la rama; visible en el canal 2 del osciloscopio, sellado parcial o totalmente según el modo'],
      ['R, L, C', 'Componentes del circuito', 'R∈{10,22,47,100} Ω · L∈{10,22,47,100} mH · C∈{2.2,4.7,10,22} µF', 'Configurables en Explora; uno de los tres puede quedar sellado en el modo Reto, según el filtro de degeneración'],
      ['Topología', 'Serie o paralelo', 'Selector de dos posiciones', 'Cambia por completo la fórmula de Z (suma directa vs. suma de admitancias) aunque R, L y C sean idénticos'],
      ['Osciloscopio', 'Instrumento simulado de dos trazos', 'Ventana ≈3.3 periodos, rejilla volts/división y amperios/división con autoescala', 'Cursores independientes por canal con snap automático al cruce por cero más cercano'],
      ['Diagrama fasorial', 'Pizarrón polar sincronizado', 'Escala común V/V_max y I/(amps_div·4)', 'Dibuja el vector de voltaje (referencia) y de corriente en tiempo real; el vector de corriente se oculta u opaca según lo que el modo activo permita revelar'],
    ],
  },
  s3: [
    'Fuente de voltaje senoidal fija (10 V, 0°) con pantalla digital',
    'Resistor shunt de precisión (1 Ω) como sensor de corriente, con pantalla digital de magnitud y fase',
    'Osciloscopio simulado de dos trazos con cursores de cruce por cero independientes y autoescala de amperios/división',
    'Diagrama fasorial polar sincronizado en tiempo real con el osciloscopio',
    'Cableado de banco codificado por color (verde azulado = canal 1/voltaje, ámbar = canal 2/corriente)',
  ],
  s4: {
    intro: 'Procedimiento para explorar, medir y resolver un componente sellado:',
    items: [
      'En el modo Explora, elige la topología (serie o paralelo) y ajusta libremente R, L, C y la frecuencia con los controles del panel. Observa en tiempo real cómo cambian |Z|, θz, la corriente I y las trazas de voltaje/corriente en el osciloscopio y el diagrama fasorial — compara la misma combinación de R, L y C en serie contra paralelo para notar cuánto cambia Z.',
      'En el modo Medición, el circuito es conocido pero θz está sellado. Arrastra el cursor de cada canal sobre el osciloscopio: al soltarlo, se ajusta automáticamente al cruce por cero más cercano de esa señal. Presiona "Medir θz" y verifica que ambos cursores usaron el MISMO tipo de cruce (ambos ascendentes o ambos descendentes) antes de confiar en el resultado — si no coinciden, el sistema señala el error sistemático de 180° explícitamente, igual que en la práctica anterior.',
      'En el modo Reto, un componente (R, L o C, según la ronda) queda sellado; los otros dos y la frecuencia son conocidos. Mide |Z| y θz con el osciloscopio, y despeja el componente oculto con las ecuaciones de inversión de la topología activa (distintas para serie y paralelo). Ingresa tu resultado y presiona "Comprobar predicción" — el sistema califica con una tolerancia de ±25% sobre el valor real, un margen pedagógico que absorbe el error propio de una medición gráfica por cursores.',
    ],
  },
  s5: {
    modela: 'Modelo exacto de impedancia compleja en topología serie (suma directa R+j(XL−XC)) y paralelo (suma de admitancias, Z=1/Y), con reactancias XL=ωL y XC=1/(ωC) sin aproximación; corriente I=V/|Z| con fase exacta φᵢ=−θz derivada de la división de fasores; sensado de corriente idealizado por resistor shunt (1 Ω) sin efecto de carga; reutilización exacta del mecanismo de medición de desfase por cruces por cero (snap automático, detección del error sistemático de 180°); filtro de degeneración verificado numéricamente (1,536 combinaciones) que garantiza que todo componente sellado sea recuperable dentro de tolerancia ante un error típico de instrumento; calificación en dos etapas independientes (θz en Medición, componente recuperado en Reto).',
    noModela: 'Resonancia, factor de calidad Q ni ancho de banda (Z(ω) continuo) — tema de la siguiente práctica del backlog; carga o efecto de impedancia de entrada del osciloscopio y el shunt sobre el circuito real; pérdidas parásitas en bobinas o capacitores (resistencia de devanado, ESR, fugas); ruido de instrumentación, ancho de banda finito ni transitorios de arranque; circuitos RLC de más de tres elementos o redes mixtas serie-paralelo — el banco cubre estrictamente los dos casos canónicos de dos ramas con un elemento de cada tipo.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E. y Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill): impedancia compleja, circuitos RLC serie y paralelo en régimen senoidal permanente.',
    'Boylestad, R. — Introductory Circuit Analysis (Pearson): reactancia inductiva y capacitiva, análisis fasorial de circuitos serie-paralelo de CA.',
    'IEC 60027-1 — Letter symbols to be used in electrical technology: notación de impedancia, reactancia y fasores de corriente alterna.',
    'IEEE Std 280 — Standard Letter Symbols for Quantities Used in Electrical Science and Electrical Engineering: convenciones de símbolos para impedancia y ángulos de fase.',
    'Manuales de aplicación de osciloscopios (p. ej. Tektronix, "XYZs of Oscilloscopes") — medición de corriente por resistor shunt y de desfase por cruces por cero como métodos estándar de instrumentación.',
  ],
});
