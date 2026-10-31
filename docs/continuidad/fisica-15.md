## Ampliación 3D · 29 de octubre de 2026 · EN REVISIÓN LOCAL

La petición del usuario es reforzar las 50 escenas: considera insuficiente el detalle del 3D publicado. Se añaden **Difusores acústicos** y **Conjunto de micrófono**, inspeccionables y desmontables. Autoría específica en `src/components/ciencias/escenas/montajes.ts`; integración en `registro.ts`. El desmontaje separa capas o conjuntos del equipo y se restaura al cerrar el inspector; no modifica parámetros, muestras ni resultados científicos. Las piezas pasivas no tienen un control científico ficticio. Ahora también se puede arrastrar directamente el volumen de la pieza científica seleccionada. El inspector reemplaza temporalmente los ajustes del ensayo.

Comprobación geométrica local: 39252 triángulos, 4 piezas semánticas; sin normales nulas ni valores no finitos (auditor `verifica-piezas-ciencias50.mjs`). TypeScript limpio. La validación visual, el rendimiento en navegador y el recorrido completo de esta nueva ampliación están pendientes; **no se considera terminada ni publicada**. La publicación 297f91f/Cloudflare 3cfad647 pertenece a la versión anterior.

Retomar: ejecutar `montajes-ciencias50.mjs fisica-15` en escritorio/móvil, revisar capturas, corregir oclusiones y pruebas; actualizar la ficha con evidencia real antes del commit/despliegue.






### Evidencia de la ampliación (actualización automática)

Desmontaje/restauración correctos en 2/4 tamaños: 1600 px, 390 px. Recorridos completos vigentes: 0/4. La evidencia previa a esta ampliación no se cuenta como prueba nueva. Máximo observado: 17 llamadas de dibujo; 39256 triángulos. Archivos reproducibles: `scripts/auditoria/.salida/montajes50/` y `ciencias50/`. Falta cerrar revisión visual y publicación de esta versión.


# fisica-15 · Acústica de una sala: absorción y reverberación

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 74 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/fisica-15.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# fisica-15 · Acústica de una sala: absorción y reverberación

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Campo preparado · exploración10 / nativa210

Las capturas iniciales podían mostrar la energía ya extinguida antes de que el alumno observara el pulso. Esta práctica ahora prepara t=0 en pausa, con el campo difuso visible. Emitir pulso inicia el decaimiento, sin crear evidencia; Adquirir registro inicia su adquisición de6s. Reset vuelve a la preparación. Propiedad `previewPaused` en la definición y PilotoCiencia; modelo de Sabine sin cambios. Exploraciónv10/1600 aprobada y captura revisada; completar cuatro recorridos210 antes de publicar.

## Implementación
Un pulso atraviesa una sala con paneles; medir decaimiento y evaluar acondicionamiento.

Reto: Estima el tiempo de reverberación RT60 de la sala y contrástalo con el decaimiento registrado.

Modelo: Sabine: RT60=0,161V/A, V=120 m³, A=148α+8 m² sabin. E/E0=10^(−6t/RT60). Registro: 6 s visuales equivalen a 3 s de decaimiento.

Límites: Campo difuso ideal con absorción media independiente de frecuencia; no modos de sala, transmisión a recintos vecinos ni predicción arquitectónica certificada.

Escala: Sala en corte · decaimiento de energía · tiempo ×1/2

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-15/; src/components/ciencias/definiciones/fisica-15.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 207: 1366px / DPR1. Prosa inicial medida: 58 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:21:37.688Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-1366-dpr1-informe.json.

QA 2026-10-28T23:01:41.452Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-1600-dpr1-informe.json.


QA 2026-10-29T04:01:04.855Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-1366-dpr1-informe.json.





QA 2026-10-29T04:44:29.545Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-1600-dpr1-informe.json.





QA 2026-10-29T06:05:52.134Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-2020-dpr1.25-informe.json.

QA 2026-10-29T07:24:40.849Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-390-dpr1-informe.json.

QA 2026-10-29T13:42:15.194Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-1366-dpr1-informe.json.

QA 2026-10-29T13:43:01.092Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-1600-dpr1-informe.json.

QA 2026-10-29T13:49:11.285Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-2020-dpr1.25-informe.json.

QA 2026-10-29T13:54:34.809Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-15-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión10 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 210: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 74 palabras como máximo en estos tamaños.

Cambio geométrico: Tratamiento acústico, micrófono y campo energético difuso; Emitir pulso reinicia la visualización sin adquirir evidencia.

Componentes semánticos: Sala y tratamiento; Altavoz de ensayo. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-15; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 32008 triángulos de geometría. Interacción registrada el 2026-10-29T13:40:00.502Z: 2 componentes, 13 llamadas, 32012 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo74 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La captura anterior podía mostrar el campo ya extinguido. Se corrigió manteniendo el estado preparado en t=0; Emitir pulso inicia el decaimiento real.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-15-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
