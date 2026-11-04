# Mecánica 279 · Impacto, restitución y energía

**Integrado localmente.**

Ajusta la altura de caída y el material de contacto para contener el rebote sin perder energía de ensayo.

Masa de 2 kg y caída sin rozamiento. v=√(2gh), rebote a e·v, altura e²h y energía disipada 2gh(1−e²). La escena ralentiza caída y rebote en escalas distintas.

Impacto vertical, placa rígida y un rebote visible. La escena ralentiza ambos tramos.

El ajuste de referencia usa 0.8 y 0.5 en el orden de los mandos. Velocidad antes del impacto entre 3 y 5 m/s. Altura de rebote entre 0 y 0.25 m. Energía disipada entre 10 y 20 J.

Código en [src/labs/mecanica-279](../../src/labs/mecanica-279), escena y simulador [impacto-restitucion-energia.html](../../public/labs/impacto-restitucion-energia.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 25 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/279-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 280.

## Revisión visual

46 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Las guías explican la trayectoria del percutor. La regla luminosa conserva a la vista la altura de rebote aunque la pieza ya haya bajado.
