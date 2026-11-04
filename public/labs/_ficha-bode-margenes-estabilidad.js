fichaTecnica({
  "title": "Bode y márgenes de estabilidad",
  "intro": "Dos señales pueden tener el mismo tamaño y llegar en momentos distintos. Ese retraso cambia cómo se comporta un lazo de control.",
  "s1": {
    "presentes": "Dos indicadores lineales y analizador Bode de magnitud y fase.",
    "omitidos": [
      "Respuesta sinusoidal estacionaria del lazo abierto ideal. La cancelación de un polo es exacta en este modelo. Los indicadores muestran entrada y salida normalizadas en el cruce, donde sus amplitudes coinciden. El equipo físico y su escala de desplazamiento son ilustrativos."
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
        "Planta 1/(1+s/4)³ y compensador K(1+s/4)/(1+s/(4a)). L(s)=K/[(1+s/4)²(1+s/(4a))]. En cruce de magnitud se cumple |L(jωc)|=1. Margen de fase=180°+arg L(jωc). El cruce de fase ocurre a 4√(1+2a) rad/s. Margen de ganancia=−20 log₁₀|L(jωfase)|.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Indicadores sincronizados a la frecuencia de cruce",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Consigue margen de fase de 45° a 70°, margen de ganancia ≥8 dB y frecuencia de cruce ≥4,5 rad/s."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Compara la fase de ambos indicadores.",
      "Ajusta ganancia y adelanto.",
      "Registra los dos cruces y valida los márgenes."
    ]
  },
  "s5": {
    "modela": "Planta 1/(1+s/4)³ y compensador K(1+s/4)/(1+s/(4a)). L(s)=K/[(1+s/4)²(1+s/(4a))]. En cruce de magnitud se cumple |L(jωc)|=1. Margen de fase=180°+arg L(jωc). El cruce de fase ocurre a 4√(1+2a) rad/s. Margen de ganancia=−20 log₁₀|L(jωfase)|.",
    "noModela": "Respuesta sinusoidal estacionaria del lazo abierto ideal. La cancelación de un polo es exacta en este modelo. Los indicadores muestran entrada y salida normalizadas en el cruce, donde sus amplitudes coinciden. El equipo físico y su escala de desplazamiento son ilustrativos."
  },
  "s6": [
    "Åström y Murray · Feedback Systems, Frequency Domain Design · https://authors.library.caltech.edu/records/yzs24-xsx88"
  ]
});
