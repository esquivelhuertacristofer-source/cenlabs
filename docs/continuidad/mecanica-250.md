# mecanica-250 · Robot hexápodo: marcha y polígono de apoyo

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Orden y competencia profesional
OT-250 · Camina a ≥0,096 m/s con margen mínimo ≥25 mm, par equivalente ≤6 N·m y todas las patas alcanzables.

Equipo e instrumentos: Robot hexápodo articulado, pista y evaluación del triángulo de apoyo.

Seis patas articuladas alternan dos trípodes mientras el cuerpo avanza sobre una pista de ensayo. Ajusta zancada y centro de masa para conservar apoyo durante todo el ciclo.

## Modelo y límites
Marcha de trípodes a0,8 Hz, apoyo50 %. Caderas x=±200 y0 mm,z=±70 mm,y=150 mm; pies z=±200 mm. Zancada S: apoyo x=xc+S(0,5−s), retorno x=xc+S(−0,5+s), elevación45sin(πs) mm. Eslabones110/130 mm; rodilla por intersección de círculos. Centro de masa x=offset,z=0; margen firmado mínimo a bordes del triángulo de apoyo. Reacciones baricéntricas para8 kg; par equivalente=0,11·max|Ni|. Se muestrean241 fases.

Locomoción cuasiestática prescrita sobre suelo plano. No resuelve dinámica multicuerpo, fricción, deslizamiento, motores, impactos o estabilidad dinámica. Par equivalente de un brazo fijo110 mm, no par exacto de todas las articulaciones. Trípode de apoyo en DOM, sin texto3D. Escala5 unidades/m; pista representa avance relativo con cuerpo fijo.

Escalas: Marcha0,8 Hz · apoyo cuasiestático · par equivalente

Principio consultado: https://pmc.ncbi.nlm.nih.gov/articles/PMC5038670/ . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/robot-hexapodo-tripodes.html, _ficha-robot-hexapodo-tripodes.js y escena _ind-250.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-250/, briefing JSON, portada prac_250.webp y descriptor scripts/lab-src/robot-hexapodo-tripodes.json.
- Build: node scripts/build-lab.mjs robot-hexapodo-tripodes.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 250.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 250 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 250. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 250.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
6031 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 43 palabras iniciales; 40 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 43 palabras iniciales; 40 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 43 palabras iniciales; 40 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 43 palabras iniciales; 40 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 39 llamadas y17978 triángulos, 43 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Robot de seis patas con eslabones perfilados,72 fijaciones instanciadas y rodillas calculadas, pies en apoyo diferenciados por color, masa móvil y pista relativa. Tras el primer cálculo se amplió la disposición de caderas y pies: la solución tiene35,78 mm de margen mínimo. Se prueban las18 posiciones de articulaciones y las longitudes. Distinto de orugas225 y AMR200: marcha de trípodes y reacciones baricéntricas.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código 0bb42a6f3eed2bb571f3e147198427dd7a390b0b empujado a main. Deploy exit0; Cloudflare e5306733-c84e-4c5d-953c-39ff27b3a0cc. Login real:132 destacadas,12 iframes exactos (241–250 más236/240), portadas HTTP200, geometría sana y consola limpia. Comprobadas además la fase magnética236, el volumen de chapa240 y las articulaciones del hexápodo250 en producción. Último laboratorio publicado:250. Los commits posteriores de documentación no cambian el código publicado.
