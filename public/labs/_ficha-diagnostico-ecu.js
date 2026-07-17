/* Ficha técnica · Diagnóstico de ECU: alimentaciones, tierras y referencia de 5 V — contenido específico del lab */
fichaTecnica({
  title: 'Entorno eléctrico de la ECU — alimentaciones, tierras y referencia de 5 V',
  intro: 'Este laboratorio cierra el hilo de diagnóstico iniciado con el <b>escáner OBD-II</b> (lectura de datos), los <b>monitores de disponibilidad</b> (veredicto) y el <b>bus CAN</b> (la red que transporta los datos): aquí das un paso más atrás en la cadena causal y revisas si la ECU misma tiene lo que necesita para funcionar — alimentación constante, alimentación conmutada, tierra de potencia, tierra de señal y referencia de 5 V — antes de declarar al módulo como sospechoso. La punta negra del multímetro permanece fija en un punto de tierra ya verificado durante todo el recorrido: nunca se compara un pin sospechoso contra sí mismo.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> multímetro virtual con punta negra fija en tierra verificada y punta roja móvil sobre los 9 pines de un conector de ECU genérico (alimentación constante y conmutada, tierra de potencia y de señal, referencia de 5 V compartida, par CAN H/L y dos sensores del riel), llave de contacto conmutable, prueba de caída de tensión sin carga y con carga real activa, y 4 casos guiados: ECU sana, tierra en alta resistencia, corto interno en la referencia de 5 V y alimentación conmutada.',
    omitidos: [
      '<b>Un clon literal del conector SAE J1962</b> ni de ningún conector de fabricante: el conector de este panel es genérico y agrupa categorías de pines representativas con fines didácticos.',
      '<b>Los pines de discreción de fabricante del J1962</b> (1, 3, 8, 9, 11, 12, 13), que en un vehículo real pueden o no llevar la referencia de 5 V u otras señales específicas de marca.',
      '<b>La decodificación de tramas CAN reales</b> — el indicador de actividad de bus se mantiene sano en los 4 casos a propósito, como recordatorio de que no todo lo inspeccionado resulta estar fallando (ver el lab de bus CAN para la señalización diferencial).',
      '<b>Fallas mecánicas o de conector</b> (pines doblados, corrosión visible, falso contacto intermitente por vibración): el panel modela únicamente el comportamiento eléctrico en los pines, no su condición física.',
      '<b>El diagrama de pines oficial de ningún vehículo o ECU específica</b> — sustituye la referencia genérica de este panel por el manual del fabricante (FSM) antes de diagnosticar un vehículo real.'
    ]
  },
  s2: {
    title: 'Los 4 casos: firma eléctrica y cómo se confirma',
    warn: 'Los valores citados (batería ≈12.6–14.2 V, referencia de 5 V ≈4.9–5.1 V, caída de tierra ≤0.1 V sano / >0.3 V falla) son rangos típicos de la práctica de diagnóstico ampliamente enseñada, no cifras universales de una norma única — consulta el manual del fabricante para los umbrales del vehículo específico. La referencia de 5 V no está asignada a ningún pin estándar del J1962: vive en el conector propio de la ECU, específico de cada fabricante.',
    rows: [
      ['Caso', 'Firma eléctrica', 'Cómo se confirma'],
      ['ECU sana', 'Batería presente con o sin llave; conmutada 0 V solo con llave apagada; ref. 5 V ≈4.9–5.1 V; caídas de tierra ≤0.1 V', 'Leer 0 V en la conmutada con llave apagada es comportamiento esperado, no falla'],
      ['Tierra en alta resistencia', 'Sin carga la caída parece sana (≤0.1 V); con una carga real activa sube a >0.3 V y desplaza las lecturas de los sensores referidos a ella', 'Repetir la prueba de caída de tensión bajo carga antes de concluir'],
      ['Corto en la referencia de 5 V', 'El riel colapsa en TODOS los sensores que lo comparten, generando códigos simultáneos en sensores sanos', 'Aislar el sensor con el corto interno desconectándolos uno a la vez'],
      ['Alimentación conmutada', '0 V que persiste aun con la llave en contacto', 'Solo es falla si permanece en 0 V con la llave puesta; verificar fusible y relevadores del circuito conmutado']
    ]
  },
  s3: [
    'Multímetro digital de alta impedancia de entrada (≥10 MΩ) para no cargar los circuitos de señal al medirlos.',
    'Puntas de prueba traseras (back-probes) para medir en el conector sin perforar el aislamiento de los cables.',
    'Manual de servicio del fabricante (FSM) con el diagrama de pines real de la ECU del vehículo específico.',
    'Una carga real activa (por ejemplo, los faros o el actuador del propio circuito) para la prueba de caída de tensión bajo carga.',
    'Esquema eléctrico del vehículo para ubicar los puntos físicos de tierra de potencia y de señal.'
  ],
  s4: {
    intro: 'Recorrer los 4 casos del panel es el esqueleto del método, no el procedimiento completo. Un diagnóstico real añade:',
    items: [
      'Verificar primero la <b>batería misma</b> (estado de carga, bornes, masa a chasis) — un entorno de ECU no puede estar sano si la fuente no lo está.',
      'Inspección física de los conectores (pines doblados, corrosión, falso contacto) <b>antes</b> de interpretar cualquier lectura eléctrica, porque el panel no modela esas fallas.',
      'Fijar la punta negra en un punto de tierra <b>ya verificado</b>, y verificar esa tierra explícitamente al inicio, no asumirla.',
      'Medir la referencia de 5 V <b>en cada sensor del riel</b>, no solo en el pin de la ECU: un valor sano en el módulo con un valor colapsado en el sensor delata el tramo de cableado.',
      'Repetir la prueba de caída de tensión sobre la tierra de señal <b>con la carga activa</b> antes de concluir — en reposo, sin corriente circulando, una tierra dañada puede parecer sana.',
      'Confirmar el pinout contra el FSM del vehículo: el conector de este panel es genérico y no sustituye al diagrama del fabricante.'
    ]
  },
  s5: {
    modela: 'la distinción entre alimentación constante y conmutada (incluido que 0 V en la conmutada con llave apagada es comportamiento esperado), la separación funcional entre tierra de potencia y tierra de señal, la prueba de caída de tensión bajo carga como único método confiable para revelar una tierra en alta resistencia, y el efecto de un corto interno de un sensor que arrastra el riel de referencia de 5 V compartido, con su aislamiento desconectando sensores uno a uno.',
    noModela: 'el pinout completo de SAE J1962 pin por pin ni los pines de discreción de fabricante, la decodificación de tramas CAN, las fallas mecánicas o de conector (pines doblados, corrosión, falsos contactos), ni el diagrama de pines oficial de ningún vehículo o ECU específica.'
  },
  s6: [
    '<b>SAE J1962</b>: pinout del conector de diagnóstico OBD-II — norma ancla PARCIAL de esta práctica: cubre la alimentación de batería siempre viva (pin 16) y las tierras de chasis/señal (pines 4 y 5), pero NO la referencia de 5 V. Pinout verificado por triangulación de fuentes secundarias técnicas mutuamente consistentes (el texto primario de SAE es de pago y no se accedió directamente).',
    'Guías técnicas de diagnóstico de circuitos de referencia de 5 V (autodtcs.com, Clore Automotive): convención de referencia compartida entre sensores y su rango de tolerancia ≈4.9–5.1 V.',
    'Guías de prueba de caída de tensión (Fluke "Diagnosing Voltage Drops", freeasestudyguides.com): umbrales ≤0.1 V preferido / >0.3 V indica corrosión o cableado defectuoso en circuitos de tierra.',
    'Notas técnicas sobre separación de tierras (Haltech "ECU Grounding — the DOs and DONTs", iWire "Signal vs Power Grounds"): mecanismo y razón de la separación entre tierra de señal y tierra de potencia.',
    'Manual de servicio OEM (FSM) del vehículo específico: única fuente válida del pinout real y los umbrales exactos — los valores de este panel son rangos representativos, nunca cifra exacta de norma.'
  ]
});
