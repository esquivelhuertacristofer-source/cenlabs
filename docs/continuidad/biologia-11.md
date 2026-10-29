# biologia-11 · Enzimas: velocidad e inhibición

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 75 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/biologia-11.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# biologia-11 · Enzimas: velocidad e inhibición

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Implementación
Sustratos interactúan con sitios activos; interpretar cinética y comparar mecanismos de inhibición.

Reto: Obtén la velocidad inicial en µmol/L/min a partir del producto registrado y relaciona su cambio con la inhibición competitiva.

Modelo: v=Vmax[S]/(Km(1+[I]/Ki)+[S]). Banco sintético: Vmax=80 µmol/L/min,Km=2,4 mmol/L,Ki=2 mmol/L. El sustrato se mantiene constante por un reservorio ideal; producto P(t)=vt, con t en minutos. Se registra6 s=0,1 min.

Límites: Cinética estacionaria de un único sustrato e inhibidor competitivo ideal; sin agotamiento, cooperatividad, inhibición por producto o dinámica molecular. La estructura de apoyo es la lisozima1LYZ; sus coordenadas Cα son experimentales, pero las constantes y el inhibidor del banco son sintéticos y no se atribuyen a la lisozima real. Tránsitos de sustratos y productos son ilustrativos.

Escala: Estructura Cα: PDB 1LYZ · cinética sintética · transporte molecular ilustrativo

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/biologia-11/; src/components/ciencias/definiciones/biologia-11.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
6500 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

1/4 recorridos finales de revisión 206: 1366px / DPR1. Prosa inicial medida: 60 palabras como máximo en estos tamaños. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:10:45.269Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-1366-dpr1-informe.json.

QA 2026-10-28T22:48:56.217Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-1600-dpr1-informe.json.


QA 2026-10-29T03:35:39.385Z: 1366×768 DPR1; geometría inicial; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-1366-dpr1-informe.json.

QA 2026-10-29T03:38:50.890Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-1366-dpr1-informe.json.

QA 2026-10-29T03:47:40.449Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-1366-dpr1-informe.json.




QA 2026-10-29T04:30:55.918Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-1600-dpr1-informe.json.






QA 2026-10-29T05:41:26.354Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-2020-dpr1.25-informe.json.

QA 2026-10-29T07:13:01.864Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: biologia-11-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 206: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 75 palabras como máximo en estos tamaños.

Cambio geométrico: Marcadores esquemáticos de la región catalítica sobre la estructura Cα.

Componentes semánticos: Región catalítica; Inhibidor competitivo. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso biologia-11; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 14560 triángulos de geometría. Interacción registrada el 2026-10-29T02:24:33.294Z: 2 componentes, 17 llamadas, 14564 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo75 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La traza proteica y la región catalítica dan jerarquía al conjunto; la envolvente es esquemática y permite inspeccionar el sitio activo.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/biologia-11-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
