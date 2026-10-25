# mecanica-189 · Sintonía de un servoeje PD

Estado al25-10-2026: terminado y verificado localmente; pendiente publicación confirmada.

## Orden profesional y competencia practicada
OT-189 · Sigue el escalón con sobreimpulso≤5 %, establecimiento≤0,8 s y fuerza≤150 N.

Instrumentos: Servo lineal, encoder y respuesta a escalón.

Ajusta un eje de posicionamiento para alcanzar100 mm con rapidez, poco rebote y fuerza admisible. La ganancia proporcional empuja hacia la consigna. La derivativa frena el movimiento; ambas cambian la respuesta del carro.

## Archivos exactos
- `public/labs/sintonia-servoeje-pd.html` y `public/labs/_ficha-sintonia-servoeje-pd.js`.
- `src/labs/mecanica-189/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 189`.

## Modelo y límites
M x″+(B+Kd)x′+Kp x=Kp r, M=5 kg, B=10 N·s/m, r=0,1 m. Solución cerrada de segundo orden incluyendo amortiguamiento crítico y sobreamortiguado. Fuerza=Kp(r−x)−Kd x′. Estadísticas por barrido0–8 s cada5 ms.

PD ideal, sin integral, muestreo, saturación del actuador, ruido, fricción seca ni retardo. El límite de fuerza se comprueba pero no se impone como saturación. Cada3 s se repite un escalón independiente.

Fuente del principio: https://www.ni.com/en/shop/labview/pid-theory-explained.html

## Qué revisar antes de cerrar
Comprobar valores de referencia independientes, rechazar los valores iniciales y encontrar una solución interior. Ejecutar flujos con clics, diagnóstico y quiz, cuatro tamaños, medio/alto, normales y consumo; escribir autocrítica. Después marcar terminado, actualizar índice, commit y despliegue confirmado. No basta con que se abra la página.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Pausa solicitada por el usuario
24-10-2026: implementación local; NO terminado ni publicado. 1/4 recorridos completos guardados. Faltan cierre visual final, tamaños restantes, portada, barrido sin red, Jest global y publicación. Ver PAUSA-HASTA-200.md para retomar.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

## Comprobación de referencia25-10
El plano de consigna queda en xvisual=−0,65+10·0,1=0,35, coincidente con el centro del carro a100 mm. La traslación visual×10 se rotula. No cambió el modeloPD.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

## Cierre local25-10-2026
Modelo numérico en verde:7730 comprobaciones en el lote. Orden, ensayo de duración real de demostración, rechazo antes de ensayar, validación, diagnóstico de tres casos, quiz, instrumento, informe descargado y caducidad tras modificar/restaurar un control, en los cuatro tamaños.
- 1366×768 DPR1: 48 palabras iniciales, 13 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 48 palabras iniciales, 13 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 48 palabras iniciales, 13 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 390×844 DPR1: 48 palabras iniciales, 13 llamadas de dibujo, normales cero=0, objeto64.8 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs sintonia-servoeje-pd. QA: flujo-taller-187-200.mjs --solo 189. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 189. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.
