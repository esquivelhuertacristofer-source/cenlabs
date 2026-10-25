# mecanica-175 · Volante de inercia: almacenar energía sin exceder el esfuerzo del aro

Estado al24-10-2026: **terminado y verificado localmente**; pendiente commit y publicación confirmada. No confundir con producción.

## Qué cambia y por qué es nuevo
Almacena energía haciendo girar un aro y equilibra capacidad, velocidad y esfuerzo del material. Un radio o giro mayor guarda más energía, pero también aumenta la tensión que tiende a abrir el aro. El motor-generador entrega un pulso y recupera la energía.

## Archivos exactos
- `public/labs/volante-inercia-almacenamiento.html` y `public/labs/_ficha-volante-inercia-almacenamiento.js`.
- `src/labs/mecanica-175/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_mecanismos-modelos.js` (funciones puras), `_mecanismos-escenas.js` (construcción y actualización), `_mecanismos-definiciones.js` (contratos), `_mecanismos-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 175`.

## Modelo y límites
Aro delgado de masa fija 25 kg: J=mr², E=Jω²/2, tensión de aro σ=ρr²ω² con ρ=7800 kg/m³. Velocidad mínima de servicio 5000 rpm. Energía útil = E0−Emin. Pulso ideal de 40 kW durante hasta 3 s, limitado por Emin; recarga desde el segundo 5 durante el mismo tiempo. ω(t)=√(2E/J), ángulo por integración analítica de la raíz. Ciclo de energía de 8 s físicos.

Esfuerzo circunferencial de aro delgado; no es la fórmula de un disco macizo. Sin tensiones de montaje, defectos, fatiga, rodamientos magnéticos activos, pérdidas de vacío, pérdidas eléctricas, contención de fragmentos o FEM. La carcasa y motor son estructurales. El criterio de 350 MPa es didáctico y no certifica un rotor real. Se reinicia el ciclo de energía cada 8 s físicos.

Fuente del principio: https://www.sandia.gov/app/uploads/sites/163/2022/03/ESHB_Ch07_Flywheels_Bender.pdf

## Cierre local
Valores iniciales rechazados y solución interior aceptada. Auditoría numérica y flujo de diseño, diagnóstico y quiz completos. Build reproducible por descriptor, portada propia y barrido sin red sanos. No hay errores propios de consola. Falta confirmar publicación y acceso con login real.

## Verificación incremental · 24-10-2026
Auditoría numérica: 486 comprobaciones correctas. Inicio rechazado y solución interior aceptada.
- 1366×768, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 18 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 1600×900, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 18 drawcalls, objeto 66.1 % del lienzo, sin errores ni desbordamientos.
- 2020×1055, DPR 1.25: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 18 drawcalls, objeto 65.0 % del lienzo, sin errores ni desbordamientos.
- 390×844, DPR 1: recorrido, ajuste, validación, quiz, tres diagnósticos, ficha y calidad completados; 56 palabras iniciales, normales cero=0, 18 drawcalls, objeto 66.1 % del lienzo, sin errores ni desbordamientos.
Estado: QA de los cuatro tamaños y revisión visual completas. Suite global44/44,2978 pruebas,12 snapshots correctos. TypeScript/ESLint y generados correctos. Barrido sin CDN sano. Pendiente publicación.

## Autocrítica frente a los rechazos del usuario
No está saturado: entre52 y63 palabras iniciales de prosa según la práctica (el valor exacto figura arriba), por debajo de120; las ecuaciones y límites quedan cerrados en Modelo/Ficha. El mecanismo ya se mueve al entrar y la guía arranca sola. Materiales PBR, entorno y sombras; formas torneadas, piezas con función reconocible y mecanismos distintos. Se corrigieron apoyos flotantes, espiras facetadas, legibilidad de números en móvil y texto UTF-8 de criterios. La guía móvil ocupa el panel y deja ver la máquina. No se representa un producto comercial ni se afirma una simulación de todos sus detalles.

## Cómo reproducir y retomar
- Construir: `node scripts/build-lab.mjs volante-inercia-almacenamiento`; descriptor en `scripts/lab-src/volante-inercia-almacenamiento.json`.
- Física: `node scripts/auditoria/verifica-mecanismos-167-176.mjs --solo 175`.
- Flujo completo: `node scripts/auditoria/flujo-mecanismos-167-176.mjs --solo 175`. Usa servidor efímero propio y cierra navegador en finally. Capturas/informe en `.salida/mecanismos-167-176`.
- Portada propia: `node scripts/portadas/capturar-mecanismos.mjs --solo 175`; `public/images/mecanica/prac_175.webp`.
- Fuentes de verdad: definiciones/modelos/escenas/runtime en módulos públicos indicados arriba; el HTML sólo es la entrada reconstruible. No ejecutar generadores históricos de work para sobrescribir una versión posterior.
- Se respetan reduced-motion, calidad media, un reloj, diagnóstico y quiz barajado, __labDebug, __diag3d y _puente.
- Sin narración de voz nueva. Las simplificaciones están descritas arriba y en la ficha; no prometer colisiones completas o hardware certificado.
