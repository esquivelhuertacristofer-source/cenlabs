fichaTecnica({
  title: 'Ficha técnica — Frenado Dinámico, Regenerativo y a Contracorriente',
  intro: 'Este simulador compara los tres métodos con que se detiene eléctricamente un motor: dinámico (toda la energía cinética se disipa en un banco de resistencias externo, sumada a la que se disipa en la resistencia interna del propio motor), regenerativo (parte de la energía cinética regresa a la red o a un banco de baterías a través de un inversor, con una eficiencia de conversión η) y a contracorriente/plugging (se invierten dos fases con el motor aún girando, lo que fuerza a disipar bastante más energía que la cinética original, a cambio de un paro mucho más rápido). No es un banco de pruebas físico con un motor y un dinamómetro real: es una calculadora de energía y tiempo en forma cerrada, apoyada en una escena 3D de un motor-volante conectado a tres ramas de frenado seleccionables.',
  s1: {
    presentes: 'Un pizarrón esquemático con las tres ramas de frenado (banco de resistencias para dinámico, enlace a red/inversor para regenerativo, contactores de inversión para a contracorriente) codificadas por color; gráficas de barras apiladas de energía disipada/recuperada por método; una curva exacta de decaimiento de velocidad ω(t) con el instante de frenado al 95% marcado para el método dinámico; una gráfica comparativa de corriente pico ilustrativa entre los tres métodos; y un modo Reto con tres tipos de escenario, uno por método, que piden calcular la energía disipada externamente (dinámico), la energía recuperada (regenerativo) o la energía total disipada (a contracorriente).',
    omitidos: [
      '**La electrónica real de un inversor regenerativo** (front-end activo, control de armónicos, dinámica del bus de CD, factor de potencia hacia la red): el simulador resume todo el proceso de conversión en una sola eficiencia η ajustable, no modela el inversor.',
      '**El dimensionamiento térmico real del banco de resistencias de frenado dinámico** (potencia promedio, ciclo de trabajo, curva de derateo por temperatura): el simulador calcula la energía total de un único evento de frenado, no la capacidad térmica sostenida del banco.',
      '**La dinámica mecánica y eléctrica real del frenado a contracorriente bajo carga**: el multiplicador de 3× la energía cinética que usa el simulador es un caso idealizado sin carga mecánica; con carga, el rango real reportado en la literatura es de 2× a 3×, no un valor único.',
      '**La coordinación de protecciones** (fusibles, capacidad de interrupción de contactores, ajuste de relevadores de sobrecorriente durante el pico de corriente a contracorriente): el simulador solo ilustra el orden de magnitud del pico, no dimensiona protecciones.',
      '**El vínculo con mecanica-8 es conceptual, no mecánico ni eléctrico literal**: la energía recuperada en frenado regenerativo podría almacenarse en un banco de baterías como el de mecanica-8, pero este simulador no modela esa batería ni una conexión directa entre ambos laboratorios.',
    ],
  },
  s2: {
    title: 'Valores de referencia usados',
    warn: 'Esta práctica (fila d5-16 de la lista maestra) NO tiene una norma ancla asignada — la columna "Norma ancla" de esa fila está vacía ("—"). Por eso las constantes físicas del motor (J=0.6 kg·m², Ra=0.3 Ω, kφ=1.2 V·s/rad) son valores ilustrativos elegidos para producir un orden de magnitud pedagógicamente razonable, no datos de placa de un motor real ni cifras citadas literalmente de una norma. El multiplicador de energía disipada a contracorriente (3×, caso idealizado sin carga) y el de corriente pico a contracorriente (6×, ilustrativo) están dentro del orden de magnitud que reporta la literatura general de máquinas eléctricas y NEMA MG-1, pero no son una cita literal de una cláusula numerada.',
    rows: [
      ['Fuente', 'Valor', 'Nota'],
      ['Constante ilustrativa J', '0.6 kg·m²', 'Momento de inercia motor+carga; valor de diseño del laboratorio, no de placa.'],
      ['Constante ilustrativa Ra', '0.3 Ω', 'Resistencia interna de armadura/rotor; valor de diseño del laboratorio.'],
      ['Constante ilustrativa kφ', '1.2 V·s/rad', 'Constante de par/FEM; valor de diseño del laboratorio.'],
      ['Multiplicador de energía a contracorriente', '3× Ek (idealizado, sin carga)', 'Fitzgerald/Kingsley/Umans "Electric Machinery"; Chapman "Electric Machinery Fundamentals" reportan un rango real de 2×–3× según la carga mecánica.'],
      ['Multiplicador de corriente pico a contracorriente', '≈6× (ilustrativo)', 'Orden de magnitud consistente con el rango 500–800% de FLA que reporta NEMA MG-1 §14.46/§18.224 para arranque/frenado a contracorriente; no es un valor citado literal de la norma.'],
      ['Eficiencia de recuperación regenerativa η', 'Deslizador 60%–90%', 'Parámetro instantáneo ilustrativo (Rockwell Automation, DRIVES-WP007A-EN-P); la recuperación neta real de un ciclo completo suele ser menor (10%–40%) por pérdidas de conversión no modeladas aquí.'],
    ],
  },
  s3: [
    'Pizarrón esquemático con motor-volante central y tres ramas de frenado seleccionables (dinámico, regenerativo, a contracorriente), codificadas por color.',
    'Gráficas de barras apiladas de energía disipada/recuperada, reutilizadas entre la vista de un solo método (modo Explora) y la comparación de los tres (modo Comparar).',
    'Curva exacta de decaimiento exponencial de velocidad ω(t)=ω₀e^(−t/τ) para el frenado dinámico, con el instante de frenado al 95% (t₉₅) marcado.',
    'Gráfica comparativa de corriente pico ilustrativa entre los tres métodos.',
    'Modo Reto con tres tipos de escenario —uno por método— que piden calcular energía disipada externamente, energía recuperada, o energía total disipada a contracorriente.',
    'Banco 3D modesto: motor-volante, banco de resistencias, enlace a red/inversor y contactores de inversión, con la rama activa resaltada.',
  ],
  s4: {
    intro: 'Diferencias entre este simulador didáctico y el trabajo real de campo:',
    items: [
      'En campo, un sistema de frenado regenerativo requiere un inversor con front-end activo capaz de manejar flujo de potencia bidireccional y sincronizarse con la red (armónicos, factor de potencia) —aquí toda esa conversión se resume en una sola eficiencia η ajustable.',
      'En campo, un banco de resistencias de frenado dinámico se dimensiona por potencia promedio y ciclo de trabajo a lo largo de muchos frenados, no por la energía de un solo evento —el simulador solo calcula la energía de un único frenado.',
      'En campo, el frenado a contracorriente casi nunca se aplica en vacío: se usa bajo carga y su duración se limita con lógica de relevador/contactor para no dañar el motor —el multiplicador exacto de 3× que usa el simulador es la referencia idealizada sin carga; con carga real el rango reportado es de 2× a 3×.',
      'Las constantes J, Ra y kφ son valores de diseño ilustrativos del laboratorio, no datos de placa de un motor específico ni cifras normativas —esta práctica no tiene norma ancla asignada en la lista maestra.',
    ],
  },
  s5: {
    modela: 'El simulador modela con precisión verificable (funciones de forma cerrada, comprobadas por recomputación con node -e): (1) la energía cinética Ek=½Jω² a partir de la velocidad inicial; (2) la solución exacta de primer orden del frenado dinámico —constante de tiempo τ=J(Rext+Ra)/kφ², tiempo al 95% t₉₅=τ·ln(20), y la curva exacta ω(t)=ω₀e^(−t/τ)— junto con el reparto exacto de la energía disipada entre la resistencia externa y la interna del motor; (3) el reparto de energía recuperada/perdida en frenado regenerativo según la eficiencia η ajustada por el usuario; (4) el multiplicador idealizado de energía disipada a contracorriente (3×Ek, caso sin carga).',
    noModela: 'El simulador NO modela: la electrónica real de un inversor regenerativo (armónicos, dinámica del bus de CD, factor de potencia hacia la red); el dimensionamiento térmico sostenido de un banco de resistencias real (potencia promedio, ciclo de trabajo, derateo); la dinámica mecánica y eléctrica real del frenado a contracorriente bajo carga (rango real 2×–3×, no un valor único); la coordinación de protecciones (fusibles, capacidad de interrupción, ajuste de relevadores); ni una conexión mecánica o eléctrica literal con el banco de baterías de mecanica-8 —el vínculo es conceptual (a dónde podría ir la energía recuperada), no una extensión directa de ese laboratorio.',
  },
  s6: [
    '⚑ Esta práctica (fila d5-16 de la lista maestra) no tiene norma ancla asignada — la columna "Norma ancla" de esa fila está vacía ("—"). No existe una cláusula normativa específica que este simulador implemente de forma literal.',
    '✅ El modelo de energía cinética Ek=½Jω² y la solución exacta de primer orden para frenado dinámico (τ, t₉₅, ω(t)=ω₀e^(−t/τ)) son física de circuitos y de sólido rígido estándar (equivalente a un circuito RL en descarga), verificados por recomputación ejecutada con node -e.',
    '⚑ El multiplicador de disipación a contracorriente (3×Ek) es un caso idealizado sin carga; Fitzgerald/Kingsley/Umans "Electric Machinery" y Chapman "Electric Machinery Fundamentals" describen el frenado a contracorriente cualitativamente y reportan que, bajo carga, la energía disipada real cae en un rango de 2× a 3× la energía cinética, no un múltiplo único.',
    '⚑ El multiplicador de corriente pico ilustrativo (6× en contracorriente) es representativo del rango 500%–800% de FLA que reporta NEMA MG-1 §14.46/§18.224 para protección durante arranque/frenado a contracorriente; no es un valor exacto citado literal de la norma.',
    '⚑ La eficiencia de recuperación regenerativa (η, deslizador 60%–90%) es un parámetro instantáneo ilustrativo, consistente en orden de magnitud con informes técnicos de fabricantes de variadores (p. ej. Rockwell Automation, DRIVES-WP007A-EN-P); la recuperación neta real de un ciclo completo de frenado suele ser menor (10%–40%) por pérdidas de conversión no modeladas aquí.',
  ],
  foot: 'Fuente: sin norma ancla asignada (fila d5-16 de la lista maestra). Constantes ilustrativas y órdenes de magnitud contrastados con literatura general de máquinas eléctricas (Fitzgerald/Kingsley/Umans; Chapman) y NEMA MG-1. Elaborado para CEN Labs — Dominio D5, Transformadores y máquinas eléctricas.',
});
