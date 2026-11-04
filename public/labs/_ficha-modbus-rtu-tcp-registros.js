fichaTecnica({
  "title": "Modbus RTU y TCP en un banco de PLC",
  "intro": "El PLC pide tres registros al variador. La respuesta depende de la dirección y de que la trama llegue íntegra.",
  "s1": {
    "presentes": "PLC, variador y analizador hexadecimal de peticiones y respuestas.",
    "omitidos": [
      "Banco virtual de lectura. Direcciones PDU sin desplazamiento 40001. El mapa y la unidad 7 pertenecen a este escenario. La animación amplía el tiempo de transferencia y no representa latencia de red. El error RTU se inyecta tras calcular el CRC."
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
        "Función 03 y cantidad 3. Los campos de 16 bits del PDU llevan el byte alto primero. RTU antepone unidad y añade CRC-16 Modbus (inicial 0xFFFF, polinomio reflejado 0xA001, byte bajo primero). TCP usa MBAP con transacción 0x1024, protocolo 0 y longitud que incluye unidad y PDU. Un rango ausente responde 83 02. La trama RTU con un bit alterado falla CRC y se descarta.",
        "Modelo didáctico"
      ],
      [
        "Escena",
        "Transferencia ampliada · verde para respuesta normal",
        "Escala del banco"
      ]
    ]
  },
  "s3": [
    "Recupera velocidad, temperatura y estado del equipo por TCP. El mapa del variador comienza esas tres lecturas en la dirección PDU 107."
  ],
  "s4": {
    "intro": "Procedimiento",
    "items": [
      "Localiza el inicio del mapa solicitado.",
      "Compara una lectura RTU, TCP y una trama RTU alterada.",
      "Ensaya la lectura correcta y explica sus bytes."
    ]
  },
  "s5": {
    "modela": "Función 03 y cantidad 3. Los campos de 16 bits del PDU llevan el byte alto primero. RTU antepone unidad y añade CRC-16 Modbus (inicial 0xFFFF, polinomio reflejado 0xA001, byte bajo primero). TCP usa MBAP con transacción 0x1024, protocolo 0 y longitud que incluye unidad y PDU. Un rango ausente responde 83 02. La trama RTU con un bit alterado falla CRC y se descarta.",
    "noModela": "Banco virtual de lectura. Direcciones PDU sin desplazamiento 40001. El mapa y la unidad 7 pertenecen a este escenario. La animación amplía el tiempo de transferencia y no representa latencia de red. El error RTU se inyecta tras calcular el CRC."
  },
  "s6": [
    "Modbus Organization · Application Protocol y Serial Line Guide · https://www.modbus.org/modbus-specifications"
  ]
});
