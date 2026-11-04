# Mecánica 280 · Volante de inercia y fluctuación cíclica

**Integrado localmente.**

Dimensiona la inercia para mantener el régimen dentro de tolerancia bajo una carga pulsante.

Con ω₀=150 rpm, ω=√(ω₀²+(ΔE/J)sen θ). ΔE es la diferencia entre energías extremas. Fluctuación =100(ωmáx−ωmín)/ω₀.

Intercambio periódico de energía prescrito. Se omiten rozamiento y torsión.

El ajuste de referencia usa 0.85 y 10 en el orden de los mandos. Fluctuación pico a pico entre 0 y 6 %. Energía de referencia entre 0 y 125 J. Variación pico a pico entre 0 y 9 rpm.

Código en [src/labs/mecanica-280](../../src/labs/mecanica-280), escena y simulador [volante-inercia-fluctuacion-ciclica.html](../../public/labs/volante-inercia-fluctuacion-ciclica.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 16 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/280-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 281.

## Revisión visual

39 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El ancho del volante cambia con la inercia elegida. La diferencia de régimen es más fácil de medir en la gráfica que a ojo.
