fichaTecnica({
  title: 'Máxima Transferencia de Potencia',
  intro: 'Para una red lineal vista desde dos terminales — caracterizada por su equivalente de Thévenin (Vth, Rth) — la potencia entregada a una carga externa RL no crece indefinidamente: alcanza un máximo único en RL = Rth y luego decae. Este banco construye esa curva P(RL) en vivo con el mismo motor de análisis nodal modificado (MNA) del laboratorio de Thévenin/Norton, la contrasta contra el modelo reducido de dos elementos, y añade la eficiencia η = RL/(RL+Rth) como segunda variable — que NO se maximiza en el mismo punto que la potencia.',
  s1: {
    presentes: [
      'Barrido de RL sobre la red resistiva completa (4 resistores) resuelto por MNA en cada punto — no una fórmula aplicada ciegamente',
      'Curva P(RL) con el máximo teórico marcado en RL = Rth y su valor Pmáx = Vth²/(4·Rth)',
      'Segundo camino de verificación: mismo barrido sobre el circuito equivalente reducido de Thévenin (Vth, Rth) — debe coincidir con la red completa en el punto de RL seleccionado',
      'Curva de eficiencia η(RL) superpuesta a la potencia normalizada, mostrando el compromiso potencia-máxima vs. eficiencia-máxima',
      'Reto de caja negra: medir Voc e Isc en las terminales y predecir RLopt y Pmáx sin conocer la topología interna',
      'Motor MNA con elemento amperímetro ideal, reutilizado del laboratorio de Thévenin/Norton (mecanica-62)',
    ],
    omitidos: [
      'Tolerancias reales de fabricación de resistores (el simulador usa valores nominales exactos)',
      'Resistencia interna de la fuente V1 y resistencia de conductores/contactos (se asumen cero)',
      'Cargas reactivas o complejas: este laboratorio cubre solo el caso resistivo puro de CD — el teorema general de máxima transferencia con cargas reactivas (conjugado complejo de la impedancia interna) no se modela',
      'Límites térmicos o de corriente máxima del resistor de carga real (en la práctica, operar en RL = Rth con Rth muy baja puede exceder la disipación nominal de un resistor físico)',
      'El hecho de que en sistemas de potencia eléctrica (distribución, no electrónica de señal) casi nunca se busca RL = Rth, porque ahí la eficiencia es de solo 50 % — se prefiere Rth ≪ RL para no desperdiciar la mitad de la energía en la fuente',
    ],
  },
  s2: {
    title: 'Elementos de la red',
    warn: 'Valores nominales usados por el solver — en un banco real cada resistor tendría su propia tolerancia de fabricación.',
    rows: [
      ['V1', 'Fuente ideal de CD', '12 V', 'Alimenta la red; sin resistencia interna en el modelo'],
      ['R1, R2, R3', 'Resistores de red', '470 Ω – 10 kΩ (serie E12)', 'Fijan el Vth y Rth vistos desde las terminales de RL'],
      ['RL', 'Resistor de carga', '220 Ω – 22 kΩ', 'Barrido en el modo Explora/Eficiencia; el simulador siempre la mantiene conectada fuera del modo Reto'],
      ['AMM', 'Amperímetro ideal', '0 V (cortocircuito)', 'Elemento MNA usado solo para medir Isc en el modo Reto'],
      ['Motor', 'Solver MNA', '—', 'El mismo usado en Kirchhoff (mecanica-13), divisores (mecanica-61) y Thévenin/Norton (mecanica-62)'],
    ],
  },
  s3: [
    'Multímetro configurado como voltímetro (para Voc en el modo Reto)',
    'Multímetro configurado como amperímetro / amperímetro ideal (para Isc en el modo Reto)',
    'Banco de resistores de precisión (serie E12) como carga variable',
    'Caja negra sellada de dos terminales (solo en el modo Reto)',
  ],
  s4: {
    intro: 'Procedimiento para verificar el punto de máxima transferencia de potencia:',
    items: [
      'En el modo Explora, recorre los valores de RL y observa cómo P(RL) crece, alcanza un pico único en RL = Rth, y luego decae — nunca hay dos picos ni una meseta.',
      'Confirma que el pico marcado coincide con el valor de Rth calculado para la combinación actual de R1, R2 y R3.',
      'En el modo Eficiencia, superpón la curva de potencia normalizada con la de eficiencia η = RL/(RL+Rth): nota que en RL = Rth la eficiencia es exactamente 50 %, no el máximo de η.',
      'Verifica que para RL ≫ Rth la eficiencia se acerca a 100 % pero la potencia entregada cae — el compromiso central del teorema.',
      'En el modo Reto, mide Voc e Isc de la caja negra, calcula Rth = Voc/Isc y predice RLopt = Rth y Pmáx = Voc²/(4·Rth) sin ver los resistores internos.',
    ],
  },
  s5: {
    modela: 'Red resistiva de dos terminales con una fuente ideal de CD; barrido completo de P(RL) resuelto por MNA en la red real y verificado contra el modelo reducido de Thévenin; relación potencia-eficiencia explícita; predicción de RLopt y Pmáx desde mediciones externas de caja negra.',
    noModela: 'Cargas reactivas o el teorema de máxima transferencia con conjugado complejo de impedancia, límites térmicos de componentes reales, ni el criterio de diseño de sistemas de potencia (que evita deliberadamente RL = Rth por su eficiencia del 50 %). Las tolerancias del modo Reto (±5 % relativas) son un margen pedagógico de este ejercicio, no una especificación de instrumento real.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E., & Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill), capítulo del teorema de máxima transferencia de potencia.',
    'Sadiku, M. N. O. — Fundamentos de circuitos eléctricos (McGraw-Hill), sección de transferencia máxima de potencia y eficiencia.',
    'IEC 60617 — Símbolos gráficos para diagramas eléctricos y electrónicos.',
    'IEC 60063 — Serie de valores normalizados (E12) y código de colores para resistores.',
    'Ho, C. W., Ruehli, A. E., & Brennan, P. A. (1975) — "The modified nodal approach to network analysis", IEEE Transactions on Circuits and Systems.',
  ],
});
