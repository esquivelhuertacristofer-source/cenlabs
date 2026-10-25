# mecanica-190 · Ensayo virtual de aislamiento de motor

Estado al 24-10-2026: implementado; pendiente auditoría, revisión visual e integración. NO declarar terminado ni publicado.

## Orden profesional y competencia practicada
OT-190 · Simula450–500 V; lee con error≤5 % antes de25 s y energía≤0,3 J.

Instrumentos: Megóhmetro virtual, devanado en corte y registro de corriente.

Interpreta un ensayo de aislamiento distinguiendo la carga capacitiva de la fuga permanente. La corriente inicial carga la capacidad del devanado. Leer demasiado pronto produce una resistencia aparente baja.

## Archivos exactos
- `public/labs/ensayo-aislamiento-motor.html` y `public/labs/_ficha-ensayo-aislamiento-motor.js`.
- `src/labs/mecanica-190/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-mecanismos-187-200.mjs --solo 190`.

## Modelo y límites
Fuente con Rs=1 MΩ alimenta R=180 MΩ en paralelo con C=2 µF. τ=(Rs||R)C; Vc=V R/(R+Rs)(1−exp(−t/τ)); Ifuente=(V−Vc)/Rs; Rap=Vc/Ifuente. Lectura al tiempo configurado.

ModeloRC aislado virtual, sin absorción dieléctrica, humedad, temperatura ni procedimiento real de alta tensión. Valores didácticos; no son criterio normativo de aislamiento. Se acelera el tiempo de ensayo×5 en pantalla.

Fuente del principio: https://www.megger.com/en-us/blog/Oct-2024/IRTblog2

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.
