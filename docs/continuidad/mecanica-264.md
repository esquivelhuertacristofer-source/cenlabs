# mecanica-264 · Planetario: bloqueos y tabla de velocidades

**Implementación y revisión individual completas. Local, sin commit ni publicación del bloque B.** Pendiente la batería del conjunto estable 261–270.

## Diferencia respecto del catálogo
Frente al127 (tren híbrido y reparto de potencia), aquí se decide qué miembro inmovilizar y se construye una tabla de velocidades; no se simula gestión híbrida.

## Modelo y límites
Sol zs=24, tres planetas zp=24 y corona zr=72; módulo 3 mm, ángulo de presión de 20°. Geometría: zr=zs+2zp y (zs+zr)/3=32 entero. Willis: zs ns+zr nr=(zs+zr) nc. Portador fijo: nc=0, entra ns; corona fija: nr=0, entra ns; sol fijo: ns=0, entra nr. Planeta: np=nc−(zs/zp)(ns−nc). Órbita de radio m(zs+zp)/2. Fase absoluta del planeta i: θp+(zs+zp)φi/zp+π/zp, φi=2πi/3. La corona tiene involuta interna; sol y planetas, externa. Rodillos exteriores: θrod=−Rexterior θcorona/Rrod.

Cinemática ideal sin juego dinámico, inercia, par, pérdidas ni análisis de resistencia. Giro mostrado ×1/100; los valores en rpm son reales. Pie de diente simplificado, sin trocoide; juego geométrico transversal de 0,05 mm para separar flancos. Cada cambio de mando reinicia la demostración; no simula un cambio de marcha con embragues bajo carga. Apoyos y jaula son didácticos, sin diseño de tolerancias ni certificación. Los rodillos exteriores ruedan idealmente sin deslizamiento.

## Archivos y continuación
`public/labs/_elementos-*.js`, `planetario-tabla-velocidades.html`, `_ficha-planetario-tabla-velocidades.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-264/`. Fuente: https://mechanics.ju.se/MachineElements/planetary-gears.html

## Verificación individual · 1 de noviembre de 2026

708.171 comprobaciones propias; 1.089.796 acumuladas en 261–264. Incluyen velocidades de Willis para tres bloqueos, igualdad de velocidad tangencial en ambos contactos, posiciones de órbita, fases de dientes, montaje de tres planetas y muestreo de penetración entre sol/planetas/corona. Referencias: Jönköping University, capítulo9.8, y KG Technical Data p117. Se usa y comprueba la igualdad geométrica zr=zs+2zp; no se copia la agrupación tipográfica ambigua del texto extraído de KG.

Cuatro recorridos completos correctos: 1366×768, 1600×900, 2020×1055 DPR1,25 y 390×844. Firma individual `d36358a3bda93a8d38fa9a37adc84770b050ddd162356da6dc986257f9176dd9`. Se prueban orden, adquisición, reto, quiz barajado, tres diagnósticos, tabla y barras, TXT con «Bloqueo: Corona», ficha, calidad y arrastre. Extremos/centros de mandos: fases de sol/corona/portador, posiciones y giro de planetas, pasadores unidos, rodadura de apoyos y 72 dientes internos contados a partir de los vértices reales. Sin errores de consola, normales nulas ni NaN; 58 llamadas, 128.302 triángulos, 65 palabras; encuadre64,998–65 % en los cuatro tamaños. Barrido oficial sano.

Se corrigió un problema real de encuadre: la caja local de una corona circular, al rotarse, aparentaba crecer. El 264 encuadra con vértices reales de mundo al cambiar vista/mandos/tamaño; la cámara no se mueve ni escanea vértices durante cada frame. `_insignia-auto.js` sólo amplía el objeto retornado con `controls`; el comportamiento anterior se conserva. `_industria-runtime.js` admite un formateador opcional de parámetros para que el TXT use el nombre del miembro; los labs anteriores no lo activan. Regresión completa del 250 después de ambos cambios: correcta, cero errores y 39 llamadas; informe copiado a la carpeta B. Repetir además una práctica A y la batería global al cierre.

Autocrítica visual: vistas inicial e inspección muestran todos los engranajes; la jaula y sus pasadores permiten distinguir giro y órbita. La tabla de velocidades es legible y mantiene los signos; no hay cifras dentro del3D. Móvil y calidad revisados sin recortes ni panel inicial con scroll. El bloqueo inicial del sol mantiene el conjunto orbitando desde la apertura. Portada propia revisada: `public/images/mecanica/prac_264.webp`. Modelo sin par ni dinámica de cambio de marcha; no presentarlo como simulación de una transmisión automática completa.

15 clips con Qwen3-TTS, molde_consignas_4, lote8/una toma; duración y hashes correctos. Manifiesto179→180; 7.765 MP3 totales, anteriores preservados. Evidencia local: `scripts/auditoria/.salida/elementos-261-270/264-informe.json`, capturas, voz-264.json y regresion-250.json.

Retomar en265: cojinete hidrodinámico de aceite, modelo de cojinete corto, película mínima y fricción. No repetir238 (aerostático). PDF primario NACA TN2808 ya descargado y leído: presión p13–15 y fricción p16–17 del PDF. La aproximación original usa perfil circunferencial lineal; usar fricción de Couette integrada 360°, sin añadir silenciosamente el término de gradiente de presión que aparece en las notas preliminares. Repetir la batería de los diez labs con firma estable antes de cerrar el bloque B.

QA 1366×768 DPR1: inicio correctos; revisión c941e8272023297403f67651dcc46d429ecf3f06d1341b4dc5a2fa6cad094898; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio correctos; revisión e05e69c6b557e834262950a67b48299e656a33345b8df6fc3bcec56d18e48369; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión d36358a3bda93a8d38fa9a37adc84770b050ddd162356da6dc986257f9176dd9; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión d36358a3bda93a8d38fa9a37adc84770b050ddd162356da6dc986257f9176dd9; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión d36358a3bda93a8d38fa9a37adc84770b050ddd162356da6dc986257f9176dd9; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión d36358a3bda93a8d38fa9a37adc84770b050ddd162356da6dc986257f9176dd9; normales cero=0, sin errores ni desbordamiento.

1 noviembre: portada regenerada con HUD anidado oculto y revisada visualmente. En263 esto también incorpora el ajuste de eje/taladro descrito previamente. No equivale a publicación ni al cierre global de B.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.
