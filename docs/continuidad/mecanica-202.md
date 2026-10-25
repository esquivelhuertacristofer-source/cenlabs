# mecanica-202 · Reflectometría TDR de un cable

Estado al 25-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden profesional
Configura un reflectómetro para separar dos discontinuidades próximas y reducir la reflexión del extremo del cable.

OT-202 · Resuelve ≤0,6 m, requiere ≤80 MHz y deja el valor absoluto de la reflexión final ≤0,05.

Instrumentos: Reflectómetro, generador gaussiano, terminador y cable seccionado.

## Modelo y contrato de fidelidad
Cable 18 m, Z0=100 Ω, velocidad 0,66c. Γ=(R−Z0)/(R+Z0). Ecos sintéticos de primer orden en 6 y 7 m. Pulso gaussiano g(t)=exp[−4 ln 2(t/τ)²], τ=FWHM. Ancho de banda a−3 dB=√2 ln 2/(πτ). Resolución espacial del escenario=vτ/2, por la ida y vuelta.

Superposición de ecos débiles sin atenuación distribuida, dispersión, reflexiones múltiples ni conectores reales. La resolución es una anchura espacialFWHM, no especificación de un equipo comercial. El punto luminoso indica el viaje de la onda, no luz real dentro del cable.

Escala visual y temporal: Propagación×1/10000000 · ecos de primer orden · pulso indicativo

Fuente del principio: https://download.tek.com/document/Understanding-Applying-TDR-Primer_48W-74128-0.pdf . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/reflectometria-cable-tdr.html y _ficha-reflectometria-cable-tdr.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-202/; public/labs-data/briefing/mecanica-202.json; scripts/lab-src/reflectometria-cable-tdr.json.
- Construir: node scripts/build-lab.mjs reflectometria-cable-tdr. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 202 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 202.

## Evidencia de cierre local
609 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 53 palabras iniciales, 32 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 53 palabras iniciales, 32 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 53 palabras iniciales, 32 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 53 palabras iniciales, 32 llamadas de dibujo, actor 46.9 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Cable con conductor expuesto, conectores torneados y marcador de propagación. La resolución depende de la anchura de pulso; se comprobó el ancho de banda gaussiano mediante integración independiente.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

Se elevó la cámara móvil después del recorrido completo para que el cable se lea mejor. Revisión inicial y de inspección adicional: actor 65.0 %, sin desbordamiento ni errores; sustituye el encuadre de 46,9 % de la primera captura móvil.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Código a7b219b2e3d58897bde264d6d6482ba96a5ebe0f empujado a main. Deploy exit0; Cloudflare f9d34540-3d08-4ca3-a491-a870303f70c3. Login real:92 destacadas, doce iframes exactos (201–210 y regresión187/200), portadas HTTP200 y consola limpia. Los commits posteriores de documentación no cambian el código publicado.
