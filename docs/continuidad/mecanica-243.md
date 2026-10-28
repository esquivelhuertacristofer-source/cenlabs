# mecanica-243 · Compresor scroll: orbitar para comprimir

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Orden y competencia profesional
OT-243 · Entrega40–65 L/min con relación ≥2,5, salida ≤120 °C y potencia de eje ≤400 W.

Equipo e instrumentos: Compresor abierto, dos involutas y analizador de compresión.

Una espiral permanece fija y otra describe una órbita sin girar sobre sí misma. Relaciona el régimen, el caudal aspirado y el calentamiento de una compresión politrópica.

## Modelo y límites
Aire ideal: p1=101325 Pa,T1=293,15 K,n=1,3; T2=T1 r^((n−1)/n). Desplazamiento nominal25 cm³/vuelta y ηv=0,9−0,03(r−1); Q=VdNηv/60. Potencia=[n/(n−1)]p1Q[r^((n−1)/n)−1]/0,8. Involuta rb[cos a+a sin a,sin a−a cos a]. Traslación orbital e=πrb−espesor, rb=0,09 y espesor0,09 unidades. Volumen conceptual V=25(1−0,65fase) cm³, pV^n=constante.

Aire, no refrigerante real. Espirales ilustrativas sin simulación de sellado o contacto. El desplazamiento y volumen conceptual son nominales prescritos, no volúmenes calculados entre paredes. Sin fugas transitorias, Oldham dinámico o lubricación. Giro del excéntrico×1/120. El portador orbital no gira.

Escalas: Excéntrico×1/120 · espirales ilustrativas · volumen conceptual

Principio consultado: https://www.copeland.com/en-us/products-solutions/compression-technologies-systems/scroll-compressors . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/compresor-scroll-orbita.html, _ficha-compresor-scroll-orbita.js y escena _ind-243.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-243/, briefing JSON, portada prac_243.webp y descriptor scripts/lab-src/compresor-scroll-orbita.json.
- Build: node scripts/build-lab.mjs compresor-scroll-orbita.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 243.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 243 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 243. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 243.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
906 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 41 palabras iniciales; 11 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 41 palabras iniciales; 13 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 41 palabras iniciales; 13 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 41 palabras iniciales; 13 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 13 llamadas y14274 triángulos, 41 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Dos paredes de involuta de colores metálicos, carcasa abierta, eje excéntrico y apoyos. Se movió la placa posterior para que no ocultara las espirales. La espiral orbital conserva orientación; la presión conceptual no se atribuye a bolsas geométricas que este modelo no resuelve. Distinto del Roots226: órbita sin rotación y compresión politrópica de aire.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:240.
