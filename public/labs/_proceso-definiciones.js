export const definitions = [
  {
    "id": 221,
    "slug": "ultrasonido-arreglo-fases",
    "title": "Ultrasonido phased array: enfoque electrónico",
    "longTitle": "Ultrasonido phased array: enfoque electrónico",
    "intro": "Dieciséis elementos emiten con retardos distintos y concentran el frente acústico dentro de una pieza.",
    "explore": "Dirige el foco a un reflector conocido y comprueba la suma coherente.",
    "controls": [
      {
        "id": "angle",
        "label": "Dirección del foco",
        "min": 15,
        "max": 40,
        "step": 0.25,
        "unit": "°",
        "decimals": 2
      },
      {
        "id": "depth",
        "label": "Profundidad focal",
        "min": 20,
        "max": 70,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Error de foco",
        "key": "error",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Suma coherente",
        "key": "gain",
        "unit": "%",
        "scale": 100,
        "decimals": 1
      },
      {
        "label": "Retardo máximo",
        "key": "maxDelay",
        "unit": "µs",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Tiempo hasta foco",
        "key": "travel",
        "unit": "µs",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Enfoca el reflector patrón (x=18 mm, z=40 mm) con error ≤0,8 mm y suma coherente ≥90 %.",
    "equations": "16 elementos a paso 0,6 mm; frecuencia 4 MHz, c=5,9 mm/µs. Foco=(z tanθ,z). τi=max(di/c)−di/c. Amplitud normalizada=|Σexp[j2πf(τi+ri/c)]|/16. Distancias en mm; el reflector es una referencia conocida.",
    "limits": "Medio homogéneo longitudinal, sin cuña ni refracción, atenuación, respuesta de elemento o caracterización de defectos. Amplitud coherente monocromática; los arcos representan frentes, no una solución de onda transitoria. Tiempo de propagación ralentizado 200000 veces. No interpreta ensayos reales. El campo coloreado representa la amplitud monocromática calculada, no una temperatura.",
    "source": "https://industrial.evidentscientific.com.cn/zh/.downloads/download/?file=285218469&fl=en_US",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué se retrasa de forma distinta cada elemento?",
    "answers": [
      "Para que sus contribuciones lleguen en fase al foco elegido.",
      "Para que todos los elementos emitan al mismo instante, cualquiera que sea el foco.",
      "Para compensar sólo la atenuación, sin modificar la fase.",
      "Para que el foco dependa únicamente del tamaño del reflector."
    ],
    "faults": [
      [
        "Foco desviado",
        "La energía coherente disminuye en el reflector patrón.",
        "El foco debe coincidir espacialmente con la referencia."
      ],
      [
        "Profundidad incorrecta",
        "La convergencia sucede antes o después del reflector.",
        "Los recorridos y retardos dependen de la profundidad."
      ],
      [
        "Lectura sobredimensionada",
        "Se pretende estimar tamaño de una grieta con la amplitud ideal.",
        "El banco omite propagación y respuesta real del defecto."
      ]
    ],
    "labels": "Sonda · elementos · bloque · frentes · foco · reflector",
    "caption": "Onda ×1/200000 · campo coherente en falso color · reflector conocido",
    "tools": "Sonda lineal, bloque patrón y visor de leyes focales.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-221 · Enfoca el reflector patrón (x=18 mm, z=40 mm) con error ≤0,8 mm y suma coherente ≥90 %.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "amplitud coherente / umbral (0–1)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Dieciséis elementos emiten con retardos distintos y concentran el frente acústico dentro de una pieza.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Dirige el foco a un reflector conocido y comprueba la suma coherente.",
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
    "id": 222,
    "slug": "sensor-fuerza-par-matriz",
    "title": "Sensor de fuerza y par: calibración de seis ejes",
    "longTitle": "Sensor de fuerza y par: calibración de seis ejes",
    "intro": "Abre el sensor, observa sus flexuras y corrige el acoplamiento entre seis canales.",
    "explore": "Compara cargas patrón con la lectura reconstruida mediante una matriz inversa.",
    "controls": [
      {
        "id": "gain",
        "label": "Ganancia estimada",
        "min": 0.9,
        "max": 1.15,
        "step": 0.005,
        "unit": "",
        "decimals": 3
      },
      {
        "id": "cross",
        "label": "Acoplamiento estimado",
        "min": -0.05,
        "max": 0.1,
        "step": 0.005,
        "unit": "",
        "decimals": 3
      }
    ],
    "metrics": [
      {
        "label": "Residuo RMS",
        "key": "rms",
        "unit": "%",
        "scale": 100,
        "decimals": 3
      },
      {
        "label": "Error máximo",
        "key": "maxError",
        "unit": "%",
        "scale": 100,
        "decimals": 3
      },
      {
        "label": "Fuerza aplicada",
        "key": "force",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Par aplicado",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Calibra doce cargas patrón: RMS normalizado ≤0,3 % y error máximo ≤0,5 %.",
    "equations": "Canales normalizados con escalas 100 N y 10 N·m. s=g(I+cC)w; C desplaza cíclicamente seis canales. Se reconstruye w con inversa 6×6 de la matriz estimada. Doce patrones ±unitarios. Fuerza dinámica prescrita; desplazamiento elástico F/(0,5 MN/m), ampliado ×200. Rigidez torsional ilustrativa 20000 N·m/rad; giro elástico ampliado ×200. El informe conserva las doce filas de señales normalizadas de entrada.",
    "limits": "Sólo dos parámetros globales de una matriz sintética; no estima 36 constantes independientes ni temperatura, histéresis o dinámica estructural. Las flexuras son esquemáticas, sin FEM. Cargas patrón independientes y datos sin ruido. No controla un sensor ATI ni usa su calibración.",
    "source": "https://www.ati-ia.com/zh-CN/library/documents/FT_FAQ.pdf",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Qué distingue error de ganancia y acoplamiento?",
    "answers": [
      "La ganancia escala el canal cargado; el acoplamiento introduce respuesta en otros canales.",
      "La ganancia genera sólo señal en ejes descargados y el acoplamiento sólo cambia la escala del eje cargado.",
      "Una carga en un único eje basta para identificar todos los acoplamientos posibles.",
      "La matriz inversa elimina el ruido aunque no existan patrones de referencia."
    ],
    "faults": [
      [
        "Ganancia incorrecta",
        "El canal cargado no reproduce el patrón.",
        "La escala estimada no coincide con el banco."
      ],
      [
        "Acoplamiento residual",
        "Aparece lectura donde el patrón no aplica carga.",
        "La reconstrucción debe separar los canales."
      ],
      [
        "Patrones insuficientes",
        "Un único eje no permite evaluar todo el sensor.",
        "Se necesitan cargas independientes en los seis canales."
      ]
    ],
    "labels": "Brida · flexuras · galgas · herramienta · cable · cargas",
    "caption": "Deformación ×200 · seis canales normalizados · sin FEM",
    "tools": "Sensor seccionado, patrones de fuerza/par e inversa matricial.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-222 · Calibra doce cargas patrón: RMS normalizado ≤0,3 % y error máximo ≤0,5 %.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "Fx aplicado / reconstruido (100 N=1)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Abre el sensor, observa sus flexuras y corrige el acoplamiento entre seis canales.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Compara cargas patrón con la lectura reconstruida mediante una matriz inversa.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "referenceAfterValidation": "Banco sintético validado: ganancia 1,035 y acoplamiento c=0,040; escalas 100 N / 10 N·m."
  },
  {
    "id": 223,
    "slug": "cadena-rodillos-efecto-poligonal",
    "title": "Cadena de rodillos: efecto poligonal",
    "longTitle": "Cadena de rodillos: efecto poligonal",
    "intro": "Una cadena real avanza eslabón a eslabón sobre dos ruedas dentadas y su velocidad oscila.",
    "explore": "El número de dientes suaviza la marcha; las rpm y la potencia fijan velocidad y esfuerzo.",
    "controls": [
      {
        "id": "teeth",
        "label": "Dientes por rueda",
        "min": 12,
        "max": 28,
        "step": 2,
        "unit": "",
        "decimals": 0
      },
      {
        "id": "rpm",
        "label": "Régimen de entrada",
        "min": 60,
        "max": 240,
        "step": 10,
        "unit": "rpm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Velocidad media",
        "key": "mean",
        "unit": "m/s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Ondulación",
        "key": "ripple",
        "unit": "%",
        "scale": 100,
        "decimals": 2
      },
      {
        "label": "Fuerza transmitida",
        "key": "force",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Carga en apoyos",
        "key": "load",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Transporta a 0,8–1,2 m/s, ondulación ≤1 % y carga en apoyos ≤300 N.",
    "equations": "Paso p=12,7 mm, 80 eslabones, ruedas iguales de z dientes pares. R=p/[2sin(π/z)], C=(80−z)p/2. Velocidad media=pzn/60; instantánea=ωRcosδ, |δ|≤π/z. Ondulación=(vmax−vmin)/vmedia. Potencia útil 120 W y pretensión 50 N: ΔT=P/vmedia; carga aproximada=100+ΔT.",
    "limits": "Geometría de paso exacto; contorno del diente ilustrativo, sin perfil normalizado de fabricante, desgaste, vibración o elasticidad. Selección limitada a ruedas iguales y z par. Giro estroboscópico ×1/30; esfuerzos y velocidades se expresan en tiempo físico.",
    "source": "https://www.renold.com/upload/renoldswitzerland/roller_chain_designer_guide.pdf",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué más dientes reducen la ondulación?",
    "answers": [
      "El polígono de paso se aproxima mejor a una circunferencia.",
      "El aumento de dientes elimina la necesidad de pretensión.",
      "Las rpm dejan de influir en la velocidad media al aumentar los dientes.",
      "La cadena se convierte en una circunferencia de radio constante entre los centros."
    ],
    "faults": [
      [
        "Pocos dientes",
        "La velocidad oscila demasiado aunque su media sea suficiente.",
        "El apoyo poligonal modifica el radio efectivo."
      ],
      [
        "Velocidad insuficiente",
        "Aumenta la fuerza necesaria para transmitir la potencia fija.",
        "La fuerza transmitida es potencia dividida por velocidad."
      ],
      [
        "Régimen excesivo",
        "La entrega supera la ventana de transporte.",
        "La velocidad media crece con las rpm."
      ]
    ],
    "labels": "Piñón · rueda · placas · rodillos · ejes · apoyos",
    "caption": "Paso exacto · giro ×1/30 · potencia útil 120 W",
    "tools": "Cadena de 80 pasos, dos ruedas y balance de tracción.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-223 · Transporta a 0,8–1,2 m/s, ondulación ≤1 % y carga en apoyos ≤300 N.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "velocidad instantánea / media (m/s)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Una cadena real avanza eslabón a eslabón sobre dos ruedas dentadas y su velocidad oscila.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "El número de dientes suaviza la marcha; las rpm y la potencia fijan velocidad y esfuerzo.",
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
    "id": 224,
    "slug": "venturi-presion-diferencial",
    "title": "Caudalímetro Venturi: presión y continuidad",
    "longTitle": "Caudalímetro Venturi: presión y continuidad",
    "intro": "Sigue el agua a través de una garganta y relaciona su aceleración con la presión diferencial.",
    "explore": "Las tomas llevan la presión al transmisor; estrechar la garganta aumenta la señal y las pérdidas.",
    "controls": [
      {
        "id": "flow",
        "label": "Caudal de agua",
        "min": 1,
        "max": 6,
        "step": 0.25,
        "unit": "L/s",
        "decimals": 2
      },
      {
        "id": "neck",
        "label": "Diámetro de garganta",
        "min": 18,
        "max": 35,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Diferencial",
        "key": "dp",
        "unit": "kPa",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Presión garganta",
        "key": "p2",
        "unit": "kPa abs",
        "scale": 0.001,
        "decimals": 1
      },
      {
        "label": "Pérdida permanente",
        "key": "loss",
        "unit": "kPa",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Velocidad garganta",
        "key": "v2",
        "unit": "m/s",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Entrega ≥3 L/s con diferencial 5–18 kPa, pérdida ≤2 kPa, presión absoluta ≥40 kPa y Re≥40000.",
    "equations": "Agua ρ=998 kg/m³, µ=0,001 Pa·s; D=50 mm. v=Q/A; Δp=ρ(v2²−v1²)/(2Cd²), Cd=0,98. p1=160 kPa absolutos. Pérdida permanente sintética=0,12Δp; Re=ρv2d/µ. Marcadores siguen volumen acumulado en el conducto de sección variable.",
    "limits": "Estacionario, incompresible; Cd y recuperación constantes sintéticos, sin CFD ni validación normativa. Si p2≤0 la hipótesis es inválida. No predice cavitación ni calibración real de un transmisor. Flujo ralentizado ×1/20; marcadores representan volumen, no moléculas.",
    "source": "https://www.usbr.gov/tsc/techreferences/mands/wmm/chap14_03.html",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué cae la presión en la garganta?",
    "answers": [
      "La continuidad aumenta la velocidad y el balance convierte presión en energía cinética.",
      "La presión absoluta debe aumentar siempre que disminuye el área.",
      "La caída de presión prueba que se pierde todo el caudal en la garganta.",
      "El diferencial depende sólo de la densidad y no de las velocidades."
    ],
    "faults": [
      [
        "Garganta demasiado estrecha",
        "La señal crece pero se excede la pérdida permitida.",
        "La velocidad aumenta al reducir el área."
      ],
      [
        "Señal muy pequeña",
        "El diferencial queda bajo la ventana de medida.",
        "Una garganta ancha reduce la aceleración."
      ],
      [
        "Hipótesis inválida",
        "El cálculo arroja presión absoluta no positiva.",
        "El modelo de líquido continuo deja de ser admisible."
      ]
    ],
    "labels": "Entrada · convergente · garganta · difusor · tomas · transmisor",
    "caption": "Agua estacionaria · flujo ×1/20 · Cd sintético",
    "tools": "Venturi seccionado, tomas de impulso y transmisor diferencial.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-224 · Entrega ≥3 L/s con diferencial 5–18 kPa, pérdida ≤2 kPa, presión absoluta ≥40 kPa y Re≥40000.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "velocidad de entrada / garganta (m/s)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Sigue el agua a través de una garganta y relaciona su aceleración con la presión diferencial.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Las tomas llevan la presión al transmisor; estrechar la garganta aumenta la señal y las pérdidas.",
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
    "id": 225,
    "slug": "robot-orugas-giro-traccion",
    "title": "Robot de orugas: giro y esfuerzo de tracción",
    "longTitle": "Robot de orugas: giro y esfuerzo de tracción",
    "intro": "Controla dos orugas independientes y observa cómo su diferencia de velocidad hace girar el robot.",
    "explore": "Un giro cerrado exige esfuerzos opuestos; la cámara acompaña al vehículo para mostrar su mecánica.",
    "controls": [
      {
        "id": "left",
        "label": "Velocidad oruga izquierda",
        "min": 0.1,
        "max": 1,
        "step": 0.05,
        "unit": "m/s",
        "decimals": 2
      },
      {
        "id": "right",
        "label": "Velocidad oruga derecha",
        "min": 0.1,
        "max": 1,
        "step": 0.05,
        "unit": "m/s",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Velocidad central",
        "key": "v",
        "unit": "m/s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Radio de giro",
        "key": "radius",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Par máximo",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Potencia eléctrica",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Avanza ≥0,5 m/s en un radio de 1–1,6 m, con par ≤20 N·m y potencia ≤250 W.",
    "equations": "v=(vR+vL)/2; ψ̇=(vR−vL)/b, b=0,45 m. Masa 60 kg, contacto 0,6 m. Resistencia longitudinal=0,04mg. Momento lateral sintético M=0,6mg·0,6/4·tanh(ψ̇/0,25). FL+FR=0,04mg; (FR−FL)b/2=M. Radio motriz 0,09 m; eficiencia motriz 0,8 y regenerativa 0,6. Pose por integración exacta del arco.",
    "limits": "Cinemática ideal sin deslizamiento; resistencia lateral cuasiestática regularizada, no dinámica de suelo ni modelo predictivo de consumo real. Sólo avance positivo. Cámara solidaria al centro: el suelo se desplaza como referencia. Demostración ×1/5; trayectoria y fuerzas numéricas en unidades físicas.",
    "source": "https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2019.00046/full",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué girar puede exigir más potencia que avanzar recto?",
    "answers": [
      "La diferencia de tracción debe vencer además la resistencia al giro del contacto con el suelo.",
      "Porque las dos orugas deben girar siempre más rápido al tomar una curva.",
      "Porque la fuerza longitudinal total se duplica para cualquier radio de giro.",
      "Porque una oruga lenta impide toda recuperación de energía en este banco."
    ],
    "faults": [
      [
        "Giro demasiado cerrado",
        "La diferencia de velocidades produce un radio pequeño.",
        "El radio depende de la velocidad central dividida por la angular."
      ],
      [
        "Entrega insuficiente",
        "El robot gira pero avanza demasiado despacio.",
        "Ambas velocidades contribuyen a la velocidad central."
      ],
      [
        "Consumo mal interpretado",
        "Se atribuye al suelo real una potencia del banco ideal.",
        "La resistencia lateral es un parámetro sintético."
      ]
    ],
    "labels": "Chasis · motores · reductores · ruedas · orugas · suelo",
    "caption": "Cámara acompañante · movimiento ×1/5 · contacto ideal",
    "tools": "Robot de orugas, transmisión independiente y trayectoria del centro.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-225 · Avanza ≥0,5 m/s en un radio de 1–1,6 m, con par ≤20 N·m y potencia ≤250 W.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "tracción izquierda / derecha (100 N=1)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Controla dos orugas independientes y observa cómo su diferencia de velocidad hace girar el robot.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Un giro cerrado exige esfuerzos opuestos; la cámara acompaña al vehículo para mostrar su mecánica.",
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
    "id": 226,
    "slug": "soplador-roots-lobulos",
    "title": "Soplador Roots: lóbulos y compresión externa",
    "longTitle": "Soplador Roots: lóbulos y compresión externa",
    "intro": "Dos rotores transportan bolsas de aire hacia una salida presurizada, sin comprimirlas internamente.",
    "explore": "Observa los lóbulos contrarrotantes y equilibra caudal útil, potencia y calentamiento.",
    "controls": [
      {
        "id": "rpm",
        "label": "Velocidad de rotores",
        "min": 600,
        "max": 2400,
        "step": 100,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "pressure",
        "label": "Sobrepresión de salida",
        "min": 5,
        "max": 35,
        "step": 1,
        "unit": "kPa",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Caudal útil",
        "key": "flow",
        "unit": "L/s",
        "scale": 1000,
        "decimals": 2
      },
      {
        "label": "Potencia de eje",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Temperatura salida",
        "key": "Tc",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Fuga interna",
        "key": "leak",
        "unit": "L/s",
        "scale": 1000,
        "decimals": 2
      }
    ],
    "task": "Entrega ≥12 L/s con potencia ≤650 W, salida ≤50 °C y régimen ≤2100 rpm.",
    "equations": "Volumen desplazado nominal=0,6 L/vuelta; Qideal=Vdn/60. Fuga sintética=10⁻⁵√Δp m³/s (Δp en Pa). Qneto=Qideal−fuga. Potencia eje=ΔpQideal/0,75. Calor al gas=ΔpQideal; T2=293,15+calor/(1,2Qneto·1005) K. Densidad de salida por gas ideal.",
    "limits": "Compresión externa idealizada. Perfiles bilobulares ilustrativos r=0,36+0,18cos2θ, no conjugados de mecanizado; el desplazamiento nominal se prescribe, no se deriva del dibujo. Fuga sintética, sin CFD ni curva comercial. Color del aire indica temperatura media; giro ×1/60.",
    "source": "https://www.aerzen.com/products/positive-displacement-blowers/overview",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Dónde ocurre la compresión característica de este principio?",
    "answers": [
      "Al comunicar el volumen transportado con el lado de descarga presurizado.",
      "Dentro de cada bolsillo porque su volumen se reduce continuamente como en un tornillo.",
      "En el filtro de aspiración antes de entrar a los lóbulos.",
      "Únicamente por fricción entre rotores que deben tocarse para sellar."
    ],
    "faults": [
      [
        "Régimen excesivo",
        "Aumentan caudal y potencia y se supera el límite de giro.",
        "El volumen desplazado por segundo crece con las rpm."
      ],
      [
        "Contrapresión elevada",
        "El gas sale más caliente y aumenta la potencia.",
        "El trabajo externo aumenta con la diferencia de presión."
      ],
      [
        "Fuga significativa",
        "El caudal útil es menor que el desplazamiento ideal.",
        "Una parte del aire recircula por holguras del modelo."
      ]
    ],
    "labels": "Carcasa · lóbulos · ejes · engranes · entrada · descarga",
    "caption": "Giro ×1/60 · compresión externa · lóbulos ilustrativos",
    "tools": "Soplador abierto, rotores sincronizados y balance de aire.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-226 · Entrega ≥12 L/s con potencia ≤650 W, salida ≤50 °C y régimen ≤2100 rpm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "caudal útil / ideal (L/s)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Dos rotores transportan bolsas de aire hacia una salida presurizada, sin comprimirlas internamente.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Observa los lóbulos contrarrotantes y equilibra caudal útil, potencia y calentamiento.",
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
    "id": 227,
    "slug": "interferometro-laser-compensacion",
    "title": "Interferómetro láser: ambiente y error de coseno",
    "longTitle": "Interferómetro láser: ambiente y error de coseno",
    "intro": "Un reflector móvil cambia el camino óptico; compensa el aire y alinea el haz para medir desplazamiento.",
    "explore": "Compara tres longitudes patrón y separa el error ambiental del error de alineación.",
    "controls": [
      {
        "id": "temperature",
        "label": "Temperatura usada al compensar",
        "min": 15,
        "max": 35,
        "step": 0.25,
        "unit": "°C",
        "decimals": 2
      },
      {
        "id": "angle",
        "label": "Desalineación del haz",
        "min": 0,
        "max": 2,
        "step": 0.05,
        "unit": "°",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Error máximo",
        "key": "maxError",
        "unit": "µm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Longitud patrón móvil",
        "key": "L",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Lectura reconstruida",
        "key": "reading",
        "unit": "mm",
        "scale": 1,
        "decimals": 5
      },
      {
        "label": "Fracciones de franja",
        "key": "fringes",
        "unit": "",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Obtén error ≤0,3 µm en patrones 50/100/150 mm, desalineación ≤0,1° y compensación ambiental dentro de 1 °C de la referencia.",
    "equations": "λvac=632,8 nm. Índice simplificado n(T)=1+0,00027·293,15/(273,15+T). N=2nrealLcosα/λvac; Lestimada=Nλvac/(2nestimado). Se evalúan tres longitudes conocidas. Movimiento L=75+50sin(2πt/8) mm. El termómetro patrón pertenece al banco y su valor se revela tras validar. El informe guarda fase fraccionaria y lectura de las tres referencias.",
    "limits": "Índice sintético dependiente sólo de temperatura; no ecuación Edlén completa ni compensación de presión/humedad. Conteo ideal de fase fraccionaria, sin ruido ni pérdidas de franjas. El detector visual muestrea una intensidad y no resuelve todas las oscilaciones ópticas. No certifica metrología real.",
    "source": "https://www.renishaw.com/resourcecentre/en/details/white-paper-environmental-compensation-of-linear-laser-interferometer-readings--94445",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué debe compensarse el índice del aire?",
    "answers": [
      "Porque la longitud de onda en el aire cambia y modifica la conversión entre franjas y distancia.",
      "Porque la compensación cambia la longitud geométrica de los patrones de referencia.",
      "Porque el número de franjas deja de depender del desplazamiento al cambiar el aire.",
      "Porque sólo la intensidad del detector fija la distancia absoluta."
    ],
    "faults": [
      [
        "Error de coseno",
        "La lectura es menor que el desplazamiento real con el haz inclinado.",
        "El interferómetro mide la proyección sobre el haz."
      ],
      [
        "Compensación incorrecta",
        "El error crece con la longitud patrón pese a buena alineación.",
        "La escala depende del índice usado para convertir franjas."
      ],
      [
        "Falsa certeza ambiental",
        "Se ignoran presión y humedad al aplicar el banco a una máquina real.",
        "La ley de índice aquí es deliberadamente reducida."
      ]
    ],
    "labels": "Láser · divisor · referencia · reflector · carro · detector",
    "caption": "Fase ideal · detector muestreado · ley n(T) reducida",
    "tools": "Banco óptico, reflector móvil y referencias de longitud.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-227 · Obtén error ≤0,3 µm en patrones 50/100/150 mm, desalineación ≤0,1° y compensación ambiental dentro de 1 °C de la referencia.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "error de lectura / cero (µm)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Un reflector móvil cambia el camino óptico; compensa el aire y alinea el haz para medir desplazamiento.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Compara tres longitudes patrón y separa el error ambiental del error de alineación.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "referenceAfterValidation": "Termómetro patrón del banco sintético: 28,00 °C; presión y humedad no se estiman.",
    "inspectionDir": [
      0.5,
      1.4,
      1.35
    ]
  },
  {
    "id": 228,
    "slug": "rugosimetro-filtro-perfil",
    "title": "Rugosímetro: perfil, filtro y muestreo",
    "longTitle": "Rugosímetro: perfil, filtro y muestreo",
    "intro": "Una punta recorre una superficie mecanizada y separa ondulación de rugosidad mediante un filtro.",
    "explore": "La superficie permanece igual; el corte elegido cambia qué parte del perfil interpreta el instrumento.",
    "controls": [
      {
        "id": "cutoff",
        "label": "Longitud de corte gaussiana",
        "min": 0.05,
        "max": 1.5,
        "step": 0.05,
        "unit": "mm",
        "decimals": 2
      },
      {
        "id": "speed",
        "label": "Velocidad de palpado",
        "min": 0.1,
        "max": 1,
        "step": 0.05,
        "unit": "mm/s",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Rugosidad Ra",
        "key": "ra",
        "unit": "µm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Rugosidad Rq",
        "key": "rq",
        "unit": "µm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Fuga de ondulación",
        "key": "leak",
        "unit": "µm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Muestras por onda corta",
        "key": "samples",
        "unit": "",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Separa ondulación con fuga ≤0,1 µm y conserva ≥95 % de la rugosidad; toma ≥20 muestras por onda corta en ≤20 s.",
    "equations": "Perfil de 4 mm: amplitudes 2/0,65/0,2 µm y longitudes 2/0,08/0,04 mm; última fase 0,7 rad. Paso alto gaussiano H=1−exp[−ln2(λc/λ)²]. Ra=media|r| y Rq=√media(r²), 4000 puntos periódicos. Muestreo de adquisición 200 Hz; muestras por onda corta=0,04·200/v.",
    "limits": "Perfil sintético periódico y filtro analítico sin efectos de borde, no evaluación ISO completa. Punta ideal sin convolución por radio ni dinámica de palpador. Altura de topografía ×100, punta ampliada esquemática. El modelo evalúa retención y muestreo, no certifica acabado real.",
    "source": "https://pml.nist.gov/VSC/Help/Filters/Gaussian.jsp",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué cambiar el filtro modifica Ra sin modificar la pieza?",
    "answers": [
      "Porque cambia la separación entre ondulación y rugosidad del mismo perfil medido.",
      "Porque el filtro pule digitalmente la superficie antes de que pase la punta.",
      "Porque Ra siempre equivale a la altura máxima del perfil original.",
      "Porque el filtro cambia la velocidad física del palpador."
    ],
    "faults": [
      [
        "Corte demasiado grande",
        "Parte de la ondulación entra en el perfil de rugosidad.",
        "El filtro retiene longitudes que debían separarse."
      ],
      [
        "Palpado demasiado rápido",
        "Hay pocas muestras por onda corta.",
        "Con frecuencia fija la distancia entre muestras crece con la velocidad."
      ],
      [
        "Corte demasiado pequeño",
        "Se elimina una parte del detalle de rugosidad.",
        "El filtro también atenúa las componentes que interesa conservar."
      ]
    ],
    "labels": "Columna · carro · palpador · punta · muestra · topografía",
    "caption": "Topografía ×100 · punta ideal ampliada · adquisición 200 Hz",
    "tools": "Rugosímetro, perfil mecanizado y separación gaussiana.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-228 · Separa ondulación con fuga ≤0,1 µm y conserva ≥95 % de la rugosidad; toma ≥20 muestras por onda corta en ≤20 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "perfil original / filtrado (µm)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Una punta recorre una superficie mecanizada y separa ondulación de rugosidad mediante un filtro.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "La superficie permanece igual; el corte elegido cambia qué parte del perfil interpreta el instrumento.",
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
    "id": 229,
    "slug": "bobinado-tension-bailarin",
    "title": "Bobinado de banda: tensión y rodillo bailarín",
    "longTitle": "Bobinado de banda: tensión y rodillo bailarín",
    "intro": "Observa dos bobinas cambiar de diámetro mientras un rodillo con peso fija la geometría de la banda.",
    "explore": "Al crecer la bobina aumenta el par necesario para mantener la tensión, aunque baje la velocidad angular.",
    "controls": [
      {
        "id": "tension",
        "label": "Tensión de banda",
        "min": 8,
        "max": 30,
        "step": 1,
        "unit": "N",
        "decimals": 0
      },
      {
        "id": "speed",
        "label": "Velocidad de línea",
        "min": 0.2,
        "max": 1,
        "step": 0.05,
        "unit": "m/s",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Radio receptor",
        "key": "R",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      },
      {
        "label": "Par máximo del ciclo",
        "key": "maxTorque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Esfuerzo de banda",
        "key": "stress",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Descenso del bailarín",
        "key": "dancer",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      }
    ],
    "task": "Produce ≥0,5 m/s con tensión ≥12 N, esfuerzo ≤3,5 MPa, par ≤2,5 N·m, potencia ≤30 W y descenso del bailarín 50–180 mm.",
    "equations": "Núcleo R0=40 mm, radio final100 mm, espesor0,1 mm, ancho60 mm, densidad1200 kg/m³. R²=R0²+hvτ/π; ω=v/R. J=Jnúcleo+mbanda(R²+R0²)/2. Par=FR+Jω̇+0,08 N·m; entrada de momento del material cancela J̇ω. Bailarín de peso20 N: d=0,15·20/√(4F²−400) m. Eficiencia0,85. Se evalúa el máximo del ciclo.",
    "limits": "Banda inextensible y equilibrio estático del bailarín, sin control PID ni transitorios elásticos. F≤10 N no puede equilibrar el peso. Volumen conservado entre bobinas. La banda se dibuja como superficie; rodillos de radio ampliado y tangencias esquemáticas. bobinado acelerado ×40. No dimensiona una línea comercial.",
    "source": "https://www.maxcessintl.com/wp-content/uploads/2025/04/Maxcess-TensionSolutionsBrochure-2025Jan.pdf",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué crece el par cuando aumenta el radio receptor?",
    "answers": [
      "Porque la misma tensión actúa sobre un brazo de palanca mayor.",
      "Porque mantener velocidad lineal obliga a aumentar también la velocidad angular de la bobina.",
      "Porque el peso del bailarín aumenta automáticamente con el radio receptor.",
      "Porque la tensión necesaria es independiente del brazo de palanca."
    ],
    "faults": [
      [
        "Tensión excesiva",
        "Suben esfuerzo y par y el bailarín queda muy alto.",
        "La tensión estira la banda y reduce su ángulo bajo el peso."
      ],
      [
        "Tensión insuficiente",
        "No existe equilibrio o se excede el recorrido vertical.",
        "Dos ramas deben soportar el peso del bailarín."
      ],
      [
        "Producción insuficiente",
        "El ajuste mecánico cumple pero la línea avanza muy despacio.",
        "La velocidad de línea es un criterio independiente."
      ]
    ],
    "labels": "Desbobinador · receptor · banda · rodillos · bailarín · peso",
    "caption": "Bobinado ×40 · banda inextensible · equilibrio estático",
    "tools": "Dos bobinas, banda continua, bailarín por gravedad y balance de par.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-229 · Produce ≥0,5 m/s con tensión ≥12 N, esfuerzo ≤3,5 MPa, par ≤2,5 N·m, potencia ≤30 W y descenso del bailarín 50–180 mm.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "par actual / máximo del ciclo (N·m)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Observa dos bobinas cambiar de diámetro mientras un rodillo con peso fija la geometría de la banda.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "Al crecer la bobina aumenta el par necesario para mantener la tensión, aunque baje la velocidad angular.",
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
    "id": 230,
    "slug": "inyeccion-plastico-llenado-molde",
    "title": "Inyección de plástico: llenado, cierre y enfriamiento",
    "longTitle": "Inyección de plástico: llenado, cierre y enfriamiento",
    "intro": "Mira el tornillo dosificador y el plástico avanzar por una cavidad con taladros hasta formar una pieza.",
    "explore": "El molde sólo se abre si la pieza alcanza la temperatura permitida; presión y tiempo compiten con el ciclo.",
    "controls": [
      {
        "id": "pressure",
        "label": "Presión de cavidad impuesta",
        "min": 50,
        "max": 120,
        "step": 5,
        "unit": "MPa",
        "decimals": 0
      },
      {
        "id": "cooling",
        "label": "Tiempo de enfriamiento",
        "min": 5,
        "max": 25,
        "step": 1,
        "unit": "s",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Tiempo de llenado",
        "key": "fill",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fuerza de apertura",
        "key": "force",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 1
      },
      {
        "label": "Temperatura de expulsión",
        "key": "temperature",
        "unit": "°C",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Tiempo de ciclo",
        "key": "cycle",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Llena en ≤4 s sin superar 400 kN de apertura ni1600 W; expulsa a ≤70 °C y completa el ciclo en ≤28 s.",
    "equations": "Placa82×50×10 mm con esquinas R3 y cuatro taladros R3; área=82·50−(4−π)·9−4π·9 mm². Volumen=área·10. Q=1,5·10⁻¹³P m³/s; llenado=V/Q, apertura=P·área proyectada; potencia=PQ/0,75. T=40+180exp(−tc/8) °C. Ciclo=llenado+2 s mantenimiento+enfriamiento+2 s apertura. Frente por integral del área transversal, volumen conservado. Tornillo D25 mm: avance=V/Atornillo.",
    "limits": "Presión de cavidad impuesta y conductancia sintética, sin CFD, viscosidad real, compactación, contracción o FEM. Enfriamiento concentrado exponencial. Taladros y frente son geometría nominal; pequeños biseles son cosméticos. Colores indican temperatura media. Reloj ×3. Si T>70 °C el interbloqueo mantiene cerrado; ciclos reiniciados independientes.",
    "source": "https://www.keyence.com/ss/products/measure-sys/machining/formula/injection-molding.jsp",
    "sourceName": "Fuente técnica del principio",
    "quiz": "¿Por qué aumentar presión no resuelve por sí solo una expulsión caliente?",
    "answers": [
      "Porque acelera el llenado, pero no sustituye el tiempo necesario para enfriar la pieza.",
      "Porque la temperatura de expulsión depende sólo de la fuerza de cierre.",
      "Porque aumentar presión siempre aumenta el tiempo disponible de enfriamiento.",
      "Porque un mayor caudal garantiza solidificación instantánea al llenar la cavidad."
    ],
    "faults": [
      [
        "Cierre insuficiente",
        "La fuerza de apertura calculada supera el límite del banco.",
        "La presión actúa sobre toda el área proyectada."
      ],
      [
        "Enfriamiento insuficiente",
        "El molde permanece cerrado al llegar a expulsión.",
        "El interbloqueo exige temperatura ≤70 °C."
      ],
      [
        "Ciclo demasiado lento",
        "La pieza enfría bien pero se excede el tiempo de producción.",
        "Enfriar más tiempo mejora temperatura a costa del ciclo."
      ]
    ],
    "labels": "Tolva · tornillo · calentadores · molde · cavidad · tirantes · expulsor",
    "caption": "Ciclo ×3 · frente volumétrico · enfriamiento concentrado",
    "tools": "Inyectora seccionada, molde móvil, circuito frío y pieza con taladros.",
    "procedure": [
      "Identifica los componentes y consulta las condiciones de la orden.",
      "Ajusta ambos parámetros y compara las mediciones con los criterios.",
      "Prepara y ejecuta el ensayo completo; valida y guarda la evidencia."
    ],
    "job": "OT-230 · Llena en ≤4 s sin superar 400 kN de apertura ni1600 W; expulsa a ≤70 °C y completa el ciclo en ≤28 s.",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "fracción de llenado / apertura (0–1)",
    "eyebrow": "Orden de trabajo · procesos y metrología",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Observa el fenómeno",
        "text": "Mira el tornillo dosificador y el plástico avanzar por una cavidad con taladros hasta formar una pieza.",
        "view": "inspection"
      },
      {
        "title": "Explora el banco",
        "text": "El molde sólo se abre si la pieza alcanza la temperatura permitida; presión y tiempo compiten con el ciclo.",
        "view": "assembly"
      },
      {
        "title": "Prepara y mide",
        "text": "Abre la orden, prepara el ensayo y registra este ajuste antes de validarlo.",
        "view": "inspection"
      }
    ],
    "inspectionDir": [
      1.3,
      0.65,
      1.1
    ]
  }
];
