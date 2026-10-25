# mecanica-198 · Alineación láser de maquinaria

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-198 · Deja desplazamiento≤0,03 mm y ángulo≤0,1 mrad ajustando ambos apoyos.

Instrumentos: Cabezal láser, receptor, apoyos y registro de alineación.

Corrige dos apoyos de un motor para eliminar desplazamiento y ángulo respecto de una bomba. Cambiar ambos apoyos igual desplaza el eje. Cambiarlos distinto también lo inclina.

## Archivos exactos
- `public/labs/alineacion-laser-maquinaria.html` y `public/labs/_ficha-alineacion-laser-maquinaria.js`.
- `src/labs/mecanica-198/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 198`.

## Modelo y límites
Desalineación inicial:0,35 mm y0,6 mrad. Apoyos a200 y600 mm del acople. Pendiente corregida=0,6+(hr−hf)/0,4 mrad; offset=0,35+hf−0,2(hr−hf)/0,4 mm.

Sólo plano vertical y ejes rígidos. Correcciones firmadas representan posicionamiento equivalente, no retirar calzas físicamente inexistentes. Sin pie cojo, crecimiento térmico ni tolerancias normativas. Desviación visual amplificada×100.

Fuente del principio: https://www.fluke.com/en/learn/blog/alignment/how-to-check-pump-coupling-alignment

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
