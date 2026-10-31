## Ampliación 3D · 29 de octubre de 2026 · EN REVISIÓN LOCAL

La petición del usuario es reforzar las 50 escenas: considera insuficiente el detalle del 3D publicado. Se añaden **Bastidor del banco de fiabilidad** y **Unidad de accionamiento**, inspeccionables y desmontables. Autoría específica en `src/components/ciencias/escenas/montajes.ts`; integración en `registro.ts`. El desmontaje separa capas o conjuntos del equipo y se restaura al cerrar el inspector; no modifica parámetros, muestras ni resultados científicos. Las piezas pasivas no tienen un control científico ficticio. Ahora también se puede arrastrar directamente el volumen de la pieza científica seleccionada. El inspector reemplaza temporalmente los ajustes del ensayo.

Comprobación geométrica local: 53380 triángulos, 4 piezas semánticas; sin normales nulas ni valores no finitos (auditor `verifica-piezas-ciencias50.mjs`). TypeScript limpio. La validación visual, el rendimiento en navegador y el recorrido completo de esta nueva ampliación están pendientes; **no se considera terminada ni publicada**. La publicación 297f91f/Cloudflare 3cfad647 pertenece a la versión anterior.

Retomar: ejecutar `montajes-ciencias50.mjs matematicas-17` en escritorio/móvil, revisar capturas, corregir oclusiones y pruebas; actualizar la ficha con evidencia real antes del commit/despliegue.






### Evidencia de la ampliación (actualización automática)

Desmontaje/restauración correctos en 2/4 tamaños: 1600 px, 390 px. Recorridos completos vigentes: 0/4. La evidencia previa a esta ampliación no se cuenta como prueba nueva. Máximo observado: 91 llamadas de dibujo; 53384 triángulos. Archivos reproducibles: `scripts/auditoria/.salida/montajes50/` y `ciencias50/`. Falta cerrar revisión visual y publicación de esta versión.


# matematicas-17 · Confiabilidad Weibull y datos censurados

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 70 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/matematicas-17.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# matematicas-17 · Confiabilidad Weibull y datos censurados

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Componentes envejecen en un banco virtual; estimar supervivencia y reconocer observaciones incompletas.

Reto: Calcula la supervivencia al finalizar el ensayo y distingue supervivientes de fallas observadas.

Modelo: R(t)=exp[−(t/η)^β], η=1200 h; h(t)=(β/η)(t/η)^(β−1). Los componentes se ilustran con cuantiles deterministas de la Weibull; los que sobreviven al corte son censurados por la derecha.

Límites: Distribución de banco con parámetros conocidos, sin estimación MLE ni mecanismos competitivos. Censurar no equivale a fallar ni a demostrar vida infinita.

Escala: Banco de vida acelerada virtual · corte de observación

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/matematicas-17/; src/components/ciencias/definiciones/matematicas-17.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 207: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:04:46.828Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-17-1366-dpr1-informe.json.

QA 2026-10-28T22:36:37.895Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-17-1366-dpr1-informe.json.



QA 2026-10-29T04:14:25.043Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-17-1366-dpr1-informe.json.






QA 2026-10-29T04:57:49.741Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-17-1600-dpr1-informe.json.



QA 2026-10-29T06:35:16.897Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-17-2020-dpr1.25-informe.json.

QA 2026-10-29T07:37:13.196Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-17-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión7 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 207: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 70 palabras como máximo en estos tamaños.

Cambio geométrico: Apoyos y tornillos de los24 rotores de prueba.

Componentes semánticos: Rotor en ensayo; Muestra del banco. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso matematicas-17; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 44044 triángulos de geometría. Interacción registrada el 2026-10-29T02:50:12.755Z: 2 componentes, 82 llamadas, 44048 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo70 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

Los24 rotores repiten un banco físico con estados diferenciados; la geometría fusionada reduce llamadas conservando la cinemática.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/matematicas-17-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
