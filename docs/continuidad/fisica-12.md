# fisica-12 · Doble rendija: interferencia y difracción

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Luz y detecciones que forman franjas; relacionar longitud de onda, separación y resolución.

Reto: Obtén la separación entre franjas brillantes centrales en la pantalla situada a 1,50 m.

Modelo: Δy≈λL/d. I/I0=sinc²(πa sinθ/λ) cos²(πd sinθ/λ), a=0,060 mm, θ=atan(y/L). sinc(u)=sin(u)/u.

Límites: Fraunhofer, rendijas idénticas y coherentes; polarización y dispersión espectral no incluidas. Δy usa la aproximación paraxial.

Escala: Patrón de Fraunhofer · coordenada de pantalla en mm

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-12/; src/components/ciencias/definiciones/fisica-12.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 208: 1366px / DPR1. Prosa inicial medida: 57 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:19:27.239Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-1366-dpr1-informe.json.

QA 2026-10-28T22:59:09.046Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-1600-dpr1-informe.json.

QA 2026-10-29T03:05:28.593Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-1600-dpr1-informe.json.

QA 2026-10-29T03:06:49.676Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-390-dpr1-informe.json.


QA 2026-10-29T03:57:51.040Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-1366-dpr1-informe.json.





QA 2026-10-29T04:41:02.948Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-1600-dpr1-informe.json.





QA 2026-10-29T05:58:51.578Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-2020-dpr1.25-informe.json.

QA 2026-10-29T07:21:54.360Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-12-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión8 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 208: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 73 palabras como máximo en estos tamaños.

Cambio geométrico: Rendijas realmente perforadas con ancho y separación coherentes, haces anclados a sus aberturas y paleta espectral por longitud de onda.

Componentes semánticos: Doble rendija; Pantalla de observación. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-12; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 11084 triángulos de geometría. Interacción registrada el 2026-10-29T03:01:47.016Z: 2 componentes, 29 llamadas, 11122 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo73 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

Las rendijas perforadas, las monturas y las franjas luminosas son el foco visual; la paleta espectral es aproximada y el patrón usa Fraunhofer.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-12-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
