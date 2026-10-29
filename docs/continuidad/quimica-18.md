# quimica-18 · Calorimetría de reacción

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Un recipiente intercambia calor; estimar energía de reacción y separar pérdidas del calor medido.

Reto: Recupera la entalpía molar de la reacción usando el salto térmico y la pérdida declarada.

Modelo: Dos volúmenes iguales V se mezclan, densidad 1 g/mL y cp=4,184 J/(g·K); n=C V/1000 mol. qsol=2V cp ΔT. qreacción=−qsol/(1−f), ΔHm=qreacción/n. El salto final ΔT∞ se estima en el instrumento; la relajación térmica visual es exponencial.

Límites: Reacción sintética completa 1:1, soluciones con propiedades del agua y pérdida fraccional conocida. Capacidad del recipiente despreciada; no se identifica un reactivo comercial.

Escala: Calorímetro aislado en corte · relajación visual del sensor

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/quimica-18/; src/components/ciencias/definiciones/quimica-18.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6501 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

Geometría pendiente.

Flujos completos guardados: 0. Cada flujo exige ficha, rechazos sin registro y con respuesta errónea, adquisición, resultado, quiz, descarga, calidad e invalidación. Un informe inicial no cuenta como recorrido completo.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:43:21.641Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-18-1366-dpr1-informe.json.




QA 2026-10-29T04:25:10.961Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-18-1366-dpr1-informe.json.







QA 2026-10-29T05:34:23.492Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-18-1600-dpr1-informe.json.

QA 2026-10-29T07:01:08.790Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-18-2020-dpr1.25-informe.json.

QA 2026-10-29T07:46:59.756Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-18-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 78 palabras como máximo en estos tamaños.

Cambio geométrico: Cierre del calorímetro y detalle de sonda térmica.

Componentes semánticos: Calorímetro en sección; Sonda térmica. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso quimica-18; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 9260 triángulos de geometría. Interacción registrada el 2026-10-29T02:41:48.827Z: 2 componentes, 33 llamadas, 17582 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo78 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La camisa abierta y la sonda distinguen el calorímetro; la temperatura se muestra en el instrumento y el sensor tiene relajación visual declarada.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/quimica-18-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
