# quimica-14 · Corrosión y pasivación de metales

Estado: **publicado y comprobado** el 29 de octubre de 2026, 9:01 a.m. (Ciudad de México). Código 297f91fa54515c4ffb600b7394b4d06f1d0d6e02; Cloudflare 3cfad647-fa74-4034-8409-94cefbeba58a.

## Resultado y evidencia

Exploración de componentes, aislamiento, corte, mando 3D y revisión temporal en el formato nativo con ficha inicial. Modelo, límites, archivos y cambios propios de esta práctica se conservan en el historial inferior.

Cuatro recorridos completos vigentes: 1366×768, 1600×900, 2020×1055 a DPR 1,25 y 390×844. Incluyen adquisición de 6 s, rechazos, cálculo correcto, quiz, descarga, invalidación y controles 3D. Máximo 79 palabras iniciales; sin errores registrados. Catálogo destacado y portada real final.

Batería final: 50 suites/4219 pruebas correctas. Login real: 50 entradas y 4 completados representativos con lectura de vuelta 10/10 (100%). Evidencia portable: [ciencias50-evidencia.json](ciencias50-evidencia.json).

## Retomar

Mantener las simplificaciones declaradas y la incógnita oculta antes de validar. Editar definición en src/components/ciencias/definiciones/quimica-14.ts, modelo puro en src/domain/ciencias y constructor en escenas. Si cambia comportamiento, elevar la revisión afectada en ciencias50-versiones.mjs y repetir sus pruebas; regenerar guías sólo después de verifica-piezas. No ejecutar el documentador histórico que sobreescribe fichas. Publicar desde cen-deploy conservando voces y confirmar login/guardado.

## Historial de implementación y revisión

Los estados locales o pendientes siguientes describen fases anteriores al cierre confirmado de esta cabecera.

<details><summary>Modelo, archivos, autocrítica y pruebas por laboratorio</summary>

<!-- ciencias50-historial -->
# quimica-14 · Corrosión y pasivación de metales

Estado: implementación local en verificación; NO se declara publicado ni terminado.

## Corrección de tolerancia · revisión nativa 209

En E=0,05 V y exposición1h, Faraday da3,4553141169e−6mm. El mínimo absoluto genérico1e−6mm ensanchaba el3% relativo hasta~29%. Esta práctica ahora usa `absoluteTolerance:1e-10`mm; se conserva la tolerancia relativa3%, la ecuación y la geometría. Se añadió al recorrido especializado la referencia independiente, rechazo de+15% y aceptación correcta. Deben repetirse sus cuatro tamaños con revisión209; informes206 son históricos. Sin publicación de este ajuste todavía.

Especializado ejecutado: rechazo de+15% y aceptación de la referenciaFaraday confirmados, sin errores. Las dos suites afectadas pasaron208 pruebas. Informe `scripts/auditoria/.salida/ciencias50-especiales/informe.json`, casoquimica-14. Los cuatro recorridos209 siguen pendientes.

## Implementación
Superficies expuestas cambian con el medio; interpretar curvas y pérdida de material con alcance declarado.

Reto: Calcula la pérdida uniforme de espesor de hierro a partir de la corriente de corrosión registrada.

Modelo: i activo=0,001·10^(E/0,12) mA/cm². Fracción pasiva f=1/[1+exp(−(E−0,36)/0,018)]; i=(1−f)i activo+f·0,02 mA/cm². Fe→Fe²⁺+2e⁻; δ=i t M/(2Fρ), M=55,845 g/mol, ρ=7,87 g/cm³. Convertir mA a A.

Límites: Curva activa-pasiva sintética para enseñanza; no parámetros medidos de un acero real. Corrosión uniforme, rendimiento farádico 100%, sin picaduras, productos adheridos ni certificación de vida.

Escala: Cupón en corte · pérdida amplificada · curva sintética

Formato: MissionBriefing inicial, Piloto/Bitácora React nativos, adquisición de 6 s, validación con registro vigente, quiz oficial y descarga. Cambiar ajustes borra evidencia y aceptación; restaurarlos no recupera el ensayo.

## Archivos
src/labs/quimica-14/; src/components/ciencias/definiciones/quimica-14.ts; src/components/ciencias/escenas/; modelo puro en src/domain/ciencias/. Infraestructura común en PilotoCiencia, EscenaCiencia, BitacoraCiencia y RegistroGrafico.

## Evidencia actual
5000 comprobaciones de dominio/lecturas más referencias analíticas y balances de scripts/auditoria/verifica-ciencias50.mjs. Informe global: 371780 comprobaciones; incluye D2Q9 con momentos de equilibrio y estabilidad de 3000 pasos en Re 10/40/80/120.

0/4 recorridos finales de revisión 206: pendientes. Sin medición final de prosa todavía. Los informes antiguos se conservan como historial y no se cuentan para el cierre actual.

## Retomar
Completar cuatro tamaños (1366×768,1600×900,2020×1055 DPR1,25,390×844), revisión visual escrita contra el estándar, portada propia, regresiones de labs anteriores, Jest/TypeScript/ESLint y generados. Publicar desde cen-deploy con voces, confirmar despliegue y guardado con cuenta real antes de marcar terminado. Sin commit ni despliegue de esta tanda por ahora.

QA 2026-10-28T22:40:17.766Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-14-1366-dpr1-informe.json.




QA 2026-10-29T04:21:35.765Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-14-1366-dpr1-informe.json.







QA 2026-10-29T05:22:13.191Z: 1366×768 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-14-1366-dpr1-informe.json.

QA 2026-10-29T05:30:31.925Z: 1600×900 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-14-1600-dpr1-informe.json.

QA 2026-10-29T06:52:44.095Z: 2020×1055 DPR1.25; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-14-2020-dpr1.25-informe.json.

QA 2026-10-29T07:43:32.333Z: 390×844 DPR1; recorrido nativo completo, quiz y descarga; calidad alterna y extremos de controles sin NaN ni normales nulas. Fuente: quimica-14-390-dpr1-informe.json.

<!-- remodelacion50 -->
## Remodelación global de 3D e interacción ·28-10-2026

Estado: implementación local; exploración1600 de revisión6 correcta. No publicada ni declarada terminada. Los recorridos nativos anteriores a la revisión requerida en ciencias50-versiones.mjs son históricos y no verifican esta remodelación.

4/4 recorridos finales de revisión 209: 1366px / DPR1; 1600px / DPR1; 2020px / DPR1.25; 390px / DPR1. Prosa inicial medida: 79 palabras como máximo en estos tamaños.

Cambio geométrico: Conexiones de la celda y sonda de ensayo.

Componentes semánticos: Probeta metálica; Capa superficial. Los controles manipulables se vinculan al mismo estado del experimento; emisor/detector pasivos se inspeccionan sin mandos ficticios. La selección, aislamiento, corte visual y mando3D están en ExploradorEscena, PanelExploracion y EscenaCiencia. El inspector ocupa el dock nativo y no tapa el lienzo. Revisar movimiento permite pausar, buscar un instante y reproducir a×0,5/×0,25; la adquisición vuelve a×1.

Archivos: src/components/ciencias/escenas/refinamientos.ts, caso quimica-14; etiquetas de componentes en el constructor original; registro en escenas/registro.ts; preservación de componentes en escenas/kit.ts; auditorías verifica-piezas-ciencias50.mjs y exploracion-ciencias50.mjs.

Evidencia estructural:50 escenas/108 componentes en total, sin NaN ni normales nulas y por debajo de400000 triángulos. Esta práctica: 11124 triángulos de geometría. Interacción registrada el 2026-10-29T02:39:31.776Z: 2 componentes, 39 llamadas, 21310 triángulos renderizados, sin errores.

Retomar: completar exploración y recorrido nativo de sus revisiones vigentes en los cuatro tamaños; inspeccionar capturas y corregir debilidades reales; comprobar rendimiento, accesibilidad, reducción de movimiento, dos ensayos y reset; después catálogo/portadas, Jest completo, publicación y login real. Sin commit, push ni despliegue de esta tanda.

<!-- /remodelacion50 -->

<!-- autocritica50 -->
## Autocrítica de la vista inicial

Prosa inicial medida: máximo79 palabras en los cuatro tamaños, por debajo de120. Los datos, ecuaciones e informes quedan en DOM o desplegables; la escena no usa tableros con cifras.

La celda y el cupón en corte muestran pérdida de material amplificada. Se corrigió la tolerancia para mantener el3% también en pérdidas pequeñas.

Se revisaron las capturas iniciales de las50 a1366 y las láminas por área a1600. Materiales de estudio y equipos esquemáticos; la valoración visual no equivale a certificar un instrumento comercial. Referencias de captura: scripts/auditoria/.salida/ciencias50/quimica-14-*-inicial.png. Estado de publicación en la cabecera de esta ficha.

<!-- /autocritica50 -->

<!-- /ciencias50-historial -->

</details>
