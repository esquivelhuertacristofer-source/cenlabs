import { TutorStep } from '@/components/DrQuantumTutor';

export const ALL_TUTOR_STEPS: Record<string, TutorStep[]> = {
  'matematicas-1': [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. Tu misión es ajustar los controles del piloto hasta que tu parábola coincida con la trayectoria guía (la línea punteada blanca). ¡Empecemos!',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Calcula Δ',
      mensaje: 'Primero calcula el DISCRIMINANTE. La fórmula es: Δ = b² − 4ac. Sustituye los valores a, b y c que ves en la Sonda de Telemetría del piloto. Anota el resultado en la Bitácora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Ubica el Vértice',
      mensaje: '¡Bien! Ahora calcula la abscisa del vértice: h = −b ÷ (2a). Ese punto es el máximo o mínimo de la parábola — lo verás marcado en rojo en la gráfica. Verifícalo en la Bitácora.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Ajusta el coeficiente a',
      mensaje: 'Usa el control "Amplitud (a)" del dock inferior. Si a > 0, la parábola abre hacia ARRIBA (mínimo). Si a < 0, abre hacia ABAJO (máximo). Asegúrate de que tu parábola tenga la misma concavidad que la guía.',
    },
    {
      id: 5, tipo: 'accion', pista: 'Ajusta b y c',
      mensaje: 'El control "Simetría (b)" desplaza el vértice horizontalmente. El control "Intercepto (c)" mueve toda la parábola arriba o abajo. Ajusta ambos para acercar tu curva a la trayectoria guía.',
    },
    {
      id: 6, tipo: 'calculo', pista: 'Verifica las 3 Formas',
      mensaje: 'Observa el panel "3 Formas Equivalentes". Verifica que la Forma Vértice a(x−h)²+k y la Forma Factorizada a(x−r₁)(x−r₂) representen la misma ecuación. Son tres expresiones algebraicamente idénticas.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Valida la Trayectoria',
      mensaje: '¡Listo! Cuando tu parábola coincida visualmente con la guía y el % SYNC esté alto, presiona "Validar Trayectoria" en el dock. Validar en el primer intento te da ⭐⭐⭐.',
      accion: 'Ir a Validar →',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Misión Cumplida!',
      mensaje: '¡Fenomenal! Has dominado las tres formas de la ecuación cuadrática. Recuerda: esta función describe trayectorias reales — desde proyectiles hasta antenas parabólicas. ¡La matemática está en todas partes!',
    },
  ],
  'matematicas-2': [
    {
      id: 1, tipo: 'intro', pista: 'Localización 2x2',
      mensaje: '¡Hola, {alumno}! Bienvenido a la central de rastreo. Tu objetivo es encontrar el punto exacto donde se interceptan dos haces láser para localizar un satélite.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Calibra Haz Alpha',
      mensaje: 'Usa los controles del Haz Alpha (m1, b1). La pendiente m1 determina la inclinación. Intenta que el haz pase cerca del objetivo rojo.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Calibra Haz Omega',
      mensaje: 'Ahora ajusta el Haz Omega (m2, b2). Busca que la intersección de ambas líneas coincida exactamente con la señal del satélite.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Sincronía de Coordenadas',
      mensaje: 'Cuando las líneas se crucen sobre el objetivo, el sistema mostrará "Coordinates Matched". Presiona Validar para asegurar el enlace.',
      accion: 'Validar Enlace',
    }
  ],
  'matematicas-3': [
    {
      id: 1, tipo: 'intro', pista: 'Alerta Sísmica',
      mensaje: 'Bienvenido, {alumno}. Analizaremos la escala logarítmica de Richter. ¿Sabías que un grado más significa 32 veces más energía?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Simula el Sismo',
      mensaje: 'Ajusta la magnitud del sismo experimental. Observa cómo crece la amplitud de la onda en el sismógrafo 3D de forma no lineal.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Factor de Energía',
      mensaje: 'Calcula el factor de energía usando la fórmula 10^(1.5 * ΔM). Ingresa el valor en el panel de telemetría para validar tu análisis.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Certificar Informe',
      mensaje: 'Si tu cálculo de energía coincide con el impacto visual, presiona Validar Informe.',
      accion: 'Validar Análisis',
    }
  ],
  'matematicas-4': [
    {
      id: 1, tipo: 'intro', pista: 'Teorema Universal',
      mensaje: '¡Hola! Vamos a demostrar físicamente que a² + b² = c². Observa los contenedores de agua sobre los catetos.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Define Dimensiones',
      mensaje: 'Ajusta la longitud de los catetos A y B. Observa cómo el área de los cuadrados cambia dinámicamente.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Trasvase de Fluidos',
      mensaje: 'Activa el flujo de agua. Si el Teorema es cierto, el volumen de los dos cuadrados pequeños debe llenar EXACTAMENTE el cuadrado de la hipotenusa.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Cálculo de C',
      mensaje: 'Calcula la raíz cuadrada de la suma de las áreas e ingresa el valor de la hipotenusa (c).',
      accion: 'Verificar Hipotenusa',
    }
  ],
  'matematicas-5': [
    {
      id: 1, tipo: 'intro', pista: 'Círculo Unitario',
      mensaje: 'Bienvenido al osciloscopio trigonométrico. Aquí el radio siempre es 1. ¡Exploremos las funciones circulares!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Genera la Onda',
      mensaje: 'Activa la animación y observa cómo la proyección vertical (Seno) y horizontal (Coseno) crean ondas sinusoidales.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Captura Puntos',
      mensaje: 'Detén el vector en ángulos notables (45°, 90°, 180°) y registra los hallazgos en la bitácora para ver la tabla de valores.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Sincronía de Fase',
      mensaje: 'Lleva el vector a la posición objetivo y valida la fase para completar el análisis.',
      accion: 'Validar Fase',
    }
  ],
  'matematicas-6': [
    {
      id: 1, tipo: 'intro', pista: 'Transformaciones',
      mensaje: 'Tu misión es acoplar la sonda espacial usando traslaciones, rotaciones y escalas. ¡Precisión de navegación!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Escala y Rota',
      mensaje: 'Ajusta el tamaño de la sonda para que coincida con el fantasma objetivo. Luego rótala para alinear los puertos de acoplamiento.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Traslación X/Y',
      mensaje: 'Mueve la sonda en los ejes cartesianos. Recuerda que cada transformación es una operación matricial en el fondo.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Acoplamiento',
      mensaje: 'Cuando la superposición sea total, presiona Validar Acoplamiento.',
      accion: 'Ejecutar Docking',
    }
  ],
  'matematicas-7': [
    {
      id: 1, tipo: 'intro', pista: 'Óptica de Snell',
      mensaje: 'Calcularemos índices de refracción usando trigonometría. Dispara el láser y observa la desviación.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Mide Ángulos',
      mensaje: 'Usa el transportador para medir el ángulo de incidencia y el de refracción. Anótalos en la bitácora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Ley de Snell',
      mensaje: 'Aplica n1*sin(θ1) = n2*sin(θ2). Despeja n2 e ingresa el valor para identificar el material misterioso.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Índice',
      mensaje: 'Presiona Validar cuando tengas el índice n2 calculado.',
      accion: 'Validar Refracción',
    }
  ],
  'matematicas-8': [
    {
      id: 1, tipo: 'intro', pista: 'La Derivada',
      mensaje: 'Encontraremos los puntos críticos de una función. La derivada nos dice la pendiente de la recta tangente.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Escanea la Curva',
      mensaje: 'Mueve el cursor sobre la gráfica. Observa cómo cambia la recta tangente. Busca donde la pendiente es CERO.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Máximos y Mínimos',
      mensaje: 'Ubica los valles y las cimas. En estos puntos la función cambia de dirección. Valida los puntos críticos encontrados.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Optimización',
      mensaje: 'Presiona Validar cuando hayas localizado los extremos de la función.',
      accion: 'Validar Extremos',
    }
  ],
  'matematicas-9': [
    {
      id: 1, tipo: 'intro', pista: 'Sumas de Riemann',
      mensaje: 'Calcularemos el área bajo la curva usando rectángulos. A más rectángulos, mayor precisión.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Incrementa n',
      mensaje: 'Aumenta el número de rectángulos (n). Observa cómo el error de aproximación disminuye visualmente.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Cambia el Método',
      mensaje: 'Prueba con extremos izquierdos, derechos y puntos medios. ¿Cuál se acerca más al valor real de la integral?',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Área',
      mensaje: 'Cuando logres un error menor al 1%, valida la integral.',
      accion: 'Validar Integral',
    }
  ],
  'matematicas-10': [
    {
      id: 1, tipo: 'intro', pista: 'Máquina de Galton',
      mensaje: 'Exploraremos la probabilidad y la curva normal. ¿Hacia dónde caerán las bolitas?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Lanza la Población',
      mensaje: 'Inicia el lanzamiento de bolitas. Observa cómo se acumulan en los contenedores siguiendo una distribución binomial.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Campana de Gauss',
      mensaje: 'A medida que aumentas la población, la forma de la campana se vuelve más definida. Verifica la probabilidad 0.5.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Distribución',
      mensaje: 'Presiona Validar cuando la muestra sea estadísticamente significativa.',
      accion: 'Validar Datos',
    }
  ],
  'fisica-1': [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida Táctica!',
      mensaje: '¡Hola, {alumno}! Bienvenido al polígono de artillería avanzada. Tu misión es destruir al dron invasor en el punto rojo, disparando desde un cañón elevado Y₀ superando el muro de contención.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Parábola General',
      mensaje: 'La cinemática escolar se acabó. El terreno NO es simétrico. Usa la ecuación y(x) = y₀ + x·tan(θ) - (g·x²) / (2v₀²·cos²(θ)). Esta ecuación define estrictamente tu trayectoria en 2D.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Librar el Muro',
      mensaje: 'Primero asegúrate empírica o matemáticamente de que tu altura Y cuando X sea igual a la posición del Muro sea MAYOR a la altura del Muro. De lo contrario, colapsarás.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Impacto Confirmado',
      mensaje: 'Cuando visualices que la parábola predictora (línea verde) atraviesa el centro del objetivo, ejecuta el disparo. ¡Buena suerte, cadete!',
      accion: 'Ejecutar Fuego',
    }
  ],
  'fisica-2': [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al Plano de Pruebas. Tu misión es calcular la aceleración exacta de un bloque sobre una rampa inclinada para certificar su descenso.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configura la Rampa',
      mensaje: 'Usa el control "Inclinador Hidráulico" para ajustar el ángulo θ. Observa cómo cambian los vectores de fuerza (Peso, Normal y Fricción) en la escena 3D.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Fuerza de Deslizamiento',
      mensaje: 'Calcula la fuerza tangencial Wx = m · g · sin(θ). Si Wx supera la fricción estática máxima (fs_max = μs · N), el bloque comenzará a deslizarse.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Inicia el Descenso',
      mensaje: 'Lleva la rampa más allá del ángulo crítico para activar el descenso. El bloque acelerará según la 2da Ley de Newton: a = (Wx - fk) / m.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Valida la Aceleración',
      mensaje: 'Una vez que el bloque haya descendido, introduce el valor de la aceleración calculada en el dock inferior y presiona "Validar". ¡Precisión absoluta!',
      accion: 'Verificar Cálculos',
    }
  ],
  'fisica-3': [
    {
      id: 1, tipo: 'intro', pista: 'Péndulo de Precisión',
      mensaje: 'Calcularemos la gravedad local usando un péndulo simple. ¡El tiempo es nuestra herramienta!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Longitud de Cuerda',
      mensaje: 'Ajusta la longitud L. Recuerda que el periodo T depende principalmente de esta variable y de la gravedad.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Inicia Oscilación',
      mensaje: 'Desplaza la masa y suéltala. Usa el cronómetro para medir el tiempo de 10 oscilaciones y sacar el promedio.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Despeja g',
      mensaje: 'Usa T = 2π√(L/g) para despejar la gravedad. Ingresa el valor en la telemetría.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Gravedad',
      mensaje: 'Presiona Validar cuando tengas el valor de g calculado.',
      accion: 'Validar Gravedad',
    }
  ],
  'fisica-4': [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Hooke',
      mensaje: 'Estudiaremos la elasticidad. Vamos a estirar resortes para encontrar su constante k.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Carga de Masas',
      mensaje: 'Cuelga diferentes pesos y observa la elongación (x). Los vectores mostrarán la fuerza restauradora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Constante k',
      mensaje: 'Calcula k = F / x para cada medición. ¿Es constante? Verifica la linealidad en el gráfico.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Resorte',
      mensaje: 'Presiona Validar cuando identifiques la constante elástica.',
      accion: 'Validar Elongación',
    }
  ],
  'fisica-5': [
    {
      id: 1, tipo: 'intro', pista: 'Prensa Hidráulica',
      mensaje: 'Multiplicaremos fuerza usando el Principio de Pascal. ¡Ingeniería de fluidos!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Radios de Émbolos',
      mensaje: 'Ajusta r1 y r2. Observa cómo cambia la ventaja mecánica (r2/r1)².',
    },
    {
      id: 3, tipo: 'accion', pista: 'Eleva la Carga',
      mensaje: 'Aplica fuerza F1 para levantar el vehículo. Verifica que la presión sea igual en ambos lados.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Ganancia',
      mensaje: 'Presiona Validar cuando la carga esté en la altura objetivo.',
      accion: 'Validar Elevación',
    }
  ],
  'fisica-6': [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido a la boya experimental. Tu misión es utilizar el Principio de Arquímedes para determinar la densidad de un material desconocido.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Selecciona Material',
      mensaje: 'Escoge el "Material ?" (Misterioso) en el dock. Observa su peso (W) en el dinamómetro mientras está fuera del agua.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Sumerge el Objeto',
      mensaje: 'Baja el bloque al tanque de fluido. Observa cómo el peso aparente disminuye debido a la fuerza de empuje (E).',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Principio de Arquímedes',
      mensaje: 'Calcula el empuje E = W_aire - W_sumergido. Luego usa la fórmula E = ρ_fluido · g · V para encontrar el volumen del objeto si no lo conoces, o usa ρ_obj = m / V.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Valida la Densidad',
      mensaje: 'Introduce la densidad calculada en kg/m³. Tienes un margen de error del 5%. ¡Mucha suerte!',
      accion: 'Validar Densidad',
    }
  ],
  'fisica-7': [
    {
      id: 1, tipo: 'intro', pista: 'Dilatación Térmica',
      mensaje: 'Veremos cómo los metales crecen con el calor. ¡Cuidado con el quemador!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Calentamiento',
      mensaje: 'Incrementa la temperatura de la barra de metal. Usa el micrómetro para medir el cambio en la longitud ΔL.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Coeficiente Alfa',
      mensaje: 'Aplica ΔL = α * L0 * ΔT. Despeja α e identifica el material según su expansión.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Material',
      mensaje: 'Presiona Validar cuando identifiques el coeficiente de dilatación.',
      accion: 'Validar Expansión',
    }
  ],
  'fisica-8': [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Ohm',
      mensaje: '¡Hola, {alumno}! Bienvenido al Laboratorio de Electrónica. Tu misión es diseñar un circuito seguro para un componente delicado: un LED de alta luminosidad.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Trinidad Eléctrica',
      mensaje: 'Recuerda la relación fundamental: V = I · R. El voltaje empuja, la resistencia frena y la intensidad es el flujo resultante. ¡Dominar esto es dominar la energía!',
    },
    {
      id: 3, tipo: 'accion', pista: 'Configura la Fuente',
      mensaje: 'Ajusta el Voltaje de la fuente de poder en el HUD. Observa cómo los indicadores de telemetría reaccionan. A mayor voltaje, mayor presión sobre los electrones.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Selecciona Carga',
      mensaje: 'Elige una resistencia de carga del dock. Mira las bandas de colores en el componente SVG; representan el valor en Ohmios. Una resistencia mayor reducirá el flujo.',
    },
    {
      id: 5, tipo: 'calculo', pista: 'Predicción de Flujo',
      mensaje: 'Antes de cerrar el circuito, calcula la intensidad esperada: I = V / R. El LED se funde a los 35mA. Busca un valor cercano a los 20mA para máxima seguridad.',
    },
    {
      id: 6, tipo: 'accion', pista: 'Cierra el Circuito',
      mensaje: '¡Es hora! Presiona el interruptor "Cerrar Circuito". Observa el flujo de electrones (puntos amarillos) y el brillo del LED. ¡Si brilla en verde, lo lograste!',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Validar Ingeniería',
      mensaje: 'Ingresa el valor de la resistencia que estás usando en el campo de texto y presiona "Validar V=IR". Esto certificará tu diseño en el sistema.',
      accion: 'Certificar Circuito',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Ingeniero Eléctrico!',
      mensaje: '¡Excelente trabajo! Has protegido el componente y validado la Ley de Ohm. Has demostrado que puedes controlar la energía con precisión matemática.',
    },
  ],
  'fisica-9': [
    {
      id: 1, tipo: 'intro', pista: 'Ley de Coulomb',
      mensaje: 'Exploraremos la fuerza entre cargas eléctricas. ¿Atracción o repulsión?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Magnitud de Carga',
      mensaje: 'Ajusta los valores de q1 y q2. Observa cómo cambian los vectores de fuerza eléctrica.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Variación de Distancia',
      mensaje: 'Mueve las cargas. Nota cómo la fuerza disminuye drásticamente al aumentar la distancia (ley del inverso al cuadrado).',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Fuerza',
      mensaje: 'Calcula la fuerza resultante para los valores actuales y valida tu resultado.',
      accion: 'Validar Fuerza',
    }
  ],
  'fisica-10': [
    {
      id: 1, tipo: 'intro', pista: 'Motor de C.C.',
      mensaje: 'Construiremos un motor eléctrico simple. ¡Convirtamos electricidad en movimiento!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configuración Magnética',
      mensaje: 'Orienta los imanes (Norte/Sur). La dirección del campo magnético determinará el sentido del giro.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Número de Espiras',
      mensaje: 'Aumenta las vueltas de la bobina. Más espiras significan un mayor torque motor.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Encendido de Motor',
      mensaje: 'Cierra el circuito y mide las RPM. Valida cuando el motor alcance la velocidad de diseño.',
      accion: 'Validar Torque',
    }
  ],
  'biologia-1': [
    {
      id: 1, tipo: 'intro', pista: 'Óptica de Precisión',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. Bienvenido al Centro de Microscopía. Tu misión es explorar el mundo subcelular con rigor científico.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Física de la Luz',
      mensaje: 'Para ver el detalle máximo, debemos entender la resolución. El límite de Abbe dicta que no podemos ver nada más pequeño que la mitad de la longitud de onda de la luz.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Elige tu Muestra',
      mensaje: 'Selecciona una muestra (Vegetal, Animal o Bacteria) para colocarla en la platina. Cada una requiere un nivel de iluminación diferente para su observación.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Localización (4x/10x)',
      mensaje: 'Usa los objetivos de baja potencia para localizar la zona de interés. Ajusta el "Macrométrico" hasta que veas formas generales.',
    },
    {
      id: 5, tipo: 'accion', pista: 'Alta Resolución (40x)',
      mensaje: 'Pasa al objetivo de 40x. ¡Cuidado! La profundidad de campo es muy corta. Usa solo el "Micrométrico" para enfocar la estructura interna.',
    },
    {
      id: 6, tipo: 'accion', pista: 'Escáner Biométrico',
      mensaje: 'Una vez enfocado, presiona "Escanear Estructura". Mi sistema de IA identificará los organelos y validará si has encontrado el objetivo de la misión.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Documentación',
      mensaje: '¡Hallazgo confirmado! Toma una "Foto de Bitácora" para registrar la micrografía en tu informe. Luego presiona Validar para certificar la práctica.',
      accion: 'Certificar Hallazgo',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Científico Explorador!',
      mensaje: '¡Increíble! Has navegado por el interior de la vida. Has demostrado una gran destreza en el manejo de instrumentos ópticos de precisión.',
    },
  ],
  'biologia-2': [
    {
      id: 1, tipo: 'intro', pista: 'Ósmosis Celular',
      mensaje: 'Observaremos cómo las células responden a diferentes concentraciones de sal. ¡Cuidado con la citólisis!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Medio Hipotónico',
      mensaje: 'Baja la concentración externa. El agua entrará a la célula por ósmosis. ¿Ves cómo se hincha?',
    },
    {
      id: 3, tipo: 'accion', pista: 'Medio Hipertónico',
      mensaje: 'Sube la salinidad externa. El agua saldrá de la célula (plasmólisis). Observa la contracción del citoplasma.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Equilibrio Osmótico',
      mensaje: 'Ajusta las concentraciones hasta que el flujo neto de agua sea cero (isotónico) y valida.',
      accion: 'Validar Tonicidad',
    }
  ],
  'biologia-3': [
    {
      id: 1, tipo: 'intro', pista: 'Síntesis de Proteínas',
      mensaje: 'Vamos a decodificar el ADN. Primero, realiza la transcripción para crear el ARN mensajero.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Transcripción',
      mensaje: 'Selecciona las bases nitrogenadas complementarias (A-U, C-G). El ARN saldrá del núcleo hacia el ribosoma.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Traducción',
      mensaje: 'En el ribosoma, une los codones con sus respectivos aminoácidos para formar la cadena polipeptídica.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Proteína Completa',
      mensaje: 'Cuando llegues al codón de STOP, la proteína se plegará. Valida la secuencia obtenida.',
      accion: 'Validar Proteína',
    }
  ],
  'biologia-4': [
    {
      id: 1, tipo: 'intro', pista: 'Fotosíntesis',
      mensaje: 'Optimizaremos la producción de oxígeno variando la luz. ¡Energía solar en acción!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Espectro de Luz',
      mensaje: 'Cambia el color de la lámpara. ¿Qué color absorbe mejor la clorofila? Observa la tasa de burbujeo.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Intensidad Lumínica',
      mensaje: 'Acerca la lámpara. A mayor intensidad, mayor tasa fotosintética, hasta llegar al punto de saturación.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Acumular O2',
      mensaje: 'Cuando alcances la cuota de oxígeno objetivo, valida el rendimiento del cloroplasto.',
      accion: 'Validar O2',
    }
  ],
  'biologia-5': [
    {
      id: 1, tipo: 'intro', pista: 'Genética Mendeliana',
      mensaje: 'Crucemos plantas para predecir la herencia. ¿Dominancia o recesividad?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Cruza P1',
      mensaje: 'Selecciona los genotipos de los parentales. Observa las proporciones esperadas en el Cuadro de Punnett.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Generación F1',
      mensaje: 'Ejecuta la cruza y observa los fenotipos resultantes. ¿Se cumple la proporción 3:1 o 9:3:3:1?',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Alelos',
      mensaje: 'Confirma los resultados estadísticos de la descendencia para certificar la cruza.',
      accion: 'Validar Herencia',
    }
  ],
  'biologia-6': [
    {
      id: 1, tipo: 'intro', pista: 'Selección Natural',
      mensaje: 'Eres un depredador en un entorno cambiante. Observa cómo la evolución favorece al más apto.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Camuflaje',
      mensaje: 'Cambia el color del fondo. Las polillas que contrasten más serán cazadas primero. Inicia la simulación.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Deriva Genética',
      mensaje: 'Tras varias generaciones, observa cómo cambia la frecuencia de los colores en la población.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Adaptación',
      mensaje: 'Analiza los datos del gráfico de población y valida el proceso evolutivo.',
      accion: 'Validar Selección',
    }
  ],
  'biologia-7': [
    {
      id: 1, tipo: 'intro', pista: 'Reflejo Simple',
      mensaje: 'Mediremos la velocidad de conducción nerviosa usando el reflejo rotuliano.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Golpe de Martillo',
      mensaje: 'Ajusta la fuerza del impacto. El sensor detectará el estímulo y la respuesta motora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Latencia',
      mensaje: 'Mide el tiempo entre el golpe y la contracción. Calcula la velocidad basándote en la longitud del nervio.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Respuesta',
      mensaje: 'Confirma que el arco reflejo funciona correctamente para los parámetros de mielina actuales.',
      accion: 'Validar Reflejo',
    }
  ],
  'biologia-8': [
    {
      id: 1, tipo: 'intro', pista: 'Ciclo Cardíaco',
      mensaje: 'Analizaremos la sístole y diástole. ¡Escucha el latido del motor de la vida!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Estado Fisiológico',
      mensaje: 'Cambia entre reposo y ejercicio. Observa cómo el corazón ajusta su frecuencia cardíaca (BPM).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Presión Arterial',
      mensaje: 'Observa la variación de presión en las cámaras. El cierre de las válvulas crea los sonidos cardíacos.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Validar Ritmo',
      mensaje: 'Alcanza el ritmo objetivo para el escenario actual y valida el análisis hemodinámico.',
      accion: 'Validar Cardio',
    }
  ],
  'biologia-9': [
    {
      id: 1, tipo: 'intro', pista: 'Digestión Enzimática',
      mensaje: 'Descompondremos macromoléculas usando enzimas específicas. ¡Química digestiva!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Sustrato y Enzima',
      mensaje: 'Elige entre proteínas, lípidos o carbohidratos. Selecciona la enzima correcta (Pepsina, Lipasa, Amilasa).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Optimización de pH',
      mensaje: 'Ajusta el pH del medio. Cada enzima tiene un pH óptimo donde su actividad es máxima.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Absorción',
      mensaje: 'Cuando la hidrólisis sea completa y obtengas monómeros, valida el proceso digestivo.',
      accion: 'Validar Digestión',
    }
  ],
  'biologia-10': [
    {
      id: 1, tipo: 'intro', pista: 'Ecosistema Dinámico',
      mensaje: 'Simularemos la relación Presa-Depredador usando el modelo de Lotka-Volterra.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Poblaciones Iniciales',
      mensaje: 'Define cuántas liebres y lobos inician. Activa la simulación para ver los ciclos de población.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Tasa de Encuentro',
      mensaje: 'Ajusta la voracidad de los depredadores. Un desequilibrio puede llevar a la extinción de ambas especies.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Equilibrio Estable',
      mensaje: 'Logra un ciclo poblacional estable y valida el análisis ecológico.',
      accion: 'Validar Ecosistema',
    }
  ],
  'quimica-2': [
    { 
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al laboratorio de Gases. Comienza ajustando la TEMPERATURA a 400K para observar la excitación molecular.',
    },
    { 
      id: 2, tipo: 'accion', pista: 'Ajusta el Volumen',
      mensaje: 'Ahora manipula el VOLUMEN del contenedor para observar el cambio en el manómetro. Recuerda la Ley de Boyle: P₁V₁ = P₂V₂.',
    },
    { 
      id: 3, tipo: 'calculo', pista: 'Analiza la Isoterma',
      mensaje: 'Observa el GRÁFICO DE ISOTERMAS. Cada punto del gráfico corresponde a un estado del gas. Intenta moverte por la curva suavemente.',
    },
    { 
      id: 4, tipo: 'accion', pista: 'Bomba de Gas',
      mensaje: '¿Presión insuficiente? Puedes bombear más gas con el control de MOLES (n). Más moléculas significan más colisiones cinéticas.',
    },
    { 
      id: 5, tipo: 'verificar', pista: 'Sincroniza',
      mensaje: 'Cuando logres la PRESIÓN OBJETIVO (±0.05), el botón VALIDAR se activará. ¡Mantén el sistema en equilibrio!',
      accion: 'Validar Telemetría',
    }
  ],
  'quimica-3': [
    {
      id: 1, tipo: 'intro', pista: 'Protocolo Iniciado',
      mensaje: '¡Bienvenido al núcleo de Fusión Estequiométrica! Tu misión es certificar la Conservación de la Masa. Ajusta los coeficientes para que los átomos en ambos lados sean idénticos.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Sincronía Molecular',
      mensaje: 'Utiliza los inyectores de masa en tu bitácora. Observa cómo el motor 3D renderiza las moléculas reales y el núcleo de plasma se estabiliza con cada ajuste correcto.',
    },
    {
      id: 3, tipo: 'verificar', pista: 'Ley de Lavoisier',
      mensaje: 'Cuando logres el equilibrio atómico total, el núcleo emitirá una señal de estabilidad. Redacta tu conclusión técnica (50+ palabras) para obtener la certificación.',
      accion: 'Certificar Fusión',
    }
  ],
  'quimica-6': [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al taller de Cristalización. Tu misión es purificar KNO₃ mediante un choque térmico controlado. ¡Comencemos!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Inyección de Soluto',
      mensaje: 'Primero, añade 80g de Nitrato de Potasio (KNO₃) al vaso de precipitados usando el inyector del dock inferior.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Disolución Térmica',
      mensaje: 'Traslada el vaso a la PARRILLA DE CALENTAMIENTO. Observa cómo la temperatura sube. Debes alcanzar al menos 80°C para disolver todo el soluto.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Curva de Solubilidad',
      mensaje: 'Observa la telemetría. A medida que la temperatura aumenta, la capacidad del agua para retener soluto crece exponencialmente. ¿Ves cómo desaparecen los cristales?',
    },
    {
      id: 5, tipo: 'accion', pista: 'Choque Térmico',
      mensaje: '¡Ahora el paso crítico! Mueve el vaso directamente al BAÑO DE HIELO. El enfriamiento repentino forzará la sobresaturación y la formación de cristales puros.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Nucleación',
      mensaje: 'Observa la base del vaso. Los cristales emergerán del caos molecular. Cuando la temperatura baje de 20°C, habrás recuperado la mayor parte del soluto.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Valida la Misión',
      mensaje: 'Si has logrado ver la cristalización activa en el baño de hielo, presiona "Validar Práctica" en la cabecera para certificar tu experimento.',
      accion: 'Finalizar Análisis',
    }
  ],
  'quimica-7': [
    {
      id: 1, tipo: 'intro', pista: 'Misión: Valoración',
      mensaje: '¡Hola, {alumno}! Tu objetivo es determinar la concentración de HCl. Primero, purga la bureta presionando el botón "Llenar Bureta".',
    },
    {
      id: 2, tipo: 'accion', pista: 'Indicador de Color',
      mensaje: 'Añade el indicador de Fenolftaleína al matraz Erlenmeyer. Sin él, no podremos ver el punto de equivalencia.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Control de Válvula',
      mensaje: 'Abre la válvula de la bureta suavemente. Te recomiendo usar un goteo lento cuando te acerques al pH 7. ¡La precisión es clave!',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Curva de pH',
      mensaje: 'Observa el gráfico. El salto brusco de pH te indicará que estás cerca del punto de equivalencia. ¡Cuidado con pasarte!',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Viraje Rosa',
      mensaje: 'Detén el flujo en cuanto veas el primer cambio a rosa pálido persistente. Ese es el Punto Final de la titulación.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Finalizar',
      mensaje: '¡Excelente! Ahora guarda el reporte y presiona "Validar Práctica" para terminar el análisis de concentración.',
      accion: 'Validar Titulación',
    }
  ],
  'quimica-8': [
    {
      id: 1, tipo: 'intro', pista: 'Le Châtelier',
      mensaje: '¡Bienvenido, {alumno}! Estudiaremos el equilibrio N₂O₄ ⇌ 2NO₂. El N₂O₄ es incoloro y el NO₂ es café. ¿Cómo afectará el calor?',
    },
    {
      id: 2, tipo: 'accion', pista: 'Estación Térmica',
      mensaje: 'Haz clic en una de las jeringas y muévela a la "Plancha Caliente". Observa el cambio de color inmediato.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Endotérmico',
      mensaje: 'Como la reacción es endotérmica, el calor favorece la formación de NO₂ (gas café). ¿Ves cómo se oscurece?',
    },
    {
      id: 4, tipo: 'accion', pista: 'Choque Térmico',
      mensaje: 'Ahora mueve esa misma jeringa al "Baño de Hielo". El equilibrio se desplazará hacia el N₂O₄ incoloro.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Inercia Térmica',
      mensaje: 'Observa la telemetría. La temperatura no cambia instantáneamente. Esa "inercia" es clave en procesos químicos industriales.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Finalizar',
      mensaje: 'Has demostrado el Principio de Le Châtelier. Registra tus observaciones en la bitácora y valida la práctica.',
      accion: 'Certificar Equilibrio',
    }
  ],
  'quimica-1': [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Bienvenido al Forge Atómico de CEN Labs. Tu misión es construir un isótopo estable del elemento objetivo. ¡Empecemos!',
    },
    {
      id: 2, tipo: 'accion', pista: 'Configura Protones',
      mensaje: 'Usa el panel de partículas para añadir Protones (Z). Recuerda: el número de protones define la identidad del elemento en la tabla periódica.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Añade Neutrones',
      mensaje: 'Ahora añade Neutrones (N). Estos aportan masa (A = Z + N) y actúan como el "pegamento" nuclear. Verifica la estabilidad en el gráfico de la derecha.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Distribuye Electrones',
      mensaje: 'Añade Electrones para equilibrar la carga. Un átomo neutro tiene tantos electrones como protones. Observa cómo se llenan los niveles de energía (1s², 2s²...).',
    },
    {
      id: 5, tipo: 'calculo', pista: 'Diagrama de Segré',
      mensaje: 'Observa el panel de telemetría inferior. Tu isótopo debe estar dentro de la banda de estabilidad (puntos verdes). Si está fuera, será radiactivo.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Valida la Estructura',
      mensaje: 'Cuando alcances los valores objetivo y el núcleo sea estable, presiona "Validar Práctica" en la cabecera. ¡La precisión atómica es fundamental!',
      accion: 'Validar Isótopo',
    },
    {
      id: 7, tipo: 'logro', pista: '¡Átomo Forjado!',
      mensaje: '¡Excelente! Has dominado la arquitectura de la materia. Recuerda: la estabilidad nuclear depende del equilibrio entre la fuerza fuerte y la repulsión electromagnética.',
    },
  ],
  'quimica-4': [
    {
      id: 1, tipo: 'intro', pista: 'Reactivo Limitante',
      mensaje: '¡Hola, {alumno}! Bienvenido a la planta de amoníaco. Tu misión es optimizar la producción de NH₃ identificando el reactivo que limita la reacción.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Carga de Reactivos',
      mensaje: 'Ajusta la cantidad inicial de Nitrógeno (N₂) e Hidrógeno (H₂) usando los controles del dock inferior. Observa cómo cambian las proporciones molares.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Análisis Estequiométrico',
      mensaje: 'Usa la proporción 1:3 para determinar el limitante. Divide los moles de cada reactivo entre su coeficiente. El menor valor te indicará quién se agota primero.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Inicia Síntesis',
      mensaje: 'Presiona "Iniciar Reacción". Observa el flujo de productos y cuánto reactivo queda en exceso. Si los cálculos son correctos, el rendimiento será máximo.',
      accion: 'Ejecutar Síntesis',
    }
  ],
  'quimica-5': [
    {
      id: 1, tipo: 'intro', pista: 'Preparación Molar',
      mensaje: '¡Hola, {alumno}! Prepárate para forjar una solución de NaCl 0.5M. La precisión en el pesaje y el aforo determinará tu éxito.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Pesaje de Precisión',
      mensaje: 'Coloca el vidrio de reloj en la balanza analítica y presiona TARA (botón Z). Luego añade la masa exacta de NaCl requerida para tu volumen objetivo.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Transferencia y Disolución',
      mensaje: 'Traslada el soluto pesado al matraz aforado. Añade una pequeña cantidad de agua para disolver antes de llegar al cuello del matraz.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Control de Menisco',
      mensaje: 'Añade agua destilada gota a gota hasta que la curva inferior del menisco toque exactamente la línea de aforo. ¡Un exceso de una gota invalidará la muestra!',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Concentración',
      mensaje: 'Una vez aforado correctamente, presiona Validar. El sistema analizará la molaridad final mediante sensores de conductividad.',
      accion: 'Certificar Solución',
    }
  ],
  'quimica-9': [
    {
      id: 1, tipo: 'intro', pista: 'Potencial Redox',
      mensaje: '¡Hola, {alumno}! Bienvenido al estudio de celdas galvánicas. Vamos a convertir energía química en eléctrica usando la espontaneidad redox.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Selección de Electrodos',
      mensaje: 'Selecciona los metales para el ánodo y el cátodo en el dock inferior. Recuerda: el metal con menor potencial de reducción se oxidará (Ánodo).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Cierre del Circuito',
      mensaje: 'Instala el PUENTE SALINO entre ambos vasos para permitir el flujo iónico. Sin él, la acumulación de carga detendría la reacción instantáneamente.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Conexión Eléctrica',
      mensaje: 'Conecta los cables del voltímetro. Si el voltaje es negativo, intercambia la polaridad para detectar el flujo espontáneo de electrones.',
    },
    {
      id: 5, tipo: 'verificar', pista: 'Validar Voltaje',
      mensaje: 'Observa la telemetría gigante. Cuando detectes un potencial estable y positivo, habrás completado el circuito galvánico con éxito.',
      accion: 'Validar Circuito',
    }
  ],
  'quimica-10': [
    {
      id: 1, tipo: 'intro', pista: 'Purificación Térmica',
      mensaje: '¡Hola, {alumno}! Tu misión es purificar Etanol mediante destilación fraccionada. Aprovecharemos la diferencia en los puntos de ebullición.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Manta Calefactora',
      mensaje: 'Ajusta la potencia de la manta calefactora para alcanzar una temperatura de vapor de ~78°C. Evita subir a 100°C para no arrastrar agua.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Equilibrio Vapor-Líquido',
      mensaje: 'Observa cómo el vapor asciende por la columna de fraccionamiento y se condensa en el refrigerante. Mantén la isoterma estable.',
    },
    {
      id: 4, tipo: 'verificar', pista: 'Recolección',
      mensaje: 'Colecta al menos 50ml de destilado en la probeta graduada. Verifica la pureza en la telemetría digital antes de validar.',
      accion: 'Certificar Pureza',
    }
  ]
};
