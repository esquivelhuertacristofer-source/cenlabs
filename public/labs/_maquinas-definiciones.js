export const definitions = [
  {
    "id": 231,
    "slug": "robot-cables-tensiones",
    "title": "Robot suspendido: cables, tensiones y cabrestantes",
    "longTitle": "Robot suspendido: cables, tensiones y cabrestantes",
    "intro": "Cuatro cabrestantes trasladan una carga suspendida manteniendo todos los cables en tracción.",
    "explore": "Una separación grande de anclajes aumenta las componentes horizontales y el esfuerzo de cada cable.",
    "controls": [
      {
        "id": "span",
        "label": "Semiseparación de anclajes",
        "min": 0.8,
        "max": 1.6,
        "step": 0.05,
        "unit": "m",
        "decimals": 2
      },
      {
        "id": "mass",
        "label": "Carga útil",
        "min": 5,
        "max": 25,
        "step": 1,
        "unit": "kg",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Tensión mínima del recorrido",
        "key": "minT",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Tensión máxima",
        "key": "maxT",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Par máximo de tambor",
        "key": "peakTorque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Potencia máxima de izado",
        "key": "maxPower",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Traslada ≥12 kg en la trayectoria prescrita con tensiones 12–110 N y potencia máxima de izado ≤80 W.",
    "equations": "Anclajes (±s,2,2,±s) m. Unión común: x=0,45sin(2πt/20), y=0,8, z=0,35cos(2πt/20). Masa total=carga+6 kg. Unidades de cable ui=(ai−x)/Li. Reparto de mínima norma T=Aᵀ(AAᵀ)⁻¹[0,mg,0]; AT equilibra el peso. dLi/dt=−ui·v. Tambor de radio40 mm y eficiencia0,8. Se revisan241 posiciones del recorrido.",
    "limits": "Modelo cuasiestático de traslación: los cuatro cables convergen en una rótula común y no controlan orientación ni guiñada. Sin aceleración de carga, elasticidad, pandeo, control real de winches o certificación de elevación. Tensiones negativas se rechazan; no representan cables que empujan. Recorrido acelerado×2.",
    "source": "https://www.nist.gov/publications/design-and-workspace-analysis-6-6-cable-suspended-parallel-robot",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué no basta con que la suma de fuerzas sea correcta?",
    "answers": [
      "Porque cada cable sólo puede traccionar y debe conservar tensión positiva durante todo el recorrido.",
      "La carga sólo depende del cable más corto y los otros pueden quedar flojos.",
      "Un cable puede compensar una fuerza faltante empujando la plataforma.",
      "Las tensiones quedan constantes aunque cambie el ángulo de los cables."
    ],
    "faults": [
      [
        "Anclajes muy abiertos",
        "Crece el esfuerzo aunque la carga sea la misma.",
        "Una mayor componente horizontal exige más tensión total."
      ],
      [
        "Carga excesiva",
        "Los cabrestantes exceden su límite de tracción.",
        "Las tensiones crecen con el peso suspendido."
      ],
      [
        "Cable descargado",
        "El reparto matemático exige una tensión no positiva.",
        "Un cable flojo no puede ejercer compresión."
      ]
    ],
    "labels": "Pórtico · cabrestantes · tambores · cables · rótula · plataforma",
    "caption": "Trayectoria×2 · equilibrio cuasiestático · orientación libre",
    "tools": "Robot por cables, cuatro cabrestantes y registro de longitudes y tensiones.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-231 · Traslada ≥12 kg en la trayectoria prescrita con tensiones 12–110 N y potencia máxima de izado ≤80 W.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "tensión cable1 / cable3 (N)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Cuatro cabrestantes trasladan una carga suspendida manteniendo todos los cables en tracción.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Una separación grande de anclajes aumenta las componentes horizontales y el esfuerzo de cada cable.",
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
    "id": 232,
    "slug": "particulas-magneticas-orientacion",
    "title": "Partículas magnéticas: orientación del campo",
    "longTitle": "Partículas magnéticas: orientación del campo",
    "intro": "Un eje ferromagnético revela dos discontinuidades patrón cuando el campo corta sus direcciones.",
    "explore": "Combina magnetización longitudinal y circular para examinar las dos orientaciones patrón.",
    "controls": [
      {
        "id": "coil",
        "label": "Corriente de bobina",
        "min": 5,
        "max": 30,
        "step": 1,
        "unit": "A",
        "decimals": 0
      },
      {
        "id": "bar",
        "label": "Corriente del conductor central",
        "min": 100,
        "max": 1000,
        "step": 25,
        "unit": "A",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Campo longitudinal",
        "key": "axial",
        "unit": "A/m",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Campo circular",
        "key": "circular",
        "unit": "A/m",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Campo combinado",
        "key": "field",
        "unit": "A/m",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Potencia del banco",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Obtén campo perpendicular ≥2500 A/m para ambas orientaciones, campo combinado ≤10000 A/m y potencia ≤600 W.",
    "equations": "Solenoide largo ideal N=200,L=0,4 m: Ha=500Icoil A/m. Conductor central en r=25 mm: Hc=Ibar/(2πr). Dos discontinuidades patrón, axial y circunferencial: indicadores normalizados clamp(Hperp/2500). Campo resultante=√(Ha²+Hc²). Resistencias equivalentes0,4 Ω y0,0006 Ω.",
    "limits": "Medio lineal ideal: no calcula histéresis, saturación B(H), profundidad o tamaño de grieta ni una técnica MT certificada. Densidad de partículas como indicador esquemático de excitación transversal, no predicción de fuga magnética ni transporte real de polvo. Líneas helicoidales representan el campo ideal; campo continuo, sin velocidad material del flujo.",
    "source": "https://www.twi-global.com/technical-knowledge/faqs/faq-in-magnetic-particle-inspection-how-do-we-ensure-that-defects-of-all-orientations-are-detected",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué los dos defectos patrón necesitan componentes de campo distintas?",
    "answers": [
      "Porque una discontinuidad paralela a un campo puede producir una indicación débil y necesita otra dirección.",
      "El campo paralelo a cualquier grieta siempre produce la mayor indicación.",
      "Basta aumentar corriente en una sola dirección para garantizar todas las orientaciones.",
      "El polvo fluorescente permite medir directamente la profundidad de cualquier defecto."
    ],
    "faults": [
      [
        "Falta campo circular",
        "La discontinuidad axial apenas se indica.",
        "El campo debe cruzar su apertura."
      ],
      [
        "Bobina sobreexcitada",
        "Hay señal longitudinal pero se excede el campo permitido.",
        "Más excitación no garantiza un ensayo conforme."
      ],
      [
        "Conclusión indebida",
        "Se pretende certificar la profundidad de una grieta a partir del brillo.",
        "El indicador no resuelve fuga ni geometría real del defecto."
      ]
    ],
    "labels": "Bobina · eje · conductor · contactos · discontinuidades · partículas",
    "caption": "Campo continuo ideal · partículas indicativas · no certifica MT",
    "tools": "Banco magnético, solenoide, conductor central y dos discontinuidades patrón.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-232 · Obtén campo perpendicular ≥2500 A/m para ambas orientaciones, campo combinado ≤10000 A/m y potencia ≤600 W.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "campo longitudinal / circular (kA/m)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un eje ferromagnético revela dos discontinuidades patrón cuando el campo corta sus direcciones.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Combina magnetización longitudinal y circular para no dejar una orientación sin examinar.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "fichaNotes": [
      "Se evalúan dos orientaciones concretas. Una discontinuidad oblicua puede quedar paralela al campo resultante y no producir indicación. No se supone cobertura de todas las direcciones ni se sustituyen magnetizaciones sucesivas de un procedimiento real."
    ]
  },
  {
    "id": 233,
    "slug": "electroerosion-hilo-corte",
    "title": "Electroerosión por hilo: energía y avance",
    "longTitle": "Electroerosión por hilo: energía y avance",
    "intro": "Un hilo corta un contorno circular mediante descargas en un baño dieléctrico.",
    "explore": "La potencia media determina el material retirado; un pulso excesivo eleva el riesgo térmico del hilo.",
    "controls": [
      {
        "id": "current",
        "label": "Corriente de pulso",
        "min": 8,
        "max": 24,
        "step": 1,
        "unit": "A",
        "decimals": 0
      },
      {
        "id": "duty",
        "label": "Fracción de tiempo activo",
        "min": 0.2,
        "max": 0.8,
        "step": 0.05,
        "unit": "",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Energía por pulso",
        "key": "pulse",
        "unit": "J",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Arranque volumétrico",
        "key": "removal",
        "unit": "mm³/s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Avance de contorno",
        "key": "feed",
        "unit": "mm/s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Temperatura equivalente del hilo",
        "key": "wireT",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Corta a ≥0,18 mm/s con energía por pulso ≤0,30 J, hilo ≤240 °C y duración física ≤700 s.",
    "equations": "Tensión80 V, frecuencia2000 Hz; P=80I·d, Ep=P/f. Rendimiento de arranque0,3 y energía específica200 J/mm³: Q=0,3P/200. Espesor10 mm, ranura0,3 mm: v=Q/3. Contorno R20 mm. Temperatura equivalente estacionaria=20+0,02P/0,06 °C. Volumen eliminado=Qτ.",
    "limits": "Coeficientes sintéticos de balance, sin plasma, control real de gap, rugosidad predictiva, conicidad, rotura o certificado de proceso. El baño es dieléctrico representativo. Avance acelerado×60; destello representa potencia media, no cada pulso de2 kHz. La ranura se ensancha para verla y el ensayo reinicia ciclos independientes. Baño seccionado para mostrar el hilo; ranura visual ampliada×2.",
    "source": "https://www.makino.com/resources/content-library/article/archive/edm-wire-tutorial/198",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Qué sucede al subir corriente manteniendo frecuencia y duty?",
    "answers": [
      "Aumentan la potencia media y la energía por descarga, lo que modifica avance y calentamiento.",
      "El avance disminuye siempre al aumentar la potencia media.",
      "La energía de pulso permanece fija aunque suba la corriente con frecuencia y duty constantes.",
      "El dieléctrico transforma por sí solo todo el calor en material eliminado."
    ],
    "faults": [
      [
        "Pulso excesivo",
        "Se supera la energía admisible por descarga.",
        "Ep depende de potencia media y frecuencia."
      ],
      [
        "Avance insuficiente",
        "El corte tarda demasiado aunque el hilo esté frío.",
        "La tasa de arranque fija el avance sobre una ranura dada."
      ],
      [
        "Hilo sobrecalentado",
        "El balance térmico rebasa el límite del escenario.",
        "Sólo una parte de la potencia llega al hilo, pero su refrigeración es limitada."
      ]
    ],
    "labels": "Bastidor · guías · hilo · baño · pieza · ranura · descarga",
    "caption": "Avance×60 · destello de potencia media · ranura ampliada",
    "tools": "Electroerosionadora de hilo, contorno circular y balance energético.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-233 · Corta a ≥0,18 mm/s con energía por pulso ≤0,30 J, hilo ≤240 °C y duración física ≤700 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "avance relativo / volumen relativo (0–1)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un hilo corta un contorno circular mediante descargas en un baño dieléctrico.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La potencia media determina el material retirado; un pulso excesivo eleva el riesgo térmico del hilo.",
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
    "id": 234,
    "slug": "soldadura-ultrasonica-polimeros",
    "title": "Soldadura ultrasónica: sonotrodo y energía",
    "longTitle": "Soldadura ultrasónica: sonotrodo y energía",
    "intro": "Un sonotrodo vibra sobre dos piezas plásticas y concentra calor en la unión.",
    "explore": "La amplitud influye al cuadrado en la potencia del modelo; el tiempo determina la energía y la temperatura final.",
    "controls": [
      {
        "id": "amplitude",
        "label": "Amplitud de vibración",
        "min": 20,
        "max": 60,
        "step": 1,
        "unit": "µm",
        "decimals": 0
      },
      {
        "id": "seconds",
        "label": "Tiempo de ultrasonido",
        "min": 0.2,
        "max": 1.2,
        "step": 0.05,
        "unit": "s",
        "decimals": 2
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
        "label": "Energía útil de unión",
        "key": "energy",
        "unit": "J",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Temperatura final",
        "key": "temperature",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Temperatura instantánea",
        "key": "T",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Obtén interfaz150–200 °C, energía útil100–170 J, potencia ≤450 W y tiempo de vibración ≤0,9 s.",
    "equations": "Frecuencia20 kHz; amplitud pico A. Amortiguamiento equivalente c=30 N·s/m: P=½c(2πfA)². Potencia útil0,65P. Interfaz concentrada C=0,8 J/K,H=0,5 W/K: T=20+(0,65P/H)(1−exp(−Ht/C)). Colapso ilustrativo0,3 mm·clamp((T−120)/60). Fuerza prescrita300 N.",
    "limits": "Parámetros sintéticos; sin identificación de material, campo acústico, viscoelasticidad no lineal ni predicción de resistencia. La vibración se amplifica×100 y se ralentiza×1/10000; el ciclo térmico se ralentiza×1/10. Ambos usan el mismo reloj con escalas separadas rotuladas. Color de interfaz es falso color de temperatura; no incandescencia. El sólido vibra a escala física y el contorno transparente muestra la amplificación; el colapso se amplía×20 y la tapa se ensancha para conservar volumen. El ultrasonido cesa antes del mantenimiento.",
    "source": "https://www.emerson.com/is/content/emerson/en/corporate/branson/documents/dcm01314-manual-ultraseal-20ex-vgx-4kw-rev-03.pdf",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué un pequeño aumento de amplitud puede elevar mucho la potencia?",
    "answers": [
      "Porque la velocidad vibratoria aumenta con la amplitud y la disipación equivalente depende de su cuadrado.",
      "La potencia depende linealmente de la amplitud para cualquier amortiguamiento.",
      "La frecuencia deja de influir en la velocidad de oscilación.",
      "Toda la energía eléctrica se convierte en resistencia mecánica de la unión."
    ],
    "faults": [
      [
        "Amplitud excesiva",
        "Se dispara la potencia y se sobrecalienta la unión.",
        "La disipación crece con A²."
      ],
      [
        "Tiempo insuficiente",
        "La temperatura final queda por debajo de la ventana.",
        "El calor útil necesita tiempo para acumularse."
      ],
      [
        "Exceso de exposición",
        "Se excede la energía aunque la amplitud sea moderada.",
        "La energía útil es potencia por duración."
      ]
    ],
    "labels": "Prensa · transductor · amplificador · sonotrodo · piezas · interfaz",
    "caption": "Contorno vibratorio×100 y×1/10000 · térmica×1/10 · colapso×20",
    "tools": "Prensa ultrasónica, conjunto vibratorio y dos piezas termoplásticas.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-234 · Obtén interfaz150–200 °C, energía útil100–170 J, potencia ≤450 W y tiempo de vibración ≤0,9 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "temperatura instantánea / final (°C)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un sonotrodo vibra sobre dos piezas plásticas y concentra calor en la unión.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La amplitud influye al cuadrado en la potencia del modelo; el tiempo determina la energía y la temperatura final.",
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
    "id": 235,
    "slug": "motor-neumatico-paletas",
    "title": "Motor neumático de paletas: par y consumo",
    "longTitle": "Motor neumático de paletas: par y consumo",
    "intro": "Las paletas se extienden sobre una cámara excéntrica y convierten aire comprimido en giro.",
    "explore": "Relaciona presión, carga, velocidad útil y consumo referido a aire libre.",
    "controls": [
      {
        "id": "pressure",
        "label": "Presión de entrada manométrica",
        "min": 3,
        "max": 7,
        "step": 0.25,
        "unit": "bar",
        "decimals": 2
      },
      {
        "id": "load",
        "label": "Par resistente",
        "min": 0.2,
        "max": 1.4,
        "step": 0.05,
        "unit": "N·m",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Régimen del eje",
        "key": "rpm",
        "unit": "rpm",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Potencia útil",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Consumo de aire libre",
        "key": "freeAir",
        "unit": "L/min",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Rendimiento respecto ideal",
        "key": "efficiency",
        "unit": "%",
        "scale": 100,
        "decimals": 1
      }
    ],
    "task": "Trabaja a900–1800 rpm con potencia ≥80 W, consumo ≤220 L/min y rendimiento respecto al máximo isotérmico ≥18 %.",
    "equations": "Desplazamiento nominal20 cm³/vuelta, eficiencia de par0,7. Tm=0,7ΔpVd/(2π). Fricción viscosa b=0,002 N·m·s/rad: ω=max(0,(Tm−Tcarga)/b). Qin=Vdω/(2π)+10⁻¹⁰Δp; caudal referido a entrada. Aire libre=Qin(pentrada/101325). Potencia útil=Tcargaω; referencia isotérmica=pentradaQin ln(pentrada/101325). Paleta: r=−e cosθ+√(R²−e²sin²θ).",
    "limits": "Curva sintética estacionaria, sin expansión transitoria, compresibilidad de cada cámara o lubricación. Desplazamiento nominal prescrito; dibujo de paletas ilustrativo. Eficiencia respecto a trabajo isotérmico máximo, no dato de catálogo. Giro×1/120. No acciona una herramienta neumática real.",
    "source": "https://www.atlascopco.com/en-us/itba/industry-solutions/airmotors/technicalguide/design-working-principle",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué cargar más el eje puede reducir su velocidad?",
    "answers": [
      "Porque el par disponible debe repartirse entre carga y pérdidas viscosas en este banco.",
      "El par disponible aumenta automáticamente al conectar una carga mayor.",
      "El aire libre consumido es igual al volumen comprimido sin convertir presiones.",
      "La velocidad queda fijada sólo por la presión, independientemente de la carga."
    ],
    "faults": [
      [
        "Carga muy pequeña",
        "El motor supera el régimen permitido.",
        "Sobra par para acelerar hasta un régimen alto."
      ],
      [
        "Presión insuficiente",
        "No se alcanza la potencia útil requerida.",
        "La presión fija el par disponible."
      ],
      [
        "Consumo elevado",
        "El ajuste entrega potencia pero gasta demasiado aire.",
        "El caudal combina desplazamiento y fuga."
      ]
    ],
    "labels": "Carcasa · rotor · paletas · entrada · escape · eje · freno",
    "caption": "Giro×1/120 · curvas sintéticas · caudal a aire libre",
    "tools": "Motor de paletas abierto, freno de carga y analizador de consumo.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-235 · Trabaja a900–1800 rpm con potencia ≥80 W, consumo ≤220 L/min y rendimiento respecto al máximo isotérmico ≥18 %.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "par disponible / resistente (N·m)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Las paletas se extienden sobre una cámara excéntrica y convierten aire comprimido en giro.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Relaciona presión, carga, velocidad útil y consumo referido a aire libre.",
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
    "id": 236,
    "slug": "engranaje-magnetico-coaxial",
    "title": "Engranaje magnético: transmisión sin contacto",
    "longTitle": "Engranaje magnético: transmisión sin contacto",
    "intro": "Dos coronas de imanes y un modulador fijo transmiten par con velocidades opuestas.",
    "explore": "La holgura reduce la capacidad de acoplamiento; el desfase magnético sostiene la carga.",
    "controls": [
      {
        "id": "gap",
        "label": "Entrehierro nominal",
        "min": 1,
        "max": 4,
        "step": 0.25,
        "unit": "mm",
        "decimals": 2
      },
      {
        "id": "load",
        "label": "Par de carga",
        "min": 2,
        "max": 12,
        "step": 0.5,
        "unit": "N·m",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Capacidad de par",
        "key": "capacity",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Margen de carga",
        "key": "margin",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Salida sincronizada",
        "key": "rpm",
        "unit": "rpm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Potencia útil",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Entrega ≥120 W con margen ≥2 N·m, par de entrada ≤3,5 N·m y entrehierro ≥1,5 mm.",
    "equations": "Pares polares4 y11, modulador fijo15 polos; 4ωentrada+11ωsalida=0. Entrada600 rpm. Ley de banco Tmáx=14exp(−0,5(g−1)) N·m, g en mm. T=Tmáxsinδ; en sincronismo δ=asin(Tcarga/Tmáx). Tin=(4/11)Tcarga y balance ideal de potencia.",
    "limits": "Capacidad exponencial sintética, no FEM magnético ni curva de fabricante. Imanes y líneas representan el principio, sin histéresis ni pérdidas. Si la carga excede la capacidad, un freno externo retiene la salida para el ensayo de par; no se simula su dinámica de deslizamiento. Giro×1/120 y entrehierro visual ampliado.",
    "source": "https://ietresearch.onlinelibrary.wiley.com/doi/10.1049/joe.2018.8238",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Qué mantiene la relación de velocidades mientras hay sincronismo?",
    "answers": [
      "La interacción de los pares polares de ambos rotores con el modulador fijo.",
      "El contacto entre dientes fija la relación aunque no existan imanes.",
      "La relación cambia continuamente con el par mientras ambos rotores estén sincronizados.",
      "El modulador debe girar a la misma velocidad que ambos rotores."
    ],
    "faults": [
      [
        "Entrehierro grande",
        "La capacidad queda por debajo de la carga.",
        "La ley de acoplamiento disminuye con la separación."
      ],
      [
        "Sobrecarga",
        "El banco retiene la salida y no alcanza la potencia prevista.",
        "No existe equilibrio de fase para una carga mayor que Tmáx."
      ],
      [
        "Holgura insuficiente",
        "El par cumple pero se viola el margen geométrico requerido.",
        "La capacidad magnética no sustituye el requisito de separación."
      ]
    ],
    "labels": "Rotor rápido · imanes · modulador · rotor lento · ejes · freno",
    "caption": "Giro×1/120 · entrehierro ampliado · campo esquemático",
    "tools": "Acoplamiento magnético coaxial abierto, imanes alternos y freno de banco.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-236 · Entrega ≥120 W con margen ≥2 N·m, par de entrada ≤3,5 N·m y entrehierro ≥1,5 mm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "par transmitido / carga (N·m)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Dos coronas de imanes y un modulador fijo transmiten par con velocidades opuestas.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La holgura reduce la capacidad de acoplamiento; el desfase magnético sostiene la carga.",
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
    "id": 237,
    "slug": "regulador-centrifugo-watt",
    "title": "Regulador centrífugo: realimentación mecánica",
    "longTitle": "Regulador centrífugo: realimentación mecánica",
    "intro": "Dos masas giratorias levantan una corredera que corrige la entrada de energía al motor.",
    "explore": "Un escalón de carga revela la caída de régimen y la recuperación del lazo mecánico.",
    "controls": [
      {
        "id": "bias",
        "label": "Apertura base de válvula",
        "min": 0.3,
        "max": 0.8,
        "step": 0.025,
        "unit": "",
        "decimals": 3
      },
      {
        "id": "gain",
        "label": "Ganancia de corredera",
        "min": 2,
        "max": 12,
        "step": 0.5,
        "unit": "m⁻¹",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Régimen final",
        "key": "rpm",
        "unit": "rpm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Caída de régimen",
        "key": "droop",
        "unit": "rpm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Establecimiento",
        "key": "settling",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Apertura instantánea",
        "key": "throttle",
        "unit": "%",
        "scale": 100,
        "decimals": 1
      }
    ],
    "task": "Mantén190–215 rpm finales, caída por escalón ≤12 rpm y establecimiento ≤3 s.",
    "equations": "Brazos l=0,2 m, relación de giro0,4. cosθ=clamp(g/(lωg²)); corredera y=0,5−0,4cosθ. Apertura u=clamp(u0−k(y−0,22)). Motor ideal: Jω̇=2u−Tcarga−0,015ω; J=0,15 kg·m². Carga0,6→0,9 N·m a3 s. RK4, paso0,002 s; establecimiento a2 % del cambio de régimen.",
    "limits": "Masas en equilibrio instantáneo: no incluye inercia de bolas, fricción de articulaciones, elasticidad, vapor ni hunting. Transitorio del eje sí integrado. El giro del regulador se ralentiza×1/10, pero la respuesta de velocidad se presenta en segundos físicos. Ensayos de12 s con reinicio de condiciones; no sintoniza un regulador real. La transmisión de la corredera a la válvula se representa esquemáticamente.",
    "source": "https://www.mech.kuleuven.be/en/tme/thermotechnisch-instituut/basisprincipes/Watt-regulator",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Qué hace que este regulador sea una realimentación?",
    "answers": [
      "El cambio de velocidad desplaza las masas y esa posición modifica la energía que entra al motor.",
      "La válvula sigue un temporizador que no recibe información del régimen.",
      "La velocidad se mantiene sólo porque las bolas almacenan toda la energía del motor.",
      "La carga de salida no modifica ninguna fuerza del mecanismo."
    ],
    "faults": [
      [
        "Sesgo incorrecto",
        "El régimen final queda fuera de la ventana.",
        "La apertura base desplaza el punto de trabajo."
      ],
      [
        "Ganancia débil",
        "La carga provoca una caída de régimen excesiva.",
        "La corredera corrige poco ante el cambio de velocidad."
      ],
      [
        "Modelo sobreinterpretado",
        "Se predice hunting de un regulador real con este banco.",
        "La dinámica de las masas no está incluida."
      ]
    ],
    "labels": "Eje · masas · brazos · corredera · horquilla · válvula · motor",
    "caption": "Giro×1/10 · respuesta del eje en tiempo físico · bolas cuasiestáticas",
    "tools": "Regulador de Watt, válvula enlazada y registro de respuesta a carga.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-237 · Mantén190–215 rpm finales, caída por escalón ≤12 rpm y establecimiento ≤3 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "régimen instantáneo / final (rpm)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Dos masas giratorias levantan una corredera que corrige la entrada de energía al motor.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Un escalón de carga revela la caída de régimen y la recuperación del lazo mecánico.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "inspectionDir": [
      0.35,
      0.08,
      1.6
    ]
  },
  {
    "id": 238,
    "slug": "cojinete-aerostatico-restrictor",
    "title": "Cojinete aerostático: película y restrictor",
    "longTitle": "Cojinete aerostático: película y restrictor",
    "intro": "Un disco gira sin contacto sobre una película de aire presurizada.",
    "explore": "El restrictor y la carga fijan el espesor de película, el consumo y la rigidez axial.",
    "controls": [
      {
        "id": "orifice",
        "label": "Diámetro equivalente del restrictor",
        "min": 0.2,
        "max": 0.6,
        "step": 0.025,
        "unit": "mm",
        "decimals": 3
      },
      {
        "id": "load",
        "label": "Carga axial",
        "min": 200,
        "max": 700,
        "step": 25,
        "unit": "N",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Película de aire",
        "key": "h",
        "unit": "µm",
        "scale": 1000000.0,
        "decimals": 2
      },
      {
        "label": "Presión del receso",
        "key": "pressure",
        "unit": "kPa",
        "scale": 0.001,
        "decimals": 1
      },
      {
        "label": "Consumo de aire libre",
        "key": "freeAir",
        "unit": "L/min",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Rigidez axial",
        "key": "stiffness",
        "unit": "N/µm",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Soporta ≥400 N con película8–16 µm, consumo ≤2 L/min y rigidez ≥70 N/µm.",
    "equations": "Receso Ri30 mm, exterior Ro40 mm, eje10 mm; presión de suministro300 kPa manométricos. Área efectiva integra presión uniforme de receso y descenso logarítmico de la pista. Pr=W/Aef. Restrictor Cr=2·10⁻¹¹(d/0,3)⁴; C=π/[6µln(Ro/Ri)], µ=1,8·10⁻⁵ Pa·s. Q=Cr(Ps−Pr)=Ch³Pr. K=3W(1−Pr/Ps)/h. Q se refiere a presión del receso; aire libre se obtiene por relación de presiones absolutas.",
    "limits": "Red equivalente linealizada de gas con coeficientes sintéticos; no resuelve Reynolds compresible, distribución 3D, estabilidad neumática o arranque. La presión logarítmica es la aproximación de película lineal usada para el área efectiva. Sin caudal real de fabricante. Película visual×1000; giro×1/200.",
    "source": "https://www.newwayairbearings.com/wp-content/uploads/2021/07/NWAB-Design-and-App-Guide-ver-12-2021.pdf",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué la restricción de entrada ayuda a sostener una película estable?",
    "answers": [
      "Porque relaciona el caudal de entrada con la presión del receso y la fuga sensible al espesor de película.",
      "La presión del receso siempre es igual al suministro, cualquiera que sea la fuga.",
      "La película mantiene igual caudal para cualquier separación.",
      "Abrir completamente la alimentación garantiza rigidez infinita sin consumo adicional."
    ],
    "faults": [
      [
        "Restrictor muy abierto",
        "El consumo excede el límite aunque exista separación.",
        "El paso de entrada aumenta el caudal requerido."
      ],
      [
        "Película demasiado fina",
        "La carga deja una separación bajo el margen requerido.",
        "El equilibrio de presión depende de la fuga cúbica."
      ],
      [
        "Rigidez insuficiente",
        "La separación cumple pero responde mucho a variaciones de carga.",
        "Película y rigidez son criterios diferentes."
      ]
    ],
    "labels": "Entrada · restrictor · receso · película · disco · eje · carga",
    "caption": "Película×1000 · giro×1/200 · red linealizada sintética",
    "tools": "Cojinete de aire seccionado, disco flotante y red de restricción.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-238 · Soporta ≥400 N con película8–16 µm, consumo ≤2 L/min y rigidez ≥70 N/µm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "espesor de película / cero (µm)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un disco gira sin contacto sobre una película de aire presurizada.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "El restrictor y la carga fijan el espesor de película, el consumo y la rigidez axial.",
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
    "id": 239,
    "slug": "robot-flexible-tendones",
    "title": "Robot flexible: curvatura y tendones",
    "longTitle": "Robot flexible: curvatura y tendones",
    "intro": "Una columna flexible curva su cuerpo con tendones y aproxima una herramienta a un objetivo.",
    "explore": "La diferencia de longitud fija el ángulo; el plano de tracción orienta la punta en el espacio.",
    "controls": [
      {
        "id": "pull",
        "label": "Diferencia de longitud antagonista",
        "min": 10,
        "max": 60,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "azimuth",
        "label": "Plano de curvatura",
        "min": 0,
        "max": 120,
        "step": 1,
        "unit": "°",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Error a máxima extensión",
        "key": "error",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fuerza diferencial",
        "key": "force",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Ángulo máximo",
        "key": "theta",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      },
      {
        "label": "Radio de curvatura",
        "key": "radius",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      }
    ],
    "task": "Alcanza el objetivo patrón con error ≤5 mm, fuerza diferencial ≤7 N y flexión máxima ≤90°.",
    "equations": "Columna inextensible L=0,3 m; tendones a r=20 mm. Diferencia antagonista Δl=2rθ; curvatura κ=θ/L. Rigidez EI=0,03 N·m² y momento equivalente Fr=EIκ. Punta: [R(1−cosθ)cosφ,Rsinθ,R(1−cosθ)sinφ]. Objetivo de banco (x,y,z)=(0.071776,0.247835,0.124319) m. Barrido de ensayo entre0,5 y1 de la flexión solicitada; error del reto en extensión máxima.",
    "limits": "Curvatura constante, sin fuerzas externas, estiramiento de tendones, torsión, fricción de guiado o hiperelasticidad. Fuerza diferencial de un par antagonista ideal, no tensión total de todos los cables. Objetivo conocido para practicar cinemática, no calibración oculta ni robot médico. Movimiento prescrito de ensayo en8 s.",
    "source": "https://www.opencontinuumrobotics.com/101/2022/12/09/tdcr-cc-model.html",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué es necesario controlar también el plano de curvatura?",
    "answers": [
      "Porque la misma flexión puede orientar la punta hacia direcciones espaciales distintas.",
      "La dirección de la punta queda determinada sólo por la longitud total de la columna.",
      "El mismo acortamiento fija una única posición para cualquier plano de tracción.",
      "El azimut modifica únicamente el color de la herramienta, sin efecto cinemático."
    ],
    "faults": [
      [
        "Tracción insuficiente",
        "La punta se queda corta respecto del objetivo.",
        "La diferencia de longitud determina el ángulo de flexión."
      ],
      [
        "Plano mal orientado",
        "La punta alcanza una distancia similar pero hacia otro lado.",
        "El azimut rota el plano del arco."
      ],
      [
        "Carga externa ignorada",
        "Se intenta predecir una postura cargada con la solución libre.",
        "La curvatura constante aquí no resuelve contacto ni carga externa."
      ]
    ],
    "labels": "Base · actuadores · tendones · discos · espina flexible · herramienta · objetivo",
    "caption": "Curvatura constante · barrido8 s · objetivo conocido",
    "tools": "Robot continuo de tendones, guías, herramienta y objetivo espacial.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-239 · Alcanza el objetivo patrón con error ≤5 mm, fuerza diferencial ≤7 N y flexión máxima ≤90°. Objetivo cartesiano: (71.78,247.84,124.32) mm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "flexión instantánea / máxima (°)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Una columna flexible curva su cuerpo con tendones y aproxima una herramienta a un objetivo.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La diferencia de longitud fija el ángulo; el plano de tracción orienta la punta en el espacio.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "inspectionDir": [
      0.5,
      0.5,
      1.5
    ]
  },
  {
    "id": 240,
    "slug": "plegado-chapa-recuperacion",
    "title": "Plegado de chapa: fuerza y recuperación elástica",
    "longTitle": "Plegado de chapa: fuerza y recuperación elástica",
    "intro": "Un punzón forma una chapa sobre una matriz en V y la pieza se abre ligeramente al descargar.",
    "explore": "La sobrecarrera compensa la recuperación, mientras la resistencia del material aumenta la fuerza exigida.",
    "controls": [
      {
        "id": "stroke",
        "label": "Carrera del punzón",
        "min": 5,
        "max": 10.5,
        "step": 0.025,
        "unit": "mm",
        "decimals": 3
      },
      {
        "id": "yield",
        "label": "Límite elástico del escenario",
        "min": 200,
        "max": 440,
        "step": 10,
        "unit": "MPa",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Ángulo después de descargar",
        "key": "released",
        "unit": "°",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fuerza de plegado",
        "key": "force",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Desarrollo del arco",
        "key": "allowance",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Factor de recuperación",
        "key": "spring",
        "unit": "mm⁻¹",
        "scale": 1,
        "decimals": 5
      }
    ],
    "task": "Obtén ángulo descargado89–91°, fuerza ≤5,5 kN, material ≥280 MPa y carrera ≤10 mm.",
    "equations": "Chapa100×80×1,5 mm; V18 mm, radio neutro R3,75 mm, E210000 MPa. Contactos geométricos: s=(V/2)tan a+R(1−sec a), β=2a. Curvatura elástica recuperada Δκ=3σy/(Et), aproximación de momento plástico. βlibre=β(1−RΔκ); Rlibre=R/(1−RΔκ), conserva longitud de arco. Fuerza equivalente F=1,42σy·80·1,5²/18. Desarrollo neutro=Rβ.",
    "limits": "Modelo reducido elástico perfectamente plástico, sin endurecimiento, fricción, anisotropía, espesor variable, fractura o tabla real de plegado. Coeficiente de fuerza del escenario; no se usa para ajustar una prensa real. Geometría neutra y longitud de100 mm conservadas. El retorno del punzón es prescrito; no hay FEM de contacto. Ciclo de8 s.",
    "source": "https://www.ssab.com/en/support/how-to-process/how-to-bend/bending/20-questions",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué suele requerirse sobreplegar antes de descargar?",
    "answers": [
      "Porque parte de la curvatura se recupera elásticamente cuando se retira la fuerza.",
      "Toda la deformación de una chapa metálica queda permanentemente fijada al retirar el punzón.",
      "La recuperación siempre cierra más la pieza y exige doblar menos de lo requerido.",
      "La fuerza de plegado es independiente del espesor y de la resistencia del material."
    ],
    "faults": [
      [
        "Carrera insuficiente",
        "La pieza queda demasiado abierta después de descargar.",
        "La flexión bajo carga no compensa la recuperación."
      ],
      [
        "Material muy resistente",
        "La fuerza excede la capacidad del escenario.",
        "La fuerza de plegado aumenta con el límite elástico."
      ],
      [
        "Sobrecarrera",
        "La pieza queda demasiado cerrada.",
        "Se impuso más curvatura de la necesaria para compensar el retorno."
      ]
    ],
    "labels": "Prensa · cilindro · punzón · matriz V · chapa · apoyos",
    "caption": "Longitud neutra conservada · recuperación ideal · ciclo8 s",
    "tools": "Plegadora abierta, punzón, matriz y chapa con recuperación elástica.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-240 · Obtén ángulo descargado89–91°, fuerza ≤5,5 kN, material ≥280 MPa y carrera ≤10 mm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "ángulo instantáneo / descargado (°)",
    "eyebrow": "Orden de trabajo · máquinas y procesos",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un punzón forma una chapa sobre una matriz en V y la pieza se abre ligeramente al descargar.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La sobrecarrera compensa la recuperación, mientras la resistencia del material aumenta la fuerza exigida.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "inspectionDir": [
      0.65,
      0.6,
      1.5
    ]
  }
];
