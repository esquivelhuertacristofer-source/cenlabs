# matematicas-14 · Ajuste de modelos y análisis de residuos

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Datos de un banco de ensayo; elegir un modelo y detectar sesgo, ruido y valores atípicos.

Reto: Ajusta por mínimos cuadrados una recta a los nueve datos y calcula su pendiente.

Modelo: xi=0…8; yi=2+1,7xi+a(xi−4)²+δi7 b. β1=Σ(x−x̄)(y−ȳ)/Σ(x−x̄)²; β0=ȳ−β1x̄. Los datos son sintéticos y están disponibles en el registro.

Límites: Ajuste lineal no ponderado con variables X exactas; la curvatura y el atípico son perturbaciones explícitas. Un buen ajuste numérico no prueba causalidad.

Escala: Banco de ajuste · nube de datos sin recta teórica previa

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/matematicas-14/; src/components/ciencias/definiciones/matematicas-14.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 206: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:02:44.592Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-14-1366-dpr1-informe.json.

QA 2026-10-28T22:30:24.369Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-14-1366-dpr1-informe.json.



QA 2026-10-29T04:12:07.815Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-14-1366-dpr1-informe.json.





QA 2026-10-29T04:55:29.882Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-14-1600-dpr1-informe.json.




QA 2026-10-29T06:30:59.252Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-14-2020-dpr1.25-informe.json.

QA 2026-10-29T07:33:52.137Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-14-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 73 palabras como máximo en estos tamaños.

Cambio geométrico: Probeta con zona calibrada y columnas de máquina de ensayo.

Componentes semánticos: Probeta de ensayo; Extensómetro. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso matematicas-14; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 27552 triángulos de geometría. Interacción registrada el 2026-10-29T02:34:47.686Z: 2 componentes, 44 llamadas, 27556 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo73 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La máquina de ensayo y la probeta dan contexto a los datos; no se dibuja una recta de ajuste que revele el resultado antes de validarlo.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/matematicas-14-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
