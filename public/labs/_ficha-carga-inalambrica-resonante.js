/* Ficha técnica · Carga inalámbrica resonante (SAE J2954) — contenido específico del lab */
fichaTecnica({
  title: 'Carga inalámbrica resonante (SAE J2954)',
  intro: 'Este laboratorio representa un <b>cargador inalámbrico de 11 kW</b> para coche eléctrico: una pad en el suelo y otra bajo el vehículo, cortadas por la mitad, acopladas por un campo magnético de <b>85 kHz</b>. Lo que se mueve y se enciende sale de un modelo calculado y verificado (inductancia mutua por integrales elípticas y de Neumann, circuito serie–serie, campo de Biot–Savart); donde el 3D simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> dos pads idénticas de espiral plana (18 espiras de hilo Litz entre r = 80 y 250 mm) con su cubierta de polímero, blindaje de aluminio, ocho barras de ferrita con su cubo y el soporte de las espiras; el cable de alta tensión del cargador; el piso de acero del coche, sus largueros y los anclajes de la pad del vehículo; la batería de tracción en corte con sus seis módulos y su placa fría; y, en la falla del diagnóstico, una lámina de aluminio olvidada sobre la pad.',
    omitidos: [
      '<b>El inversor y el PFC</b> del cargador: sólo se conoce su límite (650 V de bus, 585 V eficaces de fundamental) y su onda se toma senoidal.',
      '<b>El rectificador y el convertidor CC–CC</b> del vehículo: se sustituyen por la resistencia equivalente R<sub>L</sub> = (8/π²)·V²/P.',
      '<b>Detección de objetos extraños (FOD) y de seres vivos (LOP)</b>, la comunicación cargador–vehículo y la ayuda de aparcamiento.',
      '<b>La compensación auxiliar</b> (LCC, filtros) y la medida de corriente y de tensión de la que depende el control real.'
    ]
  },
  s2: {
    title: 'Especificaciones típicas y seguridad',
    warn: '⚠ El <b>campo magnético de 85 kHz</b> calienta cualquier metal que cruce las pads (monedas, láminas, latas) y es una exposición regulada para las personas. Un cargador real <b>se apaga</b> si detecta un objeto extraño. Valores representativos.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Frecuencia de operación', 'SAE J2954 · banda · nominal', '81,38–90 kHz · 85 kHz'],
      ['Clase de potencia', 'este lab · J2954', '11 kW (WPT3) · 3,7 / 7,7 / 11 / 22 kW'],
      ['Holgura (clase Z)', 'Z1 · Z2 · Z3', '100–150 · 140–210 · 170–250 mm'],
      ['Pad de este lab', '18 espiras de Litz · en aire', 'L ≈ 104 µH · Q ≈ 123'],
      ['Compensación', 'serie–serie, calculada a 85 kHz', 'C ≈ 33,7 nF por pad'],
      ['Límites del reto', 'corriente · tensión del inversor', '50 A · 585 V (bus de 650 V)'],
      ['Rendimiento exigido', 'sólo entre pads', '≥ 90 % a 11 kW'],
      ['Campo para el público', 'ICNIRP 2010, a 85 kHz', '27 µT (eficaz)']
    ]
  },
  s3: [
    'Analizador de redes (VNA) o medidor LCR para L, M, k y Q de las pads.',
    'Osciloscopio con <b>puntas de corriente de banda ancha</b> (el campo de 85 kHz falsea las puntas normales).',
    'Medidor de campo magnético (sonda isotrópica) con certificado de calibración.',
    'Cámara térmica y objetos de prueba normalizados para FOD (monedas, láminas).'
  ],
  s4: {
    intro: 'El orden del laboratorio es una <b>descomposición pedagógica</b>. Una instalación y una puesta en marcha reales añaden:',
    items: [
      '<b>Medir L<sub>1</sub>, L<sub>2</sub> y M</b> con el vehículo en su sitio: el piso metálico y la ferrita las mueven, y la compensación se ajusta con ellas.',
      '<b>Verificar la frecuencia</b> dentro de la banda y la tolerancia de alineación de la clase de pad.',
      'Comprobar el <b>apagado por objeto extraño</b> con los objetos de prueba del fabricante.',
      'Medir el campo disperso a la distancia de la norma y registrar el rendimiento de extremo a extremo.'
    ]
  },
  s5: {
    modela: 'la <b>inductancia mutua</b> de las 18 × 18 parejas de espiras (forma cerrada por la media aritmético-geométrica con los ejes alineados y <b>doble integral de Neumann</b> con la desalineación), el <b>circuito serie–serie</b> completo en régimen senoidal (fasores de I<sub>1</sub> e I<sub>2</sub>, factor de potencia, rendimiento y balance de potencia, también desintonizado y fuera de resonancia), la <b>división de frecuencia</b> y su acoplamiento crítico, el rendimiento máximo k²Q₁Q₂/(1+√(1+k²Q₁Q₂))² y su carga óptima, los límites de corriente y de tensión del cargador, el <b>campo magnético de las 36 espiras</b> (Biot–Savart con integrales elípticas, líneas por RK4 con las corrientes de cada instante) y las tres fallas del diagnóstico (lámina absorbiendo potencia, condensador del primario −18 %, frecuencia a 96 kHz).',
    noModela: 'el efecto de la <b>ferrita y del blindaje</b> sobre L, M y el campo (en el modelo sólo ponen pérdidas, con Q = 160 por pad), las pads de doble D (DD), cuya sensibilidad a la desalineación depende de la dirección, la <b>capacitancia parásita</b> y los armónicos del inversor, la variación de R con la temperatura durante la carga, la carga como batería real (es una resistencia equivalente) y el <b>campo disperso</b> frente a ICNIRP. Las líneas de campo se cortan al entrar en cada pieza y los símbolos y puntos van a cámara lenta: 85 kHz se ve a unos 0,85 Hz. El 90 % es el rendimiento entre pads, no el de extremo a extremo de la norma.'
  },
  s6: [
    '<b>SAE J2954</b>: carga inalámbrica de vehículos eléctricos y alineación (clases de potencia WPT1–WPT4, clases de holgura Z1–Z3, banda de 85 kHz).',
    '<b>IEC 61980-1/-2/-3</b>: sistemas de transferencia inalámbrica de potencia para vehículos eléctricos. <b>ISO 19363</b>: requisitos de seguridad y de interoperabilidad.',
    '<b>ICNIRP 2010</b>: niveles de referencia de campos magnéticos variables en el tiempo.',
    'Kurs et al., <i>Wireless Power Transfer via Strongly Coupled Magnetic Resonances</i>, Science 317 (2007) · Zhang y Mi, <i>Wireless Power Transfer for Electric Vehicles and Mobile Devices</i> · Grover, <i>Inductance Calculations</i> (valores de M de lazos circulares).'
  ]
});
