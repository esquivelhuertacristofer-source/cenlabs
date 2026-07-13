/* Ficha técnica · Diagnóstico de Fallo de Encendido — contenido específico del lab */
fichaTecnica({
  title: 'Fallo de encendido — pendiente, confirmado y testigo MIL',
  intro: 'Este laboratorio continúa al de <b>escáner OBD-II</b>: aquí ya no se explica el conector ni los modos de servicio en general, sino la <b>lógica de dos ciclos</b> con la que la ECU pasa un fallo de encendido de "pendiente" a "confirmado", la <b>regla de atribución por cilindro</b> y el significado real del testigo <b>MIL fijo vs. parpadeante</b>. La geometría y las tasas de fallo son <b>procedurales y didácticas</b>; donde el modelo simplifica, aquí se documenta.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> escáner con Modo $01/$02/$03/$07, tablero con testigo MIL, bloque de motor con 4 cilindros marcados y cigüeñal con sensor de posición (CKP).',
    omitidos: [
      '<b>Algoritmo real de detección</b>: la ECU infiere el fallo de encendido midiendo variaciones diminutas de la velocidad angular del cigüeñal entre eventos de combustión, con compensación por irregularidades de manufactura del volante — no una lectura directa de "combustión sí/no" por cilindro.',
      '<b>Sensor de posición del árbol de levas (CMP)</b> y su papel para sincronizar la ventana de cada cilindro dentro del ciclo de 720°.',
      '<b>Calibración específica del fabricante</b>: los umbrales exactos de tasa de fallos, el tamaño de las ventanas de evaluación y las condiciones habilitantes (rpm, carga, temperatura) varían por modelo y año.',
      '<b>Monitores de disponibilidad (readiness)</b> y el ciclo de manejo real necesario para completarlos tras borrar códigos.',
      '<b>Daño físico real al catalizador</b>: el parpadeo del MIL señala el riesgo, no mide el daño acumulado.',
      '<b>Otras causas de fallo de encendido</b> no representadas aquí (mezcla pobre, fuga de vacío, baja compresión, bujía/bobina defectuosa): el modelo asume que el fallo ya ocurrió y se enfoca en cómo el sistema OBD-II lo reporta.'
    ]
  },
  s2: {
    title: 'Lógica de diagnóstico y comportamiento del MIL',
    warn: 'Conceptos y estructura del estándar. Las <b>tasas de fallo exactas, ventanas de revoluciones y umbrales</b> son específicos de cada fabricante: consulta CARB 13 CCR §1968.2 para el marco regulatorio completo y el manual de servicio para cifras de un vehículo real.',
    rows: [
      ['Elemento', 'Detalle', 'Ref.'],
      ['Modo $07 (pendiente)', 'Nace de una sola detección que cumple el criterio de prueba; todavía NO enciende el MIL.', 'SAE J1979 · ISO 15031-5'],
      ['Modo $03 (confirmado)', 'El fallo se repite en un ciclo de manejo posterior bajo condiciones similares ⇒ DTC confirmado.', 'CARB 13 CCR §1968.2'],
      ['Atribución por cilindro', 'Si la gran mayoría de los eventos detectados proviene de un mismo cilindro, el código pasa de P0300 (genérico) a P030X (específico).', 'CARB 13 CCR §1968.2 · SAE J2012'],
      ['MIL fija (Tipo B)', 'La tasa de fallos cruza el umbral de emisiones (ventana amplia); el testigo permanece encendido de forma continua.', 'CARB 13 CCR §1968.2'],
      ['MIL parpadeante (Tipo A)', 'La tasa de fallos cruza el umbral de riesgo para el catalizador (ventana corta); el testigo parpadea mientras el fallo ocurre.', 'CARB 13 CCR §1968.2']
    ]
  },
  s3: [
    'Escáner con capacidad de Modo $01 (vivo), $02 (congelado), $03/$07 (confirmados/pendientes) y registro de datos en carretera (data logging).',
    'Osciloscopio automotriz para verificar la <b>forma de onda</b> real del sensor CKP (y CMP), no solo su presencia.',
    'Medidor de compresión / probador de fugas para descartar causa mecánica antes de asumir causa electrónica.',
    'Manual de servicio del fabricante para los umbrales, ventanas y condiciones habilitantes exactas del monitor.'
  ],
  s4: {
    intro: 'Leer el DTC es el <b>inicio</b>, no el diagnóstico. Un procedimiento real añade:',
    items: [
      'Revisar el <b>cuadro congelado</b> (condiciones exactas cuando se confirmó el código) y el historial de manejo.',
      'Verificar mecánicamente el cilindro señalado (compresión, bujía, bobina, inyector) antes de asumir una causa electrónica.',
      'Distinguir si el patrón afecta a <b>un solo cilindro</b> (causa local) o a <b>varios</b> (causa común: combustible, admisión, sincronización).',
      'Reparar, borrar códigos y repetir un <b>ciclo de manejo</b> para confirmar la corrección y dejar los monitores "listos".'
    ]
  },
  s5: {
    modela: 'la lógica de dos ciclos (pendiente → confirmado), la regla de atribución de cilindro por mayoría de eventos, el cuadro congelado ligado al momento del evento, y la distinción MIL fija (Tipo B) vs. parpadeante (Tipo A).',
    noModela: 'el algoritmo real de detección por variación angular del cigüeñal, la calibración exacta de un fabricante particular, ni el daño físico real al catalizador.'
  },
  s6: [
    '<b>CARB 13 CCR §1968.2</b>: requisitos de diagnóstico a bordo — monitor de fallo de encendido, atribución de DTC por cilindro, comportamiento del MIL.',
    '<b>SAE J1979 / ISO 15031-5</b>: modos de servicio ($01 vivo, $02 congelado, $03 confirmados, $07 pendientes).',
    '<b>SAE J2012 / ISO 15031-6</b>: formato y definición de los DTC (P0300 genérico, P0301–P0304 por cilindro).',
    '<b>NOM-047-SEMARNAT-2014</b> (México): monitores de disponibilidad para la verificación vehicular.',
    'Manuales OEM y bases técnicas (Mitchell1 / ALLDATA) para umbrales y diagramas 1:1.'
  ]
});
