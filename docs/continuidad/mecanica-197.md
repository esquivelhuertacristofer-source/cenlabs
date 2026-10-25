# mecanica-197 · Ensayo de estanqueidad por caída de presión

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-197 · Mide con error≤5 %, caída≥20 Pa y ciclo total≤130 s.

Instrumentos: Recipiente, válvulas, presión diferencial y fuga patrón.

Programa un ensayo de estanqueidad sin confundir enfriamiento del aire con una fuga. Tras presurizar, el gas aún cambia de temperatura. Esperar reduce el sesgo, pero alarga el ciclo de producción.

## Archivos exactos
- `public/labs/estanqueidad-caida-presion.html` y `public/labs/_ficha-estanqueidad-caida-presion.js`.
- `src/labs/mecanica-197/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 197`.

## Modelo y límites
Recipiente1 L, presión absoluta300 kPa, T=298,15 K, fuga patrón0,8 cm³/min referida a101325 Pa. Caída isoterma por fuga: Pamb Q/V. Transitorio térmico añadidoP0·0,5/T·exp(−t/15). EstimaciónQ=ΔP V/(Pamb Δt).

Fuga constante referida al ambiente y perturbación térmica linealizada. Sin elasticidad del recipiente, variación de caudal con presión ni temperatura espacial. El ensayo se reproduce en6 s de demostración y muestra en la orden sus segundos físicos.

Fuente del principio: https://www.ateq-leaktesting.com/leak-testing/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
