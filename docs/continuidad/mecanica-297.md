# Mecánica 297 · Variador con rampas y límite de corriente

**Integrado localmente.**

Ventilador en banco, consigna en rampa y comparación entre corriente solicitada y aplicada. El ajuste de 650 rpm/s y 4 A llega a 3,490 A de pico y se detiene dentro de la banda en 1,82 s.

Código en [src/labs/mecanica-297](../../src/labs/mecanica-297), escena y simulador [variador-plc-rampas-corriente.html](../../public/labs/variador-plc-rampas-corriente.html), modelo [_control-avanzado-variador.js](../../public/labs/_control-avanzado-variador.js).

Cuatro recorridos completados a 1366, 1600, 2020 y 390 px, con geometría sana y exportación de informe. Evidencia local en scripts/auditoria/.salida/control-avanzado/297-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 298.

## Revisión visual

57 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El ventilador permite seguir el cambio de velocidad. El testigo de límite dirige la atención a la diferencia entre corriente pedida y aplicada.
