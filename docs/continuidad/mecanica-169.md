# mecanica-169 · Robot delta: tres brazos que cooperan para mover una herramienta

Estado al24-10-2026: **publicado y verificado en producción**, código `375bca2`, versión Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`. Commit funcional `468be95`. Login real correcto, iframe exacto y portada propia disponible.

## Qué cambia y por qué es nuevo
Haz que tres brazos lleven una pieza por una trayectoria común sin perder alcance ni exigir giros excesivos. Cada brazo debe llegar al mismo efector. Alejar la trayectoria o acercarla demasiado a la base cambia mucho las articulaciones.

## Archivos exactos
- `public/labs/robot-delta-paralelo.html` y `public/labs/_ficha-robot-delta-paralelo.js`.
- `src/labs/mecanica-169/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 169`.

## Modelo y límites
Tres bases a radio 0,50 m y plataforma de radio 0,12 m. Brazos superiores de 0,40 m e inferiores de 0,85 m. Para cada plano de motor: A cos q + B sin q = C, C=(|D|²+L1²−L2²)/(2L1). Se selecciona una rama fija del acos. Trayectoria x=r cos(2πt/3), z=r sin(2πt/3), y=1,5−h. Se verifica el cierre de cada lazo por distancias. Los dos tirantes de cada brazo forman un paralelogramo ideal.

Sin dinámica, cargas, flexión, control de orientación, choques propios o con obstáculos. Topes didácticos −1,35≤q≤0,25 rad; el reto comprueba 121 posiciones del círculo y velocidades por diferencias de 25 ms. Un objetivo geométricamente imposible conserva la última postura y se avisa; no se promete atravesar zonas no comprobadas entre muestras.

Fuente del principio: https://new.abb.com/products/robotics/robots/delta-robots

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Publicación y acceso con login real confirmados el24-10-2026. Hub:58 destacadas, consola sin errores.

## Verificación incremental · 24-10-2026
Auditoría numérica: 1333 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 22 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 22 drawcalls, objeto 64.4 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 22 drawcalls, objeto 62.7 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 22 drawcalls, objeto 64.9 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Publicado y verificado con login real.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs robot-delta-paralelo`; descriptor en `scripts/lab-src/robot-delta-paralelo.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 169`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 169`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 169`; `public/images/mecanica/prac_169.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.

## Publicación confirmada
Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`, deploy exit0, código375bca2. Login real: ruta correcta, normales cero=0, portada HTTP200 y sin errores de consola. Se verificaron también165 y166 como regresión. No se inició otro laboratorio después de esta tanda; próximo ID libre177.
