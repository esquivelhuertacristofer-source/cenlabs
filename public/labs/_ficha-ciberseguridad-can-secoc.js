/* Ficha técnica · Ciberseguridad del bus CAN: autenticación de mensajes y ataque de reproducción — contenido específico del lab */
fichaTecnica({
  title: 'Ciberseguridad del bus CAN: autenticación de mensajes y ataque de reproducción',
  intro: 'Este laboratorio muestra un <b>bus CAN a 500 kbit/s</b> con cuatro módulos (puerta de enlace, motor, tablero y freno) y la caja de un intruso conectada al puerto de diagnóstico. La puerta de enlace manda al freno la orden «frenar» cada <i>T</i> ms en una trama de 8 bytes (64 bits): <b>16 de orden, 8 de contador y <i>m</i> de firma</b> (un MAC truncado, al estilo de AUTOSAR SecOC). El intruso repite tramas grabadas e inventa firmas al azar; tú eliges el largo de la firma, la ventana del contador y el periodo. <b>Es un modelo didáctico, no una implementación de SecOC:</b> la firma es una mezcla de bits sin valor criptográfico.',
  s1: {
    presentes: '<b>Presentes en el modelo:</b> la trama CAN 2.0A de 11 bits de identificador construida <b>bit a bit</b> (SOF, ID, DLC, datos, CRC-15 de polinomio 0x4599), el <b>relleno de bits</b> real y la cota del peor caso de Davis et al. (135 bits = 270 µs con 8 bytes); la carga del bus como Σ bits·2 µs / periodo sobre un fondo de 28 mensajes (25,92 %); el reparto de los 64 bits y los bits que <b>quedan libres</b>; la <b>probabilidad de adivinar la firma</b> 2<sup>−<i>m</i></sup> y, con <i>N</i> intentos, 1 − (1 − 2<sup>−<i>m</i></sup>)<sup><i>N</i></sup>; un emisor con contador largo (invisible) del que viajan sólo los 8 bits bajos, y un receptor que acepta si el avance está entre 1 y <i>W</i> y la firma coincide con el contador reconstruido; las pérdidas por ruido y la <b>pérdida de sincronía</b> cuando faltan <i>W</i> órdenes seguidas; el retardo del peor caso (periodo + bloqueo + trama + firmar y comprobar). Cada trama que ves viajar y cada veredicto sale de esa misma verificación.',
    omitidos: [
      '<b>La criptografía real:</b> la firma es una mezcla de bits tipo murmur3 truncada. No es CMAC ni HMAC y no protege nada de verdad; sólo sirve para ver cómo se comporta una firma de <i>m</i> bits.',
      '<b>Ataques a la clave, canales laterales y fuerza bruta fuera de línea:</b> el intruso no conoce la clave y adivina al azar un número fijo de veces.',
      '<b>El arbitraje, la prioridad de los identificadores y los errores reales del bus:</b> los demás 28 mensajes son sintéticos y la distancia de los envíos en pantalla no está a escala.',
      '<b>Los temporizadores de vigilancia, la sincronización de contadores (Freshness Value Manager) y el reinicio de módulos:</b> el «hueco tolerado» (<i>W</i>·<i>T</i>) es un <b>criterio de diseño</b> —cuánto tiempo puede estar el freno sin órdenes válidas— y no una probabilidad de ataque.',
      '<b>Que un intruso entregue en orden, con retraso, todas las tramas que retuvo:</b> eso lo detecta un temporizador, no la ventana.'
    ]
  },
  s2: {
    title: 'Propiedades y parámetros del modelo',
    warn: '⚠ Es un modelo <b>didáctico</b> de defensa. No lo uses para dimensionar un vehículo real: las cifras de ataque (20 000 y 300 000 intentos), el 3 % de pérdidas por ruido y los topes del reto son valores de enseñanza.',
    rows: [
      ['Parámetro', 'Contexto', 'Valor'],
      ['Bus CAN', 'velocidad · tiempo de bit', '500 kbit/s · 2 µs'],
      ['Trama de 8 bytes', 'sin relleno · peor caso con relleno · duración', '111 bits · 135 bits · 270 µs'],
      ['Mensaje de frenado', 'datos · contador visible · firma', '16 bits · 8 bits · <i>m</i> bits (libres = 40 − <i>m</i>)'],
      ['Resto del coche', '28 mensajes de 8 bytes (10, 20, 50 y 100 ms)', '25,92 % del bus'],
      ['Tope del bus', 'carga sostenida recomendada (didáctica)', '30 %'],
      ['Firma', 'probabilidad de acertar en un intento', '2<sup>−<i>m</i></sup> (24 bits: 1 de 16 777 216)'],
      ['Escenario «Visita al taller»', '20 000 intentos · hueco ≤ 80 ms', 'firma ≥ 25 bits para 1 de 1 000'],
      ['Escenario «Autopista»', '300 000 intentos · hueco ≤ 70 ms', 'firma ≥ 29 bits para 1 de 1 000'],
      ['Ruido', 'órdenes perdidas · tope de fallos propios', '3 % · 1 cada 1 000 h'],
      ['Firmar y comprobar', 'en cada módulo (didáctico)', '30 µs + 2 µs por bit'],
      ['Retardo máximo de la orden', 'periodo + bloqueo + trama + firma', '12 ms (periodo ≤ 11 ms)'],
      ['Combinaciones válidas', 'de 31 160 (firma × ventana × periodo)', 'taller: 152 (0,49 %) · autopista: 52 (0,17 %)']
    ]
  },
  s3: [
    'Analizador de tráfico CAN para registrar identificadores, periodos y contadores, y comparar con la matriz de comunicación del vehículo.',
    'Escáner con acceso al bus para leer los códigos de fallo de verificación de firma y de sincronía de contadores de cada módulo.',
    'Osciloscopio para el nivel físico (forma de onda); está en otro laboratorio de esta plataforma.',
    'Un banco con la puerta de enlace y el módulo de freno para repetir el ataque sin riesgo.'
  ],
  s4: {
    intro: 'El orden del laboratorio (cálculo, ajuste, diagnóstico) es una <b>descomposición pedagógica</b>. El análisis real de un incidente en un bus CAN añade:',
    items: [
      'Buscar identificadores que no deberían existir o periodos distintos del diseño: un intruso suele delatarse por el tráfico extra.',
      'Revisar qué módulo reportó fallos de firma o de contador y en qué momento, y si coinciden con un acceso al puerto de diagnóstico.',
      'Comprobar que la puerta de enlace filtra lo que llega del puerto de diagnóstico y no deja pasar mensajes de frenado.',
      'Verificar la gestión de claves y de contadores tras reiniciar o reemplazar un módulo antes de culpar a la red.'
    ]
  },
  s5: {
    modela: 'una <b>trama CAN real bit a bit</b> (CRC-15 verificado: el residuo del mensaje con su CRC es 0 y un solo bit cambiado siempre cambia el CRC), el relleno de bits sin seis iguales seguidos y reversible, y la cota 34 + 8<i>n</i> + 13 + ⌊(33 + 8<i>n</i>)/4⌋; la carga del bus y el retardo con formas cerradas; la probabilidad de acertar la firma contra Monte Carlo (la tasa de éxito de una firma al azar es 2<sup>−<i>m</i></sup> y <b>no se multiplica por la ventana</b>); la <b>repetición justo tras una vuelta del contador de 8 bits</b>, que pasa el contador pero la firma —calculada con el contador largo— la rechaza con probabilidad 1 − 2<sup>−<i>m</i></sup> (y que <b>sin firma sí pasa</b>: el contador solo no basta); y la pérdida de sincronía contra la fórmula (1 − <i>q</i>)<i>q</i><sup><i>W</i></sup> por mensaje. El reto exige seis requisitos a la vez y sólo cumplen el 0,49 % (taller) y el 0,17 % (autopista) de las combinaciones; la ventana es interior en los tres mandos. Se verifica con 131 comprobaciones.',
    noModela: 'la <b>criptografía real</b> (la firma es una mezcla de bits didáctica), los ataques a la clave, el arbitraje y los errores de CAN, los temporizadores de vigilancia y la sincronización de contadores entre módulos. El «hueco tolerado» <i>W</i>·<i>T</i> es un criterio de diseño y no el resultado de una simulación de ataque. Los envíos se ven en <b>cámara lenta ×1/25</b> y las distancias no están a escala. Los topes (30 % de bus, 12 ms, 1 de 1 000, 8 bits libres) son <b>didácticos</b>. No es una implementación de AUTOSAR SecOC ni una certificación de ciberseguridad (ISO/SAE 21434).'
  },
  s6: [
    'ISO 11898-1, Controller Area Network (CAN): formato de la trama, CRC-15 y relleno de bits.',
    'Davis, R. I., Burns, A., Bril, R. J. y Lukkien, J. J., <i>Controller Area Network (CAN) schedulability analysis: Refuted, revisited and revised</i>, Real-Time Systems, 2007 (cota del tiempo de trama con relleno).',
    'AUTOSAR, <i>Specification of Secure Onboard Communication</i> (SecOC): valor de frescura truncado y MAC truncado.',
    'ISO/SAE 21434, Road vehicles — Cybersecurity engineering.'
  ]
});
