# mecanica-187 · Calibración del TCP de un robot

Estado al25-10-2026: terminado y verificado localmente; pendiente publicación confirmada.

## Orden profesional y competencia practicada
OT-187 · Calibra la herramienta con error≤0,5 mm y dispersión entre orientaciones≤0,7 mm.

Instrumentos: Punta patrón, referencia fija y comprobación de orientaciones.

Enseña el extremo de una herramienta para que el robot conserve el punto al cambiar de orientación. La brida se mueve alrededor de la referencia enseñada. Una longitud mal declarada hace que la punta real dibuje un arco.

## Archivos exactos
- `public/labs/calibracion-tcp-robot.html` y `public/labs/_ficha-calibracion-tcp-robot.js`.
- `src/labs/mecanica-187/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 187`.

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

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Reanudación25-10 · revisión visual
Se detalló la muñeca con bridas escalonadas, juntas y fijaciones. La inspección conserva las posiciones y el modelo original. Pendiente terminar QA en los tamaños restantes y publicar.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Protección pedagógica25-10
Las ecuaciones generales siguen disponibles, pero las constantes que resuelven la calibración se muestran en Modelo/Ficha sólo después de validar un ensayo conforme. Cambiar un control vuelve a ocultarlas. Comprobar antes/después y caducidad del registro.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

## Cierre local25-10-2026
Modelo numérico en verde:7730 comprobaciones en el lote. Orden, ensayo de duración real de demostración, rechazo antes de ensayar, validación, diagnóstico de tres casos, quiz, instrumento, informe descargado y caducidad tras modificar/restaurar un control, en los cuatro tamaños.
- 1366×768 DPR1: 55 palabras iniciales, 21 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 55 palabras iniciales, 20 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 55 palabras iniciales, 20 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 390×844 DPR1: 55 palabras iniciales, 20 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.
Protección pedagógica comprobada en escritorio y móvil: constantes ocultas antes del ensayo y antes de validarlo; visibles tras validar; ocultas de nuevo al cambiar el ajuste.
Referencia del modelo para retomar: Modelo de referencia validado: TCP real (12,180) mm en el plano XZ.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs calibracion-tcp-robot. QA: flujo-taller-187-200.mjs --solo 187. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 187. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.
