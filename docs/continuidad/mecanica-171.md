# mecanica-171 · Clasificación por visión: sincronizar cámara, cinta y expulsor

Estado al24-10-2026: **terminado y verificado localmente**; código integrado en468be95, pendiente publicación confirmada. No confundir con producción.

## Qué cambia y por qué es nuevo
Sincroniza una cámara con el expulsor para apartar la pieza señalada sin frenar la producción. La cámara identifica una pieza y el expulsor actúa después de un retardo. Si cambia la velocidad de cinta, el mismo retardo deja de servir.

## Archivos exactos
- `public/labs/vision-cinta-clasificacion.html` y `public/labs/_ficha-vision-cinta-clasificacion.js`.
- `src/labs/mecanica-171/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 171`.

## Modelo y límites
Movimiento uniforme x=vt. Error del disparo e=vτ−1,20 m. Producción 60v/0,40, con paso entre piezas de 400 mm. El circuito visual es continuo de 3,2 m y tiene ocho piezas con ese mismo paso. El expulsor actúa 0,12 s y sólo desvía la pieza si |e|≤45 mm. Se representa la identificación por color, no el procesamiento real de una imagen.

Sin inferencia de visión, fallos de detección, deslizamiento de cinta, variación de velocidad, encoder discreto, latencia aleatoria o dinámica de impacto. La clasificación ya está dada; se estudia la sincronización temporal. El desvío es una trayectoria cinemática impuesta, sin calcular fuerza de impacto.

Fuente del principio: https://docs.cognex.com/dmst_631/web/EN/DMST_QANDA/Content/Topics/idp10156055536.htm?TocPath=Inputs+%2F+Outputs%7C_____52

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Falta confirmar publicación y acceso con login real.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 50 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 50 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 50 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 55 palabras iniciales, normales cero=0, 50 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Pendiente publicación.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs vision-cinta-clasificacion`; descriptor en `scripts/lab-src/vision-cinta-clasificacion.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 171`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 171`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 171`; `public/images/mecanica/prac_171.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.
