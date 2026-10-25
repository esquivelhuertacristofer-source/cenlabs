# mecanica-188 · Selección óptica de visión industrial

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-188 · Encuadra160–220 mm con≤0,09 mm/píxel y profundidad de campo≥8 mm.

Instrumentos: Lente, sensor2448 px, patrón y calculadora óptica.

Configura la óptica de una cámara para inspeccionar una pieza completa conservando detalle y profundidad útil. Una focal larga acerca los detalles pero reduce el campo. La distancia de trabajo también cambia el área que cabe en el sensor.

## Archivos exactos
- `public/labs/banco-optica-vision-industrial.html` y `public/labs/_ficha-banco-optica-vision-industrial.js`.
- `src/labs/mecanica-188/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 188`.

## Modelo y límites
Lente delgada:1/f=1/s+1/s′; m=s′/s; campo=8,8 mm/m en sensor de2448 px. N=8, círculo de confusión10 µm. H=f²/(Nc)+f, Dn=Hs/(H+s−f), Df=Hs/(H−s+f).

Óptica paraxial ideal; profundidad de campo convencional por círculo de confusión. Sin difracción, MTF, distorsión, exposición, ruido ni algoritmo comercial. No es calibración de intrínsecos de una cámara real.

Fuente del principio: https://www.baslerweb.com/en-us/learning/lens-selection/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
