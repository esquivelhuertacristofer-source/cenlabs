# mecanica-205 · Cortina óptica y parada de una prensa

Estado al 25-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden profesional
Relaciona la distancia de una barrera óptica con el tiempo de parada de una máquina virtual.

OT-205 · Obtén reserva ≥100 mm, ocupación ≤800 mm, deceleración ≤80 rad/s² y respuesta total ≤0,25 s.

Instrumentos: Barrera óptica, registro de respuesta, freno y cuerpo de prueba.

## Modelo y contrato de fidelidad
Banco ideal con inercia 10 kg·m² a 8 rad/s. Par constante: tstop=Jω/Tb. Respuesta electrónica fija 50 ms. Criterio conservador del escenario S=2000 mm/s·(0,05+tstop)+120 mm, sin reducción de la velocidad de aproximación. Reserva=distancia−S. Energía inicial 320 J.

Ejemplo didáctico inspirado en la relaciónS=KT+C; NO aplica una evaluación completa deISO 13855 ni certifica distancias,PL oSIL. Sin acceso por arriba/abajo, rebote, dispersión del tiempo, fallo de sensores o circuito de seguridad real. No usar el informe para instalar una protección.

Escala visual y temporal: Respuesta en tiempo real · criterio didáctico conservador · ciclo de 3 s

Fuente del principio: https://www.sick.com/media/docs/6/46/746/operating_instructions_sense2_safety_light_curtain_en_im0103746.pdf . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/cortina-optica-parada-prensa.html y _ficha-cortina-optica-parada-prensa.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-205/; public/labs-data/briefing/mecanica-205.json; scripts/lab-src/cortina-optica-parada-prensa.json.
- Construir: node scripts/build-lab.mjs cortina-optica-parada-prensa. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 205 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 205.

## Evidencia de cierre local
672 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 54 palabras iniciales, 34 llamadas de dibujo, actor 65.2 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 54 palabras iniciales, 34 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 54 palabras iniciales, 34 llamadas de dibujo, actor 65.1 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 54 palabras iniciales, 34 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Prensa, cortina, elemento que atraviesa el plano y freno. El disparo sigue la intersección y el frenado incluye latencia. El criterio conservador es ficticio y didáctico: no certifica una instalación.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Código a7b219b2e3d58897bde264d6d6482ba96a5ebe0f empujado a main. Deploy exit0; Cloudflare f9d34540-3d08-4ca3-a491-a870303f70c3. Login real:92 destacadas, doce iframes exactos (201–210 y regresión187/200), portadas HTTP200 y consola limpia. Los commits posteriores de documentación no cambian el código publicado.
