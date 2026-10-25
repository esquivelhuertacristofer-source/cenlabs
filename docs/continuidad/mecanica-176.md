# mecanica-176 · Corrientes parásitas: frenar un disco sin tocarlo

Estado al24-10-2026: **publicado y verificado en producción**, código `375bca2`, versión Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`. Commit funcional `468be95`. Login real correcto, iframe exacto y portada propia disponible.

## Qué cambia y por qué es nuevo
Frena un disco conductor con un campo magnético y observa cómo su energía termina en calor. El disco en movimiento induce corrientes que se oponen al giro. Al bajar la velocidad, el par se reduce: este freno no mantiene inmóvil una carga.

## Archivos exactos
- `public/labs/freno-corrientes-parasitas.html` y `public/labs/_ficha-freno-corrientes-parasitas.js`.
- `src/labs/mecanica-176/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 176`.

## Modelo y límites
Aproximación resistiva de baja velocidad: T=cω, c=κ σ B² d A r². κ=0,02 geométrico didáctico; σ=35 MS/m, área polar total A=0,008 m², radio de actuación 0,18 m. Disco anular de aluminio ρ=2700 kg/m³, radios 0,28 y 0,04 m; Jtotal=0,32+Jdisco. ω=120 exp(−ct/J), Ecalor=J(ω0²−ω²)/2; ΔT=Ecalor/(m·900). Campo y conductividad uniformes.

Coeficiente geométrico sintético, no predicción de un freno comercial. Sin reacción inductiva, efecto pelicular, saturación, dependencia térmica de conductividad, refrigeración o fuerzas laterales. El modelo lineal sólo representa el régimen resistivo; su rango no está validado para materiales reales a estas velocidades. No hay par de retención en reposo. Se repite el pulso a temperatura inicial, sin acumular calor entre ciclos.

Fuente del principio: https://www.comsol.com/blogs/simulating-eddy-current-brakes/

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Publicación y acceso con login real confirmados el24-10-2026. Hub:58 destacadas, consola sin errores.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 58 palabras iniciales, normales cero=0, 28 drawcalls, objeto 65.3 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 58 palabras iniciales, normales cero=0, 28 drawcalls, objeto 65.3 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 58 palabras iniciales, normales cero=0, 28 drawcalls, objeto 65.4 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 58 palabras iniciales, normales cero=0, 28 drawcalls, objeto 65.3 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Publicado y verificado con login real.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs freno-corrientes-parasitas`; descriptor en `scripts/lab-src/freno-corrientes-parasitas.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 176`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 176`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 176`; `public/images/mecanica/prac_176.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.

## Publicación confirmada
Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`, deploy exit0, código375bca2. Login real: ruta correcta, normales cero=0, portada HTTP200 y sin errores de consola. Se verificaron también165 y166 como regresión. No se inició otro laboratorio después de esta tanda; próximo ID libre177.
