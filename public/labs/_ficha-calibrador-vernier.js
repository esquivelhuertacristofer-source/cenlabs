/* Ficha técnica · Calibrador Vernier — contenido específico del lab */
fichaTecnica({
  title: 'Calibrador Vernier — lectura, error de cero y repetibilidad',
  intro: 'Este laboratorio representa una <b>sesión de medición con un calibrador vernier de doble resolución</b> (0.05 mm y 0.02 mm): cuatro casos (mordazas externas, internas, varilla de profundidad y repetibilidad) donde la respuesta correcta exige leer la coincidencia de dos escalas con una lupa y <b>corregir por el error de cero</b> propio del instrumento. La geometría es <b>procedural y didáctica</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> escala principal en milímetros, nonio deslizante con dos resoluciones seleccionables (N=20 → 0.05 mm; N=50 → 0.02 mm), mordazas externas e internas, varilla de profundidad, lupa de lectura ampliada, error de cero fijo por caso (positivo, negativo y nulo) y estadística de repetibilidad (media, rango, desviación estándar muestral) sobre 5 lecturas de la misma pieza.',
    omitidos: [
      '<b>Error de coseno/paralaje</b>: leer el nonio en ángulo, o con el ojo desalineado respecto a la escala, introduce un error real que este modelo no simula.',
      '<b>Fuerza de sujeción variable</b>: apretar de más o de menos las mordazas sobre la pieza cambia la lectura en un calibrador real; aquí el contacto es siempre "ideal".',
      '<b>Desgaste y holgura del nonio</b>: con el uso, el ajuste cursor-regla se afloja y aparece juego (backlash) que este lab no representa.',
      '<b>Offset de espesor de punta</b> en mordazas internas: algunos calibradores requieren sumar el espesor de las puntas a la lectura interna; este lab asume una lectura interna directa.',
      '<b>Calibradores digitales o de carátula (reloj)</b>: este lab modela específicamente el vernier mecánico de lectura óptica; los otros dos tipos tienen sus propias fuentes de error (batería/cero electrónico; tren de engranes).',
      '<b>Combinación formal de incertidumbre</b> u_c=√(u_A²+u_B²): aquí se calculan por separado s (Tipo A, repetibilidad) y ±LC/2 (Tipo B, resolución) pero la combinación se defiere a la práctica de incertidumbre GUM.'
    ]
  },
  s2: {
    title: 'Especificaciones usadas por el modelo',
    warn: 'Valores <b>representativos</b> de un calibrador vernier de taller — no de una marca/modelo específico. Para trabajo real, consulta el manual del fabricante de <b>tu</b> instrumento: el principio de N divisiones ↔ (N−1) mm es el mismo, pero el rango, la exactitud garantizada y el procedimiento de verificación varían.',
    rows: [
      ['Resolución (LC)', 'Divisiones del nonio (N)', 'Paso del nonio'],
      ['0.05 mm', '20 divisiones', '19 mm / 20 = 0.95 mm por división'],
      ['0.02 mm', '50 divisiones', '49 mm / 50 = 0.98 mm por división'],
      ['Recorrido representativo', '0 – 140 mm', 'consulta el manual del fabricante para el rango real de tu instrumento'],
      ['Incertidumbre de resolución (Tipo B)', '±LC/2', '±0.025 mm ó ±0.010 mm según resolución'],
    ]
  },
  s3: [
    'Calibrador vernier, de carátula o digital con la resolución adecuada al trabajo, y su certificado de verificación vigente.',
    'Bloques patrón (gauge blocks) o anillo/barra de referencia para <b>verificar el error de cero e indicación</b> antes de usar el instrumento.',
    'Superficie limpia y libre de rebabas en la pieza: la suciedad entre mordaza y pieza es una fuente de error sistemático común.',
    'Certificado de calibración vigente con trazabilidad a patrones nacionales (CENAM en México).'
  ],
  s4: {
    intro: 'Leer el nonio es el <b>inicio</b>, no la medición. Un procedimiento real añade:',
    items: [
      'Verificar el <b>error de cero</b> cerrando las mordazas (o con un patrón de referencia) <b>antes</b> de medir, y registrar su signo.',
      'Aplicar una fuerza de sujeción consistente y perpendicular a la pieza — ni forzar el nonio ni dejar juego entre mordaza y superficie.',
      'Tomar <b>varias lecturas</b> (repetibilidad) cuando la tolerancia de la pieza lo exija, y reportar la dispersión, no solo un valor.',
      'Registrar la lectura <b>corregida</b> por el error de cero, con su unidad y resolución: 24.13 mm (no "24 milímetros y cacho").'
    ]
  },
  s5: {
    modela: 'la relación N divisiones del nonio ↔ (N−1) mm de escala principal ⇒ LC = 1 mm/N para dos resoluciones (0.05 y 0.02 mm); la corrección de la lectura por el error de cero (positivo y negativo) como característica fija del instrumento; mordazas externas, internas y varilla de profundidad como una misma mecánica de nonio; y la repetibilidad del operador (media, rango, s) comparada frente a la incertidumbre de resolución ±LC/2.',
    noModela: 'el error de coseno/paralaje al leer, la fuerza de sujeción variable, el desgaste y la holgura del nonio con el uso, el offset de espesor de punta en mordazas internas, ni la combinación formal de incertidumbre u_c=√(u_A²+u_B²) — esa combinación se calcula en la práctica de incertidumbre GUM.'
  },
  s6: [
    '<b>ASME B89.1.14-2018 (R2023) "Calipers"</b>: norma ancla de diseño y exactitud de calibradores vernier, de carátula y digitales.',
    '<b>ISO 13385-1:2019</b>: especificación de diseño y verificación metrológica de calibradores (paraleliza/sucede a DIN 862:2015-03).',
    '<b>JCGM 100:2008 (GUM)</b> / <b>NMX-CH-140-IMNC-2002</b>: guía para la expresión de la incertidumbre de medida — fuente de la distinción Tipo A (repetibilidad) / Tipo B (resolución) usada en este lab.',
    '<b>NMX-EC-17025-IMNC</b> (ISO/IEC 17025): requisitos de los laboratorios de calibración que emiten certificados trazables.',
    'Manual del fabricante de tu calibrador para el rango de medición y la exactitud garantizada específicos de tu instrumento.'
  ]
});
