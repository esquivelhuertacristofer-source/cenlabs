fichaTecnica({
  "title": "Moody y pérdidas en una tubería",
  "intro": "Cambia caudal y rugosidad para cumplir el presupuesto de carga del circuito.",
  "s1": {
    "presentes": "Tubo, tomas de presión y trazador",
    "omitidos": [
      "Interpolación didáctica entre Re=2300 y 4000. Accesorios agrupados en un único coeficiente."
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
        "Agua ν=10⁻⁶ m²/s, D=40 mm, L=25 m y ΣK=3. Re=vD/ν. En régimen laminar f=64/Re. En turbulento se usa Swamee–Jain. Pérdida (fL/D+ΣK)v²/(2g).",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Escena esquemática · lecturas del modelo",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Reynolds entre 50000 y 80000. Factor de Darcy entre 0.015 y 0.03. Pérdida total entre 0 y 2.5 m."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Identifica tubo, tomas de presión y trazador en el banco.",
      "Registra un ensayo variando velocidad media y rugosidad relativa.",
      "Reynolds entre 50000 y 80000. Factor de Darcy entre 0.015 y 0.03. Pérdida total entre 0 y 2.5 m."
    ]
  },
  "s5": {
    "modela": "Agua ν=10⁻⁶ m²/s, D=40 mm, L=25 m y ΣK=3. Re=vD/ν. En régimen laminar f=64/Re. En turbulento se usa Swamee–Jain. Pérdida (fL/D+ΣK)v²/(2g).",
    "noModela": "Interpolación didáctica entre Re=2300 y 4000. Accesorios agrupados en un único coeficiente."
  },
  "s6": [
    "DOE · Fundamentals Handbook · https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1012-92_VOL2.pdf"
  ]
});
