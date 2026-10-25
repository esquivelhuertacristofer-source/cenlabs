# mecanica-194 · Inspección por corrientes inducidas

Estado al25-10-2026: terminado y verificado localmente; pendiente publicación confirmada.

## Orden profesional y competencia practicada
OT-194 · Obtén sensibilidad≥0,15 con separación≤0,4 mm y profundidad de piel0,4–1,2 mm.

Instrumentos: Sonda, cupón con ranura y plano de impedancia.

Selecciona frecuencia y separación de una sonda para revelar una discontinuidad superficial en aluminio. La frecuencia limita la profundidad de penetración. Alejar la bobina también reduce la señal de la discontinuidad.

## Archivos exactos
- `public/labs/corrientes-inducidas-inspeccion.html` y `public/labs/_ficha-corrientes-inducidas-inspeccion.js`.
- `src/labs/mecanica-194/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 194`.

## Modelo y límites
δ=√(2/(ωµσ)), µ=µ0 y σ=35 MS/m. Modelo sintético de señal para discontinuidad de0,5 mm: S=(d/δ) exp(−(d+2h)/δ). Canales complejos con fase d/δ y envolvente gaussiana del barrido.

La profundidad de piel es física; la respuesta de grieta es una función didáctica sintética, no soluciónMaxwell/FEM ni criterioNDT real. No estima tamaño de grieta real ni reproduce un equipo comercial.

Fuente del principio: https://ims.evidentscientific.com/en/learn/ndt-tutorials/eddy-current-tutorial

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
- 1366×768 DPR1: 45 palabras iniciales, 22 llamadas de dibujo, normales cero=0, objeto64.9 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 45 palabras iniciales, 22 llamadas de dibujo, normales cero=0, objeto64.9 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 45 palabras iniciales, 22 llamadas de dibujo, normales cero=0, objeto64.9 %, sin errores ni desbordamientos.
- 390×844 DPR1: 45 palabras iniciales, 22 llamadas de dibujo, normales cero=0, objeto63.6 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs corrientes-inducidas-inspeccion. QA: flujo-taller-187-200.mjs --solo 194. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 194. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.
