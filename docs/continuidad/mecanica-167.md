# mecanica-167 · Reductor armónico: deformar una corona para multiplicar el par

Estado al24-10-2026: **publicado y verificado en producción**, código `375bca2`, versión Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`. Commit funcional `468be95`. Login real correcto, iframe exacto y portada propia disponible.

## Qué cambia y por qué es nuevo
Descubre cómo una pieza flexible convierte muchas vueltas del motor en un movimiento lento y potente. El generador de onda deforma la copa dentada. Su diferencia de dos dientes con la corona hace retroceder lentamente la salida.

## Archivos exactos
- `public/labs/reductor-armonico-robot.html` y `public/labs/_ficha-reductor-armonico-robot.js`.
- `src/labs/mecanica-167/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 167`.

## Modelo y límites
ωs/ωe = (Zf−Zc)/Zf = −2/160 = −1/80. Ts = 80 η Te; Pe = Te ωe; calor = (1−η) Pe. Rendimiento didáctico constante η = 0,85. Los 160 dientes flexibles y 162 rígidos están representados individualmente. La copa adopta una elipse de amplitud impuesta; su deformación no es un cálculo de elasticidad.

Sin deformación bajo carga, fatiga, contacto de dientes, holgura, par máximo de catálogo ni FEM. El perfil visual del diente es esquemático, no una involuta de fabricación.

Fuente del principio: https://www.hds.co.jp/english/products/hd_theory/

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Publicación y acceso con login real confirmados el24-10-2026. Hub:58 destacadas, consola sin errores.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 40 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 40 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 40 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 53 palabras iniciales, normales cero=0, 40 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Publicado y verificado con login real.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs reductor-armonico-robot`; descriptor en `scripts/lab-src/reductor-armonico-robot.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 167`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 167`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 167`; `public/images/mecanica/prac_167.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.

## Publicación confirmada
Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`, deploy exit0, código375bca2. Login real: ruta correcta, normales cero=0, portada HTTP200 y sin errores de consola. Se verificaron también165 y166 como regresión. No se inició otro laboratorio después de esta tanda; próximo ID libre177.
