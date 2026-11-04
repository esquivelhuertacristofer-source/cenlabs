# Mecánica 295 · Modbus RTU y TCP

**Integrado localmente.**

Valida FC03 en la unidad 7. Simula tramas RTU con CRC16 y TCP con encabezado MBAP. La lectura a partir de 107 devuelve 1450, 235 y 24. Permite provocar excepción 83 02 y ausencia de respuesta por CRC inválido.

Código en [src/labs/mecanica-295](../../src/labs/mecanica-295), escena y simulador [modbus-rtu-tcp-registros.html](../../public/labs/modbus-rtu-tcp-registros.html), modelo [_control-avanzado-modbus.js](../../public/labs/_control-avanzado-modbus.js).

Cuatro recorridos completados a 1366, 1600, 2020 y 390 px, con geometría sana y exportación de informe. Evidencia local en scripts/auditoria/.salida/control-avanzado/295-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 296.

## Revisión visual

54 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Las tramas se ven primero como intercambio entre dispositivos. El panel hexadecimal muestra los bytes que explican una excepción.
