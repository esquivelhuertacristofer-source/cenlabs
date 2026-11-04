# Mecánica 281 · Intercambiador a contracorriente por NTU

**Integrado localmente.**

Ajusta el intercambio para enfriar la línea caliente sin exceder la temperatura de retorno.

ε=(1−e^(−NTU(1−Cr)))/(1−Cr·e^(−NTU(1−Cr))); a Cr=1, ε=NTU/(1+NTU). Cmin corresponde al flujo caliente. Entradas 80 y 20 °C. Balance sin pérdidas.

Corrientes monofásicas y propiedades constantes.

El ajuste de referencia usa 2.5 y 0.65 en el orden de los mandos. Efectividad entre 75 y 87 %. Salida caliente entre 27 y 36 °C. Salida fría entre 45 y 56 °C.

Código en [src/labs/mecanica-281](../../src/labs/mecanica-281), escena y simulador [intercambiador-contracorriente-ntu.html](../../public/labs/intercambiador-contracorriente-ntu.html), modelo [_dinamica-termofluidos.js](../../public/labs/_dinamica-termofluidos.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 57 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/281-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 282.

## Revisión visual

44 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Las dos corrientes se diferencian por color y dirección. El perfil térmico separa los extremos de entrada y salida.
