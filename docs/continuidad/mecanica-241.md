# mecanica-241 · Robot de centro remoto: orientar sin desplazar el pivote

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Orden y competencia profesional
OT-241 · Sigue el anillo patrón con error ≤3 mm, inserción ≥100 mm y par gravitatorio ≤2,5 N·m.

Equipo e instrumentos: Robot de guías circulares, pivote fijo y comparador de trayectoria.

Una herramienta atraviesa un centro fijo mientras dos arcos concéntricos cambian su orientación. Ajusta inclinación e inserción para seguir un anillo patrón sin desplazar el punto de paso.

## Modelo y límites
Pivote O fijo; u=[sinθcosψ,−cosθ,sinθsinψ], punta=O+Lu. Yaw ψ=2πt/12. Anillo patrón: radio84,853 mm y descenso84,853 mm respecto de O. Error euclídeo entre punta y punto homólogo del anillo. Carga puntual2 kg en la punta: par gravitatorio=mgLsinθ.

Mecanismo ideal de guías circulares concéntricas con ejes que se cruzan en O, no reproduce el doble paralelogramo del artículo. Inserción rígida y trayectoria prescrita, sin flexibilidad, colisiones ni control de un equipo real. No es dispositivo médico. Escala geométrica7 unidades/m; ciclo12 s.

Escalas: Guías concéntricas ideales · ciclo12 s · no dispositivo médico

Principio consultado: https://pmc.ncbi.nlm.nih.gov/articles/PMC9963641/ . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/robot-centro-remoto.html, _ficha-robot-centro-remoto.js y escena _ind-241.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-241/, briefing JSON, portada prac_241.webp y descriptor scripts/lab-src/robot-centro-remoto.json.
- Build: node scripts/build-lab.mjs robot-centro-remoto.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 241.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 241 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 241. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 241.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
1086 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 41 palabras iniciales; 12 llamadas; encuadre65.8 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 41 palabras iniciales; 12 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 41 palabras iniciales; 16 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 41 palabras iniciales; 16 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 16 llamadas y17870 triángulos, 41 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Guías circulares, carro, pedestal y herramienta con punta coincidente con el punto calculado. El anillo patrón permite ver simultáneamente errores de inclinación e inserción. Se añadió el pedestal a inspección y se enlazó el carro con la guía. Es un RCM de arcos ideales, distinto del brazo serial166 y de la columna continua239.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:240.
