# Mecánica 284 · Refrigeración, COP y subenfriamiento

**Integrado localmente.**

Ajusta la temperatura de evaporación y el subenfriamiento para obtener más frío útil por unidad de trabajo.

Tabla CoolProp HEOS para R134a. Condensación a 40 °C, succión saturada, compresor con ηs=0,80, válvula isoentálpica h₄=h₃. COP=(h₁−h₄)/(h₂−h₁).

Ciclo estacionario, sin pérdidas de presión. Los estados se precalculan para los pasos de los mandos.

El ajuste de referencia usa -6 y 8 en el orden de los mandos. COP entre 3.75 y 4.3. Frío útil entre 145 y 170 kJ/kg. Trabajo de compresión entre 34 y 42 kJ/kg.

Código en [src/labs/mecanica-284](../../src/labs/mecanica-284), escena y simulador [refrigeracion-cop-subenfriamiento.html](../../public/labs/refrigeracion-cop-subenfriamiento.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 50 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/284-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 285.

## Revisión visual

39 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. La válvula y los dos intercambiadores se diferencian por forma. Las lecturas de entalpía permiten seguir cada etapa.
