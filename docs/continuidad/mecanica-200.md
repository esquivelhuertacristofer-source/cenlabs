# mecanica-200 · Robot AMR: calibración y regreso al muelle

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-200 · Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %.

Instrumentos: AMR, encoders, muelle, plano de almacén y escáner de distancias.

Calibra un robot móvil de almacén para completar una ruta y regresar al muelle con posición y orientación correctas. El radio de rueda cambia la distancia recorrida. La separación entre ruedas cambia cuánto gira ante órdenes opuestas.

## Archivos exactos
- `public/labs/robot-amr-calibracion-odometria.html` y `public/labs/_ficha-robot-amr-calibracion-odometria.js`.
- `src/labs/mecanica-200/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 200`.

## Modelo y límites
Robot diferencial: v=r(ωR+ωL)/2, Ω=r(ωR−ωL)/b. Radio real100 mm y vía real500 mm. Órdenes calculadas con geometría declarada: cuatro rectas nominales2 m y cuatro giros de90°. Rectas3 s, giros1 s; integración exacta por segmento. LiDAR visual usa intersección geométrica con estantes.

Sin deslizamiento, ruido de encoder, obstáculos dinámicos, SLAM, planificación ni control de seguridad. Trayectoria abierta para calibración, no navegación autónoma de un fabricante. El ciclo se reinicia después de18 s; no es una maniobra física instantánea.

Fuente del principio: https://www.roboticsbook.org/S52_diffdrive_actions.html

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
