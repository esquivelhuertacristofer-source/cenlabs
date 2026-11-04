# Mecánica 292 · Bode y márgenes de estabilidad

**Simulador y revisión funcional en local. Narración pendiente.**

Dos indicadores lineales muestran entrada y salida a la frecuencia de cruce. El instrumento presenta magnitud, fase y valores de ambos márgenes. La respuesta usa una planta de tres retardos y un compensador de adelanto ideal.

La revisión numérica verifica el cruce de 0 dB por producto complejo y el cruce de fase por la parte imaginaria del denominador. Con K=8 y separación polo/cero=1, los márgenes son cero. Con K=3 y separación 3, el margen de fase es 50,48°, el de ganancia 11,02 dB y el cruce 5,28 rad/s.

Pasaron el barrido, la revisión de portada y cuatro recorridos con ensayo, reto, quiz, instrumento y TXT. Los resultados están en scripts/auditoria/.salida/control-avanzado/292-informe.json. Fuentes de la práctica en public/labs/_control-avanzado-bode.js, src/labs/mecanica-292 y scripts/auditoria/verifica-bode-margenes-estabilidad.mjs.

Retomar la narración con la lista preparada en el workspace. Siguiente práctica 293.

## Revisión visual

60 palabras de prosa inicial, contando introducción, indicación de exploración, pie de escena y primer paso de guía. Los dos indicadores permiten comparar fase. Las escalas logarítmicas quedan en el instrumento para evitar sobrecargar el inicio.
