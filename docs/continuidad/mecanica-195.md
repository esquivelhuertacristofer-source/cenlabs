# mecanica-195 · Apriete controlado por par y ángulo

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-195 · Consigue12–16 kN con esfuerzo≤300 MPa y par entre10 y20 N·m.

Instrumentos: Atornillador, transductor de par y unión seccionada.

Prepara una unión atornillada y comprueba cómo el giro posterior al asiento genera precarga. El avance de rosca estira el tornillo y comprime la unión. La fricción cambia el par sin cambiar ese avance ideal.

## Archivos exactos
- `public/labs/apriete-control-par-angulo.html` y `public/labs/_ficha-apriete-control-par-angulo.js`.
- `src/labs/mecanica-195/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 195`.

## Modelo y límites
Paso1,5 mm; avance=pθ/(2π). Rigidez equivalente tornillo+unión50 MN/m; F=keq avance. Área resistente58 mm². Par ideal=T=F[p/(2π)+µreff], reff=6 mm.

Unión elástica lineal ya asentada, sin plastificación, dispersión de fricción, fluencia ni geometría detallada de rosca. keq representa al conjunto; el avance no es elongación sólo del tornillo. No usa datos de un tornillo certificado.

Fuente del principio: https://www.boschrexroth.com/en/us/products/product-groups/assembly-technology/tightening-technology/

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
