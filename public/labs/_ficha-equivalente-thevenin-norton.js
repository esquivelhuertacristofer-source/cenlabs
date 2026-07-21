fichaTecnica({
  title: 'Equivalentes de Thévenin y Norton',
  intro: 'Cualquier red lineal de resistores y fuentes, vista desde solo dos terminales, se comporta exactamente igual que una fuente ideal en serie (Thévenin) o en paralelo (Norton) con una sola resistencia. Este banco extiende el motor de análisis nodal modificado (MNA) de los laboratorios de Kirchhoff y divisores con un nuevo elemento — un amperímetro ideal — para medir la corriente de cortocircuito sin fórmulas ad-hoc.',
  s1: {
    presentes: [
      'Red resistiva de dos terminales resuelta en vivo por análisis nodal modificado (MNA)',
      'Medición experimental de Voc (circuito abierto) e Isc (cortocircuito vía amperímetro ideal)',
      'Cálculo de Rth = Voc/Isc contrastado contra el método teórico (fuente desactivada + combinación de resistencias)',
      'Verificación de la predicción de Thévenin/Norton contra la red completa bajo cualquier carga externa',
      'Conversión Thévenin ↔ Norton (Rn = Rth, In = Isc)',
      'Caracterización de una caja negra real usando solo mediciones en las terminales',
    ],
    omitidos: [
      'Tolerancias reales de fabricación de resistores (el simulador usa valores nominales exactos)',
      'Resistencia interna de la fuente V1 (se modela como fuente ideal, sin caída propia)',
      'Resistencia de conductores y contactos de las terminales (se asume cero)',
      'Comportamiento no ideal de un amperímetro real (carga de inserción, resistencia propia)',
      'Redes con múltiples fuentes independientes o elementos no lineales',
      'El proceso físico de la medición (ruido del instrumento, tiempo de asentamiento, calibración)',
    ],
  },
  s2: {
    title: 'Elementos de la red',
    warn: 'Valores nominales usados por el solver — en un banco real cada resistor tendría su propia tolerancia de fabricación.',
    rows: [
      ['V1', 'Fuente ideal de CD', '12 V', 'Alimenta la red; sin resistencia interna en el modelo'],
      ['R1, R2, R3', 'Resistores de red', '470 Ω – 10 kΩ (serie E12)', 'Topología fija: R1 en serie con el paralelo R2‖(R3+terminal)'],
      ['RL', 'Carga externa', '1 kΩ – 10 kΩ', 'Se conecta en el modo Carga y Norton para verificar la predicción'],
      ['AMM', 'Amperímetro ideal', '0 V (cortocircuito)', 'Elemento MNA nuevo: fuente de 0 V que permite leer Isc directamente'],
      ['Motor', 'Solver MNA', '—', 'El mismo usado en Kirchhoff (mecanica-13) y divisores (mecanica-61), extendido con el tipo AMM'],
    ],
  },
  s3: [
    'Multímetro configurado como voltímetro (para Voc)',
    'Multímetro configurado como amperímetro / amperímetro ideal (para Isc)',
    'Banco de resistores de precisión (serie E12)',
    'Caja negra sellada de dos terminales (solo en el modo Reto)',
  ],
  s4: {
    intro: 'Procedimiento de caracterización experimental por el método de circuito abierto / cortocircuito:',
    items: [
      'Con las terminales SIN conectar a nada, mide el voltaje entre A y B: ese valor ES Vth = Voc (lectura directa, sin cálculo).',
      'Conecta un amperímetro ideal entre A y B (cortocircuito) y mide la corriente: esa es Isc.',
      'Calcula Rth = Voc / Isc — la resistencia interna equivalente vista desde las terminales.',
      'Verifica por un segundo camino: desactiva la fuente (córtocircuítala) y combina las resistencias internas vistas desde las terminales — debe coincidir con Rth medida.',
      'Conecta cualquier carga RL y confirma que V(RL) = Vth·RL/(RL+Rth) coincide exactamente con el valor medido sobre la red completa.',
    ],
  },
  s5: {
    modela: 'Red resistiva de dos terminales con una fuente ideal de CD; caracterización experimental completa (Voc, Isc, Rth) verificada por dos métodos independientes y contra la red completa bajo cualquier carga; equivalencia exacta Thévenin ↔ Norton.',
    noModela: 'Redes con múltiples fuentes o elementos no lineales, componentes reactivos (capacitores, inductores) ni corriente alterna. Las tolerancias del modo Reto (±3–5 % relativas) son un margen pedagógico de este ejercicio, no una especificación de instrumento real.',
  },
  s6: [
    'Hayt, W. H., Kemmerly, J. E., & Durbin, S. M. — Análisis de circuitos en ingeniería (McGraw-Hill), capítulo de teoremas de red (Thévenin/Norton).',
    'IEC 60617 — Símbolos gráficos para diagramas eléctricos y electrónicos.',
    'IEC 60063 — Serie de valores normalizados (E12) y código de colores para resistores.',
    'Ho, C. W., Ruehli, A. E., & Brennan, P. A. (1975) — "The modified nodal approach to network analysis", IEEE Transactions on Circuits and Systems.',
  ],
});
