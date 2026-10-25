# mecanica-170 · Plataforma Stewart: movimiento y reparto de carga entre seis actuadores

Estado al24-10-2026: **terminado y verificado localmente**; código integrado en468be95, pendiente publicación confirmada. No confundir con producción.

## Qué cambia y por qué es nuevo
Inclina una plataforma coordinando seis actuadores y comprueba que ninguno se queda sin recorrido ni fuerza. Las seis patas cambian de longitud a la vez. La altura y la inclinación modifican tanto el recorrido como el reparto del peso.

## Archivos exactos
- `public/labs/plataforma-stewart-seis-actuadores.html` y `public/labs/_ficha-plataforma-stewart-seis-actuadores.js`.
- `src/labs/mecanica-170/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 170`.

## Modelo y límites
Brazos de anclaje en radios 0,75 y 0,50 m. li = |T+Rpi−bi|, ui = (T+Rpi−bi)/li. Cada fila del jacobiano es [ui, (Rpi)×ui]. Equilibrio JT f = [0,mg,0,0,0,0], m=300 kg. Se resuelve un sistema de seis ecuaciones con pivoteo. R=Ry(cabeceo)Rx(balanceo); el cabeceo tiene 0,6 veces la amplitud del balanceo y va desfasado un cuarto de ciclo.

Sólo cinemática inversa y equilibrio estático instantáneo. Sin inercia, flexión, pandeo, choques entre patas, límites de rótulas, fricción ni control hidráulico. Las fuerzas admiten tracción y compresión. Los extremos del ciclo se revisan en 121 posiciones; no es certificación de una plataforma para personas.

Fuente del principio: https://math.nist.gov/MatrixMarket/data/NEP/robotics/robotics.html

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Falta confirmar publicación y acceso con login real.

## Verificación incremental · 24-10-2026
Auditoría numérica: 1454 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 33 drawcalls, objeto 65.6 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 33 drawcalls, objeto 65.6 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 33 drawcalls, objeto 65.6 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 33 drawcalls, objeto 65.6 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Pendiente publicación.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs plataforma-stewart-seis-actuadores`; descriptor en `scripts/lab-src/plataforma-stewart-seis-actuadores.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 170`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 170`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 170`; `public/images/mecanica/prac_170.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.
