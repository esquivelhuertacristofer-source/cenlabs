fichaTecnica({
  "title": "Encoder incremental y absoluto",
  "intro": "El disco sigue girando aunque el lector se salte marcas. Compara el conteo de flancos con la posición que entrega una palabra absoluta.",
  "s1": {
    "presentes": "Disco óptico combinado y analizador de cuadratura, conteo y palabra Gray.",
    "omitidos": [
      "Sensor ideal sin ruido, desalineación ni rebote. El contador incremental parte de cero. Gray indica el sector actual dentro de una vuelta. La frecuencia de muestreo se aplica a la lectura por software, no a un contador de flancos por hardware."
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
        "16 periodos A/B por revolución y decodificación X4, con 64 cuentas por vuelta. Secuencia 00, 10, 11, 01. Cambios adyacentes suman o restan una cuenta y un salto de dos estados se marca inválido. El disco absoluto de seis bits usa Gray=k XOR (k>>1), con sector de 5,625°. Se muestrea un segundo físico y se muestra en ocho segundos.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Disco codificado · 1 s físico por 8 s de escena",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Mantén 900 a 1300 rpm con conteo exacto y sin saltos inválidos. Usa como máximo 1700 muestras/s."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Compara las pistas durante el giro.",
      "Ajusta el muestreo para conservar el conteo.",
      "Ensaya y explica la diferencia entre sector y desplazamiento."
    ]
  },
  "s5": {
    "modela": "16 periodos A/B por revolución y decodificación X4, con 64 cuentas por vuelta. Secuencia 00, 10, 11, 01. Cambios adyacentes suman o restan una cuenta y un salto de dos estados se marca inválido. El disco absoluto de seis bits usa Gray=k XOR (k>>1), con sector de 5,625°. Se muestrea un segundo físico y se muestra en ocho segundos.",
    "noModela": "Sensor ideal sin ruido, desalineación ni rebote. El contador incremental parte de cero. Gray indica el sector actual dentro de una vuelta. La frecuencia de muestreo se aplica a la lectura por software, no a un contador de flancos por hardware."
  },
  "s6": [
    "National Instruments · Using Quadrature Encoders · https://www.ni.com/en/support/documentation/supplemental/21/using-quadrature-encoders-with-e-series-daq-boards.html"
  ]
});
