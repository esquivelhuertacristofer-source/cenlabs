# mecanica-172 · Balanceo dinámico: corregir un par de desequilibrio en dos planos

Estado al24-10-2026: **publicado y verificado en producción**, código `375bca2`, versión Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`. Commit funcional `468be95`. Login real correcto, iframe exacto y portada propia disponible.

## Qué cambia y por qué es nuevo
Corrige una rueda que parece equilibrada en reposo, pero hace vibrar los apoyos cuando gira. Dos desequilibrios opuestos no dejan una fuerza neta, pero sí un par oscilante. La corrección necesita dos pesos, uno en cada plano.

## Archivos exactos
- `public/labs/balanceo-dinamico-dos-planos.html` y `public/labs/_ficha-balanceo-dinamico-dos-planos.js`.
- `src/labs/mecanica-172/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 172`.

## Modelo y límites
Caso de par puro: U1=0,006 e^(j30°) kg·m; U2=−U1, planos a ±0,12 m y apoyos a ±0,35 m. Los contrapesos a radio 0,18 m se montan opuestos entre planos. Ures = U1 + mr e^(jα). La suma estática sigue siendo cero. Par = |Ures|ω²·0,24; reacción por apoyo = par/0,70. Rigidez por apoyo 200 kN/m para ilustrar la flexión amplificada.

Sólo rotor rígido con par puro y fase ideal conocida. No calcula una medición por coeficientes de influencia ni corrige un caso general con fuerza y par simultáneos. El peso del plano B se mantiene opuesto automáticamente, por la simetría del problema. La deformación es cuasiestática ilustrativa: sin resonancia de los apoyos, giroscopía ni neumático flexible.

Fuente del principio: https://skftechnicalsupport.zendesk.com/hc/en-us/articles/360022974074-Maintaining-Machinery-Balance-test-format-3-Word-import-via-Google-Drive

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Publicación y acceso con login real confirmados el24-10-2026. Hub:58 destacadas, consola sin errores.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 27 drawcalls, objeto 67.3 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 27 drawcalls, objeto 68.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 27 drawcalls, objeto 66.5 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 52 palabras iniciales, normales cero=0, 27 drawcalls, objeto 68.0 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Publicado y verificado con login real.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs balanceo-dinamico-dos-planos`; descriptor en `scripts/lab-src/balanceo-dinamico-dos-planos.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 172`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 172`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 172`; `public/images/mecanica/prac_172.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.

## Publicación confirmada
Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`, deploy exit0, código375bca2. Login real: ruta correcta, normales cero=0, portada HTTP200 y sin errores de consola. Se verificaron también165 y166 como regresión. No se inició otro laboratorio después de esta tanda; próximo ID libre177.
