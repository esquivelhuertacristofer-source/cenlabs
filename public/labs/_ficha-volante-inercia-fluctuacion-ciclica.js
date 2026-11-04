fichaTecnica({
  "title": "Volante de inercia y fluctuación cíclica",
  "intro": "Dimensiona la inercia para mantener el régimen dentro de tolerancia bajo una carga pulsante.",
  "s1": {
    "presentes": "Eje, volante y perfil de carga",
    "omitidos": [
      "Intercambio periódico de energía prescrito. Se omiten rozamiento y torsión."
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
        "Con ω₀=150 rpm, ω=√(ω₀²+(ΔE/J)sen θ). ΔE es la diferencia entre energías extremas. Fluctuación =100(ωmáx−ωmín)/ω₀.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Movimiento amplificado en el banco",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Fluctuación pico a pico entre 0 y 6 %. Energía de referencia entre 0 y 125 J. Variación pico a pico entre 0 y 9 rpm."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Identifica eje, volante y perfil de carga en el banco.",
      "Registra un ensayo variando inercia y fluctuación de energía.",
      "Fluctuación pico a pico entre 0 y 6 %. Energía de referencia entre 0 y 125 J. Variación pico a pico entre 0 y 9 rpm."
    ]
  },
  "s5": {
    "modela": "Con ω₀=150 rpm, ω=√(ω₀²+(ΔE/J)sen θ). ΔE es la diferencia entre energías extremas. Fluctuación =100(ωmáx−ωmín)/ω₀.",
    "noModela": "Intercambio periódico de energía prescrito. Se omiten rozamiento y torsión."
  },
  "s6": [
    "MIT OpenCourseWare · Engineering Dynamics · https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/"
  ]
});
