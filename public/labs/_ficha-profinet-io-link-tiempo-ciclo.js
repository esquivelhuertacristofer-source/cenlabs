fichaTecnica({
  "title": "PROFINET e IO-Link: del sensor al PLC",
  "intro": "El sensor ya detectó la pieza. El programa aún debe esperar a que el dato pase por el maestro y llegue a su ciclo de lectura.",
  "s1": {
    "presentes": "Sensor, maestro IO-Link, switch, PLC y analizador de eventos.",
    "omitidos": [
      "Calendario determinista del banco con fases fijas. Los periodos y demoras son hipótesis del ejercicio. No se modelan jitter, reintentos ni congestión. IO-Link une el sensor al maestro. El maestro actúa como dispositivo PROFINET ante el PLC a través del switch."
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
        "Capturas IO-Link de periodo Tio. Preparación del dato en el maestro de 0,25 ms. PROFINET actualiza en múltiplos de Tpn más 0,5 ms. El programa consume en múltiplos de 4 ms más 0,75 ms. Se enumeran las capturas de un hiperperiodo mcm(Tio,Tpn,4). El peor caso toma un evento inmediatamente posterior a la captura anterior. Cota conservadora Tio+0,25+Tpn+4.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Indicadores de dato disponible · milisegundos ampliados",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Entrega el dato al programa en ≤10 ms. Usa IO-Link de 3 a 6 ms y una actualización PROFINET de 2 a 4 ms."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Identifica los dos tipos de enlace.",
      "Ajusta los periodos y compara latencia y cota.",
      "Ensaya y justifica la fase de peor caso."
    ]
  },
  "s5": {
    "modela": "Capturas IO-Link de periodo Tio. Preparación del dato en el maestro de 0,25 ms. PROFINET actualiza en múltiplos de Tpn más 0,5 ms. El programa consume en múltiplos de 4 ms más 0,75 ms. Se enumeran las capturas de un hiperperiodo mcm(Tio,Tpn,4). El peor caso toma un evento inmediatamente posterior a la captura anterior. Cota conservadora Tio+0,25+Tpn+4.",
    "noModela": "Calendario determinista del banco con fases fijas. Los periodos y demoras son hipótesis del ejercicio. No se modelan jitter, reintentos ni congestión. IO-Link une el sensor al maestro. El maestro actúa como dispositivo PROFINET ante el PLC a través del switch."
  },
  "s6": [
    "IO-Link Community y Siemens STEP 7 · ciclo y actualización · https://io-link.com/share/Downloads/At-a-glance/IO-Link_System_Description_eng_2018.pdf"
  ]
});
