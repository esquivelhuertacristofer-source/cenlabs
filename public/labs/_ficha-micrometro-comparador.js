/* Ficha técnica · Micrómetro y Comparador de Carátula — contenido específico del lab */
fichaTecnica({
  title: 'Micrómetro y Comparador de Carátula — resolución 0.01 mm, runout y planitud',
  intro: 'Este laboratorio representa una <b>sesión de medición de precisión</b> con dos instrumentos: un micrómetro de exteriores (resolución 0.01 mm, husillo de paso 0.5 mm/vuelta) y un comparador de carátula tipo émbolo usado para evaluar runout y planitud por diferencia. Cinco casos —dos ejes en el micrómetro, un caso conceptual sobre el trinquete, y runout/planitud en el comparador— exigen leer, corregir por error de cero, o comparar contra una tolerancia. La geometría es <b>procedural y didáctica</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> lectura del micrómetro en tres términos (mm del manguito + media vuelta + división del tambor × 0.01 mm), error de cero fijo por caso (positivo y nulo) corregido aritméticamente, un caso conceptual sobre el trinquete sin cifra numérica, comparador de carátula tipo émbolo con cálculo de TIR (runout) sobre 6 ángulos y de planitud sobre 5 puntos, evaluados contra tolerancias de aceptación explícitas.',
    omitidos: [
      '<b>Corrección mecánica real del error de cero</b>: en un micrómetro físico, el error de cero se corrige girando el manguito con la llave de ajuste — no restando a mano. Este lab corrige aritméticamente por comparación pedagógica con el calibrador vernier.',
      '<b>Magnitud del error por saltarse el trinquete</b>: el trinquete existe para aplicar una fuerza de medición constante, pero este lab NO le asigna una cifra de error al no encontrarse una fuente verificable que la respalde — solo se evalúa el criterio de uso correcto.',
      '<b>Error de coseno de comparadores tipo palanca (lever)</b>: este lab modela específicamente el tipo émbolo (plunger); un comparador de palanca introduce un error adicional que depende del ángulo del brazo, no representado aquí.',
      '<b>Fuerza de medición variable</b>: la especificación de 5–10 N frecuentemente citada es de fabricante (p. ej. Mitutoyo serie 102), no un requisito general ASME/ISO, y no se simula como fuente de error.',
      '<b>Dilatación térmica y deriva de calibración</b>: ni el instrumento ni la pieza cambian de dimensión con la temperatura o el tiempo de uso en este modelo.',
      '<b>Combinación formal de incertidumbre</b> u_c=√Σu²: este lab reporta TIR y planitud como diferencias directas contra tolerancia; la combinación GUM completa se trabaja en la práctica de incertidumbre y trazabilidad.'
    ]
  },
  s2: {
    title: 'Especificaciones usadas por el modelo',
    warn: 'Valores <b>representativos</b> de un micrómetro y un comparador de carátula de taller — no de una marca/modelo específico. Para trabajo real, consulta el manual del fabricante de <b>tu</b> instrumento: el principio de lectura es el mismo, pero el rango, la exactitud garantizada y el procedimiento de verificación varían.',
    rows: [
      ['Magnitud', 'Micrómetro', 'Comparador de carátula'],
      ['Resolución (LC)', '0.01 mm (tambor de 50 divisiones × paso 0.5 mm/vuelta)', '0.01 mm por división de carátula (100 divisiones / vuelta = 1.00 mm)'],
      ['Recorrido representativo', '0 – 25 mm (una sola vuelta de husillo)', '± 0.5 – 1.0 mm de recorrido de émbolo, según modelo'],
      ['Tipo modelado', 'Micrómetro de exteriores mecánico', 'Émbolo (plunger) — no de palanca (lever)'],
      ['Fuerza de medición', 'Aplicada vía trinquete — magnitud no especificada en este lab (consulta el manual del fabricante)', 'No modelada'],
    ]
  },
  s3: [
    'Micrómetro y/o comparador de carátula con la resolución adecuada al trabajo, y su certificado de verificación vigente.',
    'Bloques patrón (gauge blocks) o anillo de referencia para <b>verificar el error de cero</b> antes de usar el micrómetro.',
    'Soportes en V o plato divisor, y placa de referencia plana, para montar la pieza al evaluar runout o planitud con el comparador.',
    'Certificado de calibración vigente con trazabilidad a patrones nacionales (CENAM en México).'
  ],
  s4: {
    intro: 'Leer el instrumento es el <b>inicio</b>, no la medición. Un procedimiento real añade:',
    items: [
      'Verificar el <b>error de cero</b> del micrómetro contra un patrón antes de medir, y corregirlo <b>mecánicamente</b> (llave de ajuste) siempre que sea posible, no solo aritméticamente.',
      'Usar siempre el <b>trinquete</b> (o embrague friccionante) para el contacto final, nunca el tambor directamente, para no aplicar una fuerza de medición excesiva o inconsistente.',
      'Fijar la pieza sin holgura antes de tomar lecturas de runout o planitud: un montaje flojo introduce variación que no es del instrumento ni de la pieza.',
      'Comparar el resultado (TIR, planitud) contra la tolerancia que exige el <b>plano de la pieza</b>, no contra un valor genérico — la misma medición puede aceptarse o rechazarse según la clase de tolerancia aplicable.'
    ]
  },
  s5: {
    modela: 'la lectura del micrómetro en tres términos (mm del manguito + media vuelta + división del tambor × 0.01 mm) derivada de un husillo de 0.5 mm/vuelta con tambor de 50 divisiones; la corrección aritmética por error de cero con signo; el criterio conceptual de uso del trinquete sin inventar una cifra de error; el cálculo de TIR (runout) como máxima − mínima entre 6 ángulos fijos; y el cálculo de planitud como máxima − mínima entre 5 puntos fijos, evaluado contra dos clases de tolerancia distintas.',
    noModela: 'la corrección mecánica real del error de cero (se hace aritméticamente aquí), la magnitud de error por saltarse el trinquete, el error de coseno de un comparador tipo palanca, la fuerza de medición variable del operador, ni la dilatación térmica o la deriva de calibración de ningún instrumento.'
  },
  s6: [
    '<b>ASME B89.1.13-2013 (R2022) "Micrometers"</b>: norma ancla de diseño y exactitud de micrómetros.',
    '<b>ISO 3611:2023</b>: micrómetros para medición externa — equivalente internacional.',
    '<b>ASME B89.1.10M-2001 (R2016/R2021) "Dial Indicators (for Linear Measurements)"</b>: norma ancla de diseño y exactitud de comparadores de carátula.',
    '<b>ISO 463:2006</b>: diseño y características metrológicas de comparadores de carátula y digitales — equivalente internacional.',
    '<b>ASME Y14.5-2018 / ISO 1101</b>: contexto conceptual de runout y planitud como controles geométricos normados (GD&T); este lab calcula la diferencia máx−mín, no el sistema completo de GD&T.',
    'Manual del fabricante de tu micrómetro o comparador para el rango de medición y la exactitud garantizada específicos de tu instrumento.'
  ]
});
