fichaTecnica({
  "title": "Servo con tres lazos en cascada",
  "intro": "El carro debe llegar a una marca. Un lazo pide velocidad, otro pide corriente y el último entrega el esfuerzo al motor.",
  "s1": {
    "presentes": "Accionamiento con correa y analizador de posición, velocidad y corriente.",
    "omitidos": [
      "Modelo equivalente con lazo interno de corriente ideal de primer orden. La velocidad usa compensación de fricción nominal y acción proporcional. La carga constante deja error estacionario en este ajuste. Sin dinámica de convertidor, holgura ni elasticidad de la correa. El carro avanza 0,42 unidades de escena por radián."
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
        "Consigna θ=1,3 rad. ω*=sat(Kθ·error,±4). i*=sat((bω+Jλv(ω*−ω))/Kt,±3). El lazo cerrado de corriente se aproxima por di/dt=60(i*−i). J·dω/dt=Kt·i−bω−T_carga y dθ/dt=ω. J=0,02 kg·m², b=0,055 N·m·s, Kt=0,22 N·m/A. A los 2 s entra una carga de 0,012 N·m. Paso de 2 ms.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Carro de correa · 0,42 unidades de escena por radián",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Logra separación de lazos ≥3, sobreimpulso ≤0,03 rad, error bajo carga ≤0,018 rad y corriente ≤3 A."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Sigue el movimiento y la llegada a la marca.",
      "Ajusta los dos lazos exteriores.",
      "Contrasta las tres señales y valida bajo carga."
    ]
  },
  "s5": {
    "modela": "Consigna θ=1,3 rad. ω*=sat(Kθ·error,±4). i*=sat((bω+Jλv(ω*−ω))/Kt,±3). El lazo cerrado de corriente se aproxima por di/dt=60(i*−i). J·dω/dt=Kt·i−bω−T_carga y dθ/dt=ω. J=0,02 kg·m², b=0,055 N·m·s, Kt=0,22 N·m/A. A los 2 s entra una carga de 0,012 N·m. Paso de 2 ms.",
    "noModela": "Modelo equivalente con lazo interno de corriente ideal de primer orden. La velocidad usa compensación de fricción nominal y acción proporcional. La carga constante deja error estacionario en este ajuste. Sin dinámica de convertidor, holgura ni elasticidad de la correa. El carro avanza 0,42 unidades de escena por radián."
  },
  "s6": [
    "Texas Instruments · A faster current loop pays off in servo motor control · https://www.ti.com/lit/wp/swpy031/swpy031.pdf"
  ]
});
