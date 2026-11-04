# Mecánica 273 · Velocidad crítica de rotor giroscópico

**Integrado localmente.**

Cruza el mapa de velocidades y observa cómo se separan las ramas de precesión.

Modelo adimensional de rotor isotrópico. σ±=(√(4+g²r²)±gr)/2, r=Ω/Ω₀ y Ω₀=1500 rpm. Órbita estimada con una rama directa equivalente, ζ=0,07 y desequilibrio proporcional a r².

Modelo modal didáctico y movimiento transversal isotrópico. La órbita usa una aproximación de rama dominante.

El ajuste de referencia usa 900 y 0.25 en el orden de los mandos. Amplitud de órbita entre 0 y 0.2 mm. Rama directa equivalente entre 1580 y 2200 rpm. Rama inversa equivalente entre 1000 y 1499 rpm.

Código en [src/labs/mecanica-273](../../src/labs/mecanica-273), escena y simulador [velocidad-critica-rotor-giroscopico.html](../../public/labs/velocidad-critica-rotor-giroscopico.html), modelo [_dinamica-vibraciones.js](../../public/labs/_dinamica-vibraciones.js).

Pasa el barrido de los dos mandos y la comprobación del ajuste de referencia en [verifica-vibraciones-termofluidos.mjs](../../scripts/auditoria/verifica-vibraciones-termofluidos.mjs). Pasó cuatro recorridos de navegador a 1366, 1600, 2020 y 390 px. En el estado inicial se observaron hasta 26 llamadas de dibujo, sin normales en cero. Evidencia local en scripts/auditoria/.salida/control-avanzado/273-informe.json.

Narración de estudio pendiente. El siguiente banco del plan es 274.

## Revisión visual

39 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Los dos discos del rotor se reconocen desde el inicio. La precesión es un desplazamiento amplificado y se interpreta mejor con el diagrama de Campbell.
