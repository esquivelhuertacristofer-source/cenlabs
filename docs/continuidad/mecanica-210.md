# mecanica-210 · Banco de cuadricóptero: mezcla de motores

Estado al 25-10-2026: TERMINADO y verificado localmente; publicación pendiente de confirmación.

## Competencia y orden profesional
Distribuye el empuje entre cuatro motores para sostener una carga y producir guiñada sin saturar ningún actuador.

OT-210 · Obtén 17–20 N, manda al menos 0,08 N·m de guiñada, mantén cada solicitud entre 0,5 y 8 N y potencia≤250 W.

Instrumentos: Cuatro motores, hélices, banco con anillos, matriz de mezcla y fuente.

## Modelo y contrato de fidelidad
Configuración+ con brazos 0,22 m, órdenes fijas de alabeo 0,25 y cabeceo 0,15 N·m. Mezcla lineal por equilibrio de fuerzas y momentos; relación par/empuje 0,018 m. Cada motor aplica saturación 0–8 N. T=1,8e−5ω²; potencia inducida idealT^(3/2)/(√(2ρA)·0,65),ρ=1,225,R=0,12 m. Banco angular J=0,08,c=0,25,k=4 con respuesta a escalón.

Banco sujeto, no vuelo libre ni controlador de un vehículo real. Sin interacción de estelas, viento, retardo eléctrico, batería dinámica, flexión ni datos experimentales de hélice. Los coeficientes son sintéticos; no exporta órdenes de vuelo.

Escala visual y temporal: Banco sujeto · hélices estroboscópicas×1/150 · vectores de empuje

Fuente del principio: https://www.mathworks.com/help/aeroblks/multirotor.html . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/banco-cuadricoptero-mezcla.html y _ficha-banco-cuadricoptero-mezcla.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-210/; public/labs-data/briefing/mecanica-210.json; scripts/lab-src/banco-cuadricoptero-mezcla.json.
- Construir: node scripts/build-lab.mjs banco-cuadricoptero-mezcla. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 210 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 210.

## Evidencia de cierre local
1216 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 55 palabras iniciales, 28 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 55 palabras iniciales, 28 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 55 palabras iniciales, 28 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 55 palabras iniciales, 28 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Cuatro motores con hélices perfiladas, guardas, cableado, banco sujeto y vectores de empuje. El recorte 0–8 N modifica los momentos obtenidos y la respuesta del banco. No es vuelo libre.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Commit, push, deploy y login real aún pendientes. No declarar publicado por tener sólo un commit.
