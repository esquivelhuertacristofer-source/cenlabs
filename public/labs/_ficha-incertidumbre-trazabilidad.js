/* Ficha técnica · Incertidumbre GUM y Trazabilidad Metrológica — contenido específico del lab */
fichaTecnica({
  title: 'Incertidumbre de Medición (GUM) y Trazabilidad Metrológica',
  intro: 'Este laboratorio construye un <b>presupuesto de incertidumbre completo</b> siguiendo el GUM (JCGM 100:2008) sobre un caso único: un comparador de carátula midiendo cinco veces el mismo bloque patrón. Combina una incertidumbre Tipo A (estadística, de las lecturas repetidas) con dos incertidumbres Tipo B (resolución del instrumento, certificado del bloque patrón) por suma cuadrática, y expande el resultado con un factor de cobertura k. La segunda mitad recorre la <b>cadena de trazabilidad</b> real de México (CENAM → laboratorio acreditado EMA → instrumento de taller) y revisa un certificado de calibración para distinguir contenido obligatorio de opcional según ISO/IEC 17025.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> incertidumbre Tipo A calculada por estadística real sobre 5 lecturas (u_A = s/√n), incertidumbre Tipo B de resolución (u = resolución/√12, distribución rectangular) e incertidumbre Tipo B de certificado (u = U_cert/k_cert), combinación cuadrática u_c = √(u_A²+u_res²+u_cert²), incertidumbre expandida U = k·u_c con k=2, cadena de trazabilidad de 3 eslabones (CENAM, laboratorio acreditado EMA, instrumento de taller), y un certificado de calibración ilustrativo que omite deliberadamente la próxima fecha de calibración para enseñar que ese dato NO es obligatorio por defecto.',
    omitidos: [
      '<b>Grados de libertad efectivos (Welch-Satterthwaite)</b>: el factor de cobertura k=2 se usa como aproximación estándar a "~95% de confianza"; el cálculo riguroso de grados de libertad efectivos (JCGM 100:2008, Anexo G) que determinaría el nivel de confianza exacto no se implementa aquí.',
      '<b>Deriva térmica y de largo plazo</b>: ni el bloque patrón ni el comparador cambian su comportamiento con la temperatura o el tiempo transcurrido desde la última calibración en este modelo.',
      '<b>Magnitud real de la deflexión de la aguja del comparador</b>: la aguja del comparador se anima con una deflexión exagerada para que sea visible en pantalla — las desviaciones reales en este caso son de fracciones de micrómetro, imperceptibles a simple vista en una carátula real.',
      '<b>Incertidumbre numérica de cada eslabón individual de la cadena</b>: la cadena de trazabilidad (CENAM/laboratorio/taller) se presenta como concepto y flujo documental; no se calcula un presupuesto de incertidumbre propagado eslabón por eslabón.',
      '<b>Otras fuentes de incertidumbre Tipo B</b> como alineación del instrumento, fuerza de contacto variable o redondeo de visualización — el modelo limita las fuentes Tipo B a resolución y certificado para mantener el presupuesto trazable y verificable paso a paso.'
    ]
  },
  s2: {
    title: 'Datos usados en el presupuesto de incertidumbre',
    warn: 'Los valores de lecturas, resolución y certificado son <b>constantes ilustrativas elegidas a mano</b> para que el presupuesto sea claro y verificable — no provienen de un instrumento o certificado real específico. El procedimiento de cálculo (Tipo A, Tipo B, combinación cuadrática, expansión) es el que exige el GUM para cualquier caso real.',
    rows: [
      ['Fuente', 'Valor', 'Tipo'],
      ['5 lecturas repetidas del bloque patrón', '10.0003 / 10.0005 / 10.0001 / 10.0004 / 10.0002 mm', 'Tipo A (estadística)'],
      ['Resolución del comparador', '0.001 mm', 'Tipo B (u = resolución/√12)'],
      ['Incertidumbre del certificado del bloque patrón', 'U = 0.0001 mm, k = 2', 'Tipo B (u = U/k)'],
      ['Factor de cobertura aplicado al resultado final', 'k = 2 (≈ 95%, aproximado)', 'Expansión'],
    ]
  },
  s3: [
    'Comparador de carátula (o instrumento equivalente) con certificado de calibración vigente y resolución conocida.',
    'Bloque patrón (gauge block) con certificado de calibración trazable, indicando su incertidumbre expandida U y factor de cobertura k.',
    'Calculadora o software para propagar incertidumbres por suma cuadrática — hacerlo a mano con muchas fuentes es propenso a error.',
    'Acceso al certificado de calibración completo del instrumento y del patrón, para verificar qué contenido es obligatorio según ISO/IEC 17025:2017 §7.8.'
  ],
  s4: {
    intro: 'Calcular la incertidumbre es el <b>último paso</b> de un procedimiento de medición completo. Un procedimiento real añade:',
    items: [
      'Documentar <b>todas</b> las fuentes de incertidumbre relevantes antes de calcular, no solo las dos o tres más obvias — un presupuesto incompleto subestima el resultado.',
      'Verificar que el certificado de calibración de cada instrumento y patrón usado esté <b>vigente</b> (dentro de su periodo de validez) antes de usarlo como referencia.',
      'Confirmar que la cadena de trazabilidad de cada patrón termine en un instituto nacional de metrología (CENAM en México) a través de laboratorios acreditados (EMA), sin eslabones no documentados.',
      'Revisar el contenido del certificado contra los requisitos de ISO/IEC 17025:2017 §7.8 en vez de asumir que un certificado con sello y firma automáticamente contiene todo lo necesario.'
    ]
  },
  s5: {
    modela: 'el cálculo real de incertidumbre Tipo A por estadística de 5 lecturas repetidas (u_A = s/√n), incertidumbre Tipo B de resolución (u = resolución/√12) y de certificado (u = U/k), combinación por suma cuadrática (u_c = √Σuᵢ²) e incertidumbre expandida (U = k·u_c) — todas calculadas por funciones de código a partir de constantes fijas, nunca transcritas a mano; la cadena de trazabilidad de 3 eslabones (CENAM, laboratorio acreditado EMA, instrumento de taller); y un certificado de calibración que distingue explícitamente contenido obligatorio de opcional según ISO/IEC 17025:2017 §7.8.4.3.',
    noModela: 'los grados de libertad efectivos (Welch-Satterthwaite) que darían un nivel de confianza exacto en vez de la aproximación "k=2 ≈ 95%"; la deriva térmica o de largo plazo de ningún instrumento; la incertidumbre numérica propagada de cada eslabón individual de la cadena de trazabilidad; ni otras fuentes Tipo B más allá de resolución y certificado. La deflexión de la aguja del comparador en pantalla está intencionalmente exagerada para visibilidad — las desviaciones reales de este caso son de fracciones de micrómetro.'
  },
  s6: [
    '<b>JCGM 100:2008 "Evaluation of measurement data — Guide to the expression of uncertainty in measurement" (GUM)</b>: norma ancla del presupuesto de incertidumbre — cláusulas 4.2 (Tipo A), 4.3/Anexo F.2.2.1 (Tipo B, resolución), 5.1 (combinación cuadrática) y 6.3.3 (factor de cobertura y expansión).',
    '<b>JCGM 200:2012 "International vocabulary of metrology — Basic and general concepts and associated terms" (VIM)</b>: definición de trazabilidad metrológica (2.41) y conceptos asociados de cadena de calibración.',
    '<b>ISO/IEC 17025:2017 "General requirements for the competence of testing and calibration laboratories"</b>: §7.8, contenido mínimo obligatorio de un certificado de calibración, incluyendo §7.8.4.3 (la próxima fecha de calibración NO es obligatoria por defecto).',
    '<b>NMX-EC-17025-IMNC-2018</b>: adopción mexicana idéntica a ISO/IEC 17025:2017.',
    '<b>NMX-CH-140-IMNC-2002</b>: adaptación mexicana del GUM para la evaluación de incertidumbre.',
    '<b>Ley de Infraestructura de la Calidad</b> (vigente desde 2020-07-01) y el marco CENAM/EMA: CENAM como instituto nacional de metrología de México y la EMA como entidad acreditadora de laboratorios de calibración.'
  ]
});
