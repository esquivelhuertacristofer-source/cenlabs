# mecanica-244 · Sincronizador de caja: igualar antes de engranar

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Orden y competencia profesional
OT-244 · Sincroniza en ≤1,2 s con par ≤4 N·m, fuerza axial ≤140 N y coeficiente ≥0,065.

Equipo e instrumentos: Sincronizador abierto, horquilla y registro de régimen relativo.

Un cono de fricción iguala dos velocidades antes de que el manguito acople los dientes. Equilibra rapidez de sincronía, par de fricción y esfuerzo axial.

## Modelo y límites
Cono simple Rm=45 mm, semiángulo7°: T=µFaRm/sinα. Inercia referida0,02 kg·m², diferencia inicial1500 rpm, eje receptor1000 rpm. ts=JΔω/T, Q=½JΔω². Diferencia decrece linealmente hasta cero. Las fases iniciales se eligen para alinear los dientes al completar ts; después entra el manguito en0,5 s.

Fricción constante y receptor de velocidad impuesta. Sin película de aceite, anillo bloqueador dinámico, elasticidad de dientes o choque de engrane. Alineación de dientes preparada al inicio; no reproduce una búsqueda de fase real. Giro×1/100, sincronía en segundos físicos. Se diferencia de DCT: sincronizador de cono, no dos embragues de potencia.

Escalas: Giro×1/100 · sincronía física · fase de dientes preparada

Principio consultado: https://www.mathworks.com/help/sdl/ref/synchronizer.html . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/sincronizador-cono-caja.html, _ficha-sincronizador-cono-caja.js y escena _ind-244.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-244/, briefing JSON, portada prac_244.webp y descriptor scripts/lab-src/sincronizador-cono-caja.json.
- Build: node scripts/build-lab.mjs sincronizador-cono-caja.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 244.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 244 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 244. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 244.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
1086 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 40 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 40 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 40 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 40 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 17 llamadas y52890 triángulos, 40 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Cono, dientes, manguito móvil, horquilla y apoyos de eje. Se elevaron los soportes hasta los rodamientos y se fusionaron piezas rígidas para reducir llamadas. Se comprueban fases de entrada y salida antes del cierre. La alineación se prepara al inicio, no se finge una búsqueda real de fase. Distinto de embrague184 y DCT130: igualación de régimen previa al acoplamiento positivo.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:240.
