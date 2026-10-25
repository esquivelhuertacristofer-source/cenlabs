# mecanica-199 · Termografía de un cuadro eléctrico

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-199 · Contrasta con patrón80 °C: error≤2 °C, reflejo25±2 °C y contraste≥45 °C.

Instrumentos: CámaraIR virtual, referencia térmica y cuadro con conexiones visibles.

Ajusta una lectura infrarroja para distinguir un contacto caliente de un reflejo sobre metal. La cámara recibe emisión propia y radiación reflejada. En una superficie brillante, el ajuste de emisividad cambia mucho el resultado.

## Archivos exactos
- `public/labs/termografia-cuadro-electrico.html` y `public/labs/_ficha-termografia-cuadro-electrico.js`.
- `src/labs/mecanica-199/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 199`.

## Modelo y límites
Balance gris de banda total: L/σ=εreal Th⁴+(1−εreal)Tr⁴, εreal=0,6, Th=353,15 K yTr=298,15 K. Tmed=[(L/σ−(1−εset)Trset⁴)/εset]^(1/4). Mapa térmico sintético con puntos de calor prescritos.

Modelo de radiación total gris, no respuesta espectral real de una cámara8–14 µm. El mapa no resuelve transferencia térmica ni diagnostica contactos reales. No existe conexión eléctrica real.

Fuente del principio: https://support.flir.com/DSDownload/Assets/T810442-en-US_A4.pdf

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
