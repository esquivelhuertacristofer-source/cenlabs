# Mecánica 276 · Aislamiento vibratorio de máquina

**Integrado localmente.**

Elige apoyos para reducir la fuerza transmitida y respetar el hundimiento estático permitido.

Máquina de 48 kg a 12 Hz. fₙ=√(k/m)/(2π), flecha mg/k y transmisibilidad √[1+(2ζr)²]/√[(1−r²)²+(2ζr)²].

Excitación armónica y rigidez equivalente. El movimiento visual se amplifica.

El ajuste de referencia usa 75 y 0.1 en el orden de los mandos. Fuerza transmitida / excitación entre 0 y 0.55. Flecha estática entre 0 y 8 mm. Frecuencia natural entre 4 y 7 Hz.

Código en [src/labs/mecanica-276](../../src/labs/mecanica-276), escena y simulador [aislamiento-vibratorio-maquina.html](../../public/labs/aislamiento-vibratorio-maquina.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 47 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/276-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 277.

## Revisión visual

38 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El banco de máquina sobre cuatro apoyos concentra la vista en el aislamiento. La flecha estática y el movimiento se exageran para que se distingan.
