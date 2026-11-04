# Mecánica 275 · Balanceo de un cigüeñal de cuatro cilindros

**Integrado localmente.**

Ajusta el desfase entre pares y compara las fuerzas alternativas de dos órdenes.

Suma fasorial de cos θ y (r/L) cos 2θ con fases 0, π, π+β, β. Fuerzas escaladas por m r Ω². m=0,45 kg, r=45 mm y r/L=0,30.

Fuerzas alternativas agregadas. Se omiten momentos, torsión y combustión.

El ajuste de referencia usa 2200 y 90 en el orden de los mandos. Fuerza de primer orden entre 0 y 0.01 N. Fuerza de segundo orden entre 0 y 100 N. Régimen comprobado entre 1800 y 2800 rpm.

Código en [src/labs/mecanica-275](../../src/labs/mecanica-275), escena y simulador [balanceo-ciguenal-cuatro-cilindros.html](../../public/labs/balanceo-ciguenal-cuatro-cilindros.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 22 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/275-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 276.

## Revisión visual

37 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Las bielas y pistones muestran el desfase que cambia el alumno. La lectura de fuerzas separa primer y segundo orden.
