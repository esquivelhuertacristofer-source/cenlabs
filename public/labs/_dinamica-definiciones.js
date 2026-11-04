export const definitions = [
  {
    "id": 271,
    "slug": "masa-resorte-amortiguador-libre",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Vibración libre de un carro",
    "longTitle": "Vibración libre de un carro",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Cambia la masa y el amortiguamiento para llevar un carro perturbado al equilibrio.",
    "explore": "Manipula masa y amortiguamiento. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Masa",
        "min": 1,
        "max": 8,
        "step": 0.5,
        "unit": "kg",
        "decimals": 1
      },
      {
        "id": "b",
        "label": "Amortiguamiento",
        "min": 2,
        "max": 55,
        "step": 1,
        "unit": "N·s/m",
        "decimals": 0
      }
    ],
    "start": {
      "a": 2,
      "b": 3
    },
    "metrics": [
      {
        "label": "Frecuencia natural",
        "key": "m1",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Razón de amortiguamiento",
        "key": "m2",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Desplazamiento",
        "key": "m3",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Frecuencia natural",
        "m1",
        0.5,
        1.4,
        "Hz"
      ],
      [
        "Razón de amortiguamiento",
        "m2",
        0.9,
        1.1,
        ""
      ],
      [
        "Desplazamiento al final",
        "m3",
        -1,
        1,
        "mm"
      ]
    ],
    "task": "Frecuencia natural entre 0.5 y 1.4 Hz. Razón de amortiguamiento entre 0.9 y 1.1. Desplazamiento al final entre -1 y 1 mm.",
    "job": "OT-271 · El taller necesita un ajuste para que el carro vuelva al cero sin oscilaciones apreciables después de soltarlo desde 50 mm.",
    "equations": "m x″+c x′+100x=0. x(0)=50 mm y x′(0)=0. ζ=c/(2√km).",
    "limits": "Un grado de libertad, respuesta lineal y amortiguamiento viscoso.",
    "quiz": "¿Cuándo se alcanza el amortiguamiento crítico?",
    "answers": [
      "Cuando ζ es uno.",
      "Cuando el resorte desaparece.",
      "Cuando la masa deja de pesar.",
      "Cuando la frecuencia natural es cero."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa frecuencia natural.",
        "Modifica masa y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa razón de amortiguamiento.",
        "Modifica amortiguamiento con el primer mando fijo."
      ]
    ],
    "labels": "Masa, resorte helicoidal y amortiguador",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Masa, resorte helicoidal y amortiguador",
    "procedure": [
      "Identifica masa, resorte helicoidal y amortiguador en el banco.",
      "Registra un ensayo variando masa y amortiguamiento.",
      "Frecuencia natural entre 0.5 y 1.4 Hz. Razón de amortiguamiento entre 0.9 y 1.1. Desplazamiento al final entre -1 y 1 mm."
    ],
    "timeScale": 1,
    "signals": "Desplazamiento (mm)",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Frecuencia natural",
        "descripcion": "Lectura del banco en Hz."
      },
      {
        "icono": "⚙",
        "nombre": "Razón de amortiguamiento",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Desplazamiento al final",
        "descripcion": "Lectura del banco en mm."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Masa, resorte helicoidal y amortiguador",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "m x″+c x′+100x=0. x(0)=50 mm y x′(0)=0. ζ=c/(2√km).",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Frecuencia natural entre 0.5 y 1.4 Hz. Razón de amortiguamiento entre 0.9 y 1.1. Desplazamiento al final entre -1 y 1 mm.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 272,
    "slug": "resonancia-forzada-transmisibilidad",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Resonancia forzada y transmisibilidad",
    "longTitle": "Resonancia forzada y transmisibilidad",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Mueve la frecuencia del excitador y reconoce cuándo amplifica la fuerza que llega a la base.",
    "explore": "Manipula frecuencia relativa y amortiguamiento relativo. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Frecuencia relativa",
        "min": 0.5,
        "max": 3,
        "step": 0.05,
        "unit": "",
        "decimals": 2
      },
      {
        "id": "b",
        "label": "Amortiguamiento relativo",
        "min": 0.05,
        "max": 0.35,
        "step": 0.01,
        "unit": "",
        "decimals": 2
      }
    ],
    "start": {
      "a": 1,
      "b": 0.08
    },
    "metrics": [
      {
        "label": "Amplificación de desplazamiento",
        "key": "m1",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fuerza transmitida / excitación",
        "key": "m2",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Desfase",
        "key": "m3",
        "unit": "°",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Amplificación de desplazamiento",
        "m1",
        0,
        0.5,
        ""
      ],
      [
        "Fuerza transmitida / excitación",
        "m2",
        0,
        0.5,
        ""
      ],
      [
        "Desfase",
        "m3",
        120,
        180,
        "°"
      ]
    ],
    "task": "Amplificación de desplazamiento entre 0 y 0.5. Fuerza transmitida / excitación entre 0 y 0.5. Desfase entre 120 y 180 °.",
    "job": "OT-272 · El fabricante cambió el régimen de un excitador. Comprueba si la nueva frecuencia deja de amplificar la carga que recibe el anclaje.",
    "equations": "Con r=ω/ωn, D=√[(1−r²)²+(2ζr)²]. Amplificación 1/D y transmisibilidad de fuerza √[1+(2ζr)²]/D.",
    "limits": "Régimen armónico estacionario y rigidez lineal.",
    "quiz": "¿Qué magnitud da la carga que recibe la bancada?",
    "answers": [
      "El cociente de fuerza transmitida a fuerza excitadora.",
      "El ángulo entre los tornillos.",
      "La flecha estática dividida por el tiempo.",
      "El régimen del motor sin carga."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa amplificación de desplazamiento.",
        "Modifica frecuencia relativa y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa fuerza transmitida / excitación.",
        "Modifica amortiguamiento relativo con el primer mando fijo."
      ]
    ],
    "labels": "Excitador, carro y apoyo",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Excitador, carro y apoyo",
    "procedure": [
      "Identifica excitador, carro y apoyo en el banco.",
      "Registra un ensayo variando frecuencia relativa y amortiguamiento relativo.",
      "Amplificación de desplazamiento entre 0 y 0.5. Fuerza transmitida / excitación entre 0 y 0.5. Desfase entre 120 y 180 °."
    ],
    "timeScale": 1,
    "signals": "Respuesta y excitación (rel.)",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Amplificación de desplazamiento",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Fuerza transmitida / excitación",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Desfase",
        "descripcion": "Lectura del banco en °."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Excitador, carro y apoyo",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Con r=ω/ωn, D=√[(1−r²)²+(2ζr)²]. Amplificación 1/D y transmisibilidad de fuerza √[1+(2ζr)²]/D.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Amplificación de desplazamiento entre 0 y 0.5. Fuerza transmitida / excitación entre 0 y 0.5. Desfase entre 120 y 180 °.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 273,
    "slug": "velocidad-critica-rotor-giroscopico",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Velocidad crítica de rotor giroscópico",
    "longTitle": "Velocidad crítica de rotor giroscópico",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Cruza el mapa de velocidades y observa cómo se separan las ramas de precesión.",
    "explore": "Manipula velocidad de giro y acoplamiento giroscópico. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Velocidad de giro",
        "min": 300,
        "max": 2400,
        "step": 50,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Acoplamiento giroscópico",
        "min": 0,
        "max": 0.5,
        "step": 0.025,
        "unit": "",
        "decimals": 3
      }
    ],
    "start": {
      "a": 1600,
      "b": 0.05
    },
    "metrics": [
      {
        "label": "Amplitud de órbita",
        "key": "m1",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Rama directa equivalente",
        "key": "m2",
        "unit": "rpm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Rama inversa equivalente",
        "key": "m3",
        "unit": "rpm",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Amplitud de órbita",
        "m1",
        0,
        0.2,
        "mm"
      ],
      [
        "Rama directa equivalente",
        "m2",
        1580,
        2200,
        "rpm"
      ],
      [
        "Rama inversa equivalente",
        "m3",
        1000,
        1499,
        "rpm"
      ]
    ],
    "task": "Amplitud de órbita entre 0 y 0.2 mm. Rama directa equivalente entre 1580 y 2200 rpm. Rama inversa equivalente entre 1000 y 1499 rpm.",
    "job": "OT-273 · Antes de programar el variador, delimita una zona de giro donde la órbita esté controlada y las ramas de precesión se distingan.",
    "equations": "Modelo adimensional de rotor isotrópico. σ±=(√(4+g²r²)±gr)/2, r=Ω/Ω₀ y Ω₀=1500 rpm. Órbita estimada con una rama directa equivalente, ζ=0,07 y desequilibrio proporcional a r².",
    "limits": "Modelo modal didáctico y movimiento transversal isotrópico. La órbita usa una aproximación de rama dominante.",
    "quiz": "¿Dónde se aproxima la velocidad crítica síncrona?",
    "answers": [
      "Donde la velocidad de giro intersecta la rama directa.",
      "Donde ambas ramas equivalen a cero.",
      "Donde el factor de amortiguamiento alcanza uno.",
      "En la mínima velocidad del motor."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa amplitud de órbita.",
        "Modifica velocidad de giro y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa rama directa equivalente.",
        "Modifica acoplamiento giroscópico con el primer mando fijo."
      ]
    ],
    "labels": "Rotor, discos, apoyos y órbita",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Rotor, discos, apoyos y órbita",
    "procedure": [
      "Identifica rotor, discos, apoyos y órbita en el banco.",
      "Registra un ensayo variando velocidad de giro y acoplamiento giroscópico.",
      "Amplitud de órbita entre 0 y 0.2 mm. Rama directa equivalente entre 1580 y 2200 rpm. Rama inversa equivalente entre 1000 y 1499 rpm."
    ],
    "timeScale": 1,
    "signals": "Órbita (mm)",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Amplitud de órbita",
        "descripcion": "Lectura del banco en mm."
      },
      {
        "icono": "⚙",
        "nombre": "Rama directa equivalente",
        "descripcion": "Lectura del banco en rpm."
      },
      {
        "icono": "⚙",
        "nombre": "Rama inversa equivalente",
        "descripcion": "Lectura del banco en rpm."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Rotor, discos, apoyos y órbita",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Modelo adimensional de rotor isotrópico. σ±=(√(4+g²r²)±gr)/2, r=Ω/Ω₀ y Ω₀=1500 rpm. Órbita estimada con una rama directa equivalente, ζ=0,07 y desequilibrio proporcional a r².",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Amplitud de órbita entre 0 y 0.2 mm. Rama directa equivalente entre 1580 y 2200 rpm. Rama inversa equivalente entre 1000 y 1499 rpm.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 274,
    "slug": "absorbedor-dinamico-sintonizado",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Absorbedor dinámico sintonizado",
    "longTitle": "Absorbedor dinámico sintonizado",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Sintoniza la masa secundaria para descargar la máquina sin multiplicar el recorrido del absorbedor.",
    "explore": "Manipula frecuencia del absorbedor y masa relativa. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Frecuencia del absorbedor",
        "min": 0.65,
        "max": 1.35,
        "step": 0.01,
        "unit": "rel.",
        "decimals": 2
      },
      {
        "id": "b",
        "label": "Masa relativa",
        "min": 0.06,
        "max": 0.3,
        "step": 0.01,
        "unit": "",
        "decimals": 2
      }
    ],
    "start": {
      "a": 0.82,
      "b": 0.08
    },
    "metrics": [
      {
        "label": "Amplitud principal",
        "key": "m1",
        "unit": "rel.",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Amplitud secundaria",
        "key": "m2",
        "unit": "rel.",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Razón de masa",
        "key": "m3",
        "unit": "",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Amplitud principal",
        "m1",
        0,
        0.4,
        "rel."
      ],
      [
        "Amplitud secundaria",
        "m2",
        0,
        6,
        "rel."
      ],
      [
        "Razón de masa",
        "m3",
        0.15,
        0.3,
        ""
      ]
    ],
    "task": "Amplitud principal entre 0 y 0.4 rel.. Amplitud secundaria entre 0 y 6 rel.. Razón de masa entre 0.15 y 0.3.",
    "job": "OT-274 · Una máquina debe operar a su frecuencia de servicio. Sintoniza un absorbedor y confirma que su carrera quede dentro del espacio disponible.",
    "equations": "Rigideces k₁=1 y k₂=μr². A ω=1, se resuelve la matriz dinámica compleja con masas 1 y μ, y c₁=0,1. El absorbedor ideal carece de amortiguador propio.",
    "limits": "Acoplamiento lineal y excitación sinusoidal, sin topes.",
    "quiz": "¿Qué pieza absorbe el movimiento al sintonizar?",
    "answers": [
      "La masa secundaria se mueve mientras la primaria queda casi inmóvil.",
      "La base pierde rigidez automáticamente.",
      "El excitador se apaga.",
      "Ambas masas quedan inmóviles para cualquier frecuencia."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa amplitud principal.",
        "Modifica frecuencia del absorbedor y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa amplitud secundaria.",
        "Modifica masa relativa con el primer mando fijo."
      ]
    ],
    "labels": "Masa primaria, absorbedor y resortes",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Masa primaria, absorbedor y resortes",
    "procedure": [
      "Identifica masa primaria, absorbedor y resortes en el banco.",
      "Registra un ensayo variando frecuencia del absorbedor y masa relativa.",
      "Amplitud principal entre 0 y 0.4 rel.. Amplitud secundaria entre 0 y 6 rel.. Razón de masa entre 0.15 y 0.3."
    ],
    "timeScale": 1,
    "signals": "Recorridos de ambas masas",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Amplitud principal",
        "descripcion": "Lectura del banco en rel.."
      },
      {
        "icono": "⚙",
        "nombre": "Amplitud secundaria",
        "descripcion": "Lectura del banco en rel.."
      },
      {
        "icono": "⚙",
        "nombre": "Razón de masa",
        "descripcion": "Indicador del ensayo."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Masa primaria, absorbedor y resortes",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Rigideces k₁=1 y k₂=μr². A ω=1, se resuelve la matriz dinámica compleja con masas 1 y μ, y c₁=0,1. El absorbedor ideal carece de amortiguador propio.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Amplitud principal entre 0 y 0.4 rel.. Amplitud secundaria entre 0 y 6 rel.. Razón de masa entre 0.15 y 0.3.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 275,
    "slug": "balanceo-ciguenal-cuatro-cilindros",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Balanceo de un cigüeñal de cuatro cilindros",
    "longTitle": "Balanceo de un cigüeñal de cuatro cilindros",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Ajusta el desfase entre pares y compara las fuerzas alternativas de dos órdenes.",
    "explore": "Manipula régimen y desfase entre pares. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Régimen",
        "min": 600,
        "max": 3600,
        "step": 100,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Desfase entre pares",
        "min": 0,
        "max": 90,
        "step": 5,
        "unit": "°",
        "decimals": 0
      }
    ],
    "start": {
      "a": 1800,
      "b": 0
    },
    "metrics": [
      {
        "label": "Fuerza de primer orden",
        "key": "m1",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fuerza de segundo orden",
        "key": "m2",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Régimen comprobado",
        "key": "m3",
        "unit": "rpm",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Fuerza de primer orden",
        "m1",
        0,
        0.01,
        "N"
      ],
      [
        "Fuerza de segundo orden",
        "m2",
        0,
        100,
        "N"
      ],
      [
        "Régimen comprobado",
        "m3",
        1800,
        2800,
        "rpm"
      ]
    ],
    "task": "Fuerza de primer orden entre 0 y 0.01 N. Fuerza de segundo orden entre 0 y 100 N. Régimen comprobado entre 1800 y 2800 rpm.",
    "job": "OT-275 · Revisa el calado de un prototipo de cuatro cilindros. El banco tiene que cumplir el presupuesto de fuerzas alternativas en el intervalo de trabajo.",
    "equations": "Suma fasorial de cos θ y (r/L) cos 2θ con fases 0, π, π+β, β. Fuerzas escaladas por m r Ω². m=0,45 kg, r=45 mm y r/L=0,30.",
    "limits": "Fuerzas alternativas agregadas. Se omiten momentos, torsión y combustión.",
    "quiz": "¿Qué se cancela con dos pares opuestos y desfasados 90°?",
    "answers": [
      "Las sumas de las fuerzas de primer y segundo orden del modelo.",
      "Se cancelan todos los momentos del cigüeñal.",
      "Solo desaparece la fuerza del segundo orden.",
      "La fuerza de primer orden se duplica."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa fuerza de primer orden.",
        "Modifica régimen y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa fuerza de segundo orden.",
        "Modifica desfase entre pares con el primer mando fijo."
      ]
    ],
    "labels": "Cigüeñal, manivelas y cuatro pistones",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Cigüeñal, manivelas y cuatro pistones",
    "procedure": [
      "Identifica cigüeñal, manivelas y cuatro pistones en el banco.",
      "Registra un ensayo variando régimen y desfase entre pares.",
      "Fuerza de primer orden entre 0 y 0.01 N. Fuerza de segundo orden entre 0 y 100 N. Régimen comprobado entre 1800 y 2800 rpm."
    ],
    "timeScale": 1,
    "signals": "Fuerza de inercia (N)",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Fuerza de primer orden",
        "descripcion": "Lectura del banco en N."
      },
      {
        "icono": "⚙",
        "nombre": "Fuerza de segundo orden",
        "descripcion": "Lectura del banco en N."
      },
      {
        "icono": "⚙",
        "nombre": "Régimen comprobado",
        "descripcion": "Lectura del banco en rpm."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Cigüeñal, manivelas y cuatro pistones",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Suma fasorial de cos θ y (r/L) cos 2θ con fases 0, π, π+β, β. Fuerzas escaladas por m r Ω². m=0,45 kg, r=45 mm y r/L=0,30.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Fuerza de primer orden entre 0 y 0.01 N. Fuerza de segundo orden entre 0 y 100 N. Régimen comprobado entre 1800 y 2800 rpm.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 276,
    "slug": "aislamiento-vibratorio-maquina",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Aislamiento vibratorio de máquina",
    "longTitle": "Aislamiento vibratorio de máquina",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Elige apoyos para reducir la fuerza transmitida y respetar el hundimiento estático permitido.",
    "explore": "Manipula rigidez total y amortiguamiento relativo. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Rigidez total",
        "min": 30,
        "max": 300,
        "step": 5,
        "unit": "kN/m",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Amortiguamiento relativo",
        "min": 0.05,
        "max": 0.35,
        "step": 0.01,
        "unit": "",
        "decimals": 2
      }
    ],
    "start": {
      "a": 240,
      "b": 0.25
    },
    "metrics": [
      {
        "label": "Fuerza transmitida / excitación",
        "key": "m1",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Flecha estática",
        "key": "m2",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Frecuencia natural",
        "key": "m3",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Fuerza transmitida / excitación",
        "m1",
        0,
        0.55,
        ""
      ],
      [
        "Flecha estática",
        "m2",
        0,
        8,
        "mm"
      ],
      [
        "Frecuencia natural",
        "m3",
        4,
        7,
        "Hz"
      ]
    ],
    "task": "Fuerza transmitida / excitación entre 0 y 0.55. Flecha estática entre 0 y 8 mm. Frecuencia natural entre 4 y 7 Hz.",
    "job": "OT-276 · Selecciona soportes de una máquina de 48 kg instalada sobre una plataforma ligera. El montaje tiene tolerancia tanto a fuerza dinámica como a hundimiento.",
    "equations": "Máquina de 48 kg a 12 Hz. fₙ=√(k/m)/(2π), flecha mg/k y transmisibilidad √[1+(2ζr)²]/√[(1−r²)²+(2ζr)²].",
    "limits": "Excitación armónica y rigidez equivalente. El movimiento visual se amplifica.",
    "quiz": "¿Qué coste tiene reducir demasiado la rigidez?",
    "answers": [
      "Aumenta la flecha estática bajo el peso.",
      "El peso disminuye al aumentar la flecha.",
      "La frecuencia natural se duplica siempre.",
      "Desaparece el amortiguamiento."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa fuerza transmitida / excitación.",
        "Modifica rigidez total y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa flecha estática.",
        "Modifica amortiguamiento relativo con el primer mando fijo."
      ]
    ],
    "labels": "Máquina, aisladores y placa de reacción",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Máquina, aisladores y placa de reacción",
    "procedure": [
      "Identifica máquina, aisladores y placa de reacción en el banco.",
      "Registra un ensayo variando rigidez total y amortiguamiento relativo.",
      "Fuerza transmitida / excitación entre 0 y 0.55. Flecha estática entre 0 y 8 mm. Frecuencia natural entre 4 y 7 Hz."
    ],
    "timeScale": 1,
    "signals": "Fuerza normalizada",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Fuerza transmitida / excitación",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Flecha estática",
        "descripcion": "Lectura del banco en mm."
      },
      {
        "icono": "⚙",
        "nombre": "Frecuencia natural",
        "descripcion": "Lectura del banco en Hz."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Máquina, aisladores y placa de reacción",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Máquina de 48 kg a 12 Hz. fₙ=√(k/m)/(2π), flecha mg/k y transmisibilidad √[1+(2ζr)²]/√[(1−r²)²+(2ζr)²].",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Fuerza transmitida / excitación entre 0 y 0.55. Flecha estática entre 0 y 8 mm. Frecuencia natural entre 4 y 7 Hz.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 277,
    "slug": "modos-propios-viga-voladizo",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Análisis modal de una viga en voladizo",
    "longTitle": "Análisis modal de una viga en voladizo",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Cambia la longitud y mide cómo se desplaza la segunda frecuencia natural.",
    "explore": "Manipula longitud y modo. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Longitud",
        "min": 0.5,
        "max": 1.5,
        "step": 0.05,
        "unit": "m",
        "decimals": 2
      },
      {
        "id": "b",
        "label": "Modo",
        "min": 1,
        "max": 3,
        "step": 1,
        "unit": "",
        "decimals": 0
      }
    ],
    "start": {
      "a": 1.2,
      "b": 1
    },
    "metrics": [
      {
        "label": "Frecuencia modal",
        "key": "m1",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Longitud de la probeta",
        "key": "m2",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Modo solicitado",
        "key": "m3",
        "unit": "",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Frecuencia modal",
        "m1",
        45,
        80,
        "Hz"
      ],
      [
        "Longitud de la probeta",
        "m2",
        0.8,
        1.2,
        "m"
      ],
      [
        "Modo solicitado",
        "m3",
        2,
        2,
        ""
      ]
    ],
    "task": "Frecuencia modal entre 45 y 80 Hz. Longitud de la probeta entre 0.8 y 1.2 m. Modo solicitado = 2.",
    "job": "OT-277 · El taller cambia la longitud de la probeta. Comprueba si el segundo modo queda dentro del intervalo que puede medir el equipo de ensayo.",
    "equations": "Euler–Bernoulli: f=β²√(EI/ρA)/(2πL²), β=1,8751; 4,6941; 7,8548. Acero E=200 GPa, ρ=7850 kg/m³, espesor 12 mm.",
    "limits": "Viga uniforme de Euler–Bernoulli. La escena escala la amplitud y ralentiza la frecuencia.",
    "quiz": "¿Qué pasa con la frecuencia al duplicar L?",
    "answers": [
      "Se reduce a una cuarta parte en el mismo modo.",
      "Se duplica en el mismo modo.",
      "Permanece constante si es el mismo material.",
      "Se reduce a la mitad."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa frecuencia modal.",
        "Modifica longitud y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa longitud de la probeta.",
        "Modifica modo con el primer mando fijo."
      ]
    ],
    "labels": "Empotramiento, viga y forma modal",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Empotramiento, viga y forma modal",
    "procedure": [
      "Identifica empotramiento, viga y forma modal en el banco.",
      "Registra un ensayo variando longitud y modo.",
      "Frecuencia modal entre 45 y 80 Hz. Longitud de la probeta entre 0.8 y 1.2 m. Modo solicitado = 2."
    ],
    "timeScale": 1,
    "signals": "Forma modal normalizada",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Frecuencia modal",
        "descripcion": "Lectura del banco en Hz."
      },
      {
        "icono": "⚙",
        "nombre": "Longitud de la probeta",
        "descripcion": "Lectura del banco en m."
      },
      {
        "icono": "⚙",
        "nombre": "Modo solicitado",
        "descripcion": "Indicador del ensayo."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Empotramiento, viga y forma modal",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Euler–Bernoulli: f=β²√(EI/ρA)/(2πL²), β=1,8751; 4,6941; 7,8548. Acero E=200 GPa, ρ=7850 kg/m³, espesor 12 mm.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Frecuencia modal entre 45 y 80 Hz. Longitud de la probeta entre 0.8 y 1.2 m. Modo solicitado = 2.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 278,
    "slug": "orbita-eje-holgura-cojinete",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Órbita de eje y holgura radial",
    "longTitle": "Órbita de eje y holgura radial",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Reduce la excursión de la órbita para conservar un margen antes de rozar el cojinete.",
    "explore": "Manipula holgura radial y órbita libre solicitada. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Holgura radial",
        "min": 20,
        "max": 100,
        "step": 5,
        "unit": "µm",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Órbita libre solicitada",
        "min": 10,
        "max": 130,
        "step": 5,
        "unit": "µm",
        "decimals": 0
      }
    ],
    "start": {
      "a": 35,
      "b": 80
    },
    "metrics": [
      {
        "label": "Holgura",
        "key": "m1",
        "unit": "µm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Órbita efectiva",
        "key": "m2",
        "unit": "µm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Margen radial",
        "key": "m3",
        "unit": "µm",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Holgura",
        "m1",
        45,
        80,
        "µm"
      ],
      [
        "Órbita efectiva",
        "m2",
        25,
        50,
        "µm"
      ],
      [
        "Margen radial",
        "m3",
        10,
        50,
        "µm"
      ]
    ],
    "task": "Holgura entre 45 y 80 µm. Órbita efectiva entre 25 y 50 µm. Margen radial entre 10 y 50 µm.",
    "job": "OT-278 · Verifica un cojinete de prueba cuyo eje presenta una órbita conocida. Conserva espacio radial sin exceder la holgura de montaje admitida.",
    "equations": "Modelo cinemático: radio efectivo min(e,c). Margen radial c−e, negativo cuando la órbita libre rebasa el casquillo. El centro recorre una circunferencia, sin resolver fuerzas de contacto ni dinámica de película.",
    "limits": "Órbita geométrica prescrita. Se omiten presión del aceite y desgaste.",
    "quiz": "¿Qué indica que la órbita libre supere la holgura?",
    "answers": [
      "Que el desplazamiento solicitado alcanzaría la superficie del cojinete.",
      "La viscosidad necesariamente se duplica.",
      "La holgura real aumenta.",
      "El eje pierde masa de forma instantánea."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa holgura.",
        "Modifica holgura radial y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa órbita efectiva.",
        "Modifica órbita libre solicitada con el primer mando fijo."
      ]
    ],
    "labels": "Eje, casquillo y órbita transversal",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Eje, casquillo y órbita transversal",
    "procedure": [
      "Identifica eje, casquillo y órbita transversal en el banco.",
      "Registra un ensayo variando holgura radial y órbita libre solicitada.",
      "Holgura entre 45 y 80 µm. Órbita efectiva entre 25 y 50 µm. Margen radial entre 10 y 50 µm."
    ],
    "timeScale": 1,
    "signals": "Órbita X/Y (µm)",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Holgura",
        "descripcion": "Lectura del banco en µm."
      },
      {
        "icono": "⚙",
        "nombre": "Órbita efectiva",
        "descripcion": "Lectura del banco en µm."
      },
      {
        "icono": "⚙",
        "nombre": "Margen radial",
        "descripcion": "Lectura del banco en µm."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Eje, casquillo y órbita transversal",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Modelo cinemático: radio efectivo min(e,c). Margen radial c−e, negativo cuando la órbita libre rebasa el casquillo. El centro recorre una circunferencia, sin resolver fuerzas de contacto ni dinámica de película.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Holgura entre 45 y 80 µm. Órbita efectiva entre 25 y 50 µm. Margen radial entre 10 y 50 µm.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 279,
    "slug": "impacto-restitucion-energia",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Impacto, restitución y energía",
    "longTitle": "Impacto, restitución y energía",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Ajusta la altura de caída y el material de contacto para contener el rebote sin perder energía de ensayo.",
    "explore": "Manipula altura de caída y coeficiente de restitución. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Altura de caída",
        "min": 0.2,
        "max": 1.4,
        "step": 0.05,
        "unit": "m",
        "decimals": 2
      },
      {
        "id": "b",
        "label": "Coeficiente de restitución",
        "min": 0.15,
        "max": 0.95,
        "step": 0.05,
        "unit": "",
        "decimals": 2
      }
    ],
    "start": {
      "a": 1.2,
      "b": 0.85
    },
    "metrics": [
      {
        "label": "Velocidad antes del impacto",
        "key": "m1",
        "unit": "m/s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Altura de rebote",
        "key": "m2",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Energía disipada",
        "key": "m3",
        "unit": "J",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Velocidad antes del impacto",
        "m1",
        3,
        5,
        "m/s"
      ],
      [
        "Altura de rebote",
        "m2",
        0,
        0.25,
        "m"
      ],
      [
        "Energía disipada",
        "m3",
        10,
        20,
        "J"
      ]
    ],
    "task": "Velocidad antes del impacto entre 3 y 5 m/s. Altura de rebote entre 0 y 0.25 m. Energía disipada entre 10 y 20 J.",
    "job": "OT-279 · Regula un ensayo de caída sobre una placa instrumentada. El impacto debe entregar energía medible y mantener el rebote dentro de la guía.",
    "equations": "Masa de 2 kg y caída sin rozamiento. v=√(2gh), rebote a e·v, altura e²h y energía disipada 2gh(1−e²). La escena ralentiza caída y rebote en escalas distintas.",
    "limits": "Impacto vertical, placa rígida y un rebote visible. La escena ralentiza ambos tramos.",
    "quiz": "¿Qué fracción de la energía cinética se conserva?",
    "answers": [
      "El cuadrado del coeficiente de restitución.",
      "El coeficiente de restitución multiplicado por dos.",
      "La mitad de la altura de caída.",
      "El inverso del coeficiente de restitución."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa velocidad antes del impacto.",
        "Modifica altura de caída y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa altura de rebote.",
        "Modifica coeficiente de restitución con el primer mando fijo."
      ]
    ],
    "labels": "Guías, percutor y placa de impacto",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Guías, percutor y placa de impacto",
    "procedure": [
      "Identifica guías, percutor y placa de impacto en el banco.",
      "Registra un ensayo variando altura de caída y coeficiente de restitución.",
      "Velocidad antes del impacto entre 3 y 5 m/s. Altura de rebote entre 0 y 0.25 m. Energía disipada entre 10 y 20 J."
    ],
    "timeScale": 1,
    "signals": "Altura (m)",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Velocidad antes del impacto",
        "descripcion": "Lectura del banco en m/s."
      },
      {
        "icono": "⚙",
        "nombre": "Altura de rebote",
        "descripcion": "Lectura del banco en m."
      },
      {
        "icono": "⚙",
        "nombre": "Energía disipada",
        "descripcion": "Lectura del banco en J."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Guías, percutor y placa de impacto",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Masa de 2 kg y caída sin rozamiento. v=√(2gh), rebote a e·v, altura e²h y energía disipada 2gh(1−e²). La escena ralentiza caída y rebote en escalas distintas.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Velocidad antes del impacto entre 3 y 5 m/s. Altura de rebote entre 0 y 0.25 m. Energía disipada entre 10 y 20 J.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 280,
    "slug": "volante-inercia-fluctuacion-ciclica",
    "module": "Vibraciones y Dinámica de Máquinas",
    "area": "VIBRACIONES",
    "title": "Volante de inercia y fluctuación cíclica",
    "longTitle": "Volante de inercia y fluctuación cíclica",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Dimensiona la inercia para mantener el régimen dentro de tolerancia bajo una carga pulsante.",
    "explore": "Manipula inercia y fluctuación de energía. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Inercia",
        "min": 0.1,
        "max": 1.2,
        "step": 0.05,
        "unit": "kg·m²",
        "decimals": 2
      },
      {
        "id": "b",
        "label": "Fluctuación de energía",
        "min": 4,
        "max": 20,
        "step": 1,
        "unit": "J",
        "decimals": 0
      }
    ],
    "start": {
      "a": 0.25,
      "b": 18
    },
    "metrics": [
      {
        "label": "Fluctuación pico a pico",
        "key": "m1",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Energía de referencia",
        "key": "m2",
        "unit": "J",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Variación pico a pico",
        "key": "m3",
        "unit": "rpm",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Fluctuación pico a pico",
        "m1",
        0,
        6,
        "%"
      ],
      [
        "Energía de referencia",
        "m2",
        0,
        125,
        "J"
      ],
      [
        "Variación pico a pico",
        "m3",
        0,
        9,
        "rpm"
      ]
    ],
    "task": "Fluctuación pico a pico entre 0 y 6 %. Energía de referencia entre 0 y 125 J. Variación pico a pico entre 0 y 9 rpm.",
    "job": "OT-280 · Dimensiona un volante para una máquina con demanda pulsante. La variación de régimen y la energía almacenada tienen límites de operación.",
    "equations": "Con ω₀=150 rpm, ω=√(ω₀²+(ΔE/J)sen θ). ΔE es la diferencia entre energías extremas. Fluctuación =100(ωmáx−ωmín)/ω₀.",
    "limits": "Intercambio periódico de energía prescrito. Se omiten rozamiento y torsión.",
    "quiz": "¿Cómo cambia la fluctuación al aumentar J?",
    "answers": [
      "Disminuye con la misma variación de energía.",
      "Aumenta linealmente con la inercia.",
      "Se mantiene porque la carga es periódica.",
      "Pasa a depender solo del diámetro de la bancada."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa fluctuación pico a pico.",
        "Modifica inercia y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa energía de referencia.",
        "Modifica fluctuación de energía con el primer mando fijo."
      ]
    ],
    "labels": "Eje, volante y perfil de carga",
    "caption": "Movimiento amplificado en el banco",
    "tools": "Eje, volante y perfil de carga",
    "procedure": [
      "Identifica eje, volante y perfil de carga en el banco.",
      "Registra un ensayo variando inercia y fluctuación de energía.",
      "Fluctuación pico a pico entre 0 y 6 %. Energía de referencia entre 0 y 125 J. Variación pico a pico entre 0 y 9 rpm."
    ],
    "timeScale": 1,
    "signals": "Velocidad angular (rad/s)",
    "sourceName": "MIT OpenCourseWare · Engineering Dynamics",
    "source": "https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Fluctuación pico a pico",
        "descripcion": "Lectura del banco en %."
      },
      {
        "icono": "⚙",
        "nombre": "Energía de referencia",
        "descripcion": "Lectura del banco en J."
      },
      {
        "icono": "⚙",
        "nombre": "Variación pico a pico",
        "descripcion": "Lectura del banco en rpm."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Eje, volante y perfil de carga",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Con ω₀=150 rpm, ω=√(ω₀²+(ΔE/J)sen θ). ΔE es la diferencia entre energías extremas. Fluctuación =100(ωmáx−ωmín)/ω₀.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Fluctuación pico a pico entre 0 y 6 %. Energía de referencia entre 0 y 125 J. Variación pico a pico entre 0 y 9 rpm.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 281,
    "slug": "intercambiador-contracorriente-ntu",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Intercambiador a contracorriente por NTU",
    "longTitle": "Intercambiador a contracorriente por NTU",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Ajusta el intercambio para enfriar la línea caliente sin exceder la temperatura de retorno.",
    "explore": "Manipula número de unidades de transferencia y razón de capacidades. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Número de unidades de transferencia",
        "min": 0.5,
        "max": 4,
        "step": 0.1,
        "unit": "",
        "decimals": 1
      },
      {
        "id": "b",
        "label": "Razón de capacidades",
        "min": 0.2,
        "max": 1,
        "step": 0.05,
        "unit": "",
        "decimals": 2
      }
    ],
    "start": {
      "a": 1,
      "b": 0.95
    },
    "metrics": [
      {
        "label": "Efectividad",
        "key": "m1",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Salida caliente",
        "key": "m2",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Salida fría",
        "key": "m3",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Efectividad",
        "m1",
        75,
        87,
        "%"
      ],
      [
        "Salida caliente",
        "m2",
        27,
        36,
        "°C"
      ],
      [
        "Salida fría",
        "m3",
        45,
        56,
        "°C"
      ]
    ],
    "task": "Efectividad entre 75 y 87 %. Salida caliente entre 27 y 36 °C. Salida fría entre 45 y 56 °C.",
    "job": "OT-281 · Recupera calor en una línea de proceso. La corriente caliente debe bajar de temperatura y el retorno frío tiene un intervalo permitido.",
    "equations": "ε=(1−e^(−NTU(1−Cr)))/(1−Cr·e^(−NTU(1−Cr))); a Cr=1, ε=NTU/(1+NTU). Cmin corresponde al flujo caliente. Entradas 80 y 20 °C. Balance sin pérdidas.",
    "limits": "Corrientes monofásicas y propiedades constantes.",
    "quiz": "¿Qué cambia al aumentar NTU con Cr fijo?",
    "answers": [
      "La efectividad aumenta y tiende a un límite.",
      "La efectividad cae.",
      "La entrada caliente debe enfriarse por sí sola.",
      "Ambos fluidos salen siempre a igual temperatura."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa efectividad.",
        "Modifica número de unidades de transferencia y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa salida caliente.",
        "Modifica razón de capacidades con el primer mando fijo."
      ]
    ],
    "labels": "Tubos a contracorriente, colectores y perfil térmico",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Tubos a contracorriente, colectores y perfil térmico",
    "procedure": [
      "Identifica tubos a contracorriente, colectores y perfil térmico en el banco.",
      "Registra un ensayo variando número de unidades de transferencia y razón de capacidades.",
      "Efectividad entre 75 y 87 %. Salida caliente entre 27 y 36 °C. Salida fría entre 45 y 56 °C."
    ],
    "timeScale": 1,
    "signals": "Temperaturas (°C)",
    "sourceName": "Lienhard · A Heat Transfer Textbook",
    "source": "https://ahtt.mit.edu/wp-content/uploads/2024/04/AHTTv600.pdf",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Efectividad",
        "descripcion": "Lectura del banco en %."
      },
      {
        "icono": "⚙",
        "nombre": "Salida caliente",
        "descripcion": "Lectura del banco en °C."
      },
      {
        "icono": "⚙",
        "nombre": "Salida fría",
        "descripcion": "Lectura del banco en °C."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Tubos a contracorriente, colectores y perfil térmico",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "ε=(1−e^(−NTU(1−Cr)))/(1−Cr·e^(−NTU(1−Cr))); a Cr=1, ε=NTU/(1+NTU). Cmin corresponde al flujo caliente. Entradas 80 y 20 °C. Balance sin pérdidas.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Efectividad entre 75 y 87 %. Salida caliente entre 27 y 36 °C. Salida fría entre 45 y 56 °C.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 282,
    "slug": "aleta-enfriamiento-eficiencia",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Aleta de enfriamiento y eficiencia",
    "longTitle": "Aleta de enfriamiento y eficiencia",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Compara conductividad y convección para retirar calor manteniendo una punta suficientemente activa.",
    "explore": "Manipula conductividad y convección. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Conductividad",
        "min": 20,
        "max": 240,
        "step": 10,
        "unit": "W/(m·K)",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Convección",
        "min": 10,
        "max": 100,
        "step": 5,
        "unit": "W/(m²·K)",
        "decimals": 0
      }
    ],
    "start": {
      "a": 40,
      "b": 80
    },
    "metrics": [
      {
        "label": "Eficiencia",
        "key": "m1",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Temperatura en punta",
        "key": "m2",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Calor por aleta",
        "key": "m3",
        "unit": "W",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Eficiencia",
        "m1",
        65,
        82,
        "%"
      ],
      [
        "Temperatura en punta",
        "m2",
        58,
        75,
        "°C"
      ],
      [
        "Calor por aleta",
        "m3",
        20,
        32,
        "W"
      ]
    ],
    "task": "Eficiencia entre 65 y 82 %. Temperatura en punta entre 58 y 75 °C. Calor por aleta entre 20 y 32 W.",
    "job": "OT-282 · Compara materiales para el disipador de un módulo de potencia. Entrega calor suficiente sin que la punta quede prácticamente a temperatura ambiente.",
    "equations": "Aleta plana de 85×60×3 mm, base a 100 °C, aire a 22 °C. Se aproximan las caras anchas y una punta adiabática. m=√(2h/(kt)); η=tanh(mL)/(mL).",
    "limits": "Se omite radiación y conducción por el borde.",
    "quiz": "¿Qué aproxima una punta adiabática?",
    "answers": [
      "Que el calor sale principalmente por las caras de la aleta.",
      "Que el metal no conduce.",
      "Que las caras laterales están aisladas.",
      "Que la punta está a la temperatura de la base."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa eficiencia.",
        "Modifica conductividad y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa temperatura en punta.",
        "Modifica convección con el primer mando fijo."
      ]
    ],
    "labels": "Placa caliente, siete aletas y mapa térmico",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Placa caliente, siete aletas y mapa térmico",
    "procedure": [
      "Identifica placa caliente, siete aletas y mapa térmico en el banco.",
      "Registra un ensayo variando conductividad y convección.",
      "Eficiencia entre 65 y 82 %. Temperatura en punta entre 58 y 75 °C. Calor por aleta entre 20 y 32 W."
    ],
    "timeScale": 1,
    "signals": "Temperatura de aleta (°C)",
    "sourceName": "Lienhard · A Heat Transfer Textbook",
    "source": "https://ahtt.mit.edu/wp-content/uploads/2024/04/AHTTv600.pdf",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Eficiencia",
        "descripcion": "Lectura del banco en %."
      },
      {
        "icono": "⚙",
        "nombre": "Temperatura en punta",
        "descripcion": "Lectura del banco en °C."
      },
      {
        "icono": "⚙",
        "nombre": "Calor por aleta",
        "descripcion": "Lectura del banco en W."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Placa caliente, siete aletas y mapa térmico",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Aleta plana de 85×60×3 mm, base a 100 °C, aire a 22 °C. Se aproximan las caras anchas y una punta adiabática. m=√(2h/(kt)); η=tanh(mL)/(mL).",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Eficiencia entre 65 y 82 %. Temperatura en punta entre 58 y 75 °C. Calor por aleta entre 20 y 32 W.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 283,
    "slug": "ciclo-rankine-presion-sobrecalentamiento",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Ciclo Rankine y sobrecalentamiento",
    "longTitle": "Ciclo Rankine y sobrecalentamiento",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Ajusta presión y temperatura de la caldera para obtener trabajo sin degradar demasiado la calidad a la salida de la turbina.",
    "explore": "Manipula presión de caldera y temperatura de vapor. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Presión de caldera",
        "min": 2,
        "max": 12,
        "step": 1,
        "unit": "MPa",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Temperatura de vapor",
        "min": 400,
        "max": 600,
        "step": 25,
        "unit": "°C",
        "decimals": 0
      }
    ],
    "start": {
      "a": 11,
      "b": 425
    },
    "metrics": [
      {
        "label": "Eficiencia térmica",
        "key": "m1",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Calidad a la salida",
        "key": "m2",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Trabajo neto",
        "key": "m3",
        "unit": "kJ/kg",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Eficiencia térmica",
        "m1",
        37,
        45,
        "%"
      ],
      [
        "Calidad a la salida",
        "m2",
        83,
        95,
        "%"
      ],
      [
        "Trabajo neto",
        "m3",
        1200,
        1500,
        "kJ/kg"
      ]
    ],
    "task": "Eficiencia térmica entre 37 y 45 %. Calidad a la salida entre 83 y 95 %. Trabajo neto entre 1200 y 1500 kJ/kg.",
    "job": "OT-283 · Ajusta una caldera de ensayo para equilibrar trabajo de ciclo y humedad a la salida de la turbina.",
    "equations": "Tabla CoolProp IF97 de agua. Condensador a 10 kPa, bomba ideal con vΔp, expansión isentrópica. x=(s₃−sf)/(sg−sf), h₄=hf+x(hg−hf). η=(h₃−h₄−h₂+h₁)/(h₃−h₂).",
    "limits": "Ciclo estacionario ideal. Los estados se precalculan para los pasos de los mandos.",
    "quiz": "¿Qué significa una calidad de vapor de 84 % en la descarga?",
    "answers": [
      "Que el vapor representa el 84 % de la masa en la mezcla.",
      "Que la eficiencia del ciclo es 84 %.",
      "Que la presión es 84 % de la de la caldera.",
      "Que la temperatura está al 84 % de la absoluta de entrada."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa eficiencia térmica.",
        "Modifica presión de caldera y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa calidad a la salida.",
        "Modifica temperatura de vapor con el primer mando fijo."
      ]
    ],
    "labels": "Bomba, caldera, turbina y condensador",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Bomba, caldera, turbina y condensador",
    "procedure": [
      "Identifica bomba, caldera, turbina y condensador en el banco.",
      "Registra un ensayo variando presión de caldera y temperatura de vapor.",
      "Eficiencia térmica entre 37 y 45 %. Calidad a la salida entre 83 y 95 %. Trabajo neto entre 1200 y 1500 kJ/kg."
    ],
    "timeScale": 1,
    "signals": "Entalpía (kJ/kg)",
    "sourceName": "IAPWS IF97",
    "source": "https://www.iapws.org/relguide/IF97-Rev.html",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Eficiencia térmica",
        "descripcion": "Lectura del banco en %."
      },
      {
        "icono": "⚙",
        "nombre": "Calidad a la salida",
        "descripcion": "Lectura del banco en %."
      },
      {
        "icono": "⚙",
        "nombre": "Trabajo neto",
        "descripcion": "Lectura del banco en kJ/kg."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Bomba, caldera, turbina y condensador",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Tabla CoolProp IF97 de agua. Condensador a 10 kPa, bomba ideal con vΔp, expansión isentrópica. x=(s₃−sf)/(sg−sf), h₄=hf+x(hg−hf). η=(h₃−h₄−h₂+h₁)/(h₃−h₂).",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Eficiencia térmica entre 37 y 45 %. Calidad a la salida entre 83 y 95 %. Trabajo neto entre 1200 y 1500 kJ/kg.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 284,
    "slug": "refrigeracion-cop-subenfriamiento",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Refrigeración, COP y subenfriamiento",
    "longTitle": "Refrigeración, COP y subenfriamiento",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Ajusta la temperatura de evaporación y el subenfriamiento para obtener más frío útil por unidad de trabajo.",
    "explore": "Manipula evaporación y subenfriamiento. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Evaporación",
        "min": -20,
        "max": 10,
        "step": 2,
        "unit": "°C",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Subenfriamiento",
        "min": 0,
        "max": 12,
        "step": 2,
        "unit": "K",
        "decimals": 0
      }
    ],
    "start": {
      "a": -16,
      "b": 0
    },
    "metrics": [
      {
        "label": "COP",
        "key": "m1",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Frío útil",
        "key": "m2",
        "unit": "kJ/kg",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Trabajo de compresión",
        "key": "m3",
        "unit": "kJ/kg",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "COP",
        "m1",
        3.75,
        4.3,
        ""
      ],
      [
        "Frío útil",
        "m2",
        145,
        170,
        "kJ/kg"
      ],
      [
        "Trabajo de compresión",
        "m3",
        34,
        42,
        "kJ/kg"
      ]
    ],
    "task": "COP entre 3.75 y 4.3. Frío útil entre 145 y 170 kJ/kg. Trabajo de compresión entre 34 y 42 kJ/kg.",
    "job": "OT-284 · Prepara una cámara de refrigeración a carga parcial. Comprueba frío útil y consumo específico con un cambio de subenfriamiento.",
    "equations": "Tabla CoolProp HEOS para R134a. Condensación a 40 °C, succión saturada, compresor con ηs=0,80, válvula isoentálpica h₄=h₃. COP=(h₁−h₄)/(h₂−h₁).",
    "limits": "Ciclo estacionario, sin pérdidas de presión. Los estados se precalculan para los pasos de los mandos.",
    "quiz": "¿Qué efecto tiene el subenfriamiento a las mismas presiones?",
    "answers": [
      "Reduce la entalpía antes de la válvula y aumenta el frío por kilogramo.",
      "Hace que la válvula entregue trabajo útil.",
      "Aumenta la entalpía de aspiración con las mismas condiciones.",
      "Iguala las presiones de evaporación y condensación."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa cop.",
        "Modifica evaporación y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa frío útil.",
        "Modifica subenfriamiento con el primer mando fijo."
      ]
    ],
    "labels": "Compresor, condensador, válvula y evaporador",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Compresor, condensador, válvula y evaporador",
    "procedure": [
      "Identifica compresor, condensador, válvula y evaporador en el banco.",
      "Registra un ensayo variando evaporación y subenfriamiento.",
      "COP entre 3.75 y 4.3. Frío útil entre 145 y 170 kJ/kg. Trabajo de compresión entre 34 y 42 kJ/kg."
    ],
    "timeScale": 1,
    "signals": "Entalpía (kJ/kg)",
    "sourceName": "NIST · propiedades de R134a",
    "source": "https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=925237",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "COP",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Frío útil",
        "descripcion": "Lectura del banco en kJ/kg."
      },
      {
        "icono": "⚙",
        "nombre": "Trabajo de compresión",
        "descripcion": "Lectura del banco en kJ/kg."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Compresor, condensador, válvula y evaporador",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Tabla CoolProp HEOS para R134a. Condensación a 40 °C, succión saturada, compresor con ηs=0,80, válvula isoentálpica h₄=h₃. COP=(h₁−h₄)/(h₂−h₁).",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "COP entre 3.75 y 4.3. Frío útil entre 145 y 170 kJ/kg. Trabajo de compresión entre 34 y 42 kJ/kg.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 285,
    "slug": "bomba-centrifuga-curva-npsh",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Bomba centrífuga y margen NPSH",
    "longTitle": "Bomba centrífuga y margen NPSH",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Encuentra un punto de operación útil y conserva margen frente a cavitación.",
    "explore": "Manipula velocidad y resistencia de válvula. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Velocidad",
        "min": 1200,
        "max": 2300,
        "step": 50,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Resistencia de válvula",
        "min": 0.006,
        "max": 0.054,
        "step": 0.001,
        "unit": "m/(m³/h)²",
        "decimals": 3
      }
    ],
    "start": {
      "a": 2100,
      "b": 0.007
    },
    "metrics": [
      {
        "label": "Caudal de operación",
        "key": "m1",
        "unit": "m³/h",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Altura de operación",
        "key": "m2",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Margen NPSH",
        "key": "m3",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Caudal de operación",
        "m1",
        18,
        22,
        "m³/h"
      ],
      [
        "Altura de operación",
        "m2",
        12,
        18,
        "m"
      ],
      [
        "Margen NPSH",
        "m3",
        1.3,
        4,
        "m"
      ]
    ],
    "task": "Caudal de operación entre 18 y 22 m³/h. Altura de operación entre 12 y 18 m. Margen NPSH entre 1.3 y 4 m.",
    "job": "OT-285 · Se cambió la posición de una válvula de descarga. Restablece el caudal requerido sin consumir el margen disponible en aspiración.",
    "equations": "Curvas sintéticas H_b=28(n/1800)²−0,027Q² y H_s=7+kQ². NPSHa=6,5−0,005Q² y NPSHr=1,2+0,004Q². Q en m³/h. El punto de operación iguala alturas.",
    "limits": "Curvas de enseñanza y NPSH sintético. No son datos de selección de un fabricante.",
    "quiz": "¿Cómo se encuentra el punto de operación?",
    "answers": [
      "En la intersección entre curva de bomba y curva del sistema.",
      "En el punto de caudal cero.",
      "Donde NPSHa es siempre igual a la altura de bomba.",
      "En la presión nominal de la válvula, sin usar el caudal."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa caudal de operación.",
        "Modifica velocidad y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa altura de operación.",
        "Modifica resistencia de válvula con el primer mando fijo."
      ]
    ],
    "labels": "Impulsor, aspiración y tubería de descarga",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Impulsor, aspiración y tubería de descarga",
    "procedure": [
      "Identifica impulsor, aspiración y tubería de descarga en el banco.",
      "Registra un ensayo variando velocidad y resistencia de válvula.",
      "Caudal de operación entre 18 y 22 m³/h. Altura de operación entre 12 y 18 m. Margen NPSH entre 1.3 y 4 m."
    ],
    "timeScale": 1,
    "signals": "Altura de bomba y sistema (m)",
    "sourceName": "DOE · Fundamentals Handbook",
    "source": "https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL2.pdf",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Caudal de operación",
        "descripcion": "Lectura del banco en m³/h."
      },
      {
        "icono": "⚙",
        "nombre": "Altura de operación",
        "descripcion": "Lectura del banco en m."
      },
      {
        "icono": "⚙",
        "nombre": "Margen NPSH",
        "descripcion": "Lectura del banco en m."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Impulsor, aspiración y tubería de descarga",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Curvas sintéticas H_b=28(n/1800)²−0,027Q² y H_s=7+kQ². NPSHa=6,5−0,005Q² y NPSHr=1,2+0,004Q². Q en m³/h. El punto de operación iguala alturas.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Caudal de operación entre 18 y 22 m³/h. Altura de operación entre 12 y 18 m. Margen NPSH entre 1.3 y 4 m.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 286,
    "slug": "moody-perdidas-carga-tuberia",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Moody y pérdidas en una tubería",
    "longTitle": "Moody y pérdidas en una tubería",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Cambia caudal y rugosidad para cumplir el presupuesto de carga del circuito.",
    "explore": "Manipula velocidad media y rugosidad relativa. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Velocidad media",
        "min": 0.025,
        "max": 3,
        "step": 0.025,
        "unit": "m/s",
        "decimals": 3
      },
      {
        "id": "b",
        "label": "Rugosidad relativa",
        "min": 0.0002,
        "max": 0.008,
        "step": 0.0002,
        "unit": "",
        "decimals": 4
      }
    ],
    "start": {
      "a": 2.5,
      "b": 0.006
    },
    "metrics": [
      {
        "label": "Reynolds",
        "key": "m1",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Factor de Darcy",
        "key": "m2",
        "unit": "",
        "scale": 1,
        "decimals": 4
      },
      {
        "label": "Pérdida total",
        "key": "m3",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Reynolds",
        "m1",
        50000,
        80000,
        ""
      ],
      [
        "Factor de Darcy",
        "m2",
        0.015,
        0.03,
        ""
      ],
      [
        "Pérdida total",
        "m3",
        0,
        2.5,
        "m"
      ]
    ],
    "task": "Reynolds entre 50000 y 80000. Factor de Darcy entre 0.015 y 0.03. Pérdida total entre 0 y 2.5 m.",
    "job": "OT-286 · Dimensiona la operación de una línea de agua con una caída de presión admisible. Contrasta la influencia de la rugosidad en los dos regímenes.",
    "equations": "Agua ν=10⁻⁶ m²/s, D=40 mm, L=25 m y ΣK=3. Re=vD/ν. En régimen laminar f=64/Re. En turbulento se usa Swamee–Jain. Pérdida (fL/D+ΣK)v²/(2g).",
    "limits": "Interpolación didáctica entre Re=2300 y 4000. Accesorios agrupados en un único coeficiente.",
    "quiz": "¿Qué suele pasar con la pérdida al aumentar la velocidad?",
    "answers": [
      "Aumenta por el término de carga cinética v²/(2g).",
      "Disminuye porque el factor de Darcy es adimensional.",
      "Se hace igual a la longitud del tubo.",
      "Se mantiene constante si se conserva el diámetro."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa reynolds.",
        "Modifica velocidad media y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa factor de darcy.",
        "Modifica rugosidad relativa con el primer mando fijo."
      ]
    ],
    "labels": "Tubo, tomas de presión y trazador",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Tubo, tomas de presión y trazador",
    "procedure": [
      "Identifica tubo, tomas de presión y trazador en el banco.",
      "Registra un ensayo variando velocidad media y rugosidad relativa.",
      "Reynolds entre 50000 y 80000. Factor de Darcy entre 0.015 y 0.03. Pérdida total entre 0 y 2.5 m."
    ],
    "timeScale": 1,
    "signals": "Carga restante (m)",
    "sourceName": "DOE · Fundamentals Handbook",
    "source": "https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL2.pdf",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Reynolds",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Factor de Darcy",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Pérdida total",
        "descripcion": "Lectura del banco en m."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Tubo, tomas de presión y trazador",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Baja de Re=2300 para identificar la rama laminar. Supera Re=4000 y compara cómo influye la rugosidad.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Reynolds entre 50000 y 80000. Factor de Darcy entre 0.015 y 0.03. Pérdida total entre 0 y 2.5 m.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 287,
    "slug": "turbina-pelton-cantidad-movimiento",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Turbina Pelton y cantidad de movimiento",
    "longTitle": "Turbina Pelton y cantidad de movimiento",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Ajusta la velocidad periférica para aprovechar el chorro sin sacrificar el empuje útil.",
    "explore": "Manipula altura neta y relación de velocidades. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Altura neta",
        "min": 25,
        "max": 90,
        "step": 5,
        "unit": "m",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Relación de velocidades",
        "min": 0.15,
        "max": 0.85,
        "step": 0.05,
        "unit": "",
        "decimals": 2
      }
    ],
    "start": {
      "a": 65,
      "b": 0.2
    },
    "metrics": [
      {
        "label": "Potencia al rodete",
        "key": "m1",
        "unit": "kW",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Eficiencia del rodete",
        "key": "m2",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fuerza tangencial",
        "key": "m3",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Potencia al rodete",
        "m1",
        2.5,
        4,
        "kW"
      ],
      [
        "Eficiencia del rodete",
        "m2",
        88,
        95,
        "%"
      ],
      [
        "Fuerza tangencial",
        "m3",
        140,
        205,
        "N"
      ]
    ],
    "task": "Potencia al rodete entre 2.5 y 4 kW. Eficiencia del rodete entre 88 y 95 %. Fuerza tangencial entre 140 y 205 N.",
    "job": "OT-287 · Prepara el rodete para una línea hidráulica de altura conocida. Evalúa empuje, potencia y eficiencia antes de fijar la velocidad de giro.",
    "equations": "Chorro de 14 mm, v=√(2gH), u=bv. Fuerza ρQ(v−u)(1+0,85cos15°), potencia Fu. Eficiencia respecto a energía cinética del chorro. Modelo sin pérdidas mecánicas externas.",
    "limits": "Chorro ideal y desviación de 165°. Se omiten fugas y pérdidas mecánicas.",
    "quiz": "¿Por qué u casi igual a v entrega poca potencia?",
    "answers": [
      "El chorro llega con poca velocidad relativa a la cuchara.",
      "El chorro deja de tener masa.",
      "La cuchara se enfría y baja la presión ambiente.",
      "Se anula la gravedad en el rodete."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa potencia al rodete.",
        "Modifica altura neta y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa eficiencia del rodete.",
        "Modifica relación de velocidades con el primer mando fijo."
      ]
    ],
    "labels": "Boquilla, chorro, cucharas y eje",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Boquilla, chorro, cucharas y eje",
    "procedure": [
      "Identifica boquilla, chorro, cucharas y eje en el banco.",
      "Registra un ensayo variando altura neta y relación de velocidades.",
      "Potencia al rodete entre 2.5 y 4 kW. Eficiencia del rodete entre 88 y 95 %. Fuerza tangencial entre 140 y 205 N."
    ],
    "timeScale": 1,
    "signals": "Velocidades (m/s)",
    "sourceName": "DOE · Fundamentals Handbook",
    "source": "https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL2.pdf",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Potencia al rodete",
        "descripcion": "Lectura del banco en kW."
      },
      {
        "icono": "⚙",
        "nombre": "Eficiencia del rodete",
        "descripcion": "Lectura del banco en %."
      },
      {
        "icono": "⚙",
        "nombre": "Fuerza tangencial",
        "descripcion": "Lectura del banco en N."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Boquilla, chorro, cucharas y eje",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Chorro de 14 mm, v=√(2gH), u=bv. Fuerza ρQ(v−u)(1+0,85cos15°), potencia Fu. Eficiencia respecto a energía cinética del chorro. Modelo sin pérdidas mecánicas externas.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Potencia al rodete entre 2.5 y 4 kW. Eficiencia del rodete entre 88 y 95 %. Fuerza tangencial entre 140 y 205 N.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 288,
    "slug": "compresion-politropica-interenfriamiento",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Compresión politrópica con interenfriamiento",
    "longTitle": "Compresión politrópica con interenfriamiento",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Reparte la relación de presión entre etapas para bajar el trabajo y la temperatura de descarga.",
    "explore": "Manipula relación total de presión y etapas. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Relación total de presión",
        "min": 3,
        "max": 16,
        "step": 1,
        "unit": "",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Etapas",
        "min": 1,
        "max": 4,
        "step": 1,
        "unit": "",
        "decimals": 0
      }
    ],
    "start": {
      "a": 10,
      "b": 2
    },
    "metrics": [
      {
        "label": "Trabajo específico",
        "key": "m1",
        "unit": "kJ/kg",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Temperatura de etapa",
        "key": "m2",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Ahorro frente a una etapa",
        "key": "m3",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Trabajo específico",
        "m1",
        190,
        235,
        "kJ/kg"
      ],
      [
        "Temperatura de etapa",
        "m2",
        65,
        110,
        "°C"
      ],
      [
        "Ahorro frente a una etapa",
        "m3",
        13,
        24,
        "%"
      ]
    ],
    "task": "Trabajo específico entre 190 y 235 kJ/kg. Temperatura de etapa entre 65 y 110 °C. Ahorro frente a una etapa entre 13 y 24 %.",
    "job": "OT-288 · Reduce el calentamiento de un tren de aire comprimido conservando la relación total de presión que pide el proceso.",
    "equations": "Aire ideal, n=1,30, R=0,287 kJ/(kg·K). Etapas iguales, retorno ideal a 298 K entre etapas. w=N·nR(T₂−T₁)/(n−1), T₂/T₁=(p₂/p₁)^((n−1)/n).",
    "limits": "Etapas iguales e interenfriadores ideales, sin pérdidas de carga.",
    "quiz": "¿Por qué el interenfriamiento reduce el trabajo?",
    "answers": [
      "La siguiente etapa vuelve a comprimir un gas a menor temperatura inicial.",
      "Se igualan presiones de entrada y salida.",
      "El aire deja de tener calor específico.",
      "La última etapa se convierte en expansor."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa trabajo específico.",
        "Modifica relación total de presión y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa temperatura de etapa.",
        "Modifica etapas con el primer mando fijo."
      ]
    ],
    "labels": "Compresores por etapas y tren de enfriamiento",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Compresores por etapas y tren de enfriamiento",
    "procedure": [
      "Identifica compresores por etapas y tren de enfriamiento en el banco.",
      "Registra un ensayo variando relación total de presión y etapas.",
      "Trabajo específico entre 190 y 235 kJ/kg. Temperatura de etapa entre 65 y 110 °C. Ahorro frente a una etapa entre 13 y 24 %."
    ],
    "timeScale": 1,
    "signals": "Temperatura de compresión (°C)",
    "sourceName": "DOE · Fundamentals Handbook",
    "source": "https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL2.pdf",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Trabajo específico",
        "descripcion": "Lectura del banco en kJ/kg."
      },
      {
        "icono": "⚙",
        "nombre": "Temperatura de etapa",
        "descripcion": "Lectura del banco en °C."
      },
      {
        "icono": "⚙",
        "nombre": "Ahorro frente a una etapa",
        "descripcion": "Lectura del banco en %."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Compresores por etapas y tren de enfriamiento",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Aire ideal, n=1,30, R=0,287 kJ/(kg·K). Etapas iguales, retorno ideal a 298 K entre etapas. w=N·nR(T₂−T₁)/(n−1), T₂/T₁=(p₂/p₁)^((n−1)/n).",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Trabajo específico entre 190 y 235 kJ/kg. Temperatura de etapa entre 65 y 110 °C. Ahorro frente a una etapa entre 13 y 24 %.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 289,
    "slug": "radio-critico-aislamiento-tuberia",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Radio crítico de aislamiento",
    "longTitle": "Radio crítico de aislamiento",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Comprueba cuándo añadir una capa delgada puede aumentar la pérdida de calor.",
    "explore": "Manipula espesor añadido y convección exterior. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Espesor añadido",
        "min": 0,
        "max": 36,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "b",
        "label": "Convección exterior",
        "min": 2,
        "max": 20,
        "step": 1,
        "unit": "W/(m²·K)",
        "decimals": 0
      }
    ],
    "start": {
      "a": 2,
      "b": 10
    },
    "metrics": [
      {
        "label": "Radio crítico",
        "key": "m1",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Pérdida de calor",
        "key": "m2",
        "unit": "W/m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Aumento frente a tubo desnudo",
        "key": "m3",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Radio crítico",
        "m1",
        12,
        20,
        "mm"
      ],
      [
        "Pérdida de calor",
        "m2",
        8,
        12,
        "W/m"
      ],
      [
        "Aumento frente a tubo desnudo",
        "m3",
        5,
        18,
        "%"
      ]
    ],
    "task": "Radio crítico entre 12 y 20 mm. Pérdida de calor entre 8 y 12 W/m. Aumento frente a tubo desnudo entre 5 y 18 %.",
    "job": "OT-289 · Un recubrimiento delgado elevó el consumo térmico. Reproduce el efecto y ubica el radio que separa aumento y reducción de la pérdida.",
    "equations": "Tubo de 8 mm de radio, aislamiento k=0,045 W/(m·K) y ΔT=58 K. Resistencia por metro R=ln(r₂/r₁)/(2πk)+1/(2πr₂h), con rcr=k/h. Se omiten radiación y resistencias interiores.",
    "limits": "Convección constante y flujo radial unidimensional, sin radiación.",
    "quiz": "¿Por qué puede aumentar la pérdida al añadir aislamiento?",
    "answers": [
      "El aumento de área exterior reduce la resistencia convectiva.",
      "La conducción ofrece resistencia negativa.",
      "La convección deja de depender del área.",
      "El tubo cambia de radio interior."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa radio crítico.",
        "Modifica espesor añadido y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa pérdida de calor.",
        "Modifica convección exterior con el primer mando fijo."
      ]
    ],
    "labels": "Tubo, capa aislante y perfil de pérdida",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Tubo, capa aislante y perfil de pérdida",
    "procedure": [
      "Identifica tubo, capa aislante y perfil de pérdida en el banco.",
      "Registra un ensayo variando espesor añadido y convección exterior.",
      "Radio crítico entre 12 y 20 mm. Pérdida de calor entre 8 y 12 W/m. Aumento frente a tubo desnudo entre 5 y 18 %."
    ],
    "timeScale": 1,
    "signals": "Pérdida térmica (W/m)",
    "sourceName": "Lienhard · A Heat Transfer Textbook",
    "source": "https://ahtt.mit.edu/wp-content/uploads/2024/04/AHTTv600.pdf",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Radio crítico",
        "descripcion": "Lectura del banco en mm."
      },
      {
        "icono": "⚙",
        "nombre": "Pérdida de calor",
        "descripcion": "Lectura del banco en W/m."
      },
      {
        "icono": "⚙",
        "nombre": "Aumento frente a tubo desnudo",
        "descripcion": "Lectura del banco en %."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Tubo, capa aislante y perfil de pérdida",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Tubo de 8 mm de radio, aislamiento k=0,045 W/(m·K) y ΔT=58 K. Resistencia por metro R=ln(r₂/r₁)/(2πk)+1/(2πr₂h), con rcr=k/h. Se omiten radiación y resistencias interiores.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Radio crítico entre 12 y 20 mm. Pérdida de calor entre 8 y 12 W/m. Aumento frente a tubo desnudo entre 5 y 18 %.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 290,
    "slug": "tobera-laval-choque-normal",
    "module": "Termofluidos y Energía",
    "area": "TERMOFLUIDOS",
    "title": "Tobera convergente-divergente con choque",
    "longTitle": "Tobera convergente-divergente con choque",
    "eyebrow": "Orden de trabajo · Banco de ensayo",
    "intro": "Controla la contrapresión para ubicar un choque normal dentro de la sección divergente.",
    "explore": "Manipula área de salida / garganta y contrapresión / presión total. Compara las lecturas con la orden de trabajo.",
    "controls": [
      {
        "id": "a",
        "label": "Área de salida / garganta",
        "min": 1.5,
        "max": 3.5,
        "step": 0.1,
        "unit": "",
        "decimals": 1
      },
      {
        "id": "b",
        "label": "Contrapresión / presión total",
        "min": 0.2,
        "max": 0.99,
        "step": 0.01,
        "unit": "",
        "decimals": 2
      }
    ],
    "start": {
      "a": 2.5,
      "b": 0.93
    },
    "metrics": [
      {
        "label": "Mach de salida",
        "key": "m1",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Posición del choque",
        "key": "m2",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Régimen con choque interno",
        "key": "m3",
        "unit": "",
        "scale": 1,
        "decimals": 2
      }
    ],
    "specs": [
      [
        "Mach de salida",
        "m1",
        0.26,
        0.45,
        ""
      ],
      [
        "Posición del choque",
        "m2",
        63,
        87,
        "%"
      ],
      [
        "Régimen con choque interno",
        "m3",
        1,
        1,
        ""
      ]
    ],
    "task": "Mach de salida entre 0.26 y 0.45. Posición del choque entre 63 y 87 %. Régimen con choque interno = 1.",
    "job": "OT-290 · Localiza el choque dentro de la sección divergente para que la descarga reproduzca la contrapresión del banco.",
    "equations": "Aire perfecto γ=1,4. Ecuación área–Mach en ramas sub y supersónica, y salto normal con caída de presión total. Se busca la posición que reproduce la contrapresión. Si el choque queda fuera, se muestra solo el flujo interno.",
    "limits": "Aire perfecto, flujo cuasiunidimensional y choque estacionario sin pérdidas de capa límite.",
    "quiz": "¿Qué sucede con el Mach al atravesar un choque normal interno?",
    "answers": [
      "Pasa de supersónico a subsónico.",
      "Pasa de subsónico a supersónico.",
      "Permanece idéntico y solo cambia la temperatura.",
      "Se mantiene exactamente en Mach uno en toda la tobera."
    ],
    "faults": [
      [
        "Lectura fuera de objetivo",
        "Revisa mach de salida.",
        "Modifica área de salida / garganta y compara el resultado."
      ],
      [
        "Ajuste secundario",
        "Revisa posición del choque.",
        "Modifica contrapresión / presión total con el primer mando fijo."
      ]
    ],
    "labels": "Garganta, tramo divergente y anillo de choque",
    "caption": "Escena esquemática · lecturas del modelo",
    "tools": "Garganta, tramo divergente y anillo de choque",
    "procedure": [
      "Identifica garganta, tramo divergente y anillo de choque en el banco.",
      "Registra un ensayo variando área de salida / garganta y contrapresión / presión total.",
      "Mach de salida entre 0.26 y 0.45. Posición del choque entre 63 y 87 %. Régimen con choque interno = 1."
    ],
    "timeScale": 1,
    "signals": "Mach a lo largo de la tobera",
    "sourceName": "NASA Glenn · Isentropic Flow Equations",
    "source": "https://www.grc.nasa.gov/www/k-12/airplane/isentrop.html",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Mach de salida",
        "descripcion": "Indicador del ensayo."
      },
      {
        "icono": "⚙",
        "nombre": "Posición del choque",
        "descripcion": "Lectura del banco en %."
      },
      {
        "icono": "⚙",
        "nombre": "Régimen con choque interno",
        "descripcion": "Indicador del ensayo."
      }
    ],
    "tour": [
      {
        "title": "Reconoce el banco",
        "text": "Garganta, tramo divergente y anillo de choque",
        "view": "assembly"
      },
      {
        "title": "Examina el montaje",
        "text": "Aire perfecto γ=1,4. Ecuación área–Mach en ramas sub y supersónica, y salto normal con caída de presión total. Se busca la posición que reproduce la contrapresión. Si el choque queda fuera, se muestra solo el flujo interno.",
        "view": "inspection"
      },
      {
        "title": "Registra y compara",
        "text": "Mach de salida entre 0.26 y 0.45. Posición del choque entre 63 y 87 %. Régimen con choque interno = 1.",
        "view": "assembly"
      }
    ]
  }
];
