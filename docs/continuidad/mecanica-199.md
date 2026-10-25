# mecanica-199 · Termografía de un cuadro eléctrico

Estado al25-10-2026: terminado y verificado localmente; pendiente publicación confirmada.

## Orden profesional y competencia practicada
OT-199 · Contrasta con patrón80 °C: error≤2 °C, reflejo25±2 °C y contraste≥45 °C.

Instrumentos: CámaraIR virtual, referencia térmica y cuadro con conexiones visibles.

Ajusta una lectura infrarroja para distinguir un contacto caliente de un reflejo sobre metal. La cámara recibe emisión propia y radiación reflejada. En una superficie brillante, el ajuste de emisividad cambia mucho el resultado.

## Archivos exactos
- `public/labs/termografia-cuadro-electrico.html` y `public/labs/_ficha-termografia-cuadro-electrico.js`.
- `src/labs/mecanica-199/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 199`.

## Modelo y límites
Balance gris de banda total: L/σ=εreal Th⁴+(1−εreal)Tr⁴, εreal=0,6, Th=353,15 K yTr=298,15 K. Tmed=[(L/σ−(1−εset)Trset⁴)/εset]^(1/4). Mapa térmico sintético con puntos de calor prescritos.

Modelo de radiación total gris, no respuesta espectral real de una cámara8–14 µm. El mapa no resuelve transferencia térmica ni diagnostica contactos reales. No existe conexión eléctrica real.

Fuente del principio: https://support.flir.com/DSDownload/Assets/T810442-en-US_A4.pdf

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.

## Reanudación25-10 · revisión visual
Se detallaron palancas, bornes y ventilación de los interruptores. Se rotuló explícitamente el indicador térmico como falso color;80 °C no implica emisión visible real. Pendiente terminar QA en los tamaños restantes y publicar.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Protección pedagógica25-10
Las ecuaciones generales siguen disponibles, pero las constantes que resuelven la calibración se muestran en Modelo/Ficha sólo después de validar un ensayo conforme. Cambiar un control vuelve a ocultarlas. Comprobar antes/después y caducidad del registro.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

## Cierre local25-10-2026
Modelo numérico en verde:7730 comprobaciones en el lote. Orden, ensayo de duración real de demostración, rechazo antes de ensayar, validación, diagnóstico de tres casos, quiz, instrumento, informe descargado y caducidad tras modificar/restaurar un control, en los cuatro tamaños.
- 1366×768 DPR1: 48 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 48 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 48 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 390×844 DPR1: 48 palabras iniciales, 14 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.
Protección pedagógica comprobada en escritorio y móvil: constantes ocultas antes del ensayo y antes de validarlo; visibles tras validar; ocultas de nuevo al cambiar el ajuste.
Referencia del modelo para retomar: Modelo de referencia validado: emisividad real0,60; patrón80 °C y reflejo25 °C.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs termografia-cuadro-electrico. QA: flujo-taller-187-200.mjs --solo 199. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 199. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.
