# Mecánica 283 · Ciclo Rankine y sobrecalentamiento

**Integrado localmente.**

Ajusta presión y temperatura de la caldera para obtener trabajo sin degradar demasiado la calidad a la salida de la turbina.

Tabla CoolProp IF97 de agua. Condensador a 10 kPa, bomba ideal con vΔp, expansión isentrópica. x=(s₃−sf)/(sg−sf), h₄=hf+x(hg−hf). η=(h₃−h₄−h₂+h₁)/(h₃−h₂).

Ciclo estacionario ideal. Los estados se precalculan para los pasos de los mandos.

El ajuste de referencia usa 7 y 550 en el orden de los mandos. Eficiencia térmica entre 37 y 45 %. Calidad a la salida entre 83 y 95 %. Trabajo neto entre 1200 y 1500 kJ/kg.

Código en [src/labs/mecanica-283](../../src/labs/mecanica-283), escena y simulador [ciclo-rankine-presion-sobrecalentamiento.html](../../public/labs/ciclo-rankine-presion-sobrecalentamiento.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 54 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/283-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 284.

## Revisión visual

47 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El vapor, la caldera y la turbina tienen un recorrido reconocible. Para comparar entalpías conviene usar el instrumento de estados.
