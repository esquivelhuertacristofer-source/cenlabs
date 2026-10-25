# mecanica-200 · Robot AMR: calibración y regreso al muelle

Estado al25-10-2026: PUBLICADO y verificado con login real.

## Orden profesional y competencia practicada
OT-200 · Vuelve tras un cuadrado con error≤50 mm, orientación≤2° y escala de distancia dentro de1 %.

Instrumentos: AMR, encoders, muelle, plano de almacén y escáner de distancias.

Calibra un robot móvil de almacén para completar una ruta y regresar al muelle con posición y orientación correctas. El radio de rueda cambia la distancia recorrida. La separación entre ruedas cambia cuánto gira ante órdenes opuestas.

## Archivos exactos
- `public/labs/robot-amr-calibracion-odometria.html` y `public/labs/_ficha-robot-amr-calibracion-odometria.js`.
- `src/labs/mecanica-200/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 200`.

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

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Revisión visual25-10
La inspección centrada ya sigue al mismo robot. Se ajustó la envolvente para que las ruedas sean visibles conservando la vía real de500 mm; se corrigió el apoyo sobre el suelo y la altura de los rayos con el escáner. La odometría no cambió. Verificar también captura final a1366 antes de publicar.

## Protección pedagógica25-10
Las ecuaciones generales siguen disponibles, pero las constantes que resuelven la calibración se muestran en Modelo/Ficha sólo después de validar un ensayo conforme. Cambiar un control vuelve a ocultarlas. Comprobar antes/después y caducidad del registro.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

## Cierre local25-10-2026
Modelo numérico en verde:7730 comprobaciones en el lote. Orden, ensayo de duración real de demostración, rechazo antes de ensayar, validación, diagnóstico de tres casos, quiz, instrumento, informe descargado y caducidad tras modificar/restaurar un control, en los cuatro tamaños.
- 1366×768 DPR1: 56 palabras iniciales, 48 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 56 palabras iniciales, 48 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 56 palabras iniciales, 48 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 390×844 DPR1: 56 palabras iniciales, 48 llamadas de dibujo, normales cero=0, objeto59.8 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.
Protección pedagógica comprobada en escritorio y móvil: constantes ocultas antes del ensayo y antes de validarlo; visibles tras validar; ocultas de nuevo al cambiar el ajuste.
Referencia del modelo para retomar: Modelo de referencia validado: radio real100 mm y vía real500 mm.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs robot-amr-calibracion-odometria. QA: flujo-taller-187-200.mjs --solo 200. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 200. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.

## Publicación confirmada25-10-2026
Código 0ea5b0c empujado a main. Deploy exit0; versión Cloudflare 8607aed5-43d6-4f2f-9be6-bbf11a425a30. Login real:82 destacadas,16 iframes exactos (177/181 y187–200), portadas HTTP200, normales cero=0 y consola limpia. El encargo hasta200 queda completo. Los commits posteriores que sólo documenten este cierre no cambian el código publicado.
