fichaTecnica({
  title: 'Transitorio RC',
  intro: 'Al conectar o desconectar una fuente de CD de un capacitor a través de un resistor, el voltaje sobre el capacitor no cambia instantáneamente: sigue una curva exponencial gobernada por la constante de tiempo τ = R·C. Este banco no muestra la curva ya calculada — la mide, con un osciloscopio simulado que exige elegir una base de tiempo razonable y leer con un cursor el cruce del 63.2 %/36.8 % de V, exactamente el procedimiento que usa un técnico para caracterizar un capacitor de valor desconocido.',
  s1: {
    presentes: [
      'Respuesta exponencial exacta de un circuito RC serie de primer orden: carga v(t)=V(1−e^(−t/τ)) y descarga v(t)=V·e^(−t/τ)',
      'Relación τ = R·C verificada numéricamente contra la traza mostrada, en 16 combinaciones de R y C (serie E12)',
      'Base de tiempo (time/div) discreta con secuencia 1-2-5, como el dial físico de un osciloscopio real — una elección incorrecta corta o comprime la traza',
      'Cursor deslizante de medición manual sobre la traza, con referencia punteada en 63.2 % (carga) o 36.8 % (descarga) de V',
      'Reto de caja parcialmente sellada: R conocida, C desconocida, se despeja C=τ_medido/R a partir de una medición real hecha por el estudiante',
      'Cambio de fase carga/descarga sobre el mismo circuito, mostrando la simetría especular de ambas curvas',
    ],
    omitidos: [
      'Resistencia de fuente y resistencia serie equivalente (ESR) del capacitor — modelo de parámetros concentrados ideal',
      'Efecto de carga del propio osciloscopio (impedancia de entrada finita) sobre el circuito medido',
      'Tolerancias reales de fabricación de resistores y capacitores (el simulador usa valores nominales exactos, salvo en el reto donde el valor de C es intencionalmente desconocido para el estudiante)',
      'Ruido de instrumento, jitter de disparo (trigger) o cuantización del ADC de un osciloscopio digital real',
      'Circuitos RC de segundo orden o con múltiples constantes de tiempo — este laboratorio cubre solo el caso de primer orden con un único R y un único C',
    ],
  },
  s2: {
    title: 'Elementos del circuito',
    warn: 'Valores nominales usados por el modelo — en un banco real cada componente tendría su propia tolerancia de fabricación.',
    rows: [
      ['V', 'Fuente ideal de CD', '12 V', 'Alimenta el circuito en la fase de carga; se modela sin resistencia interna'],
      ['R', 'Resistor de carga/descarga', '1 kΩ – 10 kΩ (serie E12)', 'Visible siempre, incluso en el modo Reto; fija τ junto con C'],
      ['C', 'Capacitor', '100 nF – 4.7 µF', 'Sellado en el modo Reto: se caracteriza indirectamente vía τ=R·C, no se lee directamente'],
      ['Osciloscopio', 'Instrumento simulado', 'Base de tiempo 10 µs/div – 200 ms/div', 'Grilla de 10×8 divisiones; volts/div fijo en V/8'],
    ],
  },
  s3: [
    'Osciloscopio de un canal con base de tiempo seleccionable y cursor de medición manual',
    'Banco de resistores de precisión (serie E12) como resistor de carga/descarga',
    'Capacitor de caja negra sellada (solo en el modo Reto)',
    'Fuente de CD fija de 12 V',
  ],
  s4: {
    intro: 'Procedimiento para medir τ y caracterizar un capacitor desconocido:',
    items: [
      'En el modo Explora, cambia R y C, alterna entre carga y descarga, y observa cómo τ=R·C estira o comprime la curva en el eje del tiempo sin cambiar su forma exponencial.',
      'En el modo Medición, prueba las tres bases de tiempo ofrecidas: una demasiado rápida corta la traza antes de que termine el transitorio; una demasiado lenta la comprime contra el borde; solo una permite ver el cruce del 63.2 %/36.8 % con claridad.',
      'Con la base de tiempo correcta, arrastra el cursor hasta el cruce de la línea punteada ámbar y presiona "Medir τ" — compara la lectura contra el τ=R·C calculado (visible en este modo).',
      'En el modo Reto, el capacitor está sellado: solo conoces R. La base de tiempo ya viene ajustada; mide τ con el cursor y calcula C=τ/R usando la R conocida.',
      'Verifica tu C calculada contra la tolerancia pedagógica (±8 %) — el sistema nunca revela el valor real de C si fallas, solo indica si estás dentro o fuera de margen.',
    ],
  },
  s5: {
    modela: 'Respuesta exponencial exacta de un circuito RC serie de primer orden ante un escalón de CD (carga y descarga); relación τ=R·C; medición realista con base de tiempo discreta (secuencia 1-2-5) y cursor manual; caracterización experimental de un capacitor desconocido a partir de R conocida y τ medida.',
    noModela: 'Resistencia de fuente, ESR del capacitor, ni efectos de carga del propio osciloscopio sobre el circuito — es un modelo de parámetros concentrados ideal. Las tolerancias (±6 % en τ, ±8 % en C) son un margen pedagógico de este ejercicio, no una especificación de instrumento real.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E., & Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill), capítulo de circuitos de primer orden (RC y RL).',
    'Sadiku, M. N. O. — Fundamentos de circuitos eléctricos (McGraw-Hill), sección de respuesta natural y forzada de circuitos RC.',
    'IEC 60617 — Símbolos gráficos para diagramas eléctricos y electrónicos.',
    'IEC 60063 — Serie de valores normalizados (E12) y código de colores para resistores.',
  ],
});
