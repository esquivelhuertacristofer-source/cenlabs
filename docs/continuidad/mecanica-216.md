# mecanica-216 · Inspección de engranajes: juego y contacto

Estado al26-10-2026: TERMINADO y verificado localmente; pendiente publicación confirmada.

## Competencia y orden
Invierte el giro y relaciona el juego libre con la distribución de carga a lo ancho del diente.

OT-216 · Ajusta juego 0,10–0,20 mm, contacto ≥90 % y carga lineal máxima ≤1,6 veces la media.

Instrumentos: Par de engranes, comparador de inversión y visor de contacto.

## Modelo y límites
Engranes rectos de 20/40 dientes, módulo 2 mm y ángulo de presión 20°. Juego j=0,08+2Δa tan(20°) mm, aproximación para desplazamientos pequeños. Contacto de fundación elástica: q(x)=K max(0,δ−x tanβ), K=1000 N/mm²; ∫q dx=400 N en b=20 mm. Inversión con operador de juego de semiancho j/(2rp), rp=20 mm, y relación 1:2.

No simula contacto Hertziano, lubricación, flexión detallada del diente ni certificación de engranes. El mapa de tinta es un indicador esquemático del reparto lineal de carga, no una huella predictiva 3D. El indicador de inversión amplía el error angular 90 veces; el falso color muestra carga relativa. Giro de inspección alternativo, cuasiestático; sin impacto ni vibración dinámica.

Escala visual y temporal: Juego ampliado · contacto de fundación elástica · sin Hertz 3D

Fuente del principio: https://www.khkgears.us/media/1224/a-primer-on-backlash-and-its-purpose-in-gear-designs.pdf . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/inspeccion-engranajes-contacto.html y _ficha-inspeccion-engranajes-contacto.js.
- Escena específica: public/labs/_fab-216.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-216/, briefing JSON, portada prac_216.webp y descriptor scripts/lab-src/inspeccion-engranajes-contacto.json.
- Construcción: node scripts/build-lab.mjs inspeccion-engranajes-contacto. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 216.
- Flujo: flujo-fabricacion-211-220.mjs --solo 216 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 216.

## Comprobaciones
893 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 49 palabras de prosa inicial, 9 llamadas, encuadre 68.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 49 palabras de prosa inicial, 9 llamadas, encuadre 68.3 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 49 palabras de prosa inicial, 9 llamadas, encuadre 67.5 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 49 palabras de prosa inicial, 9 llamadas, encuadre 68.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Dos engranes de perfil evolvente con cubos, apoyos e indicador de inversión. El contacto se muestra con instancias coloreadas sobre los dientes; vista oblicua para leer el ancho. El indicador amplifica el error angular. El reparto de carga usa una fundación elástica declarada, no Hertz3D. Se diferencia de167/182/183: inspecciona montaje, no dimensiona un reductor.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Inspección y entorno comparten la misma geometría y pose. La prueba adicional comprueba transformaciones y, donde existen, matrices/colores de instancias para evitar que la inspección se congele.

## Publicación
Commit, push, deploy y login real pendientes. El último publicado sigue siendo210 hasta confirmar la entrega.
