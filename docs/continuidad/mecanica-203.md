# mecanica-203 · Montaje robotizado con compensación RCC

Estado al 25-10-2026: TERMINADO y verificado localmente; publicación pendiente de confirmación.

## Competencia y orden profesional
Prepara una inserción robotizada para que la herramienta compense el error lateral sin exigir una fuerza excesiva.

OT-203 · Inserta con residual ≤0,11 mm, fuerza axial ≤60 N, flecha por carga ≤0,1 mm y reserva lateral suficiente.

Instrumentos: Muñeca complaciente, chaflán, sensor de fuerza y útil de inserción.

## Modelo y contrato de fidelidad
Error lateral inicial 0,8 mm y holgura radial 0,1 mm. Corrección requerida 0,7 mm. Chaflán 45° y µ=0,15: fuerza lateral disponible=Fz(1−µ)/(1+µ). Muñeca lineal con rigidez k: corrección=min(0,7 mm,Flat/k). Carga de referencia 3 N: flecha=3/k.

Modelo cuasiestático de corrección lateral, no simula inclinación, torsión, impacto, contacto distribuido ni todas las libertades de un RCC real. El movimiento de aproximación es una trayectoria impuesta; sólo inserta si hay reserva. No es un programa de robot comercial. Holgura, desalineación y chaflán se amplían en la representación; no es un plano de fabricación.

Escala visual y temporal: Ciclo cuasiestático de 4 s · corrección lateral ampliada×100

Fuente del principio: https://www.bl-autotec.co.jp/english/products/wrist-compliancer/ . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/montaje-robotizado-compliance.html y _ficha-montaje-robotizado-compliance.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-203/; public/labs-data/briefing/mecanica-203.json; scripts/lab-src/montaje-robotizado-compliance.json.
- Construir: node scripts/build-lab.mjs montaje-robotizado-compliance. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 203 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 203.

## Evidencia de cierre local
728 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 51 palabras iniciales, 16 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 51 palabras iniciales, 16 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 51 palabras iniciales, 16 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 51 palabras iniciales, 16 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Útil de montaje, compensador y pieza receptora; se conservaron las piezas móviles al fusionar geometrías. Holgura, desalineación y entrada se amplían para explicar el contacto; no es un solucionador de contacto 3D.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Commit, push, deploy y login real aún pendientes. No declarar publicado por tener sólo un commit.
