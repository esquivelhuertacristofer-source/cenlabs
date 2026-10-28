# mecanica-232 · Partículas magnéticas: orientación del campo

Estado al28-10-2026: TERMINADO y verificado localmente; publicación pendiente.

## Competencia y orden
Un eje ferromagnético revela dos discontinuidades patrón cuando el campo corta sus direcciones.

OT-232 · Obtén campo perpendicular ≥2500 A/m para ambas orientaciones, campo combinado ≤10000 A/m y potencia ≤600 W.

Equipo e instrumentos: Banco magnético, solenoide, conductor central y dos discontinuidades patrón.

## Modelo y alcance
Solenoide largo ideal N=200,L=0,4 m: Ha=500Icoil A/m. Conductor central en r=25 mm: Hc=Ibar/(2πr). Dos discontinuidades patrón, axial y circunferencial: indicadores normalizados clamp(Hperp/2500). Campo resultante=√(Ha²+Hc²). Resistencias equivalentes0,4 Ω y0,0006 Ω.

Medio lineal ideal: no calcula histéresis, saturación B(H), profundidad o tamaño de grieta ni una técnica MT certificada. Densidad de partículas como indicador esquemático de excitación transversal, no predicción de fuga magnética ni transporte real de polvo. Líneas helicoidales representan el campo ideal; campo continuo, sin velocidad material del flujo.

Escalas: Campo continuo ideal · partículas indicativas · no certifica MT

Fuente del principio: https://www.twi-global.com/technical-knowledge/faqs/faq-in-magnetic-particle-inspection-how-do-we-ensure-that-defects-of-all-orientations-are-detected . Constantes del escenario y geometrías propias sintéticas; no datos de un equipo comercial.

## Archivos y punto para retomar
- public/labs/particulas-magneticas-orientacion.html y _ficha-particulas-magneticas-orientacion.js.
- Escena: public/labs/_maq-232.js; utilidades _maquinas-piezas.js, que reutilizan _proceso-piezas.js y piezas anteriores.
- _maquinas-modelos.js: funciones puras; _maquinas-definiciones.js: contrato; _maquinas-instrumentos.js: gráficas DOM; _maquinas-runtime.js: orden, ensayo e informe; _maquinas-escenas.js: dispatcher.
- src/labs/mecanica-232/, briefing JSON, portada prac_232.webp y descriptor scripts/lab-src/particulas-magneticas-orientacion.json.
- Construir entrada: node scripts/build-lab.mjs particulas-magneticas-orientacion. No regenerar fuentes históricas sobre escenas refinadas.
- Física: node scripts/auditoria/verifica-maquinas-231-240.mjs --solo 232.
- UI: node scripts/auditoria/flujo-maquinas-231-240.mjs --solo 232 --inspeccion; --reanudar conserva informe.json y QA_REPORT permite otra salida.
- Sincronía y geometría: sincronia-maquinas.mjs; admite --solo 232. Revelado de curvas: protecciones-maquinas.mjs. Portada: scripts/portadas/capturar-maquinas.mjs --solo 232.

## Verificación
806 comprobaciones numéricas en este banco;9513 en la tanda. Valores iniciales rechazados y solución interior aceptada. Flujo por interfaz: orden, preparación, rechazo sin ensayo, adquisición completa, validación manual, quiz barajado, tres diagnósticos, instrumento, informe descargado y caducidad al modificar/restaurar un control.
- 1366×768, DPR1: 38 palabras iniciales; 19 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 1600×900, DPR1: 38 palabras iniciales; 19 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 2020×1055, DPR1.25: 38 palabras iniciales; 19 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.
- 390×844, DPR1: 38 palabras iniciales; 19 llamadas; encuadre 65.0 %; cero normales nulas y sin desbordamiento.

Revisión final a1366×768: 19 llamadas, 20666 triángulos y encuadre 65.0 %. Se revisaron de nuevo los detalles visuales añadidos después del primer recorrido.

Diez comparaciones de sincronía de transformaciones, geometrías y matrices/colores de instancias, diez comprobaciones geométricas específicas y veinte comprobaciones del dibujante de instrumentos para ocultar barridos teóricos antes de validar. Antes de validar se muestran lecturas del ajuste ensayado; las curvas de diseño aparecen tras la aceptación. Portada propia y barrido sin CDN sanos.44 suites,3426 pruebas y12 snapshots; TypeScript,ESLint y generados correctos. Goldens: diez altas intencionales,120 líneas de catálogo y420 de datos; sin alterar entradas anteriores.

## Autocrítica visual y originalidad
Eje con discontinuidades longitudinal y circunferencial, bobina multicapa representada de forma simplificada, contactos y partículas fluorescentes indicativas. El indicador responde a la componente perpendicular, con líneas helicoidales del campo ideal. No es simulación de fuga real ni dimensiona defectos. Se diferencia del194: magnetización y partículas, no impedancia por corrientes inducidas.
Como máximo50 palabras iniciales, datos en DOM y contrato en paneles cerrados. Equipo visible y fenómeno activo desde la entrada; materiales PBR con entorno e iluminación de estudio. No se afirma eficacia educativa medida sin una prueba con docentes y estudiantes.

## Publicación
Código, push, deploy y login real pendientes. Último publicado confirmado:230.
