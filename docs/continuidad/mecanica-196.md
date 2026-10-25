# mecanica-196 · Ajuste de un sensor láser de triangulación

Estado al25-10-2026: terminado y verificado localmente; pendiente publicación confirmada.

## Orden profesional y competencia practicada
OT-196 · Mantén el punto dentro de±512 px y la incertidumbre≤0,8 mm con base≤90 mm.

Instrumentos: Emisor láser, receptor óptico y blanco móvil.

Diseña la geometría de un sensor que mida piezas entre200 y500 mm sin sacar el punto del detector. Una base mayor mejora la sensibilidad a distancia; el ángulo del receptor debe mantener todo el recorrido dentro del sensor.

## Archivos exactos
- `public/labs/sensor-laser-triangulacion.html` y `public/labs/_ficha-sensor-laser-triangulacion.js`.
- `src/labs/mecanica-196/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 196`.

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

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

## Cierre local25-10-2026
Modelo numérico en verde:7730 comprobaciones en el lote. Orden, ensayo de duración real de demostración, rechazo antes de ensayar, validación, diagnóstico de tres casos, quiz, instrumento, informe descargado y caducidad tras modificar/restaurar un control, en los cuatro tamaños.
- 1366×768 DPR1: 56 palabras iniciales, 31 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 56 palabras iniciales, 31 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 56 palabras iniciales, 31 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 390×844 DPR1: 56 palabras iniciales, 31 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs sensor-laser-triangulacion. QA: flujo-taller-187-200.mjs --solo 196. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 196. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.
