# Mecánica 277 · Análisis modal de una viga en voladizo

**Integrado localmente.**

Cambia la longitud y busca un modo fuera de la banda de vibración de la máquina.

Euler–Bernoulli: f=β²√(EI/ρA)/(2πL²), β=1,8751; 4,6941; 7,8548. Acero E=200 GPa, ρ=7850 kg/m³, espesor 12 mm.

Viga uniforme de Euler–Bernoulli. La escena escala la amplitud y ralentiza la frecuencia.

El ajuste de referencia usa 1 y 2 en el orden de los mandos. Frecuencia modal entre 45 y 80 Hz. Longitud de la probeta entre 0.8 y 1.2 m. Modo solicitado = 2.

Código en [src/labs/mecanica-277](../../src/labs/mecanica-277), escena y simulador [modos-propios-viga-voladizo.html](../../public/labs/modos-propios-viga-voladizo.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 34 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/277-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 278.

## Revisión visual

38 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. La probeta delgada necesita el acercamiento de inspección. Los segmentos, el sensor y la gráfica permiten localizar los nodos.
