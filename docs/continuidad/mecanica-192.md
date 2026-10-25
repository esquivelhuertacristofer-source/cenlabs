# mecanica-192 · Calibración de resolver de tracción

Estado al25-10-2026: PUBLICADO y verificado con login real.

## Orden profesional y competencia practicada
OT-192 · Reduce el error máximo a0,3° y deja la ganancia entre0,99 y1,01.

Instrumentos: Resolver seccionado, encoder patrón y canales seno/coseno.

Contrasta la posición de un resolver contra un encoder patrón y elimina error angular periódico. Los canales seno y coseno definen el ángulo. Un desequilibrio de amplitud produce error aunque el cero parezca correcto.

## Archivos exactos
- `public/labs/calibracion-resolver-traccion.html` y `public/labs/_ficha-calibracion-resolver-traccion.js`.
- `src/labs/mecanica-192/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 192`.

## Modelo y límites
S=g sin(θ+δ), C=cos(θ+δ); θmed=atan2(S,C). Error envuelto a±π; barrido361 orientaciones por vuelta. Giro real0,9 rad/s. Los mandos representan errores residuales tras compensación.

Señales ya demoduladas; sin portadora, ruido, armónicos de devanado, latenciaRDC ni prueba de un inversor real. La geometría del resolver es esquemática en sección.

Fuente del principio: https://www.analog.com/en/resources/analog-dialogue/articles/precision-resolver-to-digital-converter-measures-angular-position-and-velocity.html

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

## Cierre local25-10-2026
Modelo numérico en verde:7730 comprobaciones en el lote. Orden, ensayo de duración real de demostración, rechazo antes de ensayar, validación, diagnóstico de tres casos, quiz, instrumento, informe descargado y caducidad tras modificar/restaurar un control, en los cuatro tamaños.
- 1366×768 DPR1: 49 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 49 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 49 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 390×844 DPR1: 49 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs calibracion-resolver-traccion. QA: flujo-taller-187-200.mjs --solo 192. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 192. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.

## Publicación confirmada25-10-2026
Código 0ea5b0c empujado a main. Deploy exit0; versión Cloudflare 8607aed5-43d6-4f2f-9be6-bbf11a425a30. Login real:82 destacadas,16 iframes exactos (177/181 y187–200), portadas HTTP200, normales cero=0 y consola limpia. El encargo hasta200 queda completo. Los commits posteriores que sólo documenten este cierre no cambian el código publicado.
