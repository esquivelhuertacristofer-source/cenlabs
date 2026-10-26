# mecanica-213 · Fabricación FDM: capas y límite de extrusión

Estado al26-10-2026: TERMINADO y verificado localmente; pendiente publicación confirmada.

## Competencia y orden
Construye una pared por capas y comprueba si el extrusor puede entregar el material que pide la trayectoria.

OT-213 · Imprime capas ≤0,24 mm, demanda ≤8 mm³/s, entrega ≥99 % y tiempo físico ≤220 s.

Instrumentos: Impresora cartesiana, extrusor, pared por capas y balance volumétrico.

## Modelo y límites
Pared circular de radio 18 mm y alto 20 mm. N=ceil(20/h); la última capa se representa completa. Cordón ideal de ancho w=0,45 mm: A=h(w−h)+πh²/4. Q=A·v; Qentregado=min(Q,8). Longitud/capa=2π·18. Tiempo=N·longitud/v. Hilo de 1,75 mm: velocidad=Qentregado/(π·1,75²/4).

Impresión de pared hueca ideal; sin soportes, relleno, aceleración, temperatura, presión del fundido, retracción ni adherencia. Cordones de sección ovalada ilustrativa; el balance usa sección de estadio. Tiempo de construcción acelerado 20 veces y sección de cordón ampliada para lectura. No genera G-code. La saturación de caudal es un límite sintético, no una impresora comercial. La cámara de inspección encuadra el volumen completo de movimiento del cabezal para evitar recortes durante la construcción.

Escala visual y temporal: Construcción ×20 · cordones ampliados · pared ideal

Fuente del principio: https://help.prusa3d.com/article/extrusion-multiplier-calibration_2257 . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/fabricacion-aditiva-fdm-flujo.html y _ficha-fabricacion-aditiva-fdm-flujo.js.
- Escena específica: public/labs/_fab-213.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-213/, briefing JSON, portada prac_213.webp y descriptor scripts/lab-src/fabricacion-aditiva-fdm-flujo.json.
- Construcción: node scripts/build-lab.mjs fabricacion-aditiva-fdm-flujo. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 213.
- Flujo: flujo-fabricacion-211-220.mjs --solo 213 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 213.

## Comprobaciones
902 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 53 palabras de prosa inicial, 11 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 53 palabras de prosa inicial, 11 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 53 palabras de prosa inicial, 11 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 53 palabras de prosa inicial, 11 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Cama, guías, extrusor con disipador, boquilla y pared construida por capas. Se corrigieron NaN en la altura, alineación de la boquilla, apoyos de la cama y material plástico. La cámara de inspección encuadra toda la envolvente de movimiento, con geometría auxiliar invisible identificada; las capas y cabezal ocupan distintas partes de esa envolvente según avanza la construcción. No confundir un encuadre estable con que toda la pieza está ya impresa. Se diferencia de186: añade material y verifica caudal, no arranque de viruta.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Inspección y entorno comparten la misma geometría y pose. La prueba adicional comprueba transformaciones y, donde existen, matrices/colores de instancias para evitar que la inspección se congele.

## Publicación
Commit, push, deploy y login real pendientes. El último publicado sigue siendo210 hasta confirmar la entrega.
