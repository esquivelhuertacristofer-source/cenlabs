# Mecánica 294 · Servo con tres lazos en cascada

**Integrado localmente con cuatro recorridos funcionales aprobados.**

Un carro de correa muestra la posición del accionamiento. La orden permite ajustar la ganancia de posición y la rapidez del lazo de velocidad. El instrumento separa las consignas y lecturas de posición, velocidad y corriente, con un escalón de carga al segundo dos.

El verificador comprueba el límite de las consignas, la aplicación de la carga, el error de equilibrio y la convergencia al reducir el paso. El ajuste de referencia tiene 0,00314 rad de sobreimpulso, 0,0125 rad de error bajo carga y 2,956 A de pico.

Archivos en src/labs/mecanica-294, public/labs/_control-avanzado-cascada.js y scripts/auditoria/verifica-servo-posicion-velocidad-corriente.mjs. Barrido y captura de portada completados. Evidencia de 1366, 1600, 2020 y 390 px en scripts/auditoria/.salida/control-avanzado/294-informe.json. Narración de estudio pendiente. Siguiente 295.

## Revisión visual

58 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. La correa y el carro muestran una posición física. Las tres señales se distinguen en el registro de cascada.
