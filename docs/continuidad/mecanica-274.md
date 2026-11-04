# Mecánica 274 · Absorbedor dinámico sintonizado

**Integrado localmente.**

Sintoniza la masa secundaria para descargar la máquina sin multiplicar el recorrido del absorbedor.

Rigideces k₁=1 y k₂=μr². A ω=1, se resuelve la matriz dinámica compleja con masas 1 y μ, y c₁=0,1. El absorbedor ideal carece de amortiguador propio.

Acoplamiento lineal y excitación sinusoidal, sin topes.

El ajuste de referencia usa 1 y 0.22 en el orden de los mandos. Amplitud principal entre 0 y 0.4 rel.. Amplitud secundaria entre 0 y 6 rel.. Razón de masa entre 0.15 y 0.3.

Código en [src/labs/mecanica-274](../../src/labs/mecanica-274), escena y simulador [absorbedor-dinamico-sintonizado.html](../../public/labs/absorbedor-dinamico-sintonizado.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 12 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/274-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 275.

## Revisión visual

39 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Las dos masas se distinguen por color. El resorte inferior debe seguir uniendo ambas masas durante los extremos de la carrera.
