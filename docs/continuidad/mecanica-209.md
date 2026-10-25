# mecanica-209 · Firma eléctrica de un motor bajo carga

Estado al 25-10-2026: TERMINADO y verificado localmente; publicación pendiente de confirmación.

## Competencia y orden profesional
Prepara un registro de corriente que permita distinguir bandas próximas a la fundamental sin sobrecargar el motor.

OT-209 · Resuelve un tercio de la separación, registra señal lateral ≥0,4 A, corriente fundamental ≤11 A y carga ≥50 %.

Instrumentos: Pinza de corriente, banco de carga y analizador FFT.

## Modelo y contrato de fidelidad
Señal sintética a 60 Hz: s=0,005+0,035·carga, I1=10(0,4+0,8·carga) A eficaces. Bandas en(1±2s)60 Hz, amplitud eficaz(0,02+0,06·carga)I1 y tercer armónico 0,1I1. Adquisición 2048 Hz, ventana Hann normalizada,FFT con relleno a potencia de dos. Resolución física 1/T.

Patrón compatible con asimetría del rotor; no constituye diagnóstico definitivo. Otras perturbaciones pueden producir bandas similares. No simula transitorios eléctricos ni daño real. El indicador de la barra se revela sólo después de validar y responder la interpretación.

Escala visual y temporal: Rotor estroboscópico×1/100 · FFT del registro sintético a 2048 Hz

Fuente del principio: https://www.mathworks.com/help/predmaint/ug/broken-rotor-fault-detection-in-ac-induction-motors-using-vibration-and-electrical-signals.html . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/firma-electrica-motor-mcsa.html y _ficha-firma-electrica-motor-mcsa.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-209/; public/labs-data/briefing/mecanica-209.json; scripts/lab-src/firma-electrica-motor-mcsa.json.
- Construir: node scripts/build-lab.mjs firma-electrica-motor-mcsa. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 209 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 209.

## Evidencia de cierre local
610 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 52 palabras iniciales, 36 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 52 palabras iniciales, 36 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 52 palabras iniciales, 36 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 52 palabras iniciales, 36 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Motor seccionado, rotor con barras, bobinas y pinza. La FFT usa ventana Hann y resolución física 1/T; el indicio visual sólo se revela tras ensayo validado e interpretación correcta. No permite concluir una falla definitiva.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

Dos recorridos adicionales comprobaron que validar sin contestar y contestar mal no descubren la barra; la respuesta correcta la revela y cambiar el ajuste restablece la ocultación.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Commit, push, deploy y login real aún pendientes. No declarar publicado por tener sólo un commit.
