# mecanica-168 · Husillo de bolas: avance, par y velocidad crítica de un eje

Estado al24-10-2026: **terminado y verificado localmente**; pendiente commit y publicación confirmada. No confundir con producción.

## Qué cambia y por qué es nuevo
Convierte el giro de un motor en avance y elige un paso que mueva la carga sin forzar el eje. Un paso mayor avanza más por vuelta, pero necesita más par para empujar la misma carga. Un eje largo limita el giro admisible.

## Archivos exactos
- `public/labs/husillo-bolas-eje-lineal.html` y `public/labs/_ficha-husillo-bolas-eje-lineal.js`.
- `src/labs/mecanica-168/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 168`.

## Modelo y límites
vmax = nmax p/60; T = Fp/(2πη), con F=3500 N y η=0,90. La carrera es x = 0,2[1−cos(ωt)] m, ω = vmax/0,2; θ = 2πx/p. Viga simplemente apoyada: ncr = 30π/L² √(EI/ρA); d=16 mm, L=1,2 m, E=210 GPa, ρ=7850 kg/m³. El límite elegido es 0,8 ncr. El empuje es cuasiestático y se informa su módulo; no es par de aceleración.

Sin precarga, rozamiento variable, rigidez de apoyos reales, resonancia acoplada, inercia del carro, frenado, error de paso o recirculación dinámica de bolas. Las bolas visibles sólo representan la construcción de la tuerca.

Fuente del principio: https://www.thk.com/us/en/products/ball_screw/selection/0006/

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Falta confirmar publicación y acceso con login real.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 30 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 30 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 30 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 63 palabras iniciales, normales cero=0, 30 drawcalls, objeto 58.8 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Pendiente publicación.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs husillo-bolas-eje-lineal`; descriptor en `scripts/lab-src/husillo-bolas-eje-lineal.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 168`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 168`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 168`; `public/images/mecanica/prac_168.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.
