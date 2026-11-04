fichaTecnica({
  "title": "Ciclo Rankine y sobrecalentamiento",
  "intro": "Ajusta presión y temperatura de la caldera para obtener trabajo sin degradar demasiado la calidad a la salida de la turbina.",
  "s1": {
    "presentes": "Bomba, caldera, turbina y condensador",
    "omitidos": [
      "Ciclo estacionario ideal. Los estados se precalculan para los pasos de los mandos."
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
        "Tabla CoolProp IF97 de agua. Condensador a 10 kPa, bomba ideal con vΔp, expansión isentrópica. x=(s₃−sf)/(sg−sf), h₄=hf+x(hg−hf). η=(h₃−h₄−h₂+h₁)/(h₃−h₂).",
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
    "Eficiencia térmica entre 37 y 45 %. Calidad a la salida entre 83 y 95 %. Trabajo neto entre 1200 y 1500 kJ/kg."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Identifica bomba, caldera, turbina y condensador en el banco.",
      "Registra un ensayo variando presión de caldera y temperatura de vapor.",
      "Eficiencia térmica entre 37 y 45 %. Calidad a la salida entre 83 y 95 %. Trabajo neto entre 1200 y 1500 kJ/kg."
    ]
  },
  "s5": {
    "modela": "Tabla CoolProp IF97 de agua. Condensador a 10 kPa, bomba ideal con vΔp, expansión isentrópica. x=(s₃−sf)/(sg−sf), h₄=hf+x(hg−hf). η=(h₃−h₄−h₂+h₁)/(h₃−h₂).",
    "noModela": "Ciclo estacionario ideal. Los estados se precalculan para los pasos de los mandos."
  },
  "s6": [
    "IAPWS IF97 · https://www.iapws.org/relguide/IF97-Rev.html"
  ]
});
