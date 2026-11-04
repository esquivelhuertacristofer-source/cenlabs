# Mecánica 290 · Tobera convergente-divergente con choque

**Integrado localmente.**

Controla la contrapresión para ubicar un choque normal dentro de la sección divergente.

Aire perfecto γ=1,4. Ecuación área–Mach en ramas sub y supersónica, y salto normal con caída de presión total. Se busca la posición que reproduce la contrapresión. Si el choque queda fuera, se muestra solo el flujo interno.

Aire perfecto, flujo cuasiunidimensional y choque estacionario sin pérdidas de capa límite.

El ajuste de referencia usa 2.5 y 0.7 en el orden de los mandos. Mach de salida entre 0.26 y 0.45. Posición del choque entre 63 y 87 %. Régimen con choque interno = 1.

Código en [src/labs/mecanica-290](../../src/labs/mecanica-290), escena y simulador [tobera-laval-choque-normal.html](../../public/labs/tobera-laval-choque-normal.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 39 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/290-informe.json.

Narración de estudio pendiente. A continuación corresponde la revisión conjunta.

## Revisión visual

42 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. La geometría de la garganta cambia con el área relativa. El anillo rojo marca el choque interno y la presión se comprueba en el instrumento.
