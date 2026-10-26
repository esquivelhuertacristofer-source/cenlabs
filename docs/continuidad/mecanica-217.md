# mecanica-217 · Impedancia de batería: ajuste de un circuito equivalente

Estado al 26-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Compara medidas complejas en frecuencia y ajusta un modelo eléctrico de una celda.

OT-217 · Ajusta el espectro medido hasta obtener residuo complejo RMS ≤0,6 mΩ y coherencia de la constante dinámica.

Instrumentos: Celda virtual en corte, conexión Kelvin y analizador Nyquist/Bode.

## Modelo y límites
Circuito reducido Rs+(Rct∥C), Rs=8 mΩ conocido. Z=Rs+Rct/(1+j2πf Rct C); 41 frecuencias de 0,1 a 1000 Hz. Datos sintéticos sin ruido. Frecuencia característica fc=1/(2πRct C). Excitación ilustrativa a 1 Hz y 0,1 A; tensión incremental obtenida del mismo circuito medido. Resistencia y capacidad desconocidas se ajustan a los datos.

No es un modelo electroquímico completo ni estima salud, capacidad útil o seguridad de una batería real. Sin difusión Warburg, CPE, inductancia de cables, SOC, temperatura o no linealidad. Capas y portadores en 3D son un esquema físico ampliado; la medición se presenta en DOM. La prueba no controla una batería ni un potenciostato real.

Escala visual y temporal: Celda en corte esquemático · excitación incremental 1 Hz

Fuente del principio: https://www.gamry.com/application-notes/eis/basics-of-electrochemical-impedance-spectroscopy . Parámetros del escenario y geometrías didácticos propios.

## Archivos y receta para retomar
- public/labs/impedancia-bateria-eis.html y _ficha-impedancia-bateria-eis.js.
- Escena específica: public/labs/_fab-217.js; utilidades geométricas: _fabricacion-piezas.js.
- Contratos, modelo puro, instrumentos y flujo: _fabricacion-definiciones/modelos/instrumentos/runtime.js. Dispatcher: _fabricacion-escenas.js.
- src/labs/mecanica-217/, briefing JSON, portada prac_217.webp y descriptor scripts/lab-src/impedancia-bateria-eis.json.
- Construcción: node scripts/build-lab.mjs impedancia-bateria-eis. No reejecutar generadores históricos sobre escenas mejoradas.
- Física: node scripts/auditoria/verifica-fabricacion-211-220.mjs --solo 217.
- Flujo: flujo-fabricacion-211-220.mjs --solo 217 --inspeccion. --reanudar conserva informe.json; QA_REPORT permite una salida aparte.
- Calibraciones: calibraciones-fabricacion.mjs. Sincronía y envolventes: sincronia-fabricacion.mjs. Portada: capturar-fabricacion.mjs --solo 217.

## Comprobaciones
365 comprobaciones numéricas para este laboratorio;6229 en la tanda. Valores iniciales rechazados y solución interior aceptada. Orden, preparación, rechazo sin ensayo, adquisición completa, validación, quiz, tres diagnósticos, instrumento e informe descargado y caducidad tras modificar/restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR1: 39 palabras de prosa inicial, 62 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 1600×900, DPR1: 39 palabras de prosa inicial, 62 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 2020×1055, DPR1.25: 39 palabras de prosa inicial, 62 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.
- 390×844, DPR1: 39 palabras de prosa inicial, 62 llamadas, encuadre 65.0 %, sin normales nulas ni desbordamiento.

Revisión visual final de inicio e inspección a1366; portada propia; barrido sin CDN sano. Los detalles visuales posteriores al primer recorrido se verificaron de nuevo en esa revisión.44 suites,3286 pruebas y12 snapshots correctos; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales;120 líneas nuevas de catálogo y420 de datos, sin alterar entradas anteriores.

## Autocrítica
Celda en corte con colectores, capas, portadores esquemáticos, potenciostato y cuatro conexiones Kelvin. Se conservaron cables en inspección y se sincronizaron matrices y colores de las instancias. Nyquist y Bode usan datos complejos; el ajuste no determina por sí solo salud o vida de una batería. Se diferencia de8/146: identificación de impedancia, no BMS ni refrigeración.
La escena y el fenómeno se ven desde la entrada;39–54 palabras iniciales, datos en DOM y ecuaciones en paneles cerrados. La vista inicial se acerca al equipo en los casos donde el banco completo lo hacía pequeño. La complejidad visual varía con el instrumento: no se afirma eficacia educativa demostrada sin probar con estudiantes y docentes.

Constantes de referencia comprobadas en escritorio y móvil: ocultas antes del ensayo y de validar, visibles después de validar y ocultas de nuevo al modificar el ajuste.

Inspección y entorno comparten la misma geometría y pose. La prueba adicional comprueba transformaciones y, donde existen, matrices/colores de instancias para evitar que la inspección se congele.

## Publicación
Código c5d5e93d2adb73f41e07576d03cfc5a097d46d4b empujado a main. Deploy exit0; Cloudflare 2462ce45-d045-40a6-996e-7e2c82f97c77. Login real:102 destacadas, doce iframes exactos (211–220 y regresión201/210), portadas HTTP200, geometría sana y consola limpia. Último laboratorio publicado:220. Los commits posteriores de documentación no cambian el código publicado.
