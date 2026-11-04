# Mecánica 289 · Radio crítico de aislamiento

**Integrado localmente.**

Comprueba cuándo añadir una capa delgada puede aumentar la pérdida de calor.

Tubo de 8 mm de radio, aislamiento k=0,045 W/(m·K) y ΔT=58 K. Resistencia por metro R=ln(r₂/r₁)/(2πk)+1/(2πr₂h), con rcr=k/h. Se omiten radiación y resistencias interiores.

Convección constante y flujo radial unidimensional, sin radiación.

El ajuste de referencia usa 12 y 3 en el orden de los mandos. Radio crítico entre 12 y 20 mm. Pérdida de calor entre 8 y 12 W/m. Aumento frente a tubo desnudo entre 5 y 18 %.

Código en [src/labs/mecanica-289](../../src/labs/mecanica-289), escena y simulador [radio-critico-aislamiento-tuberia.html](../../public/labs/radio-critico-aislamiento-tuberia.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 39 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/289-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 290.

## Revisión visual

38 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El corte por aros permite ver el diámetro exterior y el tubo interior. La gráfica muestra si el espesor elegido está antes o después del máximo.
