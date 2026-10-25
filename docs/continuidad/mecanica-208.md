# mecanica-208 · Tensión de correa con medidor sónico

Estado al 25-10-2026: TERMINADO y verificado localmente; publicación pendiente de confirmación.

## Competencia y orden profesional
Comprueba la pretensión de una correa por su frecuencia y verifica después la capacidad de transmitir potencia.

OT-208 · Ajusta 45–60 Hz, adherencia suficiente, carga radial ≤1000 N y potencia útil ≥1,8 kW.

Instrumentos: Sensor sónico, poleas, apoyos y comprobación de carga.

## Modelo y contrato de fidelidad
Ramal detenido L=0,45 m y masa lineal 0,15 kg/m: f=(1/2L)√(T/µ). Poleas iguales de 60 mm a 1500 rpm: v=ωr; ΔT=P/v, Tt=T+ΔT/2, Ts=T−ΔT/2. Adherencia: Tt/Ts≤exp(0,3π). Carga radial ideal 2T. Pulso 1 mJ: amplitud A=√(4EL/(π²T)).

Correa plana ideal, sin rigidez a flexión, fuerza centrífuga, deslizamiento dinámico, dientes ni cálculo de vida. Primera etapa: medición detenida; segunda: operación ideal impuesta y comprobación de adherencia. No aplicar la fórmula de ramal detenido como medición en marcha. La amplitud dibujada se amplía 25 veces; el tiempo vibratorio se ralentiza 20 veces.

Escala visual y temporal: Etapas: medición detenida y operación · vibración×1/20 · giro×1/100

Fuente del principio: https://www.gates.com/content/dam/documents-library/operating-manuals/sonic-tension-meter-manual-emea.pdf . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/tension-correa-medidor-sonico.html y _ficha-tension-correa-medidor-sonico.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-208/; public/labs-data/briefing/mecanica-208.json; scripts/lab-src/tension-correa-medidor-sonico.json.
- Construir: node scripts/build-lab.mjs tension-correa-medidor-sonico. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 208 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 208.

## Evidencia de cierre local
607 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 56 palabras iniciales, 13 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 56 palabras iniciales, 13 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 56 palabras iniciales, 13 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 56 palabras iniciales, 13 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Poleas, ramales y captador sónico. Se corrigieron sección, normales y radio de apoyo de la correa. Se distinguen explícitamente medición detenida y comprobación ideal en operación.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Commit, push, deploy y login real aún pendientes. No declarar publicado por tener sólo un commit.
