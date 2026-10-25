export const definitions=[
  {
    "id": 201,
    "slug": "ensayo-modal-martillo",
    "title": "Ensayo modal con martillo instrumentado",
    "longTitle": "Ensayo modal con martillo instrumentado",
    "intro": "Ajusta un útil flexible para alejar su resonancia del régimen de servicio y amortiguar el golpe de una herramienta.",
    "explore": "El martillo excita el útil y el acelerómetro registra su respuesta. Masa y amortiguamiento cambian el pico y la caída de la vibración.",
    "controls": [
      {
        "id": "mass",
        "label": "Masa equivalente del útil",
        "min": 8,
        "max": 18,
        "step": 0.1,
        "unit": "kg",
        "decimals": 1
      },
      {
        "id": "damping",
        "label": "Amortiguamiento del apoyo",
        "min": 20,
        "max": 600,
        "step": 5,
        "unit": "N·s/m",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Frecuencia natural",
        "key": "fn",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Amortiguamiento relativo",
        "key": "zeta",
        "unit": "",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Envolvente al 5 %",
        "key": "settle",
        "unit": "s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Respuesta prevista a 30 Hz",
        "key": "serviceAmplitude",
        "unit": "mm",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Configura frecuencia natural ≤22 Hz, respuesta a 30 Hz ≤0,4 mm, caída de envolvente al 5 % ≤0,6 s y amortiguamiento 0,08–0,20.",
    "equations": "Modelo equivalente de un grado de libertad: m x″+c x′+k x=Jδ(t), k=200 kN/m, J=4 N·s. x=J/(mωd)e^(−ct/2m)sin(ωdt). H(f)=1/(k−mω²+icω). La envolvente cae al 5 % en ln(20)/(c/2m); servicio con fuerza sinusoidal 100 N a 30 Hz.",
    "limits": "Impulso ideal y sistema lineal, sin identificación con ruido ni coherencia experimental. La forma de la viga es una deformada estática normalizada, no un modelo modal FEM. Se repite un impacto independiente cada 2 s. Deflexión visual ampliada 30 veces.",
    "source": "https://manual.dewesoft.com/x/setupmodule/modules/structural-dynamics/transferfunction",
    "sourceName": "Documentación técnica del principio",
    "tools": "Martillo, acelerómetro, traza de caída y función de respuesta en frecuencia.",
    "job": "OT-201 · Configura frecuencia natural ≤22 Hz, respuesta a 30 Hz ≤0,4 mm, caída de envolvente al 5 % ≤0,6 s y amortiguamiento 0,08–0,20.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Qué información aporta una FRF además de observar que algo vibra?",
    "answers": [
      "Cómo cambia la respuesta por unidad de fuerza según la frecuencia.",
      "Sólo el valor máximo del golpe, sin información del útil.",
      "El número exacto de grietas de cualquier estructura.",
      "La masa de cualquier pieza sin una referencia mecánica."
    ],
    "faults": [
      [
        "Poco amortiguamiento",
        "La respuesta tarda en extinguirse después del impacto.",
        "La envolvente depende de c/(2m)."
      ],
      [
        "Modo cercano al servicio",
        "El útil responde demasiado a la frecuencia de trabajo.",
        "La receptancia crece cerca del modo natural."
      ],
      [
        "Masa sin comprobar",
        "Se añade masa, pero no se revisa la respuesta completa.",
        "También deben comprobarse amortiguamiento y amplitud de servicio."
      ]
    ],
    "labels": "Martillo · acelerómetro · útil · masa · amortiguador",
    "caption": "Impactos independientes cada 2 s · deformación×30 · modelo equivalente",
    "timeScale": 1,
    "testSeconds": 3,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Ajusta un útil flexible para alejar su resonancia del régimen de servicio y amortiguar el golpe de una herramienta.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "El martillo excita el útil y el acelerómetro registra su respuesta. Masa y amortiguamiento cambian el pico y la caída de la vibración.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 202,
    "slug": "reflectometria-cable-tdr",
    "title": "Reflectometría TDR de un cable",
    "longTitle": "Reflectometría TDR de un cable",
    "intro": "Configura un reflectómetro para separar dos discontinuidades próximas y reducir la reflexión del extremo del cable.",
    "explore": "Un pulso recorre el cable y vuelve desde cada discontinuidad. Un pulso ancho mezcla detalles; uno demasiado corto exige más banda.",
    "controls": [
      {
        "id": "pulse",
        "label": "Anchura del pulso FWHM",
        "min": 2,
        "max": 20,
        "step": 0.1,
        "unit": "ns",
        "decimals": 1
      },
      {
        "id": "termination",
        "label": "Terminación del cable",
        "min": 50,
        "max": 160,
        "step": 1,
        "unit": "Ω",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Resolución espacial",
        "key": "resolution",
        "unit": "m",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Banda de la señal",
        "key": "bandwidth",
        "unit": "MHz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Reflexión del extremo",
        "key": "gamma",
        "unit": "",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Posición del pulso indicativo",
        "key": "x",
        "unit": "m",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Resuelve ≤0,6 m, requiere ≤80 MHz y deja el valor absoluto de la reflexión final ≤0,05.",
    "equations": "Cable 18 m, Z0=100 Ω, velocidad 0,66c. Γ=(R−Z0)/(R+Z0). Ecos sintéticos de primer orden en 6 y 7 m. Pulso gaussiano g(t)=exp[−4 ln 2(t/τ)²], τ=FWHM. Ancho de banda a−3 dB=√2 ln 2/(πτ). Resolución espacial del escenario=vτ/2, por la ida y vuelta.",
    "limits": "Superposición de ecos débiles sin atenuación distribuida, dispersión, reflexiones múltiples ni conectores reales. La resolución es una anchura espacialFWHM, no especificación de un equipo comercial. El punto luminoso indica el viaje de la onda, no luz real dentro del cable.",
    "source": "https://download.tek.com/document/Understanding-Applying-TDR-Primer_48W-74128-0.pdf",
    "sourceName": "Documentación técnica del principio",
    "tools": "Reflectómetro, generador gaussiano, terminador y cable seccionado.",
    "job": "OT-202 · Resuelve ≤0,6 m, requiere ≤80 MHz y deja el valor absoluto de la reflexión final ≤0,05.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Por qué se divide por dos el recorrido obtenido del tiempo de eco?",
    "answers": [
      "Porque la onda recorre ida y vuelta hasta la discontinuidad.",
      "Porque todos los cables propagan exactamente a la mitad de c.",
      "Porque la resistencia final divide siempre la distancia.",
      "Porque el ancho de banda no afecta a una medida TDR."
    ],
    "faults": [
      [
        "Pulso demasiado ancho",
        "Dos ecos próximos se confunden.",
        "La anchura temporal se convierte en anchura espacial."
      ],
      [
        "Banda insuficiente",
        "La señal pedida excede la banda del instrumento.",
        "Acortar el pulso exige más ancho de banda."
      ],
      [
        "Extremo desadaptado",
        "Aparece un eco fuerte al final del cable.",
        "La terminación no coincide con la impedancia característica."
      ]
    ],
    "labels": "Conductor · dieléctrico · blindaje · terminador · reflectómetro",
    "caption": "Propagación×1/10000000 · ecos de primer orden · pulso indicativo",
    "timeScale": 1,
    "testSeconds": 3,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Autotrónica",
    "area": "AUTOTRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Configura un reflectómetro para separar dos discontinuidades próximas y reducir la reflexión del extremo del cable.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "Un pulso recorre el cable y vuelve desde cada discontinuidad. Un pulso ancho mezcla detalles; uno demasiado corto exige más banda.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 203,
    "slug": "montaje-robotizado-compliance",
    "title": "Montaje robotizado con compensación RCC",
    "longTitle": "Montaje robotizado con compensación RCC",
    "intro": "Prepara una inserción robotizada para que la herramienta compense el error lateral sin exigir una fuerza excesiva.",
    "explore": "El chaflán convierte parte de la fuerza axial en corrección lateral. Una muñeca demasiado rígida puede atascarse.",
    "controls": [
      {
        "id": "stiffness",
        "label": "Rigidez lateral de la muñeca",
        "min": 20,
        "max": 100,
        "step": 1,
        "unit": "N/mm",
        "decimals": 0
      },
      {
        "id": "force",
        "label": "Fuerza axial disponible",
        "min": 10,
        "max": 80,
        "step": 1,
        "unit": "N",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Residual lateral final",
        "key": "finalResidual",
        "unit": "mm",
        "scale": 1000,
        "decimals": 3
      },
      {
        "label": "Reserva lateral",
        "key": "Fcap",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Flecha por carga de referencia",
        "key": "sag",
        "unit": "mm",
        "scale": 1000,
        "decimals": 3
      },
      {
        "label": "Profundidad alcanzada",
        "key": "depth",
        "unit": "mm",
        "scale": 1000,
        "decimals": 1
      }
    ],
    "task": "Inserta con residual ≤0,11 mm, fuerza axial ≤60 N, flecha por carga ≤0,1 mm y reserva lateral suficiente.",
    "equations": "Error lateral inicial 0,8 mm y holgura radial 0,1 mm. Corrección requerida 0,7 mm. Chaflán 45° y µ=0,15: fuerza lateral disponible=Fz(1−µ)/(1+µ). Muñeca lineal con rigidez k: corrección=min(0,7 mm,Flat/k). Carga de referencia 3 N: flecha=3/k.",
    "limits": "Modelo cuasiestático de corrección lateral, no simula inclinación, torsión, impacto, contacto distribuido ni todas las libertades de un RCC real. El movimiento de aproximación es una trayectoria impuesta; sólo inserta si hay reserva. No es un programa de robot comercial. Holgura, desalineación y chaflán se amplían en la representación; no es un plano de fabricación.",
    "source": "https://www.bl-autotec.co.jp/english/products/wrist-compliancer/",
    "sourceName": "Documentación técnica del principio",
    "tools": "Muñeca complaciente, chaflán, sensor de fuerza y útil de inserción.",
    "job": "OT-203 · Inserta con residual ≤0,11 mm, fuerza axial ≤60 N, flecha por carga ≤0,1 mm y reserva lateral suficiente.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Qué puede causar atasco aunque el robot repita bien su posición?",
    "answers": [
      "La falta de capacidad para acomodar pequeños errores de alineación.",
      "Que toda herramienta flexible sea siempre menos precisa y no pueda usarse.",
      "Que aumentar indefinidamente la fuerza elimine cualquier error.",
      "Que la holgura radial no influya en la inserción."
    ],
    "faults": [
      [
        "Muñeca demasiado rígida",
        "No hay fuerza lateral suficiente para completar la corrección.",
        "La demanda es k por desplazamiento requerido."
      ],
      [
        "Muñeca demasiado blanda",
        "Acomoda el montaje, pero se deforma mucho con la carga de referencia.",
        "Debe conservar rigidez útil además de flexibilidad."
      ],
      [
        "Fuerza excesiva",
        "La inserción funciona, pero excede la orden.",
        "Cumplir el movimiento no basta para aceptar la fuerza."
      ]
    ],
    "labels": "Muñeca · elementos flexibles · sensor de fuerza · espiga · alojamiento",
    "caption": "Ciclo cuasiestático de 4 s · corrección lateral ampliada×100",
    "timeScale": 1,
    "testSeconds": 4,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Prepara una inserción robotizada para que la herramienta compense el error lateral sin exigir una fuerza excesiva.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "El chaflán convierte parte de la fuerza axial en corrección lateral. Una muñeca demasiado rígida puede atascarse.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 204,
    "slug": "metrologia-cmm-palpador",
    "title": "CMM: palpador y compensación térmica",
    "longTitle": "CMM: palpador y compensación térmica",
    "intro": "Prepara una medición por coordenadas con dos patrones antes de inspeccionar una pieza de aluminio.",
    "explore": "El centro de la bola no toca la superficie. Además, una pieza caliente cambia de longitud y debe referirse a 20 °C.",
    "controls": [
      {
        "id": "radius",
        "label": "Radio efectivo compensado",
        "min": 2,
        "max": 4,
        "step": 0.001,
        "unit": "mm",
        "decimals": 3
      },
      {
        "id": "temperature",
        "label": "Temperatura de compensación",
        "min": 15,
        "max": 35,
        "step": 0.1,
        "unit": "°C",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Patrón 100 mm: error",
        "key": "error100",
        "unit": "mm",
        "scale": 1,
        "decimals": 4
      },
      {
        "label": "Patrón 200 mm: error",
        "key": "error200",
        "unit": "mm",
        "scale": 1,
        "decimals": 4
      },
      {
        "label": "Longitud 100 corregida",
        "key": "read100",
        "unit": "mm",
        "scale": 1,
        "decimals": 4
      },
      {
        "label": "Longitud 200 corregida",
        "key": "read200",
        "unit": "mm",
        "scale": 1,
        "decimals": 4
      }
    ],
    "task": "Deja los patrones de 100 y 200 mm dentro de±0,005 mm. La sonda térmica del banco indica 30 °C.",
    "equations": "Aluminio del escenario: α=23 µm/(m·K). Lecturas entre centros 106,023 y 206,046 mm. L20=(Lcentros−2Rconfig)/(1+α(Tconfig−20)). Los patrones certificados son 100 y 200 mm a 20 °C; dos longitudes permiten distinguir compensación de radio y expansión.",
    "limits": "Contactos exteriores ideales en una dimensión, sin pretravel direccional, flexión, incertidumbre volumétrica ni software de un fabricante. La CMM ilustra el recorrido, no un ensayo normativo completo. Los datos son sintéticos.",
    "source": "https://wap.renishaw.com/cmmsupport/knowledgebase/en/probe-operation--15811",
    "sourceName": "Documentación técnica del principio",
    "tools": "CMM, bola de rubí, patrones y referencia de temperatura.",
    "job": "OT-204 · Deja los patrones de 100 y 200 mm dentro de±0,005 mm. La sonda térmica del banco indica 30 °C.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Por qué se compensa el radio de la bola del palpador?",
    "answers": [
      "Porque la máquina mide la posición del centro y debe inferir la superficie tocada.",
      "Porque el radio desaparece cuando se usa una CMM.",
      "Porque toda lectura debe aumentar exactamente dos radios sin importar el contacto.",
      "Porque sustituye la corrección de temperatura en cualquier pieza."
    ],
    "faults": [
      [
        "Radio incorrecto",
        "Los dos patrones tienen un error común importante.",
        "La compensación del centro a superficie está mal ajustada."
      ],
      [
        "Temperatura incorrecta",
        "El error cambia con la longitud del patrón.",
        "La expansión es proporcional a la longitud."
      ],
      [
        "Calificación no vigente",
        "Se cambia el palpador sin repetir la comprobación.",
        "El radio efectivo y el sistema de palpado deben verificarse de nuevo."
      ]
    ],
    "labels": "Puente · carro · palpador · bola de rubí · patrones · pieza",
    "caption": "Recorrido ideal de palpado · referencia dimensional a 20 °C",
    "timeScale": 1,
    "testSeconds": 12,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Prepara una medición por coordenadas con dos patrones antes de inspeccionar una pieza de aluminio.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "El centro de la bola no toca la superficie. Además, una pieza caliente cambia de longitud y debe referirse a 20 °C.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ],
    "referenceAfterValidation": "Referencia del banco validado: radio efectivo real3,000 mm; pieza a30,0 °C."
  },
  {
    "id": 205,
    "slug": "cortina-optica-parada-prensa",
    "title": "Cortina óptica y parada de una prensa",
    "longTitle": "Cortina óptica y parada de una prensa",
    "intro": "Relaciona la distancia de una barrera óptica con el tiempo de parada de una máquina virtual.",
    "explore": "Interrumpir el haz no detiene de inmediato la inercia. El controlador y el freno consumen tiempo antes de que cese el movimiento.",
    "controls": [
      {
        "id": "distance",
        "label": "Distancia de la barrera",
        "min": 300,
        "max": 1100,
        "step": 5,
        "unit": "mm",
        "decimals": 0
      },
      {
        "id": "torque",
        "label": "Par de frenado",
        "min": 200,
        "max": 900,
        "step": 10,
        "unit": "N·m",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Respuesta total",
        "key": "total",
        "unit": "s",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Distancia del modelo",
        "key": "required",
        "unit": "mm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Reserva disponible",
        "key": "reserve",
        "unit": "mm",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Deceleración",
        "key": "acceleration",
        "unit": "rad/s²",
        "scale": 1,
        "decimals": 1
      }
    ],
    "task": "Obtén reserva ≥100 mm, ocupación ≤800 mm, deceleración ≤80 rad/s² y respuesta total ≤0,25 s.",
    "equations": "Banco ideal con inercia 10 kg·m² a 8 rad/s. Par constante: tstop=Jω/Tb. Respuesta electrónica fija 50 ms. Criterio conservador del escenario S=2000 mm/s·(0,05+tstop)+120 mm, sin reducción de la velocidad de aproximación. Reserva=distancia−S. Energía inicial 320 J.",
    "limits": "Ejemplo didáctico inspirado en la relaciónS=KT+C; NO aplica una evaluación completa deISO 13855 ni certifica distancias,PL oSIL. Sin acceso por arriba/abajo, rebote, dispersión del tiempo, fallo de sensores o circuito de seguridad real. No usar el informe para instalar una protección.",
    "source": "https://www.sick.com/media/docs/6/46/746/operating_instructions_sense2_safety_light_curtain_en_im0103746.pdf",
    "sourceName": "Documentación técnica del principio",
    "tools": "Barrera óptica, registro de respuesta, freno y cuerpo de prueba.",
    "job": "OT-205 · Obtén reserva ≥100 mm, ocupación ≤800 mm, deceleración ≤80 rad/s² y respuesta total ≤0,25 s.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Qué debe incluirse al estimar la distancia de una protección?",
    "answers": [
      "El tiempo total de detección, control y parada, además del margen geométrico.",
      "Sólo el tiempo de respuesta del sensor óptico.",
      "Sólo la distancia que cabe físicamente en el taller.",
      "Únicamente el régimen del motor, sin considerar la inercia."
    ],
    "faults": [
      [
        "Barrera próxima",
        "La reserva resulta insuficiente aunque el sensor responda.",
        "La máquina sigue moviéndose durante la respuesta total."
      ],
      [
        "Freno insuficiente",
        "La parada tarda demasiado para la orden.",
        "La inercia necesita par para reducir su velocidad."
      ],
      [
        "Deceleración excesiva",
        "Se gana tiempo, pero la solicitación supera el límite del banco.",
        "El ajuste debe cumplir la carga mecánica además de la distancia."
      ]
    ],
    "labels": "Prensa · volante · freno · emisor · receptor · cuerpo de prueba",
    "caption": "Respuesta en tiempo real · criterio didáctico conservador · ciclo de 3 s",
    "timeScale": 1,
    "testSeconds": 3,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Relaciona la distancia de una barrera óptica con el tiempo de parada de una máquina virtual.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "Interrumpir el haz no detiene de inmediato la inercia. El controlador y el freno consumen tiempo antes de que cese el movimiento.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 206,
    "slug": "analizador-calidad-energia",
    "title": "Calidad eléctrica: armónicos y filtrado",
    "longTitle": "Calidad eléctrica: armónicos y filtrado",
    "intro": "Dimensiona un filtrado virtual para mejorar una corriente distorsionada sin sobrecargar el filtro ni perder demasiada tensión.",
    "explore": "Un buen coseno de fase no garantiza buen factor de potencia. Los armónicos aumentan la corriente eficaz sin aportar la potencia fundamental.",
    "controls": [
      {
        "id": "inductance",
        "label": "Reactor por fase",
        "min": 0.5,
        "max": 4,
        "step": 0.1,
        "unit": "mH",
        "decimals": 1
      },
      {
        "id": "compensation",
        "label": "Compensación activa",
        "min": 0,
        "max": 90,
        "step": 1,
        "unit": "%",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "THD de corriente",
        "key": "THD",
        "unit": "%",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Factor de potencia total",
        "key": "pf",
        "unit": "",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Corriente del filtro",
        "key": "filterCurrent",
        "unit": "A",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Caída fundamental",
        "key": "drop",
        "unit": "V",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Consigue THD ≤15 %, factor de potencia ≥0,93, corriente del filtro ≤4 A y caída fundamental ≤15 V.",
    "equations": "Red sinusoidal 230 V fase-neutro,60 Hz; I1=20 A eficaces y cosφ=0,95. Órdenes 5,7,11:8,6,3 A antes de atenuación. Modelo de filtro |Hn|=2/√(2²+(nωL)²), compensación activa fraccionaria f. THD=√ΣIh²/I1; FP=cosφ/√(1+THD²). Caída fundamental=ωLI1.",
    "limits": "Carga de corriente sintética y filtrado ideal independiente por armónico; fundamental y cosφ impuestos. No resuelve un convertidor conmutado, resonancias de red, estabilidad o cumplimiento normativo. No es una selección de hardware real. Las flechas son indicadores del sentido de corriente en estroboscopio, no movimiento visible real de cargas.",
    "source": "https://ckm-content.se.com/ckmContent/sfc/servlet.shepherd/document/download/0691H00000FWbnlQAD",
    "sourceName": "Documentación técnica del principio",
    "tools": "Analizador trifásico, pinzas, reactor y filtro activo virtuales.",
    "job": "OT-206 · Consigue THD ≤15 %, factor de potencia ≥0,93, corriente del filtro ≤4 A y caída fundamental ≤15 V.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Por qué el factor de potencia puede ser menor que cosφ?",
    "answers": [
      "Porque la distorsión aumenta la corriente eficaz total.",
      "Porque cosφ y factor de potencia siempre son idénticos.",
      "Porque los armónicos eliminan la corriente fundamental.",
      "Porque sólo depende del número de fases."
    ],
    "faults": [
      [
        "Filtrado insuficiente",
        "La distorsión y la corriente eficaz siguen altas.",
        "Los armónicos residuales elevan la potencia aparente."
      ],
      [
        "Filtro sobrecargado",
        "Se pide compensar más corriente de la admitida.",
        "El filtro necesita capacidad de corriente."
      ],
      [
        "Reactor excesivo",
        "Mejora el filtrado, pero la caída fundamental supera la orden.",
        "La reactancia también afecta a la fundamental."
      ]
    ],
    "labels": "Reactor · devanados · bus de potencia · pinzas · filtro activo",
    "caption": "Red 60 Hz · indicadores eléctricos estroboscópicos×1/60",
    "timeScale": 1,
    "testSeconds": 3,
    "signals": "THD/100 / pérdida relativa de factor de potencia",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Máquinas Eléctricas",
    "area": "ELECTRICIDAD",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Dimensiona un filtrado virtual para mejorar una corriente distorsionada sin sobrecargar el filtro ni perder demasiada tensión.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "Un buen coseno de fase no garantiza buen factor de potencia. Los armónicos aumentan la corriente eficaz sin aportar la potencia fundamental.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 207,
    "slug": "separacion-centrifuga-proceso",
    "title": "Separación centrífuga: ajuste del proceso",
    "longTitle": "Separación centrífuga: ajuste del proceso",
    "intro": "Ajusta una separadora para que partículas pequeñas alcancen la pared antes de salir con el caudal.",
    "explore": "Más giro acelera la migración, pero aumenta esfuerzo y velocidad de la envolvente. Más caudal reduce el tiempo de residencia.",
    "controls": [
      {
        "id": "rpm",
        "label": "Régimen del rotor",
        "min": 1500,
        "max": 6000,
        "step": 50,
        "unit": "rpm",
        "decimals": 0
      },
      {
        "id": "flow",
        "label": "Caudal de alimentación",
        "min": 1,
        "max": 9,
        "step": 0.1,
        "unit": "L/min",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Tiempo de separación",
        "key": "separation",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Tiempo de residencia",
        "key": "residence",
        "unit": "s",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Esfuerzo del aro equivalente",
        "key": "stress",
        "unit": "MPa",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Velocidad periférica",
        "key": "speed",
        "unit": "m/s",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Entrega ≥3 L/min, separa en≤90 % de la residencia, con esfuerzo de aro ≤15 MPa y velocidad periférica ≤35 m/s.",
    "equations": "Stokes centrífugo: dr/dt=Kω²r, K=Δρd²/(18µ), Δρ=1000 kg/m³,d=5 µm,µ=1 mPa·s. Migración entre 20 y 80 mm: ts=ln(4)/(Kω²). Volumen útil 0,5 L, residencia=V/Q. Aro equivalente de acero a 100 mm: σ=ρω²r².",
    "limits": "Partículas aisladas a velocidad terminal, sin turbulencia, concentración, paredes, arrastre entre fases ni CFD. El esfuerzo es de un aro ideal, no del tazón real. Las posiciones angulares son estroboscópicas; la migración radial conserva el tiempo del modelo.",
    "source": "https://hotspin.se/om",
    "sourceName": "Documentación técnica del principio",
    "tools": "Tazón en corte, caudalímetro y trayectorias de partículas.",
    "job": "OT-207 · Entrega ≥3 L/min, separa en≤90 % de la residencia, con esfuerzo de aro ≤15 MPa y velocidad periférica ≤35 m/s.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Qué efecto tiene subir el caudal sin cambiar el régimen?",
    "answers": [
      "Reduce el tiempo disponible para que las partículas migren.",
      "Aumenta siempre la residencia dentro del mismo volumen.",
      "Hace desaparecer el esfuerzo de la envolvente.",
      "Cambia la densidad del material del rotor."
    ],
    "faults": [
      [
        "Residencia insuficiente",
        "La partícula no llega a la pared dentro del tiempo disponible.",
        "El caudal acortaV/Q."
      ],
      [
        "Régimen excesivo",
        "La separación cumple, pero se superan límites mecánicos.",
        "El esfuerzo crece con el cuadrado del giro."
      ],
      [
        "Modelo mal extrapolado",
        "Se aplica el resultado a una suspensión densa sin comprobarlo.",
        "Stokes aislado no incluye interacciones entre partículas."
      ]
    ],
    "labels": "Motor · tazón · eje · entrada · salidas · partículas",
    "caption": "Rotor estroboscópico×1/300 · migración radial real · sin CFD",
    "timeScale": 1,
    "testSeconds": 5,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Ajusta una separadora para que partículas pequeñas alcancen la pared antes de salir con el caudal.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "Más giro acelera la migración, pero aumenta esfuerzo y velocidad de la envolvente. Más caudal reduce el tiempo de residencia.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 208,
    "slug": "tension-correa-medidor-sonico",
    "title": "Tensión de correa con medidor sónico",
    "longTitle": "Tensión de correa con medidor sónico",
    "intro": "Comprueba la pretensión de una correa por su frecuencia y verifica después la capacidad de transmitir potencia.",
    "explore": "La lectura sónica se hace con la correa detenida. La misma tensión también condiciona la adherencia y la carga sobre los apoyos.",
    "controls": [
      {
        "id": "tension",
        "label": "Pretensión de cada ramal",
        "min": 100,
        "max": 700,
        "step": 5,
        "unit": "N",
        "decimals": 0
      },
      {
        "id": "power",
        "label": "Potencia de servicio",
        "min": 0.5,
        "max": 3,
        "step": 0.1,
        "unit": "kW",
        "decimals": 1
      }
    ],
    "metrics": [
      {
        "label": "Frecuencia del ramal detenido",
        "key": "frequency",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Tensión del lado flojo",
        "key": "slack",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Carga radial prevista",
        "key": "load",
        "unit": "N",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Relación de tensiones",
        "key": "ratio",
        "unit": "",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Ajusta 45–60 Hz, adherencia suficiente, carga radial ≤1000 N y potencia útil ≥1,8 kW.",
    "equations": "Ramal detenido L=0,45 m y masa lineal 0,15 kg/m: f=(1/2L)√(T/µ). Poleas iguales de 60 mm a 1500 rpm: v=ωr; ΔT=P/v, Tt=T+ΔT/2, Ts=T−ΔT/2. Adherencia: Tt/Ts≤exp(0,3π). Carga radial ideal 2T. Pulso 1 mJ: amplitud A=√(4EL/(π²T)).",
    "limits": "Correa plana ideal, sin rigidez a flexión, fuerza centrífuga, deslizamiento dinámico, dientes ni cálculo de vida. Primera etapa: medición detenida; segunda: operación ideal impuesta y comprobación de adherencia. No aplicar la fórmula de ramal detenido como medición en marcha. La amplitud dibujada se amplía 25 veces; el tiempo vibratorio se ralentiza 20 veces.",
    "source": "https://www.gates.com/content/dam/documents-library/operating-manuals/sonic-tension-meter-manual-emea.pdf",
    "sourceName": "Documentación técnica del principio",
    "tools": "Sensor sónico, poleas, apoyos y comprobación de carga.",
    "job": "OT-208 · Ajusta 45–60 Hz, adherencia suficiente, carga radial ≤1000 N y potencia útil ≥1,8 kW.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Cuándo corresponde medir la frecuencia usada para esta pretensión?",
    "answers": [
      "Con el accionamiento detenido y el ramal libre excitado con un pulso.",
      "Con las poleas girando a máxima velocidad, usando la misma fórmula sin corrección.",
      "Sólo después de forzar un patinamiento.",
      "Sin introducir la longitud ni la masa lineal del ramal."
    ],
    "faults": [
      [
        "Tensión baja",
        "La relación de tensiones requerida supera la adherencia.",
        "El lado flojo se queda sin reserva."
      ],
      [
        "Tensión alta",
        "La transmisión funciona, pero carga demasiado los apoyos.",
        "La carga radial aumenta con la pretensión."
      ],
      [
        "Medición en marcha",
        "La lectura se interpreta como si el ramal estuviera detenido.",
        "La velocidad de transporte cambia el problema vibratorio."
      ]
    ],
    "labels": "Poleas · ramal libre · retorno · apoyos · sensor sónico",
    "caption": "Etapas: medición detenida y operación · vibración×1/20 · giro×1/100",
    "timeScale": 1,
    "testSeconds": 6,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Comprueba la pretensión de una correa por su frecuencia y verifica después la capacidad de transmitir potencia.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "La lectura sónica se hace con la correa detenida. La misma tensión también condiciona la adherencia y la carga sobre los apoyos.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 209,
    "slug": "firma-electrica-motor-mcsa",
    "title": "Firma eléctrica de un motor bajo carga",
    "longTitle": "Firma eléctrica de un motor bajo carga",
    "intro": "Prepara un registro de corriente que permita distinguir bandas próximas a la fundamental sin sobrecargar el motor.",
    "explore": "La carga modifica el deslizamiento y la separación de bandas. Un registro corto puede mezclarlas con la fundamental.",
    "controls": [
      {
        "id": "load",
        "label": "Carga del ensayo",
        "min": 20,
        "max": 100,
        "step": 1,
        "unit": "%",
        "decimals": 0
      },
      {
        "id": "duration",
        "label": "Duración del registro",
        "min": 0.25,
        "max": 3,
        "step": 0.25,
        "unit": "s",
        "decimals": 2
      }
    ],
    "metrics": [
      {
        "label": "Separación prevista",
        "key": "spacing",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Resolución del registro",
        "key": "resolution",
        "unit": "Hz",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Fundamental eficaz",
        "key": "I1",
        "unit": "A",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Señal lateral prevista",
        "key": "sideband",
        "unit": "A",
        "scale": 1,
        "decimals": 3
      }
    ],
    "task": "Resuelve un tercio de la separación, registra señal lateral ≥0,4 A, corriente fundamental ≤11 A y carga ≥50 %.",
    "equations": "Señal sintética a 60 Hz: s=0,005+0,035·carga, I1=10(0,4+0,8·carga) A eficaces. Bandas en(1±2s)60 Hz, amplitud eficaz(0,02+0,06·carga)I1 y tercer armónico 0,1I1. Adquisición 2048 Hz, ventana Hann normalizada,FFT con relleno a potencia de dos. Resolución física 1/T.",
    "limits": "Patrón compatible con asimetría del rotor; no constituye diagnóstico definitivo. Otras perturbaciones pueden producir bandas similares. No simula transitorios eléctricos ni daño real. El indicador de la barra se revela sólo después de validar y responder la interpretación.",
    "source": "https://www.mathworks.com/help/predmaint/ug/broken-rotor-fault-detection-in-ac-induction-motors-using-vibration-and-electrical-signals.html",
    "sourceName": "Documentación técnica del principio",
    "tools": "Pinza de corriente, banco de carga y analizador FFT.",
    "job": "OT-209 · Resuelve un tercio de la separación, registra señal lateral ≥0,4 A, corriente fundamental ≤11 A y carga ≥50 %.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Qué conclusión prudente permite un par de bandas coherentes con el deslizamiento?",
    "answers": [
      "Es un indicio compatible con asimetría del rotor que debe contrastarse.",
      "Demuestra por sí solo la ubicación exacta de toda grieta.",
      "Prueba que la alimentación nunca tiene perturbaciones.",
      "Permite ignorar las condiciones de carga y de adquisición."
    ],
    "faults": [
      [
        "Registro corto",
        "Las bandas próximas no se distinguen bien.",
        "La duración limita la resolución física."
      ],
      [
        "Carga insuficiente",
        "La señal lateral es débil y próxima a la fundamental.",
        "La carga influye en deslizamiento y sensibilidad."
      ],
      [
        "Interpretación absoluta",
        "Se declara una falla definitiva con una sola firma.",
        "La interpretación requiere confirmación y otras evidencias."
      ]
    ],
    "labels": "Motor · rotor · acople · carga · pinza · analizador",
    "caption": "Rotor estroboscópico×1/100 · FFT del registro sintético a 2048 Hz",
    "timeScale": 1,
    "testSeconds": 4,
    "signals": "señal lateral/fundamental / resolución/separación",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Máquinas Eléctricas",
    "area": "ELECTRICIDAD",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Prepara un registro de corriente que permita distinguir bandas próximas a la fundamental sin sobrecargar el motor.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "La carga modifica el deslizamiento y la separación de bandas. Un registro corto puede mezclarlas con la fundamental.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 210,
    "slug": "banco-cuadricoptero-mezcla",
    "title": "Banco de cuadricóptero: mezcla de motores",
    "longTitle": "Banco de cuadricóptero: mezcla de motores",
    "intro": "Distribuye el empuje entre cuatro motores para sostener una carga y producir guiñada sin saturar ningún actuador.",
    "explore": "La suma de empujes sostiene la carga. Los pares de rotores de sentido opuesto crean guiñada; una orden imposible queda limitada.",
    "controls": [
      {
        "id": "thrust",
        "label": "Empuje colectivo solicitado",
        "min": 12,
        "max": 28,
        "step": 0.1,
        "unit": "N",
        "decimals": 1
      },
      {
        "id": "yaw",
        "label": "Par de guiñada solicitado",
        "min": 0.02,
        "max": 0.3,
        "step": 0.005,
        "unit": "N·m",
        "decimals": 3
      }
    ],
    "metrics": [
      {
        "label": "Empuje obtenido",
        "key": "total",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      },
      {
        "label": "Par de guiñada obtenido",
        "key": "yaw",
        "unit": "N·m",
        "scale": 1,
        "decimals": 3
      },
      {
        "label": "Potencia estimada",
        "key": "power",
        "unit": "W",
        "scale": 1,
        "decimals": 1
      },
      {
        "label": "Máximo empuje solicitado por motor",
        "key": "max",
        "unit": "N",
        "scale": 1,
        "decimals": 2
      }
    ],
    "task": "Obtén 17–20 N, manda al menos 0,08 N·m de guiñada, mantén cada solicitud entre 0,5 y 8 N y potencia≤250 W.",
    "equations": "Configuración+ con brazos 0,22 m, órdenes fijas de alabeo 0,25 y cabeceo 0,15 N·m. Mezcla lineal por equilibrio de fuerzas y momentos; relación par/empuje 0,018 m. Cada motor aplica saturación 0–8 N. T=1,8e−5ω²; potencia inducida idealT^(3/2)/(√(2ρA)·0,65),ρ=1,225,R=0,12 m. Banco angular J=0,08,c=0,25,k=4 con respuesta a escalón.",
    "limits": "Banco sujeto, no vuelo libre ni controlador de un vehículo real. Sin interacción de estelas, viento, retardo eléctrico, batería dinámica, flexión ni datos experimentales de hélice. Los coeficientes son sintéticos; no exporta órdenes de vuelo.",
    "source": "https://www.mathworks.com/help/aeroblks/multirotor.html",
    "sourceName": "Documentación técnica del principio",
    "tools": "Cuatro motores, hélices, banco con anillos, matriz de mezcla y fuente.",
    "job": "OT-210 · Obtén 17–20 N, manda al menos 0,08 N·m de guiñada, mantén cada solicitud entre 0,5 y 8 N y potencia≤250 W.",
    "procedure": [
      "Reconoce el banco, sus referencias y los límites de la orden.",
      "Ajusta el equipo, prepara el ensayo y registra un ciclo completo.",
      "Contrasta todos los criterios, valida manualmente y conserva el informe."
    ],
    "quiz": "¿Por qué una orden de guiñada puede perderse aunque el empuje total parezca suficiente?",
    "answers": [
      "Porque la distribución puede saturar un motor antes que la suma total.",
      "Porque todos los rotores deben tener siempre el mismo régimen.",
      "Porque el sentido de giro no afecta al par de reacción.",
      "Porque el empuje colectivo garantiza cualquier par disponible."
    ],
    "faults": [
      [
        "Motor saturado",
        "El empuje o par obtenido difiere del solicitado.",
        "La mezcla pide más o menos de lo permitido a un actuador."
      ],
      [
        "Consumo excesivo",
        "La distribución cabe, pero la potencia supera la orden.",
        "La potencia inducida crece más que proporcionalmente con el empuje."
      ],
      [
        "Empuje fuera de rango",
        "El reparto genera guiñada pero no cumple la carga de referencia.",
        "Fuerzas y momentos deben cumplirse simultáneamente."
      ]
    ],
    "labels": "Hélices · motores · brazos · controlador · batería · banco",
    "caption": "Banco sujeto · hélices estroboscópicas×1/150 · vectores de empuje",
    "timeScale": 1,
    "testSeconds": 6,
    "signals": "respuesta del banco / referencia del ensayo",
    "eyebrow": "Orden de trabajo · ingeniería de servicio",
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "tour": [
      {
        "title": "Lee la orden de trabajo",
        "text": "Distribuye el empuje entre cuatro motores para sostener una carga y producir guiñada sin saturar ningún actuador.",
        "view": "assembly"
      },
      {
        "title": "Inspecciona la causa",
        "text": "La suma de empujes sostiene la carga. Los pares de rotores de sentido opuesto crean guiñada; una orden imposible queda limitada.",
        "view": "inspection"
      },
      {
        "title": "Ensaya y entrega evidencia",
        "text": "Prepara el banco desde Orden / instrumento. Completa el ensayo antes de validar y descargar el informe.",
        "view": "assembly"
      }
    ]
  }
];
