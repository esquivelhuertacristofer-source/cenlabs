export const definitions=[
  {
    "id": 187,
    "slug": "calibracion-tcp-robot",
    "title": "Calibración del TCP de un robot",
    "longTitle": "Calibración del TCP de un robot",
    "intro": "Enseña el extremo de una herramienta para que el robot conserve el punto al cambiar de orientación.",
    "explore": "La brida se mueve alrededor de la referencia enseñada. Una longitud mal declarada hace que la punta real dibuje un arco.",
    "controls": [
      {
        "id": "x",
        "label": "Desplazamiento lateral TCP",
        "min": 0,
        "max": 25,
        "step": 0.1,
        "unit": "mm",
        "decimals": 1
      },
      {
        "id": "z",
        "label": "Longitud declarada",
        "min": 150,
        "max": 210,
        "step": 0.1,
        "unit": "mm",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Error de punta",
        "key": "error",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Dispersión de posturas",
        "key": "spread",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Residual X",
        "key": "rx",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      },
      {
        "label": "Residual Z",
        "key": "rz",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      }
    ],
    "task": "Calibra la herramienta con error≤0,5 mm y dispersión entre orientaciones≤0,7 mm.",
    "equations": "El vector real del TCP se determina frente a la punta patrón; sus componentes se revelan después de validar. La posición de brida es pF=P−Ry(φ)tdeclarado; punta real=P+Ry(φ)(treal−tdeclarado). φ=0,65 sin(0,8t). Dos eslabones de700 y650 mm sitúan la brida por cinemática inversa plana. Error=norma de la diferencia; dispersión extrema=2 error sin(0,65).",
    "limits": "Calibración sintética plana de dos componentes; no estima seis parámetros por mínimos cuadrados, no compensa flexión ni holgura. Un robot articulado planar con muñeca representa el banco, sin modelo de fabricante ni seguridad funcional.",
    "source": "https://www.universal-robots.com/manuals/EN/HTML/SW5_19/Content/prod-usr-man/software/PolyScope/content/installation_g5/installation_TCP_configuration_en.htm",
    "sourceName": "Documentación técnica del principio",
    "tools": "Punta patrón, referencia fija y comprobación de orientaciones.",
    "job": "OT-187 · Calibra la herramienta con error≤0,5 mm y dispersión entre orientaciones≤0,7 mm.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué revela que la punta se aleje al girar la muñeca?",
    "answers": [
      "Que el punto de herramienta declarado no coincide con el extremo real.",
      "Que el motor gira necesariamente demasiado deprisa.",
      "Que basta enseñar una única postura aunque cambie la herramienta.",
      "Que la posición de la brida debe permanecer fija al reorientar."
    ],
    "faults": [
      [
        "Longitud incorrecta",
        "La punta describe un arco amplio al inclinar la muñeca.",
        "El vector brida–punta no coincide con el declarado."
      ],
      [
        "Desplazamiento lateral",
        "La longitud parece correcta pero persiste un residual lateral.",
        "También debe enseñarse el desplazamiento transversal."
      ],
      [
        "Una sola postura",
        "La referencia coincide una vez y falla al reorientar.",
        "Una coincidencia aislada no prueba el TCP."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 8,
    "signals": "residualX / residualZ enmm",
    "labels": "Base · hombro · codo · muñeca · herramienta · punta patrón",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Enseña el extremo de una herramienta para que el robot conserve el punto al cambiar de orientación.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "La brida se mueve alrededor de la referencia enseñada. Una longitud mal declarada hace que la punta real dibuje un arco.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ],
    "referenceAfterValidation": "Modelo de referencia validado: TCP real (12,180) mm en el plano XZ."
  },
  {
    "id": 188,
    "slug": "banco-optica-vision-industrial",
    "title": "Selección óptica de visión industrial",
    "longTitle": "Selección óptica de visión industrial",
    "intro": "Configura la óptica de una cámara para inspeccionar una pieza completa conservando detalle y profundidad útil.",
    "explore": "Una focal larga acerca los detalles pero reduce el campo. La distancia de trabajo también cambia el área que cabe en el sensor.",
    "controls": [
      {
        "id": "focal",
        "label": "Distancia focal",
        "min": 8,
        "max": 35,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "distance",
        "label": "Distancia de trabajo",
        "min": 250,
        "max": 650,
        "step": 5,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Campo horizontal",
        "key": "field",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Muestreo espacial",
        "key": "pixel",
        "unit": "mm/px",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Profundidad de campo",
        "key": "depth",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Imagen tras la lente",
        "key": "image",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Encuadra160–220 mm con≤0,09 mm/píxel y profundidad de campo≥8 mm.",
    "equations": "Lente delgada:1/f=1/s+1/s′; m=s′/s; campo=8,8 mm/m en sensor de2448 px. N=8, círculo de confusión10 µm. H=f²/(Nc)+f, Dn=Hs/(H+s−f), Df=Hs/(H−s+f).",
    "limits": "Óptica paraxial ideal; profundidad de campo convencional por círculo de confusión. Sin difracción, MTF, distorsión, exposición, ruido ni algoritmo comercial. No es calibración de intrínsecos de una cámara real.",
    "source": "https://www.baslerweb.com/en-us/learning/lens-selection/",
    "sourceName": "Documentación técnica del principio",
    "tools": "Lente, sensor2448 px, patrón y calculadora óptica.",
    "job": "OT-188 · Encuadra160–220 mm con≤0,09 mm/píxel y profundidad de campo≥8 mm.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Por qué llenar el sensor no garantiza ver un defecto?",
    "answers": [
      "Porque el muestreo y el detalle óptico también limitan la inspección.",
      "Sólo el porcentaje de campo que ocupa la pieza.",
      "Sólo la distancia focal, independientemente del sensor.",
      "Únicamente la distancia al patrón, sin comprobar enfoque."
    ],
    "faults": [
      [
        "Campo insuficiente",
        "Una parte de la pieza queda fuera del encuadre.",
        "Focal y distancia determinan el campo útil."
      ],
      [
        "Muestreo grueso",
        "Cabe toda la pieza, pero cada píxel representa demasiado material.",
        "El campo se reparte entre los píxeles disponibles."
      ],
      [
        "Enfoque no comprobado",
        "Sólo se consideró el plano central de la pieza.",
        "El espesor útil debe contrastarse con la profundidad de campo."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 4,
    "signals": "campo/200 mm / profundidad/8 mm",
    "labels": "Columna · cámara · lente · patrón · campo visual",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Configura la óptica de una cámara para inspeccionar una pieza completa conservando detalle y profundidad útil.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "Una focal larga acerca los detalles pero reduce el campo. La distancia de trabajo también cambia el área que cabe en el sensor.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 189,
    "slug": "sintonia-servoeje-pd",
    "title": "Sintonía de un servoeje PD",
    "longTitle": "Sintonía de un servoeje PD",
    "intro": "Ajusta un eje de posicionamiento para alcanzar100 mm con rapidez, poco rebote y fuerza admisible.",
    "explore": "La ganancia proporcional empuja hacia la consigna. La derivativa frena el movimiento; ambas cambian la respuesta del carro.",
    "controls": [
      {
        "id": "kp",
        "label": "Ganancia proporcional",
        "min": 200,
        "max": 1800,
        "step": 10,
        "unit": "N/m",
        "decimals": 0
      },
      {
        "id": "kd",
        "label": "Ganancia derivativa",
        "min": 5,
        "max": 200,
        "step": 1,
        "unit": "N·s/m",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Sobreimpulso",
        "key": "overshoot",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Estable al2 %",
        "key": "settle",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Posición",
        "key": "x",
        "unit": "mm",
        "scale": 1000,
        "decimals": 2
      },
      {
        "label": "Máxima fuerza",
        "key": "forceMax",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Sigue el escalón con sobreimpulso≤5 %, establecimiento≤0,8 s y fuerza≤150 N.",
    "equations": "M x″+(B+Kd)x′+Kp x=Kp r, M=5 kg, B=10 N·s/m, r=0,1 m. Solución cerrada de segundo orden incluyendo amortiguamiento crítico y sobreamortiguado. Fuerza=Kp(r−x)−Kd x′. Estadísticas por barrido0–8 s cada5 ms.",
    "limits": "PD ideal, sin integral, muestreo, saturación del actuador, ruido, fricción seca ni retardo. El límite de fuerza se comprueba pero no se impone como saturación. Cada3 s se repite un escalón independiente.",
    "source": "https://www.ni.com/en/shop/labview/pid-theory-explained.html",
    "sourceName": "Documentación técnica del principio",
    "tools": "Servo lineal, encoder y respuesta a escalón.",
    "job": "OT-189 · Sigue el escalón con sobreimpulso≤5 %, establecimiento≤0,8 s y fuerza≤150 N.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué se debe comprobar además del tiempo de llegada?",
    "answers": [
      "El sobreimpulso, el establecimiento y la fuerza requerida.",
      "Sólo que cruce la consigna una vez.",
      "Únicamente la velocidad máxima del carro.",
      "Sólo el valor final, aunque oscile mucho antes."
    ],
    "faults": [
      [
        "Poco amortiguamiento",
        "El carro cruza la referencia varias veces.",
        "La ganancia derivativa aporta amortiguamiento."
      ],
      [
        "Fuerza excesiva",
        "Llega rápido, pero la demanda supera el límite.",
        "La proporcional eleva la fuerza al comenzar."
      ],
      [
        "Respuesta lenta",
        "No rebota, pero tarda demasiado en estabilizarse.",
        "Amortiguar demasiado también perjudica el tiempo."
      ]
    ],
    "caption": "Tiempo real · PD ideal · desplazamiento visual×10",
    "timeScale": 1,
    "testSeconds": 3,
    "signals": "posición/100 mm / consigna",
    "labels": "Motor · guías · carro · rodamientos · consigna",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Ajusta un eje de posicionamiento para alcanzar100 mm con rapidez, poco rebote y fuerza admisible.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "La ganancia proporcional empuja hacia la consigna. La derivativa frena el movimiento; ambas cambian la respuesta del carro.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 190,
    "slug": "ensayo-aislamiento-motor",
    "title": "Ensayo virtual de aislamiento de motor",
    "longTitle": "Ensayo virtual de aislamiento de motor",
    "intro": "Interpreta un ensayo de aislamiento distinguiendo la carga capacitiva de la fuga permanente.",
    "explore": "La corriente inicial carga la capacidad del devanado. Leer demasiado pronto produce una resistencia aparente baja.",
    "controls": [
      {
        "id": "voltage",
        "label": "Tensión de ensayo",
        "min": 100,
        "max": 500,
        "step": 10,
        "unit": "V",
        "decimals": 0
      },
      {
        "id": "hold",
        "label": "Tiempo de lectura",
        "min": 1,
        "max": 30,
        "step": 1,
        "unit": "s",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Resistencia aparente final",
        "key": "apparent",
        "unit": "MΩ",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error por transitorio",
        "key": "error",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Corriente instantánea",
        "key": "current",
        "unit": "µA",
        "scale": 1000000.0,
        "decimals": 2
      },
      {
        "label": "Energía almacenada",
        "key": "energy",
        "unit": "J",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Simula450–500 V; lee con error≤5 % antes de25 s y energía≤0,3 J.",
    "equations": "Fuente con Rs=1 MΩ alimenta R=180 MΩ en paralelo con C=2 µF. τ=(Rs||R)C; Vc=V R/(R+Rs)(1−exp(−t/τ)); Ifuente=(V−Vc)/Rs; Rap=Vc/Ifuente. Lectura al tiempo configurado.",
    "limits": "ModeloRC aislado virtual, sin absorción dieléctrica, humedad, temperatura ni procedimiento real de alta tensión. Valores didácticos; no son criterio normativo de aislamiento. Se acelera el tiempo de ensayo×5 en pantalla.",
    "source": "https://www.megger.com/en-us/blog/Oct-2024/IRTblog2",
    "sourceName": "Documentación técnica del principio",
    "tools": "Megóhmetro virtual, devanado en corte y registro de corriente.",
    "job": "OT-190 · Simula450–500 V; lee con error≤5 % antes de25 s y energía≤0,3 J.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Por qué una lectura inicial baja puede cambiar al esperar?",
    "answers": [
      "Porque la corriente capacitiva disminuye durante la carga.",
      "Porque desaparece toda corriente de fuga con el tiempo.",
      "Porque la resistencia siempre crece sin límite.",
      "Porque una tensión baja demuestra por sí sola un buen aislamiento."
    ],
    "faults": [
      [
        "Lectura prematura",
        "La resistencia sube durante el registro.",
        "La carga capacitiva todavía contribuye a la corriente."
      ],
      [
        "Tensión distinta",
        "La lectura se hizo a otra tensión que la orden.",
        "El informe debe registrar las condiciones del ensayo."
      ],
      [
        "Energía no considerada",
        "Se acepta sólo la resistencia sin revisar el circuito.",
        "La capacidad almacena energía durante la prueba."
      ]
    ],
    "caption": "Tiempo de ensayo×5 · sin conexión a equipo real",
    "timeScale": 1,
    "testSeconds": 6,
    "signals": "Vc/Vfuente / corriente normalizada",
    "labels": "Estátor · devanados · rotor · megóhmetro · cables",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Autotrónica",
    "area": "AUTOMOVILIDAD",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Interpreta un ensayo de aislamiento distinguiendo la carga capacitiva de la fuga permanente.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "La corriente inicial carga la capacidad del devanado. Leer demasiado pronto produce una resistencia aparente baja.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 191,
    "slug": "puesta-servicio-precarga-hv",
    "title": "Puesta en servicio de precarga HV",
    "longTitle": "Puesta en servicio de precarga HV",
    "intro": "Dimensiona una precarga virtual para que el enlace de continua alcance tensión antes de cerrar el contactor principal.",
    "explore": "La resistencia limita la corriente inicial. Si el cierre llega pronto, queda una diferencia de tensión importante.",
    "controls": [
      {
        "id": "resistance",
        "label": "Resistencia de precarga",
        "min": 20,
        "max": 200,
        "step": 5,
        "unit": "Ω",
        "decimals": 0
      },
      {
        "id": "close",
        "label": "Instante de cierre",
        "min": 100,
        "max": 1500,
        "step": 10,
        "unit": "ms",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Pico inicial",
        "key": "peak",
        "unit": "A",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Diferencia al cierre",
        "key": "residual",
        "unit": "V",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Energía en resistencia",
        "key": "energy",
        "unit": "J",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Pico de potencia",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 0
      }
    ],
    "task": "Limita el pico a8 A y2500 W; cierra en≤900 ms con diferencia≤20 V.",
    "equations": "V=400 V,C=2 mF; Vc=V(1−exp(−t/RC)), I=V/R exp(−t/RC). Calor enR=CV²/2(1−exp(−2tc/RC)). Diferencia al cierre=V exp(−tc/RC). El indicador del contactor sigue tc.",
    "limits": "RC ideal, fuente rígida y contactor lógico. Al cerrar no se integra el transitorio del camino principal; la tensión mostrada conserva el valor previo. Sin arco, rebote, capacidad parásita, batería dinámica ni norma de seguridad. Sólo banco virtual.",
    "source": "https://www.ti.com.cn/cn/lit/ug/tiduf73/tiduf73.pdf",
    "sourceName": "Documentación técnica del principio",
    "tools": "Resistencia, condensadores, contactores en corte y registroV/I.",
    "job": "OT-191 · Limita el pico a8 A y2500 W; cierra en≤900 ms con diferencia≤20 V.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué magnitud verifica que se puede cerrar en este modelo?",
    "answers": [
      "La diferencia de tensión entre fuente y condensador al cierre.",
      "Sólo que haya transcurrido un tiempo fijo, sin medir tensión.",
      "La energía inicial del condensador antes de precargar.",
      "La temperatura ambiente sin observar el enlace."
    ],
    "faults": [
      [
        "Cierre temprano",
        "El enlace aún tiene poca tensión cuando se une el camino principal.",
        "La precarga necesita tiempo en relación conRC."
      ],
      [
        "Resistencia pequeña",
        "Carga rápido, pero el pico de corriente es alto.",
        "I inicial esV/R."
      ],
      [
        "Espera excesiva",
        "Cumple la tensión pero no el tiempo de la orden.",
        "El ajuste debe cumplir todos los límites simultáneos."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 3,
    "signals": "Vc/400 V / corriente/10 A",
    "labels": "Batería · contactor · resistencia · condensadores · contacto",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Autotrónica",
    "area": "AUTOMOVILIDAD",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Dimensiona una precarga virtual para que el enlace de continua alcance tensión antes de cerrar el contactor principal.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "La resistencia limita la corriente inicial. Si el cierre llega pronto, queda una diferencia de tensión importante.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 192,
    "slug": "calibracion-resolver-traccion",
    "title": "Calibración de resolver de tracción",
    "longTitle": "Calibración de resolver de tracción",
    "intro": "Contrasta la posición de un resolver contra un encoder patrón y elimina error angular periódico.",
    "explore": "Los canales seno y coseno definen el ángulo. Un desequilibrio de amplitud produce error aunque el cero parezca correcto.",
    "controls": [
      {
        "id": "offset",
        "label": "Cero residual",
        "min": -8,
        "max": 8,
        "step": 0.1,
        "unit": "°",
        "decimals": 1
      },
      {
        "id": "gain",
        "label": "Ganancia canal seno",
        "min": 0.8,
        "max": 1.2,
        "step": 0.005,
        "unit": "",
        "decimals": 3
      }
    ],
    "metrics": [
      {
        "label": "Error máximo en vuelta",
        "key": "maxError",
        "unit": "°",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Error instantáneo",
        "key": "error",
        "unit": "°",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Canal seno",
        "key": "s",
        "unit": "",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Canal coseno",
        "key": "c",
        "unit": "",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Reduce el error máximo a0,3° y deja la ganancia entre0,99 y1,01.",
    "equations": "S=g sin(θ+δ), C=cos(θ+δ); θmed=atan2(S,C). Error envuelto a±π; barrido361 orientaciones por vuelta. Giro real0,9 rad/s. Los mandos representan errores residuales tras compensación.",
    "limits": "Señales ya demoduladas; sin portadora, ruido, armónicos de devanado, latenciaRDC ni prueba de un inversor real. La geometría del resolver es esquemática en sección.",
    "source": "https://www.analog.com/en/resources/analog-dialogue/articles/high-accuracy-resolver-simulator-system-with-fault-injection-function.html",
    "sourceName": "Documentación técnica del principio",
    "tools": "Resolver seccionado, encoder patrón y canales seno/coseno.",
    "job": "OT-192 · Reduce el error máximo a0,3° y deja la ganancia entre0,99 y1,01.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Puede corregirse todo el error moviendo sólo el cero?",
    "answers": [
      "No; el desequilibrio de amplitudes genera error dependiente del ángulo.",
      "Sí; un único cero corrige también cualquier diferencia de amplitud.",
      "Sí; basta medir cuando el canal seno cruza cero.",
      "No; debe usarse sólo el canal seno y descartar el coseno."
    ],
    "faults": [
      [
        "Error de cero",
        "El residual mantiene un desplazamiento común.",
        "Hay que contrastar la referencia angular."
      ],
      [
        "Canales desequilibrados",
        "El error oscila dos veces por vuelta.",
        "atan2 requiere canales con escala coherente."
      ],
      [
        "Muestra única",
        "La lectura coincide en una postura y falla en otras.",
        "Se debe recorrer una vuelta completa."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 7,
    "signals": "canal seno / canal coseno",
    "labels": "Núcleo · devanados · rotor · referencia angular · canales",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Autotrónica",
    "area": "AUTOMOVILIDAD",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Contrasta la posición de un resolver contra un encoder patrón y elimina error angular periódico.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "Los canales seno y coseno definen el ángulo. Un desequilibrio de amplitud produce error aunque el cero parezca correcto.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 193,
    "slug": "ultrasonido-espesor-corrosion",
    "title": "Ultrasonido para espesor y corrosión",
    "longTitle": "Ultrasonido para espesor y corrosión",
    "intro": "Calibra un medidor ultrasónico con dos patrones antes de inspeccionar una placa con pérdida de espesor.",
    "explore": "El tiempo de vuelo incluye el material y un retardo del palpador. Una sola referencia no separa velocidad y cero.",
    "controls": [
      {
        "id": "velocity",
        "label": "Velocidad configurada",
        "min": 5000,
        "max": 6500,
        "step": 10,
        "unit": "m/s",
        "decimals": 0
      },
      {
        "id": "zero",
        "label": "Compensación de cero",
        "min": 0,
        "max": 2,
        "step": 0.01,
        "unit": "µs",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Espesor leído",
        "key": "reading",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Tiempo de vuelo",
        "key": "tof",
        "unit": "µs",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error en patrón5",
        "key": "error5",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Error en patrón15",
        "key": "error15",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Ajusta velocidad y cero: los patrones de5 y15 mm deben quedar dentro de±0,05 mm.",
    "equations": "La velocidad c y el retardo τ0 se determinan con dos patrones del mismo material. El instrumento aporta sus tiempos de vuelo. τ=2d/c+τ0; dmed=cconfig(τ−τ0config)/2. Placa d(x)=10−4 exp(−((x−0,55)/0,14)²) mm. El eco recorre ida y vuelta.",
    "limits": "Incidencia normal, un solo eco y velocidad constante. Sin dispersión, acoplamiento variable, rugosidad, tamaño del haz ni interpretación de grietas. La animación del pulso se ralentiza×100000 para hacerlo visible. La sección de espesor está ampliada respecto del ancho para hacer visible la corrosión.",
    "source": "https://ims.evidentscientific.com/en/learn/ndt-tutorials/flaw-detection/calibration-concepts",
    "sourceName": "Documentación técnica del principio",
    "tools": "Palpador, patrones escalonados y trazaA-scan virtual.",
    "job": "OT-193 · Ajusta velocidad y cero: los patrones de5 y15 mm deben quedar dentro de±0,05 mm.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Por qué se usan dos espesores conocidos?",
    "answers": [
      "Para distinguir el error de velocidad del desplazamiento de cero.",
      "Para promediar dos velocidades sin corregir el cero.",
      "Para usar el patrón grueso como si fuese otro material.",
      "Para eliminar el recorrido de vuelta del pulso."
    ],
    "faults": [
      [
        "Velocidad incorrecta",
        "El error crece con el espesor.",
        "La pendiente de tiempo contra espesor está mal ajustada."
      ],
      [
        "Cero incorrecto",
        "Aparece un error casi constante en ambos patrones.",
        "El retardo del palpador no está compensado."
      ],
      [
        "Referencia insuficiente",
        "Un patrón coincide pero el otro se desvía.",
        "Se necesitan dos referencias independientes."
      ]
    ],
    "caption": "Barrido real · pulso×1/100000 · espesor visual ampliado",
    "timeScale": 1,
    "testSeconds": 5,
    "signals": "espesor leído/10 mm / espesor patrón/10 mm",
    "labels": "Placa · palpador · pulso · patrones escalonados · medidor",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Calibra un medidor ultrasónico con dos patrones antes de inspeccionar una placa con pérdida de espesor.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "El tiempo de vuelo incluye el material y un retardo del palpador. Una sola referencia no separa velocidad y cero.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ],
    "referenceAfterValidation": "Modelo de referencia validado: velocidad5900 m/s y retardo del palpador0,6 µs."
  },
  {
    "id": 194,
    "slug": "corrientes-inducidas-inspeccion",
    "title": "Inspección por corrientes inducidas",
    "longTitle": "Inspección por corrientes inducidas",
    "intro": "Selecciona frecuencia y separación de una sonda para revelar una discontinuidad superficial en aluminio.",
    "explore": "La frecuencia limita la profundidad de penetración. Alejar la bobina también reduce la señal de la discontinuidad.",
    "controls": [
      {
        "id": "frequency",
        "label": "Frecuencia de excitación",
        "min": 5,
        "max": 100,
        "step": 1,
        "unit": "kHz",
        "decimals": 0
      },
      {
        "id": "lift",
        "label": "Separación de sonda",
        "min": 0.1,
        "max": 3,
        "step": 0.1,
        "unit": "mm",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Profundidad de piel",
        "key": "delta",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Sensibilidad relativa",
        "key": "sensitivity",
        "unit": "",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Canal real",
        "key": "re",
        "unit": "",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Canal cuadratura",
        "key": "im",
        "unit": "",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Obtén sensibilidad≥0,15 con separación≤0,4 mm y profundidad de piel0,4–1,2 mm.",
    "equations": "δ=√(2/(ωµσ)), µ=µ0 y σ=35 MS/m. Modelo sintético de señal para discontinuidad de0,5 mm: S=(d/δ) exp(−(d+2h)/δ). Canales complejos con fase d/δ y envolvente gaussiana del barrido.",
    "limits": "La profundidad de piel es física; la respuesta de grieta es una función didáctica sintética, no soluciónMaxwell/FEM ni criterioNDT real. No estima tamaño de grieta real ni reproduce un equipo comercial.",
    "source": "https://www.twi-global.com/technical-knowledge/faqs/faq-how-far-can-eddy-currents-penetrate",
    "sourceName": "Documentación técnica del principio",
    "tools": "Sonda, cupón con ranura y plano de impedancia.",
    "job": "OT-194 · Obtén sensibilidad≥0,15 con separación≤0,4 mm y profundidad de piel0,4–1,2 mm.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Por qué aumentar siempre la frecuencia puede empeorar una inspección?",
    "answers": [
      "Porque reduce la penetración y cambia la sensibilidad a profundidad.",
      "Porque aumenta siempre la profundidad de piel.",
      "Porque elimina necesariamente la separación de la sonda.",
      "Porque hace constante la conductividad de todos los materiales."
    ],
    "faults": [
      [
        "Sonda alejada",
        "La respuesta de la discontinuidad cae.",
        "La separación reduce el acoplamiento del modelo."
      ],
      [
        "Piel muy superficial",
        "La penetración es menor que la escala de interés.",
        "La profundidad de piel decrece con la raíz de frecuencia."
      ],
      [
        "Lectura sin patrón",
        "Se interpreta cualquier cambio como defecto.",
        "Se requiere referencia y distinguir separación de discontinuidad."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 5,
    "signals": "canal real / cuadratura",
    "labels": "Sonda · bobina · cupón · ranura · instrumento",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Selecciona frecuencia y separación de una sonda para revelar una discontinuidad superficial en aluminio.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "La frecuencia limita la profundidad de penetración. Alejar la bobina también reduce la señal de la discontinuidad.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 195,
    "slug": "apriete-control-par-angulo",
    "title": "Apriete controlado por par y ángulo",
    "longTitle": "Apriete controlado por par y ángulo",
    "intro": "Prepara una unión atornillada y comprueba cómo el giro posterior al asiento genera precarga.",
    "explore": "El avance de rosca estira el tornillo y comprime la unión. La fricción cambia el par sin cambiar ese avance ideal.",
    "controls": [
      {
        "id": "angle",
        "label": "Giro tras el asiento",
        "min": 20,
        "max": 120,
        "step": 1,
        "unit": "°",
        "decimals": 0
      },
      {
        "id": "friction",
        "label": "Coeficiente de fricción",
        "min": 0.08,
        "max": 0.22,
        "step": 0.005,
        "unit": "",
        "decimals": 3
      }
    ],
    "metrics": [
      {
        "label": "Precarga",
        "key": "force",
        "unit": "kN",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Par requerido",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Esfuerzo del tornillo",
        "key": "stress",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Avance elástico",
        "key": "elongation",
        "unit": "mm",
        "scale": 1000,
        "decimals": 3
      }
    ],
    "task": "Consigue12–16 kN con esfuerzo≤300 MPa y par entre10 y20 N·m.",
    "equations": "Paso1,5 mm; avance=pθ/(2π). Rigidez equivalente tornillo+unión50 MN/m; F=keq avance. Área resistente58 mm². Par ideal=T=F[p/(2π)+µreff], reff=6 mm.",
    "limits": "Unión elástica lineal ya asentada, sin plastificación, dispersión de fricción, fluencia ni geometría detallada de rosca. keq representa al conjunto; el avance no es elongación sólo del tornillo. No usa datos de un tornillo certificado.",
    "source": "https://www.boschrexroth.com/en/us/products/product-groups/assembly-technology/tightening-technology/",
    "sourceName": "Documentación técnica del principio",
    "tools": "Atornillador, transductor de par y unión seccionada.",
    "job": "OT-195 · Consigue12–16 kN con esfuerzo≤300 MPa y par entre10 y20 N·m.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Por qué el mismo par no siempre implica la misma precarga?",
    "answers": [
      "Porque una parte del par depende de la fricción.",
      "Porque la rosca pierde siempre su paso al girar.",
      "Porque el ángulo no puede generar deformación elástica.",
      "Porque la fuerza de unión depende sólo de la velocidad de giro."
    ],
    "faults": [
      [
        "Giro excesivo",
        "La unión recibe más carga que la orden.",
        "Tras el asiento el giro incrementa la deformación elástica."
      ],
      [
        "Fricción alta",
        "El par sube sin un aumento proporcional de la precarga.",
        "La resistencia por fricción consume parte del par."
      ],
      [
        "Asiento no comprobado",
        "Se compara el giro desde un punto de partida distinto.",
        "La relación se aplica después del asiento."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 4,
    "signals": "precarga/16 kN / par/20 N·m",
    "labels": "Atornillador · portapuntas · tornillo · arandela · unión",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Prepara una unión atornillada y comprueba cómo el giro posterior al asiento genera precarga.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "El avance de rosca estira el tornillo y comprime la unión. La fricción cambia el par sin cambiar ese avance ideal.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 196,
    "slug": "sensor-laser-triangulacion",
    "title": "Ajuste de un sensor láser de triangulación",
    "longTitle": "Ajuste de un sensor láser de triangulación",
    "intro": "Diseña la geometría de un sensor que mida piezas entre200 y500 mm sin sacar el punto del detector.",
    "explore": "Una base mayor mejora la sensibilidad a distancia; el ángulo del receptor debe mantener todo el recorrido dentro del sensor.",
    "controls": [
      {
        "id": "baseline",
        "label": "Base óptica",
        "min": 30,
        "max": 100,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "angle",
        "label": "Orientación del receptor",
        "min": 10,
        "max": 50,
        "step": 1,
        "unit": "°",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Coordenada de imagen",
        "key": "u",
        "unit": "px",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Incertidumbre actual",
        "key": "sigma",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Peor incertidumbre",
        "key": "worst",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Extremo del campo",
        "key": "edge",
        "unit": "px",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Mantén el punto dentro de±512 px y la incertidumbre≤0,8 mm con base≤90 mm.",
    "equations": "Proyección paraxial con receptor descentrado: u=fpx(b/z−tanφ), fpx=800. σu=0,2 px; propagación σz=z²σu/(fpx b). Se comprueban los extremosz=0,2 y0,5 m.",
    "limits": "Cámara de proyección ideal con término de descentrado; φ es un ajuste equivalente del centro de imagen, no una rotación completa de cámara. Sin speckle, saturación, reflectancia, calibración radial ni oclusión. Haz visible esquemático.",
    "source": "https://www.micro-epsilon.com/distance-sensors/laser-sensors/",
    "sourceName": "Documentación técnica del principio",
    "tools": "Emisor láser, receptor óptico y blanco móvil.",
    "job": "OT-196 · Mantén el punto dentro de±512 px y la incertidumbre≤0,8 mm con base≤90 mm.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué compromiso introduce ampliar la base?",
    "answers": [
      "Mejora la sensibilidad pero exige conservar el campo del receptor.",
      "Elimina por completo la incertidumbre del detector.",
      "Hace que el tamaño del sensor deje de importar.",
      "Reduce siempre el campo y la sensibilidad en la misma proporción."
    ],
    "faults": [
      [
        "Fuera del detector",
        "En un extremo de carrera desaparece el punto.",
        "La geometría debe comprobar ambos extremos."
      ],
      [
        "Base corta",
        "El punto cambia poco ante una variación de distancia.",
        "La incertidumbre de distancia crece al reducir la base."
      ],
      [
        "Sólo punto central",
        "La lectura central es buena pero falla al final del rango.",
        "Se necesita verificar todo el intervalo de medida."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 4,
    "signals": "posición/512 px / incertidumbre enmm",
    "labels": "Emisor · lente · receptor · detector · blanco",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Diseña la geometría de un sensor que mida piezas entre200 y500 mm sin sacar el punto del detector.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "Una base mayor mejora la sensibilidad a distancia; el ángulo del receptor debe mantener todo el recorrido dentro del sensor.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 197,
    "slug": "estanqueidad-caida-presion",
    "title": "Ensayo de estanqueidad por caída de presión",
    "longTitle": "Ensayo de estanqueidad por caída de presión",
    "intro": "Programa un ensayo de estanqueidad sin confundir enfriamiento del aire con una fuga.",
    "explore": "Tras presurizar, el gas aún cambia de temperatura. Esperar reduce el sesgo, pero alarga el ciclo de producción.",
    "controls": [
      {
        "id": "warmup",
        "label": "Estabilización previa",
        "min": 0,
        "max": 120,
        "step": 1,
        "unit": "s",
        "decimals": 0
      },
      {
        "id": "measure",
        "label": "Ventana de medida",
        "min": 10,
        "max": 60,
        "step": 1,
        "unit": "s",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Fuga estimada",
        "key": "estimate",
        "unit": "cm³/min",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Sesgo del resultado",
        "key": "error",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Caída medida",
        "key": "drop",
        "unit": "Pa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Ciclo total",
        "key": "total",
        "unit": "s",
        "scale": 1,
        "decimals": 0
      }
    ],
    "task": "Mide con error≤5 %, caída≥20 Pa y ciclo total≤130 s.",
    "equations": "Recipiente1 L, presión absoluta300 kPa, T=298,15 K, fuga patrón0,8 cm³/min referida a101325 Pa. Caída isoterma por fuga: Pamb Q/V. Transitorio térmico añadidoP0·0,5/T·exp(−t/15). EstimaciónQ=ΔP V/(Pamb Δt).",
    "limits": "Fuga constante referida al ambiente y perturbación térmica linealizada. Sin elasticidad del recipiente, variación de caudal con presión ni temperatura espacial. El ensayo se reproduce en6 s de demostración y muestra en la orden sus segundos físicos. Las partículas representan puntos de gas ideal con reflexión geométrica en un recinto interior; velocidades térmicas de298,15 K ralentizadas×10000, sin dinámica molecular ni acoplamiento a la fuga.",
    "source": "https://www.ateq-leaktesting.com/products/leak-tester/",
    "sourceName": "Documentación técnica del principio",
    "tools": "Recipiente, válvulas, presión diferencial y fuga patrón.",
    "job": "OT-197 · Mide con error≤5 %, caída≥20 Pa y ciclo total≤130 s.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué debe comprobarse antes de atribuir toda caída a una fuga?",
    "answers": [
      "Que la estabilización térmica no domina el cambio de presión.",
      "Que toda caída de presión es necesariamente una fuga.",
      "Que enfriar y perder masa son el mismo fenómeno.",
      "Que basta ampliar la presión inicial sin estabilizar."
    ],
    "faults": [
      [
        "Estabilización corta",
        "Se estima más fuga que el patrón.",
        "El enfriamiento añade caída a la pérdida por fuga."
      ],
      [
        "Ventana corta",
        "La diferencia acumulada es pequeña.",
        "Una ventana suficiente mejora la señal observada."
      ],
      [
        "Ciclo excesivo",
        "La lectura es buena pero tarda demasiado para la orden.",
        "La calidad de medida y el tiempo deben cumplirse juntos."
      ]
    ],
    "caption": "Ensayo físico comprimido a6 s · fuga constante y deriva térmica sintéticas",
    "timeScale": 1,
    "testSeconds": 6,
    "signals": "caída normalizada / tiempo de la ventana",
    "labels": "Recipiente · válvula · tubería · manómetro · partículas",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Programa un ensayo de estanqueidad sin confundir enfriamiento del aire con una fuga.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "Tras presurizar, el gas aún cambia de temperatura. Esperar reduce el sesgo, pero alarga el ciclo de producción.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 198,
    "slug": "alineacion-laser-maquinaria",
    "title": "Alineación láser de maquinaria",
    "longTitle": "Alineación láser de maquinaria",
    "intro": "Corrige dos apoyos de un motor para eliminar desplazamiento y ángulo respecto de una bomba.",
    "explore": "Cambiar ambos apoyos igual desplaza el eje. Cambiarlos distinto también lo inclina.",
    "controls": [
      {
        "id": "front",
        "label": "Corrección apoyo delantero",
        "min": -1,
        "max": 1,
        "step": 0.01,
        "unit": "mm",
        "decimals": 2
      },
      {
        "id": "rear",
        "label": "Corrección apoyo trasero",
        "min": -1,
        "max": 1,
        "step": 0.01,
        "unit": "mm",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Desplazamiento en acople",
        "key": "offset",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Desalineación angular",
        "key": "angular",
        "unit": "mrad",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Residual a300 mm",
        "key": "far",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Separación de apoyos",
        "key": "support",
        "unit": "mm",
        "scale": 1,
        "decimals": 0
      }
    ],
    "task": "Deja desplazamiento≤0,03 mm y ángulo≤0,1 mrad ajustando ambos apoyos.",
    "equations": "Desalineación inicial:0,35 mm y0,6 mrad. Apoyos a200 y600 mm del acople. Pendiente corregida=0,6+(hr−hf)/0,4 mrad; offset=0,35+hf−0,2(hr−hf)/0,4 mm.",
    "limits": "Sólo plano vertical y ejes rígidos. Correcciones firmadas representan posicionamiento equivalente, no retirar calzas físicamente inexistentes. Sin pie cojo, crecimiento térmico ni tolerancias normativas. Desviación visual amplificada×100.",
    "source": "https://www.fluke.com/en/learn/blog/alignment/how-to-check-pump-coupling-alignment",
    "sourceName": "Documentación técnica del principio",
    "tools": "Cabezal láser, receptor, apoyos y registro de alineación.",
    "job": "OT-198 · Deja desplazamiento≤0,03 mm y ángulo≤0,1 mrad ajustando ambos apoyos.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué ajuste cambia el ángulo además de la altura?",
    "answers": [
      "Una diferencia entre las correcciones de los dos apoyos.",
      "Aplicar exactamente la misma corrección a ambos apoyos.",
      "Cambiar sólo la velocidad del motor.",
      "Mover el acople sin comprobar los apoyos."
    ],
    "faults": [
      [
        "Corrección común",
        "Desaparece parte del offset pero sigue el ángulo.",
        "Mover ambos apoyos igual no corrige pendiente."
      ],
      [
        "Corrección diferencial",
        "Se mejora el ángulo pero queda desplazamiento.",
        "La recta del eje necesita posición y orientación correctas."
      ],
      [
        "Referencia térmica",
        "La alineación cambia al operar la máquina.",
        "El modelo no incluye crecimiento térmico."
      ]
    ],
    "caption": "Desviaciones amplificadas×100 · alineación en plano vertical",
    "timeScale": 1,
    "testSeconds": 4,
    "signals": "señales de dos posiciones del eje enmm",
    "labels": "Motor · bomba · acople · láser · receptor · apoyos",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Corrige dos apoyos de un motor para eliminar desplazamiento y ángulo respecto de una bomba.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "Cambiar ambos apoyos igual desplaza el eje. Cambiarlos distinto también lo inclina.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 199,
    "slug": "termografia-cuadro-electrico",
    "title": "Termografía de un cuadro eléctrico",
    "longTitle": "Termografía de un cuadro eléctrico",
    "intro": "Ajusta una lectura infrarroja para distinguir un contacto caliente de un reflejo sobre metal.",
    "explore": "La cámara recibe emisión propia y radiación reflejada. En una superficie brillante, el ajuste de emisividad cambia mucho el resultado.",
    "controls": [
      {
        "id": "emissivity",
        "label": "Emisividad configurada",
        "min": 0.2,
        "max": 1,
        "step": 0.01,
        "unit": "",
        "decimals": 2
      },
      {
        "id": "reflected",
        "label": "Temperatura reflejada",
        "min": 10,
        "max": 60,
        "step": 1,
        "unit": "°C",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Temperatura inferida",
        "key": "apparent",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error frente al patrón",
        "key": "error",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Contraste térmico",
        "key": "contrast",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error de reflejo",
        "key": "backgroundError",
        "unit": "°C",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Contrasta con patrón80 °C: error≤2 °C, reflejo25±2 °C y contraste≥45 °C.",
    "equations": "Balance gris de banda total: L/σ=εreal Th⁴+(1−εreal)Tr⁴, εreal se determina por comparación con el patrón, Th=353,15 K yTr=298,15 K. Tmed=[(L/σ−(1−εset)Trset⁴)/εset]^(1/4). Mapa térmico sintético con puntos de calor prescritos.",
    "limits": "Modelo de radiación total gris, no respuesta espectral real de una cámara8–14 µm. El mapa no resuelve transferencia térmica ni diagnostica contactos reales. No existe conexión eléctrica real.",
    "source": "https://support.flir.com/DSDownload/Assets/T810442-en-US_A4.pdf",
    "sourceName": "Documentación técnica del principio",
    "tools": "CámaraIR virtual, referencia térmica y cuadro con conexiones visibles.",
    "job": "OT-199 · Contrasta con patrón80 °C: error≤2 °C, reflejo25±2 °C y contraste≥45 °C.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué puede falsear la temperatura de un metal brillante?",
    "answers": [
      "La radiación reflejada y una emisividad mal configurada.",
      "Únicamente el tono asignado por la paleta.",
      "Sólo la distancia focal de la cámara visible.",
      "El radio del tornillo, independientemente de la radiación."
    ],
    "faults": [
      [
        "Emisividad incorrecta",
        "La lectura no coincide con la referencia de contacto.",
        "Emisión y reflexión se reparten según emisividad."
      ],
      [
        "Reflejo mal estimado",
        "La superficie parece cambiar de temperatura con el entorno.",
        "Parte de la radiación procede del ambiente reflejado."
      ],
      [
        "Mapa sin referencia",
        "Se juzga sólo por el color de la imagen.",
        "El color depende de la escala y no sustituye la medida."
      ]
    ],
    "caption": "Indicador térmico en falso color · balance gris de radiación total",
    "timeScale": 1,
    "testSeconds": 4,
    "signals": "temperatura inferida/100 °C / referencia80 °C",
    "labels": "Cuadro · interruptores · bornes · cableado · indicador IR",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Ajusta una lectura infrarroja para distinguir un contacto caliente de un reflejo sobre metal.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "La cámara recibe emisión propia y radiación reflejada. En una superficie brillante, el ajuste de emisividad cambia mucho el resultado.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ],
    "referenceAfterValidation": "Modelo de referencia validado: emisividad real0,60; patrón80 °C y reflejo25 °C."
  },
  {
    "id": 200,
    "slug": "robot-amr-calibracion-odometria",
    "title": "Robot AMR: calibración y regreso al muelle",
    "longTitle": "Robot AMR: calibración y regreso al muelle",
    "intro": "Calibra un robot móvil de almacén para completar una ruta y regresar al muelle con posición y orientación correctas.",
    "explore": "El radio de rueda cambia la distancia recorrida. La separación entre ruedas cambia cuánto gira ante órdenes opuestas.",
    "controls": [
      {
        "id": "radius",
        "label": "Radio configurado",
        "min": 90,
        "max": 110,
        "step": 0.1,
        "unit": "mm",
        "decimals": 1
      },
      {
        "id": "track",
        "label": "Vía configurada",
        "min": 450,
        "max": 550,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Error final de regreso",
        "key": "finalError",
        "unit": "mm",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Error angular final",
        "key": "finalHeading",
        "unit": "°",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Escala de distancia",
        "key": "ratio",
        "unit": "",
        "scale": 1,
        "decimals": 4
      },
      {
        "label": "Distancia de cuatro tramos",
        "key": "distance",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %.",
    "equations": "Robot diferencial: v=r(ωR+ωL)/2, Ω=r(ωR−ωL)/b. Radio y vía reales constantes, desconocidos hasta validar la calibración. Órdenes calculadas con geometría declarada: cuatro rectas nominales2 m y cuatro giros de90°. Rectas3 s, giros1 s; integración exacta por segmento. LiDAR visual usa intersección geométrica con estantes.",
    "limits": "Sin deslizamiento, ruido de encoder, obstáculos dinámicos, SLAM, planificación ni control de seguridad. Trayectoria abierta para calibración, no navegación autónoma de un fabricante. El ciclo se reinicia después de18 s; no es una maniobra física instantánea.",
    "source": "https://www.roboticsbook.org/S52_diffdrive_actions.html",
    "sourceName": "Documentación técnica del principio",
    "tools": "AMR, encoders, muelle, plano de almacén y escáner de distancias.",
    "job": "OT-200 · Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %.",
    "procedure": [
      "Identifica las referencias, el instrumento y el objetivo de la orden.",
      "Ajusta los parámetros y ejecuta la prueba; compara los criterios simultáneos.",
      "Valida manualmente y descarga la evidencia con la configuración ensayada."
    ],
    "quiz": "¿Qué comprueba el regreso al muelle tras varios giros?",
    "answers": [
      "El efecto acumulado de la calibración de distancia y giro.",
      "Sólo que las dos ruedas hayan dado las mismas vueltas.",
      "Sólo la posición final, sin observar la orientación.",
      "Que el radio y la vía no influyen si la ruta es cuadrada."
    ],
    "faults": [
      [
        "Radio incorrecto",
        "Todas las rectas salen a otra escala.",
        "El radio convierte giro de rueda en avance."
      ],
      [
        "Vía incorrecta",
        "Cada giro introduce un pequeño error acumulativo.",
        "La separación entre ruedas fija el giro de la base."
      ],
      [
        "Odómetro idealizado",
        "El modelo funciona pero el suelo real puede cambiar el resultado.",
        "Deslizamiento y ruido no están incluidos."
      ]
    ],
    "caption": "Tiempo real · equipo virtual con parámetros sintéticos",
    "timeScale": 1,
    "testSeconds": 16,
    "signals": "posiciónX / posiciónZ enm",
    "labels": "Chasis · ruedas · carga · escáner · muelle · estantes",
    "eyebrow": "Orden de trabajo · taller profesional",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo",
        "text": "Calibra un robot móvil de almacén para completar una ruta y regresar al muelle con posición y orientación correctas.",
        "view": "assembly"
      },
      {
        "title": "Usa una referencia",
        "text": "El radio de rueda cambia la distancia recorrida. La separación entre ruedas cambia cuánto gira ante órdenes opuestas.",
        "view": "inspection"
      },
      {
        "title": "Entrega un registro vigente",
        "text": "Abre la orden, prepara el equipo y ejecuta el ensayo. Valida el resultado y guarda el informe.",
        "view": "assembly"
      }
    ],
    "referenceAfterValidation": "Modelo de referencia validado: radio real100 mm y vía real500 mm."
  }
];
