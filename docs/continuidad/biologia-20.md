# biologia-20 · Asepsia y contaminación cruzada

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Una estación virtual de pipeteo y trazadores; reconocer transferencias y evaluar controles de contaminación.

Reto: Calcula el trazador que llega al segundo recipiente después de una limpieza entre transferencias.

Modelo: N0=10⁶ unidades de trazador; f=transferencia/100; Nprimero=N0f. Limpieza de L reducciones log10 deja fracción 10^(−L). Arrastre al segundo=N0f²10^(−L).

Límites: Trazador virtual inerte y transferencia fraccional ideal; no microorganismos, esterilización real ni protocolo de bioseguridad. Los valores son didácticos y no certifican una técnica.

Escala: Estación de pipeteo virtual · trazador inerte

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/biologia-20/; src/components/ciencias/definiciones/biologia-20.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 206: 1366px / DPR1. Prosa inicial medida: 59 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:18:14.516Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-20-1366-dpr1-informe.json.

QA 2026-10-28T22:57:45.535Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-20-1600-dpr1-informe.json.


QA 2026-10-29T03:56:28.023Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-20-1366-dpr1-informe.json.





QA 2026-10-29T04:39:42.818Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-20-1600-dpr1-informe.json.





QA 2026-10-29T07:20:41.369Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-20-390-dpr1-informe.json.

QA 2026-10-29T13:44:30.684Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-20-2020-dpr1.25-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 74 palabras como máximo en estos tamaños.

Cambio geométrico: Rack de puntas y detalle del cuerpo de la pipeta.

Componentes semánticos: Pipeta de transferencia; Trazadores de contaminación. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso biologia-20; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 26660 triángulos de geometría. Interacción registrada el 2026-10-29T02:28:24.199Z: 2 componentes, 60 llamadas, 44110 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo74 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La pipeta, sus puntas y la secuencia de recipientes explican el arrastre de material; las partículas son un trazador ilustrativo.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/biologia-20-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
