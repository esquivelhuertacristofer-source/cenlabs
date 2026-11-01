export const definitions = [
  {
    "id": 251,
    "slug": "viga-flexion-estatica",
    "title": "Viga en flexión: cortante, momento y flecha",
    "longTitle": "Viga en flexión: cortante, momento y flecha",
    "intro": "Una carga dobla la viga: aumentar su altura la vuelve mucho más rígida.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "load",
        "label": "Carga central",
        "min": 2000,
        "max": 5000,
        "step": 100,
        "unit": "N",
        "decimals": 0
      },
      {
        "id": "height",
        "label": "Altura de sección",
        "min": 30,
        "max": 70,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Flecha máxima",
        "key": "maxDeflection",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      },
      {
        "label": "Esfuerzo extremo",
        "key": "stress",
        "unit": "MPa",
        "scale": 1e-06,
        "decimals": 2
      },
      {
        "label": "Momento central",
        "key": "M",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Masa",
        "key": "mass",
        "unit": "kg",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Soporta al menos 2800 N, con flecha ≤3 mm, esfuerzo ≤120 MPa y masa ≤50 kg.",
    "equations": "Viga biapoyada L=2 m, ancho b=50 mm, E=210 GPa, densidad 7850 kg/m³. I=bh³/12; RA=RB=P/2; V=±P/2; M=P min(x,L−x)/2. v=P u(3L²−4u²)/(48EI), u=min(x,L−x); vmax=PL³/(48EI); σmax=PLh/(8I).",
    "limits": "Euler–Bernoulli elástico de pequeña flecha, sin peso propio, cortante, plasticidad ni pandeo lateral. Flecha visual ×12; geometría transversal ×3 respecto de la longitud. Carga estática modulada de 50 a 100 % en una demostración de 8 s, no vibración.",
    "quiz": "¿Por qué aumentar la altura reduce tanto la flecha?",
    "answers": [
      "Porque el segundo momento de área crece con el cubo de la altura.",
      "Porque el módulo de Young crece con la altura.",
      "Porque la carga central desaparece.",
      "Porque el peso propio siempre se anula."
    ],
    "faults": [
      [
        "Altura insuficiente",
        "La flecha sube mucho al reducir la sección.",
        "I depende de h³."
      ],
      [
        "Carga mayor",
        "Aumentan momento y flecha en la misma proporción.",
        "La respuesta es lineal en P."
      ],
      [
        "Confundir rigidez y resistencia",
        "Cumple esfuerzo pero se deforma demasiado.",
        "Se verifican ambos criterios por separado."
      ]
    ],
    "labels": "Viga · apoyos · rodillo de carga · actuador · palpador",
    "caption": "Flecha ×12 · sección ×3 · carga cuasiestática",
    "tools": "Banco de tres puntos, apoyos articulados, actuador y comparador.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-251 · Soporta al menos 2800 N, con flecha ≤3 mm, esfuerzo ≤120 MPa y masa ≤50 kg.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "flecha instantánea / flecha máxima (mm)",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Una carga dobla la viga: aumentar su altura la vuelve mucho más rígida.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Flecha ×12 · sección ×3 · carga cuasiestática",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 252,
    "slug": "traccion-curva-material",
    "title": "Ensayo de tracción: curva y deformación permanente",
    "longTitle": "Ensayo de tracción: curva y deformación permanente",
    "intro": "Estira una probeta y observa qué parte recupera su forma al descargar.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "stress",
        "label": "Esfuerzo máximo",
        "min": 100,
        "max": 450,
        "step": 10,
        "unit": "MPa",
        "decimals": 0
      },
      {
        "id": "E",
        "label": "Módulo de Young",
        "min": 100,
        "max": 240,
        "step": 10,
        "unit": "GPa",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Deformación máxima",
        "key": "strain",
        "unit": "%",
        "scale": 100,
        "decimals": 3
      },
      {
        "label": "Carga máxima",
        "key": "force",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Extensión máxima",
        "key": "extension",
        "unit": "mm",
        "scale": 1000,
        "decimals": 3
      },
      {
        "label": "Extensión residual",
        "key": "permanent",
        "unit": "mm",
        "scale": 1000,
        "decimals": 3
      }
    ],
    "task": "Caracteriza bajo 5,0–5,7 kN, con extensión útil de 60–78 µm y sin deformación permanente.",
    "equations": "Probeta circular d=5 mm, longitud útil 50 mm. σy=300 MPa y endurecimiento H=2 GPa. ε=σ/E+max(0,(σ−σy)/H); F=σA; ΔL=εL0. Descarga elástica con pendiente E y residuo εp=max(0,(σmax−σy)/H).",
    "limits": "Ley uniaxial bilineal sintética, sin estricción, daño ni fractura. Diámetro contrae sólo elásticamente con ν=0,3 antes de fluencia; tras fluencia la contracción usa volumen plástico constante. Extensión visual ×4; ciclo carga-descarga de 8 s didácticos, sin velocidad normativa. Tras descargar conserva el alargamiento residual hasta repetir el ensayo. Diámetro de la zona útil ampliado ×2,2; vista inicial al máximo de carga.",
    "quiz": "¿Qué deja una extensión residual al descargar?",
    "answers": [
      "Haber superado el límite elástico del material.",
      "Tener una probeta más larga sin cargarla.",
      "Elegir un módulo de Young más alto por sí solo.",
      "Una deformación exclusivamente elástica."
    ],
    "faults": [
      [
        "Fluencia",
        "La longitud no vuelve al valor inicial.",
        "Se acumuló deformación plástica."
      ],
      [
        "Rigidez baja",
        "La misma tensión produce más alargamiento elástico.",
        "εe=σ/E."
      ],
      [
        "Sección equivocada",
        "La fuerza se confunde con esfuerzo.",
        "El esfuerzo depende del área inicial."
      ]
    ],
    "labels": "Bastidor · husillos · mordazas · probeta · extensómetro",
    "caption": "Extensión ×4 · diámetro ×2,2 · vista inicial bajo carga",
    "tools": "Máquina universal abierta, probeta y extensómetro virtual.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-252 · Caracteriza bajo 5,0–5,7 kN, con extensión útil de 60–78 µm y sin deformación permanente.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Deformación total / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Estira una probeta y observa qué parte recupera su forma al descargar.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Extensión ×4 · diámetro ×2,2 · vista inicial bajo carga",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 253,
    "slug": "columna-pandeo-euler",
    "title": "Pandeo de columnas: carga crítica y esbeltez",
    "longTitle": "Pandeo de columnas: carga crítica y esbeltez",
    "intro": "Una columna larga puede doblarse antes de que su material se aplaste.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "load",
        "label": "Carga axial",
        "min": 10,
        "max": 70,
        "step": 5,
        "unit": "kN",
        "decimals": 0
      },
      {
        "id": "diameter",
        "label": "Diámetro",
        "min": 20,
        "max": 50,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Carga crítica",
        "key": "critical",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Reserva de Euler",
        "key": "safety",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Esbeltez",
        "key": "slenderness",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Esfuerzo directo",
        "key": "stress",
        "unit": "MPa",
        "scale": 1e-06,
        "decimals": 2
      }
    ],
    "task": "Sostén al menos 25 kN con reserva de Euler entre 2 y 4 y esbeltez ≥100.",
    "equations": "Columna circular biarticulada L=1,5 m, K=1, E=210 GPa. A=πd²/4; I=πd⁴/64; λ=KL/√(I/A)=4L/d; Pcr=π²EI/(KL)². Imperfección sinusoidal e0=1 mm: e=e0/(1−P/Pcr), exclusivamente para P<Pcr.",
    "limits": "Euler elástico ideal, sin excentricidad adicional, residual ni plasticidad. Si P≥Pcr se muestra inestabilidad sin inventar una deformada poscrítica. Exageración lateral ×8; diámetro visual ×3. Aproximación de amplificación de imperfección, no solución no lineal completa.",
    "quiz": "¿Qué cambia si duplicas el diámetro manteniendo longitud y material?",
    "answers": [
      "La carga crítica de Euler se multiplica por dieciséis.",
      "La carga crítica se duplica.",
      "La carga crítica se reduce a la mitad.",
      "La esbeltez se duplica."
    ],
    "faults": [
      [
        "Inestabilidad",
        "P supera Pcr y no hay equilibrio estable en este modelo.",
        "Euler marca el límite del dominio."
      ],
      [
        "Columna delgada",
        "Aumenta esbeltez y cae carga crítica.",
        "I varía con d⁴."
      ],
      [
        "Sólo revisar compresión",
        "El esfuerzo directo parece aceptable pero falta reserva.",
        "Pandeo y aplastamiento son mecanismos distintos."
      ]
    ],
    "labels": "Columna · rótulas · cabezal · bastidor · imperfección",
    "caption": "Desvío ×8 · sin solución poscrítica",
    "tools": "Prensa de columnas, rótulas y comparador lateral.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-253 · Sostén al menos 25 kN con reserva de Euler entre 2 y 4 y esbeltez ≥100.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Carga crítica / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Una columna larga puede doblarse antes de que su material se aplaste.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Desvío ×8 · sin solución poscrítica",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 254,
    "slug": "mohr-plano-critico",
    "title": "Círculo de Mohr: encuentra el plano principal",
    "longTitle": "Círculo de Mohr: encuentra el plano principal",
    "intro": "Gira un corte del material hasta que desaparezca el esfuerzo que lo desliza.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "angle",
        "label": "Orientación del corte",
        "min": 0,
        "max": 60,
        "step": 1,
        "unit": "°",
        "decimals": 0
      },
      {
        "id": "tau",
        "label": "Cortante aplicado",
        "min": 30,
        "max": 100,
        "step": 5,
        "unit": "MPa",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Normal en el corte",
        "key": "normal",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Cortante en el corte",
        "key": "shear",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Principal mayor",
        "key": "major",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Principal menor",
        "key": "minor",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Reduce |cortante en el corte| a ≤3 MPa, con principal mayor ≤160 MPa y cortante aplicado ≥50 MPa.",
    "equations": "Esfuerzo plano σx=120 MPa, σy=40 MPa. C=(σx+σy)/2; R=√[((σx−σy)/2)²+τxy²]; σn=C+(σx−σy)cos2θ/2+τxy sin2θ; τnt=−(σx−σy)sin2θ/2+τxy cos2θ; σ1,2=C±R.",
    "limits": "Elemento homogéneo sin deformada ni criterio de falla. Las flechas son tracciones calculadas, no desplazamientos ni medición real. Longitudes de flecha 0,003 unidades/MPa; ángulos físicos sin exageración.",
    "quiz": "¿Cuánto gira un punto del círculo cuando el plano físico gira 20°?",
    "answers": [
      "Gira 40° porque la transformación depende del ángulo doble.",
      "Gira 20° en todos los casos.",
      "Gira 10° por la simetría.",
      "El círculo cambia de radio obligatoriamente."
    ],
    "faults": [
      [
        "Plano no principal",
        "Queda cortante al girar la sección.",
        "El plano principal anula τnt."
      ],
      [
        "Signo de cortante",
        "El punto se coloca al lado opuesto del círculo.",
        "Debe respetarse la convención declarada."
      ],
      [
        "Ángulo doble",
        "Se interpreta un giro del círculo como giro físico.",
        "La transformación contiene 2θ."
      ]
    ],
    "labels": "Elemento · corte giratorio · tracción normal · tracción tangencial",
    "caption": "Flechas de tracción · esfuerzo plano · sin deformada",
    "tools": "Elemento de esfuerzos, corte orientable y círculo de Mohr en instrumento DOM.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-254 · Reduce |cortante en el corte| a ≤3 MPa, con principal mayor ≤160 MPa y cortante aplicado ≥50 MPa.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Normal en el corte / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Gira un corte del material hasta que desaparezca el esfuerzo que lo desliza.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Flechas de tracción · esfuerzo plano · sin deformada",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 255,
    "slug": "fatiga-goodman-eje",
    "title": "Fatiga de un eje: curva S–N y Goodman",
    "longTitle": "Fatiga de un eje: curva S–N y Goodman",
    "intro": "Una carga repetida puede dañar un eje aunque ninguna vuelta lo rompa.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "diameter",
        "label": "Diámetro del eje",
        "min": 18,
        "max": 40,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "mean",
        "label": "Tensión media",
        "min": 20,
        "max": 200,
        "step": 10,
        "unit": "MPa",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Alternante",
        "key": "alternating",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Reserva Goodman",
        "key": "safety",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Ciclos de referencia",
        "key": "cycles",
        "unit": "ciclos",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Utilización",
        "key": "utilization",
        "unit": "",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Consigue reserva Goodman entre 1,5 y 2,2, diámetro ≤28 mm y tensión media ≥50 MPa.",
    "equations": "Flexión rotativa biapoyada L=1 m y carga central P=560 N: Mmax=PL/4=140 N·m; M(x)=P min(x,L−x)/2. Se evalúa fatiga en la sección central: σa=32Mmax/(πd³). Se=180 MPa, Sut=600 MPa; σeq=σa/(1−σm/Sut), U=σa/Se+σm/Sut; n=1/U. Basquin entre 10³ ciclos a 480 MPa y 10⁶ a 180 MPa. Por debajo de Se se muestra 10⁶ como referencia, no vida exacta.",
    "limits": "Material y curva sintéticos sin datos de fabricante, entallas, acabado, efecto de tamaño, dispersión, corrosión ni daño acumulado. No se dibuja la pequeña flecha de flexión. Giro demostrativo 0,25 Hz, sin velocidad de servicio ni propagación de grieta; no se garantiza vida infinita. Colores de fibras: σm+32M(x)cos(φ)/(πd³), sin FEM. El esfuerzo medio axial se prescribe, no se simula el equipo que lo genera. Diámetro visual ampliado ×3; casquillos intercambiables ilustrativos, sin selección real de rodamiento.",
    "quiz": "¿Por qué la tensión media positiva reduce el margen de fatiga?",
    "answers": [
      "Porque consume parte del margen disponible en Goodman.",
      "Porque elimina la tensión alternante.",
      "Porque aumenta automáticamente el límite de resistencia.",
      "Porque vuelve cero todos los esfuerzos."
    ],
    "faults": [
      [
        "Diámetro pequeño",
        "Sube rápidamente el esfuerzo alternante.",
        "La flexión depende de 1/d³."
      ],
      [
        "Media elevada",
        "Se reduce el margen aunque la alternante no cambie.",
        "Goodman suma ambas contribuciones."
      ],
      [
        "Vida falsa",
        "Se interpreta la meseta como garantía infinita.",
        "La curva didáctica no certifica vida de un eje."
      ]
    ],
    "labels": "Eje · apoyos · carga de flexión · fibras · accionamiento",
    "caption": "Flexión rotativa · giro demostrativo 0,25 Hz · curva sintética",
    "tools": "Banco de flexión rotativa y mapa de Goodman.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-255 · Consigue reserva Goodman entre 1,5 y 2,2, diámetro ≤28 mm y tensión media ≥50 MPa.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "esfuerzo de una fibra (MPa) / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Una carga repetida puede dañar un eje aunque ninguna vuelta lo rompa.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Giro demostrativo 0,25 Hz · curva sintética",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 256,
    "slug": "concentracion-agujero-entalla",
    "title": "Concentración de esfuerzos: agujero y filete",
    "longTitle": "Concentración de esfuerzos: agujero y filete",
    "intro": "Un borde agudo concentra la carga; un radio mayor puede repartirla mejor.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "width",
        "label": "Ancho de placa",
        "min": 60,
        "max": 130,
        "step": 5,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "radius",
        "label": "Radio de agujero / filete",
        "min": 2,
        "max": 10,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Pico en agujero",
        "key": "peak",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Factor del agujero",
        "key": "Kt",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Pico en filete",
        "key": "filletPeak",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Factor de filete",
        "key": "filletKt",
        "unit": "",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Mantén ambos picos ≤110 MPa, radio ≥3 mm y ancho ≤115 mm.",
    "equations": "Agujero: placa t=6 mm, F=20 kN, d=2r, η=d/W; Kt=3−3,14η+3,667η²−1,527η³; σnom=F/[(W−d)t]. Filete de hombro doble: D=W, d=D−20 mm, h=10 mm, r variable; Kt=C1+C2z+C3z²+C4z³, z=2h/D. Coeficientes por h/r de Roark, tabla 6-1 III-1a, tracción axial; σnom=F/(6d). Longitud remota L=800 mm, L/D supera el límite de la tabla.",
    "limits": "Factores elásticos tabulados; no FEM ni campo de esfuerzos calculado, plasticidad o fatiga. Se resaltan sólo las posiciones de pico. El 3D muestra el detalle central y acorta las regiones remotas del filete; no es un plano a escala longitudinal ni un modelo de contacto de mordazas. Espesor visual ampliado.",
    "quiz": "¿Por qué no se comparan factores Kt sin conocer su esfuerzo nominal?",
    "answers": [
      "Porque una referencia a sección neta difiere de una referencia a sección bruta.",
      "Porque todos los factores usan exactamente la misma área.",
      "Porque el radio no afecta al resultado.",
      "Porque Kt tiene unidades de fuerza."
    ],
    "faults": [
      [
        "Sección neta",
        "Se usa F/(Wt) con un factor de sección neta.",
        "Se mezclan definiciones."
      ],
      [
        "Filete agudo",
        "El esfuerzo de pico aumenta al reducir el radio.",
        "El radio modifica los coeficientes de concentración."
      ],
      [
        "Referencia incorrecta",
        "Se mezcla sección bruta y neta.",
        "Cada factor se aplica a su definición de esfuerzo nominal."
      ]
    ],
    "labels": "Agujero · hombro · filete · mordazas · pico analítico",
    "caption": "Detalle central · longitudes recortadas · picos analíticos",
    "tools": "Placa perforada y barra de hombro doble con filetes, ambas bajo tracción.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-256 · Mantén ambos picos ≤110 MPa, radio ≥3 mm y ancho ≤115 mm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Pico en agujero / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://s1b0d3d77136c1679.jimcontent.com/download/version/1531108625/module/14143373530/name/Roark-Ch06.pdf",
    "sourceName": "Roark · capítulo 6 · tabla 6-1, II-2a y III-1a",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Un borde agudo concentra la carga; un radio mayor puede repartirla mejor.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Detalle central · longitudes recortadas · picos analíticos",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 257,
    "slug": "torsion-eje-dimensionado",
    "title": "Torsión: selecciona el diámetro del eje",
    "longTitle": "Torsión: selecciona el diámetro del eje",
    "intro": "Un eje puede resistir el par y aun así torcerse demasiado para su trabajo.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "torque",
        "label": "Par transmitido",
        "min": 200,
        "max": 800,
        "step": 25,
        "unit": "N·m",
        "decimals": 0
      },
      {
        "id": "diameter",
        "label": "Diámetro",
        "min": 20,
        "max": 50,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Giro de extremo",
        "key": "angle",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 2
      },
      {
        "label": "Cortante máximo",
        "key": "stress",
        "unit": "MPa",
        "scale": 1e-06,
        "decimals": 2
      },
      {
        "label": "Masa",
        "key": "mass",
        "unit": "kg",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Momento polar",
        "key": "J",
        "unit": "mm⁴",
        "scale": 1000000000000.0,
        "decimals": 0
      }
    ],
    "task": "Transmite ≥350 N·m con giro ≤1,5°, cortante ≤80 MPa y masa ≤11 kg.",
    "equations": "Eje circular macizo L=1 m, G=80 GPa, ρ=7850 kg/m³. J=πd⁴/32; φ(x)=Tx/(GJ); τ(r)=Tr/J; τmax=16T/(πd³). m=ρπd²L/4.",
    "limits": "Torsión de Saint-Venant elástica uniforme, sin chavetas, concentraciones, fatiga ni flexión. Giro visible ×8; diámetro visual ×3; líneas de fibra siguen φ(x), no son resortes ni corrientes.",
    "quiz": "¿Qué criterio comprueba la precisión angular?",
    "answers": [
      "El límite de giro, además del límite de cortante.",
      "Únicamente la masa del eje.",
      "Únicamente el esfuerzo de fluencia.",
      "La temperatura ambiente sin carga."
    ],
    "faults": [
      [
        "Eje delgado",
        "Crece el giro más deprisa que el esfuerzo.",
        "φ depende de d⁻⁴ y τ de d⁻³."
      ],
      [
        "Par excesivo",
        "Suben giro y esfuerzo linealmente.",
        "Ambos dependen de T."
      ],
      [
        "Masa excesiva",
        "La solución sobredimensionada incumple el montaje.",
        "Resistencia no es el único requisito."
      ]
    ],
    "labels": "Eje · mordaza fija · brida · fibras · brazo de par",
    "caption": "Giro ×8 · diámetro ×3 · torsión elástica",
    "tools": "Banco de torsión con eje macizo y bridas.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-257 · Transmite ≥350 N·m con giro ≤1,5°, cortante ≤80 MPa y masa ≤11 kg.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Giro de extremo / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Un eje puede resistir el par y aun así torcerse demasiado para su trabajo.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Giro ×8 · diámetro ×3 · torsión elástica",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 258,
    "slug": "recipiente-aro-espesor",
    "title": "Recipiente a presión: aro y espesor mínimo",
    "longTitle": "Recipiente a presión: aro y espesor mínimo",
    "intro": "La pared de un depósito soporta más esfuerzo alrededor que a lo largo.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "pressure",
        "label": "Presión interior",
        "min": 1,
        "max": 4,
        "step": 0.2,
        "unit": "MPa",
        "decimals": 1
      },
      {
        "id": "thickness",
        "label": "Espesor",
        "min": 2,
        "max": 10,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Esfuerzo de aro",
        "key": "hoop",
        "unit": "MPa",
        "scale": 1e-06,
        "decimals": 2
      },
      {
        "label": "Esfuerzo axial",
        "key": "axial",
        "unit": "MPa",
        "scale": 1e-06,
        "decimals": 2
      },
      {
        "label": "Espesor por aro",
        "key": "minThickness",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      },
      {
        "label": "Relación de pared",
        "key": "ratio",
        "unit": "r/t",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Trabaja a ≥1,8 MPa con aro entre 80 y 110 MPa, espesor ≤9 mm y r/t ≥20.",
    "equations": "Cilindro cerrado r=0,2 m. σθ=pr/t; σz=pr/(2t); σVM=√(σθ²+σz²−σθσz); tmin=pr/σadm con σadm=120 MPa. εr=(σθ−νσz)/E; E=210 GPa, ν=0,3.",
    "limits": "Pared delgada, presión uniforme, sin soldaduras, tapas calculadas, corrosión, fatiga, temperatura ni código de recipientes. Corte de carcasa para ver espesor, ampliado ×4; expansión radial ×30. Es una comparación de esfuerzos, no diseño certificable.",
    "quiz": "¿Qué relación guardan aro y axial en un cilindro cerrado ideal?",
    "answers": [
      "El esfuerzo de aro es el doble del axial.",
      "El axial siempre es cero.",
      "Ambos son iguales para cualquier forma.",
      "El aro depende sólo de la longitud."
    ],
    "faults": [
      [
        "Pared fina",
        "El esfuerzo de aro supera el límite.",
        "σθ=pr/t."
      ],
      [
        "Confundir esfera",
        "Se usa pr/(2t) para el aro cilíndrico.",
        "La geometría cambia el equilibrio."
      ],
      [
        "Pared gruesa",
        "Se extrapola la fórmula fuera de r/t adecuado.",
        "El modelo requiere pared delgada."
      ]
    ],
    "labels": "Carcasa · corte · tapas · conexión · apoyos",
    "caption": "Espesor ×4 · expansión ×30 · pared delgada",
    "tools": "Depósito seccionado y comparador de pared.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-258 · Trabaja a ≥1,8 MPa con aro entre 80 y 110 MPa, espesor ≤9 mm y r/t ≥20.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Esfuerzo de aro / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "La pared de un depósito soporta más esfuerzo alrededor que a lo largo.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Espesor ×4 · expansión ×30 · pared delgada",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 259,
    "slug": "cercha-equilibrio-barras",
    "title": "Cercha: reacciones y fuerzas en las barras",
    "longTitle": "Cercha: reacciones y fuerzas en las barras",
    "intro": "Un triángulo reparte la carga entre barras que tiran o empujan.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "load",
        "label": "Carga del nudo",
        "min": 10,
        "max": 50,
        "step": 1,
        "unit": "kN",
        "decimals": 0
      },
      {
        "id": "height",
        "label": "Altura de cercha",
        "min": 250,
        "max": 1000,
        "step": 25,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Reacción por apoyo",
        "key": "reaction",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Diagonal (− compresión)",
        "key": "diagonal",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Tirante (+ tracción)",
        "key": "bottom",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Flecha del nudo",
        "key": "deflection",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      }
    ],
    "task": "Sostén ≥24 kN con esfuerzo ≤100 MPa, flecha ≤2 mm y altura ≤800 mm.",
    "equations": "Cercha triangular, base 2 m y nudo central a h. Barras A=300 mm², E=210 GPa; l=√(1+h²). RA=RB=P/2; Nd=−Pl/(2h); Nt=P/(2h). Castigliano: δ=P(l³+1)/(2EA h²). Un apoyo articulado y otro rodillo.",
    "limits": "Barras biarticuladas sólo axiales, sin peso propio, rigidez de nudos, flexión ni verificación de pandeo de diagonales. Deformada sólo del nudo por trabajo virtual, ×25; no apta para selección estructural real.",
    "quiz": "¿Qué ocurre con las fuerzas si una cercha se vuelve muy baja?",
    "answers": [
      "Aumentan porque las diagonales tienen menos componente vertical.",
      "Siempre se reducen a cero.",
      "La reacción vertical desaparece.",
      "El tirante cambia automáticamente a cable sin esfuerzo."
    ],
    "faults": [
      [
        "Cercha baja",
        "Crece fuerza axial para sostener la misma carga.",
        "La componente vertical de la diagonal se reduce."
      ],
      [
        "Signo mal leído",
        "Se interpreta compresión como tracción.",
        "Se declara N positivo en tracción."
      ],
      [
        "Omitir pandeo",
        "Se toma el esfuerzo axial como garantía total.",
        "Las diagonales comprimidas requieren otra comprobación."
      ]
    ],
    "labels": "Diagonales · tirante · nudo · articulación · rodillo",
    "caption": "Deformada ×25 · barras axiales · sin pandeo",
    "tools": "Cercha triangular con rótulas y registro de fuerzas.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-259 · Sostén ≥24 kN con esfuerzo ≤100 MPa, flecha ≤2 mm y altura ≤800 mm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Reacción por apoyo / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Un triángulo reparte la carga entre barras que tiran o empujan.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Deformada ×25 · barras axiales · sin pandeo",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 260,
    "slug": "fractura-grieta-critica",
    "title": "Fractura: grieta crítica y margen de inspección",
    "longTitle": "Fractura: grieta crítica y margen de inspección",
    "intro": "Una grieta puede volver peligrosa una carga que antes parecía pequeña.",
    "explore": "Cambia un ajuste, observa la pieza y contrasta sus lecturas antes de ensayar.",
    "controls": [
      {
        "id": "stress",
        "label": "Esfuerzo nominal",
        "min": 60,
        "max": 200,
        "step": 10,
        "unit": "MPa",
        "decimals": 0
      },
      {
        "id": "crack",
        "label": "Profundidad de grieta",
        "min": 2,
        "max": 20,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Intensidad K",
        "key": "K",
        "unit": "MPa√m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Grieta crítica",
        "key": "critical",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      },
      {
        "label": "Reserva de tenacidad",
        "key": "safety",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Zona plástica",
        "key": "plasticZone",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      }
    ],
    "task": "Mantén reserva Kic/K ≥2, esfuerzo ≥90 MPa, grieta ≥5 mm y zona plástica ≤10 % de a.",
    "equations": "Grieta de borde pequeña en placa ancha, modo I. Y=1,12; K=Yσ√(πa), Kic=50 MPa√m. acr=(Kic/(Yσ))²/π. Zona plástica en tensión plana rp=(K/σy)²/(2π), σy=350 MPa.",
    "limits": "Mecánica de fractura lineal elástica, Y constante sólo para grieta pequeña en placa ancha. Tenacidad y fluencia sintéticas. No propagación de Paris, crecimiento temporal, cierre, corrosión ni dictamen real. Grieta geométrica a escala de placa de 250 mm; zona plástica ilustrada a escala, sin campo FEM. Trazo luminoso: localizador de grieta, no abertura física de ese grosor.",
    "quiz": "¿Cómo cambia K si la grieta se cuadruplica a esfuerzo fijo?",
    "answers": [
      "K se duplica porque depende de la raíz de a.",
      "K se cuadruplica.",
      "K queda igual.",
      "K se divide entre cuatro."
    ],
    "faults": [
      [
        "Grieta mayor",
        "Sube K aun con el mismo esfuerzo nominal.",
        "K depende de √a."
      ],
      [
        "Esfuerzo mayor",
        "Se reduce el tamaño crítico.",
        "acr depende de 1/σ²."
      ],
      [
        "Plasticidad grande",
        "La zona plástica deja de ser pequeña frente a a.",
        "La aproximación lineal pierde validez."
      ]
    ],
    "labels": "Placa · grieta · punta · mordazas · zona plástica",
    "caption": "Modo I · geometría de borde · sin propagación",
    "tools": "Placa con grieta de borde y visor de punta.",
    "procedure": [
      "Observa apoyos, pieza y sentido de carga.",
      "Ajusta los mandos para cumplir simultáneamente todos los criterios.",
      "Prepara el ensayo, registra el ajuste y valida antes de comparar curvas."
    ],
    "job": "OT-260 · Mantén reserva Kic/K ≥2, esfuerzo ≥90 MPa, grieta ≥5 mm y zona plástica ≤10 % de a.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Intensidad K / referencia cero",
    "eyebrow": "Orden de trabajo · mecánica de sólidos",
    "module": "Mecánica de Sólidos",
    "area": "MECÁNICA DE SÓLIDOS",
    "source": "https://web.mit.edu/course/3/3.11/www/module_list.html",
    "sourceName": "MIT · Mechanics of Materials · David Roylance",
    "tour": [
      {
        "title": "Observa la pieza",
        "text": "Una grieta puede volver peligrosa una carga que antes parecía pequeña.",
        "view": "assembly"
      },
      {
        "title": "Explora el detalle",
        "text": "Modo I · geometría de borde · sin propagación",
        "view": "inspection"
      },
      {
        "title": "Entrega evidencia",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste antes de validar.",
        "view": "assembly"
      }
    ]
  }
];
