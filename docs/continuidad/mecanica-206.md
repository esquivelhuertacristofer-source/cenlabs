# mecanica-206 · Calidad eléctrica: armónicos y filtrado

Estado al 25-10-2026: TERMINADO y verificado localmente; publicación pendiente de confirmación.

## Competencia y orden profesional
Dimensiona un filtrado virtual para mejorar una corriente distorsionada sin sobrecargar el filtro ni perder demasiada tensión.

OT-206 · Consigue THD ≤15 %, factor de potencia ≥0,93, corriente del filtro ≤4 A y caída fundamental ≤15 V.

Instrumentos: Analizador trifásico, pinzas, reactor y filtro activo virtuales.

## Modelo y contrato de fidelidad
Red sinusoidal 230 V fase-neutro,60 Hz; I1=20 A eficaces y cosφ=0,95. Órdenes 5,7,11:8,6,3 A antes de atenuación. Modelo de filtro |Hn|=2/√(2²+(nωL)²), compensación activa fraccionaria f. THD=√ΣIh²/I1; FP=cosφ/√(1+THD²). Caída fundamental=ωLI1.

Carga de corriente sintética y filtrado ideal independiente por armónico; fundamental y cosφ impuestos. No resuelve un convertidor conmutado, resonancias de red, estabilidad o cumplimiento normativo. No es una selección de hardware real. Las flechas son indicadores del sentido de corriente en estroboscopio, no movimiento visible real de cargas.

Escala visual y temporal: Red 60 Hz · indicadores eléctricos estroboscópicos×1/60

Fuente del principio: https://ckm-content.se.com/ckmContent/sfc/servlet.shepherd/document/download/0691H00000FWbnlQAD . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/analizador-calidad-energia.html y _ficha-analizador-calidad-energia.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-206/; public/labs-data/briefing/mecanica-206.json; scripts/lab-src/analizador-calidad-energia.json.
- Construir: node scripts/build-lab.mjs analizador-calidad-energia. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 206 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 206.

## Evidencia de cierre local
609 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 56 palabras iniciales, 33 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 56 palabras iniciales, 33 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 56 palabras iniciales, 33 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 56 palabras iniciales, 33 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Tres reactores bobinados, gabinete, terminales conectados y pinzas. Se aumentó la resolución de las hélices de cobre para eliminar el aspecto de zigzag; los indicadores eléctricos están ralentizados y rotulados.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Commit, push, deploy y login real aún pendientes. No declarar publicado por tener sólo un commit.
