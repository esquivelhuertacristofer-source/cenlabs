# mecanica-242 · Robot por impedancia: tocar sin golpear

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Orden y competencia profesional
OT-242 · Obtén fuerza final14–18 N, pico ≤22 N y establecimiento a2 % ≤1 s.

Equipo e instrumentos: Brazo articulado, palpador elástico y adquisición de fuerza.

Un brazo acerca una herramienta a un palpador elástico y registra la fuerza de contacto. La rigidez define la fuerza final y el amortiguamiento limita el golpe transitorio.

## Modelo y límites
Eje cartesiano equivalente: m=2 kg, objetivo xd=40 mm dentro del cero de contacto. mẍ=K(xd−x)−Dẋ−Ke max(0,x), Ke=2000 N/m. Estado inicial x=−15 mm, v=0. RK4 con Δt=1 ms durante4 s. Fuerza=Ke max(0,x). Equilibrio F∞=KeKxd/(Ke+K). El brazo muestra la cinemática inversa prescrita del TCP; la dinámica es sólo del eje normal.

Modelo de contacto unilateral sin adhesión, fricción tangencial o impacto rígido. Parámetros sintéticos, sin dinámica completa del robot ni certificación de colaboración. Desplazamiento normal ampliado×8; fuerza y reloj en segundos físicos. Retorno entre ensayos prescrito.

Escalas: Desplazamiento normal×8 · dinámica1D · masa equivalente2 kg

Principio consultado: https://github.com/frankarobotics/libfranka/blob/main/examples/cartesian_impedance_control.cpp . Geometría y constantes de escenario propias, no datos comerciales.

## Archivos y receta para retomar
- public/labs/robot-impedancia-contacto.html, _ficha-robot-impedancia-contacto.js y escena _ind-242.js.
- _industria-modelos.js: funciones puras; _industria-definiciones.js: contrato; _industria-runtime.js: orden, ensayo e informe; _industria-instrumentos.js: lecturas y curvas DOM; _industria-escenas.js y _industria-piezas.js. Se reutilizan utilidades geométricas anteriores.
- src/labs/mecanica-242/, briefing JSON, portada prac_242.webp y descriptor scripts/lab-src/robot-impedancia-contacto.json.
- Build: node scripts/build-lab.mjs robot-impedancia-contacto.
- Física: node scripts/auditoria/verifica-industria-241-250.mjs --solo 242.
- Flujo: node scripts/auditoria/flujo-industria-241-250.mjs --solo 242 --inspeccion. --reanudar conserva informe.json; QA_REPORT cambia salida.
- Sincronía y geometría: sincronia-industria.mjs; admite --solo 242. Revelado: protecciones-industria.mjs. Portada: scripts/portadas/capturar-industria.mjs --solo 242.
- Evidencia: scripts/auditoria/.salida/industria-241-250/. No ejecutar los generadores históricos de work/ sobre escenas refinadas.

## Pruebas
811 comprobaciones numéricas;14738 en la tanda. Valores iniciales rechazados y solución interior sobre la rejilla de controles aceptada. Ensayo completo obligatorio, validación manual, quiz barajado, tres diagnósticos, instrumento, descarga de informe y caducidad del registro al modificar/restaurar un control.
- 1366×768, DPR1: 43 palabras iniciales; 20 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 1600×900, DPR1: 43 palabras iniciales; 20 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 2020×1055, DPR1.25: 43 palabras iniciales; 20 llamadas; encuadre65.0 %; sin errores ni desbordamiento.
- 390×844, DPR1: 43 palabras iniciales; 20 llamadas; encuadre63.2 %; sin errores ni desbordamiento.

Revisión final1366: 17 llamadas y16694 triángulos, 43 palabras. Diez comparaciones de sincronía de pose/geometría/instancias y diez pruebas geométricas específicas. Altura real de mallas visibles comprobada en244/249;20 protecciones de curvas. Diez portadas propias y10/10 sin CDN.44 suites,3496 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; entradas anteriores sin cambios semánticos.

## Autocrítica y originalidad
Brazo de dos eslabones, muñeca, palpador, resorte y bancada. Se unieron las superficies de contacto al desplazamiento normal y se incluyeron los apoyos en inspección. Las longitudes de los eslabones son constantes. Distinto de RCC203 y PD189: dinámica unilateral de contacto y relación fuerza–deformación por impedancia, sin certificar colaboración.

La prosa inicial queda en47 palabras como máximo. Los instrumentos están en DOM y los contratos cerrados; la escena muestra el fenómeno desde la entrada. Se corrigieron ocultaciones y apoyos antes del cierre. No se afirma eficacia educativa medida sin evaluación con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:240.
