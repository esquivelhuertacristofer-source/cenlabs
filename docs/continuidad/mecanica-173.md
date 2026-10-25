# mecanica-173 · Volante bimasa: aislar las vibraciones de torsión del motor

Estado al24-10-2026: **publicado y verificado en producción**, código `375bca2`, versión Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`. Commit funcional `468be95`. Login real correcto, iframe exacto y portada propia disponible.

## Qué cambia y por qué es nuevo
Separa dos masas giratorias con resortes y freno para que los pulsos del motor lleguen menos a la transmisión. El giro medio sigue pasando, pero las pequeñas oscilaciones se filtran. La rigidez y el amortiguamiento determinan qué parte del pulso atraviesa el volante.

## Archivos exactos
- `public/labs/volante-bimasa-vibracion.html` y `public/labs/_ficha-volante-bimasa-vibracion.js`.
- `src/labs/mecanica-173/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 173`.

## Modelo y límites
J1=0,18 y J2=0,12 kg·m²; Jred=J1J2/(J1+J2)=0,072. A 850 rpm y orden 2, ω=2·850·2π/60. Jred δ″+Bδ′+Kδ=24 sin(ωt) N·m: forzamiento equivalente de un pulso de 60 N·m aplicado a la primera masa. Solución compleja exacta; par interno Kδ+Bδ′ y calor medio B(ωδamp)²/2. El giro medio se superpone a las oscilaciones, conservando su reparto inercial.

Sólo pequeña oscilación lineal en régimen permanente. Sin arranque, topes, muelles de rigidez variable, fricción seca, embrague, pendulares centrífugos o variación de régimen. La pérdida media usa amortiguamiento viscoso ideal. La animación amplifica únicamente la oscilación, no el giro medio.

Fuente del principio: https://press.zf.com/press/en/releases/release_3283.html

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Publicación y acceso con login real confirmados el24-10-2026. Hub:58 destacadas, consola sin errores.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 62 palabras iniciales, normales cero=0, 41 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 62 palabras iniciales, normales cero=0, 41 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 62 palabras iniciales, normales cero=0, 41 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 62 palabras iniciales, normales cero=0, 41 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Publicado y verificado con login real.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs volante-bimasa-vibracion`; descriptor en `scripts/lab-src/volante-bimasa-vibracion.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 173`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 173`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 173`; `public/images/mecanica/prac_173.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.

## Publicación confirmada
Cloudflare `9ed4dadb-f6c5-4322-9c42-e058b45641cb`, deploy exit0, código375bca2. Login real: ruta correcta, normales cero=0, portada HTTP200 y sin errores de consola. Se verificaron también165 y166 como regresión. No se inició otro laboratorio después de esta tanda; próximo ID libre177.
