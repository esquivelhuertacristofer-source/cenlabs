/* Ficha técnica · Bus CAN: Diagnóstico con Osciloscopio — contenido específico del lab */
fichaTecnica({
  title: 'Bus CAN — señalización diferencial, terminación y arbitraje',
  intro: 'Este laboratorio continúa al de <b>osciloscopio</b> y al de <b>escáner OBD-II / readiness</b>: ahí aprendiste a leer una señal y a interpretar lo que reporta un escáner ya conectado; aquí bajas una capa más, a la red física de dos hilos (CAN_H y CAN_L) que hace posible que esos datos viajen entre las ECU. El modelo usa señalización diferencial y terminación de 120 Ω por extremo, sin atajos ni cifras inventadas.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> panel de osciloscopio virtual con traza diferencial CAN_H/CAN_L calculada en vivo, dos nodos con resistor terminador de 120 Ω en cada extremo físico del bus, y controles para retirar un terminador, provocar un cortocircuito CAN_H–CAN_L, o revelar un segundo nodo transmitiendo en simultáneo (arbitraje).',
    omitidos: [
      '<b>La decodificación real de una trama CAN completa</b> (SOF, campo de arbitraje/identificador, RTR, control, datos, CRC, ACK, EOF) bit a bit — el modelo muestra el efecto agregado en la traza diferencial, no un decodificador de protocolo.',
      '<b>El bit-stuffing</b> (inserción de un bit de polaridad opuesta tras 5 bits idénticos consecutivos), parte del mecanismo real de codificación CAN.',
      '<b>El estado de "bus-off"</b> que alcanza un nodo tras acumular demasiados errores de transmisión, ni la máquina de estados de manejo de errores (activo/pasivo/bus-off) de ISO 11898-1.',
      '<b>Buses CAN multi-segmento con gateways</b> entre distintas redes del vehículo (p. ej. bus de carrocería vs. bus de motor) — el modelo es un solo segmento con nodos simples.',
      '<b>CAN FD</b> (Flexible Data-Rate) ni ninguna variante de mayor velocidad o payload extendido — el modelo es CAN clásico de alta velocidad (ISO 11898-2).',
      '<b>Las curvas de conmutación de un transceptor comercial específico</b> (tiempos de subida/bajada, capacitancia de línea): los voltajes mostrados son representativos, no sustituyen la hoja de datos del fabricante.'
    ]
  },
  s2: {
    title: 'Los 4 casos: voltajes representativos CAN_H/CAN_L/diferencial',
    warn: 'Los valores son representativos de un transceptor típico de alta velocidad (ISO 11898-2) — consulta la hoja de datos del transceptor específico para cifras exactas. En un vistazo estático, el caso "Arbitraje" muestra los mismos niveles limpios que "Sano", porque el arbitraje ES señalización normal: lo que lo distingue no es el voltaje sino que dos nodos compiten por el bus al mismo tiempo. Los 120 Ω son dos resistores físicos, uno en cada extremo; el ≈60 Ω es solo su efecto combinado visto en paralelo desde cualquier nodo, no un tercer componente instalado aparte.',
    rows: [
      ['Caso', 'CAN_H', 'CAN_L', 'Diferencial'],
      ['Sano (bit dominante)', '≈3.5 V', '≈1.5 V', '≈2 V'],
      ['Terminador faltante', 'oscila (ringing)', 'oscila (ringing)', 'ringing antes de ≈2 V'],
      ['Cortocircuito CAN_H–CAN_L', '≈2.5 V', '≈2.5 V', '≈0 V (no se desarrolla)'],
      ['Arbitraje (dos nodos)', '≈3.5 V', '≈1.5 V', '≈2 V']
    ]
  },
  s3: [
    'Osciloscopio de dos canales con medición diferencial (canal A − canal B) o sonda diferencial dedicada para bus CAN.',
    'Multímetro para medir resistencia de terminación con el bus sin energizar (≈60 Ω combinados entre CAN_H y CAN_L, ≈120 Ω en cada terminador por separado).',
    'Escáner o analizador de bus CAN capaz de decodificar el tráfico de tramas (fuera del alcance de este lab, que se queda en la capa física).',
    'Manual de servicio del fabricante para la ubicación física de los dos terminadores de 120 Ω en el vehículo específico.'
  ],
  s4: {
    intro: 'Leer una traza diferencial limpia es el punto de partida, no el diagnóstico completo. Un procedimiento real añade:',
    items: [
      'Medir la resistencia de terminación con el bus <b>sin energizar</b>, antes de interpretar cualquier traza en vivo, para no confundir un terminador faltante con otra falla.',
      'Confirmar en cuáles <b>dos</b> nodos físicos del vehículo viven los terminadores de 120 Ω — nunca deben estar en un nodo intermedio.',
      'Distinguir el ringing por terminador faltante del ringing por un cable dañado o un conector con mal contacto, que puede dejar una firma similar.',
      'Verificar continuidad hilo por hilo antes de concluir "cortocircuito": un CAN_H o CAN_L en corto a masa o a batería produce una traza distinta a un corto entre ambos hilos.',
      'Si se sospecha arbitraje anómalo (un nodo que nunca cede o transmite fuera de su ciclo esperado), usar un analizador de bus real para decodificar el identificador exacto — el osciloscopio muestra la forma de onda, no el contenido del mensaje.'
    ]
  },
  s5: {
    modela: 'la señalización diferencial CAN_H/CAN_L con sus niveles representativos recesivo y dominante, la terminación de 120 Ω en cada extremo del bus y su efecto combinado de ≈60 Ω, la firma de ringing de un terminador faltante, la firma de un cortocircuito CAN_H–CAN_L, y el arbitraje bit a bit no destructivo entre dos nodos.',
    noModela: 'la decodificación real de una trama CAN completa (SOF, identificador, control, datos, CRC, ACK, EOF), el bit-stuffing, el estado de bus-off ni la máquina de estados de error de ISO 11898-1, buses multi-segmento con gateways, CAN FD, ni las curvas de conmutación de un transceptor comercial específico.'
  },
  s6: [
    '<b>ISO 11898-1:2024</b>: capa de enlace de datos CAN — formato de trama, arbitraje bit a bit no destructivo, bits recesivo/dominante.',
    '<b>ISO 11898-2:2026</b>: capa física CAN de alta velocidad — señalización diferencial CAN_H/CAN_L, terminación de 120 Ω en cada extremo.',
    '<b>Bosch CAN Specification 2.0</b> (1991): especificación original de acceso abierto, base histórica de las normas ISO 11898 vigentes.',
    'Notas de aplicación de fabricantes de transceptores (Texas Instruments SLLA270, Microchip AN228): fuentes secundarias usadas para triangular los valores representativos de voltaje diferencial ante el acceso restringido a las normas ISO vigentes.',
    'Manuales de servicio OEM para la ubicación física de los terminadores y el tipo exacto de transceptor de un vehículo real.'
  ]
});
