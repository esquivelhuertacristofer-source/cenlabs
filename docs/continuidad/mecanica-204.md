# mecanica-204 · CMM: palpador y compensación térmica

Estado al 25-10-2026: PUBLICADO y verificado con login real.

## Competencia y orden profesional
Prepara una medición por coordenadas con dos patrones antes de inspeccionar una pieza de aluminio.

OT-204 · Deja los patrones de 100 y 200 mm dentro de±0,005 mm. La sonda térmica del banco indica 30 °C.

Instrumentos: CMM, bola de rubí, patrones y referencia de temperatura.

## Modelo y contrato de fidelidad
Aluminio del escenario: α=23 µm/(m·K). Lecturas entre centros 106,023 y 206,046 mm. L20=(Lcentros−2Rconfig)/(1+α(Tconfig−20)). Los patrones certificados son 100 y 200 mm a 20 °C; dos longitudes permiten distinguir compensación de radio y expansión.

Contactos exteriores ideales en una dimensión, sin pretravel direccional, flexión, incertidumbre volumétrica ni software de un fabricante. La CMM ilustra el recorrido, no un ensayo normativo completo. Los datos son sintéticos.

Escala visual y temporal: Recorrido ideal de palpado · referencia dimensional a 20 °C

Fuente del principio: https://wap.renishaw.com/cmmsupport/knowledgebase/en/probe-operation--15811 . Parámetros y geometría didácticos propios.

## Archivos y punto para retomar
- public/labs/metrologia-cmm-palpador.html y _ficha-metrologia-cmm-palpador.js.
- public/labs/_servicio-definiciones/modelos/escenas/runtime/instrumentos.js.
- src/labs/mecanica-204/; public/labs-data/briefing/mecanica-204.json; scripts/lab-src/metrologia-cmm-palpador.json.
- Construir: node scripts/build-lab.mjs metrologia-cmm-palpador. No reejecutar generadores históricos sobre las fuentes mejoradas.
- Física: verifica-servicio-201-210.mjs. Flujo: flujo-servicio-201-210.mjs --solo 204 --inspeccion. --reanudar conserva el informe acumulado; QA_REPORT permite una salida separada.
- Portada: capturar-servicio.mjs --solo 204.

## Evidencia de cierre local
738 comprobaciones numéricas para este laboratorio; 7127 en la tanda. Estado inicial rechazado y solución interior aceptada. Orden, preparación, adquisición completa, rechazo sin ensayo, validación, quiz, tres diagnósticos, instrumento, informe descargado y caducidad al modificar y restaurar el ajuste comprobados mediante interfaz.
- 1366×768, DPR 1: 51 palabras iniciales, 17 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 1600×900, DPR 1: 52 palabras iniciales, 17 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 2020×1055, DPR 1.25: 52 palabras iniciales, 17 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.
- 390×844, DPR 1: 52 palabras iniciales, 17 llamadas de dibujo, actor 65.0 %, cero normales nulas y sin desbordamientos.

Revisión inicial y de inspección final a 1366; portada propia; barrido sin red sano. La revisión final incorpora los detalles visuales posteriores al primer recorrido. 44 suites, 3216 pruebas y 12 snapshots correctos; TypeScript, ESLint y generados comprobados. Goldens intencionales: diez altas 201–210 y sus descripciones/briefings finales; ningún laboratorio anterior modificado en los goldens.

## Autocrítica visual y educativa
Pórtico, granito, patrones y palpador de rubí con recorrido de 12 puntos. Se corrigieron altura de palpado, travesías elevadas y seguimiento del eje. Las constantes reales se ocultan hasta validar.
La prosa inicial está por debajo de 120 palabras; el equipo aparece desde el inicio, las ecuaciones están en paneles cerrados y los datos quedan fuera del 3D. La vista de inspección acerca el mecanismo. Se reutiliza el flujo de trabajo, pero no se presenta esta práctica como una reproducción de un instrumento comercial completo. Falta evaluación con estudiantes y comparación experimental para medir el aprendizaje real.

Protección en escritorio y móvil: Modelo/Ficha ocultan la constante antes del ensayo y antes de validar, la revelan después y la ocultan al cambiar el ajuste.

La caducidad del registro se ejecuta en el evento de entrada: incluso cambiar y deshacer dos veces dentro del mismo turno, antes de un fotograma, exige un nuevo ensayo. Dos pruebas adicionales en MCSA comprueban este caso.

## Motor común y publicación
Se impide que el primer fotograma reste tiempo cuando su marca RAF es anterior al arranque. Regresión con primer timestamp 1000 ms anterior en 164, 167, 176, 177, 181, 187, 193 y 200: tiempo no negativo y monótono, geometría sana y sin excepciones.
Código a7b219b2e3d58897bde264d6d6482ba96a5ebe0f empujado a main. Deploy exit0; Cloudflare f9d34540-3d08-4ca3-a491-a870303f70c3. Login real:92 destacadas, doce iframes exactos (201–210 y regresión187/200), portadas HTTP200 y consola limpia. Los commits posteriores de documentación no cambian el código publicado.
