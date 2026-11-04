import {diagnostics} from './_control-avanzado-diagnostico-definiciones.js';

export const definitions = [{
  id: 291,
  slug: 'pid-ziegler-nichols-antiwindup',
  module: 'Mecatrónica',
  area: 'MECATRÓNICA',
  title: 'PID de velocidad con anti-windup',
  longTitle: 'Ajuste Ziegler–Nichols y recuperación de un motor saturado',
  eyebrow: 'Orden de trabajo · Control de velocidad',
  intro: 'Cuando el motor ya recibe toda la tensión disponible, el controlador todavía puede acumular error. Observa qué ocurre al bajar la consigna.',
  explore: 'Compara la recuperación con y sin corrección del integrador. Repite el ensayo después de cambiar el ajuste.',
  controls: [
    { id: 'gain', label: 'Factor sobre ajuste Z–N', min: .4, max: 1.4, step: .1, unit: '', decimals: 1 },
    { id: 'tracking', label: 'Corrección del integrador', min: 0, max: 8, step: 1, unit: 's⁻¹', decimals: 0 }
  ],
  metrics: [
    { label: 'Velocidad', key: 'speed', unit: '%', scale: 100, decimals: 1 },
    { label: 'Consigna', key: 'target', unit: '%', scale: 100, decimals: 0 },
    { label: 'Tensión aplicada', key: 'voltage', unit: '%', scale: 100, decimals: 1 },
    { label: 'Integral', key: 'integral', unit: '%', scale: 100, decimals: 1 }
  ],
  task: 'Recupera la banda de ±3 puntos en ≤1,8 s y conserva un error final ≤1 punto. Mantén el factor de ajuste entre 0,6 y 1,2.',
  job: 'OT-291 · Recupera el control de velocidad tras una consigna que supera la capacidad del accionamiento.',
  equations: 'Planta de tres retardos iguales P(s)=1/(1+0,25s)³. El ensayo proporcional ideal da Ku=8 y Pu=2π·0,25/√3. Z–N de ganancia última da Kp=0,6Ku, Ti=Pu/2 y Td=Pu/8. El primer mando escala Kp, Ki y Kd. La derivada usa la salida medida. u=limitar(Kp·e+I−Kd·dy/dt,0,1), dI/dt=Ki·e+Kt·(u−u_sin_límite). Muestreo de 5 ms con retención del mando y avance exacto de la planta entre muestras.',
  limits: 'Velocidad y tensión normalizadas. Consigna 140 % durante 2,5 s y 55 % hasta 8 s. La referencia inicial provoca saturación deliberada. La recuperación se mide desde el cambio hasta la última salida de la banda. La planta es equivalente y el giro del rodillo representa una vuelta por segundo al 100 %. La regla Z–N proporciona un punto de partida para este modelo.',
  quiz: '¿Qué señal corrige el integrador cuando la tensión se satura?',
  answers: ['La diferencia entre el mando aplicado y el mando sin limitar.', 'La velocidad al cuadrado.', 'La consigna dividida entre la corriente.', 'La diferencia entre los dos diámetros del rodillo.'],
  faults: [
    ['Acumulación integral', 'Baja la consigna y la tensión permanece alta durante demasiado tiempo.', 'Compara mando sin limitar y tensión aplicada.'],
    ['Ganancia excesiva', 'La recuperación presenta oscilaciones por un ajuste agresivo.', 'El ajuste inicial necesita comprobarse sobre la planta.'],
    ['Referencia inalcanzable', 'El mando llega al máximo mientras sigue existiendo error.', 'La consigna excede el equilibrio que permite el actuador.']
  ],
  labels: 'Motor · acople · rodillo · apoyos · señal de mando',
  caption: 'Rodillo de ensayo · una vuelta por segundo al 100 %',
  tools: 'Banco de motor con rodillo y analizador de velocidad, tensión e integral.',
  procedure: ['Observa el intervalo saturado.', 'Ajusta la ganancia y la corrección del integrador.', 'Registra la recuperación y compara la tensión ordenada con la aplicada.'],
  timeScale: 1,
  signals: 'Velocidad y consigna (%)',
  sourceName: 'Åström y Murray · Feedback Systems, PID Control',
  source: 'https://www.cds.caltech.edu/~murray/amwiki/PID_Control.html',
  concepts: [
    { icono: '⚙️', nombre: 'Saturación', descripcion: 'El actuador tiene un límite de tensión aunque el controlador pida más.' },
    { icono: '📐', nombre: 'Ganancia última', descripcion: 'La oscilación marginal de la planta permite estimar el ajuste inicial.' },
    { icono: '↩️', nombre: 'Anti-windup', descripcion: 'La diferencia de mando corrige la acumulación integral.' }
  ],
  tour: [
    { title: 'Motor al límite', text: 'La primera consigna pide más velocidad de la que permite la tensión disponible.', view: 'assembly' },
    { title: 'Recuperación', text: 'Al bajar la consigna, el integrador puede mantener el mando saturado.', view: 'inspection' },
    { title: 'Compara el ensayo', text: 'Ajusta la corrección y valida el tiempo de recuperación.', view: 'assembly' }
  ]
}, {
  id: 292, slug: 'bode-margenes-estabilidad', module: 'Mecatrónica', area: 'MECATRÓNICA',
  title: 'Bode y márgenes de estabilidad',
  longTitle: 'Respuesta en frecuencia de un servo con compensador de adelanto',
  eyebrow: 'Orden de trabajo · Respuesta en frecuencia',
  intro: 'Dos señales pueden tener el mismo tamaño y llegar en momentos distintos. Ese retraso cambia cómo se comporta un lazo de control.',
  explore: 'Los dos indicadores se mueven a la frecuencia de cruce. Compara el retraso de la salida y registra los márgenes.',
  controls: [
    {id: 'gain', label: 'Ganancia del lazo', min: 2, max: 14, step: .5, unit: '', decimals: 1},
    {id: 'lead', label: 'Separación polo/cero', min: 1, max: 5, step: .5, unit: '', decimals: 1}
  ],
  metrics: [
    {label: 'Margen de fase', key: 'phaseMargin', unit: '°', scale: 1, decimals: 1},
    {label: 'Margen de ganancia', key: 'gainMargin', unit: 'dB', scale: 1, decimals: 1},
    {label: 'Cruce de 0 dB', key: 'crossover', unit: 'rad/s', scale: 1, decimals: 2},
    {label: 'Cruce de −180°', key: 'phaseCrossover', unit: 'rad/s', scale: 1, decimals: 2}
  ],
  task: 'Consigue margen de fase de 45° a 70°, margen de ganancia ≥8 dB y frecuencia de cruce ≥4,5 rad/s.',
  job: 'OT-292 · Ajusta un compensador y comprueba ambos márgenes antes de cerrar el lazo.',
  equations: 'Planta 1/(1+s/4)³ y compensador K(1+s/4)/(1+s/(4a)). L(s)=K/[(1+s/4)²(1+s/(4a))]. En cruce de magnitud se cumple |L(jωc)|=1. Margen de fase=180°+arg L(jωc). El cruce de fase ocurre a 4√(1+2a) rad/s. Margen de ganancia=−20 log₁₀|L(jωfase)|.',
  limits: 'Respuesta sinusoidal estacionaria del lazo abierto ideal. La cancelación de un polo es exacta en este modelo. Los indicadores muestran entrada y salida normalizadas en el cruce, donde sus amplitudes coinciden. El equipo físico y su escala de desplazamiento son ilustrativos.',
  quiz: '¿En qué frecuencia se evalúa el margen de fase?',
  answers: ['En el cruce de magnitud por 0 dB.', 'En cualquier frecuencia de la gráfica.', 'Siempre a 1 rad/s.', 'En el cruce de fase por −180°.'],
  faults: [
    ['Margen de fase bajo', 'La salida casi se invierte en el cruce de magnitud.', 'Comprueba la fase a 0 dB.'],
    ['Margen de ganancia bajo', 'A −180°, falta poca ganancia para llegar a 0 dB.', 'Compara magnitud y fase en sus cruces respectivos.'],
    ['Cruce demasiado lento', 'La robustez cumple, pero la frecuencia de cruce es baja.', 'Comprueba el objetivo de rapidez junto con los márgenes.']
  ],
  labels: 'Entrada · salida · guía · sensor',
  caption: 'Indicadores sincronizados a la frecuencia de cruce',
  tools: 'Dos indicadores lineales y analizador Bode de magnitud y fase.',
  procedure: ['Compara la fase de ambos indicadores.', 'Ajusta ganancia y adelanto.', 'Registra los dos cruces y valida los márgenes.'],
  timeScale: 1, signals: 'Entrada y salida normalizadas',
  sourceName: 'Åström y Murray · Feedback Systems, Frequency Domain Design',
  source: 'https://authors.library.caltech.edu/records/yzs24-xsx88',
  concepts: [
    {icono: '📈', nombre: 'Cruce de magnitud', descripcion: 'La ganancia del lazo vale uno.'},
    {icono: '↔️', nombre: 'Fase', descripcion: 'Expresa cuánto se retrasa la salida durante un ciclo.'},
    {icono: '🧰', nombre: 'Margen', descripcion: 'Mide cuánto cambio admite el lazo antes de alcanzar la condición marginal.'}
  ],
  tour: [
    {title: 'Compara los indicadores', text: 'Sus desplazamientos tienen la misma amplitud en el cruce de magnitud.', view: 'assembly'},
    {title: 'Mira el retraso', text: 'El desfase permanece aunque ajustes la ganancia de la entrada.', view: 'inspection'},
    {title: 'Abre el analizador', text: 'Ensaya y consulta los cruces en las curvas de magnitud y fase.', view: 'assembly'}
  ]
}, {
  id: 293, slug: 'lugar-raices-servo', module: 'Mecatrónica', area: 'MECATRÓNICA',
  title: 'Lugar de las raíces de un servo', longTitle: 'Polos de lazo cerrado de un servo proporcional',
  eyebrow: 'Orden de trabajo · Estabilidad del servo',
  intro: 'El eje recibe una pequeña perturbación. Según el ajuste, la oscilación desaparece, se mantiene o crece.',
  explore: 'Ajusta la ganancia y el tiempo de respuesta. Compara la perturbación con los polos.',
  controls: [
    {id: 'gain', label: 'Ganancia proporcional', min: 1, max: 12, step: .5, unit: '', decimals: 1},
    {id: 'lag', label: 'Constante de cada etapa', min: .15, max: .55, step: .05, unit: 's', decimals: 2}
  ],
  metrics: [
    {label: 'Parte real dominante', key: 'real', unit: 's⁻¹', scale: 1, decimals: 2},
    {label: 'Frecuencia amortiguada', key: 'imaginary', unit: 'rad/s', scale: 1, decimals: 2},
    {label: 'Amortiguamiento', key: 'damping', unit: '', scale: 1, decimals: 2},
    {label: 'Polo real', key: 'realPole', unit: 's⁻¹', scale: 1, decimals: 2}
  ],
  task: 'Logra amortiguamiento ≥0,20, caída de la envolvente al 5 % en ≤4 s y frecuencia amortiguada de 3 a 8 rad/s.',
  job: 'OT-293 · Ajusta el servo para disipar una perturbación angular.',
  equations: 'Denominador (1+τs)³+K. El polo real es (−1−∛K)/τ. El par tiene σ=(−1+∛K/2)/τ y ωd=√3∛K/(2τ). Se excita sólo el par. θ(t)=0,005 exp(σt) cos(ωdt). Si σ<0, t5%=ln(20)/(−σ).',
  limits: 'Modelo lineal equivalente de tres retardos y realimentación negativa unitaria. La respuesta representa un modo libre inicial. El indicador usa 0,9 tanh(θ/0,03) rad para mantener legible el recorrido. La traza muestra θ en grados. El ensayo dura 8 s.',
  quiz: '¿Qué ocurre si el par de polos cruza hacia el semiplano derecho?',
  answers: ['La envolvente de la perturbación empieza a crecer.', 'La frecuencia cae inmediatamente a cero.', 'El periodo cambia de signo.', 'Desaparece el polo real.'],
  faults: [
    ['Lazo inestable', 'La envolvente crece en cada oscilación.', 'Busca el par con parte real positiva.'],
    ['Amortiguamiento débil', 'La oscilación baja demasiado despacio.', 'Compara la parte real con el módulo del polo.'],
    ['Respuesta lenta', 'El par queda a la izquierda, cerca del eje imaginario.', 'La constante de tiempo cambia la escala de los polos.']
  ],
  labels: 'Servo · eje · indicador · soporte',
  caption: 'Indicador ampliado y acotado · ángulo del modelo en la traza',
  tools: 'Banco de servo con aguja angular, lugar de raíces y oscilograma.',
  procedure: ['Observa la perturbación.', 'Ajusta ganancia y constante de tiempo.', 'Comprueba los polos y la caída de la envolvente.'],
  timeScale: 1, signals: 'Perturbación angular (°)',
  sourceName: 'Caltech CDS · PID and Root Locus',
  source: 'https://www.cds.caltech.edu/~murray/courses/cds101/fa02/W8_PID.html',
  concepts: [
    {icono: '✳️', nombre: 'Polos', descripcion: 'Cada polo aporta un modo de respuesta.'},
    {icono: '📉', nombre: 'Envolvente', descripcion: 'La parte real determina la rapidez de crecimiento o caída.'},
    {icono: '🔁', nombre: 'Oscilación', descripcion: 'La parte imaginaria fija la frecuencia del modo.'}
  ],
  tour: [
    {title: 'Perturba el eje', text: 'El ensayo empieza con una desviación angular pequeña.', view: 'assembly'},
    {title: 'Observa la amplitud', text: 'La ganancia puede mover el par de polos al semiplano derecho.', view: 'inspection'},
    {title: 'Registra los polos', text: 'Ensaya y abre el lugar de raíces.', view: 'assembly'}
  ]
}, {
  id: 294, slug: 'servo-posicion-velocidad-corriente', module: 'Mecatrónica', area: 'MECATRÓNICA',
  title: 'Servo con tres lazos en cascada', longTitle: 'Control de posición, velocidad y corriente de un carro',
  eyebrow: 'Orden de trabajo · Eje de posicionamiento',
  intro: 'El carro debe llegar a una marca. Un lazo pide velocidad, otro pide corriente y el último entrega el esfuerzo al motor.',
  explore: 'Ajusta los lazos exteriores. Observa la llegada a la marca y el efecto de una carga aplicada a los dos segundos.',
  controls: [
    {id: 'positionGain', label: 'Ganancia de posición', min: 1, max: 8, step: .5, unit: 's⁻¹', decimals: 1},
    {id: 'speedBandwidth', label: 'Rapidez del lazo de velocidad', min: 4, max: 18, step: 1, unit: 's⁻¹', decimals: 0}
  ],
  metrics: [
    {label: 'Posición del eje', key: 'angle', unit: 'rad', scale: 1, decimals: 3},
    {label: 'Consigna de posición', key: 'target', unit: 'rad', scale: 1, decimals: 2},
    {label: 'Velocidad', key: 'speed', unit: 'rad/s', scale: 1, decimals: 2},
    {label: 'Corriente', key: 'current', unit: 'A', scale: 1, decimals: 2}
  ],
  task: 'Logra separación de lazos ≥3, sobreimpulso ≤0,03 rad, error bajo carga ≤0,018 rad y corriente ≤3 A.',
  job: 'OT-294 · Pon a punto un eje de posicionamiento para llegar a la marca y resistir una carga.',
  equations: 'Consigna θ=1,3 rad. ω*=sat(Kθ·error,±4). i*=sat((bω+Jλv(ω*−ω))/Kt,±3). El lazo cerrado de corriente se aproxima por di/dt=60(i*−i). J·dω/dt=Kt·i−bω−T_carga y dθ/dt=ω. J=0,02 kg·m², b=0,055 N·m·s, Kt=0,22 N·m/A. A los 2 s entra una carga de 0,012 N·m. Paso de 2 ms.',
  limits: 'Modelo equivalente con lazo interno de corriente ideal de primer orden. La velocidad usa compensación de fricción nominal y acción proporcional. La carga constante deja error estacionario en este ajuste. Sin dinámica de convertidor, holgura ni elasticidad de la correa. El carro avanza 0,42 unidades de escena por radián.',
  quiz: '¿Qué referencia entrega el lazo de velocidad al lazo interno?',
  answers: ['La referencia de corriente.', 'La frecuencia de muestreo del encoder.', 'La consigna de posición sin modificar.', 'La longitud total de la guía.'],
  faults: [
    ['Lazos poco separados', 'La posición pide correcciones más rápidas de lo que sigue la velocidad.', 'Compara la rapidez de ambos lazos.'],
    ['Corriente al límite', 'La corriente solicitada queda limitada durante el arranque.', 'Consulta la consigna y el valor aplicado.'],
    ['Error bajo carga', 'El eje queda desplazado al aplicar un par constante.', 'Comprueba el error al final del ensayo.']
  ],
  labels: 'Motor · poleas · correa · carro · marca',
  caption: 'Carro de correa · 0,42 unidades de escena por radián',
  tools: 'Accionamiento con correa y analizador de posición, velocidad y corriente.',
  procedure: ['Sigue el movimiento y la llegada a la marca.', 'Ajusta los dos lazos exteriores.', 'Contrasta las tres señales y valida bajo carga.'],
  timeScale: 1, signals: 'Posición real y solicitada (rad)',
  sourceName: 'Texas Instruments · A faster current loop pays off in servo motor control',
  source: 'https://www.ti.com/lit/wp/swpy031/swpy031.pdf',
  concepts: [
    {icono: '📍', nombre: 'Posición', descripcion: 'El error de posición determina la velocidad solicitada.'},
    {icono: '⚙️', nombre: 'Velocidad', descripcion: 'La corrección de velocidad determina la corriente solicitada.'},
    {icono: '⚡', nombre: 'Corriente', descripcion: 'El lazo interior regula el par disponible.'}
  ],
  tour: [
    {title: 'El carro busca la marca', text: 'La posición determina la velocidad solicitada.', view: 'assembly'},
    {title: 'Sigue la transmisión', text: 'El desplazamiento del carro y el giro de las poleas comparten el modelo.', view: 'inspection'},
    {title: 'Prueba bajo carga', text: 'Al segundo dos cambia el par resistente. Comprueba el error final.', view: 'assembly'}
  ]
}, {
  id: 295, slug: 'modbus-rtu-tcp-registros', module: 'Mecatrónica', area: 'MECATRÓNICA',
  title: 'Modbus RTU y TCP en un banco de PLC', longTitle: 'Lectura de registros y diagnóstico de tramas Modbus',
  eyebrow: 'Orden de trabajo · Redes industriales',
  intro: 'El PLC pide tres registros al variador. La respuesta depende de la dirección y de que la trama llegue íntegra.',
  explore: 'Cambia el transporte y la dirección. Sigue la petición y la respuesta, luego lee sus bytes en el analizador.',
  controls: [
    {id: 'transport', label: 'Modo de enlace', min: 1, max: 3, step: 1, unit: '', decimals: 0,
      format: value => ['RTU', 'TCP', 'RTU con error'][value - 1]},
    {id: 'address', label: 'Dirección inicial PDU', min: 105, max: 112, step: 1, unit: '', decimals: 0}
  ],
  metrics: [
    {label: 'Petición', key: 'requestBytes', unit: 'B', scale: 1, decimals: 0},
    {label: 'Respuesta', key: 'responseBytes', unit: 'B', scale: 1, decimals: 0},
    {label: 'Dirección inicial', key: 'address', unit: '', scale: 1, decimals: 0},
    {label: 'Código de excepción', key: 'exception', unit: '', scale: 1, decimals: 0}
  ],
  task: 'Recupera velocidad, temperatura y estado del equipo por TCP. El mapa del variador comienza esas tres lecturas en la dirección PDU 107.',
  job: 'OT-295 · Verifica la lectura de tres registros de retención en la unidad 7.',
  equations: 'Función 03 y cantidad 3. Los campos de 16 bits del PDU llevan el byte alto primero. RTU antepone unidad y añade CRC-16 Modbus (inicial 0xFFFF, polinomio reflejado 0xA001, byte bajo primero). TCP usa MBAP con transacción 0x1024, protocolo 0 y longitud que incluye unidad y PDU. Un rango ausente responde 83 02. La trama RTU con un bit alterado falla CRC y se descarta.',
  limits: 'Banco virtual de lectura. Direcciones PDU sin desplazamiento 40001. El mapa y la unidad 7 pertenecen a este escenario. La animación amplía el tiempo de transferencia y no representa latencia de red. El error RTU se inyecta tras calcular el CRC.',
  quiz: '¿Cómo responde el servidor ante una trama RTU con CRC incorrecto en este banco?',
  answers: ['Descarta la trama y el cliente observa silencio.', 'Envía una excepción 02 con la misma trama.', 'Cambia automáticamente a TCP.', 'Devuelve los registros anteriores con un CRC nuevo.'],
  faults: [
    ['CRC inválido', 'Se ve una petición en el enlace y no regresa una respuesta.', 'El servidor descarta la trama alterada.'],
    ['Dirección ilegal', 'La respuesta comienza con 83 y contiene el código 02.', 'La función 03 se marca como excepción por un rango inexistente.'],
    ['Confundir cabeceras', 'El analizador TCP interpreta bytes de CRC como si fueran datos.', 'TCP usa MBAP y no lleva el CRC de RTU.']
  ],
  labels: 'PLC · enlace · variador · petición · respuesta',
  caption: 'Transferencia ampliada · verde para respuesta normal',
  tools: 'PLC, variador y analizador hexadecimal de peticiones y respuestas.',
  procedure: ['Localiza el inicio del mapa solicitado.', 'Compara una lectura RTU, TCP y una trama RTU alterada.', 'Ensaya la lectura correcta y explica sus bytes.'],
  timeScale: 1, signals: 'Estado de lectura (−1 silencio, 0 excepción, 1 lectura)',
  sourceName: 'Modbus Organization · Application Protocol y Serial Line Guide',
  source: 'https://www.modbus.org/modbus-specifications',
  concepts: [
    {icono: '🧾', nombre: 'Registro', descripcion: 'Cada palabra contiene 16 bits y se identifica por su dirección en el PDU.'},
    {icono: '🔗', nombre: 'Encapsulado', descripcion: 'El mismo PDU viaja con CRC en RTU o cabecera MBAP en TCP.'},
    {icono: '🔎', nombre: 'Diagnóstico', descripcion: 'Una excepción recibida se distingue del silencio por descarte.'}
  ],
  tour: [
    {title: 'Sigue la consulta', text: 'El PLC envía el PDU por el transporte elegido.', view: 'assembly'},
    {title: 'Reconoce el regreso', text: 'El variador responde con registros o una excepción si el rango no existe.', view: 'inspection'},
    {title: 'Abre el analizador', text: 'Ensaya y compara los bytes de petición y respuesta.', view: 'assembly'}
  ]
}, {
  id: 296, slug: 'profinet-io-link-tiempo-ciclo', module: 'Mecatrónica', area: 'MECATRÓNICA',
  title: 'PROFINET e IO-Link: del sensor al PLC', longTitle: 'Topología y presupuesto de tiempo de ciclo industrial',
  eyebrow: 'Orden de trabajo · Comunicación cíclica',
  intro: 'El sensor ya detectó la pieza. El programa aún debe esperar a que el dato pase por el maestro y llegue a su ciclo de lectura.',
  explore: 'Ajusta ambos periodos y sigue la detección por las tres etapas. El instrumento muestra la peor fase del escenario.',
  controls: [
    {id: 'io', label: 'Ciclo IO-Link', min: 2, max: 10, step: 1, unit: 'ms', decimals: 0},
    {id: 'updateIndex', label: 'Actualización PROFINET', min: 0, max: 3, step: 1, unit: '', decimals: 0,
      format: value => [1, 2, 4, 8][value] + ' ms'}
  ],
  metrics: [
    {label: 'Peor latencia', key: 'latency', unit: 'ms', scale: 1, decimals: 2},
    {label: 'Cota por periodos', key: 'upperBound', unit: 'ms', scale: 1, decimals: 2},
    {label: 'Actualización PN', key: 'pn', unit: 'ms', scale: 1, decimals: 0},
    {label: 'Ciclo del programa', key: 'plcPeriod', unit: 'ms', scale: 1, decimals: 0}
  ],
  task: 'Entrega el dato al programa en ≤10 ms. Usa IO-Link de 3 a 6 ms y una actualización PROFINET de 2 a 4 ms.',
  job: 'OT-296 · Coordina el sensor, el maestro IO-Link y el ciclo del PLC.',
  equations: 'Capturas IO-Link de periodo Tio. Preparación del dato en el maestro de 0,25 ms. PROFINET actualiza en múltiplos de Tpn más 0,5 ms. El programa consume en múltiplos de 4 ms más 0,75 ms. Se enumeran las capturas de un hiperperiodo mcm(Tio,Tpn,4). El peor caso toma un evento inmediatamente posterior a la captura anterior. Cota conservadora Tio+0,25+Tpn+4.',
  limits: 'Calendario determinista del banco con fases fijas. Los periodos y demoras son hipótesis del ejercicio. No se modelan jitter, reintentos ni congestión. IO-Link une el sensor al maestro. El maestro actúa como dispositivo PROFINET ante el PLC a través del switch.',
  quiz: '¿Qué añade el ciclo del programa aunque la red ya haya entregado el dato?',
  answers: ['Una espera hasta la siguiente lectura del programa.', 'Un CRC RTU en cada muestra.', 'Una segunda dirección del sensor.', 'Un cambio en la velocidad de propagación del cable.'],
  faults: [
    ['Captura lenta', 'El evento ocurre justo después de una consulta al sensor.', 'El maestro debe esperar la siguiente captura.'],
    ['Actualización PN lenta', 'El maestro tiene el dato, pero todavía espera su actualización.', 'Revisa el periodo de intercambio del dispositivo.'],
    ['Lectura del programa tardía', 'El dato ya está en el PLC, pero el programa todavía no lo consume.', 'Identifica la fase del ciclo de programa.']
  ],
  labels: 'Sensor · maestro · switch · PLC',
  caption: 'Indicadores de dato disponible · milisegundos ampliados',
  tools: 'Sensor, maestro IO-Link, switch, PLC y analizador de eventos.',
  procedure: ['Identifica los dos tipos de enlace.', 'Ajusta los periodos y compara latencia y cota.', 'Ensaya y justifica la fase de peor caso.'],
  timeScale: 1, signals: 'Dato consumido por el programa (0/1)',
  sourceName: 'IO-Link Community y Siemens STEP 7 · ciclo y actualización',
  source: 'https://io-link.com/share/Downloads/At-a-glance/IO-Link_System_Description_eng_2018.pdf',
  concepts: [
    {icono: '📡', nombre: 'Puerto IO-Link', descripcion: 'El sensor intercambia datos de proceso con un puerto del maestro.'},
    {icono: '🔗', nombre: 'Actualización de red', descripcion: 'El maestro entrega su imagen de datos al controlador PROFINET.'},
    {icono: '⏱️', nombre: 'Fase del programa', descripcion: 'El consumo sucede cuando el programa lee la imagen actualizada.'}
  ],
  tour: [
    {title: 'Detecta la pieza', text: 'El primer indicador representa el evento físico del sensor.', view: 'assembly'},
    {title: 'Sigue la captura', text: 'El dato cruza del maestro al PLC por el switch.', view: 'inspection'},
    {title: 'Mide la espera', text: 'La última luz marca el consumo por el programa.', view: 'assembly'}
  ]
}, {
  id: 297, slug: 'variador-plc-rampas-corriente', module: 'Mecatrónica', area: 'MECATRÓNICA',
  title: 'Variador con PLC y límite de corriente', longTitle: 'Arranque y parada por rampas en un accionamiento',
  eyebrow: 'Orden de trabajo · Accionamientos',
  intro: 'Una rampa rápida pide más esfuerzo al motor. Si la corriente llega al límite, la velocidad deja de seguir la orden.',
  explore: 'Ajusta la pendiente y el límite. Observa el arranque, la velocidad sostenida y la parada ordenada por el PLC.',
  controls: [
    {id: 'ramp', label: 'Pendiente de rampa', min: 350, max: 1100, step: 50, unit: 'rpm/s', decimals: 0},
    {id: 'limit', label: 'Límite de corriente', min: 2, max: 8, step: .5, unit: 'A', decimals: 1}
  ],
  metrics: [
    {label: 'Velocidad', key: 'speedRpm', unit: 'rpm', scale: 1, decimals: 0},
    {label: 'Consigna', key: 'target', unit: 'rpm', scale: 1, decimals: 0},
    {label: 'Corriente aplicada', key: 'current', unit: 'A', scale: 1, decimals: 2},
    {label: 'Corriente solicitada', key: 'requested', unit: 'A', scale: 1, decimals: 2}
  ],
  task: 'Sigue la rampa con error ≤65 rpm y corriente pico ≤4,5 A. En la parada, entra a ±20 rpm en ≤2,2 s.',
  job: 'OT-297 · Configura una rampa de marcha y parada de un accionamiento limitado en corriente.',
  equations: 'El PLC ordena marcha a 0,5 s y parada a 5,5 s. Rampa simétrica hasta 1200 rpm. J=0,008 kg·m², b=0,004 N·m·s, Kt=0,30 N·m/A. i*= [bω+J(αref+8(ωref−ω))]/Kt. i=sat(i*,±Imax). J·dω/dt=Kt·i−bω. Integración de 5 ms y ángulo visual ∫ω/20 dt.',
  limits: 'Accionamiento equivalente con par proporcional a corriente, frenado bidireccional y carga viscosa. Secuencia de PLC prescrita. La escena no representa el diseño eléctrico de potencia ni la energía del frenado. Giro mostrado a 1/20 de velocidad.',
  quiz: '¿Por qué la velocidad puede quedar por debajo de la consigna durante el arranque?',
  answers: ['El límite de corriente reduce el par disponible para acelerar.', 'El variador cambia el diámetro del ventilador.', 'El PLC transforma siempre rpm en amperios.', 'El encoder elimina la inercia.'],
  faults: [
    ['Límite de corriente bajo', 'La consigna sube, pero el rotor tarda en alcanzarla.', 'Compara corriente solicitada y aplicada.'],
    ['Rampa demasiado lenta', 'La corriente cumple, pero la parada tarda más de lo pedido.', 'Revisa la pendiente al retirar la orden de marcha.'],
    ['Pico excesivo', 'La velocidad sigue la rampa a costa de un pico alto de corriente.', 'Valida ambos límites del escenario.']
  ],
  labels: 'PLC · variador · motor · ventilador · señal de límite',
  caption: 'Giro a 1/20 · velocidad e intensidad reales del modelo',
  tools: 'Ventilador de accionamiento, variador y analizador de rampa.',
  procedure: ['Sigue el arranque y la parada.', 'Ajusta pendiente y límite.', 'Compara velocidad y corriente antes de validar.'],
  timeScale: 1, signals: 'Velocidad real y consigna (rpm)',
  sourceName: 'ABB · ACS580 firmware manual, Reference ramping',
  source: 'https://library.e.abb.com/public/bcfbcbe94902460f8e18f53f51cb44f9/EN_ACS580_FW_H_A5.pdf',
  concepts: [
    {icono: '📈', nombre: 'Rampa', descripcion: 'La consigna cambia con una pendiente programada.'},
    {icono: '⚡', nombre: 'Límite', descripcion: 'La corriente disponible fija el par máximo.'},
    {icono: '⏱️', nombre: 'Parada', descripcion: 'El tiempo real depende de la rampa y la respuesta del rotor.'}
  ],
  tour: [
    {title: 'Arranca el accionamiento', text: 'El PLC dispara una rampa de velocidad.', view: 'assembly'},
    {title: 'Reconoce la limitación', text: 'El testigo cambia cuando el mando supera la corriente disponible.', view: 'inspection'},
    {title: 'Comprueba la parada', text: 'Ensaya y valida el seguimiento y el tiempo de parada.', view: 'assembly'}
  ]
}, {
  id: 298, slug: 'encoder-cuadratura-absoluto', module: 'Mecatrónica', area: 'MECATRÓNICA',
  title: 'Encoder incremental y absoluto', longTitle: 'Cuadratura, código Gray y pérdida de flancos',
  eyebrow: 'Orden de trabajo · Medición de posición',
  intro: 'El disco sigue girando aunque el lector se salte marcas. Compara el conteo de flancos con la posición que entrega una palabra absoluta.',
  explore: 'Ajusta la velocidad y el muestreo. Las pistas del disco representan A, B y los seis bits Gray.',
  controls: [
    {id: 'rpm', label: 'Velocidad del eje', min: 300, max: 1800, step: 100, unit: 'rpm', decimals: 0},
    {id: 'sampleRate', label: 'Muestreo digital', min: 200, max: 2000, step: 100, unit: 'Hz', decimals: 0}
  ],
  metrics: [
    {label: 'Conteo incremental', key: 'counted', unit: '', scale: 1, decimals: 0},
    {label: 'Conteo de referencia', key: 'exact', unit: '', scale: 1, decimals: 0},
    {label: 'Sector absoluto', key: 'absolute', unit: '', scale: 1, decimals: 0},
    {label: 'Saltos inválidos', key: 'invalid', unit: '', scale: 1, decimals: 0}
  ],
  task: 'Mantén 900 a 1300 rpm con conteo exacto y sin saltos inválidos. Usa como máximo 1700 muestras/s.',
  job: 'OT-298 · Selecciona el muestreo para contar la cuadratura sin perder posición.',
  equations: '16 periodos A/B por revolución y decodificación X4, con 64 cuentas por vuelta. Secuencia 00, 10, 11, 01. Cambios adyacentes suman o restan una cuenta y un salto de dos estados se marca inválido. El disco absoluto de seis bits usa Gray=k XOR (k>>1), con sector de 5,625°. Se muestrea un segundo físico y se muestra en ocho segundos.',
  limits: 'Sensor ideal sin ruido, desalineación ni rebote. El contador incremental parte de cero. Gray indica el sector actual dentro de una vuelta. La frecuencia de muestreo se aplica a la lectura por software, no a un contador de flancos por hardware.',
  quiz: '¿Qué conserva la lectura absoluta de este disco si se pierden flancos incrementales?',
  answers: ['El sector actual de la vuelta.', 'El número total de vueltas desde el arranque.', 'El contador incremental exacto.', 'La velocidad media de todas las vueltas anteriores.'],
  faults: [
    ['Muestreo insuficiente', 'Entre dos lecturas cambian los dos canales.', 'El decodificador no puede inferir el sentido de ese salto.'],
    ['Pérdida de vueltas', 'La palabra Gray se repite cada revolución.', 'Se trata de una posición absoluta de una vuelta.'],
    ['Sentido aparente incorrecto', 'Una transición parece ir hacia atrás aunque el motor avanza.', 'El muestreo puede saltar tres estados y alterar el sentido observado.']
  ],
  labels: 'Disco · pistas Gray · canales A/B · lector',
  caption: 'Disco codificado · 1 s físico por 8 s de escena',
  tools: 'Disco óptico combinado y analizador de cuadratura, conteo y palabra Gray.',
  procedure: ['Compara las pistas durante el giro.', 'Ajusta el muestreo para conservar el conteo.', 'Ensaya y explica la diferencia entre sector y desplazamiento.'],
  timeScale: 1, signals: 'Cuentas leídas y cuentas de referencia',
  sourceName: 'National Instruments · Using Quadrature Encoders',
  source: 'https://www.ni.com/en/support/documentation/supplemental/21/using-quadrature-encoders-with-e-series-daq-boards.html',
  concepts: [
    {icono: '🔢', nombre: 'Cuadratura', descripcion: 'El orden de los estados indica el sentido del eje.'},
    {icono: '💿', nombre: 'Código Gray', descripcion: 'Dos sectores contiguos cambian un solo bit.'},
    {icono: '⏱️', nombre: 'Muestreo', descripcion: 'Una lectura lenta puede perder estados entre muestras.'}
  ],
  tour: [
    {title: 'Mira las pistas', text: 'Dos pistas externas codifican A y B. Las interiores codifican el sector absoluto.', view: 'assembly'},
    {title: 'Sigue el lector', text: 'La lectura absoluta sigue indicando el sector aunque se pierdan estados de cuadratura.', view: 'inspection'},
    {title: 'Compara el conteo', text: 'Ensaya y revisa la discrepancia con la referencia.', view: 'assembly'}
  ]
}, ...diagnostics];
