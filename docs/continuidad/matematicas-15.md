# matematicas-15 · Control estadístico y capacidad de proceso

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Una línea produce piezas variables; separar estabilidad de proceso y cumplimiento de tolerancias.

Reto: Comprueba estabilidad y calcula Cpk del proceso sintético con límites19,8 y20,2 mm. Un proceso con deriva debe estabilizarse antes de aceptar capacidad.

Modelo: μ=20+descentrado mm. Cp=(USL−LSL)/(6σ). Cpk=min(USL−μ,μ−LSL)/(3σ), USL=20,2 yLSL=19,8 mm. σ es un parámetro poblacional conocido del banco. Media temporal=μ+deriva·(2t/6−1). Se acepta la interpretación de capacidad sólo sin deriva.

Límites: Proceso normal sintético con σ conocida; no estima σ de subgrupos ni sustituye un estudio de estabilidad con series industriales. La señal de deriva es prescrita y se identifica como escenario inestable. Las piezas muestran realizaciones de una distribución, no incertidumbre de medición GUM.

Escala: Población normal sintética · deriva prescrita · capacidad sólo estable

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/matematicas-15/; src/components/ciencias/definiciones/matematicas-15.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6000 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 206: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:03:26.895Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-15-1366-dpr1-informe.json.

QA 2026-10-28T22:31:03.457Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-15-1366-dpr1-informe.json.



QA 2026-10-29T04:12:52.342Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-15-1366-dpr1-informe.json.





QA 2026-10-29T04:56:14.053Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-15-1600-dpr1-informe.json.




QA 2026-10-29T06:32:13.360Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-15-2020-dpr1.25-informe.json.

QA 2026-10-29T13:55:15.789Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-15-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 80 palabras como máximo en estos tamaños.

Cambio geométrico: Accionamiento de rodillos y sensor dimensional.

Componentes semánticos: Pieza de producción; Sensor de medida. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso matematicas-15; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 24160 triángulos de geometría. Interacción registrada el 2026-10-29T02:35:09.316Z: 2 componentes, 35 llamadas, 24164 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo80 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

Rodillos, piezas y sensor identifican una estación dimensional; se distingue estabilidad del proceso de capacidad estadística.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/matematicas-15-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
