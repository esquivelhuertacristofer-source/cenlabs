# mecanica-266 · Rodamientos: selección por carga y vida

**Revisión individual completa. Local, sin commit, push ni publicación; cierre global B pendiente.**

## Diferencia respecto del catálogo
Distinto181 (FFT de daño) y215 (montaje térmico): selección de catálogo por capacidad y envolvente con la misma interfaz de eje.

## Modelo y límites
Datos de NSK Industrial Motor Bearings, PDF p23, misma edición: 6005 d/D/B=25/47/12 mm, C=10.600 N, C0=5850 N, f0=14,5; 6205 25/52/15 mm, C=14.700 N, C0=7850 N, f0=13,9; 6305 25/62/17 mm, C=21.600 N, C0=11.200 N, f0=13,2. Fa=400 N, n=1500 rpm. Se interpolan linealmente e,Y de la tabla con u=f0Fa/C0. Si Fa/Fr≤e: P=Fr; si supera e: P=max(Fr,0,56Fr+YFa), cota conservadora para el redondeo de la tabla. L10=(C/P)³ en millones de vueltas; L10h=10⁶L10/(60n). P0=max(Fr,0,6Fr+0,5Fa), s0=C0/P0. Cinemática ilustrativa radial sin deslizamiento, contacto α=0: Rp=(d+D)/4, radio bola rb=0,14(D−d); Ωc=Ωi(1−rb/Rp)/2 y giro absoluto de bola Ωb=−ΩcRp/rb. Giro ×1/200.

L10 representa 90% de supervivencia de una población bajo carga constante y condiciones nominales, no fecha garantizada de fallo. No incluye contaminación, lubricación, confiabilidad modificada, juego, desalineación ni carga variable. Datos de una edición fija, sin mezclar capacidades actuales de otras variantes. El encabezado kN del PDF es inconsistente con sus cifras enteras: se usan como N (14.700 N=14,7 kN). Dimensiones exteriores y agujero a escala; interiores, número de bolas (10/9/8), pistas y jaula esquemáticos, no CAD del fabricante. La carga axial entra en P, pero la escena usa cinemática radial ideal con α=0; no muestra deformación Hertz ni ángulo de contacto bajo carga. Flecha dorada radial, escala0,00030 unidades/N; turquesa axial, escala0,0008 unidades/N. No se anima una rotura al alcanzar L10.

## Archivos y continuación
`public/labs/_elementos-*.js`, `rodamiento-carga-vida-l10.html`, `_ficha-rodamiento-carga-vida-l10.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-266/`. Fuente: https://www.nsk.com/content/dam/nsk/am/en_us/documents/bearings-americas/Industrial-Motor-Bearings.pdf

Pendientes: pruebas físicas, flujos de navegador en cuatro tamaños, revisar geometría en ambos estados de contacto, voz, portada y pruebas globales del bloque. No pasar a terminado por compilar.

QA 1366×768 DPR1: inicio correctos; revisión f4acc15ac2ffc0b1f67d1461929bf6d953711fa1198fffd7b60d2e911cb23c15; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 88a198d4c65abbaf0cc7bfdabffbff70bd96602801e7a4822be13db26d13d339; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 90481dbed51e8c132a0a7ed10d0781bf7ed25ebfc4fdc4daf543e0e535c7650b; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 90481dbed51e8c132a0a7ed10d0781bf7ed25ebfc4fdc4daf543e0e535c7650b; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 90481dbed51e8c132a0a7ed10d0781bf7ed25ebfc4fdc4daf543e0e535c7650b; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 90481dbed51e8c132a0a7ed10d0781bf7ed25ebfc4fdc4daf543e0e535c7650b; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 4a9d58549edce229c85c4b8201b183e8b0fda672b8b705caade03ca2bfb05874; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 4a9d58549edce229c85c4b8201b183e8b0fda672b8b705caade03ca2bfb05874; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 3edfcd37f45bb322080aa8fec81bf53daff1ec7f694caa6f9856b421686776de; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 3edfcd37f45bb322080aa8fec81bf53daff1ec7f694caa6f9856b421686776de; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 3edfcd37f45bb322080aa8fec81bf53daff1ec7f694caa6f9856b421686776de; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 3edfcd37f45bb322080aa8fec81bf53daff1ec7f694caa6f9856b421686776de; normales cero=0, sin errores ni desbordamiento.

## Revisión individual · 1 noviembre2026

28.809 comprobaciones numéricas: anclas de la tabla NSK, factores, cambios de rama, vida/carga, equilibrio de velocidades de contacto, separación de bolas y jaula, perfiles de pistas y criterios. Cuatro recorridos completos con firma3edfcd37f45bb322080aa8fec81bf53daff1ec7f694caa6f9856b421686776de: orden/ensayo/reto/quiz/diagnósticos/instrumentos/TXT/ficha/calidad/arrastre real. Dimensiones de malla, giros, posiciones y conteo real de bolas contrastados en extremos y centros de los mandos. Cero errores, normales nulas y NaN;53 llamadas,47.358triángulos,54palabras,65% de altura. TS y ESLint src limpios. Barrido oficial sano.16clips instalados y verificados;7.796MP3 totales,182labs completos en manifiesto.

La revisión visual encontró interferencia de jaula con bolas y acumulación de bolas antiguas al cambiar la serie. Se corrigieron ambos y se repitieron los cuatro recorridos. Eje prolongado para atravesar el ancho máximo. Las ejecuciones anteriores son históricas; no sumar sus pantallas como pruebas de la versión final.

Autocrítica: aro, bolas y jaula metálicos, movimiento vivo al abrir y primer plano propio en Inspección; sin cifras dentro del3D. La marca meridiana permite ver el giro absoluto de bola, distinto de la órbita. Tabla dimensional y curvas legibles después de validar; antes se muestran sólo lecturas del ajuste ensayado. Se declara que el interior es esquemático, y L10 no es fecha individual de fallo. Capturas inicial/inspección y ambos instrumentos revisadas; móvil sin desbordamiento. Portada propia capturada y revisada: objeto grande, sin HUD ni recortes.

Pendientes: pruebas globales B antes de publicar. Siguiente267: resorte helicoidal horizontal, escoger alambre y diámetro medio para frecuencia/esfuerzo/carrera; preparación científica aislada en work/PLAN-RESORTE-267.md del workspace.
