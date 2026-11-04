fichaTecnica({
  "title": "Refrigeración, COP y subenfriamiento",
  "intro": "Ajusta la temperatura de evaporación y el subenfriamiento para obtener más frío útil por unidad de trabajo.",
  "s1": {
    "presentes": "Compresor, condensador, válvula y evaporador",
    "omitidos": [
      "Ciclo estacionario, sin pérdidas de presión. Los estados se precalculan para los pasos de los mandos."
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
        "Tabla CoolProp HEOS para R134a. Condensación a 40 °C, succión saturada, compresor con ηs=0,80, válvula isoentálpica h₄=h₃. COP=(h₁−h₄)/(h₂−h₁).",
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
    "COP entre 3.75 y 4.3. Frío útil entre 145 y 170 kJ/kg. Trabajo de compresión entre 34 y 42 kJ/kg."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Identifica compresor, condensador, válvula y evaporador en el banco.",
      "Registra un ensayo variando evaporación y subenfriamiento.",
      "COP entre 3.75 y 4.3. Frío útil entre 145 y 170 kJ/kg. Trabajo de compresión entre 34 y 42 kJ/kg."
    ]
  },
  "s5": {
    "modela": "Tabla CoolProp HEOS para R134a. Condensación a 40 °C, succión saturada, compresor con ηs=0,80, válvula isoentálpica h₄=h₃. COP=(h₁−h₄)/(h₂−h₁).",
    "noModela": "Ciclo estacionario, sin pérdidas de presión. Los estados se precalculan para los pasos de los mandos."
  },
  "s6": [
    "NIST · propiedades de R134a · https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=925237"
  ]
});
