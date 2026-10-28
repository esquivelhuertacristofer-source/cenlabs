# mecanica-246 · Corte por agua: presión, orificio y potencia

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Orden y competencia profesional
OT-246 · Obtén velocidad ≥700 m/s, agua ≤2 L/min, potencia hidráulica ≤12 kW y avance equivalente ≥0,3 mm/s.

Equipo e instrumentos: Cabezal de corte, placa sobre apoyos y balance de caudal y potencia.

Un cabezal convierte presión hidráulica en un chorro que recorre una placa sobre el tanque. El diámetro cambia caudal y potencia; la presión determina principalmente la velocidad de salida.

## Modelo y límites
Agua incompresibleρ=1000 kg/m³; v=0,97√(2Δp/ρ), Q=0,65A√(2Δp/ρ), Ph=ΔpQ, Pj=½ρQv². Arranque sintético=0,08Pj/(200 J/mm³). Placa10 mm y ranura0,8 mm: avance=arranque/(10·0,8). Corte recto100 mm. Reacción=ρQv.

El avance es un balance sintético de energía; no predice calidad o capacidad de corte de agua pura/abrasivo. Sin compresibilidad a alta presión, mezcla abrasiva, desgaste, taper o breakup. Avance visual×50; marcadores de chorro×1/100000 y diámetro visual ampliado. No es procedimiento de puesta en marcha de alta presión.

Escalas: Avance×50 · marcadores×1/100000 · chorro ampliado

Principio consultado: https://www.flowwaterjet.com/explore/waterjet-basics/effects-of-pressure . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/corte-agua-presion-orificio.html, _ficha-corte-agua-presion-orificio.js y escena _ind-246.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-246/, briefing JSON, portada prac_246.webp y descriptor scripts/lab-src/corte-agua-presion-orificio.json.
- Build: node scripts/build-lab.mjs corte-agua-presion-orificio.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 246.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 246 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 246. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 246.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
1086 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 44 palabras iniciales; 14 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 44 palabras iniciales; 14 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 44 palabras iniciales; 14 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 44 palabras iniciales; 14 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 14 llamadas y23474 triángulos, 44 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Tanque con apoyos, placa, cabezal y chorro con marcadores; material pendiente se retira progresivamente. Se ajustaron100 mm de recorrido,10 mm de placa y0,8 mm de ranura a20 unidades/m. El chorro visual se amplía y sus marcadores se ralentizan. Distinto de EDM233: conversión hidráulica a energía cinética y balance de consumo; avance sintético, no capacidad certificada.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:240.
