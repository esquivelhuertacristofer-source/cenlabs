# fisica-13 · Fotoelasticidad: esfuerzos vistos con polarizadores

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Una pieza cargada revela franjas; interpretar el estado óptico asociado a la diferencia de esfuerzos.

Reto: Obtén el esfuerzo tangencial máximo alrededor del agujero en MPa a partir del modelo de Kirsch y el registro óptico.

Modelo: Placa infinita bajo tracción en x: σ∞=F/(wt), w=60 mm, agujero a=8 mm. En el borde σθ=σ∞(1−2cos2θ), máximo3σ∞. Ley fotoelástica: N=Ct(σ1−σ2)/λ, C=7,5·10⁻¹¹ Pa⁻¹, λ de referencia550 nm. Se representa luz blanca mediante tres bandas450/550/650 nm entre polarizadores circulares cruzados.

Límites: Elasticidad lineal, placa infinita y tensión plana. La forma finita es una ventana del campo de Kirsch, no una solución FEM de sus mordazas y bordes. C sintético e independiente de temperatura; color RGB de tres bandas, no colorimetría CIE ni calibración de material comercial. No modela plasticidad o fractura.

Escala: Campo de Kirsch · color fotoelástico RGB aproximado · deformación geométrica no amplificada

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-13/; src/components/ciencias/definiciones/fisica-13.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5000 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 206: 1366px / DPR1. Prosa inicial medida: 67 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:20:15.612Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-13-1366-dpr1-informe.json.

QA 2026-10-28T23:00:03.673Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-13-1600-dpr1-informe.json.


QA 2026-10-29T03:59:17.980Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-13-1366-dpr1-informe.json.





QA 2026-10-29T04:42:34.523Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-13-1600-dpr1-informe.json.





QA 2026-10-29T07:23:09.467Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-13-390-dpr1-informe.json.

QA 2026-10-29T13:58:44.314Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-13-2020-dpr1.25-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 83 palabras como máximo en estos tamaños.

Cambio geométrico: Discos polarizadores con direcciones cruzadas y fijaciones de carga.

Componentes semánticos: Placa con agujero; Espesor de la probeta. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-13; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 23997 triángulos de geometría. Interacción registrada el 2026-10-29T02:29:37.651Z: 2 componentes, 68 llamadas, 47152 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo83 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El disco cromático es visible desde el inicio y las monturas aportan profundidad; el color fotoelástico se declara aproximado.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-13-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
