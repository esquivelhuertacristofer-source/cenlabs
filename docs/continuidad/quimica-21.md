# quimica-21 · Recuperación de metales: precipitación selectiva

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Una mezcla produce sólidos que se separan; evaluar selectividad, recuperación y balance de masa.

Reto: Calcula el porcentaje de cobre recuperado y analiza la co-precipitación de magnesio.

Modelo: Cu²⁺0=Mg²⁺0=0,010 mol/L. Kw=10⁻¹⁴; [OH⁻]=10^(pH−14). KspCu(OH)2=2,2·10⁻²⁰; KspMg(OH)2=5,61·10⁻¹². Concentración residual=min(C0,Ksp/[OH⁻]²); recuperación=(C0−Cres)/C0.

Límites: Equilibrio ideal a 25 °C con actividades aproximadas por concentraciones; pH impuesto, sin complejantes, cinética, cambios de volumen o dependencia de temperatura. Los Ksp son valores docentes.

Escala: Jarra de precipitación virtual · sólidos amplificados

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/quimica-21/; src/components/ciencias/definiciones/quimica-21.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

Geometría pendiente.

Flujos completos guardados: 0. Cada flujo exige ficha, rechazos sin registro y con respuesta errónea, adquisición, resultado, quiz, descarga, calidad e invalidación. Un informe inicial no cuenta como recorrido completo.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:45:46.527Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-21-1366-dpr1-informe.json.




QA 2026-10-29T04:27:39.127Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-21-1366-dpr1-informe.json.







QA 2026-10-29T05:37:10.886Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-21-1600-dpr1-informe.json.

QA 2026-10-29T07:06:41.259Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-21-2020-dpr1.25-informe.json.

QA 2026-10-29T07:49:17.180Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-21-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 76 palabras como máximo en estos tamaños.

Cambio geométrico: Válvula del dosificador y escala sin cifras.

Componentes semánticos: Dosificador de reactivo; Precipitado de cobre. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso quimica-21; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 26684 triángulos de geometría. Interacción registrada el 2026-10-29T02:43:10.367Z: 2 componentes, 30 llamadas, 51982 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo76 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

El dosificador y los sólidos permiten seguir precipitación; su tamaño está ampliado y la curva es un banco sintético.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/quimica-21-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->
