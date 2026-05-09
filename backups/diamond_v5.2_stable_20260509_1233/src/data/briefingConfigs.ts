import { BriefingConfig } from '@/components/MissionBriefing';

export const ALL_BRIEFING_CONFIGS: Record<string, BriefingConfig> = {
  'matematicas-1': {
    codigo: 'MAT-01',
    titulo: 'Ecuaciones Cuadráticas',
    subtitulo: 'Análisis de Trayectorias Parabólicas',
    acento: '#22d3ee',
    duracion: 45,
    videoUrl: 'https://youtu.be/lq3R6uPGWNA',
    bienvenida: `¡Bienvenido al Laboratorio de Ecuaciones Cuadráticas! Soy el Dr. Quantum y hoy vamos a explorar una de las funciones más poderosas de las matemáticas.\n\nUna función cuadrática f(x) = ax² + bx + c no es solo una ecuación en un libro — es la descripción matemática de cómo vuela un proyectil, cómo se enfoca una antena parabólica o cómo se modela la ganancia óptima en un proyecto de ingeniería.\n\nTu misión: ajustar los parámetros de una parábola hasta sincronizarla con una trayectoria objetivo. ¡Las matemáticas son el idioma del universo!`,
    conceptos: [
      { icono: 'Δ', nombre: 'Discriminante', descripcion: 'Δ = b² − 4ac determina la naturaleza de las raíces: dos reales (Δ>0), una doble (Δ=0) o complejas conjugadas (Δ<0).' },
      { icono: '📍', nombre: 'Vértice', descripcion: 'El punto (h, k) donde h = −b/2a. Es el máximo o mínimo absoluto de la función.' },
      { icono: '≡', nombre: '3 Formas Equivalentes', descripcion: 'Estándar ax²+bx+c, Vértice a(x−h)²+k y Factorizada a(x−r₁)(x−r₂).' },
      { icono: '∑', nombre: 'Teoremas de Vieta', descripcion: 'Si r₁, r₂ son las raíces entonces r₁+r₂ = −b/a y r₁·r₂ = c/a.' },
      { icono: 'ℹ️', nombre: 'Números Complejos', descripcion: 'Cuando Δ<0 las raíces son z = h ± i·√(−Δ)/2|a|.' },
      { icono: '🔄', nombre: 'Completar el Cuadrado', descripcion: 'Técnica algebraica para transformar la forma estándar a la forma vértice.' },
    ],
    mision: [
      'Observa la TRAYECTORIA OBJETIVO en el piloto.',
      'Calcula el DISCRIMINANTE (Δ = b² − 4ac) y anótalo en la Bitácora.',
      'Localiza el VÉRTICE: calcula h = −b/2a.',
      'Ajusta los controles (a, b, c) para sincronizar tu parábola.',
      'Analiza las 3 Formas Equivalentes y confirma que son idénticas.',
      'Presiona “Validar Trayectoria” cuando el % SYNC sea alto.',
    ],
    aplicaciones: [
      { area: 'Ingeniería Civil', ejemplo: 'El arco de un puente sigue exactamente una curva parabólica.' },
      { area: 'Física — Mecánica', ejemplo: 'Todo proyectil en un campo gravitacional describe una trayectoria parabólica.' },
      { area: 'Electrónica', ejemplo: 'Las antenas satelitales concentran señales en un punto exacto llamado foco.' },
    ],
    retos: [
      'Calibración de Antena: Encuentra la parábola que minimiza el ruido en una tormenta (Δ=0).',
      'Balística de Precisión: Impacta el objetivo usando solo el coeficiente "a" negativo.',
      'Optimización de Costos: Halla el vértice que representa el gasto mínimo en un puente.',
    ]
  },
  'matematicas-2': {
    codigo: 'MAT-02',
    titulo: 'Triangulación Satelital',
    subtitulo: 'Sistemas de Ecuaciones 2x2',
    acento: '#219EBC',
    duracion: 35,
    videoUrl: 'https://youtu.be/MFX5Aofjyfk',
    bienvenida: `¡Bienvenido a la Estación de Rastreo Orbital! Soy el Dr. Quantum y hoy vamos a usar el álgebra lineal para localizar una señal en el espacio.\n\nUn sistema de dos ecuaciones con dos incógnitas representa visualmente la intersección de dos trayectorias. Encontrar esa solución (x, y) es la base de la navegación GPS y la triangulación de telecomunicaciones.\n\nTu misión: ajustar las pendientes y ordenadas de dos haces láser hasta interceptar el satélite guía en las coordenadas indicadas en el radar.`,
    conceptos: [
      { icono: '📈', nombre: 'Pendiente (m)', descripcion: 'Indica la inclinación del haz láser. Representa la tasa de cambio de la trayectoria.' },
      { icono: '📍', nombre: 'Ordenada (b)', descripcion: 'El punto de origen o desfase de la trayectoria en el eje vertical.' },
      { icono: '✖️', nombre: 'Punto de Intersección', descripcion: 'La solución única (x, y) donde ambos haces se cruzan para localizar el objetivo.' },
      { icono: '平行', nombre: 'Paralelismo', descripcion: 'Si m₁ = m₂, los haces son paralelos y el sistema es inconsistente (no hay localización).' },
      { icono: '🎯', nombre: 'Método Gráfico', descripcion: 'Visualización directa de la solución mediante la superposición de trayectorias en el plano.' },
    ],
    mision: [
      'Selecciona un CASO DE ESTUDIO (Rastreo Satelital, Intersección Vial o Triangulación).',
      'Identifica las coordenadas del OBJETIVO en el radar (X, Y).',
      'Ajusta m₁ y b₁ del Haz Alpha para aproximarte al cuadrante del objetivo.',
      'Configura m₂ y b₂ del Haz Omega para crear el punto de intersección exacto.',
      'Observa cómo cambian las ecuaciones y = mx + b en tiempo real sobre los láseres.',
      'Sincroniza la intersección hasta activar el mensaje "COORDINATES MATCHED".',
      'Registra los coeficientes finales en tu bitácora para validar la misión.',
    ],
    aplicaciones: [
      { area: 'Telecomunicaciones', ejemplo: 'Localización de un dispositivo mediante la potencia de dos torres base.' },
      { area: 'Ingeniería de Vuelo', ejemplo: 'Cálculo de rutas de interceptación para naves en órbita.' },
      { area: 'Logística Global', ejemplo: 'Optimización de rutas de transporte basadas en puntos de encuentro.' },
    ],
    retos: [
      'Interferencia Masiva: Localiza el objetivo cuando b1 y b2 son idénticos.',
      'Sincronía de Fallas: Triangula una señal usando solo coeficientes m positivos.',
      'Rastreo Silencioso: Encuentra la intersección sin que las rectas salgan del radar.',
    ]
  },
  'matematicas-3': {
    codigo: 'MAT-03',
    titulo: 'Análisis Exponencial: Escala Richter',
    subtitulo: 'Logaritmos y Energía Sísmica',
    acento: '#f43f5e',
    duracion: 40,
    videoUrl: 'https://youtu.be/B_0q1tpaZbk',
    bienvenida: `¡Bienvenido al Centro de Monitoreo Sismológico! Soy el Dr. Quantum. Hoy descubriremos por qué los terremotos no se miden en una escala lineal común.\n\nLa Escala Richter es logarítmica. Esto significa que un sismo de magnitud 7.0 no es "un poco" más fuerte que uno de 6.0 — su onda es 10 veces más alta y libera 32 veces más energía.\n\nTu misión: Analizar hitos históricos como Valdivia 1960 o Tohoku 2011 y visualizar el poder destructivo del crecimiento logarítmico.`,
    conceptos: [
      { icono: 'log', nombre: 'Base Logarítmica', descripcion: 'La escala Mw usa base 10 para la altura de la onda. Cada grado aumenta la altura x10.' },
      { icono: '🌋', nombre: 'Factor de Energía (x32)', descripcion: 'Cada incremento de 1.0 en la magnitud libera aproximadamente 32 veces más energía.' },
      { icono: '〰️', nombre: 'Amplitud de Onda', descripcion: 'La altura máxima registrada por el sismógrafo, visible en la estación 3D.' },
      { icono: '📈', nombre: 'Crecimiento Exponencial', descripcion: 'Pequeños cambios en Mw resultan en cambios masivos en el volumen de energía.' },
    ],
    mision: [
      'Selecciona uno de los CASOS HISTÓRICOS (Valdivia, CDMX o Tohoku).',
      'Observa la Estación de REFERENCIA configurada en Mw 5.0.',
      'Ajusta la Estación EXPERIMENTAL hasta alcanzar la magnitud del evento histórico.',
      'Analiza las notas de impacto físico que aparecen en el HUD al subir la intensidad.',
      'Calcula cuántas veces más energía se liberó en ese evento frente a la referencia.',
      'Documenta el colapso estructural simulado a magnitudes superiores a 9.0.',
    ],
    aplicaciones: [
      { area: 'Sismología Avanzada', ejemplo: 'Cuantificación del daño potencial basado en el momento sísmico liberado.' },
      { area: 'Ingeniería Civil', ejemplo: 'Diseño antisísmico capaz de resistir aceleraciones logarítmicas.' },
      { area: 'Gestión de Riesgos', ejemplo: 'Modelado de impacto para planes de evacuación en zonas de falla.' },
    ],
    retos: [
      'Comparativa Valdivia: Visualiza la energía del sismo más fuerte de la historia (9.5).',
      'Cálculo de Réplicas: Estima la energía de un sismo de 6.0 frente a uno de 8.0.',
      'Límite Estructural: Identifica a qué magnitud ocurre el colapso total del sistema.',
    ]
  },
  'quimica-1': {
    codigo: 'QMI-01',
    titulo: 'Arquitectura Atómica',
    subtitulo: 'Isótopos y Estabilidad Nuclear',
    acento: '#06B6D4',
    duracion: 30,
    videoUrl: 'https://youtu.be/917vmRGfUcQ',
    bienvenida: `¡Bienvenido al Colisionador de Hadrones Virtual! Soy el Dr. Quantum y hoy serás un arquitecto de la materia.\n\nTodo lo que ves a tu alrededor está definido por la configuración exacta de partículas subatómicas. Vamos a manipular protones para definir la identidad, neutrones para ajustar la masa y electrones para equilibrar la carga eléctrica.\n\nTu misión: Forjar un átomo de Carbono-14, un isótopo clave para entender la cronología de nuestra civilización.`,
    conceptos: [
      { icono: '⚛️', nombre: 'Número Atómico (Z)', descripcion: 'La cantidad de protones en el núcleo. Define la identidad del elemento.' },
      { icono: '⚖️', nombre: 'Número de Masa (A)', descripcion: 'La suma de protones y neutrones.' },
      { icono: '⚡', nombre: 'Carga Neta', descripcion: 'El balance entre protones (+) y electrones (-).' },
      { icono: '🔄', nombre: 'Isótopos', descripcion: 'Átomos del mismo elemento con diferente cantidad de neutrones.' },
      { icono: '🛡️', nombre: 'Banda de Estabilidad', descripcion: 'La proporción necesaria para que un núcleo no se desintegre.' },
      { icono: '🌀', nombre: 'Principio de Pauli', descripcion: 'Regla que dicta cómo se distribuyen los electrones en orbitales.' }
    ],
    mision: [
      'Añade exactamente 6 protones para crear la base del Carbono.',
      'Añade 8 neutrones para alcanzar la masa del isótopo 14.',
      'Sincroniza la nube electrónica añadiendo 6 electrones.',
      'Verifica en el Diagrama de Segré que tu isótopo sea estable.',
      'Valida la integridad del átomo.'
    ],
    aplicaciones: [
      { area: 'Arqueología', ejemplo: 'Uso del Carbono-14 para datar restos orgánicos antiguos.' },
      { area: 'Medicina Nuclear', ejemplo: 'Creación de isótopos para tomografías (PET).' },
      { area: 'Energía Limpia', ejemplo: 'Comprensión de los procesos de fusión estelar.' }
    ]
  },
  'quimica-2': {
    codigo: 'QMI-02',
    titulo: 'Leyes de los Gases Ideales',
    subtitulo: 'Cinética Molecular y Termodinámica',
    acento: '#219EBC',
    duracion: 40,
    videoUrl: 'https://youtu.be/ooLnSYsMcZA',
    bienvenida: `¡Bienvenido al Laboratorio de Termodinámica! Soy el Dr. Quantum y hoy vamos a explorar cómo la energía térmica se traduce en presión.\n\nManipularemos el volumen, la temperatura y la cantidad de sustancia para validar la Ley Universal de los Gases (PV=nRT).\n\nTu misión: estabilizar la cámara en la presión objetivo sin exceder el límite de seguridad de 7.0 atm. ¡El borosilicato tiene sus límites!`,
    conceptos: [
      { icono: '🌡️', nombre: 'Temperatura (T)', descripcion: 'Energía cinética promedio de las moléculas (en Kelvin).' },
      { icono: '📦', nombre: 'Volumen (V)', descripcion: 'Espacio disponible para las partículas.' },
      { icono: '⚖️', nombre: 'Materia (n)', descripcion: 'Cantidad de sustancia en moles.' },
      { icono: '⚡', nombre: 'Presión (P)', descripcion: 'Fuerza de choque contra las paredes del contenedor.' },
      { icono: '🧊', nombre: 'Ley de Boyle', descripcion: 'Relación inversa entre P y V a T constante.' },
      { icono: '⚠️', nombre: 'Punto de Colapso', descripcion: 'Límite estructural del contenedor (7 atm).' }
    ],
    mision: [
      'Ajusta la TEMPERATURA para ver la velocidad molecular.',
      'Manipula el VOLUMEN y verifica la Ley de Boyle.',
      'Usa el control de MOLES para ver cómo afecta la densidad.',
      'Logra la PRESIÓN OBJETIVO indicada.',
      'Registra 3 hallazgos en tu Bitácora.'
    ],
    aplicaciones: [
      { area: 'Ingeniería Aeroespacial', ejemplo: 'Control de presión en tanques de combustible criogénico.' },
      { area: 'Medicina', ejemplo: 'Regulación de presión en ventiladores mecánicos.' },
      { area: 'Buceo', ejemplo: 'Efectos de la presión en la solubilidad de gases en la sangre.' }
    ]
  },
  'quimica-3': {
    codigo: 'QMI-03',
    titulo: 'Motor de Fusión Estequiométrica',
    subtitulo: 'Sincronización de Masas y Ley de Lavoisier',
    acento: '#06b6d4',
    duracion: 50,
    videoUrl: 'https://youtu.be/TNdAO9w06Ko',
    bienvenida: `¡Bienvenido al núcleo del Reactor CEN! Soy el Dr. Quantum y hoy vamos a certificar uno de los principios fundamentales del cosmos: la Conservación de la Materia.\n\nEn un reactor químico, nada se crea ni se destruye por azar. Cada átomo de hidrógeno, carbono u oxígeno que entra en la reacción debe estar presente al final, aunque su estructura molecular haya cambiado por completo. Si tus coeficientes fallan, el reactor se vuelve inestable y la producción se detiene.\n\nTu misión: Balancear reacciones críticas, desde la combustión de propano hasta complejos procesos industriales, asegurando que la balanza de masa sea perfecta. ¡Sincroniza el universo átomo por átomo!`,
    conceptos: [
      { icono: '⚖️', nombre: 'Ley de Lavoisier', descripcion: 'La masa total de los reactivos es idéntica a la de los productos en un sistema cerrado.' },
      { icono: 'n', nombre: 'Coeficiente Molar', descripcion: 'Multiplicador que indica la cantidad de moléculas necesarias para el equilibrio.' },
      { icono: 'uma', nombre: 'Masa Molar', descripcion: 'La suma de las masas atómicas de todos los átomos en una fórmula química.' },
      { icono: '🔥', nombre: 'Combustión', descripcion: 'Reacción exotérmica donde un hidrocarburo se oxida para producir CO₂ y vapor de agua.' },
      { icono: '⚛️', nombre: 'Estequiometría', descripcion: 'El cálculo de las relaciones cuantitativas entre sustancias en una reacción.' },
    ],
    mision: [
      'Analiza la ECUACIÓN QUÍMICA en la pantalla de telemetría.',
      'Identifica los átomos presentes en reactivos y productos.',
      'Ajusta los INYECTORES DE MASA (coeficientes) en tu bitácora.',
      'Observa el motor 3D: el núcleo se estabiliza con cada ajuste correcto.',
      'Certifica el balanceo cuando la SINCRONÍA DE MASA sea del 100%.',
      'Documenta tu hallazgo científico con un informe de al menos 50 palabras.',
    ],
    aplicaciones: [
      { area: 'Ingeniería Petroquímica', ejemplo: 'Optimización de la mezcla aire-combustible en motores de alto rendimiento.' },
      { area: 'Farmacia Nuclear', ejemplo: 'Síntesis de isótopos con proporciones atómicas de precisión absoluta.' },
      { area: 'Sostenibilidad', ejemplo: 'Captura de carbono mediante reacciones estequiométricas controladas.' },
    ],
    retos: [
      'Combustión Total: Sincroniza el Octano (Gasolina) con coeficientes superiores a 20.',
      'Fusión de Haber: Produce amoníaco con el mínimo consumo de nitrógeno.',
      'Certificación Lavoisier: Logra el 100% de eficiencia en los 6 niveles del reactor.'
    ]
  },
  'quimica-4': {
    codigo: 'QMI-04',
    titulo: 'Reactivo Limitante',
    subtitulo: 'Optimización de Procesos',
    acento: '#22d3ee',
    duracion: 35,
    videoUrl: 'https://youtu.be/pEAJMi0eWiw',
    bienvenida: `¡Bienvenido a la Consola de Producción Molecular! Soy el Dr. Quantum.\n\nEn la industria, el reactivo limitante dicta el éxito económico. Aprenderás que la química reacciona en moles, no en gramos.\n\nTu misión: Operar el reactor para sintetizar compuestos con residuo cero.`,
    conceptos: [
      { icono: '📉', nombre: 'Reactivo Limitante', descripcion: 'Sustancia que se consume totalmente y detiene la reacción.' },
      { icono: '📈', nombre: 'Reactivo en Exceso', descripcion: 'Materia sobrante tras la reacción.' },
      { icono: '🧮', nombre: 'Rendimiento Teórico', descripcion: 'Máxima producción posible según estequiometría.' },
      { icono: '🔄', nombre: 'Masa vs Mol', descripcion: 'La masa se pesa, el mol es el que reacciona.' }
    ],
    mision: [
      'Analiza los Pesos Moleculares (PM) de los reactivos.',
      'Ajusta inyectores y observa la conversión a moles.',
      'Identifica el reactivo limitante.',
      'Optimiza los niveles hasta desperdicio nulo.',
      'Ejecuta la síntesis certificada.'
    ],
    aplicaciones: [
      { area: 'Proceso Haber', ejemplo: 'Síntesis de amoníaco a escala global.' },
      { area: 'Medicamentos', ejemplo: 'Control de precursores costosos.' },
      { area: 'Industria', ejemplo: 'Reducción de residuos químicos.' }
    ]
  },
  'quimica-5': {
    codigo: 'QMI-05',
    titulo: 'Preparación de Soluciones',
    subtitulo: 'Molaridad y Aforo',
    acento: '#219EBC',
    duracion: 35,
    videoUrl: 'https://youtu.be/-x7O0Tx7y8M',
    bienvenida: `¡Bienvenido al Laboratorio Analítico! Soy el Dr. Quantum. Prepararemos disoluciones de precisión quirúrgica.\n\nUna solución mal aforada invalida meses de investigación. Dominarás el pesaje analítico y el menisco perfecto.\n\nTu misión: Preparar NaCl a la molaridad exacta solicitada.`,
    conceptos: [
      { icono: '⚖️', nombre: 'Molaridad (M)', descripcion: 'Moles de soluto por litro de disolución.' },
      { icono: '💧', nombre: 'Solvente vs Soluto', descripcion: 'Sustancia que disuelve vs sustancia disuelta.' },
      { icono: '🌡️', nombre: 'Aforo Volumétrico', descripcion: 'Técnica de llenado hasta marca exacta.' },
      { icono: '🔢', nombre: 'Pureza', descripcion: 'Factor de corrección para reactivos comerciales.' }
    ],
    mision: [
      'Calcula la MASA TEÓRICA necesaria.',
      'Opera la Balanza Analítica usando la TARA.',
      'Transfiere la sal al matraz aforado.',
      'Añade agua hasta el menisco exacto.',
      'Verifica la concentración final.'
    ],
    aplicaciones: [
      { area: 'Salud', ejemplo: 'Preparación de suero fisiológico intravenoso.' },
      { area: 'Alimentos', ejemplo: 'Control de salmueras en producción masiva.' },
      { area: 'Forense', ejemplo: 'Reactivos para detección de trazas de ADN.' }
    ]
  },
  'quimica-6': {
    codigo: 'QMI-06',
    titulo: 'Solubilidad y Cristalización',
    subtitulo: 'Termodinámica de Fases',
    acento: '#6366f1',
    duracion: 30,
    videoUrl: 'https://youtu.be/Pu7otmbiEeY',
    bienvenida: `¡Bienvenido al Taller de Purificación Térmica! Soy el Dr. Quantum.\n\nVerás cómo el orden emerge del caos mediante el control de la temperatura. Forzaremos la sobresaturación para crear cristales geométricos perfectos.\n\nTu misión: Recristalizar KNO3 mediante un choque térmico controlado.`,
    conceptos: [
      { icono: '📈', nombre: 'Solubilidad', descripcion: 'Máxima cantidad de soluto a una T específica.' },
      { icono: '🔥', nombre: 'Saturación', descripcion: 'Punto de equilibrio dinámico entre sólido y líquido.' },
      { icono: '🧊', nombre: 'Cristalización', descripcion: 'Ordenamiento molecular en redes geométricas.' },
      { icono: '⚡', nombre: 'Sobresaturación', descripcion: 'Estado metaestable inestable inducido por enfriamiento.' }
    ],
    mision: [
      'Disuelve 80g de soluto en agua caliente.',
      'Calienta hasta lograr una solución límpida.',
      'Traslada al baño de hielo bruscamente.',
      'Observa la nucleación de los cristales.',
      'Valida la pureza del cristal obtenido.'
    ],
    aplicaciones: [
      { area: 'Minería', ejemplo: 'Purificación de metales preciosos.' },
      { area: 'Farmacia', ejemplo: 'Aislamiento de principios activos puros.' },
      { area: 'Electrónica', ejemplo: 'Crecimiento de cristales de silicio para chips.' }
    ]
  },
  'quimica-7': {
    codigo: 'QMI-07',
    titulo: 'Titulación Ácido-Base',
    subtitulo: 'Valoración Volumétrica',
    acento: '#ec4899',
    duracion: 40,
    videoUrl: 'https://youtu.be/BkmkNzPkpY0',
    bienvenida: `¡Bienvenido al Laboratorio de Química Analítica Superior! Soy el Dr. Quantum.\n\nDeterminaremos concentraciones desconocidas gota a gota. La neutralización es una danza de protones que cambia el color de la realidad.\n\nTu misión: Encontrar el punto de equivalencia con precisión de mililitro.`,
    conceptos: [
      { icono: '⚖️', nombre: 'Punto de Equivalencia', descripcion: 'Moles de ácido = Moles de base.' },
      { icono: '🧪', nombre: 'Indicador', descripcion: 'Sustancia que cambia de color al viraje de pH.' },
      { icono: '📏', nombre: 'Alícuota', descripcion: 'Volumen exacto de muestra analizada.' },
      { icono: '💧', nombre: 'Goteo Crítico', descripcion: 'Técnica de flujo lento al final de la valoración.' }
    ],
    mision: [
      'Purga la bureta con NaOH 0.1 M.',
      'Añade Fenolftaleína al matraz de HCl.',
      'Inicia el goteo constante.',
      'Reduce a goteo lento al notar cambios de color.',
      'Registra el volumen en el Rosa Pálido.'
    ],
    aplicaciones: [
      { area: 'Calidad', ejemplo: 'Medición de acidez en jugos y lácteos.' },
      { area: 'Medicina', ejemplo: 'Análisis de acidez gástrica.' },
      { area: 'Agua', ejemplo: 'Monitoreo de alcalinidad en potabilizadoras.' }
    ]
  },
  'quimica-8': {
    codigo: 'QMI-08',
    titulo: 'Equilibrio Químico',
    subtitulo: 'Principio de Le Châtelier',
    acento: '#f59e0b',
    duracion: 30,
    videoUrl: 'https://youtu.be/kzWxKfxu4DE',
    bienvenida: `¡Bienvenido al Observatorio de Dinámica Química! Soy el Dr. Quantum.\n\nLas reacciones no siempre terminan; a veces quedan atrapadas en un ciclo eterno. Veremos cómo el sistema se defiende de los cambios externos.\n\nTu misión: Predecir el desplazamiento del equilibrio del NO2 ante cambios de temperatura.`,
    conceptos: [
      { icono: '↔️', nombre: 'Equilibrio Dinámico', descripcion: 'Velocidad directa = Velocidad inversa.' },
      { icono: '🔄', nombre: 'Le Châtelier', descripcion: 'El sistema compensa cualquier perturbación externa.' },
      { icono: '🔥', nombre: 'Termocromismo', descripcion: 'Cambio de color inducido por la temperatura.' },
      { icono: '🌡️', nombre: 'Entalpía', descripcion: 'Calor absorbido o liberado por la reacción.' }
    ],
    mision: [
      'Prepara las jeringas con la mezcla gaseosa.',
      'Sumerge una en baño de hielo.',
      'Sumerge la otra en agua hirviendo.',
      'Compara la intensidad del color café.',
      'Deduce si la reacción es endo o exotérmica.'
    ],
    aplicaciones: [
      { area: 'Industria', ejemplo: 'Maximización de síntesis química variando T y P.' },
      { area: 'Biología', ejemplo: 'Equilibrio de oxígeno en la hemoglobina.' },
      { area: 'Atmosférica', ejemplo: 'Dinámica del smog y óxidos de nitrógeno.' }
    ]
  },
  'quimica-9': {
    codigo: 'QMI-09',
    titulo: 'Celdas Galvánicas',
    subtitulo: 'Electroquímica y Potenciales Redox',
    acento: '#3b82f6',
    duracion: 40,
    videoUrl: 'https://youtu.be/S36fqFGHIfo',
    bienvenida: `¡Bienvenido al Laboratorio de Energía Química! Soy el Dr. Quantum.\n\nConvertiremos el flujo de electrones en electricidad utilizable. Entenderás cómo funcionan las baterías que mueven el mundo moderno.\n\nTu misión: Ensamblar una pila funcional y medir su voltaje real.`,
    conceptos: [
      { icono: '🔋', nombre: 'Ánodo', descripcion: 'Electrodo donde ocurre la oxidación (pérdida de e-).' },
      { icono: '⚡', nombre: 'Cátodo', descripcion: 'Electrodo donde ocurre la reducción (ganancia de e-).' },
      { icono: '🔗', nombre: 'Puente Salino', descripcion: 'Conector que mantiene la neutralidad iónica.' },
      { icono: '📐', nombre: 'Ecuación de Nernst', descripcion: 'Predicción del voltaje según la concentración.' }
    ],
    mision: [
      'Limpia los electrodos de Zinc y Cobre.',
      'Prepara las soluciones de sulfato.',
      'Instala el puente salino correctamente.',
      'Conecta el voltímetro y verifica la polaridad.',
      'Calcula el potencial teórico vs el medido.'
    ],
    aplicaciones: [
      { area: 'Energía', ejemplo: 'Baterías de Litio y acumuladores de plomo.' },
      { area: 'Corrosión', ejemplo: 'Protección catódica de barcos y tuberías.' },
      { area: 'Metalurgia', ejemplo: 'Galvanoplastia y recubrimientos metálicos.' }
    ]
  },
  'quimica-10': {
    codigo: 'QMI-10',
    titulo: 'Destilación Fraccionada',
    subtitulo: 'Separación por Volatilidad',
    acento: '#8b5cf6',
    duracion: 45,
    videoUrl: 'https://youtu.be/G91Gkcm4rzM',
    bienvenida: `¡Bienvenido a la Torre de Fraccionamiento! Soy el Dr. Quantum.\n\nSepararemos mezclas complejas usando el calor como filtro. La precisión en la temperatura determinará la pureza de tu producto final.\n\nTu misión: Recuperar Etanol puro de una mezcla hidroalcohólica.`,
    conceptos: [
      { icono: '🌡️', nombre: 'Punto de Ebullición', descripcion: 'Temperatura de cambio de fase líquido-gas.' },
      { icono: '💧', nombre: 'Condensación', descripcion: 'Recuperación del vapor mediante enfriamiento.' },
      { icono: '📈', nombre: 'Fraccionamiento', descripcion: 'Múltiples evaporaciones para alta pureza.' },
      { icono: '🔥', nombre: 'Calor Latente', descripcion: 'Energía necesaria para el cambio de estado.' }
    ],
    mision: [
      'Monta el equipo de destilación con cuidado.',
      'Calienta la mezcla hasta los 78.4°C.',
      'Controla que la T no suba de 90°C.',
      'Recupera el destilado en el matraz colector.',
      'Mide la densidad para validar la pureza.'
    ],
    aplicaciones: [
      { area: 'Petróleo', ejemplo: 'Separación de crudo en gasolina, diesel y gas.' },
      { area: 'Bebidas', ejemplo: 'Producción de alcoholes destilados.' },
      { area: 'Perfumería', ejemplo: 'Extracción de aceites esenciales puros.' }
    ]
  },

  // FÍSICA
  'fisica-1': {
    codigo: 'FIS-01',
    titulo: 'Tiro Parabólico',
    subtitulo: 'Balística y Cinemática 2D',
    acento: '#38bdf8',
    duracion: 35,
    videoUrl: 'https://youtu.be/4wbTLJJwyng',
    bienvenida: `¡Bienvenido al Polígono de Artillería! Soy el Dr. Quantum. La gravedad es el juez supremo de todo proyectil.\n\nCombinaremos el movimiento horizontal uniforme con la caída libre vertical para dominar la parábola perfecta.\n\nTu misión: Impactar el dron objetivo superando el muro defensivo.`,
    conceptos: [
      { icono: '✈️', nombre: 'Trayectoria', descripcion: 'Curva descrita por el proyectil en el espacio.' },
      { icono: '📐', nombre: 'Ángulo de Disparo', descripcion: 'Factor que determina alcance y altura máxima.' },
      { icono: '⚡', nombre: 'Velocidad Inicial', descripcion: 'Energía de salida del proyectil.' },
      { icono: '🌍', nombre: 'Gravedad', descripcion: 'Aceleración constante hacia el centro de la Tierra.' }
    ],
    mision: [
      'Analiza la posición del dron y del muro.',
      'Ajusta el ángulo del cañón.',
      'Define la potencia de disparo.',
      'Evalúa la trayectoria en la pantalla.',
      'Logra el impacto directo.'
    ],
    aplicaciones: [
      { area: 'Deportes', ejemplo: 'Trayectoria de un balón de básquetbol o fútbol.' },
      { area: 'Ingeniería', ejemplo: 'Diseño de sistemas de riego y fuentes.' },
      { area: 'Espacial', ejemplo: 'Reentrada atmosférica de cápsulas espaciales.' }
    ]
  },
  'fisica-2': {
    codigo: 'FIS-02',
    titulo: 'Leyes de Newton',
    subtitulo: 'Dinámica en Plano Inclinado',
    acento: '#ef4444',
    duracion: 35,
    videoUrl: 'https://youtu.be/ZmPbH8g5FZE',
    bienvenida: `¡Bienvenido al Plano de Pruebas Dinámicas! Soy el Dr. Quantum.\n\nEntenderemos por qué los objetos se mueven o se quedan quietos. La fricción y la gravedad lucharán en cada milímetro de la rampa.\n\nTu misión: Calcular la aceleración exacta de un bloque sobre una rampa inclinada.`,
    conceptos: [
      { icono: '🍎', nombre: '2da Ley de Newton', descripcion: 'Fuerza = Masa x Aceleración (F=ma).' },
      { icono: '📉', nombre: 'Normal', descripcion: 'Fuerza perpendicular de soporte de la superficie.' },
      { icono: '🛑', nombre: 'Fricción', descripcion: 'Resistencia al movimiento entre superficies.' },
      { icono: '📐', nombre: 'Descomposición', descripcion: 'Análisis del peso en componentes X e Y.' }
    ],
    mision: [
      'Selecciona un MATERIAL (Hielo, Madera o Caucho) en el dock.',
      'Ajusta el ángulo de la rampa hasta que el bloque comience a deslizar.',
      'Observa el ÁNGULO CRÍTICO donde se rompe el equilibrio estático.',
      'Calcula la ACELERACIÓN teórica (a = g(sinθ - μk cosθ)).',
      'Ingresa tu resultado y valida la sincronización física.'
    ],
    aplicaciones: [
      { area: 'Transporte', ejemplo: 'Diseño de frenos para camiones en pendientes.' },
      { area: 'Arquitectura', ejemplo: 'Cálculo de rampas de acceso y seguridad.' },
      { area: 'Logística', ejemplo: 'Sistemas de bandas transportadoras industriales.' }
    ]
  },
  'fisica-3': {
    codigo: 'FIS-03',
    titulo: 'Péndulo Simple',
    subtitulo: 'Movimiento Armónico Simple',
    acento: '#8b5cf6',
    duracion: 30,
    videoUrl: 'https://youtu.be/16JxXu7TD58',
    bienvenida: `¡Bienvenido al Laboratorio de Cronometría! Soy el Dr. Quantum.\n\nDescubriremos el secreto del tiempo escondido en una cuerda y una masa. La gravedad será nuestro motor de oscilación.\n\nTu misión: Medir la gravedad local usando el periodo del péndulo.`,
    conceptos: [
      { icono: '⏳', nombre: 'Periodo (T)', descripcion: 'Tiempo de una ida y vuelta completa.' },
      { icono: '📏', nombre: 'Longitud (L)', descripcion: 'Única variable que afecta el tiempo en la Tierra.' },
      { icono: '🔄', nombre: 'Isocronismo', descripcion: 'Propiedad de oscilar igual en ángulos pequeños.' },
      { icono: '⚡', nombre: 'Energía', descripcion: 'Intercambio constante entre potencial y cinética.' }
    ],
    mision: [
      'Ajusta la longitud de la cuerda a 1.0m.',
      'Desplaza la masa exactamente 10 grados.',
      'Cronometra 10 oscilaciones completas.',
      'Calcula el periodo promedio.',
      'Despeja g de la fórmula T = 2π√(L/g).'
    ],
    aplicaciones: [
      { area: 'Relojería', ejemplo: 'Relojes de péndulo clásicos.' },
      { area: 'Geología', ejemplo: 'Detección de variaciones en la densidad terrestre.' },
      { area: 'Sismología', ejemplo: 'Sensores de movimiento de baja frecuencia.' }
    ]
  },
  'fisica-4': {
    codigo: 'FIS-04',
    titulo: 'Ley de Hooke',
    subtitulo: 'Elasticidad y Fuerzas Restauradoras',
    acento: '#ec4899',
    duracion: 30,
    videoUrl: 'https://youtu.be/199ZMPmYITk',
    bienvenida: `¡Bienvenido al Centro de Pruebas de Materiales! Soy el Dr. Quantum.\n\nAnalizaremos la memoria de los metales. Veremos cuánto puede estirarse un resorte antes de perder su forma original.\n\nTu misión: Determinar la constante elástica (k) de un resorte desconocido.`,
    conceptos: [
      { icono: '➰', nombre: 'Constante k', descripcion: 'Medida de la rigidez intrínseca del resorte.' },
      { icono: '📏', nombre: 'Elongación (x)', descripcion: 'Cambio de longitud respecto al equilibrio.' },
      { icono: '🎯', nombre: 'Fuerza Elástica', descripcion: 'Fuerza que intenta volver al reposo (F=-kx).' },
      { icono: '⚠️', nombre: 'Límite Elástico', descripcion: 'Punto donde el material se deforma permanentemente.' }
    ],
    mision: [
      'Mide la longitud inicial del resorte.',
      'Cuelga masas de peso creciente.',
      'Registra el estiramiento para cada masa.',
      'Grafica Fuerza vs Distancia.',
      'Calcula la pendiente (k) de la recta.'
    ],
    aplicaciones: [
      { area: 'Automotriz', ejemplo: 'Sistemas de suspensión y amortiguadores.' },
      { area: 'Construcción', ejemplo: 'Diseño de estructuras sismorresistentes.' },
      { area: 'Medicina', ejemplo: 'Prótesis elásticas y ortodoncia.' }
    ]
  },
  'fisica-5': {
    codigo: 'FIS-05',
    titulo: 'Prensa Hidráulica',
    subtitulo: 'Principio de Pascal y Ventaja Mecánica',
    acento: '#0ea5e9',
    duracion: 35,
    videoUrl: "https://www.youtube.com/embed/-HO5kokr6Uo",
    bienvenida: `¡Bienvenido al Centro de Ingeniería Hidráulica! Soy el Dr. Quantum. Hoy vamos a dominar una de las fuerzas más potentes de la industria.\n\nEl Principio de Pascal nos dice que la presión ejercida sobre un fluido incompresible se transmite con igual intensidad en todas las direcciones. Esto nos permite usar el área de los émbolos como una palanca líquida para multiplicar nuestra fuerza.\n\nTu misión: Configurar los radios de los émbolos para elevar un vehículo de carga de 2 toneladas usando la mínima fuerza posible. ¡La física es tu multiplicador de poder!`,
    conceptos: [
      { icono: '💧', nombre: 'Principio de Pascal', descripcion: 'La presión (P=F/A) es constante en todo el fluido interconectado.' },
      { icono: '⚙️', nombre: 'Ventaja Mecánica', descripcion: 'Relación entre las áreas (A2/A1) que determina cuánto se multiplica la fuerza.' },
      { icono: '⚖️', nombre: 'Equilibrio de Fuerzas', descripcion: 'Punto donde la presión de entrada iguala al peso de la carga.' },
      { icono: '📏', nombre: 'Conservación de Trabajo', descripcion: 'Lo que ganas en fuerza lo pierdes en distancia de recorrido (W = F·d).' }
    ],
    mision: [
      'Observa la MASA DE CARGA asignada en el pistón mayor.',
      'Ajusta el RADIO del émbolo de entrada (r1) y de salida (r2).',
      'Calcula la PRESIÓN necesaria para romper la inercia.',
      'Aplica la FUERZA DE ENTRADA (F1) gradualmente.',
      'Logra elevar la carga por encima del umbral de seguridad.',
      'Registra la Ganancia Mecánica final en tu bitácora.'
    ],
    aplicaciones: [
      { area: 'Automotriz', ejemplo: 'Sistemas de frenos hidráulicos y gatos para levantar autos.' },
      { area: 'Industria Pesada', ejemplo: 'Prensas de forja y maquinaria de construcción (excavadoras).' },
      { area: 'Aeronáutica', ejemplo: 'Control de trenes de aterrizaje y flaps en aviones.' }
    ],
    retos: [
      'Eficiencia Máxima: Eleva 1000kg usando menos de 200N de fuerza de entrada.',
      'Calibración de Precisión: Mantén la carga levitando exactamente a 1 metro de altura.',
      'Diseño Compacto: Logra la elevación reduciendo el radio de salida al mínimo posible.'
    ]
  },
  'fisica-6': {
    codigo: 'FIS-06',
    titulo: 'Principio de Arquímedes',
    subtitulo: 'Hidrostática y Empuje',
    acento: '#06b6d4',
    duracion: 30,
    videoUrl: 'https://youtu.be/GI9vhUIkqDg',
    bienvenida: `¡Bienvenido al Tanque de Flotabilidad! Soy el Dr. Quantum.\n\n"¡Eureka!" - Descubriremos por qué los barcos de acero flotan y las piedras pequeñas se hunden. El agua tiene una fuerza invisible hacia arriba.\n\nTu misión: Identificar un sólido misterioso mediante su densidad.`,
    conceptos: [
      { icono: '💧', nombre: 'Empuje (E)', descripcion: 'Fuerza igual al peso del fluido desalojado.' },
      { icono: '⚖️', nombre: 'Peso Aparente', descripcion: 'Peso del objeto cuando está sumergido.' },
      { icono: '📏', nombre: 'Volumen Desplazado', descripcion: 'Cantidad de fluido que el cuerpo "empuja" fuera.' },
      { icono: '🌊', nombre: 'Densidad (ρ)', descripcion: 'Relación masa/volumen característica del material.' }
    ],
    mision: [
      'Pesa el objeto en el aire.',
      'Sumerge el objeto en el tanque graduado.',
      'Mide el nuevo peso aparente.',
      'Calcula la fuerza de empuje (E).',
      'Determina la densidad y el material.'
    ],
    aplicaciones: [
      { area: 'Naval', ejemplo: 'Diseño de barcos y submarinos.' },
      { area: 'Aeronáutica', ejemplo: 'Funcionamiento de globos aerostáticos.' },
      { area: 'Joyas', ejemplo: 'Verificación de la pureza del oro.' }
    ]
  },
  'fisica-7': {
    codigo: 'FIS-07',
    titulo: 'Dilatación Térmica',
    subtitulo: 'Expansión de Sólidos',
    acento: '#ef4444',
    duracion: 35,
    videoUrl: 'https://youtu.be/_tznlKPd4f8',
    bienvenida: `¡Bienvenido al Horno de Precisión Micrométrica! Soy el Dr. Quantum.\n\nEl calor hace que los átomos se alejen. Veremos cómo estructuras masivas crecen milímetros imperceptibles pero peligrosos.\n\nTu misión: Medir el coeficiente de dilatación del Aluminio.`,
    conceptos: [
      { icono: '📏', nombre: 'Longitud Inicial', descripcion: 'Medida del material a temperatura ambiente.' },
      { icono: '🔥', nombre: 'Gradiente Térmico', descripcion: 'Cambio de temperatura aplicado (ΔT).' },
      { icono: '🔬', nombre: 'Coeficiente α', descripcion: 'Capacidad de expansión propia de cada metal.' },
      { icono: '⚡', nombre: 'Vibración Atómica', descripcion: 'Origen microscópico de la expansión.' }
    ],
    mision: [
      'Mide la barra de metal con el micrómetro.',
      'Inyecta vapor de agua a 100°C.',
      'Observa el desplazamiento de la aguja.',
      'Registra la elongación milimétrica.',
      'Calcula el coeficiente α del material.'
    ],
    aplicaciones: [
      { area: 'Civil', ejemplo: 'Juntas de expansión en puentes y vías de tren.' },
      { area: 'Odontología', ejemplo: 'Materiales para calzas que dilatan como el diente.' },
      { area: 'Domótica', ejemplo: 'Termostatos bimetálicos mecánicos.' }
    ]
  },
  'fisica-8': {
    codigo: 'FIS-08',
    titulo: 'Ley de Ohm',
    subtitulo: 'Circuitos Eléctricos CC',
    acento: '#eab308',
    duracion: 35,
    videoUrl: 'https://youtu.be/q_BMFXFf0TU',
    bienvenida: `¡Bienvenido a la Central Eléctrica Virtual! Soy el Dr. Quantum.\n\nDominaremos el flujo de electrones. Voltaje, Corriente y Resistencia forman la trinidad de la electrónica moderna.\n\nTu misión: Verificar la relación V = I·R en una resistencia fija.`,
    conceptos: [
      { icono: '⚡', nombre: 'Voltaje (V)', descripcion: 'Presión eléctrica o diferencia de potencial.' },
      { icono: '🌊', nombre: 'Corriente (I)', descripcion: 'Flujo de electrones por unidad de tiempo.' },
      { icono: '🚧', nombre: 'Resistencia (R)', descripcion: 'Oposición al paso de la corriente.' },
      { icono: '📈', nombre: 'Gráfica Óhmica', descripcion: 'Relación lineal entre V e I.' }
    ],
    mision: [
      'Arma el circuito en serie.',
      'Varía el voltaje de la fuente paso a paso.',
      'Lee la corriente en el amperímetro.',
      'Registra los pares de datos (V, I).',
      'Calcula la resistencia promedio.'
    ],
    aplicaciones: [
      { area: 'Hogar', ejemplo: 'Funcionamiento de electrodomésticos y focos.' },
      { area: 'Hardware', ejemplo: 'Diseño de circuitos integrados y smartphones.' },
      { area: 'Seguridad', ejemplo: 'Fusibles y protección contra cortocircuitos.' }
    ]
  },
  'fisica-9': {
    codigo: 'FIS-09',
    titulo: 'Electrostática',
    subtitulo: 'Ley de Coulomb',
    acento: '#3b82f6',
    duracion: 30,
    videoUrl: 'https://youtu.be/nEPux_svXO8',
    bienvenida: `¡Bienvenido al Campo de Fuerzas Invisibles! Soy el Dr. Quantum.\n\nLas cargas eléctricas se atraen o se repelen a distancia. Veremos cómo la fuerza cae dramáticamente al alejarnos.\n\nTu misión: Calcular la fuerza neta sobre una carga central.`,
    conceptos: [
      { icono: '⚛️', nombre: 'Carga (q)', descripcion: 'Propiedad de la materia (en Coulombs).' },
      { icono: '📐', nombre: 'Ley Cuadrática Inversa', descripcion: 'La fuerza cae con el cuadrado de la distancia.' },
      { icono: '⚡', nombre: 'Campo Eléctrico', descripcion: 'Zona de influencia de una carga en el espacio.' },
      { icono: '🎯', nombre: 'Superposición', descripcion: 'Suma vectorial de fuerzas de múltiples cargas.' }
    ],
    mision: [
      'Coloca las cargas fijas en el riel.',
      'Mide la distancia entre ellas.',
      'Calcula la fuerza teórica de Coulomb.',
      'Observa el vector de fuerza resultante.',
      'Valida el valor en Newtons.'
    ],
    aplicaciones: [
      { area: 'Filtros', ejemplo: 'Precipitadores electrostáticos para limpiar aire.' },
      { area: 'Impresión', ejemplo: 'Funcionamiento de impresoras láser y fotocopiadoras.' },
      { area: 'Pintura', ejemplo: 'Pintado electrostático de autos sin desperdicio.' }
    ]
  },
  'fisica-10': {
    codigo: 'FIS-10',
    titulo: 'Motor Eléctrico',
    subtitulo: 'Inducción y Fuerza de Lorentz',
    acento: '#8b5cf6',
    duracion: 40,
    videoUrl: 'https://youtu.be/jj5WmYB4nxg',
    bienvenida: `¡Bienvenido al Taller de Electromovilidad! Soy el Dr. Quantum.\n\nConvertiremos electricidad en movimiento rotatorio. La magia sucede cuando el magnetismo empuja los electrones en movimiento.\n\nTu misión: Calibrar un motor para alcanzar las RPM objetivo.`,
    conceptos: [
      { icono: '🧲', nombre: 'Campo Magnético (B)', descripcion: 'Fuerza invisible de los imanes permanentes.' },
      { icono: '🌀', nombre: 'Torque', descripcion: 'Fuerza de giro aplicada a la bobina.' },
      { icono: '🔄', nombre: 'Conmutador', descripcion: 'Cerebro mecánico que invierte la corriente.' },
      { icono: '⚡', nombre: 'Fuerza de Lorentz', descripcion: 'Fuerza sobre una carga en un campo magnético.' }
    ],
    mision: [
      'Asegura los imanes del estator.',
      'Ajusta el voltaje de la batería.',
      'Aumenta el número de vueltas de la bobina.',
      'Mide las revoluciones por minuto (RPM).',
      'Logra el equilibrio de giro constante.'
    ],
    aplicaciones: [
      { area: 'Automotriz', ejemplo: 'Motores de autos eléctricos y drones.' },
      { area: 'Doméstico', ejemplo: 'Licuadoras, ventiladores y herramientas.' },
      { area: 'Industria', ejemplo: 'Trenes de levitación y robótica avanzada.' }
    ]
  },

  // MATEMÁTICAS (Continuación)
  'matematicas-4': {
    codigo: 'MAT-04',
    titulo: 'Teorema de Pitágoras',
    subtitulo: 'Geometría y Áreas Dinámicas',
    acento: '#10b981',
    duracion: 30,
    videoUrl: 'https://youtu.be/hYa1QOqYBao',
    bienvenida: `¡Bienvenido al Taller de Diseño Geométrico! Soy el Dr. Quantum.\n\nLa relación a² + b² = c² no es solo una fórmula; es un equilibrio físico de áreas. Verás cómo el agua de dos cuadrados llena exactamente el tercero.\n\nTu misión: Demostrar el teorema mediante la transferencia de fluidos.`,
    conceptos: [
      { icono: '📐', nombre: 'Hipotenusa', descripcion: 'Lado más largo opuesto al ángulo recto.' },
      { icono: '📏', nombre: 'Catetos', descripcion: 'Lados que forman el ángulo de 90 grados.' },
      { icono: '⬛', nombre: 'Suma de Áreas', descripcion: 'Principio fundamental del Teorema.' },
      { icono: '🔄', nombre: 'Terna Pitagórica', descripcion: 'Números enteros que cumplen la relación (3,4,5).' }
    ],
    mision: [
      'Ajusta los catetos A y B.',
      'Calcula el área de los cuadrados laterales.',
      'Vierte el contenido líquido hacia la hipotenusa.',
      'Verifica que el nivel llegue al 100%.',
      'Calcula el valor decimal de C.'
    ],
    aplicaciones: [
      { area: 'Arquitectura', ejemplo: 'Asegurar que las paredes estén a escuadra (90°).' },
      { area: 'Pantallas', ejemplo: 'Cálculo de pulgadas en monitores y TVs.' },
      { area: 'Mapa', ejemplo: 'Cálculo de distancias en línea recta entre coordenadas.' }
    ],
    retos: [
      'Diseño de Rampa: Calcula la hipotenusa necesaria para una rampa de 2m de altura.',
      'Navegación Perdida: Encuentra la distancia directa entre dos barcos usando sus coordenadas.',
      'Terna Maestra: Encuentra una combinación de catetos que resulte en un valor entero de C.',
    ]
  },
  'matematicas-5': {
    codigo: 'MAT-05',
    titulo: 'Círculo Trigonométrico',
    subtitulo: 'Funciones Circulares y Ondas',
    acento: '#6366f1',
    duracion: 40,
    videoUrl: 'https://youtu.be/AWhxHGpZfb0',
    bienvenida: `¡Bienvenido al Osciloscopio Geométrico! Soy el Dr. Quantum.\n\nTodo lo que gira se convierte en una onda. Entenderemos el Seno y el Coseno como las sombras de un punto que da vueltas.\n\nTu misión: Sincronizar la rotación para capturar ángulos específicos.`,
    conceptos: [
      { icono: '⭕', nombre: 'Círculo Unitario', descripcion: 'Círculo de radio 1 centrado en el origen.' },
      { icono: '↕️', nombre: 'Seno (y)', descripcion: 'Altura del punto en el círculo.' },
      { icono: '↔️', nombre: 'Coseno (x)', descripcion: 'Desplazamiento horizontal del punto.' },
      { icono: '🌊', nombre: 'Onda Sinusoidal', descripcion: 'Proyección del giro a lo largo del tiempo.' }
    ],
    mision: [
      'Activa el giro automático del vector.',
      'Observa cómo se dibuja la onda en la pantalla.',
      'Identifica los puntos de amplitud máxima (90°).',
      'Detén el vector en el ángulo solicitado.',
      'Valida el valor de Seno y Coseno.'
    ],
    aplicaciones: [
      { area: 'Música', ejemplo: 'Síntesis de sonido y ondas de audio.' },
      { area: 'Electricidad', ejemplo: 'Corriente Alterna (AC) en nuestras casas.' },
      { area: 'Clima', ejemplo: 'Modelado de mareas y ciclos estacionales.' }
    ]
  },
  'matematicas-6': {
    codigo: 'MAT-06',
    titulo: 'Transformaciones Geométricas',
    subtitulo: 'Isometrías y Homotecias',
    acento: '#f43f5e',
    duracion: 35,
    videoUrl: 'https://youtu.be/vYE9qp-1PVw',
    bienvenida: `¡Bienvenido al Centro de Acoplamiento Espacial! Soy el Dr. Quantum.\n\nLas matemáticas nos permiten mover, rotar y escalar objetos con precisión absoluta. Usarás matrices para navegar una sonda.\n\nTu misión: Alinear la sonda con la plataforma fantasma.',`,
    conceptos: [
      { icono: '↔️', nombre: 'Traslación', descripcion: 'Desplazamiento sin rotación ni cambio de tamaño.' },
      { icono: '🔄', nombre: 'Rotación', descripcion: 'Giro alrededor de un punto de origen.' },
      { icono: '🔍', nombre: 'Escala', descripcion: 'Cambio de tamaño manteniendo la proporción.' },
      { icono: '📐', nombre: 'Vectores', descripcion: 'Dirección y magnitud del movimiento.' }
    ],
    mision: [
      'Identifica la posición de la plataforma objetivo.',
      'Aplica el factor de escala correcto.',
      'Rota la sonda para que coincida en ángulo.',
      'Traslada la sonda en los ejes X e Y.',
      'Confirma el acoplamiento perfecto.'
    ],
    aplicaciones: [
      { area: 'CGI', ejemplo: 'Animación de personajes en películas y juegos.' },
      { area: 'Robótica', ejemplo: 'Movimiento de brazos mecánicos industriales.' },
      { area: 'Diseño', ejemplo: 'Software CAD y diseño vectorial (Illustrator).' }
    ]
  },
  'matematicas-7': {
    codigo: 'MAT-07',
    titulo: 'Ley de Snell',
    subtitulo: 'Trigonometría y Óptica',
    acento: '#06b6d4',
    duracion: 35,
    videoUrl: 'https://youtu.be/8Sc6BTbc9cU',
    bienvenida: `¡Bienvenido al Laboratorio de Refracción! Soy el Dr. Quantum.\n\nLa luz se dobla al cambiar de medio. Usaremos el Seno para calcular por qué vemos las cosas deformadas bajo el agua.\n\nTu misión: Identificar un cristal desconocido midiendo su ángulo de refracción.`,
    conceptos: [
      { icono: '🔦', nombre: 'Incidencia', descripcion: 'Ángulo del rayo de luz al entrar.' },
      { icono: '📐', nombre: 'Refracción', descripcion: 'Ángulo del rayo al pasar al segundo medio.' },
      { icono: '💎', nombre: 'Índice n', descripcion: 'Resistencia del material al paso de la luz.' },
      { icono: '🔄', nombre: 'Reflexión Total', descripcion: 'Cuando la luz no logra salir del material.' }
    ],
    mision: [
      'Dispara el láser a través del cristal.',
      'Mide el ángulo de entrada con el transportador.',
      'Mide el ángulo de salida (refractado).',
      'Aplica la Ley de Snell: n1 sinθ1 = n2 sinθ2.',
      'Busca el índice n en la tabla de materiales.'
    ],
    aplicaciones: [
      { area: 'Óptica', ejemplo: 'Diseño de lentes para cámaras y anteojos.' },
      { area: 'Internet', ejemplo: 'Transmisión de datos por Fibra Óptica.' },
      { area: 'Gemología', ejemplo: 'Identificación de diamantes y piedras preciosas.' }
    ]
  },
  'matematicas-8': {
    codigo: 'MAT-08',
    titulo: 'La Derivada: Propulsión Crítica',
    subtitulo: 'Razón de Cambio y Velocidad Instantánea',
    acento: '#ef4444',
    duracion: 40,
    videoUrl: 'https://youtu.be/pVSfAX2BG5E',
    bienvenida: `¡Bienvenido al Centro de Control de Lanzamientos! Soy el Dr. Quantum. Hoy usaremos el poder del Cálculo Diferencial para evitar un desastre aeroespacial.\n\nLa derivada no es solo una fórmula; es la velocidad instantánea de un objeto. Si conocemos la función de posición s(t) de nuestro cohete, su derivada s'(t) nos dirá exactamente a qué velocidad viaja en cada microsegundo.\n\nTu misión: Analizar la telemetría del despegue, identificar el punto de máxima velocidad y calcular la aceleración para estabilizar el reactor.`,
    conceptos: [
      { icono: '🚀', nombre: 'Velocidad Instantánea', descripcion: 'La derivada de la posición respecto al tiempo: v(t) = ds/dt.' },
      { icono: '🔥', nombre: 'Aceleración', descripcion: 'La segunda derivada de la posición: a(t) = dv/dt.' },
      { icono: '📈', nombre: 'Pendiente Tangente', descripcion: 'Representación geométrica de la derivada en un punto de la trayectoria.' },
      { icono: '🎯', nombre: 'Optimización', descripcion: 'Búsqueda de máximos de empuje y mínimos de consumo de combustible.' }
    ],
    mision: [
      'Inicia la SECUENCIA DE DESPEGUE en el simulador.',
      'Activa el ESCÁNER TANGENTE para visualizar la velocidad en tiempo real.',
      'Identifica el instante exacto donde la pendiente es MÁXIMA.',
      'Calcula la derivada analítica de la función de telemetría.',
      'Valida el resultado para estabilizar la órbita del cohete.',
    ],
    aplicaciones: [
      { area: 'Finanzas', ejemplo: 'Optimización de ganancias y reducción de costos.' },
      { area: 'Física', ejemplo: 'Cálculo de velocidad y aceleración instantánea.' },
      { area: 'IA', ejemplo: 'Entrenamiento de redes neuronales (Gradiente Descendente).' }
    ]
  },
  'matematicas-9': {
    codigo: 'MAT-09',
    titulo: 'Sumas de Riemann',
    subtitulo: 'Cálculo Integral y Áreas Curvas',
    acento: '#8b5cf6',
    duracion: 40,
    videoUrl: 'https://youtu.be/ntOBoqrNb6E',
    bienvenida: `¡Bienvenido al Taller de Integración Numérica! Soy el Dr. Quantum.\n\n¿Cómo medimos el área de algo que no tiene bordes rectos? Lo dividiremos en miles de pedazos diminutos.\n\nTu misión: Aproximar el área bajo la curva con error menor al 1%.`,
    conceptos: [
      { icono: '📊', nombre: 'Rectángulos', descripcion: 'Subdivisiones del área bajo la curva.' },
      { icono: '🔢', nombre: 'Resolución (n)', descripcion: 'Número de divisiones; a mayor n, mayor precisión.' },
      { icono: '📐', nombre: 'Método Izq/Der', descripcion: 'Diferentes formas de ubicar el rectángulo.' },
      { icono: '♾️', nombre: 'Integral', descripcion: 'El límite de la suma cuando n tiende a infinito.' }
    ],
    mision: [
      'Define el rango de la función (a, b).',
      'Inicia con 4 rectángulos para ver el error visual.',
      'Aumenta la resolución progresivamente.',
      'Observa cómo el área "Suma" se acerca a la "Real".',
      'Logra la precisión requerida para validar.'
    ],
    aplicaciones: [
      { area: 'Ingeniería', ejemplo: 'Cálculo de volúmenes de tanques irregulares.' },
      { area: 'Estadística', ejemplo: 'Cálculo de probabilidades en curvas de Gauss.' },
      { area: 'Medicina', ejemplo: 'Medición del área de flujo sanguíneo en arterias.' }
    ]
  },
  'matematicas-10': {
    codigo: 'MAT-10',
    titulo: 'Máquina de Galton',
    subtitulo: 'Probabilidad y Estadística',
    acento: '#f59e0b',
    duracion: 35,
    videoUrl: 'https://youtu.be/mk1npkgh0ts',
    bienvenida: `¡Bienvenido al Casino de la Probabilidad! Soy el Dr. Quantum.\n\nVerás cómo del caos aleatorio surge un orden matemático perfecto. Cada rebote es una moneda al aire.\n\nTu misión: Comprobar el Teorema del Límite Central.',`,
    conceptos: [
      { icono: '🎲', nombre: 'Aleatoriedad', descripcion: 'Sucesos individuales impredecibles.' },
      { icono: '📈', nombre: 'Distribución Normal', descripcion: 'La famosa Campana de Gauss que rige la naturaleza.' },
      { icono: '🔢', nombre: 'Probabilidad (p)', descripcion: 'Chance de rebotar a la derecha o izquierda.' },
      { icono: '📊', nombre: 'Histograma', descripcion: 'Gráfico de barras que muestra la frecuencia real.' }
    ],
    mision: [
      'Inicia la lluvia de esferas.',
      'Observa cómo se acumulan en la base.',
      'Ajusta el sesgo para mover la media.',
      'Superpón la curva teórica sobre los datos.',
      'Valida cuando la muestra sea estadísticamente significativa.'
    ],
    aplicaciones: [
      { area: 'Genética', ejemplo: 'Distribución de rasgos físicos en una población.' },
      { area: 'Seguros', ejemplo: 'Cálculo de riesgos y esperanza de vida.' },
      { area: 'Calidad', ejemplo: 'Control de procesos en fábricas masivas.' }
    ]
  },

  // BIOLOGÍA
  'biologia-1': {
    codigo: 'BIO-01',
    titulo: 'Microscopio Virtual',
    subtitulo: 'Límites de Resolución y Citología',
    acento: '#10b981',
    duracion: 30,
    videoUrl: 'https://youtu.be/1elp96ecPGY',
    bienvenida: `¡Bienvenido al Laboratorio de Óptica! Soy el Dr. Quantum. Hoy dominaremos la física de la luz para ver lo invisible.\n\nEn biología, hacer zoom no sirve de nada si pierdes la resolución. Aprenderás por qué el Límite de Abbe es la ley máxima.\n\nTu misión: Configurar el microscopio para ver orgánulos celulares.`,
    conceptos: [
      { icono: '🔬', nombre: 'Resolución', descripcion: 'Distancia mínima para ver dos puntos separados.' },
      { icono: '👁️', nombre: 'Apertura (NA)', descripcion: 'Capacidad del lente para captar luz.' },
      { icono: '🎯', nombre: 'Magnificación', descripcion: 'Aumento total (Ocular x Objetivo).' },
      { icono: '⚙️', nombre: 'Focales', descripcion: 'Tornillos Macro y Micro para ajuste de nitidez.' }
    ],
    mision: [
      'Inicia con 4x para localizar la muestra.',
      'Pasa a 40x y usa solo el tornillo micrométrico.',
      'Calcula la magnificación total.',
      'Aplica la fórmula de resolución de Abbe.',
      'Captura la micrografía validada.'
    ],
    aplicaciones: [
      { area: 'Oncología', ejemplo: 'Detección de células cancerígenas en tejidos.' },
      { area: 'Forense', ejemplo: 'Identificación de bacterias en escenas del crimen.' },
      { area: 'Botánica', ejemplo: 'Estudio de estomas y cloroplastos en hojas.' }
    ]
  },
  'biologia-2': {
    codigo: 'BIO-02',
    titulo: 'Transporte Celular',
    subtitulo: 'Ósmosis y Tonicidad',
    acento: '#3b82f6',
    duracion: 30,
    videoUrl: 'https://youtu.be/_NCd2u1iMq4',
    bienvenida: `¡Bienvenido al Centro de Homeostasis Celular! Soy el Dr. Quantum.\n\nLas células son bolsas de agua que luchan por no explotar o secarse. Veremos cómo el soluto dicta el destino de la vida.\n\nTu misión: Alcanzar el equilibrio isotónico de un eritrocito.`,
    conceptos: [
      { icono: '💧', nombre: 'Ósmosis', descripcion: 'Movimiento de agua hacia mayor concentración de sal.' },
      { icono: '⚖️', nombre: 'Isotonía', descripcion: 'Estado de equilibrio donde la célula mantiene su forma.' },
      { icono: '💥', nombre: 'Lisis', descripcion: 'Ruptura celular por exceso de agua (medio hipotónico).' },
      { icono: '🍂', nombre: 'Plasmólisis', descripcion: 'Deshidratación celular en medios hipertónicos.' }
    ],
    mision: [
      'Selecciona el modelo de célula animal.',
      'Aumenta la salinidad del medio externo.',
      'Observa la deformación de la membrana.',
      'Ajusta la concentración a 0.9% NaCl.',
      'Valida el estado de salud celular.'
    ],
    aplicaciones: [
      { area: 'Medicina', ejemplo: 'Uso de soluciones salinas en hidratación.' },
      { area: 'Agricultura', ejemplo: 'Efecto de la salinidad del suelo en los cultivos.' },
      { area: 'Alimentos', ejemplo: 'Conservación de carnes mediante salado (deshidratación).' }
    ]
  },
  'biologia-3': {
    codigo: 'BIO-03',
    titulo: 'Síntesis de Proteínas',
    subtitulo: 'Dogma Central de la Biología',
    acento: '#8b5cf6',
    duracion: 35,
    videoUrl: 'https://youtu.be/QlBaQUJ0ddE',
    bienvenida: `¡Bienvenido a la Fábrica de la Vida! Soy el Dr. Quantum.\n\nTraduciremos el código secreto del ADN en máquinas moleculares llamadas proteínas. El lenguaje de la vida tiene solo 4 letras.\n\nTu misión: Ensamblar una proteína completa sin mutaciones.`,
    conceptos: [
      { icono: '🧬', nombre: 'Transcripción', descripcion: 'Copiado de ADN a ARNm en el núcleo.' },
      { icono: '🏗️', nombre: 'Traducción', descripcion: 'Ensamblaje de aminoácidos en el ribosoma.' },
      { icono: '🔢', nombre: 'Codón', descripcion: 'Trío de letras que codifica un aminoácido.' },
      { icono: '🛑', nombre: 'Codón STOP', descripcion: 'Señal que indica el final de la proteína.' }
    ],
    mision: [
      'Sincroniza la cadena de ADN con el ARN mensajero.',
      'Traslada el ARNm fuera del núcleo.',
      'Acopla los ARN de transferencia (tRNA).',
      'Sigue la secuencia de codones con precisión.',
      'Libera la proteína terminada.'
    ],
    aplicaciones: [
      { area: 'Biotecnología', ejemplo: 'Producción de insulina humana en bacterias.' },
      { area: 'Genética', ejemplo: 'Estudio de enfermedades hereditarias.' },
      { area: 'Vacunas', ejemplo: 'Desarrollo de vacunas de ARNm (como COVID-19).' }
    ]
  },
  'biologia-4': {
    codigo: 'BIO-04',
    titulo: 'Fotosíntesis',
    subtitulo: 'Metabolismo Vegetal y Fase Clara',
    acento: '#10b981',
    duracion: 35,
    videoUrl: 'https://youtu.be/dSoFC4PyGOA',
    bienvenida: `¡Bienvenido al Reactor Cuántico Vegetal! Soy el Dr. Quantum.\n\nLas plantas roban energía al Sol para construir el mundo. Veremos cómo la luz rompe el agua para darnos oxígeno.\n\nTu misión: Optimizar la producción de O2 variando la longitud de onda.`,
    conceptos: [
      { icono: '☀️', nombre: 'Fotólisis', descripcion: 'Ruptura del agua usando fotones de luz.' },
      { icono: '🌈', nombre: 'Espectro de Acción', descripcion: 'Colores de luz que la planta aprovecha mejor.' },
      { icono: '🍃', nombre: 'Clorofila', descripcion: 'Pigmento encargado de captar la energía lumínica.' },
      { icono: '🔋', nombre: 'ATP y NADPH', descripcion: 'Monedas de energía producidas en la fase clara.' }
    ],
    mision: [
      'Coloca la planta de Elodea en el tubo.',
      'Varía el color de la lámpara (Rojo, Azul, Verde).',
      'Mide la tasa de burbujeo de oxígeno.',
      'Calcula la eficiencia para el color Verde (Pista: es baja).',
      'Alcanza los 50ml de O2 producidos.'
    ],
    aplicaciones: [
      { area: 'Ecología', ejemplo: 'Producción de oxígeno global en los océanos.' },
      { area: 'Hidroponía', ejemplo: 'Uso de luces LED especiales para cultivos de interior.' },
      { area: 'Cambio Climático', ejemplo: 'Secuestro de CO2 atmosférico por bosques.' }
    ]
  },
  'biologia-5': {
    codigo: 'BIO-05',
    titulo: 'Leyes de Mendel',
    subtitulo: 'Genética Clásica y Herencia',
    acento: '#f43f5e',
    duracion: 35,
    videoUrl: 'https://youtu.be/uV5Xtnoi_D8',
    bienvenida: `¡Bienvenido al Invernadero de Genética! Soy el Dr. Quantum.\n\nDescubriremos las reglas de la lotería biológica. Veremos por qué te pareces a tus abuelos pero no eres idéntico a tus padres.\n\nTu misión: Validar la proporción 9:3:3:1 en un cruce dihíbrido.`,
    conceptos: [
      { icono: '🧬', nombre: 'Alelo', descripcion: 'Variante de un gen (Dominante o Recesivo).' },
      { icono: '🔲', nombre: 'Cuadro de Punnett', descripcion: 'Mapa de probabilidades de descendencia.' },
      { icono: '🌸', nombre: 'Fenotipo', descripcion: 'Rasgos físicos observables (Color, Forma).' },
      { icono: '🔢', nombre: 'Genotipo', descripcion: 'La información oculta en el ADN (AaBb).' }
    ],
    mision: [
      'Cruza plantas con semillas Amarillas/Lisas vs Verdes/Rugosas.',
      'Genera una población de 1000 individuos.',
      'Cuenta cuántos individuos de cada tipo nacieron.',
      'Compara tus datos reales con la teoría de Mendel.',
      'Valida la segregación independiente de alelos.'
    ],
    aplicaciones: [
      { area: 'Agronomía', ejemplo: 'Creación de variedades de plantas resistentes.' },
      { area: 'Veterinaria', ejemplo: 'Cría selectiva de animales de raza.' },
      { area: 'Medicina', ejemplo: 'Consejería genética para futuros padres.' }
    ]
  },
  'biologia-6': {
    codigo: 'BIO-06',
    titulo: 'Selección Natural',
    subtitulo: 'Evolución y Adaptación',
    acento: '#854d0e',
    duracion: 30,
    videoUrl: 'https://youtu.be/HYn1W16L8wU',
    bienvenida: `¡Bienvenido a la Arena de Supervivencia! Soy el Dr. Quantum.\n\nSolo el más apto sobrevive. Serás el depredador en un mundo cambiante para ver cómo la evolución moldea la vida.\n\nTu misión: Observar el cambio de color de una población de polillas.`,
    conceptos: [
      { icono: '🦅', nombre: 'Presión Selectiva', descripcion: 'Factor ambiental que decide quién vive.' },
      { icono: '🌫️', nombre: 'Mimetismo', descripcion: 'Capacidad de esconderse en el entorno.' },
      { icono: '📈', nombre: 'Frecuencia Alélica', descripcion: 'Proporción de rasgos en la población total.' },
      { icono: '🌳', nombre: 'Adaptación', descripcion: 'Rasgo que da ventaja de supervivencia.' }
    ],
    mision: [
      'Inicia en un bosque limpio con polillas blancas.',
      'Cambia el ambiente a industrial (hollín negro).',
      'Actúa como el ave cazadora por 30 segundos.',
      'Analiza la gráfica de población tras 5 generaciones.',
      'Valida el predominio del rasgo oscuro.'
    ],
    aplicaciones: [
      { area: 'Salud', ejemplo: 'Resistencia de las bacterias a los antibióticos.' },
      { area: 'Conservación', ejemplo: 'Protección de especies en peligro.' },
      { area: 'Algoritmos', ejemplo: 'Programación genética inspirada en la evolución.' }
    ]
  },
  'biologia-7': {
    codigo: 'BIO-07',
    titulo: 'Sistema Nervioso',
    subtitulo: 'Neurofisiología y Arco Reflejo',
    acento: '#f59e0b',
    duracion: 35,
    videoUrl: 'https://youtu.be/EJKf6BCdPGY',
    bienvenida: `¡Bienvenido al Centro de Control Neuronal! Soy el Dr. Quantum.\n\nLos impulsos viajan a la velocidad del rayo, pero requieren de cables aislados llamados mielina. Analizaremos tu velocidad de respuesta.\n\nTu misión: Evaluar el reflejo rotuliano bajo diferentes condiciones.`,
    conceptos: [
      { icono: '⚡', nombre: 'Potencial de Acción', descripcion: 'Impulso eléctrico que viaja por el axón.' },
      { icono: '🛡️', nombre: 'Mielina', descripcion: 'Aislante que acelera la señal nerviosa.' },
      { icono: '🦵', nombre: 'Arco Reflejo', descripcion: 'Respuesta automática que no pasa por el cerebro.' },
      { icono: '🧠', nombre: 'Sinapsis', descripcion: 'Conexión química entre dos neuronas.' }
    ],
    mision: [
      'Aplica un estímulo con el martillo en el tendón.',
      'Mide el tiempo de respuesta en milisegundos.',
      'Reduce la integridad de la mielina al 30%.',
      'Observa el retraso en la contracción muscular.',
      'Valida el diagnóstico de conducción nerviosa.'
    ],
    aplicaciones: [
      { area: 'Neurología', ejemplo: 'Diagnóstico de Esclerosis Múltiple.' },
      { area: 'Deportes', ejemplo: 'Entrenamiento de tiempos de reacción en atletas.' },
      { area: 'Ergonomía', ejemplo: 'Diseño de interfaces seguras para conductores.' }
    ]
  },
  'biologia-8': {
    codigo: 'BIO-08',
    titulo: 'Electrocardiograma',
    subtitulo: 'Fisiología Cardiovascular',
    acento: '#ef4444',
    duracion: 35,
    videoUrl: 'https://youtu.be/jKbnyd23BY0',
    bienvenida: `¡Bienvenido a la Clínica de Cardiología! Soy el Dr. Quantum.\n\nEscucharemos el ritmo de la vida. Cada latido es una coreografía eléctrica perfecta entre el nodo sinusal y los ventrículos.\n\nTu misión: Sincronizar el ECG de un paciente en esfuerzo.`,
    conceptos: [
      { icono: '❤️', nombre: 'Ciclo Cardíaco', descripcion: 'Sístole (contracción) y Diástole (relajación).' },
      { icono: '📈', nombre: 'Onda P-QRS-T', descripcion: 'Firma eléctrica de cada parte del latido.' },
      { icono: '💓', nombre: 'BPM', descripcion: 'Latidos por minuto (Frecuencia cardíaca).' },
      { icono: '⚡', nombre: 'Nodo SA', descripcion: 'El marcapasos natural del corazón.' }
    ],
    mision: [
      'Conecta los electrodos al paciente.',
      'Inicia la prueba de esfuerzo en la caminadora.',
      'Modula la intensidad para alcanzar 140 BPM.',
      'Identifica la onda QRS en el monitor.',
      'Registra la recuperación cardíaca exitosa.'
    ],
    aplicaciones: [
      { area: 'Medicina', ejemplo: 'Detección de arritmias y soplos.' },
      { area: 'Fitness', ejemplo: 'Monitoreo de rendimiento en relojes inteligentes.' },
      { area: 'Urgencias', ejemplo: 'Uso de desfibriladores automáticos (DEA).' }
    ]
  },
  'biologia-9': {
    codigo: 'BIO-09',
    titulo: 'Sistema Digestivo',
    subtitulo: 'Catálisis Enzimática y pH',
    acento: '#ea580c',
    duracion: 35,
    videoUrl: 'https://youtu.be/GNChoscsc4A',
    bienvenida: `¡Bienvenido al Laboratorio de Bioquímica Digestiva! Soy el Dr. Quantum.\n\nSomos lo que digerimos. Veremos cómo las enzimas rompen las proteínas solo si el pH es el adecuado.\n\nTu misión: Digerir una muestra de carne optimizando el ambiente estomacal.`,
    conceptos: [
      { icono: '🔑', nombre: 'Enzima', descripcion: 'Llave biológica que acelera las reacciones.' },
      { icono: '🧪', nombre: 'pH Gástrico', descripcion: 'Nivel de acidez necesario para activar enzimas.' },
      { icono: '🥩', nombre: 'Sustrato', descripcion: 'Materia que la enzima debe romper (ej: Proteína).' },
      { icono: '🔥', nombre: 'Desnaturalización', descripcion: 'Cuando el calor o pH incorrecto destruyen la enzima.' }
    ],
    mision: [
      'Inyecta Pepsina en el simulador.',
      'Baja el pH a 2.0 (ambiente ácido).',
      'Observa la ruptura de las cadenas de aminoácidos.',
      'Intenta digerir a pH 7.0 y nota el fallo.',
      'Valida la absorción de nutrientes en el intestino.'
    ],
    aplicaciones: [
      { area: 'Industria', ejemplo: 'Uso de enzimas en detergentes y lavado de telas.' },
      { area: 'Medicina', ejemplo: 'Tratamiento de insuficiencias pancreáticas.' }
    ]
  },
  'biologia-10': {
    codigo: 'BIO-10',
    titulo: 'Dinámica de Poblaciones',
    subtitulo: 'Ecología y Modelo Lotka-Volterra',
    acento: '#15803d',
    duracion: 40,
    videoUrl: 'https://youtu.be/vxCiT_f0h-E',
    bienvenida: `¡Bienvenido al Observatorio de Ecosistemas! Soy el Dr. Quantum.\n\nLa vida es un equilibrio frágil entre presas y depredadores. Veremos cómo el caos se convierte en ciclos eternos.\n\nTu misión: Mantener el equilibrio del bosque por 50 años virtuales.`,
    conceptos: [
      { icono: '🐰', nombre: 'Capacidad de Carga', descripcion: 'Población máxima que el ambiente soporta.' },
      { icono: '🐺', nombre: 'Depredación', descripcion: 'Control natural de la población de presas.' },
      { icono: '🔄', nombre: 'Ciclos de Población', descripcion: 'Oscilaciones naturales de crecimiento y caída.' },
      { icono: '📉', nombre: 'Extinción', descripcion: 'Peligro cuando la población llega a cero.' }
    ],
    mision: [
      'Inicia la simulación con 100 conejos y 10 lobos.',
      'Ajusta la tasa de reproducción de las presas.',
      'Observa el aumento de depredadores ante el festín.',
      'Evita que los lobos se coman a todos los conejos.',
      'Estabiliza las ondas de población.'
    ],
    aplicaciones: [
      { area: 'Conservación', ejemplo: 'Reintroducción de lobos en parques nacionales.' },
      { area: 'Economía', ejemplo: 'Modelado de mercados y competencia de empresas.' },
      { area: 'Salud', ejemplo: 'Propagación de virus en una población (modelos SIR).' }
    ]
  },
};
