# mecanica-212 · Soldadura MIG robotizada: formación del cordón

Estado al26-10-2026: TERMINADO y verificado localmente; pendiente publicación confirmada.

## Competencia y orden
Observa cómo el avance de la antorcha forma un cordón y equilibra energía y material por unidad de longitud.

OT-212 · Prepara 100 mm de cordón con aporte 400–650 J/mm, sección depositada 10–15 mm² y duración ≤20 s.

Instrumentos: Robot cartesiano, antorcha MIG, hilo y registro de energía y depósito.

## Modelo y límites
Arco a 22 V; rendimiento constante η=0,75. P=ηVI y H=P/v. Hilo de 1 mm a 6 m/min: Q=π(0,5)²·100 mm³/s. Sección depositada A=Q/v. Ancho ilustrativo de un cordón semielíptico w=√(8A/π). Recorrido lineal de 100 mm.

Parámetros sintéticos independientes para enseñar balances; no reproduce la relación eléctrica de una fuente MIG real ni una WPS. Sin metalurgia, penetración, transferencia de gotas, gas, salpicadura o predicción de resistencia. El color es un indicador de enfriamiento ilustrativo, no termometría ni solución térmica. Pórtico robotizado cartesiano, no brazo de seis ejes. Los destellos son ilustrativos; no representan una distribución predicha de salpicadura.

Escala visual y temporal: Balance por longitud · color de enfriamiento ilustrativo

Fuente del principio: https://www.twi-global.com/technical-knowledge/job-knowledge/measurement-of-arc-welding-parameters-139 . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/soldadura-mig-cordon-robot.html y _ficha-soldadura-mig-cordon-robot.js.
- Escena específica: public/labs/_fab-212.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-212/, briefing JSON, portada prac_212.webp y descriptor scripts/lab-src/soldadura-mig-cordon-robot.json.
- Construcción: node scripts/build-lab.mjs soldadura-mig-cordon-robot. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 212.
- Flujo: flujo-fabricacion-211-220.mjs --solo 212 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 212.

## Comprobaciones
722 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 51 palabras de prosa inicial, 19 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 51 palabras de prosa inicial, 19 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 51 palabras de prosa inicial, 20 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 51 palabras de prosa inicial, 20 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Pórtico cartesiano, antorcha, hilo, arco, baño y cordón con ondulaciones y color de enfriamiento ilustrativo. Se alineó la junta con el avance y se corrigieron sección y posición del depósito. La demostración comienza parcialmente avanzada; el ensayo vuelve al inicio. Se diferencia de165: depósito continuo MIG, no pepitas por resistencia.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Inspección y entorno comparten la misma geometría y pose. La prueba adicional comprueba transformaciones y, donde existen, matrices/colores de instancias para evitar que la inspección se congele.

## Publicación
Commit, push, deploy y login real pendientes. El último publicado sigue siendo210 hasta confirmar la entrega.
