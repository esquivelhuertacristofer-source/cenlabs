export const definitions=[
  {
    "id": 167,
    "slug": "reductor-armonico-robot",
    "title": "Reductor de robot",
    "longTitle": "Reductor armónico: deformar una corona para multiplicar el par",
    "intro": "Descubre cómo una pieza flexible convierte muchas vueltas del motor en un movimiento lento y potente.",
    "explore": "El generador de onda deforma la copa dentada. Su diferencia de dos dientes con la corona hace retroceder lentamente la salida.",
    "controls": [
      {
        "id": "rpm",
        "label": "Giro del motor",
        "min": 60,
        "max": 240,
        "step": 5,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "torque",
        "label": "Par del motor",
        "min": 0.5,
        "max": 6,
        "step": 0.1,
        "unit": "N·m",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Giro de salida",
        "key": "rpmOut",
        "unit": "rpm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Par de salida",
        "key": "torqueOut",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Potencia de entrada",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Calor de pérdidas",
        "key": "heat",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Obtén 0,8–1,2 rpm de salida y al menos 180 N·m sin superar 10 W de pérdidas.",
    "caption": "Cámara lenta ×1/20 · dientes y deformación esquemáticos · 160/162 dientes",
    "timeScale": 0.05,
    "signals": "entrada / salida: senos de sus ángulos",
    "equations": "ωs/ωe = (Zf−Zc)/Zf = −2/160 = −1/80. Ts = 80 η Te; Pe = Te ωe; calor = (1−η) Pe. Rendimiento didáctico constante η = 0,85. Los 160 dientes flexibles y 162 rígidos están representados individualmente. La copa adopta una elipse de amplitud impuesta; su deformación no es un cálculo de elasticidad.",
    "limits": "Sin deformación bajo carga, fatiga, contacto de dientes, holgura, par máximo de catálogo ni FEM. El perfil visual del diente es esquemático, no una involuta de fabricación.",
    "source": "https://www.hds.co.jp/english/products/hd_theory/",
    "sourceName": "Harmonic Drive Systems, principio de funcionamiento",
    "quiz": "¿Por qué la salida gira mucho más despacio?",
    "answers": [
      "Por la pequeña diferencia de dientes entre las dos coronas.",
      "Porque la copa pierde la mayoría de sus dientes.",
      "Porque no existe transmisión de par.",
      "Porque el motor cambia de sentido en cada vuelta."
    ],
    "faults": [
      [
        "Poco par de entrada",
        "La velocidad de salida es adecuada, pero la carga exige más par.",
        "La reducción multiplica el par disponible, pero no crea potencia."
      ],
      [
        "Motor demasiado rápido",
        "La herramienta entrega par suficiente, pero supera la velocidad prevista.",
        "Reducir el giro de entrada reduce el giro de salida en la misma proporción."
      ],
      [
        "Pérdidas excesivas",
        "Aumentan a la vez el giro de entrada, el par y el calor calculado.",
        "Las pérdidas crecen con la potencia de entrada en este modelo."
      ]
    ],
    "eyebrow": "Mecanismos y automatización",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Descubre cómo una pieza flexible convierte muchas vueltas del motor en un movimiento lento y potente.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "El generador de onda deforma la copa dentada. Su diferencia de dos dientes con la corona hace retroceder lentamente la salida.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Obtén 0,8–1,2 rpm de salida y al menos 180 N·m sin superar 10 W de pérdidas. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 168,
    "slug": "husillo-bolas-eje-lineal",
    "title": "Eje de husillo de bolas",
    "longTitle": "Husillo de bolas: avance, par y velocidad crítica de un eje",
    "intro": "Convierte el giro de un motor en avance y elige un paso que mueva la carga sin forzar el eje.",
    "explore": "Un paso mayor avanza más por vuelta, pero necesita más par para empujar la misma carga. Un eje largo limita el giro admisible.",
    "controls": [
      {
        "id": "lead",
        "label": "Paso del husillo",
        "min": 5,
        "max": 20,
        "step": 1,
        "unit": "mm/vuelta",
        "decimals": 0
      },
      {
        "id": "rpm",
        "label": "Giro máximo",
        "min": 300,
        "max": 3000,
        "step": 50,
        "unit": "rpm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Avance instantáneo",
        "key": "v",
        "unit": "m/s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Par para empujar",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Giro crítico ideal",
        "key": "critical",
        "unit": "rpm",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Avance máximo",
        "key": "peak",
        "unit": "m/s",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Consigue 0,12–0,18 m/s de avance máximo, par ≤5,5 N·m y giro ≤80 % del crítico.",
    "caption": "Tiempo real · carrera sinusoidal de 400 mm · geometría ampliada ×4",
    "timeScale": 1,
    "signals": "posición / velocidad, normalizadas",
    "equations": "vmax = nmax p/60; T = Fp/(2πη), con F=3500 N y η=0,90. La carrera es x = 0,2[1−cos(ωt)] m, ω = vmax/0,2; θ = 2πx/p. Viga simplemente apoyada: ncr = 30π/L² √(EI/ρA); d=16 mm, L=1,2 m, E=210 GPa, ρ=7850 kg/m³. El límite elegido es 0,8 ncr. El empuje es cuasiestático y se informa su módulo; no es par de aceleración.",
    "limits": "Sin precarga, rozamiento variable, rigidez de apoyos reales, resonancia acoplada, inercia del carro, frenado, error de paso o recirculación dinámica de bolas. Las bolas visibles sólo representan la construcción de la tuerca.",
    "source": "https://www.thk.com/us/en/products/ball_screw/selection/0006/",
    "sourceName": "THK, selección de husillos y carga axial",
    "quiz": "¿Qué cambia al aumentar el paso manteniendo el mismo giro?",
    "answers": [
      "Aumentan el avance y el par necesario para el mismo empuje.",
      "Disminuye siempre el par y aumenta la fuerza gratis.",
      "El eje deja de tener velocidad crítica.",
      "El carro ya no depende del giro."
    ],
    "faults": [
      [
        "Paso excesivo",
        "El avance aumenta, pero el par calculado supera el límite del motor.",
        "El brazo equivalente de la hélice aumenta con el paso."
      ],
      [
        "Giro excesivo",
        "El par es adecuado, pero el giro solicitado rebasa el margen crítico.",
        "La velocidad crítica depende de la rigidez y la longitud del eje."
      ],
      [
        "Avance insuficiente",
        "Todos los límites mecánicos se respetan, pero la carrera resulta demasiado lenta.",
        "Debe combinarse el paso con la velocidad máxima del motor."
      ]
    ],
    "eyebrow": "Mecanismos y automatización",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Convierte el giro de un motor en avance y elige un paso que mueva la carga sin forzar el eje.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "Un paso mayor avanza más por vuelta, pero necesita más par para empujar la misma carga. Un eje largo limita el giro admisible.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Consigue 0,12–0,18 m/s de avance máximo, par ≤5,5 N·m y giro ≤80 % del crítico. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 169,
    "slug": "robot-delta-paralelo",
    "title": "Robot delta paralelo",
    "longTitle": "Robot delta: tres brazos que cooperan para mover una herramienta",
    "intro": "Haz que tres brazos lleven una pieza por una trayectoria común sin perder alcance ni exigir giros excesivos.",
    "explore": "Cada brazo debe llegar al mismo efector. Alejar la trayectoria o acercarla demasiado a la base cambia mucho las articulaciones.",
    "controls": [
      {
        "id": "radius",
        "label": "Radio de trayectoria",
        "min": 100,
        "max": 450,
        "step": 10,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "height",
        "label": "Descenso desde la base",
        "min": 500,
        "max": 1100,
        "step": 10,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Rapidez de herramienta",
        "key": "speed",
        "unit": "m/s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error de cierre",
        "key": "closure",
        "unit": "mm",
        "scale": 1000,
        "decimals": 5
      },
      {
        "label": "Altura de herramienta",
        "key": "toolY",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Ángulo de motor 1",
        "key": "joint0",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      }
    ],
    "task": "Traza un círculo de radio ≥250 mm, alcanzable entero, sin superar 2 rad/s en ningún motor.",
    "caption": "Tiempo real · una vuelta en 3 s · brazo paralelo didáctico",
    "timeScale": 1,
    "signals": "coordenadas X / Z de la herramienta, en m",
    "equations": "Tres bases a radio 0,50 m y plataforma de radio 0,12 m. Brazos superiores de 0,40 m e inferiores de 0,85 m. Para cada plano de motor: A cos q + B sin q = C, C=(|D|²+L1²−L2²)/(2L1). Se selecciona una rama fija del acos. Trayectoria x=r cos(2πt/3), z=r sin(2πt/3), y=1,5−h. Se verifica el cierre de cada lazo por distancias. Los dos tirantes de cada brazo forman un paralelogramo ideal.",
    "limits": "Sin dinámica, cargas, flexión, control de orientación, choques propios o con obstáculos. Topes didácticos −1,35≤q≤0,25 rad; el reto comprueba 121 posiciones del círculo y velocidades por diferencias de 25 ms. Un objetivo geométricamente imposible conserva la última postura y se avisa; no se promete atravesar zonas no comprobadas entre muestras.",
    "source": "https://new.abb.com/products/robotics/robots/delta-robots",
    "sourceName": "ABB Robotics, arquitectura y aplicaciones de robots delta",
    "quiz": "¿Qué debe cumplirse para alcanzar un punto con el delta?",
    "answers": [
      "Los tres lazos deben cerrar simultáneamente en una postura admitida.",
      "Basta con que llegue uno de los brazos.",
      "La plataforma puede romper un tirante para extenderse.",
      "La longitud de cada barra cambia durante el giro."
    ],
    "faults": [
      [
        "Fuera de alcance",
        "Al ampliar mucho el círculo hay sectores en los que no cierra uno de los lazos.",
        "El objetivo debe pertenecer a la intersección de los alcances de los tres brazos."
      ],
      [
        "Velocidad articular elevada",
        "La herramienta mantiene su rapidez, pero un motor cambia de ángulo muy deprisa.",
        "La relación entre velocidad de herramienta y de articulación depende de la postura."
      ],
      [
        "Trayectoria pequeña",
        "La trayectoria cierra y los motores van suaves, pero no cubre la zona de trabajo pedida.",
        "Ser alcanzable no basta para satisfacer la tarea de producción."
      ]
    ],
    "eyebrow": "Mecanismos y automatización",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Haz que tres brazos lleven una pieza por una trayectoria común sin perder alcance ni exigir giros excesivos.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "Cada brazo debe llegar al mismo efector. Alejar la trayectoria o acercarla demasiado a la base cambia mucho las articulaciones.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Traza un círculo de radio ≥250 mm, alcanzable entero, sin superar 2 rad/s en ningún motor. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 170,
    "slug": "plataforma-stewart-seis-actuadores",
    "title": "Plataforma de seis patas",
    "longTitle": "Plataforma Stewart: movimiento y reparto de carga entre seis actuadores",
    "intro": "Inclina una plataforma coordinando seis actuadores y comprueba que ninguno se queda sin recorrido ni fuerza.",
    "explore": "Las seis patas cambian de longitud a la vez. La altura y la inclinación modifican tanto el recorrido como el reparto del peso.",
    "controls": [
      {
        "id": "roll",
        "label": "Amplitud de balanceo",
        "min": 0,
        "max": 24,
        "step": 1,
        "unit": "°",
        "decimals": 0
      },
      {
        "id": "height",
        "label": "Altura central",
        "min": 650,
        "max": 1300,
        "step": 10,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Fuerza máxima actual",
        "key": "maxForce",
        "unit": "N",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Pata 1",
        "key": "leg0",
        "unit": "mm",
        "scale": 1000,
        "decimals": 0
      },
      {
        "label": "Balanceo actual",
        "key": "roll",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      },
      {
        "label": "Cabeceo actual",
        "key": "pitch",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      }
    ],
    "task": "Logra ≥8° de balanceo; durante todo el ciclo conserva patas entre 0,65–1,35 m y fuerzas ≤2200 N.",
    "caption": "Trayectoria ideal · fuerzas cuasiestáticas · carga central de 300 kg",
    "timeScale": 1,
    "signals": "longitud de patas 1 / 4 menos 1 m",
    "equations": "Brazos de anclaje en radios 0,75 y 0,50 m. li = |T+Rpi−bi|, ui = (T+Rpi−bi)/li. Cada fila del jacobiano es [ui, (Rpi)×ui]. Equilibrio JT f = [0,mg,0,0,0,0], m=300 kg. Se resuelve un sistema de seis ecuaciones con pivoteo. R=Ry(cabeceo)Rx(balanceo); el cabeceo tiene 0,6 veces la amplitud del balanceo y va desfasado un cuarto de ciclo.",
    "limits": "Sólo cinemática inversa y equilibrio estático instantáneo. Sin inercia, flexión, pandeo, choques entre patas, límites de rótulas, fricción ni control hidráulico. Las fuerzas admiten tracción y compresión. Los extremos del ciclo se revisan en 121 posiciones; no es certificación de una plataforma para personas.",
    "source": "https://math.nist.gov/MatrixMarket/data/NEP/robotics/robotics.html",
    "sourceName": "NIST, arquitectura de plataforma Stewart",
    "quiz": "¿Por qué las seis patas no soportan siempre el mismo esfuerzo?",
    "answers": [
      "Su orientación y brazo de palanca cambian con la postura.",
      "El peso desaparece cuando la plataforma se inclina.",
      "Todas deben tener siempre idéntica longitud.",
      "Cada pata soporta el peso completo por separado."
    ],
    "faults": [
      [
        "Fin de carrera",
        "Al inclinarse, una pata requiere una longitud mayor que la admitida.",
        "La trayectoria debe caber en los recorridos de todos los actuadores."
      ],
      [
        "Sobrecarga geométrica",
        "La longitud cabe, pero una pata casi horizontal requiere demasiado esfuerzo.",
        "Sólo una parte de su fuerza contribuye a sostener la carga vertical."
      ],
      [
        "Movimiento insuficiente",
        "Las patas trabajan cómodas, pero el balanceo no llega al mínimo pedido.",
        "Debe satisfacerse el movimiento solicitado además de los límites mecánicos."
      ]
    ],
    "eyebrow": "Mecanismos y automatización",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Inclina una plataforma coordinando seis actuadores y comprueba que ninguno se queda sin recorrido ni fuerza.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "Las seis patas cambian de longitud a la vez. La altura y la inclinación modifican tanto el recorrido como el reparto del peso.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Logra ≥8° de balanceo; durante todo el ciclo conserva patas entre 0,65–1,35 m y fuerzas ≤2200 N. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 171,
    "slug": "vision-cinta-clasificacion",
    "title": "Visión y cinta transportadora",
    "longTitle": "Clasificación por visión: sincronizar cámara, cinta y expulsor",
    "intro": "Sincroniza una cámara con el expulsor para apartar la pieza señalada sin frenar la producción.",
    "explore": "La cámara identifica una pieza y el expulsor actúa después de un retardo. Si cambia la velocidad de cinta, el mismo retardo deja de servir.",
    "controls": [
      {
        "id": "speed",
        "label": "Velocidad de cinta",
        "min": 200,
        "max": 1000,
        "step": 10,
        "unit": "mm/s",
        "decimals": 0
      },
      {
        "id": "delay",
        "label": "Retardo del expulsor",
        "min": 400,
        "max": 5000,
        "step": 10,
        "unit": "ms",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Error de expulsión",
        "key": "error",
        "unit": "mm",
        "scale": 1000,
        "decimals": 0
      },
      {
        "label": "Producción teórica",
        "key": "rate",
        "unit": "p/min",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Tiempo desde cámara",
        "key": "tau",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Recorrido de la pieza",
        "key": "travel",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Ajusta el disparo con error ≤45 mm y producción teórica ≥78 piezas/min.",
    "caption": "Tiempo real · cámara y expulsor separados 1,20 m · clasificación ideal",
    "timeScale": 1,
    "signals": "posición de pieza marcada / orden de expulsión",
    "equations": "Movimiento uniforme x=vt. Error del disparo e=vτ−1,20 m. Producción 60v/0,40, con paso entre piezas de 400 mm. El circuito visual es continuo de 3,2 m y tiene ocho piezas con ese mismo paso. El expulsor actúa 0,12 s y sólo desvía la pieza si |e|≤45 mm. Se representa la identificación por color, no el procesamiento real de una imagen.",
    "limits": "Sin inferencia de visión, fallos de detección, deslizamiento de cinta, variación de velocidad, encoder discreto, latencia aleatoria o dinámica de impacto. La clasificación ya está dada; se estudia la sincronización temporal. El desvío es una trayectoria cinemática impuesta, sin calcular fuerza de impacto.",
    "source": "https://docs.cognex.com/dmst_631/web/EN/DMST_QANDA/Content/Topics/idp10156055536.htm?TocPath=Inputs+%2F+Outputs%7C_____52",
    "sourceName": "Cognex, encoder y sincronización con cinta",
    "quiz": "¿Qué pasa si aumenta la velocidad sin cambiar el retardo?",
    "answers": [
      "La pieza recorre más distancia y puede pasar de largo.",
      "La cámara cambia por sí sola la distancia física.",
      "El error se mantiene siempre en cero.",
      "El expulsor necesita esperar más para la misma distancia."
    ],
    "faults": [
      [
        "Disparo temprano",
        "El expulsor sale antes de que llegue la pieza marcada.",
        "Para la velocidad actual, el retardo es demasiado corto."
      ],
      [
        "Disparo tardío",
        "La pieza marcada ya pasó cuando aparece el expulsor.",
        "El retardo resulta demasiado largo para la velocidad elegida."
      ],
      [
        "Caudal insuficiente",
        "La pieza se aparta bien, pero la producción nominal queda por debajo de la meta.",
        "Un disparo correcto también puede coexistir con una cinta demasiado lenta."
      ]
    ],
    "eyebrow": "Mecanismos y automatización",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Sincroniza una cámara con el expulsor para apartar la pieza señalada sin frenar la producción.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "La cámara identifica una pieza y el expulsor actúa después de un retardo. Si cambia la velocidad de cinta, el mismo retardo deja de servir.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Ajusta el disparo con error ≤45 mm y producción teórica ≥78 piezas/min. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 172,
    "slug": "balanceo-dinamico-dos-planos",
    "title": "Balanceo de rueda",
    "longTitle": "Balanceo dinámico: corregir un par de desequilibrio en dos planos",
    "intro": "Corrige una rueda que parece equilibrada en reposo, pero hace vibrar los apoyos cuando gira.",
    "explore": "Dos desequilibrios opuestos no dejan una fuerza neta, pero sí un par oscilante. La corrección necesita dos pesos, uno en cada plano.",
    "controls": [
      {
        "id": "mass",
        "label": "Peso en cada plano",
        "min": 0,
        "max": 80,
        "step": 1,
        "unit": "g",
        "decimals": 0
      },
      {
        "id": "angle",
        "label": "Ángulo del peso del plano A",
        "min": 0,
        "max": 360,
        "step": 2,
        "unit": "°",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Fuerza por apoyo",
        "key": "force",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Par de desequilibrio",
        "key": "couple",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Desequilibrio residual",
        "key": "residual",
        "unit": "g·mm",
        "scale": 1000000.0,
        "decimals": 0
      },
      {
        "label": "Desbalance estático",
        "key": "static",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Reduce la fuerza en cada apoyo a ≤0,7 N usando como máximo 45 g por plano.",
    "caption": "Cámara lenta ×1/50 · balanceadora a 900 rpm · flexión ampliada ×150",
    "timeScale": 0.02,
    "signals": "componentes ortogonales de la reacción, en N",
    "equations": "Caso de par puro: U1=0,006 e^(j30°) kg·m; U2=−U1, planos a ±0,12 m y apoyos a ±0,35 m. Los contrapesos a radio 0,18 m se montan opuestos entre planos. Ures = U1 + mr e^(jα). La suma estática sigue siendo cero. Par = |Ures|ω²·0,24; reacción por apoyo = par/0,70. Rigidez por apoyo 200 kN/m para ilustrar la flexión amplificada.",
    "limits": "Sólo rotor rígido con par puro y fase ideal conocida. No calcula una medición por coeficientes de influencia ni corrige un caso general con fuerza y par simultáneos. El peso del plano B se mantiene opuesto automáticamente, por la simetría del problema. La deformación es cuasiestática ilustrativa: sin resonancia de los apoyos, giroscopía ni neumático flexible.",
    "source": "https://skftechnicalsupport.zendesk.com/hc/en-us/articles/360022974074-Maintaining-Machinery-Balance-test-format-3-Word-import-via-Google-Drive",
    "sourceName": "SKF, balanceo en dos planos",
    "quiz": "¿Por qué una rueda con desbalance estático cero puede vibrar?",
    "answers": [
      "Puede quedar un par de desequilibrio entre dos planos.",
      "La ausencia de fuerza neta impide cualquier par.",
      "Los apoyos no pueden reaccionar a un par.",
      "El giro elimina la necesidad de contrapesos."
    ],
    "faults": [
      [
        "Peso insuficiente",
        "La fase de corrección es adecuada, pero queda reacción en ambos apoyos.",
        "La magnitud del vector de corrección no alcanza a cancelar el desequilibrio."
      ],
      [
        "Ángulo equivocado",
        "Al añadir peso aumenta el par oscilante en vez de disminuir.",
        "La corrección debe oponerse al vector de desequilibrio."
      ],
      [
        "Confundir balance estático",
        "La fuerza neta es cero, pero los dos apoyos reciben esfuerzos opuestos.",
        "Un par puro sólo se corrige actuando sobre dos planos separados."
      ]
    ],
    "eyebrow": "Mecánica automotriz",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Corrige una rueda que parece equilibrada en reposo, pero hace vibrar los apoyos cuando gira.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "Dos desequilibrios opuestos no dejan una fuerza neta, pero sí un par oscilante. La corrección necesita dos pesos, uno en cada plano.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Reduce la fuerza en cada apoyo a ≤0,7 N usando como máximo 45 g por plano. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 173,
    "slug": "volante-bimasa-vibracion",
    "title": "Volante bimasa",
    "longTitle": "Volante bimasa: aislar las vibraciones de torsión del motor",
    "intro": "Separa dos masas giratorias con resortes y freno para que los pulsos del motor lleguen menos a la transmisión.",
    "explore": "El giro medio sigue pasando, pero las pequeñas oscilaciones se filtran. La rigidez y el amortiguamiento determinan qué parte del pulso atraviesa el volante.",
    "controls": [
      {
        "id": "stiffness",
        "label": "Rigidez torsional",
        "min": 100,
        "max": 2000,
        "step": 25,
        "unit": "N·m/rad",
        "decimals": 0
      },
      {
        "id": "damping",
        "label": "Amortiguamiento",
        "min": 0.2,
        "max": 8,
        "step": 0.1,
        "unit": "N·m·s/rad",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Par transmitido máximo",
        "key": "amplitude",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Fracción del pulso",
        "key": "ratio",
        "unit": "%",
        "scale": 100,
        "decimals": 1
      },
      {
        "label": "Torsión máxima",
        "key": "amp",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 2
      },
      {
        "label": "Calor medio",
        "key": "heat",
        "unit": "W",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Transmite ≤22 % del pulso, con torsión ≤0,06 rad y calor medio ≤30 W.",
    "caption": "Cámara lenta ×1/100 · oscilación relativa ampliada ×8 · régimen armónico",
    "timeScale": 0.01,
    "signals": "torsión relativa ×30 / par transmitido dividido por 60 N·m",
    "equations": "J1=0,18 y J2=0,12 kg·m²; Jred=J1J2/(J1+J2)=0,072. A 850 rpm y orden 2, ω=2·850·2π/60. Jred δ″+Bδ′+Kδ=24 sin(ωt) N·m: forzamiento equivalente de un pulso de 60 N·m aplicado a la primera masa. Solución compleja exacta; par interno Kδ+Bδ′ y calor medio B(ωδamp)²/2. El giro medio se superpone a las oscilaciones, conservando su reparto inercial.",
    "limits": "Sólo pequeña oscilación lineal en régimen permanente. Sin arranque, topes, muelles de rigidez variable, fricción seca, embrague, pendulares centrífugos o variación de régimen. La pérdida media usa amortiguamiento viscoso ideal. La animación amplifica únicamente la oscilación, no el giro medio.",
    "source": "https://press.zf.com/press/en/releases/release_3283.html",
    "sourceName": "ZF, función y diagnóstico de volante bimasa",
    "quiz": "¿Por qué no conviene hacer infinitamente rígido el acoplamiento?",
    "answers": [
      "La rigidez elevada puede transmitir más del pulso de torsión.",
      "Porque la rigidez elimina el giro medio.",
      "Porque así el amortiguamiento produce energía.",
      "Porque ambas masas dejan de tener inercia."
    ],
    "faults": [
      [
        "Cercanía a resonancia",
        "La oscilación y el par transmitido aumentan mucho sin aumentar el pulso del motor.",
        "La frecuencia natural se acerca a la de excitación."
      ],
      [
        "Amortiguamiento excesivo",
        "La torsión es pequeña, pero se transmite demasiado par a través del freno viscoso.",
        "Un amortiguador también transmite esfuerzo: más freno no siempre aísla más."
      ],
      [
        "Rigidez elevada",
        "Las masas giran casi juntas y pasa demasiado pulso a la transmisión.",
        "La unión rígida impide el movimiento relativo que permite aislar."
      ]
    ],
    "eyebrow": "Mecánica automotriz",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Separa dos masas giratorias con resortes y freno para que los pulsos del motor lleguen menos a la transmisión.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "El giro medio sigue pasando, pero las pequeñas oscilaciones se filtran. La rigidez y el amortiguamiento determinan qué parte del pulso atraviesa el volante.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Transmite ≤22 % del pulso, con torsión ≤0,06 rad y calor medio ≤30 W. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 174,
    "slug": "limpiaparabrisas-cuatro-barras",
    "title": "Mecanismo de limpiaparabrisas",
    "longTitle": "Limpiaparabrisas de cuatro barras: de giro continuo a barrido",
    "intro": "Transforma el giro continuo de un motor en un barrido amplio que no se atasque durante la vuelta.",
    "explore": "La manivela da vueltas completas; la biela empuja un balancín. Las longitudes determinan cuánto barre y si aparece una mala postura de transmisión.",
    "controls": [
      {
        "id": "crank",
        "label": "Radio de manivela",
        "min": 30,
        "max": 80,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "rod",
        "label": "Longitud de biela",
        "min": 120,
        "max": 240,
        "step": 2,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Ángulo del balancín",
        "key": "rocker",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      },
      {
        "label": "Ángulo de transmisión",
        "key": "transmission",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      },
      {
        "label": "Ángulo del motor",
        "key": "motorDeg",
        "unit": "°",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Longitud fija",
        "key": "ground",
        "unit": "mm",
        "scale": 1000,
        "decimals": 0
      }
    ],
    "task": "Logra un barrido de 75–95°, con vuelta completa de motor y ángulo de transmisión ≥35°.",
    "caption": "Tiempo real · vuelta del motor en 2 s · mecanismo y parabrisas esquemáticos",
    "timeScale": 1,
    "signals": "ángulos de balancín / motor, en radianes",
    "equations": "Bancada d=0,20 m; balancín c=0,12 m. A=r[cosθ,sinθ], θ=πt. B es la intersección de un círculo de radio b centrado en A y otro de radio c centrado en [d,0]. Se conserva una rama de montaje. El ángulo de transmisión sale de cos γ=(b²+c²−|A−O2|²)/(2bc), tomando el ángulo agudo equivalente. Reto: 361 posturas por vuelta, barrido máximo menos mínimo del balancín.",
    "limits": "Sin holguras, elasticidad, fuerzas en articulaciones, roce de goma, área limpiada, lluvia ni regulación electrónica. La orientación del conjunto puede ajustarse al montar: se estudia la amplitud angular, no una homologación del barrido sobre un vidrio comercial. Si no cierran los círculos, se conserva la última postura y se avisa.",
    "source": "https://ocw.metu.edu.tr/pluginfile.php/3961/mod_resource/content/ch6/ch7/7-1.htm",
    "sourceName": "METU OpenCourseWare, mecanismo de cuatro barras",
    "quiz": "¿Qué consigue la biela con el balancín?",
    "answers": [
      "Convierte el giro completo en una oscilación angular.",
      "Obliga al balancín a girar infinitamente siempre.",
      "Cambia automáticamente la longitud de la bancada.",
      "Elimina las posturas de transmisión desfavorables."
    ],
    "faults": [
      [
        "Cierre imposible",
        "En parte de la vuelta las dos circunferencias de las articulaciones no se cruzan.",
        "Esas longitudes no permiten el montaje en toda la revolución."
      ],
      [
        "Barrido corto",
        "El motor completa vueltas sin dificultad, pero la escobilla recorre poco ángulo.",
        "Debe revisarse la relación entre manivela, biela y balancín."
      ],
      [
        "Mala transmisión",
        "El barrido cabe, pero cerca de un extremo la biela casi se alinea con el balancín.",
        "Una postura próxima a la alineación transmite mal el movimiento y el esfuerzo."
      ]
    ],
    "eyebrow": "Mecánica automotriz",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Transforma el giro continuo de un motor en un barrido amplio que no se atasque durante la vuelta.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "La manivela da vueltas completas; la biela empuja un balancín. Las longitudes determinan cuánto barre y si aparece una mala postura de transmisión.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Logra un barrido de 75–95°, con vuelta completa de motor y ángulo de transmisión ≥35°. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 175,
    "slug": "volante-inercia-almacenamiento",
    "title": "Energía en un rotor",
    "longTitle": "Volante de inercia: almacenar energía sin exceder el esfuerzo del aro",
    "intro": "Almacena energía haciendo girar un aro y equilibra capacidad, velocidad y esfuerzo del material.",
    "explore": "Un radio o giro mayor guarda más energía, pero también aumenta la tensión que tiende a abrir el aro. El motor-generador entrega un pulso y recupera la energía.",
    "controls": [
      {
        "id": "rpm",
        "label": "Giro inicial",
        "min": 6000,
        "max": 20000,
        "step": 250,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "radius",
        "label": "Radio medio del aro",
        "min": 100,
        "max": 300,
        "step": 5,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Energía almacenada",
        "key": "E",
        "unit": "kJ",
        "scale": 0.001,
        "decimals": 1
      },
      {
        "label": "Energía útil inicial",
        "key": "usable",
        "unit": "kJ",
        "scale": 0.001,
        "decimals": 1
      },
      {
        "label": "Tensión del aro inicial",
        "key": "stress",
        "unit": "MPa",
        "scale": 1e-06,
        "decimals": 0
      },
      {
        "label": "Giro actual",
        "key": "omega",
        "unit": "rpm",
        "scale": 9.549296585513721,
        "decimals": 0
      }
    ],
    "task": "Reserva ≥250 kJ útiles, tensión del aro ≤350 MPa y energía total inicial ≤650 kJ.",
    "caption": "Rotor estroboscópico ×1/500 · energía en tiempo real · aro delgado",
    "timeScale": 1,
    "signals": "energía del rotor / energía neta entregada, fracciones de la inicial",
    "equations": "Aro delgado de masa fija 25 kg: J=mr², E=Jω²/2, tensión de aro σ=ρr²ω² con ρ=7800 kg/m³. Velocidad mínima de servicio 5000 rpm. Energía útil = E0−Emin. Pulso ideal de 40 kW durante hasta 3 s, limitado por Emin; recarga desde el segundo 5 durante el mismo tiempo. ω(t)=√(2E/J), ángulo por integración analítica de la raíz. Ciclo de energía de 8 s físicos.",
    "limits": "Esfuerzo circunferencial de aro delgado; no es la fórmula de un disco macizo. Sin tensiones de montaje, defectos, fatiga, rodamientos magnéticos activos, pérdidas de vacío, pérdidas eléctricas, contención de fragmentos o FEM. La carcasa y motor son estructurales. El criterio de 350 MPa es didáctico y no certifica un rotor real. Se reinicia el ciclo de energía cada 8 s físicos.",
    "source": "https://www.sandia.gov/app/uploads/sites/163/2022/03/ESHB_Ch07_Flywheels_Bender.pdf",
    "sourceName": "Sandia, Energy Storage Handbook: Flywheels",
    "quiz": "¿Qué ocurre al duplicar el giro manteniendo el radio y la masa?",
    "answers": [
      "La energía y la tensión de aro se multiplican por cuatro.",
      "La energía sólo se duplica y la tensión no cambia.",
      "La tensión baja a la mitad.",
      "El rotor pierde toda su inercia."
    ],
    "faults": [
      [
        "Giro demasiado alto",
        "La capacidad es grande, pero el esfuerzo del aro rebasa el límite.",
        "La energía y el esfuerzo crecen con el cuadrado de la velocidad."
      ],
      [
        "Reserva insuficiente",
        "El rotor gira dentro del límite de esfuerzo, pero no entrega el pulso solicitado.",
        "La reserva útil descuenta la energía que queda a la velocidad mínima."
      ],
      [
        "Contención superada",
        "La tensión del aro se admite, pero la energía total excede el límite didáctico de la envolvente.",
        "Resistencia del rotor y energía a contener son criterios distintos."
      ]
    ],
    "eyebrow": "Mecánica automotriz",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Almacena energía haciendo girar un aro y equilibra capacidad, velocidad y esfuerzo del material.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "Un radio o giro mayor guarda más energía, pero también aumenta la tensión que tiende a abrir el aro. El motor-generador entrega un pulso y recupera la energía.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Reserva ≥250 kJ útiles, tensión del aro ≤350 MPa y energía total inicial ≤650 kJ. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 176,
    "slug": "freno-corrientes-parasitas",
    "title": "Freno magnético sin contacto",
    "longTitle": "Corrientes parásitas: frenar un disco sin tocarlo",
    "intro": "Frena un disco conductor con un campo magnético y observa cómo su energía termina en calor.",
    "explore": "El disco en movimiento induce corrientes que se oponen al giro. Al bajar la velocidad, el par se reduce: este freno no mantiene inmóvil una carga.",
    "controls": [
      {
        "id": "field",
        "label": "Campo magnético",
        "min": 100,
        "max": 1000,
        "step": 10,
        "unit": "mT",
        "decimals": 0
      },
      {
        "id": "thickness",
        "label": "Espesor del disco",
        "min": 1,
        "max": 12,
        "step": 0.5,
        "unit": "mm",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Velocidad actual",
        "key": "omega",
        "unit": "rad/s",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Par de frenado",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Tiempo hasta 10 %",
        "key": "stopTime",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Temperatura adiabática",
        "key": "temperature",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Baja al 10 % del giro en ≤6 s físicos, sin superar 32 N·m de par inicial.",
    "caption": "Rotor estroboscópico ×1/50 · frenado en tiempo real · ciclo de 12 s",
    "timeScale": 1,
    "signals": "velocidad dividida por 120 rad/s / par dividido por 32 N·m",
    "equations": "Aproximación resistiva de baja velocidad: T=cω, c=κ σ B² d A r². κ=0,02 geométrico didáctico; σ=35 MS/m, área polar total A=0,008 m², radio de actuación 0,18 m. Disco anular de aluminio ρ=2700 kg/m³, radios 0,28 y 0,04 m; Jtotal=0,32+Jdisco. ω=120 exp(−ct/J), Ecalor=J(ω0²−ω²)/2; ΔT=Ecalor/(m·900). Campo y conductividad uniformes.",
    "limits": "Coeficiente geométrico sintético, no predicción de un freno comercial. Sin reacción inductiva, efecto pelicular, saturación, dependencia térmica de conductividad, refrigeración o fuerzas laterales. El modelo lineal sólo representa el régimen resistivo; su rango no está validado para materiales reales a estas velocidades. No hay par de retención en reposo. Se repite el pulso a temperatura inicial, sin acumular calor entre ciclos.",
    "source": "https://www.comsol.com/blogs/simulating-eddy-current-brakes/",
    "sourceName": "COMSOL, principio y simulación de frenos por corrientes parásitas",
    "quiz": "¿Por qué no sirve por sí solo para retener una carga en reposo?",
    "answers": [
      "El par inducido tiende a cero cuando deja de haber movimiento.",
      "Porque conserva un par infinito al parar.",
      "Porque el disco deja de ser conductor al enfriarse.",
      "Porque las corrientes producen energía sin límite."
    ],
    "faults": [
      [
        "Campo débil",
        "El disco tarda demasiado en perder velocidad aunque no se excede el par máximo.",
        "En el modelo resistivo el coeficiente de frenado crece con B²."
      ],
      [
        "Par inicial excesivo",
        "El frenado es rápido, pero el soporte recibe un par demasiado grande al inicio.",
        "Aumentar el campo o el espesor aumenta el coeficiente de frenado."
      ],
      [
        "Confundir freno y retención",
        "El disco frena bien, pero una carga externa lo vuelve a mover desde el reposo.",
        "Las corrientes inducidas necesitan movimiento relativo: falta un freno de retención."
      ]
    ],
    "eyebrow": "Mecánica automotriz",
    "tour": [
      {
        "title": "Observa el mecanismo en marcha",
        "text": "Frena un disco conductor con un campo magnético y observa cómo su energía termina en calor.",
        "view": "assembly"
      },
      {
        "title": "Encuentra la causa del movimiento",
        "text": "El disco en movimiento induce corrientes que se oponen al giro. Al bajar la velocidad, el par se reduce: este freno no mantiene inmóvil una carga.",
        "view": "assembly"
      },
      {
        "title": "Diseña y comprueba",
        "text": "Baja al 10 % del giro en ≤6 s físicos, sin superar 32 N·m de par inicial. Después compara los tres síntomas del diagnóstico.",
        "view": "assembly"
      }
    ]
  }
];
