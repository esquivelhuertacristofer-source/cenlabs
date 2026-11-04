# Mecánica 278 · Órbita de eje y holgura radial

**Integrado localmente.**

Reduce la excursión de la órbita para conservar un margen antes de rozar el cojinete.

Modelo cinemático: radio efectivo min(e,c). El margen c−e es negativo si la órbita libre rebasa el casquillo. El centro recorre una circunferencia, sin resolver fuerzas de contacto ni dinámica de película.

Órbita geométrica prescrita. Se omiten presión del aceite y desgaste.

El ajuste de referencia usa 65 y 45 en el orden de los mandos y conserva 20 µm de margen. Se pide una holgura entre 45 y 80 µm, órbita efectiva entre 25 y 50 µm y margen radial entre 10 y 50 µm.

Código en [src/labs/mecanica-278](../../src/labs/mecanica-278), escena y simulador [orbita-eje-holgura-cojinete.html](../../public/labs/orbita-eje-holgura-cojinete.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 17 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/278-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 279.

## Revisión visual

40 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. El corte visual concentra la atención en los casquillos. La órbita del instrumento distingue el desplazamiento de la holgura total.
