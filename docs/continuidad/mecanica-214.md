# mecanica-214 · Tomografía industrial: proyecciones y poros

Estado al 26-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Observa un fantoma por dentro y elige una adquisición que equilibre muestreo, ruido y exposición relativa.

OT-214 · Obtén paso periférico ≤0,4 mm, ruido relativo central ≤6 % y exposición relativa ≤1,5 M unidades.

Instrumentos: Gantry, fantoma, detector y reconstrucción por retroproyección filtrada.

## Modelo y límites
Fantoma circular R=16 mm con tres poros. Proyecciones paralelas: I=N·exp(−µL), µ=0,10 mm⁻¹ sintético. Longitud de cada cuerda por intersección analítica con círculos. Ruido gaussiano de varianza I como aproximación de conteo Poisson; semilla fija. Logaritmo, filtro rampa discreto Ram-Lak y retroproyección interpolada 64×64 con paso 0,625 mm. Paso periférico=πR/vistas; ruido central≈1/√(N exp(−3,2)); exposición relativa=N·vistas/10⁶.

Reconstrucción 2D paralela ideal, no tomografía cónica completa. Sin dispersión, endurecimiento del haz, respuesta de detector o datos reales. La exposición es un índice relativo, no dosis radiológica. El aspecto interior 3D muestra el fantoma de referencia, no una reconstrucción volumétrica. Rayos en falso color; µ es sintético. No sirve para certificar defectos.

Escala visual y temporal: Proyección paralela ideal · rayos en falso color · referencia 3D

Fuente del principio: https://scikit-image.org/docs/stable/api/skimage.transform.html#skimage.transform.iradon . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/tomografia-industrial-proyecciones.html y _ficha-tomografia-industrial-proyecciones.js.
- Escena específica: public/labs/_fab-214.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-214/, briefing JSON, portada prac_214.webp y descriptor scripts/lab-src/tomografia-industrial-proyecciones.json.
- Construcción: node scripts/build-lab.mjs tomografia-industrial-proyecciones. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 214.
- Flujo: flujo-fabricacion-211-220.mjs --solo 214 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 214.

## Comprobaciones
411 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 49 palabras de prosa inicial, 49 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 49 palabras de prosa inicial, 49 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 49 palabras de prosa inicial, 49 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 49 palabras de prosa inicial, 47 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Gantry, emisor, detector, fantoma, poros y plano de corte. Las medidas del instrumento se reconstruyen mediante Ram-Lak y retroproyección; el volumen3D ilustra el fantoma conocido. La referencia3D no debe presentarse como una reconstrucción volumétrica de los datos. Muestreo y ruido cambian realmente la imagen.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

## Publicación
Código c5d5e93d2adb73f41e07576d03cfc5a097d46d4b empujado a main. Deploy exit0; Cloudflare 2462ce45-d045-40a6-996e-7e2c82f97c77. Login real:102 destacadas, doce iframes exactos (211–220 y regresión201/210), portadas HTTP200, geometría sana y consola limpia. Último laboratorio publicado:220. Los commits posteriores de documentación no cambian el código publicado.
