# mecanica-211 · Calibración cámara–robot: correspondencias planares

Estado al26-10-2026: TERMINADO y verificado localmente; pendiente publicación confirmada.

## Competencia y orden
Relaciona las medidas de una cámara con el marco de la herramienta y comprueba el error sobre varios puntos.

OT-211 · Ajusta la transformación para obtener RMS ≤0,5 mm, error máximo ≤0,7 mm y reproyección equivalente ≤0,7 px.

Instrumentos: SCARA, cámara, patrón, correspondencias y visor de residuos.

## Modelo y límites
Transformación rígida planar pG=R(θ)pC+[tx,−20] mm. Seis correspondencias sintéticas en el marco de la brida. Reproyección equivalente epx=800·e/600. Robot SCARA: x=0,85cos(q1)+0,65cos(q1+q2), z=0,85sin(q1)+0,65sin(q1+q2) m. Se ajustan θ y tx; ty y la escala óptica se conocen.

Ejercicio reducido a dos grados de libertad; no resuelve AX=XB completo ni estima distorsión, orientación 3D, ruido de detección o incertidumbre del robot. Las muestras están pretransformadas al marco de brida. Rayos y cámara contextualizan la medición; no son un simulador de imágenes PnP. Residuos visuales amplificados 4 veces.

Escala visual y temporal: Modelo planar · residuos ×4 · cámara sintética

Fuente del principio: https://docs.opencv.org/5.0/main_modules/calib.html . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/calibracion-camara-robot-planar.html y _ficha-calibracion-camara-robot-planar.js.
- Escena específica: public/labs/_fab-211.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-211/, briefing JSON, portada prac_211.webp y descriptor scripts/lab-src/calibracion-camara-robot-planar.json.
- Construcción: node scripts/build-lab.mjs calibracion-camara-robot-planar. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 211.
- Flujo: flujo-fabricacion-211-220.mjs --solo 211 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 211.

## Comprobaciones
546 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 54 palabras de prosa inicial, 84 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 54 palabras de prosa inicial, 84 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 54 palabras de prosa inicial, 84 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 54 palabras de prosa inicial, 84 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
SCARA con articulaciones, bridas, fijaciones, mazo de cables, cámara y patrón. La entrada acerca el equipo y los residuos. La transformación es planar: no afirmar que resuelve calibración 3D completa ni AX=XB. Se diferencia de187: no calibra el TCP.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Constantes de referencia comprobadas en escritorio y móvil: ocultas antes del ensayo y de validar, visibles después de validar y ocultas de nuevo al modificar el ajuste.

## Publicación
Commit, push, deploy y login real pendientes. El último publicado sigue siendo210 hasta confirmar la entrega.
