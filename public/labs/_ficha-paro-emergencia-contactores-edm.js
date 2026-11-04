fichaTecnica({
  "title": "Paro de emergencia y contactores",
  "intro": "El botón de emergencia abre el mando, pero un contacto soldado puede conservar la alimentación. Provoca el fallo y comprueba qué ocurre al rearmar.",
  "s1": {
    "presentes": "Pulsador de emergencia, Contactores K1 y K2, Rotor de carga",
    "omitidos": [
      "Se simula una sola soldadura. La banda de PFHᴅ es ilustrativa y requiere revisar arquitectura, diagnóstico, fallos comunes y otros requisitos para determinar el PL de una función real."
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
        "K1 y K2 son contactos de potencia en serie en la arquitectura redundante. El paro se ordena a 2 s, el rearme se intenta a 5 s y se solicita una nueva marcha a 7 s. Con alimentación cortada, la velocidad decae como exp(−Δt/0,62 s). El ejemplo de subsistemas independientes suma PFHᴅ = 4×10⁻⁸ + 8×10⁻⁸ + 2×10⁻⁷ = 3,2×10⁻⁷ h⁻¹, dentro de la banda numérica d.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Prueba de fallo único y rearme supervisado",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Demuestra que un contacto soldado permite cortar la alimentación y que la supervisión bloquea el rearme."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Selecciona la arquitectura e inyecta una soldadura. Observa ambos contactores, la carga y el tiempo de desaceleración.",
      "Ejecuta un ensayo y abre el instrumento de diagnóstico.",
      "Demuestra que un contacto soldado permite cortar la alimentación y que la supervisión bloquea el rearme."
    ]
  },
  "s5": {
    "modela": "K1 y K2 son contactos de potencia en serie en la arquitectura redundante. El paro se ordena a 2 s, el rearme se intenta a 5 s y se solicita una nueva marcha a 7 s. Con alimentación cortada, la velocidad decae como exp(−Δt/0,62 s). El ejemplo de subsistemas independientes suma PFHᴅ = 4×10⁻⁸ + 8×10⁻⁸ + 2×10⁻⁷ = 3,2×10⁻⁷ h⁻¹, dentro de la banda numérica d.",
    "noModela": "Se simula una sola soldadura. La banda de PFHᴅ es ilustrativa y requiere revisar arquitectura, diagnóstico, fallos comunes y otros requisitos para determinar el PL de una función real."
  },
  "s6": [
    "IFA · Safety of machine controls to EN ISO 13849 · https://www.dguv.de/ifa/praxishilfen/practical-solutions-machine-safety/sicherheit-von-maschinensteuerungen/index.jsp"
  ]
});
