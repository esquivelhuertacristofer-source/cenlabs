# Mecánica 287 · Turbina Pelton y cantidad de movimiento

**Integrado localmente.**

Ajusta la velocidad periférica para aprovechar el chorro sin sacrificar el empuje útil.

Chorro de 14 mm, v=√(2gH), u=bv. Fuerza ρQ(v−u)(1+0,85cos15°), potencia Fu. Eficiencia respecto a energía cinética del chorro. Modelo sin pérdidas mecánicas externas.

Chorro ideal y desviación de 165°. Se omiten fugas y pérdidas mecánicas.

El ajuste de referencia usa 65 y 0.5 en el orden de los mandos. Potencia al rodete entre 2.5 y 4 kW. Eficiencia del rodete entre 88 y 95 %. Fuerza tangencial entre 140 y 205 N.

Código en [src/labs/mecanica-287](../../src/labs/mecanica-287), escena y simulador [turbina-pelton-cantidad-movimiento.html](../../public/labs/turbina-pelton-cantidad-movimiento.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 50 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/287-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 288.

## Revisión visual

38 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Las cucharas se distinguen alrededor del rodete. La relación entre las velocidades del chorro y la rueda se lee en el instrumento.
