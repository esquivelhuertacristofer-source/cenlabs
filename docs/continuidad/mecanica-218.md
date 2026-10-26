# mecanica-218 · Diagnóstico CNC con ballbar

Estado al26-10-2026: TERMINADO y verificado localmente; pendiente publicación confirmada.

## Competencia y orden
Recorre un círculo con una barra de medida y ajusta dos compensaciones geométricas observando el error radial.

OT-218 · Obtén desviación circular ≤3 µm y error radial máximo ≤2 µm ajustando escala y escuadra.

Instrumentos: Centro CNC, barra extensible y registro de desviación circular.

## Modelo y límites
R=100 mm; x0=Rcosθ,y0=Rsinθ. x=(1+ex)x0+tan(ε)y0,y=y0. ex y ε son errores residuales después de compensar. Lectura radial=√(x²+y²)−R. Se muestrea una vuelta cada 1° y se calculan máximo y mínimo. Recorrido impuesto de 8 s; la prueba de regreso ideal reproduce la geometría.

Modelo geométrico de dos errores; no reproduce el software Renishaw ni aplica compensaciones a una CNC. Sin holgura, inversión dinámica, servo, temperatura, montaje de rótulas o calibración del sensor. Errores de posición 3D amplificados 500 veces; números e instrumento conservan micrómetros físicos. Las constantes de referencia se revelan al validar.

Escala visual y temporal: Posición residual ×500 · círculo de referencia 100 mm

Fuente del principio: https://www.renishaw.com/en/ballbar-testing-explained--6818 . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/diagnostico-cnc-ballbar.html y _ficha-diagnostico-cnc-ballbar.js.
- Escena específica: public/labs/_fab-218.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-218/, briefing JSON, portada prac_218.webp y descriptor scripts/lab-src/diagnostico-cnc-ballbar.json.
- Construcción: node scripts/build-lab.mjs diagnostico-cnc-ballbar. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 218.
- Flujo: flujo-fabricacion-211-220.mjs --solo 218 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 218.

## Comprobaciones
1082 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 49 palabras de prosa inicial, 24 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 49 palabras de prosa inicial, 24 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 49 palabras de prosa inicial, 24 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 49 palabras de prosa inicial, 24 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Centro CNC abierto, ejes, husillo y barra extensible con rótulas. Se abrieron las columnas para no tapar la prueba y se conectaron las partes del palpador. Los errores se amplifican500 veces en3D, con unidades físicas en DOM. Se diferencia de186: metrología geométrica de trayectoria, no condiciones de corte.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Constantes de referencia comprobadas en escritorio y móvil: ocultas antes del ensayo y de validar, visibles después de validar y ocultas de nuevo al modificar el ajuste.

## Publicación
Commit, push, deploy y login real pendientes. El último publicado sigue siendo210 hasta confirmar la entrega.
