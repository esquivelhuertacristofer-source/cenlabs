export const diagnostics = [
  {
    "id": 299,
    "slug": "paro-emergencia-contactores-edm",
    "title": "Paro de emergencia y contactores",
    "longTitle": "Prueba de fallo único y rearme supervisado",
    "intro": "El botón de emergencia abre el mando, pero un contacto soldado puede conservar la alimentación. Provoca el fallo y comprueba qué ocurre al rearmar.",
    "explore": "Selecciona la arquitectura e inyecta una soldadura. Observa ambos contactores, la carga y el tiempo de desaceleración.",
    "controls": [
      {
        "id": "architecture",
        "label": "Arquitectura",
        "format": value => ["Un contactor", "Redundante", "Redundante + EDM"][value - 1],
        "min": 1,
        "max": 3,
        "step": 1,
        "unit": "",
        "decimals": 0
      },
      {
        "id": "fault",
        "label": "Fallo inyectado",
        "format": value => ["Sin fallo", "K1 soldado", "K2 soldado"][value],
        "min": 0,
        "max": 2,
        "step": 1,
        "unit": "",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "K1 cerrado",
        "key": "k1",
        "unit": "",
        "decimals": 0,
        "scale": 1
      },
      {
        "label": "K2 cerrado",
        "key": "k2",
        "unit": "",
        "decimals": 0,
        "scale": 1
      },
      {
        "label": "Alimentación",
        "key": "power",
        "unit": "",
        "decimals": 0,
        "scale": 1
      },
      {
        "label": "Velocidad",
        "key": "speed",
        "unit": "%",
        "decimals": 1,
        "scale": 100
      }
    ],
    "task": "Demuestra que un contacto soldado permite cortar la alimentación y que la supervisión bloquea el rearme.",
    "equations": "K1 y K2 son contactos de potencia en serie en la arquitectura redundante. El paro se ordena a 2 s, el rearme se intenta a 5 s y se solicita una nueva marcha a 7 s. Con alimentación cortada, la velocidad decae como exp(−Δt/0,62 s). El ejemplo de subsistemas independientes suma PFHᴅ = 4×10⁻⁸ + 8×10⁻⁸ + 2×10⁻⁷ = 3,2×10⁻⁷ h⁻¹, dentro de la banda numérica d.",
    "limits": "Se simula una sola soldadura. La banda de PFHᴅ es ilustrativa y requiere revisar arquitectura, diagnóstico, fallos comunes y otros requisitos para determinar el PL de una función real.",
    "quiz": "¿Qué detecta la supervisión EDM al intentar rearmar?",
    "answers": [
      "Que un contactor sigue cerrado con la bobina desenergizada.",
      "Que el rotor ya llegó a cero en todos los casos.",
      "Que los contactos del pulsador tienen la misma temperatura.",
      "Que la solicitud de rearme activa por sí sola el motor."
    ],
    "sourceName": "IFA · Safety of machine controls to EN ISO 13849",
    "source": "https://www.dguv.de/ifa/praxishilfen/practical-solutions-machine-safety/sicherheit-von-maschinensteuerungen/index.jsp",
    "faults": [
      [
        "K1 soldado",
        "K1 sigue cerrado al ordenar el paro.",
        "Comprueba si K2 abre y separa la carga."
      ],
      [
        "Rearme sin EDM",
        "El mando vuelve a quedar habilitado tras el fallo.",
        "Contrasta con el canal de supervisión."
      ],
      [
        "Rotor en inercia",
        "La carga sigue girando un tiempo después del corte.",
        "Distingue tensión de movimiento."
      ]
    ],
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "eyebrow": "Orden de trabajo · Diagnóstico",
    "job": "OT-299 · Demuestra que un contacto soldado permite cortar la alimentación y que la supervisión bloquea el rearme.",
    "labels": "Pulsador de emergencia · Contactores K1 y K2 · Rotor de carga",
    "caption": "Prueba de fallo único y rearme supervisado",
    "tools": "Pulsador de emergencia, Contactores K1 y K2, Rotor de carga",
    "procedure": [
      "Selecciona la arquitectura e inyecta una soldadura. Observa ambos contactores, la carga y el tiempo de desaceleración.",
      "Ejecuta un ensayo y abre el instrumento de diagnóstico.",
      "Demuestra que un contacto soldado permite cortar la alimentación y que la supervisión bloquea el rearme."
    ],
    "timeScale": 1,
    "signals": "Alimentación y velocidad relativa",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "K1 soldado",
        "descripcion": "K1 sigue cerrado al ordenar el paro."
      },
      {
        "icono": "⚙",
        "nombre": "Rearme sin EDM",
        "descripcion": "El mando vuelve a quedar habilitado tras el fallo."
      },
      {
        "icono": "⚙",
        "nombre": "Rotor en inercia",
        "descripcion": "La carga sigue girando un tiempo después del corte."
      }
    ],
    "tour": [
      {
        "title": "Pulsador de emergencia",
        "text": "Comprueba si K2 abre y separa la carga.",
        "view": "assembly"
      },
      {
        "title": "Contactores K1 y K2",
        "text": "Contrasta con el canal de supervisión.",
        "view": "inspection"
      },
      {
        "title": "Rotor de carga",
        "text": "Demuestra que un contacto soldado permite cortar la alimentación y que la supervisión bloquea el rearme.",
        "view": "assembly"
      }
    ]
  },
  {
    "id": 300,
    "slug": "mantenimiento-predictivo-vibracion-rul",
    "title": "Mantenimiento predictivo por vibración",
    "longTitle": "Tendencia RMS y tiempo hasta alarma",
    "intro": "Un rodamiento empieza a vibrar con más intensidad. Ajusta la ventana de diagnóstico y estima cuándo alcanzará el umbral del taller.",
    "explore": "Acorta la ventana para captar la degradación reciente y compara el efecto de espaciar las mediciones.",
    "controls": [
      {
        "id": "window",
        "label": "Ventana de historial",
        "min": 12,
        "max": 56,
        "step": 2,
        "unit": "d",
        "decimals": 0
      },
      {
        "id": "interval",
        "label": "Intervalo de medida",
        "min": 1,
        "max": 5,
        "step": 1,
        "unit": "d",
        "decimals": 0
      }
    ],
    "metrics": [
      {
        "label": "Vibración",
        "key": "rms",
        "unit": "mm/s",
        "decimals": 2,
        "scale": 1
      },
      {
        "label": "Pendiente",
        "key": "slope",
        "unit": "mm/s por día",
        "decimals": 3,
        "scale": 1
      },
      {
        "label": "Hasta alarma",
        "key": "remaining",
        "unit": "d",
        "decimals": 1,
        "scale": 1
      },
      {
        "label": "Muestras",
        "key": "count",
        "unit": "",
        "decimals": 0,
        "scale": 1
      }
    ],
    "task": "Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s.",
    "equations": "Historial sintético de días 0 a 60 con degradación acelerada. Ajuste por mínimos cuadrados y=md+b sobre las muestras de la ventana. Tiempo hasta alarma = (4,5−b)/m−60 días. Residuo = raíz de la media de los errores cuadrados.",
    "limits": "4,5 mm/s es un umbral de este caso didáctico. La extrapolación supone pendiente constante y estima tiempo hasta alarma. Los datos son sintéticos y no incluyen cambios de carga o temperatura.",
    "quiz": "¿Por qué una ventana larga puede aplazar la alarma estimada?",
    "answers": [
      "Incluye medidas anteriores a la aceleración y reduce la pendiente estimada.",
      "Suma el ruido directamente a la velocidad del eje.",
      "Convierte el umbral a una frecuencia de giro.",
      "Impide que la línea se prolongue fuera de los datos."
    ],
    "sourceName": "NASA Open Data · IMS Bearings, referencia de adquisición experimental",
    "source": "https://data.nasa.gov/dataset/ims-bearings",
    "faults": [
      [
        "Ventana demasiado larga",
        "La tendencia diluye el crecimiento reciente.",
        "Compara el residuo y la extrapolación."
      ],
      [
        "Mediciones escasas",
        "Quedan muy pocos puntos para estimar una pendiente.",
        "Reduce el intervalo de adquisición."
      ],
      [
        "Estimación fuera de rango",
        "La intersección se desplaza al cambiar el ajuste.",
        "Relaciona la pendiente con el cruce de umbral."
      ]
    ],
    "module": "Mecatrónica",
    "area": "MECATRÓNICA",
    "eyebrow": "Orden de trabajo · Diagnóstico",
    "job": "OT-300 · Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s.",
    "labels": "Banco de rodamiento · Acelerómetro · Registro de tendencia",
    "caption": "Tendencia RMS y tiempo hasta alarma",
    "tools": "Banco de rodamiento, Acelerómetro, Registro de tendencia",
    "procedure": [
      "Acorta la ventana para captar la degradación reciente y compara el efecto de espaciar las mediciones.",
      "Ejecuta un ensayo y abre el instrumento de diagnóstico.",
      "Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s."
    ],
    "timeScale": 1,
    "signals": "Vibración RMS y umbral",
    "concepts": [
      {
        "icono": "⚙",
        "nombre": "Ventana demasiado larga",
        "descripcion": "La tendencia diluye el crecimiento reciente."
      },
      {
        "icono": "⚙",
        "nombre": "Mediciones escasas",
        "descripcion": "Quedan muy pocos puntos para estimar una pendiente."
      },
      {
        "icono": "⚙",
        "nombre": "Estimación fuera de rango",
        "descripcion": "La intersección se desplaza al cambiar el ajuste."
      }
    ],
    "tour": [
      {
        "title": "Banco de rodamiento",
        "text": "Compara el residuo y la extrapolación.",
        "view": "assembly"
      },
      {
        "title": "Acelerómetro",
        "text": "Reduce el intervalo de adquisición.",
        "view": "inspection"
      },
      {
        "title": "Registro de tendencia",
        "text": "Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s.",
        "view": "assembly"
      }
    ]
  }
];
