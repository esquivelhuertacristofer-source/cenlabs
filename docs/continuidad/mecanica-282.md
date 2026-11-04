# Mecánica 282 · Aleta de enfriamiento y eficiencia

**Integrado localmente.**

Compara conductividad y convección para retirar calor manteniendo una punta suficientemente activa.

Aleta plana de 85×60×3 mm, base a 100 °C, aire a 22 °C. Se aproximan las caras anchas y una punta adiabática. m=√(2h/(kt)); η=tanh(mL)/(mL).

Se omite radiación y conducción por el borde.

El ajuste de referencia usa 160 y 45 en el orden de los mandos. Eficiencia entre 65 y 82 %. Temperatura en punta entre 58 y 75 °C. Calor por aleta entre 20 y 32 W.

Código en [src/labs/mecanica-282](../../src/labs/mecanica-282), escena y simulador [aleta-enfriamiento-eficiencia.html](../../public/labs/aleta-enfriamiento-eficiencia.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 26 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/282-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 283.

## Revisión visual

36 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El color de las aletas responde al cálculo de temperatura. La punta y la base se distinguen sin abrir la ficha.
