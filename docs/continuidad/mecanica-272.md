# Mecánica 272 · Resonancia forzada y transmisibilidad

**Integrado localmente.**

Mueve la frecuencia del excitador y reconoce cuándo amplifica la fuerza que llega a la base.

Con r=ω/ωn, D=√[(1−r²)²+(2ζr)²]. Amplificación 1/D y transmisibilidad de fuerza √[1+(2ζr)²]/D.

Régimen armónico estacionario y rigidez lineal.

El ajuste de referencia usa 2 y 0.15 en el orden de los mandos. Amplificación de desplazamiento entre 0 y 0.5. Fuerza transmitida / excitación entre 0 y 0.5. Desfase entre 120 y 180 °.

Código en [src/labs/mecanica-272](../../src/labs/mecanica-272), escena y simulador [resonancia-forzada-transmisibilidad.html](../../public/labs/resonancia-forzada-transmisibilidad.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 13 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/272-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 273.

## Revisión visual

39 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El disco excéntrico da una causa visible a la respuesta. La comparación de fuerzas se lee en el instrumento.
