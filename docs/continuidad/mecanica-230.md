# mecanica-230 · Inyección de plástico: llenado, cierre y enfriamiento

Estado al26-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden
Mira el tornillo dosificador y el plástico avanzar por una cavidad con taladros hasta formar una pieza.

OT-230 · Llena en ≤4 s sin superar 400 kN de apertura ni1600 W; expulsa a ≤70 °C y completa el ciclo en ≤28 s.

Equipo e instrumentos: Inyectora seccionada, molde móvil, circuito frío y pieza con taladros.

## Modelo y alcance
Placa82×50×10 mm con esquinas R3 y cuatro taladros R3; área=82·50−(4−π)·9−4π·9 mm². Volumen=área·10. Q=1,5·10⁻¹³P m³/s; llenado=V/Q, apertura=P·área proyectada; potencia=PQ/0,75. T=40+180exp(−tc/8) °C. Ciclo=llenado+2 s mantenimiento+enfriamiento+2 s apertura. Frente por integral del área transversal, volumen conservado. Tornillo D25 mm: avance=V/Atornillo.

Presión de cavidad impuesta y conductancia sintética, sin CFD, viscosidad real, compactación, contracción o FEM. Enfriamiento concentrado exponencial. Taladros y frente son geometría nominal; pequeños biseles son cosméticos. Colores indican temperatura media. Reloj ×3. Si T>70 °C el interbloqueo mantiene cerrado; ciclos reiniciados independientes.

Escalas: Ciclo ×3 · frente volumétrico · enfriamiento concentrado

Fuente del principio: https://www.keyence.com/ss/products/measure-sys/machining/formula/injection-molding.jsp . Constantes del escenario y geometrías sintéticas propias; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/inyeccion-plastico-llenado-molde.html y _ficha-inyeccion-plastico-llenado-molde.js.
- Escena: public/labs/_proc-230.js; utilidades _proceso-piezas.js, que reutiliza las piezas geométricas de _fabricacion-piezas.js.
- _proceso-modelos.js: funciones puras; _proceso-definiciones.js: contrato; _proceso-instrumentos.js: gráficas DOM; _proceso-runtime.js: orden, ensayo e informe; _proceso-escenas.js: dispatcher.
- src/labs/mecanica-230/, briefing JSON, portada prac_230.webp y descriptor scripts/lab-src/inyeccion-plastico-llenado-molde.json.
- Construir entrada: node scripts/build-lab.mjs inyeccion-plastico-llenado-molde. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-proceso-221-230.mjs --solo 230.
- UI: node scripts/auditoria/flujo-proceso-221-230.mjs --solo 230 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-proceso.mjs. Calibraciones: calibraciones-proceso.mjs. Portadas: scripts/portadas/capturar-proceso.mjs --solo 230.

## Verificación
612 comprobaciones numéricas en este banco;40634 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo real por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 53 palabras iniciales; 25 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 53 palabras iniciales; 25 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 53 palabras iniciales; 25 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 53 palabras iniciales; 25 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final de inicio e inspección, sincronía de transformaciones y matrices/colores de instancias, portada propia y barrido sin CDN sanos.44 suites,3356 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin cambios en entradas anteriores.

## Autocrítica visual y originalidad
Inyectora con tolva, tornillo helicoidal, bandas calefactoras, boquilla, tirantes, molde seccionado, refrigeración y pieza con cuatro taladros. La cámara permite ver la cara de la pieza y el frente usa volumen acumulado; no se abre si la liberación programada resulta caliente. En ese caso se retiene la pieza y no se repite una inyección. Es distinto del213: moldeo cerrado y enfriamiento, no deposición por capas.
37–53 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación compartidos. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

Interbloqueo caliente comprobado en la pose de la escena; no implica certificación de seguridad industrial.

## Publicación
Código aae1fdb064a568c64ee6fcc04bfcc2d0fd643a35 empujado a main. Deploy exit0; Cloudflare df771c75-c957-4014-b1d2-8a99f0c330d3. Login real:112 destacadas, doce iframes exactos (221–230 más211/220), portadas HTTP200, geometría sana y consola limpia. Último laboratorio publicado:230. Los commits posteriores de documentación no cambian el código publicado.

## Ajuste final del tornillo
Se corrigió el avance hacia el molde a fracción·V/Atornillo, con escala geométrica6,8 unidades/m correspondiente al diámetro exterior de las hélices. Se acortó la longitud visible para alojar toda la carrera dentro del barril y se inicia la dosificación giratoria después de los2 s de mantenimiento. El informe de sincronía comprueba carrera y extremo dentro del barril. Se repitió correctamente el flujo completo en los cuatro tamaños después de este ajuste; el modelo numérico y los criterios no cambian.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

Comprobación final adicional: cuatro recorridos completos, carrera/extremo dentro del barril, sincronía, portada y barrido sin CDN correctos. Pruebas en .salida/proceso-221-230/repeticion-230.json, sincronia-230-final.json y barrido-230-final.json.
