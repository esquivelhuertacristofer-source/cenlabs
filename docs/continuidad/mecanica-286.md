# Mecánica 286 · Moody y pérdidas en una tubería

**Integrado localmente.**

Cambia caudal y rugosidad para cumplir el presupuesto de carga del circuito.

Agua ν=10⁻⁶ m²/s, D=40 mm, L=25 m y ΣK=3. Re=vD/ν. Para flujo laminar se usa f=64/Re. La rama turbulenta aplica Swamee–Jain. Pérdida (fL/D+ΣK)v²/(2g).

El tubo transparente deja ver los trazadores. Los manómetros siguen la carga restante. La transición entre Re=2300 y 4000 se interpola con fines didácticos. Los accesorios se agrupan en un único coeficiente.

El ajuste de referencia usa 1.5 y 0.001 en el orden de los mandos. Reynolds entre 50000 y 80000. Factor de Darcy entre 0.015 y 0.03. Pérdida total entre 0 y 2.5 m.

Código en [src/labs/mecanica-286](../../src/labs/mecanica-286), escena y simulador [moody-perdidas-carga-tuberia.html](../../public/labs/moody-perdidas-carga-tuberia.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 54 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/286-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 287.

## Revisión visual

37 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El tubo transparente deja ver los trazadores y los manómetros. La comparación de rugosidad se apoya en la curva de Darcy.
