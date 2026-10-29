# matematicas-20 · Integrales dobles: volumen y centroide de una pieza

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Una pieza irregular se divide en elementos; contrastar aproximaciones y referencia analítica.

Reto: Calcula el centroide X de una placa rectangular con un barreno excéntrico mediante integrales de área y momentos.

Modelo: Placa ideal L=3 m, H=2 m, espesor e=0,12 m y densidad uniforme. Barreno circular de radio r, centro (xh,H/2). A=LH−πr²; V=∬e dA=eA. Mx=∬x dA=LH·L/2−πr²xh; x̄=Mx/A. La referencia X=0 está en el borde izquierdo.

Límites: Placa prismática ideal con un único barreno pasante; se omiten material de biseles, rugosidad y carga de la sujeción. El barreno permanece dentro de los bordes. La retícula es una aproximación de integración y el centroide sólo se revela después de validar.

Escala: Placa perforada CAD · retícula de integración · centroide tras validar

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/matematicas-20/; src/components/ciencias/definiciones/matematicas-20.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
7500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 206: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:06:04.390Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-20-1366-dpr1-informe.json.

QA 2026-10-28T22:33:55.740Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-20-1366-dpr1-informe.json.




QA 2026-10-29T04:16:40.072Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-20-1366-dpr1-informe.json.







QA 2026-10-29T05:25:16.319Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-20-1600-dpr1-informe.json.

QA 2026-10-29T06:40:32.638Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-20-2020-dpr1.25-informe.json.

QA 2026-10-29T07:39:05.157Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: matematicas-20-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 74 palabras como máximo en estos tamaños.

Cambio geométrico: Fijaciones de la placa y referencias del dominio.

Componentes semánticos: Placa perforada; Partición del dominio. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso matematicas-20; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 19276 triángulos de geometría. Interacción registrada el 2026-10-29T02:36:41.894Z: 2 componentes, 18 llamadas, 17344 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo74 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La placa perforada hace visible un dominio asimétrico; los apoyos y referencias aportan escala sin regalar el centroide.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/matematicas-20-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
