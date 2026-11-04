fichaTecnica({
  "title": "Intercambiador a contracorriente por NTU",
  "intro": "Ajusta el intercambio para enfriar la línea caliente sin exceder la temperatura de retorno.",
  "s1": {
    "presentes": "Tubos a contracorriente, colectores y perfil térmico",
    "omitidos": [
      "Corrientes monofásicas y propiedades constantes."
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
        "ε=(1−e^(−NTU(1−Cr)))/(1−Cr·e^(−NTU(1−Cr))); a Cr=1, ε=NTU/(1+NTU). Cmin corresponde al flujo caliente. Entradas 80 y 20 °C. Balance sin pérdidas.",
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
    "Efectividad entre 75 y 87 %. Salida caliente entre 27 y 36 °C. Salida fría entre 45 y 56 °C."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Identifica tubos a contracorriente, colectores y perfil térmico en el banco.",
      "Registra un ensayo variando número de unidades de transferencia y razón de capacidades.",
      "Efectividad entre 75 y 87 %. Salida caliente entre 27 y 36 °C. Salida fría entre 45 y 56 °C."
    ]
  },
  "s5": {
    "modela": "ε=(1−e^(−NTU(1−Cr)))/(1−Cr·e^(−NTU(1−Cr))); a Cr=1, ε=NTU/(1+NTU). Cmin corresponde al flujo caliente. Entradas 80 y 20 °C. Balance sin pérdidas.",
    "noModela": "Corrientes monofásicas y propiedades constantes."
  },
  "s6": [
    "Lienhard · A Heat Transfer Textbook · https://ahtt.mit.edu/wp-content/uploads/2024/04/AHTTv600.pdf"
  ]
});
