/* Ficha técnica · Monitores de Disponibilidad (Readiness) y Tabla 1 — contenido específico del lab */
fichaTecnica({
  title: 'Readiness y Tabla 1 — aprobación, rechazo y no evaluable',
  intro: 'Este laboratorio continúa al de <b>escáner OBD-II</b>: ahí aprendiste a conectar el escáner y leer datos y códigos; aquí usas esa misma lectura para responder la pregunta con la que se diseñó todo el sistema — ¿el vehículo <b>aprueba</b> la verificación vehicular? La <b>Tabla 1</b> de NOM-167-SEMARNAT-2017 exige tres criterios independientes; el modelo aplica exactamente esos tres, sin atajos ni cifras inventadas.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> panel bajo el tablero con conector DLC de 16 pines (SAE J1962 / ISO 15031-3), testigo MIL, escáner con pantalla y cable de conexión al DLC.',
    omitidos: [
      '<b>El método Dinámica/Estática (Tabla 9)</b>: para vehículos año-modelo anterior a 2006, mayores a 3857 kg, convertidos a gas LP/natural, o diésel. Este lab modela únicamente el método SDB, aplicable a 2006 en adelante con OBD-II/EOBD.',
      '<b>El Catálogo Vehicular</b> del num. 4.1.1.3 — un tercer conjunto de monitores obligatorios para SDB fuera de los dos tipos definidos, aún no publicado por la propia norma (Transitorio Tercero).',
      '<b>El monitor de Combustible condicional del num. 4.1.1.2</b> (SDB tipo EOBD Euro 3-4): ese tipo exige solo 4 monitores obligatorios, con el de Combustible aplicable únicamente "para aquellos vehículos que lo tengan incorporado". El modelo usa el tipo más exigente (5 obligatorios, num. 4.1.1.1).',
      '<b>El Artículo Transitorio Décimo Segundo</b> (la luz MIL como criterio de aptitud para intentar el método SDB, mientras NOM-047 no se actualice): es una provisión temporal y ambigua sin leer NOM-047 directamente — deliberadamente no se usa en ningún caso del lab.',
      '<b>El protocolo eléctrico real del bus</b> (CAN, K-Line) detrás del conector DLC, y los tipos de conector alterno de 14 pines del Anexo normativo I, num. 4.',
      '<b>El ciclo de manejo real</b> necesario para que un monitor pase de "no completado" a "completado" tras borrar códigos: el modelo presenta el estado ya resuelto de cada caso, no el proceso de completarlo.'
    ]
  },
  s2: {
    title: 'Los tres criterios de la Tabla 1 (num. 4.1.2)',
    warn: 'Los tres criterios son <b>independientes</b>: ninguno sustituye a otro, y los tres deben cumplirse para "Aprobado". El conteo exacto de monitores obligatorios (5 en este lab) corresponde al tipo de SDB OBD-II/EOBD Euro 5+ (num. 4.1.1.1); otros tipos de SDB tienen otro conteo — consulta el manual del verificador para el tipo de tu vehículo.',
    rows: [
      ['Criterio', 'Qué exige', 'Ref.'],
      ['1 · Conexión exitosa', 'El escáner debe establecer comunicación con el SDB del vehículo. Sin conexión, no hay verificación posible por este método — no es ni aprobado ni rechazado.', 'Anexo normativo I, num. 2.3/2.6'],
      ['2 · Sin DTC confirmado', 'Ningún código de falla confirmado asociado a los monitores del num. 4.1.1. Pesa aparte del criterio 3: un DTC confirmado rechaza aunque el readiness esté perfecto.', 'NOM-167, num. 4.1.2 / Tabla 1'],
      ['3 · Obligatorios "completados"', 'Los monitores obligatorios de ese tipo de SDB (5 para OBD-II/EOBD Euro 5+) deben estar "completados", con cero tolerancia. "No soportado" no cuenta en contra.', 'NOM-167, num. 4.1.1.1 / Tabla 1']
    ]
  },
  s3: [
    'Escáner con capacidad de leer el estado de los monitores de disponibilidad (Modo $01 PID 01) además de Modo $03/$07.',
    'Equipo del Programa de Verificación Vehicular (banco dinamométrico u opacímetro) para los vehículos que caen en el método Dinámica/Estática, fuera del alcance de este lab.',
    'Base de datos del fabricante o del verificador para identificar el tipo exacto de SDB (num. 4.1.1.1 / 4.1.1.2 / 4.1.1.3) de un vehículo particular.',
    'Manual de servicio del fabricante para las condiciones habilitantes del ciclo de manejo que completa cada monitor no continuo.'
  ],
  s4: {
    intro: 'Leer el resultado de readiness es el <b>punto de partida</b>, no el veredicto en sí. Un procedimiento real añade:',
    items: [
      'Verificar primero que la <b>conexión</b> con el SDB fue exitosa antes de interpretar cualquier otro dato — sin conexión, los tres intentos del Anexo I no dan un veredicto automático.',
      'Revisar si existe un <b>código de falla confirmado</b> asociado a los monitores del num. 4.1.1, sin importar cuán completo esté el readiness.',
      'Identificar el <b>tipo de SDB</b> del vehículo (num. 4.1.1.1 o 4.1.1.2) para saber cuántos y cuáles monitores son obligatorios antes de contarlos.',
      'Distinguir un monitor "<b>no soportado</b>" (ausente de fábrica por diseño, no es falla) de uno "<b>no completado</b>" (existe pero falta su ciclo de evaluación, si es obligatorio sí bloquea).',
      'Si el resultado es "no evaluable", identificar qué ciclo de manejo específico falta —no repetir la prueba sin más— antes de citar al propietario.'
    ]
  },
  s5: {
    modela: 'los tres criterios independientes de la Tabla 1 en el orden correcto, el conjunto de 5 monitores obligatorios del num. 4.1.1.1, la distinción "no soportado" vs. "no completado" (num. 3.20/3.21), y el límite de 3 intentos de conexión del Anexo normativo I (num. 2.6) sin ruta automática a un veredicto si fallan.',
    noModela: 'el método Dinámica/Estática (Tabla 9) para vehículos fuera del alcance del SDB, el Catálogo Vehicular aún no publicado (num. 4.1.1.3), el tipo de SDB EOBD Euro 3-4 con su monitor condicional (num. 4.1.1.2), el Artículo Transitorio Décimo Segundo, ni el ciclo de manejo real que completa un monitor.'
  },
  s6: [
    '<b>NOM-167-SEMARNAT-2017</b>: método del Sistema de Diagnóstico a Bordo (SDB) — definiciones (§3), aplicabilidad y monitores obligatorios (§4.1/§4.1.1), Tabla 1 de criterios de aprobación (§4.1.2), Tabla 9 de aplicabilidad por año-modelo y peso (§5.1), Anexo normativo I (procedimiento de conexión).',
    '<b>NOM-047-SEMARNAT-2014</b> (México): método Dinámica/Estática para los vehículos que NOM-167 excluye del método SDB.',
    '<b>SAE J1979 / ISO 15031-5</b>: modos de servicio ($01 vivo, $03 confirmados, $07 pendientes) y bibliografía del ciclo de manejo citada por la propia NOM-167.',
    '<b>SAE J1962 / ISO 15031-3</b>: especificación física del conector DLC de 16 pines.',
    'Manuales OEM y bases técnicas (Mitchell1 / ALLDATA) para el tipo de SDB y las condiciones habilitantes de un vehículo real.'
  ]
});
