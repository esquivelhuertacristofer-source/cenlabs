# mecanica-263 · Engranes helicoidales: empuje y recubrimiento

**Implementación y revisión individual completas. Local, sin commit ni publicación del bloque B.** Falta la batería del conjunto estable 261–270.

## Diferencia respecto del catálogo
Frente a216 (inspección de juego) y236 (transmisión magnética), éste construye involutas helicoidales y comprueba empuje y continuidad de contacto.

## Modelo y límites
Engranes exteriores sin corrección: módulo normal mn=3 mm, αn=20°, z1=24, z2=48, T1=30 N·m, n1=600 rpm. mt=mn/cosβ; tanαt=tanαn/cosβ; Ri=mt zi/2, rai=Ri+mn, rbi=Ri cosαt. Ft=T1/R1, Fa=Ft tanβ, Fr=Ft tanαt. εα=[√(ra1²−rb1²)+√(ra2²−rb2²)−(R1+R2)sinαt]/(πmt cosαt); εβ=b sinβ/(πmn); εγ=εα+εβ. ω2=−ω1 z1/z2. Flancos por involuta barrida: giro de sección=±z tanβ/R. Las líneas nominales de contacto se recortan por ambos círculos de cabeza y por el ancho.

Geometría ideal de involuta y fuerzas estáticas sin pérdidas. No calcula flexión del diente, Hertz, lubricación, ruido ni vida de rodamientos. El recubrimiento es un promedio de pares en contacto, no el número instantáneo constante. Las líneas doradas indican contacto nominal; la malla incluye 0,05 mm de juego transversal para separar visualmente los flancos. Pie del diente radial simplificado, sin trocoide de herramienta. Giro mostrado ×1/100: 600/300 rpm reales, 6/3 rpm visibles. Fuerzas en el piñón: radial −X, tangencial −Y y axial +Z, escala común 0,00065 unidades/N. Banco abierto didáctico, no equipo comercial.

## Archivos y continuación
`public/labs/_elementos-*.js`, `engranes-helicoidales-empuje.html`, `_ficha-engranes-helicoidales-empuje.js`, descriptor en `scripts/lab-src/`, `src/labs/mecanica-263/`. Fuente: https://www.kggear.co.jp/en/wp-content/themes/bizvektor-global-edition/pdf/TechnicalData_KGSTOCKGEARS.pdf

## Verificación individual · 1 de noviembre de 2026

373.627 comprobaciones propias (381.625 acumuladas): ejemplo independiente de KG, tabla16 (εα=1,561; εβ=0,824; total2,385), equilibrio de fuerzas, contacto analítico sobre ambos flancos, promedio de pares activos y muestreo de penetración de vértices entre dientes a varias fases/profundidades/ángulos. El PDF primario completo se consultó en las páginas36 y42; no confundir KG Gear con KHK/Kohara.

4/4 recorridos completos: 1366×768, 1600×900, 2020×1055 DPR1,25 y 390×844. Firma individual `5a59f94f28a45a5f361d66e3bc7ccc85c0027753349dafa558f74dbf26a43f55`. Orden, ensayo, validación, quiz barajado, tres diagnósticos, TXT, curvas, ficha, calidad y arrastre real del ancho. En los extremos/centros de mandos se contrastaron radios y ancho de malla, fases de ambos rotores, extremos de líneas de contacto y vectores de fuerza reales con el modelo. Sin errores de consola, normales nulas ni NaN. 38–39 llamadas, 95.190–95.382 triángulos visibles; 53 palabras de prosa; encuadre66,17–67,38 %. Barrido oficial sano.

Vistas inicial, inspección, móvil, calidad e instrumento revisadas. Piñón en acabado cálido y rueda plateada, seis radios mecanizados, ejes y cuatro apoyos. La hélice es geometría barrida de involuta; se ven sus flancos al girar. El ancho inicial de20 mm permite apreciar la profundidad y sigue fuera del reto por empuje y recubrimiento. Los contactos son nominales, no simulación de presión Hertz. El banco es sobrio y usa inspección para acercar los dientes; sin pizarra ni cifras dentro del3D. Portada `public/images/mecanica/prac_263.webp` revisada.

15 clips con Qwen3-TTS, molde_consignas_4, lote8/una toma; duración y SHA comprobados. Manifiesto178→179; 7.750 MP3 totales, anteriores preservados. Evidencia local `scripts/auditoria/.salida/elementos-261-270/263-informe.json`, capturas y voz-263.json.

Retomar en264: tabla de velocidades de un planetario, elección de miembro fijo y giro absoluto de planetas. Diferenciarlo del127 (reparto de potencia híbrida). Al ampliar los módulos compartidos, esta firma pasa a histórica; repetir el bloque estable antes de cierre global. Pendientes:264–270, batería completa, commitB y publicación del loteB. A251–260 ya está publicado y verificado (código0b9ddf8, documentación534d168).

Ajuste posterior de montaje: eje de radio0,095 y taladro de cubo0,096 en unidades de escena, ambos por debajo del taladro0,0966 del rodamiento dibujado. Evita la interpenetración que tenía el eje anterior de radio0,132. No se declara un ajuste ISO. Repetir sobre la revisión final del bloque y regenerar portada al cierre; las cuatro pruebas anteriores conservan su firma histórica.

QA 1366×768 DPR1: inicio correctos; revisión 56410e8e25536d4728325c11d866bb8fe14c8d582c370b84b99093b5e9ac8abc; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio correctos; revisión 5a59f94f28a45a5f361d66e3bc7ccc85c0027753349dafa558f74dbf26a43f55; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5a59f94f28a45a5f361d66e3bc7ccc85c0027753349dafa558f74dbf26a43f55; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5a59f94f28a45a5f361d66e3bc7ccc85c0027753349dafa558f74dbf26a43f55; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5a59f94f28a45a5f361d66e3bc7ccc85c0027753349dafa558f74dbf26a43f55; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión 5a59f94f28a45a5f361d66e3bc7ccc85c0027753349dafa558f74dbf26a43f55; normales cero=0, sin errores ni desbordamiento.

1 noviembre: portada regenerada con HUD anidado oculto y revisada visualmente. En263 esto también incorpora el ajuste de eje/taladro descrito previamente. No equivale a publicación ni al cierre global de B.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; revisión e12d5c4264b3951026367eb828736be72803e61668bce34ad5114aeafb4e9e23; normales cero=0, sin errores ni desbordamiento.
