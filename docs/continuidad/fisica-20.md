# fisica-20 · Capilaridad y mojabilidad en microcanales

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Meniscos, gotas y frentes de llenado; medir ángulo de contacto y ascenso capilar.

Reto: Determina la altura de ascenso de equilibrio en un tubo capilar con agua.

Modelo: h∞=2γ cosθ/(ρgr), γ=0,0728 N/m, ρ=998 kg/m³, μ=0,001 Pa·s, g=9,80665 m/s². Ascenso viscoso: dh/dt=r²ρg(h∞/h−1)/(8μ). Solución implícita −u−ln(1−u)=t/τ, u=h/h∞, τ=8μh∞/(r²ρg).

Límites: Tubo circular ideal, contacto constante y fluido newtoniano; se omite inercia inicial, evaporación e histéresis. La superficie del menisco es ilustrativa.

Escala: Capilar ampliado · 1 s visual = 0,25 s físicos

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/fisica-20/; src/components/ciencias/definiciones/fisica-20.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
7000 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 207: 1366px / DPR1. Prosa inicial medida: 53 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:25:17.904Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-20-1366-dpr1-informe.json.


QA 2026-10-29T04:05:58.356Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-20-1366-dpr1-informe.json.






QA 2026-10-29T04:49:24.876Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-20-1600-dpr1-informe.json.




QA 2026-10-29T06:15:52.813Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-20-2020-dpr1.25-informe.json.

QA 2026-10-29T07:28:38.057Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: fisica-20-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión7 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 207: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 69 palabras como máximo en estos tamaños.

Cambio geométrico: Menisco con curvatura dependiente del ángulo de contacto y escala sin cifras.

Componentes semánticos: Microcanal; Menisco. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso fisica-20; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 10460 triángulos de geometría. Interacción registrada el 2026-10-29T03:02:12.811Z: 2 componentes, 28 llamadas, 19646 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo69 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El capilar y el menisco curvo se distinguen del depósito; su ampliación geométrica se declara para poder inspeccionar el ángulo de contacto.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/fisica-20-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
