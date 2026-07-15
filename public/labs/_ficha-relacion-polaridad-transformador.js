/* Ficha técnica — Relación de Transformación y Prueba de Polaridad */
fichaTecnica({
  title: 'Relación de transformación y prueba de polaridad — banco de tensión reducida',
  intro: 'El modelo representa un <b>banco de pruebas de bajo voltaje</b>: una fuente de CA de tensión reducida (variac), un transformador monofásico bajo prueba con sus cuatro terminales (H1/H2 de alta tensión, X1/X2 de baja tensión) y dos voltímetros analógicos. Con él se resuelven dos preguntas de ingeniería reales y distintas: si la relación de vueltas medida cumple la tolerancia de placa, y si la polaridad del devanado es aditiva o sustractiva.',
  s1: {
    presentes: 'Fuente de tensión reducida (variac) con dos terminales de salida; transformador con tanque, cuatro bujes/terminales rotulados (H1, H2, X1, X2) y placa de datos; puente de polaridad H1↔X1 (visible solo en los casos de polaridad); dos voltímetros analógicos de aguja (tensión aplicada y tensión medida) con escala redibujada según el rango de cada caso.',
    omitidos: [
      '<b>Núcleo y devanados internos</b>: el tanque se representa cerrado, como en una unidad real de servicio — el arrollamiento de cobre y el núcleo laminado no son visibles ni se modelan como geometría independiente.',
      '<b>Elementos de seguridad de banco real</b>: guantes dieléctricos, tapete aislante, procedimiento de bloqueo/etiquetado (LOTO) y verificación de ausencia de tensión antes de manipular puentes — el lab asume un entorno de práctica ya asegurado.',
      '<b>Clase de exactitud del instrumento</b>: los voltímetros se dibujan con una aguja que responde exactamente al valor calculado, sin el error de lectura, histéresis o clase de exactitud (p. ej. ±1.5%) de un instrumento analógico real.',
    ],
  },
  s2: {
    title: 'Especificaciones usadas por el modelo (4 unidades de ejemplo)',
    warn: 'Los valores de placa son representativos de transformadores de instrumentación/control y distribución típicos — no provienen de una hoja de datos de un fabricante específico. Las cantidades derivadas (relación medida, %desviación, tensión de polaridad) se calculan en tiempo real a partir de estas constantes; nunca se transcriben a mano.',
    rows: [
      ['Caso', 'Unidad', 'V1n / V2n', 'a nominal', 'Vap de prueba'],
      ['1 · Relación (sana)', 'Control 500 VA', '220 V / 24 V', '9.1667', '110 V'],
      ['2 · Relación (con falla)', 'Control 500 VA (falla simulada)', '220 V / 24 V', '9.1667', '110 V'],
      ['3 · Polaridad aditiva', 'Control 150 VA', '240 V / 24 V', '10.0000', '24 V'],
      ['4 · Polaridad sustractiva', 'Distribución 300 kVA', '13200 V / 240 V', '55.0000', '55 V'],
    ],
  },
  s3: [
    'Fuente de CA de tensión reducida (variac o transformador de aislamiento con derivaciones) — en un banco real, jamás se prueba a la tensión nominal de placa.',
    'Voltímetro de CA para el lado de alta tensión (rango acorde a Vap).',
    'Voltímetro de CA para el lado de baja tensión / terminales libres (rango acorde a la lectura esperada).',
    'Puente/cable de prueba con caimanes para la conexión H1-X1 en la prueba de polaridad.',
    'Guantes dieléctricos y verificación de ausencia de tensión antes de reconectar el puente (equipo de seguridad — no modelado en el 3D, ver §1).',
  ],
  s4: {
    intro: 'El lab reduce cada prueba a su núcleo de decisión de ingeniería: aplicar tensión reducida, leer, calcular y decidir. En un banco real se añaden pasos de seguridad y verificación que el modelo no reproduce.',
    items: [
      'Verificación de ausencia de tensión y desenergización del transformador antes de instalar o retirar el puente de polaridad — aquí el puente aparece/desaparece automáticamente según el caso seleccionado.',
      'Selección del rango del voltímetro ANTES de energizar (para no dañar el instrumento con una lectura fuera de escala) — aquí la escala del medidor se ajusta automáticamente por caso.',
      'Registro en bitácora de banco de la unidad, fecha, técnico y resultado — no modelado; el "informe" en pantalla es solo el cálculo, no un registro de calidad.',
      'En una prueba de polaridad real, la lectura se contrasta también contra el diagrama de conexión de la placa (si existe) — este lab determina la polaridad únicamente por la comparación de tensiones, deliberadamente, para no requerir una convención de geometría de terminales no verificada (ver §5).',
    ],
  },
  s5: {
    modela: 'la relación de transformación en vacío a=N1/N2=V1/V2 con el criterio de tolerancia de ±0.5% de la relación especificada (IEC 60076-1, Cláusula 10, Tabla 1, ítem 2); el procedimiento normativo de 4 terminales de la prueba de polaridad (puente H1-X1, tensión reducida en H1-H2, lectura en H2-X2) con su fórmula V=Vap·(1∓N_BT/N_AT); la regla de clasificación de fábrica de ANSI/IEEE C57.12.00 cláusula 5.7.1 (kVA≤200 Y AT≤8660V ⇒ aditiva; en cualquier otro caso, sustractiva), verificada con dos unidades de ejemplo que caen en cada lado de la regla.',
    noModela: 'el criterio alterno de tolerancia de la IEC 60076-1 basado en ±1/10 de la impedancia de cortocircuito real (requiere %Z, calculado en la práctica de circuito equivalente de esta misma serie); la disposición física real de las terminales H1/X1 en la carcasa — deliberadamente, la polaridad se determina aquí solo por la comparación de tensiones, como exige el procedimiento normativo; un porcentaje normativo fijo de "tensión reducida" de prueba (es una elección pedagógica de seguridad, no una cifra de norma); ni la equivalencia de la norma mexicana NMX-J-116/169 con IEC o ANSI — ANCE la declara explícitamente NO equivalente directa; la práctica en México usa la convención de terminales H1/H2-X1/X2 de ANSI vía CFE K0000-04.',
  },
  s6: [
    '<b>IEC 60076-1</b> — Transformadores de potencia, Parte 1: Generalidades. Cláusula 10 (Tabla 1, ítem 2: tolerancia de relación de transformación) y Cláusula 11.3 (medición de la relación de tensión).',
    '<b>ANSI/IEEE C57.12.00</b> — General Requirements for Liquid-Immersed Distribution, Power, and Regulating Transformers. Cláusula 5.7.1 (clasificación de polaridad de fábrica por kVA y tensión de AT).',
    '<b>CFE K0000-04</b> — Especificación de transformadores de distribución y potencia (práctica mexicana, convención de terminales H1/H2-X1/X2).',
    '<b>NMX-J-116-ANCE / NMX-J-169-ANCE</b> — normas mexicanas de transformadores de distribución y potencia; ANCE las declara NO equivalentes directas a IEC ni a ANSI/IEEE.',
  ],
});
