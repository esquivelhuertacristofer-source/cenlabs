fichaTecnica({
  "title": "Mantenimiento predictivo por vibración",
  "intro": "Un rodamiento empieza a vibrar con más intensidad. Ajusta la ventana de diagnóstico y estima cuándo alcanzará el umbral del taller.",
  "s1": {
    "presentes": "Banco de rodamiento, Acelerómetro, Registro de tendencia",
    "omitidos": [
      "4,5 mm/s es un umbral de este caso didáctico. La extrapolación supone pendiente constante y estima tiempo hasta alarma. Los datos son sintéticos y no incluyen cambios de carga o temperatura."
    ]
  },
  "s2": {
    "title": "Modelo del banco",
    "rows": [
      [
        "Relación",
        "Detalle",
        "Origen"
      ],
      [
        "Dinámica",
        "Historial sintético de días 0 a 60 con degradación acelerada. Ajuste por mínimos cuadrados y=md+b sobre las muestras de la ventana. Tiempo hasta alarma = (4,5−b)/m−60 días. Residuo = raíz de la media de los errores cuadrados.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Tendencia RMS y tiempo hasta alarma",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Acorta la ventana para captar la degradación reciente y compara el efecto de espaciar las mediciones.",
      "Ejecuta un ensayo y abre el instrumento de diagnóstico.",
      "Estima la alarma a 7–12 días, con al menos cinco muestras y residuo RMS ≤0,11 mm/s."
    ]
  },
  "s5": {
    "modela": "Historial sintético de días 0 a 60 con degradación acelerada. Ajuste por mínimos cuadrados y=md+b sobre las muestras de la ventana. Tiempo hasta alarma = (4,5−b)/m−60 días. Residuo = raíz de la media de los errores cuadrados.",
    "noModela": "4,5 mm/s es un umbral de este caso didáctico. La extrapolación supone pendiente constante y estima tiempo hasta alarma. Los datos son sintéticos y no incluyen cambios de carga o temperatura."
  },
  "s6": [
    "NASA Open Data · IMS Bearings, referencia de adquisición experimental · https://data.nasa.gov/dataset/ims-bearings"
  ]
});
