# mecanica-187 · Calibración del TCP de un robot

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-187 · Calibra la herramienta con error≤0,5 mm y dispersión entre orientaciones≤0,7 mm.

Instrumentos: Punta patrón, referencia fija y comprobación de orientaciones.

Enseña el extremo de una herramienta para que el robot conserve el punto al cambiar de orientación. La brida se mueve alrededor de la referencia enseñada. Una longitud mal declarada hace que la punta real dibuje un arco.

## Archivos exactos
- `public/labs/calibracion-tcp-robot.html` y `public/labs/_ficha-calibracion-tcp-robot.js`.
- `src/labs/mecanica-187/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 187`.

## Modelo y límites
TCP real t=(12,180) mm en el planoXZ. La posición de brida es pF=P−Ry(φ)tdeclarado; punta real=P+Ry(φ)(treal−tdeclarado). φ=0,65 sin(0,8t). Dos eslabones de700 y650 mm sitúan la brida por cinemática inversa plana. Error=norma de la diferencia; dispersión extrema=2 error sin(0,65).

Calibración sintética plana de dos componentes; no estima seis parámetros por mínimos cuadrados, no compensa flexión ni holgura. Un robot articulado planar con muñeca representa el banco, sin modelo de fabricante ni seguridad funcional.

Fuente del principio: https://www.universal-robots.com/manuals/EN/HTML/SW5_19/Content/prod-usr-man/software/PolyScope/content/installation_g5/installation_TCP_configuration_en.htm

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
