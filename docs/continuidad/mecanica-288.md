# Mecánica 288 · Compresión politrópica con interenfriamiento

**Integrado localmente.**

Reparte la relación de presión entre etapas para bajar el trabajo y la temperatura de descarga.

Aire ideal, n=1,30, R=0,287 kJ/(kg·K). Etapas iguales, retorno ideal a 298 K entre etapas. w=N·nR(T₂−T₁)/(n−1), T₂/T₁=(p₂/p₁)^((n−1)/n).

Etapas iguales e interenfriadores ideales, sin pérdidas de carga.

El ajuste de referencia usa 10 y 3 en el orden de los mandos. Trabajo específico entre 190 y 235 kJ/kg. Temperatura de etapa entre 65 y 110 °C. Ahorro frente a una etapa entre 13 y 24 %.

Código en [src/labs/mecanica-288](../../src/labs/mecanica-288), escena y simulador [compresion-politropica-interenfriamiento.html](../../public/labs/compresion-politropica-interenfriamiento.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 19 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/288-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 289.

## Revisión visual

43 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Las etapas se presentan en línea. La curva de temperatura deja más claro dónde se enfría el aire antes de la siguiente etapa.
