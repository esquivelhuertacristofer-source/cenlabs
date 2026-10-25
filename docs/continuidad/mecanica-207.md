# mecanica-207 · Separación centrífuga: ajuste del proceso

Estado al 25-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden profesional
Ajusta una separadora para que partículas pequeñas alcancen la pared antes de salir con el caudal.

OT-207 · Entrega ≥3 L/min, separa en≤90 % de la residencia, con esfuerzo de aro ≤15 MPa y velocidad periférica ≤35 m/s.

Instrumentos: Tazón en corte, caudalímetro y trayectorias de partículas.

## Modelo y contrato de fidelidad
Stokes centrífugo: dr/dt=Kω²r, K=Δρd²/(18µ), Δρ=1000 kg/m³,d=5 µm,µ=1 mPa·s. Migración entre 20 y 80 mm: ts=ln(4)/(Kω²). Volumen útil 0,5 L, residencia=V/Q. Aro equivalente de acero a 100 mm: σ=ρω²r².

Partículas aisladas a velocidad terminal, sin turbulencia, concentración, paredes, arrastre entre fases ni CFD. El esfuerzo es de un aro ideal, no del tazón real. Las posiciones angulares son estroboscópicas; la migración radial conserva el tiempo del modelo.

Escala visual y temporal: Rotor estroboscópico×1/300 · migración radial real · sin CFD

Fuente del principio: https://hotspin.se/om . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/separacion-centrifuga-proceso.html y _ficha-separacion-centrifuga-proceso.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-207/; public/labs-data/briefing/mecanica-207.json; scripts/lab-src/separacion-centrifuga-proceso.json.
- Construir: node scripts/build-lab.mjs separacion-centrifuga-proceso. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 207 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 207.

## Evidencia de cierre local
607 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 52 palabras iniciales, 50 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 52 palabras iniciales, 50 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 52 palabras iniciales, 50 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 52 palabras iniciales, 50 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Tazón abierto, rotor, líquido y partículas. Se corrigieron pared hueca, disco interior y argumentos fase/arco del corte para que la envolvente no ocultara la migración. El esfuerzo es de un aro equivalente.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Código a7b219b2e3d58897bde264d6d6482ba96a5ebe0f empujado a main. Deploy exit0; Cloudflare f9d34540-3d08-4ca3-a491-a870303f70c3. Login real:92 destacadas, doce iframes exactos (201–210 y regresión187/200), portadas HTTP200 y consola limpia. Los commits posteriores de documentación no cambian el código publicado.
