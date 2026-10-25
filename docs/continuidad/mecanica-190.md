# mecanica-190 · Ensayo virtual de aislamiento de motor

Estado al25-10-2026: PUBLICADO y verificado con login real.

## Orden profesional y competencia practicada
OT-190 · Simula450–500 V; lee con error≤5 % antes de25 s y energía≤0,3 J.

Instrumentos: Megóhmetro virtual, devanado en corte y registro de corriente.

Interpreta un ensayo de aislamiento distinguiendo la carga capacitiva de la fuga permanente. La corriente inicial carga la capacidad del devanado. Leer demasiado pronto produce una resistencia aparente baja.

## Archivos exactos
- `public/labs/ensayo-aislamiento-motor.html` y `public/labs/_ficha-ensayo-aislamiento-motor.js`.
- `src/labs/mecanica-190/`: registro, catálogo y briefing.
- Compartidos: `public/labs/_taller-modelos.js` (funciones puras), `_taller-escenas.js` (construcción y actualización), `_taller-definiciones.js` (contratos), `_taller-runtime.js` (UI).
- Auditoría prevista: `scripts/auditoria/verifica-taller-187-200.mjs --solo 190`.

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

QA 1366×768 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1600×900 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 2020×1055 DPR1.25: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 390×844 DPR1: orden, ensayo, validación, quiz, diagnóstico, instrumento e informe correctos; normales cero=0, sin errores ni desbordamiento.

QA 1366×768 DPR1: inicio e inspección correctos; normales cero=0, sin errores ni desbordamiento.

## Cierre local25-10-2026
Modelo numérico en verde:7730 comprobaciones en el lote. Orden, ensayo de duración real de demostración, rechazo antes de ensayar, validación, diagnóstico de tres casos, quiz, instrumento, informe descargado y caducidad tras modificar/restaurar un control, en los cuatro tamaños.
- 1366×768 DPR1: 42 palabras iniciales, 17 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 1600×900 DPR1: 42 palabras iniciales, 17 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 2020×1055 DPR1.25: 42 palabras iniciales, 17 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.
- 390×844 DPR1: 42 palabras iniciales, 17 llamadas de dibujo, normales cero=0, objeto65.0 %, sin errores ni desbordamientos.

Portada propia de la escena y barrido sin red sanos. Revisión inicial y de inspección final a1366; rótulos opcionales de hasta8 piezas, apagados al entrar. Suite completa44/44,3146 pruebas,12 snapshots; TypeScript y ESLint correctos. Goldens:14 altas intencionales y actualización de cuatro descripciones para respetar la calibración desconocida y la escala de espesor.

Autocrítica: la prosa inicial queda muy por debajo de120 palabras; la escena presenta el equipo desde la entrada, con materiales PBR, formas torneadas y fijaciones. Los números y gráficas están en DOM, con ecuaciones e informe en paneles cerrados. Se corrigieron apoyos y referencias, proporciones de elementos y detalles de inspección; el falso color se identifica como tal. Es un banco didáctico con límites explícitos, no un controlador o certificado de un fabricante.

Retomar: _taller-definiciones/modelos/escenas/runtime/instrumentos.js e _inspeccion-mecanismos.js. Construir: node scripts/build-lab.mjs ensayo-aislamiento-motor. QA: flujo-taller-187-200.mjs --solo 190. El flag --reanudar conserva los recorridos acumulados; sin él, usar QA_REPORT para una salida separada. Calibraciones: calibraciones-taller.mjs. Portada: capturar-taller.mjs --solo 190. No ejecutar generadores históricos que sustituyan fuentes mejoradas. Falta confirmar deploy y login antes de declarar publicado.

## Publicación confirmada25-10-2026
Código 0ea5b0c empujado a main. Deploy exit0; versión Cloudflare 8607aed5-43d6-4f2f-9be6-bbf11a425a30. Login real:82 destacadas,16 iframes exactos (177/181 y187–200), portadas HTTP200, normales cero=0 y consola limpia. El encargo hasta200 queda completo. Los commits posteriores que sólo documenten este cierre no cambian el código publicado.
