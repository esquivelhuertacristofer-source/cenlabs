# mecanica-201 · Ensayo modal con martillo instrumentado

Estado al 25-10-2026: TERMINADO y verificado localmente; publicación pendiente de confirmación.

## Competencia y orden profesional
Ajusta un útil flexible para alejar su resonancia del régimen de servicio y amortiguar el golpe de una herramienta.

OT-201 · Configura frecuencia natural ≤22 Hz, respuesta a 30 Hz ≤0,4 mm, caída de envolvente al 5 % ≤0,6 s y amortiguamiento 0,08–0,20.

Instrumentos: Martillo, acelerómetro, traza de caída y función de respuesta en frecuencia.

## Modelo y contrato de fidelidad
Modelo equivalente de un grado de libertad: m x″+c x′+k x=Jδ(t), k=200 kN/m, J=4 N·s. x=J/(mωd)e^(−ct/2m)sin(ωdt). H(f)=1/(k−mω²+icω). La envolvente cae al 5 % en ln(20)/(c/2m); servicio con fuerza sinusoidal 100 N a 30 Hz.

Impulso ideal y sistema lineal, sin identificación con ruido ni coherencia experimental. La forma de la viga es una deformada estática normalizada, no un modelo modal FEM. Se repite un impacto independiente cada 2 s. Deflexión visual ampliada 30 veces.

Escala visual y temporal: Impactos independientes cada 2 s · deformación×30 · modelo equivalente

Fuente del principio: https://manual.dewesoft.com/x/setupmodule/modules/structural-dynamics/transferfunction . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/ensayo-modal-martillo.html y _ficha-ensayo-modal-martillo.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-201/; public/labs-data/briefing/mecanica-201.json; scripts/lab-src/ensayo-modal-martillo.json.
- Construir: node scripts/build-lab.mjs ensayo-modal-martillo. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 201 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 201.

## Evidencia de cierre local
731 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 61 palabras iniciales, 15 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 61 palabras iniciales, 15 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 61 palabras iniciales, 15 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 61 palabras iniciales, 15 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Viga deformable, martillo guiado, masa torneada, amortiguador y cable de acelerómetro. La deformación se amplía 30 veces y se declara; el modelo es equivalente de un grado de libertad, no FEM.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Commit, push, deploy y login real aún pendientes. No declarar publicado por tener sólo un commit.
