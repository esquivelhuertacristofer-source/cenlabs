fichaTecnica({
  title: 'Transitorio RL',
  intro: 'Al energizar o interrumpir la corriente de un inductor a través de un resistor, la corriente —y por tanto el voltaje sobre la resistencia serie de la bobina— no cambia instantáneamente: sigue una curva exponencial gobernada por la constante de tiempo τ = L/R. Este banco mide esa curva con un osciloscopio simulado, y además compara dos formas de interrumpir la corriente: con un diodo de rueda libre (flyback) en antiparalelo, que da una ruta segura y medible al colapso, y sin él, donde el colapso es forzado, casi instantáneo y no ofrece una τ medible — exactamente la sobretensión que erosiona los contactos de un interruptor o relevador desprotegido.',
  s1: {
    presentes: [
      'Respuesta exponencial exacta de un circuito RL serie de primer orden: energización v_R(t)=V(1−e^(−t/τ)) e interrupción protegida v_R(t)=V·e^(−t/τ)',
      'Relación τ = L/R verificada numéricamente contra la traza mostrada, en combinaciones de R y L (serie E12 para R)',
      'Diodo de rueda libre (flyback) conmutable en antiparalelo sobre la bobina, con comparación explícita entre interrupción con y sin protección',
      'Base de tiempo (time/div) discreta con secuencia 1-2-5, igual que un osciloscopio real — una elección incorrecta corta o comprime la traza',
      'Cursor deslizante de medición manual sobre la traza, con referencia punteada en 63.2 % (energiza) o 36.8 % (interrumpe con diodo) de V',
      'Reto de caja parcialmente sellada: R conocida, L desconocida, se despeja L=τ_medido·R a partir de una medición real hecha por el estudiante',
      'Bloqueo pedagógico explícito de la medición cuando el escenario es peligroso (interrupción sin diodo): el sistema no permite fingir que existe una τ que no existe',
    ],
    omitidos: [
      'Magnitud y forma reales del pico de sobretensión sin diodo — el simulador NO calcula ni muestra un valor de voltaje de arco; solo advierte que el colapso es forzado y no medible con este instrumento',
      'Resistencia de fuente, resistencia serie del inductor (más allá de la R de carga) y capacitancia parásita del devanado — modelo de parámetros concentrados ideal',
      'Caída directa del diodo (Vf) y su resistencia dinámica — declaradas en el modelo pero no aplicadas a las curvas de voltaje mostradas',
      'Efecto de carga del propio osciloscopio (impedancia de entrada finita) sobre el circuito medido',
      'Tolerancias reales de fabricación de resistores e inductores (el simulador usa valores nominales exactos, salvo en el reto donde el valor de L es intencionalmente desconocido para el estudiante)',
      'Saturación del núcleo magnético del inductor y efectos térmicos — el inductor se modela como lineal en todo el rango de corriente',
    ],
  },
  s2: {
    title: 'Elementos del circuito',
    warn: 'Valores nominales usados por el modelo — en un banco real cada componente tendría su propia tolerancia de fabricación.',
    rows: [
      ['V', 'Fuente ideal de CD', '12 V', 'Alimenta el circuito en la fase de energización; se modela sin resistencia interna'],
      ['R', 'Resistor de carga', '10 Ω – 100 Ω (serie E12)', 'Visible siempre, incluso en el modo Reto; fija τ junto con L de forma inversa (τ=L/R)'],
      ['L', 'Inductor (bobina)', '50 mH – 470 mH', 'Sellado en el modo Reto: se caracteriza indirectamente vía τ=L/R, no se lee directamente'],
      ['D', 'Diodo de rueda libre (flyback)', 'Antiparalelo sobre L', 'Conmutable con/sin en el modo Explora; fijo presente en Sobretensión y Reto para permitir medición segura'],
      ['Osciloscopio', 'Instrumento simulado', 'Base de tiempo 10 µs/div – 200 ms/div', 'Grilla de 10×8 divisiones; volts/div fijo en V/8'],
    ],
  },
  s3: [
    'Osciloscopio de un canal con base de tiempo seleccionable y cursor de medición manual',
    'Banco de resistores de precisión (serie E12) como resistor de carga',
    'Inductor de caja negra sellada (solo en el modo Reto)',
    'Diodo de rueda libre conmutable en antiparalelo sobre la bobina',
    'Fuente de CD fija de 12 V',
  ],
  s4: {
    intro: 'Procedimiento para medir τ y caracterizar un inductor desconocido:',
    items: [
      'En el modo Explora, cambia R y L, alterna entre energizar e interrumpir, y observa cómo τ=L/R responde de forma INVERSA a R —lo opuesto de lo que ocurre con τ=R·C en un circuito capacitivo.',
      'Con el diodo presente, interrumpe la corriente y observa la traza segura y exponencial v_R(t)=V·e^(−t/τ). Retira el diodo e interrumpe de nuevo: la traza cambia a un colapso forzado, coloreado en rojo, sin una τ medible.',
      'En el modo Sobretensión, prueba las tres bases de tiempo ofrecidas durante la interrupción protegida, mide τ con el cursor y compara contra el τ=L/R calculado (visible en este modo). Luego activa el escenario sin diodo y verifica que el sistema bloquea la medición con una advertencia.',
      'En el modo Reto, el inductor está sellado: solo conoces R. La base de tiempo ya viene ajustada; mide τ durante la interrupción protegida (el diodo está fijo presente) y calcula L=τ·R usando la R conocida.',
      'Verifica tu L calculada contra la tolerancia pedagógica (±8 %) — el sistema nunca revela el valor real de L si fallas, solo indica si estás dentro o fuera de margen.',
    ],
  },
  s5: {
    modela: 'Respuesta exponencial exacta de un circuito RL serie de primer orden ante un escalón de CD (energización e interrupción protegida por diodo de rueda libre); relación τ=L/R inversa en R; medición realista con base de tiempo discreta (secuencia 1-2-5) y cursor manual; caracterización experimental de un inductor desconocido a partir de R conocida y τ medida; comparación cualitativa entre interrupción segura y sin protección.',
    noModela: 'La magnitud real del pico de sobretensión sin diodo, la caída directa del diodo (Vf), la resistencia de fuente ni la resistencia serie propia del inductor, ni efectos de carga del propio osciloscopio — es un modelo de parámetros concentrados ideal. Las tolerancias (±6 % en τ, ±8 % en L) son un margen pedagógico de este ejercicio, no una especificación de instrumento real.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E., & Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill), capítulo de circuitos de primer orden (RC y RL).',
    'Rashid, M. H. — Electrónica de potencia: circuitos, dispositivos y aplicaciones (Pearson), sección de diodos de rueda libre (flyback) en cargas inductivas.',
    'IEC 60617 — Símbolos gráficos para diagramas eléctricos y electrónicos.',
    'IEC 60063 — Serie de valores normalizados (E12) y código de colores para resistores.',
  ],
});
