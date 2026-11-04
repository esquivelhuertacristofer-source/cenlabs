fichaTecnica({
  "title": "PID de velocidad con anti-windup",
  "intro": "Cuando el motor ya recibe toda la tensión disponible, el controlador todavía puede acumular error. Observa qué ocurre al bajar la consigna.",
  "s1": {
    "presentes": "Banco de motor con rodillo y analizador de velocidad, tensión e integral.",
    "omitidos": [
      "Velocidad y tensión normalizadas. Consigna 140 % durante 2,5 s y 55 % hasta 8 s. La referencia inicial provoca saturación deliberada. La recuperación se mide desde el cambio hasta la última salida de la banda. La planta es equivalente y el giro del rodillo representa una vuelta por segundo al 100 %. La regla Z–N proporciona un punto de partida para este modelo."
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
        "Planta de tres retardos iguales P(s)=1/(1+0,25s)³. El ensayo proporcional ideal da Ku=8 y Pu=2π·0,25/√3. Z–N de ganancia última da Kp=0,6Ku, Ti=Pu/2 y Td=Pu/8. El primer mando escala Kp, Ki y Kd. La derivada usa la salida medida. u=limitar(Kp·e+I−Kd·dy/dt,0,1), dI/dt=Ki·e+Kt·(u−u_sin_límite). Muestreo de 5 ms con retención del mando y avance exacto de la planta entre muestras.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Rodillo de ensayo · una vuelta por segundo al 100 %",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Recupera la banda de ±3 puntos en ≤1,8 s y conserva un error final ≤1 punto. Mantén el factor de ajuste entre 0,6 y 1,2."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Observa el intervalo saturado.",
      "Ajusta la ganancia y la corrección del integrador.",
      "Registra la recuperación y compara la tensión ordenada con la aplicada."
    ]
  },
  "s5": {
    "modela": "Planta de tres retardos iguales P(s)=1/(1+0,25s)³. El ensayo proporcional ideal da Ku=8 y Pu=2π·0,25/√3. Z–N de ganancia última da Kp=0,6Ku, Ti=Pu/2 y Td=Pu/8. El primer mando escala Kp, Ki y Kd. La derivada usa la salida medida. u=limitar(Kp·e+I−Kd·dy/dt,0,1), dI/dt=Ki·e+Kt·(u−u_sin_límite). Muestreo de 5 ms con retención del mando y avance exacto de la planta entre muestras.",
    "noModela": "Velocidad y tensión normalizadas. Consigna 140 % durante 2,5 s y 55 % hasta 8 s. La referencia inicial provoca saturación deliberada. La recuperación se mide desde el cambio hasta la última salida de la banda. La planta es equivalente y el giro del rodillo representa una vuelta por segundo al 100 %. La regla Z–N proporciona un punto de partida para este modelo."
  },
  "s6": [
    "Åström y Murray · Feedback Systems, PID Control · https://www.cds.caltech.edu/~murray/amwiki/PID_Control.html"
  ]
});
