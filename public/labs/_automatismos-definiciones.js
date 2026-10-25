export const definitions=[
  {
    "id": 177,
    "slug": "puesta-marcha-indexador-ginebra",
    "title": "Indexador de una estación",
    "longTitle": "Puesta en marcha de un indexador de Ginebra: ciclo, reposo y aceleración",
    "intro": "Pon en marcha una estación que debe detener cada pieza el tiempo suficiente para que trabaje una herramienta.",
    "explore": "El pasador hace avanzar la mesa y después la deja quieta. Cambiar estaciones y velocidad modifica la ventana disponible para trabajar.",
    "controls": [
      {
        "id": "slots",
        "label": "Estaciones de la mesa",
        "min": 4,
        "max": 8,
        "step": 1,
        "unit": "",
        "decimals": 0
      },
      {
        "id": "rpm",
        "label": "Giro del motor",
        "min": 20,
        "max": 120,
        "step": 1,
        "unit": "rpm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Reposo por ciclo",
        "key": "dwell",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Velocidad de mesa",
        "key": "outSpeed",
        "unit": "rad/s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Aceleración de mesa",
        "key": "acc",
        "unit": "rad/s²",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Paso entre estaciones",
        "key": "indexAngle",
        "unit": "°",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Configura ≥6 estaciones y ≥40 índices/min, con reposo ≥0,8 s y aceleración ≤50 rad/s².",
    "caption": "Cámara lenta ×1/2 · geometría de indexado ideal · sin choques calculados",
    "timeScale": 0.5,
    "signals": "velocidad de mesa dividida por la del motor / ventana de avance",
    "labels": "Motor · pasador · ranuras · mesa · apoyos",
    "equations": "Para N ranuras: k=r/c=sin(π/N), c=1 unidad visual. El pasador engrana durante 2α, α=π/2−π/N. Durante ese intervalo ψ=−atan2(k sinφ,1−k cosφ), con incremento de una estación 2π/N por vuelta. Fuera de él, la mesa permanece detenida. Se usan derivadas analíticas para velocidad y aceleración. La duración del reposo es (π+2π/N)/ω. Se revisan721 posturas por ciclo.",
    "limits": "Cinemática de un mecanismo rígido ideal. El bloqueo durante el reposo está impuesto; no se calcula el contacto del disco de bloqueo, impacto del pasador, flexión, desgaste ni dinámica del motor. Las ranuras muestran el acoplamiento, no tolerancias de fabricación. No se simula PLC de seguridad ni una célula real.",
    "source": "https://archive.nptel.ac.in/content/storage2/courses/112103174/module4/lec5/3.html",
    "sourceName": "NPTEL, mecanismos de indexado",
    "job": "OT-177 · La estación de marcado necesita seis posiciones como mínimo y800 ms de pieza detenida. Debes entregar un ajuste que conserve al menos40 piezas/min sin exceder la aceleración del útil.",
    "tools": "Tacómetro, señal de ventana de avance y registro temporal virtuales.",
    "procedure": [
      "Lee la orden y relaciona el reposo con el tiempo de proceso.",
      "Configura estaciones y velocidad; ensaya un ciclo completo.",
      "Valida los límites y guarda el informe con el ajuste probado."
    ],
    "quiz": "¿Qué tiempo debe reservarse para el proceso de la estación?",
    "answers": [
      "El intervalo en que la mesa está detenida y posicionada.",
      "Cualquier intervalo aunque el pasador esté indexando.",
      "Sólo el tiempo que tarda el motor en una vuelta completa.",
      "El tiempo sin alimentación del tacómetro."
    ],
    "faults": [
      [
        "Ciclo demasiado rápido",
        "Hay producción suficiente, pero la herramienta no termina antes del siguiente avance.",
        "La ventana de reposo se acorta al aumentar el giro."
      ],
      [
        "Aceleración excesiva",
        "El tiempo de reposo cabe, pero el avance solicita aceleraciones demasiado altas.",
        "La aceleración crece con el cuadrado del giro y depende de la geometría de indexado."
      ],
      [
        "Mesa insuficiente",
        "El avance es suave, pero no hay suficientes posiciones para las operaciones de la orden.",
        "La capacidad de estaciones forma parte del diseño, además de la velocidad."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Pon en marcha una estación que debe detener cada pieza el tiempo suficiente para que trabaje una herramienta.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "El pasador hace avanzar la mesa y después la deja quieta. Cambiar estaciones y velocidad modifica la ventana disponible para trabajar.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 178,
    "slug": "banco-leva-seguidor",
    "title": "Banco de leva y seguidor",
    "longTitle": "Ajuste de una leva: carrera, contacto y ángulo de presión",
    "intro": "Ajusta una leva de alimentación para que el seguidor complete su carrera sin perder contacto a la velocidad de producción.",
    "explore": "Una subida demasiado breve exige mucha aceleración. La fuerza de contacto permite comprobar si el resorte puede mantener al rodillo sobre la leva.",
    "controls": [
      {
        "id": "beta",
        "label": "Ángulo de subida",
        "min": 60,
        "max": 160,
        "step": 1,
        "unit": "°",
        "decimals": 0
      },
      {
        "id": "rpm",
        "label": "Régimen del eje",
        "min": 200,
        "max": 1000,
        "step": 10,
        "unit": "rpm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Carrera del seguidor",
        "key": "s",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      },
      {
        "label": "Aceleración",
        "key": "acc",
        "unit": "m/s²",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Contacto axial",
        "key": "normal",
        "unit": "N",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Ángulo de presión",
        "key": "pressure",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      }
    ],
    "task": "Consigue ≥450 ciclos/min, aceleración ≤80 m/s², presión ≤25° y contacto positivo en toda la vuelta.",
    "caption": "Cámara lenta ×1/40 · trayectoria ideal; el contacto negativo indica pérdida de seguimiento",
    "timeScale": 0.025,
    "signals": "carrera dividida por20 mm / aceleración dividida por80 m/s²",
    "labels": "Leva · rodillo · seguidor · resorte · guías · motor",
    "equations": "Carrera20 mm; subida cicloidal s=h[u−sin(2πu)/(2π)] durante β, reposo hasta180°, retorno de la misma duración y reposo inferior. ds/dθ=h(1−cos2πu)/β; d²s/dθ²=2πh sin2πu/β². Fuerza axial N=120+9000s+0,6a en N; sin gravedad en este balance axial. Curva de paso r=48 mm+s; rodillo8 mm, radio base40 mm. El perfil se obtiene desplazando la curva de paso a lo largo de su normal. tanα=|ds/dθ|/(48 mm+s).",
    "limits": "Mecanismo rígido y resorte lineal precargado. La trayectoria es impuesta incluso si N resulta negativa: se avisa que el seguimiento no es viable; no se simula vuelo o impacto del seguidor. Sin lubricación, resistencia de contacto Hertz, elasticidad, fabricación de leva ni dinámica completa del motor. El rodillo no tiene un modelo de giro por adherencia.",
    "source": "https://egyankosh.ac.in/bitstream/123456789/27124/1/Unit-4.pdf",
    "sourceName": "IGNOU, mecanismos de leva y seguidor",
    "job": "OT-178 · Una alimentadora debe trabajar a450 ciclos/min o más. En el banco comprobarás si su ley de movimiento evita aceleraciones excesivas y separación del seguidor.",
    "tools": "Indicador de desplazamiento, traza de aceleración y fuerza axial virtuales.",
    "procedure": [
      "Identifica la carrera y la duración de subida.",
      "Ajusta el régimen y el perfil; ejecuta el ensayo de una vuelta.",
      "Documenta el mínimo de contacto y los máximos de aceleración y ángulo."
    ],
    "quiz": "¿Qué indica una fuerza de contacto calculada negativa?",
    "answers": [
      "La trayectoria pediría que la leva tirara del rodillo; se perdería el seguimiento.",
      "Una fuerza normal negativa mantiene mejor el contacto.",
      "La carrera ya no necesita resorte.",
      "La leva cambia automáticamente su perfil."
    ],
    "faults": [
      [
        "Pérdida de contacto",
        "En parte de la bajada la fuerza axial calculada cambia de signo.",
        "La aceleración impuesta exige más retención de la que ofrece el resorte."
      ],
      [
        "Subida demasiado brusca",
        "El régimen es necesario, pero se rebasa el límite de aceleración.",
        "Dar más ángulo a la subida reduce la aceleración para el mismo régimen."
      ],
      [
        "Presión lateral elevada",
        "El seguidor necesita una pendiente muy grande en poco ángulo.",
        "El ángulo de presión crece con la pendiente respecto al radio de paso."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Ajusta una leva de alimentación para que el seguidor complete su carrera sin perder contacto a la velocidad de producción.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "Una subida demasiado breve exige mucha aceleración. La fuerza de contacto permite comprobar si el resorte puede mantener al rodillo sobre la leva.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 179,
    "slug": "seleccion-pinza-palancas",
    "title": "Selección de una pinza",
    "longTitle": "Selección de pinza paralela: fuerza, presión de contacto y margen de agarre",
    "intro": "Selecciona la geometría y el par de una pinza que sujete una pieza sin deslizar ni dañar sus superficies.",
    "explore": "La misma fuerza de motor produce distintos esfuerzos según las palancas. Más fuerza de agarre también aumenta la presión sobre la pieza.",
    "controls": [
      {
        "id": "length",
        "label": "Longitud de las barras",
        "min": 70,
        "max": 100,
        "step": 1,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "torque",
        "label": "Par de cierre",
        "min": 0.5,
        "max": 6,
        "step": 0.1,
        "unit": "N·m",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Fuerza actual por mordaza",
        "key": "force",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Capacidad por fricción",
        "key": "capacity",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Margen frente al peso",
        "key": "margin",
        "unit": "×",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Presión al sujetar",
        "key": "pressure",
        "unit": "MPa",
        "scale": 1e-06,
        "decimals": 3
      }
    ],
    "task": "Sujeta2 kg con margen ≥1,3, presión ≤0,4 MPa y barras de ≤85 mm.",
    "caption": "Tiempo real · apertura, cierre y reposo de prueba · pieza apoyada durante el ensayo",
    "timeScale": 1,
    "signals": "fuerza por mordaza dividida por40 N / abertura dividida por100 mm",
    "labels": "Motor · paralelogramos · mordazas · apoyos · pieza",
    "equations": "Separación de pivotes200 mm, pieza de65 mm. Al contactar: cosθ=(0,1−0,065/2)/L. Trabajo virtual: T=2 F L sinθ. Coeficiente de fricción0,5 en cada mordaza, capacidad2μF. Margen=2μF/(2g). Área de cada almohadilla100 mm², presión F/A. La apertura usa transiciones quínticas de un segundo; la fuerza de cierre nominal se aplica en el reposo de contacto. No se calcula el transitorio de fuerza.",
    "limits": "Agarre simétrico por fricción y geometría rígida ideal. No incluye flexión de dedos, dinámica de caída, desgaste, grasa, variación real de μ ni control del motor. La pieza permanece apoyada en el útil; el margen es una predicción, no una prueba de elevación real. Límites de presión y dimensiones didácticos, no ficha comercial.",
    "source": "https://digitaledition.assemblymag.com/april-2021/assembly-how-to-schunk/",
    "sourceName": "SCHUNK, criterios de selección de agarre",
    "job": "OT-179 · Debes elegir una pinza compacta para una pieza de2 kg con caras delicadas. Presenta capacidad de agarre, presión y dimensión del mecanismo.",
    "tools": "Medición virtual de abertura, fuerza y presión; útil de apoyo para la prueba.",
    "procedure": [
      "Lee masa, fricción y presión admisible de la pieza de ensayo.",
      "Configura palancas y par; realiza el ciclo con la pieza apoyada.",
      "Justifica el margen y exporta el ajuste que cumple."
    ],
    "quiz": "¿Por qué no basta con pedir el mayor par posible?",
    "answers": [
      "Puede superar la presión admisible y dañar la pieza.",
      "El par nunca influye en la fuerza de las mordazas.",
      "La fricción desaparece con poco par.",
      "El peso de la pieza se vuelve cero al cerrar."
    ],
    "faults": [
      [
        "Margen insuficiente",
        "La presión es baja, pero la fricción disponible no sostiene la carga con reserva.",
        "Debe aumentar la fuerza útil o cambiar la ventaja mecánica."
      ],
      [
        "Presión excesiva",
        "El agarre tiene gran reserva, pero las almohadillas sobrepasan la presión admitida.",
        "La capacidad de sujetar y la de no marcar la pieza son criterios diferentes."
      ],
      [
        "Geometría demasiado grande",
        "La fuerza y la presión son correctas, pero la pinza no cabe en el espacio del útil.",
        "La selección debe incluir las dimensiones, además del esfuerzo."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Selecciona la geometría y el par de una pinza que sujete una pieza sin deslizar ni dañar sus superficies.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "La misma fuerza de motor produce distintos esfuerzos según las palancas. Más fuerza de agarre también aumenta la presión sobre la pieza.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 180,
    "slug": "alineacion-doble-cardan",
    "title": "Alineación de doble Cardán",
    "longTitle": "Alineación de una transmisión de doble Cardán: fase y ondulación de velocidad",
    "intro": "Alinea las horquillas de una transmisión para que el giro llegue uniforme a pesar del desvío entre ejes.",
    "explore": "Una cruceta introduce variaciones de velocidad. Dos ángulos iguales pueden compensarlas si las horquillas están correctamente en fase.",
    "controls": [
      {
        "id": "bend",
        "label": "Ángulo de cada junta",
        "min": 10,
        "max": 40,
        "step": 1,
        "unit": "°",
        "decimals": 0
      },
      {
        "id": "phase",
        "label": "Error de fase de horquillas",
        "min": -30,
        "max": 30,
        "step": 1,
        "unit": "°",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Velocidad de salida",
        "key": "omega",
        "unit": "rad/s",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Relación instantánea",
        "key": "ratio",
        "unit": "×",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Par de salida",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Par de entrada",
        "key": "inputTorque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Conserva un desvío ≥25°, ondulación de velocidad ≤1 % y par de salida ≤190 N·m.",
    "caption": "Cámara lenta ×1/20 · entrada300 rpm · dos juntas ideales de igual ángulo",
    "timeScale": 0.05,
    "signals": "relación de velocidades / referencia unitaria",
    "labels": "Eje de entrada · crucetas · horquillas · eje intermedio · eje de salida",
    "equations": "Junta simple: γ=atan2(cosβ sinθ,cosθ) con ángulo desenrollado. Segunda junta compensadora: ψ=atan2(sin(γ+δ),cosβ cos(γ+δ))−δ. Se derivan ambas transformaciones para la relación instantánea. Con δ=0 se obtiene ψ=θ. Entrada a300 rpm y potencia ideal constante5 kW: Tsalida=P/ωsalida. Se revisa una vuelta completa en721 posturas.",
    "limits": "Ángulos de junta iguales ejes de entrada/salida paralelos; error de fase δ impuesto. Sin elasticidad, desequilibrio, desgaste, fuerzas de rodamiento, holgura ni límites comerciales de velocidad. No es un procedimiento de alineación bajo un vehículo real. Las crucetas siguen las direcciones ortogonales deducidas de la cinemática.",
    "source": "https://www.huco.com/products/power-transmission/universal-joints",
    "sourceName": "Huco, transmisión mediante juntas universales",
    "job": "OT-180 · Un eje transmite5 kW a300 rpm y necesita superar un obstáculo con al menos25° de desvío. Verifica fase y par pulsante antes de aceptar la transmisión.",
    "tools": "Dos tacómetros virtuales, traza de relación instantánea y registro de par.",
    "procedure": [
      "Observa la ondulación con horquillas fuera de fase.",
      "Ajusta fase sin eliminar el desvío requerido; ensaya una vuelta.",
      "Registra la ondulación y comprueba el par máximo."
    ],
    "quiz": "¿Qué permite que la segunda junta compense la primera?",
    "answers": [
      "Igualdad de ángulos y fase adecuada entre las horquillas.",
      "Hacer que las dos crucetas tengan longitudes infinitas.",
      "Eliminar toda la potencia de salida.",
      "Desalinear al máximo las horquillas."
    ],
    "faults": [
      [
        "Horquillas fuera de fase",
        "Las velocidades de entrada y salida tienen la misma media, pero la salida pulsa.",
        "Las variaciones de las dos juntas no se están cancelando."
      ],
      [
        "Par pulsante alto",
        "La potencia se conserva, pero en los mínimos de velocidad sube demasiado el par.",
        "A potencia constante, el par aumenta cuando baja la velocidad."
      ],
      [
        "Desvío insuficiente",
        "El giro es uniforme, pero el eje no supera el obstáculo de la orden.",
        "No se resuelve el montaje eliminando un ángulo que la instalación necesita."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Autotrónica",
    "area": "AUTOMOVILIDAD",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Alinea las horquillas de una transmisión para que el giro llegue uniforme a pesar del desvío entre ejes.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "Una cruceta introduce variaciones de velocidad. Dos ángulos iguales pueden compensarlas si las horquillas están correctamente en fase.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 181,
    "slug": "analizador-vibraciones-rodamiento",
    "title": "Analizador de vibraciones",
    "longTitle": "Diagnóstico de rodamientos: muestreo, FFT y frecuencias de defecto",
    "intro": "Configura un analizador de vibraciones y registra un espectro que permita investigar un ruido de rodamiento.",
    "explore": "El muestreo limita qué frecuencias puedes medir. Un registro más largo separa mejor dos picos próximos.",
    "controls": [
      {
        "id": "sample",
        "label": "Frecuencia de muestreo",
        "min": 512,
        "max": 4096,
        "step": 512,
        "unit": "Hz",
        "decimals": 0
      },
      {
        "id": "duration",
        "label": "Duración del registro",
        "min": 250,
        "max": 2000,
        "step": 250,
        "unit": "ms",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Pico dominante medido",
        "key": "peak",
        "unit": "Hz",
        "scale": 1,
        "decimals": 1,
        "empty": "Pendiente"
      },
      {
        "label": "Resolución del registro",
        "key": "resolution",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Límite de Nyquist",
        "key": "nyquist",
        "unit": "Hz",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Muestras reales",
        "key": "samples",
        "unit": "",
        "scale": 1,
        "decimals": 0
      }
    ],
    "task": "Registra sin alias los componentes de hasta900 Hz, con resolución ≤1 Hz y pico principal bien localizado.",
    "caption": "Registro en tiempo real · rotor ×1/100 · vibración ampliada ×15000",
    "timeScale": 1,
    "signals": "espectro FFT con ventana Hann: frecuencia y amplitud de aceleración",
    "labels": "Motor · acoplamiento · rodamiento · acelerómetro · analizador",
    "equations": "Eje30 Hz; rodamiento ideal de8 bolas, diámetro8 mm, diámetro de paso40 mm y contacto0°. BPFO=4fr(1−0,2)=96 Hz; BPFI=144 Hz; BSF=72 Hz; FTF=12 Hz. Señal sintética: senos a30,96,100,192,288,900 y17 Hz, con amplitudes0,45;1,4;0,6;0,25;0,15;0,2;0,03 m/s². FFT radix2 con ventana Hann, normalización por ganancia coherente y relleno de ceros. Resolución física1/T; el espaciado de bins después del relleno no la mejora.",
    "limits": "Señal sintética conocida para aprender adquisición y comparación de frecuencias, no datos de una máquina real ni estimación de vida. Sin señal de impactos, resonancia de montaje, demodulación de envolvente, anti-alias analógico o clasificación automática comercial. No se deduce severidad a partir del color de la pieza. La vibración visible es una amplificación ilustrativa del desplazamiento equivalente a96 Hz.",
    "source": "https://evolution.skf.com/us/vibrations-help-find-faulty-components-3/",
    "sourceName": "SKF, frecuencias de defecto y diagnóstico por vibración",
    "job": "OT-181 · Investiga una vibración en un motor de1800 rpm. Ajusta el analizador, registra la señal y compara el pico con la cinemática del rodamiento.",
    "tools": "Acelerómetro, tacómetro y analizador FFT virtuales; ventana Hann y registro ajustable.",
    "procedure": [
      "Comprueba las unidades, el giro del eje y el rango de frecuencia requerido.",
      "Configura muestreo y duración; adquiere un registro completo.",
      "Compara los picos con las frecuencias del rodamiento y conserva el informe."
    ],
    "quiz": "El pico96 Hz coincide con BPFO. ¿Qué zona debes investigar?",
    "answers": [
      "El anillo exterior del rodamiento.",
      "La frecuencia de alimentación por definición.",
      "El anillo interior, cualquiera que sea su geometría.",
      "El tacómetro, porque todo pico es un error."
    ],
    "faults": [
      [
        "Aliasing",
        "Un componente de frecuencia alta aparece dentro de una banda más baja al cambiar el muestreo.",
        "Se necesita suficiente frecuencia de muestreo y filtrado real en una adquisición física."
      ],
      [
        "Registro demasiado corto",
        "Dos componentes próximos no se distinguen con claridad aunque el muestreo sea alto.",
        "La resolución física depende del tiempo de observación."
      ],
      [
        "Comparación cinemática ausente",
        "Se observan picos claros, pero se atribuyen a una pieza sin conocer las frecuencias de giro y defecto.",
        "La interpretación necesita geometría del rodamiento y velocidad del eje."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Configura un analizador de vibraciones y registra un espectro que permita investigar un ruido de rodamiento.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "El muestreo limita qué frecuencias puedes medir. Un registro más largo separa mejor dos picos próximos.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 182,
    "slug": "verificacion-motorreductor-sinfin",
    "title": "Verificación de motorreductor",
    "longTitle": "Motorreductor de tornillo sin fin: par útil, pérdidas y reversibilidad",
    "intro": "Verifica un motorreductor que debe entregar par suficiente y comprueba cómo el rozamiento afecta su reversibilidad.",
    "explore": "El rozamiento reduce la eficiencia y puede impedir el retroceso ideal. Esa retención no sustituye una función de seguridad certificada.",
    "controls": [
      {
        "id": "mu",
        "label": "Coeficiente de rozamiento",
        "min": 0.04,
        "max": 0.2,
        "step": 0.01,
        "unit": "",
        "decimals": 2
      },
      {
        "id": "torque",
        "label": "Par del motor",
        "min": 1,
        "max": 8,
        "step": 0.1,
        "unit": "N·m",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Par útil de salida",
        "key": "outputTorque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Rendimiento",
        "key": "eta",
        "unit": "%",
        "scale": 100,
        "decimals": 1
      },
      {
        "label": "Pérdidas",
        "key": "heat",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Ángulo de fricción",
        "key": "friction",
        "unit": "°",
        "scale": 57.29577951308232,
        "decimals": 1
      }
    ],
    "task": "Obtén ≥100 N·m, pérdidas ≤25 W y condición ideal de autobloqueo.",
    "caption": "Cámara lenta ×1/10 · entrada60 rpm · relación40:1 · retención ideal no certificada",
    "timeScale": 0.1,
    "signals": "fracción de potencia útil / fracción de pérdidas",
    "labels": "Tornillo · corona · apoyos · brida · motor",
    "equations": "Tornillo de una entrada, corona40 dientes; γ=8°, φ=atanμ. Modelo de tornillo ideal: η=tanγ/tan(γ+φ). Tsalida=40ηTentrada y pérdidas=(1−η)Tentradaωentrada. Entrada60 rpm. Condición estática ideal de no reversibilidad γ≤φ. La geometría de paso usa radio del tornillo40 mm y radio de corona40r tanγ; se amplía tres veces.",
    "limits": "Modelo de rozamiento seco uniforme. Sin temperatura, viscosidad de lubricante, desgaste, contacto de dientes, rodadura real, rodamientos o vibración. No se usa el autobloqueo como freno de seguridad; no certifica sostener una carga real. El perfil de dientes y la rosca visible son esquemáticos, no una geometría de fabricación.",
    "source": "https://download.sew-eurodrive.com/download/html/31546463/en-EN/3665340941955631876747.html",
    "sourceName": "SEW-EURODRIVE, autobloqueo y eficiencia",
    "job": "OT-182 · Verifica un accionamiento de posicionamiento que necesita100 N·m de salida. Debes documentar rendimiento y reversibilidad sin confundirla con un freno de seguridad.",
    "tools": "Tacómetro, cálculo de par y balance de potencia virtuales.",
    "procedure": [
      "Revisa relación, condiciones de rozamiento y requisito de par.",
      "Prueba un ajuste y observa el balance de potencia.",
      "Registra la condición de retroceso y sus límites de aplicación."
    ],
    "quiz": "¿Qué compromiso puede introducir más rozamiento?",
    "answers": [
      "Favorecer la retención ideal y aumentar las pérdidas.",
      "Aumentar siempre la eficiencia hasta100 %.",
      "Eliminar la necesidad de verificar un freno de seguridad.",
      "Crear par sin potencia de entrada."
    ],
    "faults": [
      [
        "Retroceso posible",
        "El rendimiento es alto, pero el ángulo de fricción queda por debajo del de hélice.",
        "No se cumple la condición ideal de autobloqueo."
      ],
      [
        "Pérdidas elevadas",
        "El accionamiento retiene en el modelo, pero disipa demasiada potencia.",
        "Más rozamiento consume una fracción mayor de la potencia."
      ],
      [
        "Par insuficiente",
        "La condición de retención se cumple, pero la carga pide más par útil.",
        "Debe revisarse el par de motor después de descontar las pérdidas."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Verifica un motorreductor que debe entregar par suficiente y comprueba cómo el rozamiento afecta su reversibilidad.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "El rozamiento reduce la eficiencia y puede impedir el retroceso ideal. Esa retención no sustituye una función de seguridad certificada.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 183,
    "slug": "dimensionado-reductor-cicloidal",
    "title": "Reductor cicloidal",
    "longTitle": "Dimensionado de un reductor cicloidal: excentricidad, carga y velocidad",
    "intro": "Dimensiona un reductor de una articulación comprobando velocidad de salida y exigencia sobre el apoyo excéntrico.",
    "explore": "El disco gira despacio mientras su centro orbita. Una excentricidad pequeña exige más fuerza para transmitir el mismo par.",
    "controls": [
      {
        "id": "rpm",
        "label": "Giro de entrada",
        "min": 30,
        "max": 180,
        "step": 5,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "eccentric",
        "label": "Excentricidad",
        "min": 1,
        "max": 3.5,
        "step": 0.1,
        "unit": "mm",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Giro de salida",
        "key": "outputRpm",
        "unit": "rpm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Fuerza ideal en excéntrica",
        "key": "bearingForce",
        "unit": "N",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Aceleración orbital",
        "key": "acc",
        "unit": "m/s²",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Par útil nominal",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Obtén8–12 rpm de salida, fuerza excéntrica ≤6000 N y aceleración orbital ≤0,35 m/s².",
    "caption": "Cámara lenta ×1/15 ·11 rodillos y10 lóbulos · transmisión ideal",
    "timeScale": 0.06666666666666667,
    "signals": "fase de órbita / fase de salida, como senos normalizados",
    "labels": "Excéntrica · disco cicloidal · rodillos fijos · pasadores de salida · carcasa",
    "equations": "11 rodillos y10 lóbulos: ωsalida=−ωentrada/10. Entrada8 N·m, η=0,9: salida72 N·m. Exigencia ideal equivalente F=Tentrada/e; aceleración orbital eω². El perfil se deriva como envolvente desplazada de Q(u)=[Rcosu−ecos11u,Rsin u−esin11u], R=0,10 m, rodillo8 mm; P=Q−r n, con n normal unitaria exterior. Centro del disco e[cosθ,sinθ] y orientación−θ/10.",
    "limits": "Sólo geometría ideal y estimación equivalente de carga de entrada. F=T/e no es cálculo de reparto entre rodillos ni vida del rodamiento. Sin elasticidad, lubricación, holgura, carga dinámica del portador, desgaste o perfil comercial. Los pasadores de salida son estructurales; no se resuelve contacto en sus alojamientos.",
    "source": "https://emeia.sumitomodrive.com/en-gb/cycloidal-gear-technology",
    "sourceName": "Sumitomo Drive Technologies, principio cicloidal",
    "job": "OT-183 · Un eje de robot necesita entre8 y12 rpm. Debes elegir entrada y excentricidad sin rebasar las exigencias equivalentes del apoyo.",
    "tools": "Tacómetros de entrada/salida y registro de fuerza y aceleración equivalentes.",
    "procedure": [
      "Identifica el movimiento orbital y el giro reducido.",
      "Prueba combinaciones de giro y excentricidad.",
      "Registra el ajuste y explica qué datos de catálogo faltarían para seleccionar el apoyo real."
    ],
    "quiz": "¿Por qué una excentricidad muy pequeña puede exigir más al apoyo?",
    "answers": [
      "Porque para el mismo par se necesita más fuerza en un brazo menor.",
      "Porque la relación de transmisión se vuelve cero.",
      "Porque desaparece la órbita sin cambiar el par.",
      "Porque el rendimiento crea una fuerza infinita útil."
    ],
    "faults": [
      [
        "Excentricidad pequeña",
        "El giro es adecuado, pero la estimación de fuerza supera el límite.",
        "El brazo equivalente de transmisión es demasiado pequeño."
      ],
      [
        "Entrada demasiado rápida",
        "La salida excede el giro pedido y sube mucho la aceleración orbital.",
        "La aceleración depende del cuadrado de la velocidad de entrada."
      ],
      [
        "Órbita demasiado exigente",
        "La fuerza baja al ampliar la excéntrica, pero la aceleración rebasa la meta.",
        "Aumentar el brazo tiene un compromiso dinámico."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Dimensiona un reductor de una articulación comprobando velocidad de salida y exigencia sobre el apoyo excéntrico.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "El disco gira despacio mientras su centro orbita. Una excentricidad pequeña exige más fuerza para transmitir el mismo par.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 184,
    "slug": "ensayo-embrague-centrifugo",
    "title": "Ensayo de embrague centrífugo",
    "longTitle": "Ensayo de un embrague centrífugo: ralentí, acoplamiento y calor",
    "intro": "Ajusta un embrague para que no arrastre al ralentí y pueda acelerar una carga sin calentarse demasiado.",
    "explore": "La fuerza centrífuga empuja las zapatas; los resortes las retienen. Cuando hay deslizamiento se transforma energía en calor.",
    "controls": [
      {
        "id": "rpm",
        "label": "Régimen de arranque",
        "min": 1500,
        "max": 6000,
        "step": 50,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "spring",
        "label": "Retención por zapata",
        "min": 20,
        "max": 150,
        "step": 1,
        "unit": "N",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Capacidad de par",
        "key": "capacity",
        "unit": "N·m",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Tiempo de acoplamiento",
        "key": "sync",
        "unit": "s",
        "scale": 1,
        "decimals": 2,
        "empty": "Sin acoplar"
      },
      {
        "label": "Calor acumulado",
        "key": "heat",
        "unit": "kJ",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Par al ralentí",
        "key": "idle",
        "unit": "N·m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Trabaja a≥2800 rpm, acopla en≤2 s, calor≤6500 J y arrastre al ralentí≤0,5 N·m.",
    "caption": "Giro estroboscópico ×1/80 · arranque en tiempo real · ensayo reiniciado cada4 s",
    "timeScale": 1,
    "signals": "velocidad de tambor / entrada y calor dividido por6500 J",
    "labels": "Cubo · zapatas · forros · resortes · tambor · eje",
    "equations": "Tres zapatas: N=max(0,mrω²−Fs), m=0,12 kg y r=45 mm. Tcap=3μRN, μ=0,32, R=60 mm. Entrada a giro constante; carga8 N·m e inercia de tambor0,08 kg·m². Si Tcap>8: α=(Tcap−8)/J y ts=Jω/(Tcap−8). El deslizamiento termina al igualar velocidades. Calor=∫Tcap(ωentrada−ωtambor)dt. Ralentí de referencia1200 rpm. Se comprueba balance de trabajo, energía cinética, carga y calor.",
    "limits": "Fricción y normal constantes durante cada arranque, sin recorrido real de zapata, elasticidad, variación de μ con temperatura, desgaste ni refrigeración. El paso de fuerza a contacto es idealizado. Cada4 s se reinicia un arranque independiente; no es frenado físico de la carga. El régimen está impuesto y no incluye dinámica del motor.",
    "source": "https://www.hilliardcorp.com/products/drivetrain/extreme-duty-clutches/",
    "sourceName": "Hilliard, acoplamiento centrífugo",
    "job": "OT-184 · Revisa un accionamiento de máquina ligera que arrastra al ralentí. Debes ajustar la retención y comprobar el arranque contra la carga de prueba.",
    "tools": "Tacómetros, traza de deslizamiento y balance térmico virtuales.",
    "procedure": [
      "Mide el arrastre previsto a1200 rpm.",
      "Ajusta retención y régimen; ejecuta un arranque de prueba.",
      "Documenta tiempo, calor y condición de ralentí antes de aceptar el ajuste."
    ],
    "quiz": "¿Cuándo se genera calor de fricción en este ensayo?",
    "answers": [
      "Mientras existe diferencia de velocidad y se transmite par por deslizamiento.",
      "Sólo cuando ambos lados giran exactamente iguales.",
      "Únicamente al apagar el tacómetro.",
      "Nunca, porque la fuerza es centrífuga."
    ],
    "faults": [
      [
        "Retención insuficiente",
        "Al ralentí ya aparece capacidad de arrastre.",
        "Los resortes no compensan suficiente fuerza centrífuga a ese giro."
      ],
      [
        "Sin reserva de acoplamiento",
        "La capacidad de par apenas supera la carga y el arranque dura demasiado.",
        "La diferencia entre par disponible y resistente fija la aceleración."
      ],
      [
        "Arranque energético excesivo",
        "Acopla rápido, pero el calor del ensayo supera la meta.",
        "Reducir tiempo de deslizamiento no garantiza poca energía disipada a un régimen alto."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Autotrónica",
    "area": "AUTOMOVILIDAD",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Ajusta un embrague para que no arrastre al ralentí y pueda acelerar una carga sin calentarse demasiado.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "La fuerza centrífuga empuja las zapatas; los resortes las retienen. Cuando hay deslizamiento se transforma energía en calor.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 185,
    "slug": "calibracion-bomba-peristaltica",
    "title": "Dosificación peristáltica",
    "longTitle": "Calibración de una bomba peristáltica: caudal, presión y esfuerzo del fluido",
    "intro": "Ajusta una dosificadora para entregar el caudal pedido sin exigir demasiada presión ni esfuerzo de pared.",
    "explore": "Los rodillos desplazan el contenido de una manguera. Su diámetro cambia mucho el volumen por vuelta y la resistencia del circuito.",
    "controls": [
      {
        "id": "diameter",
        "label": "Diámetro interior del tubo",
        "min": 2,
        "max": 6,
        "step": 0.1,
        "unit": "mm",
        "decimals": 1
      },
      {
        "id": "rpm",
        "label": "Giro de la bomba",
        "min": 10,
        "max": 100,
        "step": 1,
        "unit": "rpm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Caudal (mL/min)",
        "key": "flow",
        "unit": "",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Presión del circuito",
        "key": "pressure",
        "unit": "kPa",
        "scale": 0.001,
        "decimals": 1
      },
      {
        "label": "Esfuerzo en pared",
        "key": "shear",
        "unit": "Pa",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Potencia al fluido",
        "key": "fluidPower",
        "unit": "W",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Dosifica40–60 mL/min con presión≤60 kPa y esfuerzo de pared≤25 Pa.",
    "caption": "Tiempo real · desplazamiento positivo y caudal medio · deformación impuesta del tubo",
    "timeScale": 1,
    "signals": "caudal dividido por60 mL/min / presión dividida por60 kPa",
    "labels": "Rotor · rodillos · manguera · entrada · salida · pista",
    "equations": "Radio de pista40 mm, área interior A=πd²/4, volumen ideal por vuelta A2πR. Caudal medio Q=0,85 Vrev n/60. Circuito equivalente laminar de2 m y viscosidad0,08 Pa·s: Δp=128μLQ/(πd⁴), esfuerzo de pared32μQ/(πd³). Par ideal de bombeo ΔpVrev/(2πηm), ηm=0,8. La ganancia volumétrica0,85 es sintética; un aforo real debe medirla. Los rodillos se muestran como oclusiones geométricas, no como un modelo de pared de goma.",
    "limits": "Sin pulsación instantánea de caudal, reología no newtoniana, deformación elástica, retorno de líquido, fatiga de tubo, presión de oclusión ni control real de dosificación. Hagen–Poiseuille sólo representa el circuito equivalente, no el paso por el cabezal aplastado. Los puntos de fluido señalan bolsillos arrastrados; no son CFD ni medición volumétrica.",
    "source": "https://www.wmfts.com/en-au/support/pump-principles/how-do-peristaltic-pumps-work/",
    "sourceName": "Watson-Marlow, principio de bombeo peristáltico",
    "job": "OT-185 · Una dosificadora debe entregar entre40 y60 mL/min a un circuito viscoso. Selecciona tubo y giro, comprueba el punto de operación y registra el ajuste.",
    "tools": "Caudalímetro, manómetro y registro virtual de dosificación.",
    "procedure": [
      "Lee viscosidad, longitud y caudal requeridos.",
      "Ajusta tubo y giro; ejecuta una vuelta de prueba.",
      "Registra el caudal y los límites; explica por qué un equipo real requiere aforo."
    ],
    "quiz": "¿Por qué hay que repetir el aforo al cambiar el tubo?",
    "answers": [
      "Porque el área interior modifica el volumen por vuelta y el caudal.",
      "Porque el giro deja de afectar a cualquier bomba.",
      "Porque la viscosidad siempre se vuelve cero.",
      "Porque la presión se mantiene idéntica para todos los diámetros."
    ],
    "faults": [
      [
        "Tubo muy estrecho",
        "El caudal puede alcanzarse, pero la presión del circuito resulta demasiado alta.",
        "La resistencia laminar depende fuertemente de d elevado a la cuarta potencia."
      ],
      [
        "Dosificación alta",
        "El circuito admite la presión, pero el volumen por minuto supera la orden.",
        "Debe reducirse giro o área interior efectiva."
      ],
      [
        "Aforo no actualizado",
        "Tras sustituir la manguera, se conserva una calibración anterior sin comprobar volumen.",
        "La geometría y el estado del tubo afectan al caudal real."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Ajusta una dosificadora para entregar el caudal pedido sin exigir demasiada presión ni esfuerzo de pared.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "Los rodillos desplazan el contenido de una manguera. Su diámetro cambia mucho el volumen por vuelta y la resistencia del circuito.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 186,
    "slug": "preparacion-fresado-cnc",
    "title": "Preparación de fresado CNC",
    "longTitle": "Preparación de fresado CNC: avance por diente, potencia y arranque de material",
    "intro": "Prepara una pasada de fresado eligiendo avance y giro que produzcan viruta útil dentro de los límites de la máquina.",
    "explore": "Subir el avance aumenta el material retirado y la potencia. El giro reparte ese avance entre los dientes y cambia la carga de cada filo.",
    "controls": [
      {
        "id": "feed",
        "label": "Avance de la mesa",
        "min": 200,
        "max": 1500,
        "step": 10,
        "unit": "mm/min",
        "decimals": 0
      },
      {
        "id": "rpm",
        "label": "Giro del husillo",
        "min": 2000,
        "max": 10000,
        "step": 100,
        "unit": "rpm",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Avance por diente",
        "key": "chip",
        "unit": "mm/d",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Arranque (cm³/min)",
        "key": "MRR",
        "unit": "",
        "scale": 0.001,
        "decimals": 2
      },
      {
        "label": "Potencia neta de corte",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 0
      },
      {
        "label": "Par de corte",
        "key": "torque",
        "unit": "N·m",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Retira≥6000 mm³/min, con0,02–0,05 mm/diente, potencia≤250 W y par≤0,45 N·m.",
    "caption": "Avance en tiempo real · husillo ×1/600 · pasada circular ideal y reinicio por vuelta",
    "timeScale": 1,
    "signals": "coordenadas normalizadas de la trayectoria circular",
    "labels": "Pórtico · carro · husillo · pinza portaherramienta · fresa · pieza",
    "equations": "Fresa de10 mm y4 dientes; avance por diente fz=vf/(nz). Profundidad2 mm y anchura equivalente4 mm: Q=8vf mm³/min. Energía específica sintética1,8 J/mm³: Pc=1,8Q/60 y Mc=Pc/ω. Trayectoria circular de radio25 mm: φ=vf t/R en SI. Para conservar el volumen por arco, el sector de sobremetal tiene radio exterior30 mm e interior√(30²−2·4·25)=26,458 mm. El sector eliminado muestra el progreso angular, no una intersección CSG exacta del filo.",
    "limits": "Corte estacionario ideal y energía específica constante, no datos de un material comercial. Sin vibración de chatter, flexión, desgaste, temperatura, sujeción real, colisiones, refrigerante o G-code de un control comercial. Cada vuelta es una pasada independiente con pieza reiniciada. El husillo se muestra estroboscópico; no es el giro físico aparente de una cámara real.",
    "source": "https://www.sandvik.coromant.com/en-gb/knowledge/machining-formulas-definitions/milling-formulas-definitions?newsarchivetagfilter=Turning",
    "sourceName": "Sandvik Coromant, fórmulas y definiciones de fresado",
    "job": "OT-186 · Prepara una pasada circular de2 mm con una fresa de4 dientes. La máquina admite250 W netos y0,45 N·m; justifica avance, viruta y producción.",
    "tools": "Panel de avance/husillo, registro de potencia y verificación de trayectoria virtuales.",
    "procedure": [
      "Lee dimensiones, filos y límites del equipo de ensayo.",
      "Ajusta avance y giro; ejecuta una vuelta de la pasada.",
      "Verifica arranque, avance por diente y par; entrega el informe del ajuste."
    ],
    "quiz": "¿Qué ocurre si subes el avance sin cambiar el giro ni los dientes?",
    "answers": [
      "Aumentan el avance por diente y la tasa de arranque.",
      "Disminuye siempre la carga por filo.",
      "La potencia no puede cambiar.",
      "La profundidad de pasada se vuelve automáticamente cero."
    ],
    "faults": [
      [
        "Viruta excesiva",
        "El arranque es alto, pero cada diente recibe más avance que el admitido.",
        "Debe combinarse avance con giro y número de filos."
      ],
      [
        "Potencia o par rebasados",
        "La trayectoria cabe, pero el punto de corte supera la capacidad del accionamiento.",
        "La selección debe respetar potencia y par, no sólo producción."
      ],
      [
        "Producción baja",
        "La viruta está dentro de límites, pero se retira poco material por minuto.",
        "Hace falta aumentar el avance dentro de la ventana de corte."
      ]
    ],
    "eyebrow": "Orden de trabajo · entorno técnico",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee el encargo del taller",
        "text": "Prepara una pasada de fresado eligiendo avance y giro que produzcan viruta útil dentro de los límites de la máquina.",
        "view": "assembly"
      },
      {
        "title": "Relaciona equipo e instrumentos",
        "text": "Subir el avance aumenta el material retirado y la potencia. El giro reparte ese avance entre los dientes y cambia la carga de cada filo.",
        "view": "assembly"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Abre la orden de trabajo, ajusta el equipo y completa un ensayo. Después valida los criterios y conserva el informe.",
        "view": "assembly"
      }
    ]
  }
];
