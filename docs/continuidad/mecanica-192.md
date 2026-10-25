# mecanica-192 · Calibración de resolver de tracción

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-192 · Reduce el error máximo a0,3° y deja la ganancia entre0,99 y1,01.

Instrumentos: Resolver seccionado, encoder patrón y canales seno/coseno.

Contrasta la posición de un resolver contra un encoder patrón y elimina error angular periódico. Los canales seno y coseno definen el ángulo. Un desequilibrio de amplitud produce error aunque el cero parezca correcto.

## Archivos exactos
- `public/labs/calibracion-resolver-traccion.html` y `public/labs/_ficha-calibracion-resolver-traccion.js`.
- `src/labs/mecanica-192/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 192`.

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
