# fisica-17 · Radiación térmica: horno solar y equilibrio energético

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Un concentrador ilumina un receptor; relacionar absorción, emisión y temperatura de equilibrio.

Reto: Obtén la temperatura de equilibrio radiativo de una placa expuesta a irradiancia solar.

Modelo: α=0,85; T0=Tamb=293,15 K, σ=5,670374419·10⁻⁸ W/(m²K⁴). αG=εσ(Teq⁴−Tamb⁴). Transitorio: 5000 dT/dt=αG−εσ(T⁴−Tamb⁴); RK4 Δt=0,5 s, 120 s físicos/s visual.

Límites: Placa isoterma por unidad de área, cielo equivalente al entorno; sólo radiación, sin convección ni viento. No representa un panel fotovoltaico ni un modelo climático.

Escala: Placa radiativa · 1 s visual = 120 s físicos

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-17/; src/components/ciencias/definiciones/fisica-17.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6001 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 207: 1366px / DPR1. Prosa inicial medida: 55 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:22:50.584Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-17-1366-dpr1-informe.json.

QA 2026-10-28T23:03:17.259Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-17-1600-dpr1-informe.json.


QA 2026-10-29T04:02:36.465Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-17-1366-dpr1-informe.json.





QA 2026-10-29T04:45:58.790Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-17-1600-dpr1-informe.json.





QA 2026-10-29T06:09:12.476Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-17-2020-dpr1.25-informe.json.

QA 2026-10-29T07:25:54.088Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-17-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión7 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 207: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 71 palabras como máximo en estos tamaños.

Cambio geométrico: Reflector perfilado, articulaciones y sensor de placa.

Componentes semánticos: Fuente de irradiación; Placa absorbente. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-17; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 9544 triángulos de geometría. Interacción registrada el 2026-10-29T02:49:09.753Z: 2 componentes, 18 llamadas, 9548 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo71 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El reflector y su soporte articulado evitan una lámpara flotante; los trazos representan el aporte radiativo, sin sustituir el balance térmico.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-17-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
