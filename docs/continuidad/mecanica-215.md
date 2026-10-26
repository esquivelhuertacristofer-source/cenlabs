# mecanica-215 · Montaje de rodamiento: calentamiento por inducción

Estado al26-10-2026: TERMINADO y verificado localmente; pendiente publicación confirmada.

## Competencia y orden
Calienta un rodamiento, observa su expansión y comprueba la holgura disponible cuando llega al eje.

OT-215 · Consigue holgura de llegada ≥15 µm, temperatura máxima ≤110 °C y calentamiento ≤100 s.

Instrumentos: Calentador, pinza de traslado, rodamiento y eje con interferencia.

## Modelo y límites
Balance concentrado C dT/dt=ηP−H(T−20): C=2,8·460 J/K, η=0,72,H=6 W/K. En traslado de 4 s: enfriamiento con H=10 W/K. Diámetro interior 80 mm, α=11,5·10⁻⁶ K⁻¹. Eje a 20 °C, interferencia fría 0,040 mm; holgura=80α(Tllegada−20)−0,040.

Modelo térmico uniforme con parámetros sintéticos, sin campo electromagnético, gradientes, lubricante ni tensiones de ajuste. El límite de 110 °C pertenece al escenario; un rodamiento real requiere especificación del fabricante. Se omite el ciclo de desmagnetización, declarado pendiente en un procedimiento real. Dilatación dibujada ×200; calentamiento y montaje se comprimen a 12 s de demostración. El cambio de color térmico es falso color, no incandescencia. El yugo se retira antes de elevar y trasladar el rodamiento; cada demostración es un ciclo independiente.

Escala visual y temporal: Dilatación ×200 · calentamiento comprimido · temperatura uniforme · falso color térmico

Fuente del principio: https://www.skf.com/binaries/pub12/Images/0901d1968013be94-SKF-bearing-maintenance-handbook---10001_1-EN%281%29_tcm_12-463040.pdf . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/montaje-rodamiento-induccion.html y _ficha-montaje-rodamiento-induccion.js.
- Escena específica: public/labs/_fab-215.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-215/, briefing JSON, portada prac_215.webp y descriptor scripts/lab-src/montaje-rodamiento-induccion.json.
- Construcción: node scripts/build-lab.mjs montaje-rodamiento-induccion. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 215.
- Flujo: flujo-fabricacion-211-220.mjs --solo 215 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 215.

## Comprobaciones
190 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 46 palabras de prosa inicial, 16 llamadas, encuadre 65.3 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 46 palabras de prosa inicial, 16 llamadas, encuadre 65.3 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 46 palabras de prosa inicial, 16 llamadas, encuadre 65.2 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 46 palabras de prosa inicial, 16 llamadas, encuadre 65.3 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Calentador con núcleo y bobina, yugo retráctil, rodamiento, traslado y eje. Se retiró el yugo antes de elevar, se elevó antes de trasladar y se dejó holgura respecto de la estructura. La expansión visual y la interferencia fría están amplificadas conjuntamente. Se comprueba el margen térmico de llegada. El cambio de color es falso color, no incandescencia. Se diferencia de181: montaje térmico, no análisis de fallas de rodamiento.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Prueba de movimiento: durante el traslado el yugo está retirado y el rodamiento elevado sobre el núcleo.

Inspección y entorno comparten la misma geometría y pose. La prueba adicional comprueba transformaciones y, donde existen, matrices/colores de instancias para evitar que la inspección se congele.

## Publicación
Commit, push, deploy y login real pendientes. El último publicado sigue siendo210 hasta confirmar la entrega.
