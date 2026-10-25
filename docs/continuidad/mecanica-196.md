# mecanica-196 · Ajuste de un sensor láser de triangulación

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-196 · Mantén el punto dentro de±512 px y la incertidumbre≤0,8 mm con base≤90 mm.

Instrumentos: Emisor láser, receptor óptico y blanco móvil.

Diseña la geometría de un sensor que mida piezas entre200 y500 mm sin sacar el punto del detector. Una base mayor mejora la sensibilidad a distancia; el ángulo del receptor debe mantener todo el recorrido dentro del sensor.

## Archivos exactos
- `public/labs/sensor-laser-triangulacion.html` y `public/labs/_ficha-sensor-laser-triangulacion.js`.
- `src/labs/mecanica-196/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 196`.

## Modelo y límites
Proyección paraxial con receptor descentrado: u=fpx(b/z−tanφ), fpx=800. σu=0,2 px; propagación σz=z²σu/(fpx b). Se comprueban los extremosz=0,2 y0,5 m.

Cámara de proyección ideal con término de descentrado; φ es un ajuste equivalente del centro de imagen, no una rotación completa de cámara. Sin speckle, saturación, reflectancia, calibración radial ni oclusión. Haz visible esquemático.

Fuente del principio: https://www.micro-epsilon.com/distance-sensors/laser-sensors/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
