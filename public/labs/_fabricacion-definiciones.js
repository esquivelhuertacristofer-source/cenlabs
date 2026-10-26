export const definitions = [
  {
    "id": 211,
    "slug": "calibracion-camara-robot-planar",
    "title": "Calibración cámara–robot: correspondencias planares",
    "longTitle": "Calibración cámara–robot: correspondencias planares",
    "intro": "Relaciona las medidas de una cámara con el marco de la herramienta y comprueba el error sobre varios puntos.",
    "explore": "Una rotación incorrecta abre los residuos con la distancia; un desplazamiento incorrecto mueve todo el patrón.",
    "controls": [
      {
        "id": "angle",
        "label": "Rotación estimada",
        "min": 0,
        "max": 16,
        "step": 0.1,
        "unit": "°",
        "decimals": 1
      },
      {
        "id": "offset",
        "label": "Traslación estimada X",
        "min": 10,
        "max": 60,
        "step": 0.5,
        "unit": "mm",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Residuo RMS",
        "key": "rms",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Error máximo",
        "key": "maxError",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Reproyección equivalente",
        "key": "pixels",
        "unit": "px",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Extensión del patrón",
        "key": "coverage",
        "unit": "mm",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Ajusta la transformación para obtener RMS ≤0,5 mm, error máximo ≤0,7 mm y reproyección equivalente ≤0,7 px.",
    "equations": "Transformación rígida planar pG=R(θ)pC+[tx,−20] mm. Seis correspondencias sintéticas en el marco de la brida. Reproyección equivalente epx=800·e/600. Robot SCARA: x=0,85cos(q1)+0,65cos(q1+q2), z=0,85sin(q1)+0,65sin(q1+q2) m. Se ajustan θ y tx; ty y la escala óptica se conocen.",
    "limits": "Ejercicio reducido a dos grados de libertad; no resuelve AX=XB completo ni estima distorsión, orientación 3D, ruido de detección o incertidumbre del robot. Las muestras están pretransformadas al marco de brida. Rayos y cámara contextualizan la medición; no son un simulador de imágenes PnP. Residuos visuales amplificados 4 veces.",
    "source": "https://docs.opencv.org/5.0/main_modules/calib.html",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Qué diferencia ayuda a separar error angular y error de traslación?",
    "answers": [
      "El error angular cambia con la posición del punto; una traslación añade un vector común.",
      "Ambos producen siempre el mismo vector en todos los puntos.",
      "Un solo punto determina todas las rotaciones posibles.",
      "La calibración elimina por sí sola la flexión del robot."
    ],
    "faults": [
      [
        "Rotación incorrecta",
        "Los residuos crecen hacia extremos opuestos del patrón.",
        "Una rotación afecta de forma distinta a puntos separados."
      ],
      [
        "Traslación incorrecta",
        "Todos los puntos se desplazan aproximadamente en una dirección.",
        "La traslación suma el mismo vector a cada punto."
      ],
      [
        "Muestras poco extensas",
        "El ajuste parece bueno cerca del centro y empeora al alejarse.",
        "Una distribución extensa permite distinguir mejor el error angular."
      ]
    ],
    "labels": "Base · hombro · codo · cámara · patrón · residuos",
    "caption": "Modelo planar · residuos ×4 · cámara sintética",
    "tools": "SCARA, cámara, patrón, correspondencias y visor de residuos.",
    "procedure": [
      "Observa el patrón y las correspondencias normalizadas.",
      "Ajusta rotación y traslación comparando los seis residuos.",
      "Adquiere un ciclo de poses y valida todos los criterios."
    ],
    "job": "OT-211 · Ajusta la transformación para obtener RMS ≤0,5 mm, error máximo ≤0,7 mm y reproyección equivalente ≤0,7 px.",
    "timeScale": 1,
    "testSeconds": 12,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Relaciona las medidas de una cámara con el marco de la herramienta y comprueba el error sobre varios puntos.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "Una rotación incorrecta abre los residuos con la distancia; un desplazamiento incorrecto mueve todo el patrón.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ],
    "referenceAfterValidation": "Referencia del banco validado: θ=8,0°; tx=35,0 mm. Es una transformación planar sintética."
  },
  {
    "id": 212,
    "slug": "soldadura-mig-cordon-robot",
    "title": "Soldadura MIG robotizada: formación del cordón",
    "longTitle": "Soldadura MIG robotizada: formación del cordón",
    "intro": "Observa cómo el avance de la antorcha forma un cordón y equilibra energía y material por unidad de longitud.",
    "explore": "El mismo aporte por segundo se concentra más cuando la antorcha avanza despacio.",
    "controls": [
      {
        "id": "current",
        "label": "Corriente del arco",
        "min": 120,
        "max": 260,
        "step": 5,
        "unit": "A",
        "decimals": 0
      },
      {
        "id": "speed",
        "label": "Avance de antorcha",
        "min": 3,
        "max": 10,
        "step": 0.25,
        "unit": "mm/s",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Aporte térmico",
        "key": "heat",
        "unit": "J/mm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Sección depositada",
        "key": "area",
        "unit": "mm²",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Potencia útil",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Tiempo del cordón",
        "key": "duration",
        "unit": "s",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Prepara 100 mm de cordón con aporte 400–650 J/mm, sección depositada 10–15 mm² y duración ≤20 s.",
    "equations": "Arco a 22 V; rendimiento constante η=0,75. P=ηVI y H=P/v. Hilo de 1 mm a 6 m/min: Q=π(0,5)²·100 mm³/s. Sección depositada A=Q/v. Ancho ilustrativo de un cordón semielíptico w=√(8A/π). Recorrido lineal de 100 mm.",
    "limits": "Parámetros sintéticos independientes para enseñar balances; no reproduce la relación eléctrica de una fuente MIG real ni una WPS. Sin metalurgia, penetración, transferencia de gotas, gas, salpicadura o predicción de resistencia. El color es un indicador de enfriamiento ilustrativo, no termometría ni solución térmica. Pórtico robotizado cartesiano, no brazo de seis ejes. Los destellos son ilustrativos; no representan una distribución predicha de salpicadura.",
    "source": "https://www.twi-global.com/technical-knowledge/job-knowledge/measurement-of-arc-welding-parameters-139",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Por qué bajar el avance puede aumentar tanto el cordón como el aporte térmico por milímetro?",
    "answers": [
      "La misma energía y el mismo material por segundo se reparten en menos longitud.",
      "Porque aumenta necesariamente el voltaje del banco.",
      "Porque desaparecen las pérdidas térmicas.",
      "Porque la corriente deja de influir."
    ],
    "faults": [
      [
        "Avance excesivo",
        "El cordón tiene poca sección y el aporte por longitud es bajo.",
        "Ambas magnitudes disminuyen al aumentar el avance."
      ],
      [
        "Corriente elevada",
        "El aporte térmico excede el criterio aunque el volumen depositado es aceptable.",
        "En este banco la corriente aumenta la potencia, con hilo fijo."
      ],
      [
        "Avance muy bajo",
        "Se acumulan demasiado material y energía en cada milímetro.",
        "La exposición por longitud aumenta al reducir el avance."
      ]
    ],
    "labels": "Pórtico · antorcha · hilo · arco · baño · cordón · chapas",
    "caption": "Balance por longitud · color de enfriamiento ilustrativo",
    "tools": "Robot cartesiano, antorcha MIG, hilo y registro de energía y depósito.",
    "procedure": [
      "Observa la unión y el hilo alimentado a velocidad fija.",
      "Ajusta corriente y avance comparando energía y sección.",
      "Registra el recorrido y conserva el informe de la orden."
    ],
    "job": "OT-212 · Prepara 100 mm de cordón con aporte 400–650 J/mm, sección depositada 10–15 mm² y duración ≤20 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Observa cómo el avance de la antorcha forma un cordón y equilibra energía y material por unidad de longitud.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "El mismo aporte por segundo se concentra más cuando la antorcha avanza despacio.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 213,
    "slug": "fabricacion-aditiva-fdm-flujo",
    "title": "Fabricación FDM: capas y límite de extrusión",
    "longTitle": "Fabricación FDM: capas y límite de extrusión",
    "intro": "Construye una pared por capas y comprueba si el extrusor puede entregar el material que pide la trayectoria.",
    "explore": "Una capa alta y un avance rápido demandan más caudal; el límite del extrusor deja material faltante.",
    "controls": [
      {
        "id": "height",
        "label": "Altura de capa",
        "min": 0.12,
        "max": 0.32,
        "step": 0.02,
        "unit": "mm",
        "decimals": 2
      },
      {
        "id": "speed",
        "label": "Velocidad de impresión",
        "min": 20,
        "max": 120,
        "step": 5,
        "unit": "mm/s",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Demanda de material",
        "key": "flow",
        "unit": "mm³/s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Entrega relativa",
        "key": "ratio",
        "unit": "%",
        "scale": 100,
        "decimals": 1
      },
      {
        "label": "Número de capas",
        "key": "layers",
        "unit": "",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Tiempo físico de pieza",
        "key": "lifetime",
        "unit": "s",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Imprime capas ≤0,24 mm, demanda ≤8 mm³/s, entrega ≥99 % y tiempo físico ≤220 s.",
    "equations": "Pared circular de radio 18 mm y alto 20 mm. N=ceil(20/h); la última capa se representa completa. Cordón ideal de ancho w=0,45 mm: A=h(w−h)+πh²/4. Q=A·v; Qentregado=min(Q,8). Longitud/capa=2π·18. Tiempo=N·longitud/v. Hilo de 1,75 mm: velocidad=Qentregado/(π·1,75²/4).",
    "limits": "Impresión de pared hueca ideal; sin soportes, relleno, aceleración, temperatura, presión del fundido, retracción ni adherencia. Cordones de sección ovalada ilustrativa; el balance usa sección de estadio. Tiempo de construcción acelerado 20 veces y sección de cordón ampliada para lectura. No genera G-code. La saturación de caudal es un límite sintético, no una impresora comercial. La cámara de inspección encuadra el volumen completo de movimiento del cabezal para evitar recortes durante la construcción.",
    "source": "https://help.prusa3d.com/article/extrusion-multiplier-calibration_2257",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Qué ocurre al pedir más caudal que la capacidad del extrusor de este banco?",
    "answers": [
      "La entrega queda limitada y el cordón resulta más estrecho que el solicitado.",
      "La impresora crea material para conservar siempre el ancho.",
      "Disminuye automáticamente el número de capas.",
      "El diámetro del hilo cambia por sí solo."
    ],
    "faults": [
      [
        "Saturación de caudal",
        "La demanda supera la entrega y aparecen cordones estrechos.",
        "El extrusor tiene un caudal máximo."
      ],
      [
        "Capa demasiado alta",
        "La textura vertical es gruesa aunque la entrega de material sea suficiente.",
        "La resolución vertical depende de la altura de capa."
      ],
      [
        "Avance insuficiente",
        "La calidad cumple pero se excede el tiempo de fabricación.",
        "Reducir el avance aumenta el tiempo de recorrido."
      ]
    ],
    "labels": "Bastidor · guías · carro · boquilla · filamento · cama · capas",
    "caption": "Construcción ×20 · cordones ampliados · pared ideal",
    "tools": "Impresora cartesiana, extrusor, pared por capas y balance volumétrico.",
    "procedure": [
      "Relaciona ancho, altura y avance con el caudal pedido.",
      "Comprueba la entrega real y la textura de las capas.",
      "Registra una ventana de construcción y valida el tiempo físico completo."
    ],
    "job": "OT-213 · Imprime capas ≤0,24 mm, demanda ≤8 mm³/s, entrega ≥99 % y tiempo físico ≤220 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Construye una pared por capas y comprueba si el extrusor puede entregar el material que pide la trayectoria.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "Una capa alta y un avance rápido demandan más caudal; el límite del extrusor deja material faltante.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 214,
    "slug": "tomografia-industrial-proyecciones",
    "title": "Tomografía industrial: proyecciones y poros",
    "longTitle": "Tomografía industrial: proyecciones y poros",
    "intro": "Observa un fantoma por dentro y elige una adquisición que equilibre muestreo, ruido y exposición relativa.",
    "explore": "Más vistas reducen el paso angular; más fotones reducen el ruido, a cambio de mayor exposición relativa.",
    "controls": [
      {
        "id": "views",
        "label": "Número de proyecciones",
        "min": 30,
        "max": 180,
        "step": 30,
        "unit": "",
        "decimals": 0
      },
      {
        "id": "photons",
        "label": "Fotones incidentes por rayo",
        "min": 1000,
        "max": 10000,
        "step": 1000,
        "unit": "",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Paso periférico",
        "key": "sampling",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Ruido central estimado",
        "key": "noise",
        "unit": "%",
        "scale": 100,
        "decimals": 2
      },
      {
        "label": "Exposición relativa",
        "key": "dose",
        "unit": "M relativas",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Tamaño del píxel",
        "key": "ds",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Obtén paso periférico ≤0,4 mm, ruido relativo central ≤6 % y exposición relativa ≤1,5 M unidades.",
    "equations": "Fantoma circular R=16 mm con tres poros. Proyecciones paralelas: I=N·exp(−µL), µ=0,10 mm⁻¹ sintético. Longitud de cada cuerda por intersección analítica con círculos. Ruido gaussiano de varianza I como aproximación de conteo Poisson; semilla fija. Logaritmo, filtro rampa discreto Ram-Lak y retroproyección interpolada 64×64 con paso 0,625 mm. Paso periférico=πR/vistas; ruido central≈1/√(N exp(−3,2)); exposición relativa=N·vistas/10⁶.",
    "limits": "Reconstrucción 2D paralela ideal, no tomografía cónica completa. Sin dispersión, endurecimiento del haz, respuesta de detector o datos reales. La exposición es un índice relativo, no dosis radiológica. El aspecto interior 3D muestra el fantoma de referencia, no una reconstrucción volumétrica. Rayos en falso color; µ es sintético. No sirve para certificar defectos.",
    "source": "https://scikit-image.org/docs/stable/api/skimage.transform.html#skimage.transform.iradon",
    "sourceName": "scikit-image: retroproyección filtrada",
    "quiz": "¿Por qué aumentar sólo el número de fotones no sustituye a añadir proyecciones?",
    "answers": [
      "Reduce ruido de conteo, pero no añade direcciones de observación.",
      "Porque los fotones no influyen en ninguna medición.",
      "Porque elimina todos los poros del objeto.",
      "Porque el muestreo angular depende sólo del color de la pieza."
    ],
    "faults": [
      [
        "Pocas proyecciones",
        "Aparecen estructuras direccionales y falta muestreo angular.",
        "Se necesitan distintas direcciones para reconstruir."
      ],
      [
        "Poco conteo",
        "La imagen fluctúa y se pierde contraste aunque haya bastantes vistas.",
        "El ruido relativo de conteo disminuye como 1/√N."
      ],
      [
        "Exposición excesiva",
        "El detalle cumple pero se supera el presupuesto relativo.",
        "La exposición relativa crece con fotones y vistas."
      ]
    ],
    "labels": "Emisor colimado · detector · fantoma · poros · mesa · haz",
    "caption": "Proyección paralela ideal · rayos en falso color · referencia 3D",
    "tools": "Gantry, fantoma, detector y reconstrucción por retroproyección filtrada.",
    "procedure": [
      "Observa las proyecciones del fantoma y sus cortes.",
      "Ajusta vistas y conteo y compara la reconstrucción del instrumento.",
      "Registra el barrido y valida muestreo, ruido y exposición."
    ],
    "job": "OT-214 · Obtén paso periférico ≤0,4 mm, ruido relativo central ≤6 % y exposición relativa ≤1,5 M unidades.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Observa un fantoma por dentro y elige una adquisición que equilibre muestreo, ruido y exposición relativa.",
        "view": "assembly"
      },
      {
        "title": "Acércate al mecanismo",
        "text": "Más vistas reducen el paso angular; más fotones reducen el ruido, a cambio de mayor exposición relativa.",
        "view": "inspection"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "assembly"
      }
    ],
    "environmentDir": [
      1.2,
      0.8,
      1.1
    ],
    "inspectionDir": [
      1.2,
      0.9,
      1.4
    ]
  },
  {
    "id": 215,
    "slug": "montaje-rodamiento-induccion",
    "title": "Montaje de rodamiento: calentamiento por inducción",
    "longTitle": "Montaje de rodamiento: calentamiento por inducción",
    "intro": "Calienta un rodamiento, observa su expansión y comprueba la holgura disponible cuando llega al eje.",
    "explore": "La dilatación facilita el montaje; el tiempo de traslado enfría la pieza y reduce la holgura.",
    "controls": [
      {
        "id": "power",
        "label": "Potencia del calentador",
        "min": 0.6,
        "max": 2.4,
        "step": 0.1,
        "unit": "kW",
        "decimals": 1
      },
      {
        "id": "seconds",
        "label": "Tiempo de calentamiento",
        "min": 20,
        "max": 120,
        "step": 5,
        "unit": "s",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Máxima prevista",
        "key": "hot",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Llegada prevista",
        "key": "arrival",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Holgura a la llegada",
        "key": "clearance",
        "unit": "µm",
        "scale": 1000,
        "decimals": 1
      },
      {
        "label": "Energía eléctrica",
        "key": "energy",
        "unit": "kJ",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Consigue holgura de llegada ≥15 µm, temperatura máxima ≤110 °C y calentamiento ≤100 s.",
    "equations": "Balance concentrado C dT/dt=ηP−H(T−20): C=2,8·460 J/K, η=0,72,H=6 W/K. En traslado de 4 s: enfriamiento con H=10 W/K. Diámetro interior 80 mm, α=11,5·10⁻⁶ K⁻¹. Eje a 20 °C, interferencia fría 0,040 mm; holgura=80α(Tllegada−20)−0,040.",
    "limits": "Modelo térmico uniforme con parámetros sintéticos, sin campo electromagnético, gradientes, lubricante ni tensiones de ajuste. El límite de 110 °C pertenece al escenario; un rodamiento real requiere especificación del fabricante. Se omite el ciclo de desmagnetización, declarado pendiente en un procedimiento real. Dilatación dibujada ×200; calentamiento y montaje se comprimen a 12 s de demostración. El cambio de color térmico es falso color, no incandescencia. El yugo se retira antes de elevar y trasladar el rodamiento; cada demostración es un ciclo independiente.",
    "source": "https://www.skf.com/binaries/pub12/Images/0901d1968013be94-SKF-bearing-maintenance-handbook---10001_1-EN%281%29_tcm_12-463040.pdf",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Por qué debe comprobarse la holgura a la llegada y no sólo al apagar el calentador?",
    "answers": [
      "Porque el rodamiento se enfría durante el traslado y pierde dilatación.",
      "Porque la interferencia fría desaparece para siempre.",
      "Porque el eje necesariamente se vuelve más pequeño al tocar el aire.",
      "Porque la temperatura no afecta al diámetro."
    ],
    "faults": [
      [
        "Calentamiento insuficiente",
        "La pieza llega sin holgura suficiente y no baja por el eje.",
        "La dilatación disponible no compensa interferencia y margen."
      ],
      [
        "Sobretemperatura",
        "Hay holgura pero se supera el límite térmico de la orden.",
        "Más temperatura no implica un proceso aceptable."
      ],
      [
        "Traslado ignorado",
        "El ajuste parece suficiente en el calentador pero pierde margen después.",
        "La temperatura de llegada determina la holgura de montaje."
      ]
    ],
    "labels": "Núcleo · bobina · yugo · rodamiento · pinza · eje · asiento",
    "caption": "Dilatación ×200 · calentamiento comprimido · temperatura uniforme · falso color térmico",
    "tools": "Calentador, pinza de traslado, rodamiento y eje con interferencia.",
    "procedure": [
      "Observa el diámetro interior y la interferencia fría.",
      "Ajusta potencia y tiempo incluyendo el enfriamiento de traslado.",
      "Registra calentamiento y llegada y verifica holgura y temperatura."
    ],
    "job": "OT-215 · Consigue holgura de llegada ≥15 µm, temperatura máxima ≤110 °C y calentamiento ≤100 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Calienta un rodamiento, observa su expansión y comprueba la holgura disponible cuando llega al eje.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "La dilatación facilita el montaje; el tiempo de traslado enfría la pieza y reduce la holgura.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 216,
    "slug": "inspeccion-engranajes-contacto",
    "title": "Inspección de engranajes: juego y contacto",
    "longTitle": "Inspección de engranajes: juego y contacto",
    "intro": "Invierte el giro y relaciona el juego libre con la distribución de carga a lo ancho del diente.",
    "explore": "El entrecentros cambia el juego; la inclinación concentra el contacto hacia un borde.",
    "controls": [
      {
        "id": "center",
        "label": "Corrección de entrecentros",
        "min": -0.05,
        "max": 0.3,
        "step": 0.01,
        "unit": "mm",
        "decimals": 2
      },
      {
        "id": "tilt",
        "label": "Inclinación relativa",
        "min": -0.4,
        "max": 0.4,
        "step": 0.01,
        "unit": "°",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Juego tangencial",
        "key": "backlash",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Ancho en contacto",
        "key": "coverage",
        "unit": "%",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Carga máxima/media",
        "key": "peakRatio",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Carga lineal máxima",
        "key": "peak",
        "unit": "N/mm",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Ajusta juego 0,10–0,20 mm, contacto ≥90 % y carga lineal máxima ≤1,6 veces la media.",
    "equations": "Engranes rectos de 20/40 dientes, módulo 2 mm y ángulo de presión 20°. Juego j=0,08+2Δa tan(20°) mm, aproximación para desplazamientos pequeños. Contacto de fundación elástica: q(x)=K max(0,δ−x tanβ), K=1000 N/mm²; ∫q dx=400 N en b=20 mm. Inversión con operador de juego de semiancho j/(2rp), rp=20 mm, y relación 1:2.",
    "limits": "No simula contacto Hertziano, lubricación, flexión detallada del diente ni certificación de engranes. El mapa de tinta es un indicador esquemático del reparto lineal de carga, no una huella predictiva 3D. El indicador de inversión amplía el error angular 90 veces; el falso color muestra carga relativa. Giro de inspección alternativo, cuasiestático; sin impacto ni vibración dinámica.",
    "source": "https://www.khkgears.us/media/1224/a-primer-on-backlash-and-its-purpose-in-gear-designs.pdf",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Por qué un juego correcto no garantiza buen contacto a lo ancho del diente?",
    "answers": [
      "La inclinación puede concentrar la carga aunque el juego sea adecuado.",
      "El juego mide directamente toda la distribución de presión.",
      "Un juego mayor siempre elimina la inclinación.",
      "El reparto de carga depende sólo del color de la tinta."
    ],
    "faults": [
      [
        "Entrecentros excesivo",
        "La inversión muestra demasiado recorrido libre.",
        "El juego aumenta al separar los centros."
      ],
      [
        "Ejes inclinados",
        "La marca y la carga se concentran en un borde.",
        "La inclinación cambia la separación a lo ancho."
      ],
      [
        "Ajuste demasiado cerrado",
        "El juego queda por debajo del margen aunque el contacto parezca centrado.",
        "La inspección debe comprobar ambos criterios."
      ]
    ],
    "labels": "Piñón · rueda · apoyos · comparador · flanco · huella",
    "caption": "Juego ampliado · contacto de fundación elástica · sin Hertz 3D",
    "tools": "Par de engranes, comparador de inversión y visor de contacto.",
    "procedure": [
      "Invierte el giro y observa el recorrido libre.",
      "Ajusta entrecentros e inclinación y compara juego y carga.",
      "Adquiere una inversión completa antes de validar el montaje."
    ],
    "job": "OT-216 · Ajusta juego 0,10–0,20 mm, contacto ≥90 % y carga lineal máxima ≤1,6 veces la media.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Invierte el giro y relaciona el juego libre con la distribución de carga a lo ancho del diente.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "El entrecentros cambia el juego; la inclinación concentra el contacto hacia un borde.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ],
    "inspectionDir": [
      0.9,
      0.35,
      1.5
    ]
  },
  {
    "id": 217,
    "slug": "impedancia-bateria-eis",
    "title": "Impedancia de batería: ajuste de un circuito equivalente",
    "longTitle": "Impedancia de batería: ajuste de un circuito equivalente",
    "intro": "Compara medidas complejas en frecuencia y ajusta un modelo eléctrico de una celda.",
    "explore": "Cambiar resistencia y capacidad modifica el tamaño del arco y su frecuencia característica.",
    "controls": [
      {
        "id": "resistance",
        "label": "Resistencia de transferencia estimada",
        "min": 10,
        "max": 60,
        "step": 1,
        "unit": "mΩ",
        "decimals": 0
      },
      {
        "id": "capacity",
        "label": "Capacidad equivalente estimada",
        "min": 0.5,
        "max": 4,
        "step": 0.1,
        "unit": "F",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Residuo complejo RMS",
        "key": "rms",
        "unit": "mΩ",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Frecuencia característica estimada",
        "key": "peak",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Constante equivalente",
        "key": "tau",
        "unit": "s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Diámetro estimado del arco",
        "key": "diameter",
        "unit": "mΩ",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Ajusta el espectro medido hasta obtener residuo complejo RMS ≤0,6 mΩ y coherencia de la constante dinámica.",
    "equations": "Circuito reducido Rs+(Rct∥C), Rs=8 mΩ conocido. Z=Rs+Rct/(1+j2πf Rct C); 41 frecuencias de 0,1 a 1000 Hz. Datos sintéticos sin ruido. Frecuencia característica fc=1/(2πRct C). Excitación ilustrativa a 1 Hz y 0,1 A; tensión incremental obtenida del mismo circuito medido. Resistencia y capacidad desconocidas se ajustan a los datos.",
    "limits": "No es un modelo electroquímico completo ni estima salud, capacidad útil o seguridad de una batería real. Sin difusión Warburg, CPE, inductancia de cables, SOC, temperatura o no linealidad. Capas y portadores en 3D son un esquema físico ampliado; la medición se presenta en DOM. La prueba no controla una batería ni un potenciostato real.",
    "source": "https://www.gamry.com/application-notes/eis/basics-of-electrochemical-impedance-spectroscopy",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Permite un ajuste correcto de este circuito declarar por sí solo la salud completa de una batería?",
    "answers": [
      "No; sólo identifica parámetros del modelo y condiciones representadas.",
      "Sí, determina sin ambigüedad toda su vida restante.",
      "Sí, certifica cualquier batería de cualquier química.",
      "Sí, hace innecesario conocer temperatura y estado de carga."
    ],
    "faults": [
      [
        "Resistencia incorrecta",
        "El arco estimado tiene tamaño distinto al medido.",
        "Rct fija su extensión resistiva."
      ],
      [
        "Capacidad incorrecta",
        "La distribución en frecuencia no coincide aunque el tamaño parezca razonable.",
        "C modifica la constante RctC."
      ],
      [
        "Conclusión excesiva",
        "Se atribuye una vida restante exacta a un solo ajuste.",
        "Un circuito reducido no identifica todas las causas de degradación."
      ]
    ],
    "labels": "Celda · colector · electrodos · separador · Kelvin · potenciostato",
    "caption": "Celda en corte esquemático · excitación incremental 1 Hz",
    "tools": "Celda virtual en corte, conexión Kelvin y analizador Nyquist/Bode.",
    "procedure": [
      "Observa los datos del barrido y la conexión de cuatro terminales.",
      "Ajusta el modelo contrastando partes real e imaginaria.",
      "Registra la respuesta y valida el ajuste sin inferir salud absoluta."
    ],
    "job": "OT-217 · Ajusta el espectro medido hasta obtener residuo complejo RMS ≤0,6 mΩ y coherencia de la constante dinámica.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Compara medidas complejas en frecuencia y ajusta un modelo eléctrico de una celda.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "Cambiar resistencia y capacidad modifica el tamaño del arco y su frecuencia característica.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ],
    "referenceAfterValidation": "Referencia del banco validado: Rct=32 mΩ y C=2,0 F. Parámetros sintéticos; no equivalen a una medida completa de salud."
  },
  {
    "id": 218,
    "slug": "diagnostico-cnc-ballbar",
    "title": "Diagnóstico CNC con ballbar",
    "longTitle": "Diagnóstico CNC con ballbar",
    "intro": "Recorre un círculo con una barra de medida y ajusta dos compensaciones geométricas observando el error radial.",
    "explore": "Un error de escala y una falta de escuadra dejan firmas diferentes en el recorrido.",
    "controls": [
      {
        "id": "scale",
        "label": "Compensación de escala X",
        "min": -300,
        "max": 300,
        "step": 5,
        "unit": "ppm",
        "decimals": 0
      },
      {
        "id": "square",
        "label": "Compensación de escuadra",
        "min": -100,
        "max": 100,
        "step": 5,
        "unit": "arcsec",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Desviación circular",
        "key": "circularity",
        "unit": "µm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error radial máximo",
        "key": "maxError",
        "unit": "µm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error radial instantáneo",
        "key": "radial",
        "unit": "µm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Ángulo del recorrido",
        "key": "theta",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 0
      }
    ],
    "task": "Obtén desviación circular ≤3 µm y error radial máximo ≤2 µm ajustando escala y escuadra.",
    "equations": "R=100 mm; x0=Rcosθ,y0=Rsinθ. x=(1+ex)x0+tan(ε)y0,y=y0. ex y ε son errores residuales después de compensar. Lectura radial=√(x²+y²)−R. Se muestrea una vuelta cada 1° y se calculan máximo y mínimo. Recorrido impuesto de 8 s; la prueba de regreso ideal reproduce la geometría.",
    "limits": "Modelo geométrico de dos errores; no reproduce el software Renishaw ni aplica compensaciones a una CNC. Sin holgura, inversión dinámica, servo, temperatura, montaje de rótulas o calibración del sensor. Errores de posición 3D amplificados 500 veces; números e instrumento conservan micrómetros físicos. Las constantes de referencia se revelan al validar.",
    "source": "https://www.renishaw.com/en/ballbar-testing-explained--6818",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Por qué hay que distinguir errores geométricos de errores de montaje o servo en una prueba real?",
    "answers": [
      "Porque distintas causas pueden alterar el mismo recorrido medido.",
      "Porque cualquier ovalidad demuestra una única causa universal.",
      "Porque una barra elimina todos los errores de montaje.",
      "Porque el sentido del recorrido nunca aporta información."
    ],
    "faults": [
      [
        "Escala residual",
        "La deformación sigue los ejes principales de la trayectoria.",
        "Una escala distinta en X modifica su amplitud respecto de Y."
      ],
      [
        "Escuadra residual",
        "La firma aparece inclinada respecto de los ejes.",
        "La falta de ortogonalidad acopla el movimiento de Y en X."
      ],
      [
        "Modelo incompleto",
        "Un registro real presenta picos de inversión que este ajuste no elimina.",
        "Dos parámetros geométricos no explican todas las causas de una máquina."
      ]
    ],
    "labels": "Pórtico · carro · husillo · ballbar · rótula · mesa",
    "caption": "Posición residual ×500 · círculo de referencia 100 mm",
    "tools": "Centro CNC, barra extensible y registro de desviación circular.",
    "procedure": [
      "Observa la barra y la trayectoria circular de referencia.",
      "Ajusta las compensaciones comparando la firma radial.",
      "Registra un recorrido y valida los dos límites."
    ],
    "job": "OT-218 · Obtén desviación circular ≤3 µm y error radial máximo ≤2 µm ajustando escala y escuadra.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Recorre un círculo con una barra de medida y ajusta dos compensaciones geométricas observando el error radial.",
        "view": "assembly"
      },
      {
        "title": "Acércate al mecanismo",
        "text": "Un error de escala y una falta de escuadra dejan firmas diferentes en el recorrido.",
        "view": "inspection"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "assembly"
      }
    ],
    "referenceAfterValidation": "Referencia del banco validado: error original de escala X=90 ppm y escuadra=60 arcsec. Datos sintéticos."
  },
  {
    "id": 219,
    "slug": "cambiador-herramientas-bloques",
    "title": "Cambiador de herramientas: secuencia por bloques",
    "longTitle": "Cambiador de herramientas: secuencia por bloques",
    "intro": "Programa el intercambio de dos herramientas y observa cómo las confirmaciones permiten cada movimiento.",
    "explore": "Una secuencia coherente coordina altura, agarre, desbloqueo, extracción, giro e inserción.",
    "controls": [
      {
        "id": "clearance",
        "label": "Cota de intercambio",
        "min": 100,
        "max": 240,
        "step": 10,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "turn",
        "label": "Tiempo del giro de intercambio",
        "min": 0.8,
        "max": 3.5,
        "step": 0.1,
        "unit": "s",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Velocidad máxima de herramienta",
        "key": "peakSpeed",
        "unit": "m/s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Par máximo de aceleración",
        "key": "peakTorque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Tiempo de ciclo",
        "key": "cycle",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Paso activo",
        "key": "step",
        "unit": "",
        "scale": 1,
        "decimals": 0
      }
    ],
    "task": "Verifica el programa de nueve bloques; usa cota ≥150 mm, velocidad ≤0,7 m/s, par ≤0,7 N·m y ciclo ≤8,5 s.",
    "equations": "Preflight de nueve comandos: orientar, subir, tomar, desbloquear, extraer, girar, insertar, bloquear y liberar. Giro π con perfil quintico s=10u³−15u⁴+6u⁵. Radio físico 0,22 m, dos herramientas de 1,4 kg: J=2mr². vmax=r·1,875π/T; τmax=J·(10√3/3)π/T². Tiempos restantes sintéticos y cota/150 s para elevar.",
    "limits": "Autómata didáctico de preflight, no lógica de un control Haas ni PLC de seguridad. Una permutación incoherente o cota insuficiente detiene la demostración antes de mover. Movimiento y tiempos de agarre prescritos; sin contacto FEM, flexibilidad, presión neumática o verificación de un equipo real. La secuencia se edita con bloques reordenables; no exporta código de máquina.",
    "source": "https://www.haascnc.com/fr/service/online-manuals/mill-tool-changer---service-manual/double-arm-and-cambox---service-replacements.html",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Por qué extraer debe preceder al giro del brazo?",
    "answers": [
      "Porque girar con un cono insertado produciría una interferencia mecánica.",
      "Porque el orden nunca afecta al montaje.",
      "Porque el giro bloquea siempre el husillo automáticamente.",
      "Porque la pinza puede sustituir cualquier confirmación."
    ],
    "faults": [
      [
        "Orden de bloques incorrecto",
        "El preflight rechaza el programa antes del intercambio.",
        "Las dependencias mecánicas deben cumplirse en orden."
      ],
      [
        "Cota insuficiente",
        "La secuencia está ordenada pero falta altura para intercambiar.",
        "La geometría impone una condición adicional al orden."
      ],
      [
        "Giro demasiado rápido",
        "La secuencia funciona pero excede velocidad o par de la orden.",
        "Los picos crecen al reducir la duración del perfil quintico."
      ]
    ],
    "labels": "Husillo · cono · brazo doble · pinzas · almacén · sensores",
    "caption": "Bloques editables · preflight didáctico · sin control de máquina",
    "tools": "Brazo doble, husillo, herramientas y editor de secuencia por bloques.",
    "procedure": [
      "Abre Programa y comprueba las dependencias entre bloques.",
      "Ajusta altura y tiempo del giro sin exceder velocidad o par.",
      "Ensaya el intercambio y descarga también la secuencia ejecutada."
    ],
    "job": "OT-219 · Verifica el programa de nueve bloques; usa cota ≥150 mm, velocidad ≤0,7 m/s, par ≤0,7 N·m y ciclo ≤8,5 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Programa el intercambio de dos herramientas y observa cómo las confirmaciones permiten cada movimiento.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "Una secuencia coherente coordina altura, agarre, desbloqueo, extracción, giro e inserción.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ]
  },
  {
    "id": 220,
    "slug": "cavitacion-bomba-centrifuga",
    "title": "Cavitación: aspiración de una bomba centrífuga",
    "longTitle": "Cavitación: aspiración de una bomba centrífuga",
    "intro": "Observa el impulsor y ajusta la aspiración para mantener margen frente a la vaporización del líquido.",
    "explore": "La altura de aspiración y las pérdidas reducen la presión disponible en la entrada.",
    "controls": [
      {
        "id": "head",
        "label": "Nivel del depósito sobre la bomba",
        "min": -6,
        "max": 2,
        "step": 0.25,
        "unit": "m",
        "decimals": 2
      },
      {
        "id": "flow",
        "label": "Caudal solicitado",
        "min": 1,
        "max": 5,
        "step": 0.25,
        "unit": "L/s",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "NPSH disponible",
        "key": "available",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "NPSH requerido sintético",
        "key": "required",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Margen disponible",
        "key": "margin",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Potencia estimada",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 0
      }
    ],
    "task": "Mantén margen NPSH ≥1 m, caudal ≥2,5 L/s, potencia ≤1200 W y una hipótesis compatible con líquido continuo.",
    "equations": "Agua a 20 °C: ρ=998 kg/m³,pv=2340 Pa,patm=101325 Pa,g=9,81. Aspiración L=10 m,D=0,04 m,f=0,025,ΣK=4: hf=(fL/D+ΣK)v²/(2g). NPSHa=(patm−pv)/(ρg)+z−hf. Curva sintética NPSHr=2+0,12Q² m, Q en L/s. Hnom=25−0,8Q² m; indicador de déficit c=clamp(−margen/NPSHr,0,1); H=Hnom(1−0,15c),P=ρgQH/0,68.",
    "limits": "Caudal impuesto para estudiar la aspiración; no resuelve el punto de operación de la instalación. NPSHr, reducción de altura y umbral de margen son sintéticos. NPSH3 real no garantiza ausencia de toda cavitación. Las burbujas representan déficit normalizado, no fracción de vapor ni dinámica Rayleigh–Plesset. Si NPSHa≤0 la hipótesis estacionaria deja de ser admisible. Impulsor estroboscópico ×1/120 y flujo visible ralentizado ×1/20.",
    "source": "https://giw.ksb.com/blog/net-positive-suction-head",
    "sourceName": "Documentación técnica del principio",
    "quiz": "¿Qué efecto tiene reducir pérdidas de aspiración manteniendo el caudal?",
    "answers": [
      "Aumenta el NPSH disponible al disminuir la caída de presión.",
      "Aumenta necesariamente la presión de vapor del agua.",
      "Elimina la necesidad de conocer el NPSH requerido.",
      "Convierte cualquier curva de bomba en una certificación."
    ],
    "faults": [
      [
        "Nivel insuficiente",
        "El líquido debe ascender demasiado y cae el margen de aspiración.",
        "La cota negativa reduce el NPSH disponible."
      ],
      [
        "Caudal excesivo",
        "Las pérdidas crecen con el cuadrado de la velocidad y el margen disminuye.",
        "La aspiración se vuelve más exigente al aumentar el caudal."
      ],
      [
        "Conclusión fuera de modelo",
        "Se pretende usar el indicador de burbujas como porcentaje exacto de vapor.",
        "El indicador es cualitativo y no resuelve la dinámica de cavidades."
      ]
    ],
    "labels": "Depósito · aspiración · voluta · impulsor · ojo · burbujas · salida",
    "caption": "Impulsor ×1/120 · flujo ×1/20 · burbujas esquemáticas",
    "tools": "Depósito, línea de aspiración, bomba seccionada y balance NPSH.",
    "procedure": [
      "Observa el ojo del impulsor y el recorrido del líquido.",
      "Relaciona nivel y caudal con las pérdidas de aspiración.",
      "Registra el funcionamiento y valida margen, entrega y potencia."
    ],
    "job": "OT-220 · Mantén margen NPSH ≥1 m, caudal ≥2,5 L/s, potencia ≤1200 W y una hipótesis compatible con líquido continuo.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "medición del proceso / referencia del banco",
    "eyebrow": "Orden de trabajo · fabricación y diagnóstico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Observa el impulsor y ajusta la aspiración para mantener margen frente a la vaporización del líquido.",
        "view": "inspection"
      },
      {
        "title": "Sitúa el equipo",
        "text": "La altura de aspiración y las pérdidas reducen la presión disponible en la entrada.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra el ajuste completo antes de validarlo.",
        "view": "inspection"
      }
    ]
  }
];
