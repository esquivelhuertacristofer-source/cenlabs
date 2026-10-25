# mecanica-191 · Puesta en servicio de precarga HV

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-191 · Limita el pico a8 A y2500 W; cierra en≤900 ms con diferencia≤20 V.

Instrumentos: Resistencia, condensadores, contactores en corte y registroV/I.

Dimensiona una precarga virtual para que el enlace de continua alcance tensión antes de cerrar el contactor principal. La resistencia limita la corriente inicial. Si el cierre llega pronto, queda una diferencia de tensión importante.

## Archivos exactos
- `public/labs/puesta-servicio-precarga-hv.html` y `public/labs/_ficha-puesta-servicio-precarga-hv.js`.
- `src/labs/mecanica-191/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 191`.

## Modelo y límites
V=400 V,C=2 mF; Vc=V(1−exp(−t/RC)), I=V/R exp(−t/RC). Calor enR=CV²/2(1−exp(−2tc/RC)). Diferencia al cierre=V exp(−tc/RC). El indicador del contactor sigue tc.

RC ideal, fuente rígida y contactor lógico. Al cerrar no se integra el transitorio del camino principal; la tensión mostrada conserva el valor previo. Sin arco, rebote, capacidad parásita, batería dinámica ni norma de seguridad. Sólo banco virtual.

Fuente del principio: https://www.ti.com.cn/cn/lit/ug/tiduf73/tiduf73.pdf

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
