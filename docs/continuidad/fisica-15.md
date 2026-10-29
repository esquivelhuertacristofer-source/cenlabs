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
