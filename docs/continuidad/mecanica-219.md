# mecanica-219 · Cambiador de herramientas: secuencia por bloques

Estado al26-10-2026: TERMINADO y verificado localmente; pendiente publicación confirmada.

## Competencia y orden
Programa el intercambio de dos herramientas y observa cómo las confirmaciones permiten cada movimiento.

OT-219 · Verifica el programa de nueve bloques; usa cota ≥150 mm, velocidad ≤0,7 m/s, par ≤0,7 N·m y ciclo ≤8,5 s.

Instrumentos: Brazo doble, husillo, herramientas y editor de secuencia por bloques.

## Modelo y límites
Preflight de nueve comandos: orientar, subir, tomar, desbloquear, extraer, girar, insertar, bloquear y liberar. Giro π con perfil quintico s=10u³−15u⁴+6u⁵. Radio físico 0,22 m, dos herramientas de 1,4 kg: J=2mr². vmax=r·1,875π/T; τmax=J·(10√3/3)π/T². Tiempos restantes sintéticos y cota/150 s para elevar.

Autómata didáctico de preflight, no lógica de un control Haas ni PLC de seguridad. Una permutación incoherente o cota insuficiente detiene la demostración antes de mover. Movimiento y tiempos de agarre prescritos; sin contacto FEM, flexibilidad, presión neumática o verificación de un equipo real. La secuencia se edita con bloques reordenables; no exporta código de máquina.

Escala visual y temporal: Bloques editables · preflight didáctico · sin control de máquina

Fuente del principio: https://www.haascnc.com/fr/service/online-manuals/mill-tool-changer---service-manual/double-arm-and-cambox---service-replacements.html . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/cambiador-herramientas-bloques.html y _ficha-cambiador-herramientas-bloques.js.
- Escena específica: public/labs/_fab-219.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-219/, briefing JSON, portada prac_219.webp y descriptor scripts/lab-src/cambiador-herramientas-bloques.json.
- Construcción: node scripts/build-lab.mjs cambiador-herramientas-bloques. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 219.
- Flujo: flujo-fabricacion-211-220.mjs --solo 219 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 219.

## Comprobaciones
34 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 39 palabras de prosa inicial, 41 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 39 palabras de prosa inicial, 45 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 39 palabras de prosa inicial, 45 llamadas, encuadre 65.1 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 39 palabras de prosa inicial, 45 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Husillo, alojamiento, almacén, brazo doble, horquillas y dos herramientas. Editor con nueve bloques reordenables, comprobación previa, resaltado de paso y secuencia incluida en el informe. Se retiraron soportes de la envolvente de giro, se hicieron horquillas abiertas y se separaron las mordazas para dejar pasar el husillo. Una secuencia incoherente no inicia el ensayo. El criterio y el movimiento son didácticos; no son lógica comercial ni certificación de seguridad.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Editor verificado en los cuatro tamaños: intercambio de bloques rechazado por la comprobación previa; restaurar el programa tras editarlo no recupera un ensayo vigente. La prueba geométrica recorta triángulos de los soportes a la altura de las herramientas y comprueba que no invaden el anillo de giro; también verifica separación vertical frente a los alojamientos. Esto verifica la trayectoria prescrita, no implementa un solucionador general de colisiones.

Inspección y entorno comparten la misma geometría y pose. La prueba adicional comprueba transformaciones y, donde existen, matrices/colores de instancias para evitar que la inspección se congele.

## Publicación
Commit, push, deploy y login real pendientes. El último publicado sigue siendo210 hasta confirmar la entrega.
