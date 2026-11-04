# Mecánica 285 · Bomba centrífuga y margen NPSH

**Integrado localmente.**

Encuentra un punto de operación útil y conserva margen frente a cavitación.

Curvas sintéticas H_b=28(n/1800)²−0,027Q² y H_s=7+kQ². NPSHa=6,5−0,005Q² y NPSHr=1,2+0,004Q². Q en m³/h. El punto de operación iguala alturas.

Curvas de enseñanza y NPSH sintético. No son datos de selección de un fabricante.

El ajuste de referencia usa 1750 y 0.021 en el orden de los mandos. Caudal de operación entre 18 y 22 m³/h. Altura de operación entre 12 y 18 m. Margen NPSH entre 1.3 y 4 m.

Código en [src/labs/mecanica-285](../../src/labs/mecanica-285), escena y simulador [bomba-centrifuga-curva-npsh.html](../../public/labs/bomba-centrifuga-curva-npsh.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 35 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/285-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 286.

## Revisión visual

37 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El impulsor ocupa el foco del plano. El cruce de curvas y el margen NPSH se verifican con las lecturas, no con el aspecto del impulsor.
