# mecanica-262 · Soldadura y remaches: carga excéntrica

**Implementación y revisión individual completas. Local, sin commit ni publicación del bloque B.** Falta la batería global del conjunto estable 261–270.

## Diferencia respecto del catálogo
Compara capacidad y equilibrio de grupos excéntricos. Distinto de 165/212/234: estos enseñan formación de pepita, cordón y energía de soldadura; aquí se comprueba una unión terminada bajo una carga fuera de su centro.

## Modelo y límites
F vertical descendente aplicada en x=e; M=−Fe. Cuatro remaches iguales de d=8 mm en (±40,±60) mm; Jp=Σ(x²+y²). Fuerzas transmitidas: fx=−My/Jp, fy=−F/4+Mx/Jp; τ=|f|/(πd²/4). Dos cordones verticales de longitud L=120 mm en x=±40 mm y garganta a=4 mm; Jℓ=2Lx²+L³/6. τx=−My/(aJℓ), τy=−F/(2aL)+Mx/(aJℓ). Máximo en los extremos de los cordones. Utilización=max(τsold/60 MPa,τrem/100 MPa).

Método elástico de grupo, placa rígida y carga en su plano. Soldadura idealizada como líneas de garganta uniforme; remaches iguales en cortante simple. No se evalúan aplastamiento, desgarro de placa, fatiga, deslizamiento, tensiones residuales ni resistencia última por centro instantáneo. Los límites de 60 y 100 MPa son del escenario, no valores normativos. Cordón ampliado para mostrar su superficie; flechas locales proporcionales al esfuerzo en los cordones (1×10⁻⁸ unidades/Pa) y a la fuerza en los remaches (6×10⁻⁵ unidades/N); no se comparan sus longitudes entre sistemas. Demostración cuasiestática de 8 s entre 50 y 100 % de carga; no deformación de rotura.

## Archivos y continuación
`public/labs/_elementos-*.js`, `union-excentrica-soldadura-remache.html`, `_ficha-union-excentrica-soldadura-remache.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-262/`. Fuente: https://www.aisc.org/media/xj2jhret/nsba_routinebridgedesignguide.pdf

## Verificación individual · 31-10-2026

153 comprobaciones propias correctas (7.998 acumuladas con261): valores de referencia, suma de fuerzas y momento del grupo de remaches, cuadratura independiente de las dos líneas soldadas (4.000 elementos por caso) y proporcionalidad con carga. Referencias primarias: NASA RP-1228, PDF21, y AISC/NSBA Guide to Navigating Routine Steel Bridge Design, análisis elástico de grupos; sin atribuir los límites didácticos a una norma.

4/4 recorridos completos correctos en 1366×768, 1600×900, 2020×1055 DPR1,25 y 390×844. Firma individual `17664b4681a3ef0dab9bcfc977f168c4ea51f5c911ab549ecdd1409a311db859`. Orden, adquisición, validación, quiz barajado, tres diagnósticos, informe TXT, curvas, ficha, calidad media y arrastre. Nueve combinaciones de extremos/centros en escritorio y móvil: vectores reales de flechas y alcance de brazo contrastados con modelo. Cero normales nulas, NaN y errores de consola; 39 llamadas, 29.634 triángulos, 55 palabras de prosa, 65 % de encuadre de escritorio y 61,25 % móvil. Barrido oficial sano.

Portada262 revisada. Inspección, móvil, calidad media e instrumento vistos: se distinguen cordones y cabezas de remaches; colores de flechas separan las dos alternativas, sin comparar sus escalas distintas. Se detectó y corrigió un recorte en inspección reservando el volumen de flechas a carga máxima al cambiar vista/control; la cámara queda quieta durante el ciclo. Los datos permanecen en un instrumento fuera del3D. No se simula una rotura inventada.

15 clips con Qwen3-TTS, molde_consignas_4, lote8/una toma; duración y hashes comprobados. Manifiesto177→178; 7.735 audios totales, preservados los anteriores. Evidencia `scripts/auditoria/.salida/elementos-261-270/`, voz-262.json y portada `public/images/mecanica/prac_262.webp`.

Retomar en263: geometría helicoidal de involuta, empuje axial y recubrimiento de dientes. Pendientes del bloqueB: ocho labs, pruebas globales, repetición sobre módulos estables, commit y despliegue. La incorporación de siguientes definiciones cambiará la firma global; conservar esta evidencia como individual histórica, sin relabelarla.

QA 1366×768 DPR1: inicio correctos; revisión 60f76d13988e47635368660a35c8e27ee5f06ec27f07afa0747e2461f6fb1e29; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio correctos; revisión 81b4d203eaf3c52c3abab3d9abc2d3885750f0b3bf4eba9244512326008c0401; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 17664b4681a3ef0dab9bcfc977f168c4ea51f5c911ab549ecdd1409a311db859; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 17664b4681a3ef0dab9bcfc977f168c4ea51f5c911ab549ecdd1409a311db859; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 17664b4681a3ef0dab9bcfc977f168c4ea51f5c911ab549ecdd1409a311db859; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 17664b4681a3ef0dab9bcfc977f168c4ea51f5c911ab549ecdd1409a311db859; normales cero=0, sin errores ni desbordamiento.

1 noviembre: portada regenerada con HUD anidado oculto y revisada visualmente. En263 esto también incorpora el ajuste de eje/taladro descrito previamente. No equivale a publicación ni al cierre global de B.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.
