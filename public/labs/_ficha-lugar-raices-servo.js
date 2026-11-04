fichaTecnica({
  "title": "Lugar de las raíces de un servo",
  "intro": "El eje recibe una pequeña perturbación. Según el ajuste, la oscilación desaparece, se mantiene o crece.",
  "s1": {
    "presentes": "Banco de servo con aguja angular, lugar de raíces y oscilograma.",
    "omitidos": [
      "Modelo lineal equivalente de tres retardos y realimentación negativa unitaria. La respuesta representa un modo libre inicial. El indicador usa 0,9 tanh(θ/0,03) rad para mantener legible el recorrido. La traza muestra θ en grados. El ensayo dura 8 s."
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
        "Denominador (1+τs)³+K. El polo real es (−1−∛K)/τ. El par tiene σ=(−1+∛K/2)/τ y ωd=√3∛K/(2τ). Se excita sólo el par. θ(t)=0,005 exp(σt) cos(ωdt). Si σ<0, t5%=ln(20)/(−σ).",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Indicador ampliado y acotado · ángulo del modelo en la traza",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Logra amortiguamiento ≥0,20, caída de la envolvente al 5 % en ≤4 s y frecuencia amortiguada de 3 a 8 rad/s."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Observa la perturbación.",
      "Ajusta ganancia y constante de tiempo.",
      "Comprueba los polos y la caída de la envolvente."
    ]
  },
  "s5": {
    "modela": "Denominador (1+τs)³+K. El polo real es (−1−∛K)/τ. El par tiene σ=(−1+∛K/2)/τ y ωd=√3∛K/(2τ). Se excita sólo el par. θ(t)=0,005 exp(σt) cos(ωdt). Si σ<0, t5%=ln(20)/(−σ).",
    "noModela": "Modelo lineal equivalente de tres retardos y realimentación negativa unitaria. La respuesta representa un modo libre inicial. El indicador usa 0,9 tanh(θ/0,03) rad para mantener legible el recorrido. La traza muestra θ en grados. El ensayo dura 8 s."
  },
  "s6": [
    "Caltech CDS · PID and Root Locus · https://www.cds.caltech.edu/~murray/courses/cds101/fa02/W8_PID.html"
  ]
});
