fichaTecnica({
  "title": "Variador con PLC y límite de corriente",
  "intro": "Una rampa rápida pide más esfuerzo al motor. Si la corriente llega al límite, la velocidad deja de seguir la orden.",
  "s1": {
    "presentes": "Ventilador de accionamiento, variador y analizador de rampa.",
    "omitidos": [
      "Accionamiento equivalente con par proporcional a corriente, frenado bidireccional y carga viscosa. Secuencia de PLC prescrita. La escena no representa el diseño eléctrico de potencia ni la energía del frenado. Giro mostrado a 1/20 de velocidad."
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
        "El PLC ordena marcha a 0,5 s y parada a 5,5 s. Rampa simétrica hasta 1200 rpm. J=0,008 kg·m², b=0,004 N·m·s, Kt=0,30 N·m/A. i*= [bω+J(αref+8(ωref−ω))]/Kt. i=sat(i*,±Imax). J·dω/dt=Kt·i−bω. Integración de 5 ms y ángulo visual ∫ω/20 dt.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Giro a 1/20 · velocidad e intensidad reales del modelo",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Sigue la rampa con error ≤65 rpm y corriente pico ≤4,5 A. En la parada, entra a ±20 rpm en ≤2,2 s."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Sigue el arranque y la parada.",
      "Ajusta pendiente y límite.",
      "Compara velocidad y corriente antes de validar."
    ]
  },
  "s5": {
    "modela": "El PLC ordena marcha a 0,5 s y parada a 5,5 s. Rampa simétrica hasta 1200 rpm. J=0,008 kg·m², b=0,004 N·m·s, Kt=0,30 N·m/A. i*= [bω+J(αref+8(ωref−ω))]/Kt. i=sat(i*,±Imax). J·dω/dt=Kt·i−bω. Integración de 5 ms y ángulo visual ∫ω/20 dt.",
    "noModela": "Accionamiento equivalente con par proporcional a corriente, frenado bidireccional y carga viscosa. Secuencia de PLC prescrita. La escena no representa el diseño eléctrico de potencia ni la energía del frenado. Giro mostrado a 1/20 de velocidad."
  },
  "s6": [
    "ABB · ACS580 firmware manual, Reference ramping · https://library.e.abb.com/public/bcfbcbe94902460f8e18f53f51cb44f9/EN_ACS580_FW_H_A5.pdf"
  ]
});
