# Mecánica 271 · Vibración libre de un carro

**Integrado localmente.**

Cambia la masa y el amortiguamiento para llevar un carro perturbado al equilibrio.

m x″+c x′+100x=0. x(0)=50 mm y x′(0)=0. ζ=c/(2√km).

Un grado de libertad, respuesta lineal y amortiguamiento viscoso.

El ajuste de referencia usa 4 y 40 en el orden de los mandos. Frecuencia natural entre 0.5 y 1.4 Hz. Razón de amortiguamiento entre 0.9 y 1.1. Desplazamiento al final entre -1 y 1 mm.

Código en [src/labs/mecanica-271](../../src/labs/mecanica-271), escena y simulador [masa-resorte-amortiguador-libre.html](../../public/labs/masa-resorte-amortiguador-libre.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 10 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/271-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 272.

## Revisión visual

35 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El resorte dorado y el amortiguador se distinguen bien. El encuadre de inspección permite seguir la compresión sin el pórtico.
