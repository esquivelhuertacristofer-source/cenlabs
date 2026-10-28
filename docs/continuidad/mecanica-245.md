# mecanica-245 · Fricción-agitación: unir sin fundir

Estado al28-10-2026: PUBLICADO y verificado con login real.

## Orden y competencia profesional
OT-245 · Mantén500–800 J/mm, temperatura equivalente350–500 °C y potencia ≤1100 W.

Equipo e instrumentos: Banco FSW con sujeción, herramienta no consumible y balance energético.

Una herramienta rotativa atraviesa la junta y deja un cordón continuo entre dos placas sujetas. Relaciona par, potencia y avance con el aporte de energía por milímetro.

## Modelo y límites
Disco de hombro R=8 mm, fuerza axial6000 N, presión uniforme y µ=0,3: T=(2/3)µFR. P=Tω, potencia útil0,8P, aporte lineal=0,8P/v. Temperatura equivalente=20+0,8P/(1+0,75v), con v en mm/s y conductancia sintética en W/K. Junta120 mm; avance visual×20, giro×1/100.

Balance reducido, no resuelve flujo plástico, temperatura3D, tensiones residuales o resistencia del cordón. El color es temperatura equivalente, no metal fundido ni incandescencia. Cordón ilustrativo formado detrás del pin. Sin ajuste de una máquina real. Proceso distinto de puntos, MIG y ultrasonido: herramienta no consumible y unión en estado sólido.

Escalas: Avance×20 · giro×1/100 · falso color térmico

Principio consultado: https://www.twi-global.com/technical-knowledge/job-knowledge/friction-stir-welding-147 . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/soldadura-friccion-agitacion.html, _ficha-soldadura-friccion-agitacion.js y escena _ind-245.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-245/, briefing JSON, portada prac_245.webp y descriptor scripts/lab-src/soldadura-friccion-agitacion.json.
- Build: node scripts/build-lab.mjs soldadura-friccion-agitacion.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 245.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 245 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 245. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 245.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
906 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 42 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 42 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 42 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 42 palabras iniciales; 17 llamadas; encuadre65.0 %; sin errores ni desbordamiento.

Revisión final1366: 17 llamadas y18326 triángulos, 42 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Pórtico, husillo enlazado al carro, hombro y pin sobre dos placas con mordazas. El cordón avanza sólo detrás de la herramienta. Se añadieron bancadas y quill para evitar elementos flotantes. No muestra material fundido; el color representa temperatura equivalente. Distinto de165/212/234: unión en estado sólido por fricción de herramienta no consumible.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código 0bb42a6f3eed2bb571f3e147198427dd7a390b0b empujado a main. Deploy exit0; Cloudflare e5306733-c84e-4c5d-953c-39ff27b3a0cc. Login real:132 destacadas,12 iframes exactos (241–250 más236/240), portadas HTTP200, geometría sana y consola limpia. Comprobadas además la fase magnética236, el volumen de chapa240 y las articulaciones del hexápodo250 en producción. Último laboratorio publicado:250. Los commits posteriores de documentación no cambian el código publicado.
