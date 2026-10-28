export const definitions = [
  {
    "id": 241,
    "slug": "robot-centro-remoto",
    "title": "Robot de centro remoto: orientar sin desplazar el pivote",
    "longTitle": "Robot de centro remoto: orientar sin desplazar el pivote",
    "intro": "Una herramienta atraviesa un centro fijo mientras dos arcos concéntricos cambian su orientación.",
    "explore": "Ajusta inclinación e inserción para seguir un anillo patrón sin desplazar el punto de paso.",
    "controls": [
      {
        "id": "tilt",
        "label": "Inclinación",
        "min": 20,
        "max": 70,
        "step": 1,
        "unit": "°",
        "decimals": 0
      },
      {
        "id": "depth",
        "label": "Inserción desde el pivote",
        "min": 80,
        "max": 180,
        "step": 2,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Error de trayectoria",
        "key": "error",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Par gravitatorio",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Radio de barrido",
        "key": "radius",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      },
      {
        "label": "Descenso de la punta",
        "key": "height",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      }
    ],
    "task": "Sigue el anillo patrón con error ≤3 mm, inserción ≥100 mm y par gravitatorio ≤2,5 N·m.",
    "equations": "Pivote O fijo; u=[sinθcosψ,−cosθ,sinθsinψ], punta=O+Lu. Yaw ψ=2πt/12. Anillo patrón: radio84,853 mm y descenso84,853 mm respecto de O. Error euclídeo entre punta y punto homólogo del anillo. Carga puntual2 kg en la punta: par gravitatorio=mgLsinθ.",
    "limits": "Mecanismo ideal de guías circulares concéntricas con ejes que se cruzan en O, no reproduce el doble paralelogramo del artículo. Inserción rígida y trayectoria prescrita, sin flexibilidad, colisiones ni control de un equipo real. No es dispositivo médico. Escala geométrica7 unidades/m; ciclo12 s.",
    "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9963641/",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Qué define un centro remoto de movimiento?",
    "answers": [
      "El punto de paso permanece fijo mientras cambia la orientación del eje.",
      "La punta permanece fija y el punto de paso se traslada.",
      "El centro remoto equivale al centro de masa.",
      "La orientación sólo puede cambiar al sacar toda la herramienta."
    ],
    "faults": [
      [
        "Inserción incorrecta",
        "La punta recorre otro anillo.",
        "El radio y descenso dependen de L."
      ],
      [
        "Inclinación incorrecta",
        "El cono de barrido no coincide con el patrón.",
        "Cambian simultáneamente radio y descenso."
      ],
      [
        "Par elevado",
        "La carga supera el margen del banco.",
        "El brazo horizontal multiplica el peso."
      ]
    ],
    "labels": "Base · arco de guiñada · arco de inclinación · carro · herramienta · pivote · patrón",
    "caption": "Guías concéntricas ideales · ciclo12 s · no dispositivo médico",
    "tools": "Robot de guías circulares, pivote fijo y comparador de trayectoria.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-241 · Sigue el anillo patrón con error ≤3 mm, inserción ≥100 mm y par gravitatorio ≤2,5 N·m.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "error respecto de anillo (mm)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Una herramienta atraviesa un centro fijo mientras dos arcos concéntricos cambian su orientación.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Ajusta inclinación e inserción para seguir un anillo patrón sin desplazar el punto de paso.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 242,
    "slug": "robot-impedancia-contacto",
    "title": "Robot por impedancia: tocar sin golpear",
    "longTitle": "Robot por impedancia: tocar sin golpear",
    "intro": "Un brazo acerca una herramienta a un palpador elástico y registra la fuerza de contacto.",
    "explore": "La rigidez define la fuerza final y el amortiguamiento limita el golpe transitorio.",
    "controls": [
      {
        "id": "stiffness",
        "label": "Rigidez cartesiana",
        "min": 100,
        "max": 1200,
        "step": 25,
        "unit": "N/m",
        "decimals": 0
      },
      {
        "id": "damping",
        "label": "Amortiguamiento",
        "min": 10,
        "max": 140,
        "step": 5,
        "unit": "N·s/m",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Fuerza final",
        "key": "finalForce",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Pico de contacto",
        "key": "peak",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Establecimiento",
        "key": "settling",
        "unit": "s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Fuerza instantánea",
        "key": "F",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Obtén fuerza final14–18 N, pico ≤22 N y establecimiento a2 % ≤1 s.",
    "equations": "Eje cartesiano equivalente: m=2 kg, objetivo xd=40 mm dentro del cero de contacto. mẍ=K(xd−x)−Dẋ−Ke max(0,x), Ke=2000 N/m. Estado inicial x=−15 mm, v=0. RK4 con Δt=1 ms durante4 s. Fuerza=Ke max(0,x). Equilibrio F∞=KeKxd/(Ke+K). El brazo muestra la cinemática inversa prescrita del TCP; la dinámica es sólo del eje normal.",
    "limits": "Modelo de contacto unilateral sin adhesión, fricción tangencial o impacto rígido. Parámetros sintéticos, sin dinámica completa del robot ni certificación de colaboración. Desplazamiento normal ampliado×8; fuerza y reloj en segundos físicos. Retorno entre ensayos prescrito.",
    "source": "https://github.com/frankarobotics/libfranka/blob/main/examples/cartesian_impedance_control.cpp",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué aumentar sólo la rigidez puede empeorar un contacto?",
    "answers": [
      "Porque aumenta la fuerza de equilibrio y puede elevar el pico si falta amortiguamiento.",
      "El amortiguamiento determina por sí solo la fuerza final.",
      "La rigidez elimina la energía cinética inicial.",
      "Aumentar K reduce siempre el pico de fuerza."
    ],
    "faults": [
      [
        "Rigidez excesiva",
        "Se excede la fuerza estacionaria.",
        "El objetivo dentro del palpador genera más esfuerzo con K mayor."
      ],
      [
        "Amortiguamiento débil",
        "Se produce un pico alto al tocar.",
        "Se disipa poca energía durante la aproximación."
      ],
      [
        "Respuesta lenta",
        "La fuerza tarda en estabilizarse.",
        "El amortiguamiento excesivo también limita la rapidez."
      ]
    ],
    "labels": "Base · hombro · codo · muñeca · herramienta · palpador · resorte",
    "caption": "Desplazamiento normal×8 · dinámica1D · masa equivalente2 kg",
    "tools": "Brazo articulado, palpador elástico y adquisición de fuerza.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-242 · Obtén fuerza final14–18 N, pico ≤22 N y establecimiento a2 % ≤1 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "fuerza instantánea / equilibrio (N)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un brazo acerca una herramienta a un palpador elástico y registra la fuerza de contacto.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La rigidez define la fuerza final y el amortiguamiento limita el golpe transitorio.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 243,
    "slug": "compresor-scroll-orbita",
    "title": "Compresor scroll: orbitar para comprimir",
    "longTitle": "Compresor scroll: orbitar para comprimir",
    "intro": "Una espiral permanece fija y otra describe una órbita sin girar sobre sí misma.",
    "explore": "Relaciona el régimen, el caudal aspirado y el calentamiento de una compresión politrópica.",
    "controls": [
      {
        "id": "rpm",
        "label": "Régimen de entrada",
        "min": 1000,
        "max": 4000,
        "step": 100,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "ratio",
        "label": "Relación de presiones absolutas",
        "min": 2,
        "max": 5,
        "step": 0.1,
        "unit": "",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Caudal aspirado",
        "key": "freeAir",
        "unit": "L/min",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Temperatura de salida",
        "key": "Tout",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Potencia de eje",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Presión del volumen conceptual",
        "key": "chamberPressure",
        "unit": "kPa",
        "scale": 0.001,
        "decimals": 1
      }
    ],
    "task": "Entrega40–65 L/min con relación ≥2,5, salida ≤120 °C y potencia de eje ≤400 W.",
    "equations": "Aire ideal: p1=101325 Pa,T1=293,15 K,n=1,3; T2=T1 r^((n−1)/n). Desplazamiento nominal25 cm³/vuelta y ηv=0,9−0,03(r−1); Q=VdNηv/60. Potencia=[n/(n−1)]p1Q[r^((n−1)/n)−1]/0,8. Involuta rb[cos a+a sin a,sin a−a cos a]. Traslación orbital e=πrb−espesor, rb=0,09 y espesor0,09 unidades. Volumen conceptual V=25(1−0,65fase) cm³, pV^n=constante.",
    "limits": "Aire, no refrigerante real. Espirales ilustrativas sin simulación de sellado o contacto. El desplazamiento y volumen conceptual son nominales prescritos, no volúmenes calculados entre paredes. Sin fugas transitorias, Oldham dinámico o lubricación. Giro del excéntrico×1/120. El portador orbital no gira.",
    "source": "https://www.copeland.com/en-us/products-solutions/compression-technologies-systems/scroll-compressors",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Qué diferencia una órbita de una rotación de la espiral?",
    "answers": [
      "La espiral se traslada sobre una circunferencia conservando su orientación.",
      "La espiral gira rígidamente alrededor de su propio centro.",
      "La órbita obliga a que ambas espirales tengan la misma velocidad angular.",
      "El movimiento orbital invierte el sentido del eje en cada vuelta."
    ],
    "faults": [
      [
        "Régimen alto",
        "El caudal sale de la ventana.",
        "El desplazamiento por vuelta multiplica el régimen."
      ],
      [
        "Compresión excesiva",
        "La descarga se calienta demasiado.",
        "La temperatura aumenta con la relación absoluta de presiones."
      ],
      [
        "Confusión de geometría",
        "Se estima capacidad comercial a partir de la ilustración.",
        "El volumen nominal no se deduce de estas paredes."
      ]
    ],
    "labels": "Carcasa · espiral fija · espiral orbital · excéntrico · eje · entrada · descarga",
    "caption": "Excéntrico×1/120 · espirales ilustrativas · volumen conceptual",
    "tools": "Compresor abierto, dos involutas y analizador de compresión.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-243 · Entrega40–65 L/min con relación ≥2,5, salida ≤120 °C y potencia de eje ≤400 W.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "presión conceptual / aspiración (kPa)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Una espiral permanece fija y otra describe una órbita sin girar sobre sí misma.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Relaciona el régimen, el caudal aspirado y el calentamiento de una compresión politrópica.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 244,
    "slug": "sincronizador-cono-caja",
    "title": "Sincronizador de caja: igualar antes de engranar",
    "longTitle": "Sincronizador de caja: igualar antes de engranar",
    "intro": "Un cono de fricción iguala dos velocidades antes de que el manguito acople los dientes.",
    "explore": "Equilibra rapidez de sincronía, par de fricción y esfuerzo axial.",
    "controls": [
      {
        "id": "force",
        "label": "Fuerza axial de horquilla",
        "min": 50,
        "max": 200,
        "step": 5,
        "unit": "N",
        "decimals": 0
      },
      {
        "id": "mu",
        "label": "Coeficiente de fricción de cono",
        "min": 0.04,
        "max": 0.12,
        "step": 0.005,
        "unit": "",
        "decimals": 3
      }
    ],
    "metrics": [
      {
        "label": "Tiempo de sincronía",
        "key": "syncTime",
        "unit": "s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Par de cono",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Calor por cambio",
        "key": "heat",
        "unit": "J",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Diferencia de régimen",
        "key": "rpmDifference",
        "unit": "rpm",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Sincroniza en ≤1,2 s con par ≤4 N·m, fuerza axial ≤140 N y coeficiente ≥0,065.",
    "equations": "Cono simple Rm=45 mm, semiángulo7°: T=µFaRm/sinα. Inercia referida0,02 kg·m², diferencia inicial1500 rpm, eje receptor1000 rpm. ts=JΔω/T, Q=½JΔω². Diferencia decrece linealmente hasta cero. Las fases iniciales se eligen para alinear los dientes al completar ts; después entra el manguito en0,5 s.",
    "limits": "Fricción constante y receptor de velocidad impuesta. Sin película de aceite, anillo bloqueador dinámico, elasticidad de dientes o choque de engrane. Alineación de dientes preparada al inicio; no reproduce una búsqueda de fase real. Giro×1/100, sincronía en segundos físicos. Se diferencia de DCT: sincronizador de cono, no dos embragues de potencia.",
    "source": "https://www.mathworks.com/help/sdl/ref/synchronizer.html",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué se retrasa la entrada del manguito?",
    "answers": [
      "Para reducir la diferencia de velocidades antes del acoplamiento positivo.",
      "Para aumentar la diferencia de velocidades antes del acoplamiento.",
      "Para enfriar el cono hasta eliminar toda fricción.",
      "Para que el manguito absorba el impacto de los ejes."
    ],
    "faults": [
      [
        "Fuerza insuficiente",
        "La igualación tarda demasiado.",
        "El par de cono es proporcional al esfuerzo axial."
      ],
      [
        "Par excesivo",
        "La sincronía es rápida pero excede el límite.",
        "El tiempo corto no sustituye el margen de esfuerzo."
      ],
      [
        "Acoplamiento anticipado",
        "Se intenta engranar con diferencia de régimen.",
        "El cono debe igualar velocidades antes de cerrar dientes."
      ]
    ],
    "labels": "Eje · engranaje · cono · anillo · cubo · manguito · horquilla",
    "caption": "Giro×1/100 · sincronía física · fase de dientes preparada",
    "tools": "Sincronizador abierto, horquilla y registro de régimen relativo.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-244 · Sincroniza en ≤1,2 s con par ≤4 N·m, fuerza axial ≤140 N y coeficiente ≥0,065.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "diferencia de régimen (rpm)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un cono de fricción iguala dos velocidades antes de que el manguito acople los dientes.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Equilibra rapidez de sincronía, par de fricción y esfuerzo axial.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 245,
    "slug": "soldadura-friccion-agitacion",
    "title": "Fricción-agitación: unir sin fundir",
    "longTitle": "Fricción-agitación: unir sin fundir",
    "intro": "Una herramienta rotativa atraviesa la junta y deja un cordón continuo entre dos placas sujetas.",
    "explore": "Relaciona par, potencia y avance con el aporte de energía por milímetro.",
    "controls": [
      {
        "id": "rpm",
        "label": "Régimen de herramienta",
        "min": 400,
        "max": 1400,
        "step": 25,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "feed",
        "label": "Avance de junta",
        "min": 30,
        "max": 180,
        "step": 5,
        "unit": "mm/min",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Aporte lineal",
        "key": "lineEnergy",
        "unit": "J/mm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Temperatura equivalente",
        "key": "temperature",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Potencia mecánica",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Par de herramienta",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Mantén500–800 J/mm, temperatura equivalente350–500 °C y potencia ≤1100 W.",
    "equations": "Disco de hombro R=8 mm, fuerza axial6000 N, presión uniforme y µ=0,3: T=(2/3)µFR. P=Tω, potencia útil0,8P, aporte lineal=0,8P/v. Temperatura equivalente=20+0,8P/(1+0,75v), con v en mm/s y conductancia sintética en W/K. Junta120 mm; avance visual×20, giro×1/100.",
    "limits": "Balance reducido, no resuelve flujo plástico, temperatura3D, tensiones residuales o resistencia del cordón. El color es temperatura equivalente, no metal fundido ni incandescencia. Cordón ilustrativo formado detrás del pin. Sin ajuste de una máquina real. Proceso distinto de puntos, MIG y ultrasonido: herramienta no consumible y unión en estado sólido.",
    "source": "https://www.twi-global.com/technical-knowledge/job-knowledge/friction-stir-welding-147",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué un avance bajo aumenta el aporte por longitud?",
    "answers": [
      "Porque se deposita la potencia útil durante más tiempo sobre cada milímetro.",
      "Porque el avance bajo aumenta el par por definición.",
      "Porque al bajar el avance aumenta la velocidad angular.",
      "Porque la energía por milímetro no depende de la velocidad de avance."
    ],
    "faults": [
      [
        "Avance muy lento",
        "Se excede el aporte y la temperatura.",
        "La misma potencia se reparte entre menos milímetros."
      ],
      [
        "Avance alto",
        "Falta energía por longitud.",
        "La herramienta atraviesa la junta demasiado rápido."
      ],
      [
        "Régimen excesivo",
        "Se supera la potencia del banco.",
        "El par por la velocidad angular fija la potencia."
      ]
    ],
    "labels": "Pórtico · husillo · hombro · pin · placas · mordazas · cordón",
    "caption": "Avance×20 · giro×1/100 · falso color térmico",
    "tools": "Banco FSW con sujeción, herramienta no consumible y balance energético.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-245 · Mantén500–800 J/mm, temperatura equivalente350–500 °C y potencia ≤1100 W.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "temperatura equivalente / límite (°C)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Una herramienta rotativa atraviesa la junta y deja un cordón continuo entre dos placas sujetas.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Relaciona par, potencia y avance con el aporte de energía por milímetro.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 246,
    "slug": "corte-agua-presion-orificio",
    "title": "Corte por agua: presión, orificio y potencia",
    "longTitle": "Corte por agua: presión, orificio y potencia",
    "intro": "Un cabezal convierte presión hidráulica en un chorro que recorre una placa sobre el tanque.",
    "explore": "El diámetro cambia caudal y potencia; la presión determina principalmente la velocidad de salida.",
    "controls": [
      {
        "id": "pressure",
        "label": "Presión diferencial",
        "min": 200,
        "max": 400,
        "step": 10,
        "unit": "MPa",
        "decimals": 0
      },
      {
        "id": "diameter",
        "label": "Diámetro del orificio",
        "min": 0.15,
        "max": 0.35,
        "step": 0.01,
        "unit": "mm",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Velocidad del chorro",
        "key": "velocity",
        "unit": "m/s",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Consumo de agua",
        "key": "liters",
        "unit": "L/min",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Potencia hidráulica",
        "key": "pump",
        "unit": "kW",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Avance equivalente",
        "key": "feed",
        "unit": "mm/s",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Obtén velocidad ≥700 m/s, agua ≤2 L/min, potencia hidráulica ≤12 kW y avance equivalente ≥0,3 mm/s.",
    "equations": "Agua incompresibleρ=1000 kg/m³; v=0,97√(2Δp/ρ), Q=0,65A√(2Δp/ρ), Ph=ΔpQ, Pj=½ρQv². Arranque sintético=0,08Pj/(200 J/mm³). Placa10 mm y ranura0,8 mm: avance=arranque/(10·0,8). Corte recto100 mm. Reacción=ρQv.",
    "limits": "El avance es un balance sintético de energía; no predice calidad o capacidad de corte de agua pura/abrasivo. Sin compresibilidad a alta presión, mezcla abrasiva, desgaste, taper o breakup. Avance visual×50; marcadores de chorro×1/100000 y diámetro visual ampliado. No es procedimiento de puesta en marcha de alta presión.",
    "source": "https://www.flowwaterjet.com/explore/waterjet-basics/effects-of-pressure",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Qué aumenta más directamente al agrandar el orificio a igual presión?",
    "answers": [
      "El caudal y la potencia hidráulica, mientras la velocidad ideal permanece igual.",
      "La velocidad ideal se duplica al duplicar el diámetro.",
      "La presión se transforma directamente en temperatura.",
      "El caudal permanece fijo y sólo cambia la reacción."
    ],
    "faults": [
      [
        "Orificio grande",
        "Se exceden consumo y potencia.",
        "El área crece con el cuadrado del diámetro."
      ],
      [
        "Presión baja",
        "El chorro queda bajo la velocidad requerida.",
        "La velocidad crece con la raíz de la presión."
      ],
      [
        "Potencia insuficiente",
        "El avance equivalente no cumple.",
        "Sólo una fracción de la energía cinética se asigna al arranque."
      ]
    ],
    "labels": "Pórtico · cabezal · orificio · chorro · placa · ranura · tanque",
    "caption": "Avance×50 · marcadores×1/100000 · chorro ampliado",
    "tools": "Cabezal de corte, placa sobre apoyos y balance de caudal y potencia.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-246 · Obtén velocidad ≥700 m/s, agua ≤2 L/min, potencia hidráulica ≤12 kW y avance equivalente ≥0,3 mm/s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "potencia de chorro / hidráulica (kW)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un cabezal convierte presión hidráulica en un chorro que recorre una placa sobre el tanque.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "El diámetro cambia caudal y potencia; la presión determina principalmente la velocidad de salida.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 247,
    "slug": "hidroformado-tubo-espesor",
    "title": "Hidroformado de tubo: presión y alimentación axial",
    "longTitle": "Hidroformado de tubo: presión y alimentación axial",
    "intro": "Un tubo se expande dentro de una matriz seccionada mientras dos punzones alimentan material desde los extremos.",
    "explore": "La alimentación axial ayuda a conservar espesor durante la expansión radial.",
    "controls": [
      {
        "id": "pressure",
        "label": "Presión máxima",
        "min": 10,
        "max": 18,
        "step": 0.25,
        "unit": "MPa",
        "decimals": 2
      },
      {
        "id": "feed",
        "label": "Alimentación por extremo",
        "min": 2,
        "max": 20,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Radio final",
        "key": "radius",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      },
      {
        "label": "Espesor final",
        "key": "thickness",
        "unit": "mm",
        "scale": 1000,
        "decimals": 3
      },
      {
        "label": "Adelgazamiento",
        "key": "thinning",
        "unit": "%",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Fuerza de cierre",
        "key": "clampForce",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 1
      }
    ],
    "task": "Llena la matriz hasta radio ≥25,8 mm con adelgazamiento ≤18 %, presión ≤16 MPa y cierre ≤160 kN.",
    "equations": "Pared delgada uniforme: r0=20 mm,t0=1 mm,L0=200 mm. L=L0−2f, 2πrtL=constante. Deformación ε=ln(r/r0), tensión circunferencial=180 MPa+1000 MPa·ε. Equilibrio p=σθt/r en la rama creciente, radio limitado por matriz26 mm. Fuerza de cierre=p·2rL; empuje por extremo=pπr². Rampa3 s, sostén2 s y descarga2 s; expansión plástica conservada durante descarga.",
    "limits": "Modelo de membrana uniforme con endurecimiento sintético y espesor de pared delgada, no FEM, criterio de rotura, abultamiento localizado, fricción o arrugado. Alimentación axial prescrita. El volumen conservado es el volumen de membrana2πrtL, no el volumen exacto de una pared de espesor finito. Matriz abierta sólo para observar; ensayo real requiere cierre.",
    "source": "https://www.schulergroup.com/technologien/produkte/grundlagen_innenhochdruckumformung_verfahren_rohre/index.html?sLang=en",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Cómo ayuda la alimentación axial al espesor?",
    "answers": [
      "Aporta longitud al tramo que expande y reduce la pérdida de espesor necesaria para conservar material.",
      "Reduce el volumen de material a la mitad.",
      "Elimina la fuerza de cierre de la matriz.",
      "Sustituye la presión interna por tracción del agua."
    ],
    "faults": [
      [
        "Poca alimentación",
        "La expansión adelgaza demasiado el tubo.",
        "El área de pared crece sin aportar suficiente material."
      ],
      [
        "Presión insuficiente",
        "No se llena el radio de matriz.",
        "La tensión de membrana no sostiene la expansión requerida."
      ],
      [
        "Cierre insuficiente",
        "El producto presión por área supera el margen.",
        "El equilibrio de la pared no elimina la fuerza que separa la matriz."
      ]
    ],
    "labels": "Matriz · tubo · agua · punzones · sellos · guías · bastidor",
    "caption": "Membrana uniforme · rampa3 s · descarga sin recuperación",
    "tools": "Celda de hidroformado seccionada con punzones axiales y espesor medido.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-247 · Llena la matriz hasta radio ≥25,8 mm con adelgazamiento ≤18 %, presión ≤16 MPa y cierre ≤160 kN.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "radio instantáneo / matriz (mm)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un tubo se expande dentro de una matriz seccionada mientras dos punzones alimentan material desde los extremos.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La alimentación axial ayuda a conservar espesor durante la expansión radial.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "inspectionDir": [
      1,
      0.8,
      1.3
    ]
  },
  {
    "id": 248,
    "slug": "pintura-polvo-electrostatica",
    "title": "Pintura en polvo: transporte y captura electrostática",
    "longTitle": "Pintura en polvo: transporte y captura electrostática",
    "intro": "Una pistola envía partículas cargadas hacia una placa conectada a tierra y forma una capa de polvo.",
    "explore": "Compara campo eléctrico, captura y espesor antes del curado.",
    "controls": [
      {
        "id": "voltage",
        "label": "Magnitud de tensión de pistola",
        "min": 20,
        "max": 90,
        "step": 5,
        "unit": "kV",
        "decimals": 0
      },
      {
        "id": "flow",
        "label": "Caudal másico de polvo",
        "min": 20,
        "max": 100,
        "step": 5,
        "unit": "g/min",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Captura modelada",
        "key": "efficiency",
        "unit": "%",
        "scale": 100,
        "decimals": 1
      },
      {
        "label": "Espesor antes de curar",
        "key": "thickness",
        "unit": "µm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Corriente de polvo capturado",
        "key": "current",
        "unit": "µA",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Polvo no capturado",
        "key": "lost",
        "unit": "g/min",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Consigue captura80–95 %, espesor60–90 µm y corriente de polvo capturado ≤2 µA.",
    "equations": "Campo uniforme E=V/0,2 m. Partículas40 µm,ρp=1500 kg/m³,µaire=1,8·10⁻⁵ Pa·s: τ=ρpd²/(18µ). Carga específica uniforme en128 clases de0,0001 a0,0009 C/kg. Movimiento desde v0=0,5 m/s: x=v0t+(q/m)Eτ[t−τ(1−exp(−t/τ))]. Captura si alcanza0,2 m en0,2 s. Espesor=ṁη/(ρp·ancho0,2 m·velocidad0,04 m/s). Corriente suma de cargas capturadas.",
    "limits": "Campo y distribución de carga sintéticos, sin corona, carga espacial, resistividad, geometría de bordes, retroionización o cámara de curado. Tiempo de vuelo es el mismo del modelo; recorrido visual escalado5 unidades/m y espesor×200. Espesor equivalente de masa depositada, no película curada ni eficiencia comercial. Corriente sólo del polvo, no consumo total de pistola.",
    "source": "https://www.nordson.com/en/About-Us/Newsroom/Industrial-Coating-Systems-News/Complete-Guide-to-Powder-Coating",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué más polvo no garantiza mejor aprovechamiento?",
    "answers": [
      "Porque la captura depende del transporte y el exceso puede aumentar la masa no depositada.",
      "El caudal másico fija por sí solo la captura.",
      "El curado ocurre antes del vuelo de las partículas.",
      "La puesta a tierra impide toda deposición."
    ],
    "faults": [
      [
        "Campo débil",
        "Muchas clases de carga no llegan a la placa.",
        "La deriva eléctrica no basta durante la ventana de vuelo."
      ],
      [
        "Caudal alto",
        "La capa excede el espesor requerido.",
        "La masa capturada se reparte sobre una superficie por unidad de tiempo."
      ],
      [
        "Curado omitido",
        "Se interpreta la capa depositada como recubrimiento terminado.",
        "El banco no modela la fusión y reticulación en horno."
      ]
    ],
    "labels": "Pistola · electrodo · partículas · placa · tierra · colector · capa",
    "caption": "Campo uniforme · vuelo0,2 s · espesor visual×200 · sin curado",
    "tools": "Cabina seccionada, nube de partículas y balance de masa y carga.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-248 · Consigue captura80–95 %, espesor60–90 µm y corriente de polvo capturado ≤2 µA.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "espesor equivalente / referencia (µm)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Una pistola envía partículas cargadas hacia una placa conectada a tierra y forma una capa de polvo.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Compara campo eléctrico, captura y espesor antes del curado.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 249,
    "slug": "amortiguador-magnetorreologico",
    "title": "Amortiguador magnetorreológico: regular la disipación",
    "longTitle": "Amortiguador magnetorreológico: regular la disipación",
    "intro": "Un pistón oscila dentro de un fluido cuya resistencia cambia con la corriente de una bobina.",
    "explore": "Relaciona corriente, fuerza y energía del ciclo sin confundir un elemento disipativo con un actuador.",
    "controls": [
      {
        "id": "current",
        "label": "Corriente de bobina",
        "min": 0,
        "max": 2,
        "step": 0.1,
        "unit": "A",
        "decimals": 1
      },
      {
        "id": "amplitude",
        "label": "Semicarrera sinusoidal",
        "min": 5,
        "max": 25,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Potencia disipada",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Fuerza máxima",
        "key": "peak",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Energía por ciclo",
        "key": "energy",
        "unit": "J",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fuerza instantánea",
        "key": "force",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Disipa50–100 W con fuerza ≤1000 N, semicarrera10–20 mm y corriente ≤1,5 A.",
    "equations": "Bingham concentrado ideal: Fy=100+350I N,c=800 N·s/m. x=A sin(ωt),ω=2π·2 rad/s. Fuerza sobre el vástago F=−cẋ−Fy sign(ẋ). Energía por ciclo E=πcA²ω+4FyA; potencia media=2E. Fmax=cAω+Fy. Sin elasticidad o fuerza activa; −Fẋ≥0.",
    "limits": "Ley sintética de fuerza umbral, no calcula el campo magnético, reología real, histéresis preflujo, cavitación o temperatura. El signo se idealiza discontinuo en velocidad cero. Las cadenas de partículas son un indicador de corriente, no microestructura simulada. Movimiento físico a2 Hz y desplazamiento visual×15; no dimensiona una suspensión real.",
    "source": "https://www.sciencedirect.com/science/article/pii/S0022460X07008851",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Puede este modelo impulsar el pistón como un motor?",
    "answers": [
      "No: su fuerza siempre se opone a la velocidad y disipa energía mecánica.",
      "Sí, porque una corriente constante invierte la fuerza.",
      "Sí, la fuerza umbral acelera siempre el vástago.",
      "La potencia disipada tiene signo negativo durante todo el ciclo."
    ],
    "faults": [
      [
        "Corriente alta",
        "Se supera el margen de fuerza.",
        "Aumenta el término de fuerza umbral."
      ],
      [
        "Carrera pequeña",
        "La potencia disipada queda baja.",
        "Se reduce el recorrido y la velocidad por ciclo."
      ],
      [
        "Interpretación activa",
        "Se pretende obtener trabajo neto del amortiguador.",
        "La bobina regula resistencia, no cambia el signo de la disipación."
      ]
    ],
    "labels": "Cilindro · vástago · pistón · bobina · entrehierro · fluido · bancada",
    "caption": "Movimiento2 Hz · desplazamiento×15 · Bingham ideal",
    "tools": "Amortiguador en corte, bobina y lazo fuerza–velocidad.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-249 · Disipa50–100 W con fuerza ≤1000 N, semicarrera10–20 mm y corriente ≤1,5 A.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "fuerza resistente (N)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un pistón oscila dentro de un fluido cuya resistencia cambia con la corriente de una bobina.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Relaciona corriente, fuerza y energía del ciclo sin confundir un elemento disipativo con un actuador.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 250,
    "slug": "robot-hexapodo-tripodes",
    "title": "Robot hexápodo: marcha y polígono de apoyo",
    "longTitle": "Robot hexápodo: marcha y polígono de apoyo",
    "intro": "Seis patas articuladas alternan dos trípodes mientras el cuerpo avanza sobre una pista de ensayo.",
    "explore": "Ajusta zancada y centro de masa para conservar apoyo durante todo el ciclo.",
    "controls": [
      {
        "id": "stride",
        "label": "Zancada prescrita",
        "min": 80,
        "max": 200,
        "step": 5,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "offset",
        "label": "Desplazamiento longitudinal del centro de masa",
        "min": -100,
        "max": 100,
        "step": 5,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Margen mínimo de apoyo",
        "key": "minMargin",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      },
      {
        "label": "Par equivalente máximo",
        "key": "peakTorque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Velocidad prescrita",
        "key": "speed",
        "unit": "m/s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Margen instantáneo",
        "key": "margin",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      }
    ],
    "task": "Camina a ≥0,096 m/s con margen mínimo ≥25 mm, par equivalente ≤6 N·m y todas las patas alcanzables.",
    "equations": "Marcha de trípodes a0,8 Hz, apoyo50 %. Caderas x=±200 y0 mm,z=±70 mm,y=150 mm; pies z=±200 mm. Zancada S: apoyo x=xc+S(0,5−s), retorno x=xc+S(−0,5+s), elevación45sin(πs) mm. Eslabones110/130 mm; rodilla por intersección de círculos. Centro de masa x=offset,z=0; margen firmado mínimo a bordes del triángulo de apoyo. Reacciones baricéntricas para8 kg; par equivalente=0,11·max|Ni|. Se muestrean241 fases.",
    "limits": "Locomoción cuasiestática prescrita sobre suelo plano. No resuelve dinámica multicuerpo, fricción, deslizamiento, motores, impactos o estabilidad dinámica. Par equivalente de un brazo fijo110 mm, no par exacto de todas las articulaciones. Trípode de apoyo en DOM, sin texto3D. Escala5 unidades/m; pista representa avance relativo con cuerpo fijo.",
    "source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC5038670/",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué importa todo el ciclo y no sólo una postura?",
    "answers": [
      "Porque el triángulo de apoyo cambia con las patas y el margen puede reducirse durante la zancada.",
      "Porque el triángulo permanece fijo durante la marcha.",
      "Porque una reacción negativa sostiene mejor el robot.",
      "Porque la velocidad prescribe por sí sola estabilidad dinámica."
    ],
    "faults": [
      [
        "Masa adelantada",
        "El centro de masa se acerca a un borde.",
        "Las reacciones se concentran y el margen disminuye."
      ],
      [
        "Zancada excesiva",
        "Se reduce el margen o se pierde alcance.",
        "Las patas deben cubrir posiciones más extremas."
      ],
      [
        "Apoyo supuesto",
        "Se acepta una reacción negativa como apoyo válido.",
        "El contacto unilateral no puede traccionar el suelo."
      ]
    ],
    "labels": "Cuerpo · caderas · fémures · tibias · pies · masa · pista",
    "caption": "Marcha0,8 Hz · apoyo cuasiestático · par equivalente",
    "tools": "Robot hexápodo articulado, pista y evaluación del triángulo de apoyo.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-250 · Camina a ≥0,096 m/s con margen mínimo ≥25 mm, par equivalente ≤6 N·m y todas las patas alcanzables.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "margen instantáneo / mínimo (mm)",
    "eyebrow": "Orden de trabajo · industria y robótica",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Seis patas articuladas alternan dos trípodes mientras el cuerpo avanza sobre una pista de ensayo.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Ajusta zancada y centro de masa para conservar apoyo durante todo el ciclo.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "inspectionDir": [
      1.8,
      0.35,
      0.45
    ]
  }
];
